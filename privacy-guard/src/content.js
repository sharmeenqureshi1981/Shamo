/*
 * Privacy Guard — content script.
 * Intercepts "send" in AI chat sites, scans the message locally, and lets the
 * user redact, cancel, or (if allowed) send anyway. No network calls.
 */
(function () {
  'use strict';
  const PG = globalThis.PrivacyGuard;

  let settings = { enabled: true, policies: {}, customTerms: [] };
  const vault = new Map(); // value -> placeholder, for this tab's conversation
  let bypass = false; // set while we re-trigger send ourselves
  let lastEditor = null;
  let dialogOpen = false;

  // ---------- settings ----------
  function loadSettings() {
    chrome.storage.sync.get({ enabled: true, policies: {}, customTerms: [] }, (s) => { settings = s; });
  }
  loadSettings();
  chrome.storage.onChanged.addListener((_, area) => { if (area === 'sync') loadSettings(); });

  // ---------- editor helpers ----------
  function findEditor(el) {
    if (!el || !(el instanceof Element)) return null;
    if (el.tagName === 'TEXTAREA') return el;
    return el.closest('[contenteditable="true"], [contenteditable=""]');
  }

  function guessEditor() {
    if (lastEditor && lastEditor.isConnected) return lastEditor;
    return document.querySelector('#prompt-textarea, div.ProseMirror[contenteditable="true"], [contenteditable="true"][role="textbox"], textarea');
  }

  function readText(ed) {
    return ed.tagName === 'TEXTAREA' ? ed.value : ed.innerText;
  }

  function writeText(ed, text) {
    ed.focus();
    if (ed.tagName === 'TEXTAREA') {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ed, text);
      ed.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    // Rich editors (ProseMirror, Lexical, Quill): select all, then paste plain text,
    // which they all handle and which keeps line breaks.
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(ed);
    sel.removeAllRanges();
    sel.addRange(range);
    const dt = new DataTransfer();
    dt.setData('text/plain', text);
    const pasted = ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    // If no editor handled the paste, fall back to insertText.
    if (pasted && readText(ed).trim() !== text.trim()) {
      document.execCommand('selectAll', false);
      document.execCommand('insertText', false, text);
    }
  }

  const SEND_SELECTORS = [
    'button[data-testid="send-button"]',
    'button[aria-label="Send message" i]',
    'button[aria-label*="send" i]',
    'button[type="submit"]',
  ];

  function isSendButton(btn) {
    return btn && SEND_SELECTORS.some((s) => btn.matches(s));
  }

  // Walk outward from the editor so we only ever click *its* send button,
  // never one belonging to another input on the page.
  function findSendButton(ed) {
    let scope = ed && ed.parentElement;
    for (let depth = 0; scope && depth < 8; depth++, scope = scope.parentElement) {
      if (scope.querySelectorAll('textarea, [contenteditable="true"]').length > 1) break;
      for (const s of SEND_SELECTORS) {
        const b = scope.querySelector(s);
        if (b && !b.disabled) return b;
      }
    }
    return null;
  }

  function triggerSend(ed) {
    bypass = true;
    setTimeout(() => {
      const btn = findSendButton(ed);
      if (btn) btn.click();
      else ed.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
      setTimeout(() => { bypass = false; }, 300);
    }, 150); // give the site's framework time to register the new text
  }

  // ---------- stats (counts only, never values) ----------
  function recordStats(findings, action) {
    chrome.storage.local.get({ stats: { checks: 0, redacted: 0, sentAnyway: 0, byType: {} } }, ({ stats }) => {
      stats.checks += 1;
      if (action === 'redact') stats.redacted += 1;
      if (action === 'send') stats.sentAnyway += 1;
      for (const f of findings) stats.byType[f.type] = (stats.byType[f.type] || 0) + 1;
      chrome.storage.local.set({ stats });
    });
  }

  // ---------- interception ----------
  function check(ed, event) {
    if (bypass || !settings.enabled || !ed) return;
    if (dialogOpen) { // swallow follow-up events (e.g. click after pointerdown)
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    const text = readText(ed);
    if (!text || !text.trim()) return;
    const findings = PG.detect(text, settings).filter((f) => f.policy !== 'off');
    if (!findings.length) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();
    showDialog(ed, text, findings);
  }

  document.addEventListener('focusin', (e) => {
    const ed = findEditor(e.target);
    if (ed) lastEditor = ed;
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing || e.altKey) return;
    const ed = findEditor(e.target);
    if (ed) check(ed, e);
  }, true);

  // Capture both pointerdown and click: some sites send on pointerdown.
  for (const type of ['pointerdown', 'click']) {
    document.addEventListener(type, (e) => {
      const btn = e.target instanceof Element ? e.target.closest('button') : null;
      if (isSendButton(btn)) check(guessEditor(), e);
    }, true);
  }

  document.addEventListener('submit', (e) => {
    const ed = e.target.querySelector && findEditor(e.target.querySelector('textarea, [contenteditable="true"]'));
    if (ed) check(ed, e);
  }, true);

  // ---------- dialog (shadow DOM so site CSS can't interfere) ----------
  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') n.textContent = v; else n.setAttribute(k, v);
    }
    for (const c of children) n.append(c);
    return n;
  }

  const POLICY_LABEL = { block: 'Blocked', redact: 'Will redact', warn: 'Check' };

  function showDialog(ed, text, findings) {
    dialogOpen = true;
    const host = el('div', { id: 'privacy-guard-host' });
    const shadow = host.attachShadow({ mode: 'open' });
    const hasBlock = findings.some((f) => f.policy === 'block');
    const hasRedactable = findings.some((f) => f.policy === 'redact' || f.policy === 'block');

    shadow.append(el('style', { text: `
      :host { all: initial; }
      .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 2147483647;
        display: flex; align-items: center; justify-content: center; font: 14px/1.45 system-ui, sans-serif; }
      .card { background: #fff; color: #1a1a1a; border-radius: 12px; width: min(460px, calc(100vw - 32px));
        max-height: 80vh; overflow: auto; padding: 20px; box-shadow: 0 10px 40px rgba(0,0,0,.3); }
      h2 { margin: 0 0 4px; font-size: 17px; }
      p { margin: 0 0 12px; color: #555; }
      ul { list-style: none; padding: 0; margin: 0 0 16px; }
      li { display: flex; justify-content: space-between; gap: 12px; padding: 8px 10px; border-radius: 8px;
        background: #f5f5f5; margin-bottom: 6px; }
      code { font-family: ui-monospace, monospace; color: #444; }
      .tag { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 99px; white-space: nowrap; }
      .block { background: #fde2e1; color: #a1251c; }
      .redact { background: #e3ecfd; color: #1d4fb8; }
      .warn { background: #fdf0d5; color: #8a5a00; }
      .actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
      button { font: inherit; border-radius: 8px; padding: 8px 14px; cursor: pointer; border: 1px solid #ccc; background: #fff; color: #1a1a1a; }
      button.primary { background: #1d4fb8; border-color: #1d4fb8; color: #fff; }
      button:disabled { opacity: .45; cursor: not-allowed; }
      @media (prefers-color-scheme: dark) {
        .card { background: #222; color: #eee; } p { color: #aaa; } li { background: #2e2e2e; } code { color: #ccc; }
        button { background: #2e2e2e; color: #eee; border-color: #555; }
      }
    ` }));

    const list = el('ul');
    for (const f of findings) {
      list.append(el('li', {}, [
        el('span', {}, [el('strong', { text: PG.CATEGORIES[f.type].label + ' ' }), el('code', { text: PG.mask(f.value) })]),
        el('span', { class: 'tag ' + f.policy, text: POLICY_LABEL[f.policy] }),
      ]));
    }

    const btnCancel = el('button', { text: 'Edit message' });
    const btnSend = el('button', { text: 'Send anyway' });
    const btnRedact = el('button', { class: 'primary', text: hasRedactable ? 'Redact & send' : 'Send' });
    if (hasBlock) {
      btnSend.disabled = true;
      btnSend.title = 'Disabled: this message contains data that should never be sent.';
    }
    if (!hasRedactable) btnSend.remove(); // only "warn" items: primary button already sends

    const card = el('div', { class: 'card', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'pg-title' }, [
      el('h2', { id: 'pg-title', text: 'Privacy Guard' }),
      el('p', { text: hasBlock
        ? 'This message contains data that should never go to an AI. Redact it or edit your message.'
        : 'This message may contain private data. Redacted items are replaced with placeholders like [EMAIL_1], so the AI can still follow your question.' }),
      list,
      el('div', { class: 'actions' }, [btnCancel, btnSend, btnRedact]),
    ]);
    const backdrop = el('div', { class: 'backdrop' }, [card]);
    shadow.append(backdrop);
    document.documentElement.append(host);
    btnRedact.focus();

    const close = () => { host.remove(); dialogOpen = false; };
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); ed.focus(); } };
    shadow.addEventListener('keydown', onKey);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) { close(); ed.focus(); } });

    btnCancel.addEventListener('click', () => { recordStats(findings, 'cancel'); close(); ed.focus(); });
    btnSend.addEventListener('click', () => {
      if (hasBlock) return;
      recordStats(findings, 'send');
      close();
      triggerSend(ed);
    });
    btnRedact.addEventListener('click', () => {
      if (hasRedactable) {
        const { text: clean } = PG.redact(text, findings, vault);
        writeText(ed, clean);
        recordStats(findings, 'redact');
      } else {
        recordStats(findings, 'send');
      }
      close();
      triggerSend(ed);
    });
  }
})();
