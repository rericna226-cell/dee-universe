# Contact form: Cloudflare Pages + Resend

The browser sends the form to `POST /api/contact`. The Cloudflare Pages Function in `functions/api/contact.js` calls Resend from the server, so `RESEND_API_KEY` is never sent to the browser.

## Cloudflare Pages setup

In **Workers & Pages → your project → Settings → Variables and Secrets**, add the following values for **Production** (and Preview if you need it):

| Name | Type | Value |
| --- | --- | --- |
| `RESEND_API_KEY` | Secret / encrypted | Your Resend API key |
| `RESEND_FROM` | Variable | `DEE Universe <contact@dee-universe.com>` |
| `RESEND_TO` | Variable | `info@dee-universe.com` |

`RESEND_FROM` must use a domain verified in Resend. Deploy after adding the variables.

## Local test

1. Copy `.dev.vars.example` to `.dev.vars` and insert a real local-only key.
2. Run `npx wrangler pages dev .`.
3. Open the local site and submit the form.

Do not commit `.dev.vars`. The deployment includes `_routes.json`, so only `/api/*` invokes a Function; static pages stay static. `_redirects` defines `/home`, `/home-es`, `/privacy`, and `/privacy-es` on Cloudflare Pages.

## Production hardening

The endpoint accepts only same-origin JSON requests, validates and limits every field, escapes user input in the email, and uses the sender's email solely as `reply_to`. If the form receives significant spam, enable Cloudflare Turnstile or a WAF rate-limit rule for `/api/contact`.
