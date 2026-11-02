'use strict';

const crypto = require('crypto');
const http = require('http');
const QRCode = require('qrcode');
const cfg = require('../config');

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const sessions = new Map();
const loginAttempts = new Map();

let _status = { state: 'starting', uptime: 0, startTime: Date.now() };
let _pairing = { stage: 'idle', qr: null, code: null, message: '' };
let _startPairing = null;
let _serverInstance = null;
let _qrGeneration = 0;
let _pairingExpiryTimer = null;
let _pairingStartLock = false;

const PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <title>Bot device pairing</title>
  <style>
    :root{color-scheme:dark;font:16px system-ui,sans-serif;background:#101820;color:#eef4f7}
    body{max-width:560px;margin:6vh auto;padding:24px}
    main{background:#1b2933;border:1px solid #334956;border-radius:16px;padding:24px}
    h1{font-size:1.55rem;margin-top:0}p{line-height:1.5;color:#cad7dd}
    label{display:block;margin:16px 0 6px}
    input,select,button{box-sizing:border-box;width:100%;padding:12px;border-radius:8px;border:1px solid #526976;background:#101820;color:#fff}
    button{margin-top:16px;background:#1f9d70;border:0;font-weight:700;cursor:pointer}
    button:disabled{opacity:.55;cursor:wait}
    #pairing{display:none;margin-top:24px;text-align:center}
    #qr{max-width:100%;background:#fff;padding:12px;border-radius:12px}
    #code{font-size:2rem;letter-spacing:.16em;font-weight:800}
    #message{min-height:1.5em;color:#9be2c4}
    .warning{font-size:.9rem;color:#ffd58b}
  </style>
</head>
<body>
  <main>
    <h1>Link a WhatsApp device</h1>
    <p>Sign in with the pairing admin password configured on your bot service. Never share the QR code or pairing code; they authorize a device link.</p>
    <form id="login">
      <label for="password">Admin password</label>
      <input id="password" type="password" autocomplete="current-password" required>
      <button type="submit">Sign in</button>
    </form>
    <p id="loginMessage" role="status"></p>
    <form id="pairForm" hidden>
      <label for="method">Pairing method</label>
      <select id="method"><option value="code">Phone pairing code</option><option value="qr">QR code</option></select>
      <label for="phone">WhatsApp phone number with country code</label>
      <input id="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="254712345678">
      <button id="pairButton" type="submit">Start pairing</button>
      <button id="logout" type="button">Sign out</button>
    </form>
    <section id="pairing" aria-live="polite">
      <p id="message"></p>
      <img id="qr" alt="WhatsApp device linking QR code" hidden>
      <p id="code" hidden></p>
      <p class="warning">This QR/code is sensitive. Use it only in WhatsApp → Linked devices, and do not send a screenshot to anyone.</p>
    </section>
  </main>
  <script>
    const loginForm=document.querySelector('#login');
    const pairForm=document.querySelector('#pairForm');
    const pairSection=document.querySelector('#pairing');
    const message=document.querySelector('#message');
    const qr=document.querySelector('#qr');
    const code=document.querySelector('#code');
    const pairButton=document.querySelector('#pairButton');
    const loginMessage=document.querySelector('#loginMessage');
    let pollTimer;
    async function api(path,options={}) {
      const response=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})},credentials:'same-origin'});
      const data=await response.json().catch(()=>({error:'Unexpected server response'}));
      if(!response.ok) throw new Error(data.error||'Request failed');
      return data;
    }
    function showPairing(state) {
      pairSection.style.display='block';
      message.textContent=state.message||({
        idle:'Choose a method and start pairing.',
        starting:'Starting WhatsApp pairing…',
        waiting:'Waiting for WhatsApp…',
        qr:'Scan this QR code from WhatsApp → Linked devices.',
        code:'Enter this code in WhatsApp → Linked devices → Link with phone number.',
        connected:'WhatsApp device linked successfully.',
        error:'Pairing failed. Check bot logs and try again.'
      }[state.stage]||'Pairing status updated.');
      qr.hidden=!state.qr;
      qr.removeAttribute('src');
      if(state.qr) qr.src=state.qr;
      code.hidden=!state.code;
      code.textContent=state.code||'';
    }
    async function refresh() {
      try {
        const state=await api('/api/pairing');
        showPairing(state);
        pairButton.disabled=['starting','waiting','qr','code'].includes(state.stage);
        if(state.stage==='connected') clearInterval(pollTimer);
      } catch(error) {
        message.textContent=error.message;
      }
    }
    loginForm.addEventListener('submit',async event=>{
      event.preventDefault();
      const button=loginForm.querySelector('button');
      button.disabled=true;
      try {
        await api('/api/login',{method:'POST',body:JSON.stringify({password:document.querySelector('#password').value})});
        document.querySelector('#password').value='';
        loginForm.hidden=true;
        loginMessage.textContent='';
        pairForm.hidden=false;
        await refresh();
      } catch(error) {
        loginMessage.textContent=error.message;
      } finally {
        button.disabled=false;
      }
    });
    pairForm.addEventListener('submit',async event=>{
      event.preventDefault();
      const method=document.querySelector('#method').value;
      const phone=document.querySelector('#phone').value.replace(/\\D/g,'');
      pairButton.disabled=true;
      try {
        const state=await api('/api/pairing',{method:'POST',body:JSON.stringify({method,phone})});
        showPairing(state);
        clearInterval(pollTimer);
        pollTimer=setInterval(refresh,2000);
      } catch(error) {
        message.textContent=error.message;
        pairButton.disabled=false;
      }
    });
    document.querySelector('#method').addEventListener('change',event=>{
      document.querySelector('#phone').disabled=event.target.value==='qr';
    });
    document.querySelector('#logout').addEventListener('click',async()=>{
      clearInterval(pollTimer);
      await api('/api/logout',{method:'POST',body:'{}'}).catch(()=>{});
      pairForm.hidden=true;
      loginForm.hidden=false;
      pairSection.style.display='none';
      qr.removeAttribute('src');
      code.textContent='';
      document.querySelector('#password').value='';
    });
  </script>
</body>
</html>`;

function setPairingState(update) {
  const generation = ++_qrGeneration;
  const qrPayload = update.qr;
  if (_pairingExpiryTimer) clearTimeout(_pairingExpiryTimer);
  _pairingExpiryTimer = null;
  _pairing = { ..._pairing, ...update, ...(qrPayload ? { qr: null } : {}) };
  if (update.stage === 'code') _pairing.qr = null;
  if (update.stage === 'code' || update.stage === 'qr') {
    const expectedStage = update.stage;
    const timeoutMs = expectedStage === 'code' ? 60_000 : 120_000;
    _pairingExpiryTimer = setTimeout(() => {
      if (_pairing.stage === expectedStage) {
        setPairingState({
          stage: 'error',
          message: expectedStage === 'code' ? 'Pairing code expired. Start a new attempt.' : 'QR code expired. Start a new attempt.'
        });
      }
    }, timeoutMs);
    _pairingExpiryTimer.unref?.();
  }
  if (update.qr) {
    QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'M', width: 320, margin: 2 })
      .then(qr => {
        if (generation === _qrGeneration && _pairing.stage === 'qr') _pairing = { ..._pairing, qr };
      })
      .catch(error => {
        if (generation === _qrGeneration) {
          _pairing = { stage: 'error', qr: null, code: null, message: 'Could not render the WhatsApp QR code.' };
          console.error(`Pairing QR render failed: ${error.message}`);
        }
      });
  } else if (Object.hasOwn(update, 'qr')) {
    _pairing = { ..._pairing, qr: null };
  }
  if (update.stage === 'connected' || update.stage === 'idle' || update.stage === 'error') {
    _pairing = { ..._pairing, qr: null, code: null };
  }
}

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => {
    const index = part.indexOf('=');
    if (index < 0) return ['', ''];
    return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }).filter(([key]) => key));
}

function getSession(req) {
  const token = parseCookies(req.headers.cookie).pairing_session;
  const expiresAt = token && sessions.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return token;
}

function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin || !req.headers.host) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

function isSecureRequest(req) {
  return Boolean(req.socket.encrypted) || req.headers['x-forwarded-proto'] === 'https';
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let tooLarge = false;
    req.on('data', chunk => {
      if (tooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body) > 4096) {
        tooLarge = true;
        body = '';
      }
    });
    req.on('end', () => {
      if (tooLarge) return reject(new Error('Request body too large'));
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function loginIsBlocked(address) {
  const attempts = loginAttempts.get(address);
  if (!attempts) return false;
  if (attempts.resetAt <= Date.now()) {
    loginAttempts.delete(address);
    return false;
  }
  return attempts.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedLogin(address) {
  const now = Date.now();
  const attempts = loginAttempts.get(address);
  if (!attempts || attempts.resetAt <= now) {
    loginAttempts.set(address, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    attempts.count++;
  }
}

async function handleRequest(req, res) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  res.setHeader('Cache-Control', 'no-store');

  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/') && !isSecureRequest(req)) {
    return sendJson(res, 400, { error: 'Use HTTPS for pairing portal requests.' });
  }
  if (req.method === 'GET' && url.pathname === '/health') {
    const up = Math.floor((Date.now() - _status.startTime) / 1000);
    return sendJson(res, 200, {
      bot: cfg.BOT_NAME,
      status: _status.state,
      uptime: `${Math.floor(up / 3600)}h ${Math.floor((up % 3600) / 60)}m`,
      ..._status
    });
  }
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': Buffer.byteLength(PAGE),
      'X-Content-Type-Options': 'nosniff'
    });
    return res.end(PAGE);
  }

  if (req.method === 'POST' && url.pathname === '/api/login') {
    const adminPassword = process.env.PAIRING_ADMIN_PASSWORD;
    if (!adminPassword || adminPassword.length < 20 || adminPassword.length > 256) {
      return sendJson(res, 503, { error: 'Pairing portal is disabled: configure a 20+ character PAIRING_ADMIN_PASSWORD.' });
    }
    if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Request origin rejected.' });
    const address = req.socket.remoteAddress || 'unknown';
    if (loginIsBlocked(address)) return sendJson(res, 429, { error: 'Too many sign-in attempts. Try again later.' });
    let body;
    try {
      body = await readJson(req);
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
    const providedPassword = typeof body.password === 'string' ? body.password : '';
    const expected = Buffer.from(adminPassword);
    const provided = Buffer.from(providedPassword);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(
      crypto.createHash('sha256').update(provided).digest(),
      crypto.createHash('sha256').update(expected).digest()
    )) {
      recordFailedLogin(address);
      return sendJson(res, 401, { error: 'Invalid password.' });
    }
    loginAttempts.delete(address);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_TTL_MS);
    res.setHeader('Set-Cookie', `pairing_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'POST' && url.pathname === '/api/logout') {
    if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Request origin rejected.' });
    const token = getSession(req);
    if (token) sessions.delete(token);
    res.setHeader('Set-Cookie', 'pairing_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');
    return sendJson(res, 200, { ok: true });
  }

  if ((req.method === 'GET' || req.method === 'POST') && url.pathname === '/api/pairing') {
    if (!getSession(req)) return sendJson(res, 401, { error: 'Sign in required.' });
    if (req.method === 'GET') return sendJson(res, 200, _pairing);
    if (!isSameOrigin(req)) return sendJson(res, 403, { error: 'Request origin rejected.' });
    if (typeof _startPairing !== 'function') return sendJson(res, 503, { error: 'Pairing is unavailable.' });
    if (_pairingStartLock || ['starting', 'waiting', 'qr', 'code'].includes(_pairing.stage)) {
      return sendJson(res, 409, { error: 'A pairing attempt is already active.' });
    }
    try {
      _pairingStartLock = true;
      let body;
      try {
        body = await readJson(req);
      } catch (error) {
        return sendJson(res, 400, { error: error.message });
      }
      const method = body.method;
      const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
      if (!['code', 'qr'].includes(method)) return sendJson(res, 400, { error: 'Choose a supported pairing method.' });
      if (method === 'code' && !/^\d{10,15}$/.test(phone)) {
        return sendJson(res, 400, { error: 'Enter a phone number with country code, digits only.' });
      }
      setPairingState({ stage: 'starting', qr: null, code: null, message: '' });
      try {
        await _startPairing({ method, phone });
        return sendJson(res, 202, _pairing);
      } catch (error) {
        setPairingState({ stage: 'error', message: 'Could not start pairing.' });
        console.error(`Could not start web pairing: ${error.message}`);
        return sendJson(res, 500, { error: 'Could not start pairing.' });
      }
    } finally {
      _pairingStartLock = false;
    }
  }

  return sendJson(res, 404, { error: 'Not found.' });
}

async function setupWebServer(options = {}) {
  if (typeof options.startPairing === 'function') _startPairing = options.startPairing;
  if (_serverInstance) return _serverInstance;

  const port = cfg.PORT || process.env.PORT || 3000;
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch(error => {
      console.error(`Web server request failed: ${error.message}`);
      if (!res.headersSent) sendJson(res, 500, { error: 'Internal server error.' });
      else res.destroy();
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '0.0.0.0', () => {
      console.log(`🌐 Web server running on port ${port}`);
      _serverInstance = server;
      resolve();
    });
  });
  return _serverInstance;
}

function updateWebStatus(data) {
  _status = { ..._status, ...data };
}

function getPairingStage() {
  return _pairing.stage;
}

module.exports = { setupWebServer, updateWebStatus, setPairingState, getPairingStage };
