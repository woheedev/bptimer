import http from 'http';
import https from 'https';
import { createRequire } from 'module';
import { URL } from 'url';

const require = createRequire(import.meta.url);
const AnyProxy = require('anyproxy');

const CONFIG = {
  timeWindowSeconds: 10,
  webProxy: {
    port: 8080
  },
  postProxy: {
    port: 8081,
    targetHost: 'https://db.bptimer.com/api/create-hp-report'
  }
};

class RequestTracker {
  constructor(name, windowSeconds) {
    this.name = name;
    this.windowMs = windowSeconds * 1000;
    this.requests = [];
    this.startTime = null;
    this.timeoutId = null;
    this.highestCount = 0;
    this.highestRate = 0;
  }

  track() {
    const now = Date.now();
    this.requests.push(now);
    this.cleanup();
    if (this.startTime === null) {
      this.startTime = now;
    }
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      console.log(`[${this.name}] Waiting for next request...`);
      this.startTime = null;
      this.requests = [];
      this.timeoutId = null;
    }, this.windowMs);
  }

  cleanup() {
    const cutoff = Date.now() - this.windowMs;
    this.requests = this.requests.filter((time) => time > cutoff);
  }

  getCount() {
    this.cleanup();
    return this.requests.length;
  }

  getRate() {
    return (this.getCount() / (this.windowMs / 1000)).toFixed(2);
  }
}

const webTracker = new RequestTracker('Web', CONFIG.timeWindowSeconds);
const postTracker = new RequestTracker('POST', CONFIG.timeWindowSeconds);

// POST reverse proxy handler
function handleReverseProxy(req, res, targetUrl, tracker) {
  tracker.track();

  const target = new URL(targetUrl);
  const isHttps = target.protocol === 'https:';
  const httpModule = isHttps ? https : http;

  const proxyReq = httpModule.request(
    {
      hostname: target.hostname,
      port: target.port || (isHttps ? 443 : 80),
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: target.host }
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);

      const count = tracker.getCount();
      const rate = tracker.getRate();
      console.log(
        `[${tracker.name}] ${req.method} ${req.url} -> ${proxyRes.statusCode} | Count: ${count} (${rate}/s)`
      );
    }
  );

  proxyReq.on('error', (err) => {
    console.error(`[${tracker.name}] Proxy error:`, err.message);
    res.writeHead(502).end('Bad Gateway');
  });

  req.pipe(proxyReq);
}

function trimUrl(fullUrl, maxLength = 120) {
  try {
    const url = new URL(fullUrl);
    const pathAndQuery = url.pathname + url.search;

    if (pathAndQuery.length <= maxLength) return pathAndQuery;

    const path = url.pathname;
    if (url.search) {
      const params = url.search.substring(1);
      const firstParams = params.split('&').slice(0, 2).join('&');
      const trimmed = `${path}?${firstParams}...`;
      return trimmed.length <= maxLength ? trimmed : path + '?...';
    }

    return path;
  } catch (e) {
    return fullUrl.substring(0, maxLength) + '...';
  }
}

// Web proxy with MITM for HTTPS (captures all HTTP/HTTPS requests)
const webProxyRule = {
  *beforeSendRequest(requestDetail) {
    webTracker.track();
    const count = webTracker.getCount();
    const rate = webTracker.getRate();
    const displayUrl = trimUrl(requestDetail.url);
    console.log(
      `[Web] ${requestDetail.requestOptions.method} ${displayUrl} | Count: ${count} (${rate}/s)`
    );
  },

  *beforeSendResponse(_, responseDetail) {
    console.log(`[Web] Response: ${responseDetail.response.statusCode}`);
  }
};

const webProxy = new AnyProxy.ProxyServer({
  port: CONFIG.webProxy.port,
  rule: webProxyRule,
  forceProxyHttps: true,
  silent: true
});

webProxy.on('ready', () => {
  console.log(`\nWeb Proxy running on http://localhost:${CONFIG.webProxy.port}`);
  console.log(`   Set browser proxy to localhost:${CONFIG.webProxy.port}`);
  console.log(`   CA certificate: C:\\Users\\<user>\\.anyproxy\\certificates\\rootCA.crt`);
  console.log(`   Install CA cert in browser to decrypt HTTPS`);
  console.log(
    `   Tracks HTTP/HTTPS requests + SSE connections per ${CONFIG.timeWindowSeconds}s window\n`
  );
});

webProxy.on('error', (e) => {
  console.error('[Web] Proxy error:', e.message);
});

webProxy.start();

// POST reverse proxy (forwards to configured target)
const postServer = http.createServer((req, res) => {
  handleReverseProxy(req, res, CONFIG.postProxy.targetHost, postTracker);
});

postServer.listen(CONFIG.postProxy.port, () => {
  console.log(`POST Proxy running on http://localhost:${CONFIG.postProxy.port}`);
  console.log(`   Forwards to: ${CONFIG.postProxy.targetHost}`);
  console.log(`   Tracks requests per ${CONFIG.timeWindowSeconds}s window\n`);
});

// Periodic stats summary
setInterval(() => {
  const webCount = webTracker.getCount();
  const postCount = postTracker.getCount();
  const webRate = webTracker.getRate();
  const postRate = postTracker.getRate();

  // Update highest
  if (webCount > webTracker.highestCount) webTracker.highestCount = webCount;
  if (parseFloat(webRate) > webTracker.highestRate) webTracker.highestRate = parseFloat(webRate);
  if (postCount > postTracker.highestCount) postTracker.highestCount = postCount;
  if (parseFloat(postRate) > postTracker.highestRate)
    postTracker.highestRate = parseFloat(postRate);

  console.log(`\nStats (last ${CONFIG.timeWindowSeconds}s):`);
  console.log(
    `   Web:  ${webCount} requests (${webRate}/s) | Highest: ${webTracker.highestCount} requests (${webTracker.highestRate.toFixed(2)}/s)`
  );
  console.log(
    `   POST: ${postCount} requests (${postRate}/s) | Highest: ${postTracker.highestCount} requests (${postTracker.highestRate.toFixed(2)}/s)`
  );
}, CONFIG.timeWindowSeconds * 1000);
