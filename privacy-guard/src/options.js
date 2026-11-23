const { CATEGORIES } = globalThis.PrivacyGuard;
const rules = document.getElementById('rules');
const terms = document.getElementById('terms');
const OPTIONS = ['block', 'redact', 'warn', 'off'];

chrome.storage.sync.get({ policies: {}, customTerms: [] }, ({ policies, customTerms }) => {
  for (const [type, cat] of Object.entries(CATEGORIES)) {
    const tr = document.createElement('tr');
    const name = document.createElement('td');
    name.textContent = cat.label;
    const cell = document.createElement('td');
    const sel = document.createElement('select');
    sel.dataset.type = type;
    for (const o of OPTIONS) {
      const opt = document.createElement('option');
      opt.value = o;
      opt.textContent = o[0].toUpperCase() + o.slice(1) + (o === cat.policy ? ' (default)' : '');
      sel.append(opt);
    }
    sel.value = policies[type] || cat.policy;
    cell.append(sel);
    tr.append(name, cell);
    rules.append(tr);
  }
  terms.value = customTerms.join('\n');
});

document.getElementById('save').addEventListener('click', () => {
  const policies = {};
  for (const sel of rules.querySelectorAll('select')) {
    if (sel.value !== CATEGORIES[sel.dataset.type].policy) policies[sel.dataset.type] = sel.value;
  }
  const customTerms = terms.value.split('\n').map((t) => t.trim()).filter(Boolean);
  chrome.storage.sync.set({ policies, customTerms }, () => {
    const s = document.getElementById('saved');
    s.style.opacity = 1;
    setTimeout(() => { s.style.opacity = 0; }, 1500);
  });
});
