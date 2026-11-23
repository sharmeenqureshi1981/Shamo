# Privacy Guard for AI (prototype)

A browser extension that checks what you type into AI chats **before it's sent**,
and redacts or blocks card numbers, bank details, passwords and personal data.
All detection runs locally in the browser. Nothing is sent anywhere, and only
counts (never values) are stored.

Works on: ChatGPT, Claude, Gemini, Copilot, Perplexity, Mistral, DeepSeek.

## How it works

1. You press Enter or click Send.
2. The message is scanned locally (`src/detectors.js`).
3. If anything is found, a dialog lists it with one of three outcomes:
   - **Blocked** (cards, passwords, API keys): must be redacted. "Send anyway" is disabled.
   - **Will redact** (email, phone, IBAN, sort code, account no., NI no., DOB, postcode, your private terms)
   - **Check** (money amounts): flagged but left in, because the AI often needs them to answer well.
4. **Redact & send** swaps each item for a consistent placeholder (`[EMAIL_1]`, `[IBAN_1]`).
   The same value keeps the same placeholder for the whole conversation, so the AI can still follow it.

Change any rule, or add your own private terms (names, employer, clients, address), under **Settings**.

## Install (developer mode)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this `privacy-guard` folder.

## Tests

```bash
cd privacy-guard && npm test
```

## Known limitations

- **Names aren't detected automatically.** Pattern rules can't tell "Jane" from "June". Add names to
  *Your private terms*. Next step: a small on-device name-recognition model.
- **No re-hydration yet.** The AI's reply shows `[EMAIL_1]` instead of the real value.
- **Site changes can break the send-button detection.** The selectors in `content.js` need upkeep.
- **Pasting files or images isn't checked**, only typed or pasted text.
- Context can still identify you ("the only dentist in my village"). This reduces risk; it doesn't remove it.
