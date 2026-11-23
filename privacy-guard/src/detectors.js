/*
 * Privacy Guard — local detectors.
 * Runs entirely in the browser (and in Node for tests). Nothing leaves the device.
 */
(function (root) {
  'use strict';

  // Policy per category: 'off' | 'warn' | 'redact' | 'block'
  //   warn   = flag it, leave text as-is
  //   redact = replace with a placeholder like [EMAIL_1]
  //   block  = replace when redacting, and "Send anyway" is not allowed
  const CATEGORIES = {
    SECRET:         { label: 'Password / API key',  policy: 'block' },
    CARD:           { label: 'Card number',         policy: 'block' },
    IBAN:           { label: 'IBAN',                policy: 'redact' },
    SORT_CODE:      { label: 'Sort code',           policy: 'redact' },
    ACCOUNT_NUMBER: { label: 'Account number',      policy: 'redact' },
    NI_NUMBER:      { label: 'National Insurance no.', policy: 'redact' },
    DOB:            { label: 'Date of birth',       policy: 'redact' },
    EMAIL:          { label: 'Email address',       policy: 'redact' },
    PHONE:          { label: 'Phone number',        policy: 'redact' },
    POSTCODE:       { label: 'Postcode',            policy: 'redact' },
    CUSTOM:         { label: 'Your private terms',  policy: 'redact' },
    AMOUNT:         { label: 'Money amount',        policy: 'warn' },
  };

  // Higher priority wins when two matches overlap.
  const PRIORITY = {
    SECRET: 100, CARD: 90, IBAN: 85, CUSTOM: 80, NI_NUMBER: 70, EMAIL: 65,
    SORT_CODE: 60, ACCOUNT_NUMBER: 55, DOB: 50, PHONE: 40, POSTCODE: 30, AMOUNT: 10,
  };

  const digitsOnly = (s) => s.replace(/\D/g, '');

  function luhnValid(num) {
    const d = digitsOnly(num);
    if (d.length < 13 || d.length > 19) return false;
    let sum = 0;
    let dbl = false;
    for (let i = d.length - 1; i >= 0; i--) {
      let n = d.charCodeAt(i) - 48;
      if (dbl) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      dbl = !dbl;
    }
    return sum % 10 === 0;
  }

  function ibanValid(raw) {
    const s = raw.replace(/\s+/g, '').toUpperCase();
    if (s.length < 15 || s.length > 34) return false;
    const re = s.slice(4) + s.slice(0, 4);
    let rem = 0;
    for (const ch of re) {
      const code = ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch;
      for (const c of code) rem = (rem * 10 + (c.charCodeAt(0) - 48)) % 97;
    }
    return rem === 1;
  }

  // Keyword must appear within `win` chars before the match.
  function hasContext(text, index, re, win = 30) {
    return re.test(text.slice(Math.max(0, index - win), index));
  }

  const RULES = [
    // --- Secrets ---
    { type: 'SECRET', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
    { type: 'SECRET', re: /\b(?:sk|pk|rk)-(?:[A-Za-z]+-)?[A-Za-z0-9_-]{20,}\b/g },
    { type: 'SECRET', re: /\bAKIA[0-9A-Z]{16}\b/g },
    { type: 'SECRET', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{22,}\b/g },
    { type: 'SECRET', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g },
    { type: 'SECRET', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
    // "password: hunter2" -> only the value is captured (group 1)
    { type: 'SECRET', re: /\b(?:password|passwd|pwd|passcode|pin|api[_ -]?key|secret|token)\b\s*(?:is|=|:)\s*["']?([^\s"']{4,})/gi, group: 1 },

    // --- Financial ---
    { type: 'CARD', re: /\b(?:\d[ -]?){12,18}\d\b/g, validate: (m) => luhnValid(m) },
    { type: 'IBAN', re: /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,4})?\b/g, validate: (m) => ibanValid(m) },
    // Sort codes look like dates (12-05-24), so require context.
    { type: 'SORT_CODE', re: /\b\d{2}[- ]\d{2}[- ]\d{2}\b/g,
      validate: (m, text, i) => hasContext(text, i, /sort\s*code|\bs\/c\b/i)
        || /^\s*,?\s*(?:a\/c|acc(?:ount)?(?:\s*(?:no|number))?\.?)?\s*:?\s*\d{8}\b/i.test(text.slice(i + m.length, i + m.length + 30)) },
    { type: 'ACCOUNT_NUMBER', re: /\b\d{8}\b/g,
      validate: (m, text, i) => hasContext(text, i, /\b(?:account|acct?|a\/c)\b/i, 40) },

    // --- Identity ---
    { type: 'NI_NUMBER', re: /\b(?!BG|GB|NK|KN|TN|NT|ZZ)[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z] ?\d{2} ?\d{2} ?\d{2} ?[A-D]\b/gi },
    { type: 'DOB', re: /\b(?:\d{1,2}[\/.-]\d{1,2}[\/.-](?:\d{4}|\d{2})|\d{1,2}(?:st|nd|rd|th)? (?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4})\b/gi,
      validate: (m, text, i) => hasContext(text, i, /\b(?:dob|d\.o\.b|date of birth|born|birthday)\b/i, 25) },
    { type: 'EMAIL', re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
    // UK numbers (+44 / 0...) with 10–11 digits, or any +international number.
    { type: 'PHONE', re: /(?<![\w+])(?:\+44[\s-]?(?:\(0\)[\s-]?)?|0)\d(?:[\s-]?\d){8,9}(?!\d)/g },
    { type: 'PHONE', re: /(?<![\w])\+(?!44)\d{1,3}(?:[\s-]?\d){6,13}(?!\d)/g },
    { type: 'POSTCODE', re: /\b(?:GIR ?0AA|[A-PR-UWYZ][A-HK-Y]?\d[A-Z\d]? ?\d[ABD-HJLNP-UW-Z]{2})\b/gi,
      // Avoid matching lowercase words; postcodes are usually typed uppercase or mixed.
      validate: (m) => /\d/.test(m) && m !== m.toLowerCase() },

    // --- Money ---
    { type: 'AMOUNT', re: /(?:[£$€]\s?\d[\d,]*(?:\.\d{1,2})?(?:\s?(?:k|m|bn|million|thousand)\b)?|\b\d[\d,]*(?:\.\d{1,2})?\s?(?:GBP|USD|EUR|pounds|quid|dollars|euros)\b)/gi },
  ];

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Find sensitive items in text.
   * @param {string} text
   * @param {{policies?: Record<string,string>, customTerms?: string[]}} opts
   * @returns {{type:string, value:string, start:number, end:number, policy:string}[]}
   */
  function detect(text, opts = {}) {
    const policies = opts.policies || {};
    const policyOf = (t) => policies[t] || CATEGORIES[t].policy;
    const found = [];

    const rules = RULES.slice();
    const terms = (opts.customTerms || []).map((t) => t.trim()).filter((t) => t.length >= 2);
    if (terms.length) {
      // Longest first so "Sarah Khan" beats "Sarah".
      terms.sort((a, b) => b.length - a.length);
      rules.push({ type: 'CUSTOM', re: new RegExp('(?<![\\w])(?:' + terms.map(escapeRegex).join('|') + ')(?![\\w])', 'gi') });
    }

    for (const rule of rules) {
      if (policyOf(rule.type) === 'off') continue;
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(text)) !== null) {
        if (m[0].length === 0) { rule.re.lastIndex++; continue; }
        let value = m[0];
        let start = m.index;
        if (rule.group && m[rule.group]) {
          value = m[rule.group];
          start = m.index + m[0].lastIndexOf(value);
        }
        if (rule.validate && !rule.validate(value, text, start)) continue;
        found.push({ type: rule.type, value, start, end: start + value.length, policy: policyOf(rule.type) });
      }
    }

    // Resolve overlaps: higher priority, then longer match, wins.
    found.sort((a, b) => (PRIORITY[b.type] - PRIORITY[a.type]) || ((b.end - b.start) - (a.end - a.start)));
    const kept = [];
    for (const f of found) {
      if (!kept.some((k) => f.start < k.end && k.start < f.end)) kept.push(f);
    }
    return kept.sort((a, b) => a.start - b.start);
  }

  /**
   * Replace findings with consistent placeholders.
   * `vault` (Map value->tag) can be reused across messages so the same person/email
   * keeps the same tag for the whole conversation — this preserves answer quality.
   */
  function redact(text, findings, vault = new Map()) {
    const counters = {};
    for (const tag of vault.values()) {
      const [, type, n] = /^\[([A-Z_]+)_(\d+)\]$/.exec(tag) || [];
      if (type) counters[type] = Math.max(counters[type] || 0, Number(n));
    }
    const toRedact = findings.filter((f) => f.policy === 'redact' || f.policy === 'block');
    let out = text;
    for (const f of toRedact.slice().sort((a, b) => b.start - a.start)) {
      const key = f.type + ':' + f.value.toLowerCase().replace(/\s+/g, '');
      let tag = vault.get(key);
      if (!tag) {
        counters[f.type] = (counters[f.type] || 0) + 1;
        tag = `[${f.type}_${counters[f.type]}]`;
        vault.set(key, tag);
      }
      out = out.slice(0, f.start) + tag + out.slice(f.end);
    }
    return { text: out, vault };
  }

  /** Mask a value for display in the warning dialog (show only the edges). */
  function mask(value) {
    const v = value.trim();
    if (v.length <= 4) return '•'.repeat(v.length);
    const keep = v.length > 10 ? 3 : 1;
    return v.slice(0, keep) + '•'.repeat(Math.min(v.length - keep * 2, 12)) + v.slice(-keep);
  }

  const api = { CATEGORIES, detect, redact, mask, luhnValid, ibanValid };
  root.PrivacyGuard = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
