import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {createEnquiryHandler} from './enquiry.mjs';
const valid = {name: 'Test Visitor', email: 'visitor@example.com', phone: '', practice: 'General enquiry', message: 'Test enquiry', website: ''};
function setup(options = {}) {
  const sent = [];
  const handler = createEnquiryHandler({
    from: 'sender@example.com', to: 'office@example.com', origin: 'https://example.com', ready: true,
    sendMail: async message => {sent.push(message); return {accepted: ['office@example.com']};},
    ...options
  });
  return {sent, async submit(body = valid, headers = {}) {
    const req = Readable.from([Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))]);
    req.method = 'POST'; req.socket = {remoteAddress: '127.0.0.1'};
    req.headers = {origin: 'https://example.com', 'content-type': 'application/json', ...headers};
    const response = {setHeader() {}, writeHead(status) {this.status = status;}, end(body) {this.body = JSON.parse(body);}};
    await handler(req, response);
    return response;
  }};
}
test('sends to fixed office recipient and uses visitor as reply-to', async () => {
  const s = setup(); const r = await s.submit({...valid, to: 'attacker@example.com'});
  assert.equal(r.status, 200);
  assert.equal(s.sent[0].to, 'office@example.com');
  assert.equal(s.sent[0].replyTo.address, valid.email);
  assert.match(s.sent[0].text, /Test enquiry/);
});
test('rejects invalid email, header injection, empty message, unknown practice and oversized body', async () => {
  for (const change of [{email:'invalid'}, {name:'Name\r\nBcc: bad@example.com'}, {message:' '}, {practice:'Unlisted'}]) {
    const s = setup(); assert.equal((await s.submit({...valid,...change})).status,400); assert.equal(s.sent.length,0);
  }
  assert.equal((await setup().submit('x'.repeat(33_000))).status,413);
});
test('rejects foreign origins, bad content types, bots and malformed JSON', async () => {
  const s = setup();
  assert.equal((await s.submit(valid,{origin:'https://other.com'})).status,403);
  assert.equal((await s.submit(valid,{'content-type':'text/plain'})).status,415);
  assert.equal((await s.submit({...valid,website:'spam'})).status,400);
  assert.equal((await s.submit('{')).status,400);
  assert.equal(s.sent.length,0);
});
test('failure never claims success or exposes provider error', async () => {
  const s = setup({sendMail: async () => {throw new Error('secret provider error');}});
  const r = await s.submit(); assert.equal(r.status,502); assert.equal(r.body.ok,undefined);
  assert.doesNotMatch(JSON.stringify(r.body),/secret provider/);
  assert.equal((await setup({sendMail: async () => ({accepted:[],rejected:['office@example.com']})}).submit()).status,502);
});
test('missing configuration does not send and repeated requests are limited', async () => {
  const unconfigured=setup({ready:false});
  assert.equal((await unconfigured.submit()).status,503); assert.equal(unconfigured.sent.length,0);
  const s=setup();
  for(let i=0;i<5;i++) assert.equal((await s.submit()).status,200);
  assert.equal((await s.submit()).status,429); assert.equal(s.sent.length,5);
});
