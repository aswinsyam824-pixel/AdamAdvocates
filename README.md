# Adam Advocates — enquiry email setup

The homepage and Contact Us page are included. The enquiry form now sends to a
server endpoint instead of creating a copyable draft. The original navy and gold
design is retained.

## What is ready

- Gmail SMTP delivery with encrypted STARTTLS on port 587.
- Recipient: aswinsyam824@gmail.com.
- Sender: adamfinastrarender@gmail.com. This matches the Gmail login; use another
  address only after configuring it as a verified sender with your provider.
- Replying to an enquiry addresses the visitor's email.
- Sending, success and error states; failures keep the visitor's entered details.
- Server validation, a hidden spam field, origin checks and basic request limits.
- No SMTP password is included. The password previously shared in chat was not used.

## Preview now

Install Node.js 22 or newer. Open a terminal in this folder and run:

```sh
npm ci
npm start
```

Open http://localhost:3000/contact.html. Without SMTP configuration the form
shows an honest unavailable message; it never pretends an email was sent.
Opening the HTML by double-clicking cannot send mail; use the server.

## Enable email when ready to host

1. Revoke the Gmail app password previously shared in chat and create a new one.
2. Use a Node.js host that allows outbound SMTP on port 587. A static-only HTML
   host cannot run this email backend. This package is not a direct ChatGPT Sites
   deployment; that platform needs a separate HTTP email integration.
3. Upload this project, excluding node_modules. Install with `npm ci`, and use
   `npm start` as the start command.
4. Add the settings from `.env.example` to the hosting provider's private
   environment settings. Enter the new SMTP_PASSWORD there, not in public files.
   For local testing only, copy `.env.example` to `.env` and enter it there.
5. Set SITE_ORIGIN to your exact HTTPS website origin, such as
   `https://www.your-domain.com`, with no trailing slash or path.
6. Submit a test enquiry and confirm its receipt in the recipient inbox and that
   Reply addresses the visitor. SMTP acceptance confirms handoff, not inbox arrival.

Keep the server files and `.env` outside the public web directory. This server
serves only `public/`. If using a host's file manager, do not put the complete
project into a publicly served HTML directory.

## Hosting notes

Basic rate limits live in one server process: five attempts per source address
per 15 minutes and 100 total per hour. Forwarded IP headers are intentionally
ignored. Behind a reverse proxy this can group visitors under the proxy address.
Before public launch, configure a host-level per-client rate limit or CAPTCHA;
multiple server instances need a shared limit. Configure HTTPS at the host.

## Saved-file limitations

The browser download did not include `assets/lady-justice.mp4`. The homepage uses
its supplied Lady Justice image as a fallback. Supply the original MP4 to restore
the video. Fonts remain loaded from Google Fonts. No live site has been changed.

## Verification

Run `npm test`. These tests simulate SMTP success/failure and check validation,
fixed recipients, reply-to, missing settings, origin checks and request limits.
No live Gmail message has been sent or delivery verified.

SMTP implementation reference: https://nodemailer.com/smtp

## Entry disclaimer

The starting page is `public/index.html`: a dedicated disclaimer screen.
The homepage is `public/home.html`. On first entry, both the homepage and
Contact Us redirect to the disclaimer. Checking the acceptance box enables
Proceed, which opens the homepage. Escape and backdrop clicks do not dismiss it.
Acceptance is remembered within the current browser tab session. Session storage
must be enabled. This is a browser entry notice, not server-side authentication.

The supplied wording is retained except the firm name is replaced by Adam
Advocates and Legal Consultants Private Limited and the reference URL is replaced
by “this website”. The design uses the rounded split-panel layout reference.
