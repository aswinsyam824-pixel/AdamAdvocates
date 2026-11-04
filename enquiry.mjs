export const practices = new Set([
  'General enquiry', 'Corporate & Business Law', 'Litigation & Arbitration',
  'Real Estate & Property Law', 'Labour & Employment', 'Regulatory & Compliance'
]);
export const isEmail = value =>
  typeof value === 'string' && value.length <= 254 &&
  /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value);

function reply(res, status, data) {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
  res.end(JSON.stringify(data));
}

// A single-process limiter. Do not trust client-supplied forwarding headers.
// A host with multiple instances must add a shared edge/WAF rate limit.
export function createEnquiryHandler({sendMail, from, to, origin, ready, now = Date.now}) {
  const buckets = new Map();
  let total = {count: 0, end: 0};
  return async (req, res) => {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return reply(res, 405, {error: 'Use the enquiry form to send a message.'});
    }
    if (req.headers.origin !== origin) return reply(res, 403, {error: 'Please submit from this website.'});
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || ''))
      return reply(res, 415, {error: 'Please submit using the enquiry form.'});
    const time = now();
    for (const [key, value] of buckets) if (value.end <= time) buckets.delete(key);
    const key = req.socket.remoteAddress;
    const bucket = buckets.get(key) || {count: 0, end: time + 15 * 60_000};
    if (total.end <= time) total = {count: 0, end: time + 60 * 60_000};
    if (bucket.count >= 5 || total.count >= 100 || buckets.size >= 10_000) {
      res.setHeader('Retry-After', '900');
      return reply(res, 429, {error: 'Too many enquiries. Please try again later or contact us by email.'});
    }
    bucket.count++;
    total.count++;
    buckets.set(key, bucket);
    const chunks = [];
    let size = 0;
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 32_768) return reply(res, 413, {error: 'Your enquiry is too long. Please shorten it.'});
        chunks.push(chunk);
      }
    } catch { return reply(res, 400, {error: 'Unable to read your enquiry.'}); }
    let data;
    try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return reply(res, 400, {error: 'Invalid enquiry format.'}); }
    if (!data || typeof data !== 'object' || Array.isArray(data))
      return reply(res, 400, {error: 'Invalid enquiry format.'});
    if (data.website) return reply(res, 400, {error: 'Unable to accept this enquiry.'});
    const limits = {name: 120, email: 254, phone: 40, practice: 80, message: 5000};
    for (const [field, max] of Object.entries(limits)) {
      if (field === 'phone' && data[field] == null) data[field] = '';
      if (typeof data[field] !== 'string' || data[field].length > max)
        return reply(res, 400, {error: `Please check the ${field} field.`});
      data[field] = data[field].trim();
    }
    if (!data.name || !data.message || !isEmail(data.email) || !practices.has(data.practice) ||
        /[\r\n\x00-\x1f\x7f]/.test(data.name + data.email + data.phone))
      return reply(res, 400, {error: 'Please enter a valid name, email address, practice area and message.'});
    if (!ready) return reply(res, 503, {error: 'Email sending is not available yet. Please email Info@adamadvocates.com.'});
    try {
      const info = await sendMail({
        from: {name: 'Adam Advocates Website', address: from},
        to,
        replyTo: {name: data.name, address: data.email},
        subject: `Website enquiry — ${data.practice}`,
        text: `New website enquiry\n\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone || 'Not provided'}\nPractice area: ${data.practice}\n\n${data.message}`,
        disableFileAccess: true,
        disableUrlAccess: true
      });
      if (!info?.accepted?.length || info.rejected?.length) throw new Error('Recipient not accepted');
      return reply(res, 200, {ok: true});
    } catch {
      // Never return SMTP responses or log the enquiry/password.
      return reply(res, 502, {error: 'We could not confirm delivery. Please try later or email Info@adamadvocates.com.'});
    }
  };
}
