import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createEnquiryHandler, isEmail} from './enquiry.mjs';

const env = process.env;
const port = Number(env.PORT || 3000);
const origin = env.SITE_ORIGIN || `http://localhost:${port}`;
if (new URL(origin).origin !== origin) throw new Error('SITE_ORIGIN must be an exact origin without a trailing slash.');
const from = env.MAIL_FROM || env.SMTP_USER;
const to = env.MAIL_TO;
const smtpPort = Number(env.SMTP_PORT || 587);
const ready = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && isEmail(from) && isEmail(to));
let transport;
if (ready) {
  const {default: nodemailer} = await import('nodemailer');
  transport = nodemailer.createTransport({
    host: env.SMTP_HOST, port: smtpPort, secure: smtpPort === 465,
    requireTLS: true, tls: {minVersion: 'TLSv1.2'},
    auth: {user: env.SMTP_USER, pass: env.SMTP_PASSWORD},
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
    disableFileAccess: true, disableUrlAccess: true
  });
}
const enquiry = createEnquiryHandler({from, to, origin, ready, sendMail: message => transport.sendMail(message)});
const root = path.resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const types = {'.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4'};
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  try {
    let url = decodeURIComponent(new URL(req.url, origin).pathname);
    if (url === '/api/enquiry') return await enquiry(req, res);
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    if (url === '/') url = '/index.html';
    if (url === '/contact') url = '/contact.html';
    if (url.split('/').some(segment => segment.startsWith('.'))) { res.writeHead(404); return res.end(); }
    const filename = path.resolve(root, '.' + url);
    if (!filename.startsWith(root + path.sep) && filename !== root) { res.writeHead(404); return res.end(); }
    // Only public/ can be served; server configuration and secrets are outside it.
    const data = await readFile(filename);
    res.writeHead(200, {'Content-Type': types[path.extname(filename)] || 'application/octet-stream'});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    if (!res.headersSent) res.writeHead(404);
    res.end('Not found');
  }
});
server.requestTimeout = 30_000;
server.headersTimeout = 10_000;
server.listen(port, env.HOST || '0.0.0.0', () => {
  console.log(`Website: http://localhost:${port}`);
  console.log(ready ? 'SMTP configured. Delivery is checked when a message is submitted.' : 'Preview mode: configure SMTP secrets to enable email sending.');
});
