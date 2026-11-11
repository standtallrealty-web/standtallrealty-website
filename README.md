# Stand Tall Realty — standtallrealty.com

Property website for Stand Tall Realty, Pune: listings that go live after admin approval, enquiry forms with SMS OTP, buyer and owner chat, and an admin panel. Data lives in the owner's Google Sheet.

## What is where

| Path | What it is |
| --- | --- |
| `site/` | The website. Cloudflare Pages serves this folder as is. |
| `backend/Code.gs` | Google Apps Script backend. It is pasted into the owner's Apps Script project and does not run from this repository. |
| `tools/build.py` | Regenerates the HTML pages and the preview-mode bundle (`site/assets/js/demo-backend.js`). |
| `tools/package.py`, `tools/make_guide.py` | Build the owner's ZIP and the Hindi setup guide (PDF). |
| `tests/` | Backend tests (Node) and browser tests (Playwright). |

## Cloudflare Pages settings

Framework preset **None**, build command **empty**, build output directory **`site`**. Every push to `main` deploys the site.

## Secrets

Passwords and SMS keys never go in this repository. The owner types them in the settings at the top of Code.gs inside Apps Script. The backend remembers them (Script Properties), so a newer Code.gs with empty quotes keeps using them.

## Making a change

1. Edit the page templates in `tools/build.py`, or the files in `site/assets/`.
2. Run `python3 tools/build.py`.
3. Run `node tests/backend.test.js`, `node tests/otp.test.js` and `python3 tests/e2e.py`.
4. Commit and push to `main`. Cloudflare Pages deploys it within a couple of minutes.
5. If `backend/Code.gs` changed, the owner pastes it into Apps Script and deploys a new version (Deploy → Manage deployments → Edit → New version).
