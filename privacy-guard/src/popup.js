const enabled = document.getElementById('enabled');

chrome.storage.sync.get({ enabled: true }, (s) => { enabled.checked = s.enabled; });
enabled.addEventListener('change', () => chrome.storage.sync.set({ enabled: enabled.checked }));

chrome.storage.local.get({ stats: { checks: 0, redacted: 0, sentAnyway: 0 } }, ({ stats }) => {
  for (const k of ['checks', 'redacted', 'sentAnyway']) document.getElementById(k).textContent = stats[k] || 0;
});

document.getElementById('options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
