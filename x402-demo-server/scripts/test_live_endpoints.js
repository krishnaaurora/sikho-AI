const https = require('https');

const tests = [
  { method: 'GET', url: 'https://sikho-ai-im1v.onrender.com/' },
  { method: 'GET', url: 'https://sikho-ai-im1v.onrender.com/.well-known/x402' },
  { method: 'GET', url: 'https://sikho-ai-im1v.onrender.com/.well-known/x402.json' },
  { method: 'GET', url: 'https://sikho-ai-im1v.onrender.com/bazaar.json' },
  { method: 'GET', url: 'https://sikho-ai-im1v.onrender.com/agent-card.json' },
  { method: 'GET', url: 'https://sikho-ai-im1v.onrender.com/llms.txt' },
  { method: 'POST', url: 'https://sikho-ai-im1v.onrender.com/api/v1/x402/download-resume' },
  { method: 'POST', url: 'https://sikho-ai-im1v.onrender.com/api/v1/x402/visual-explainer' },
  { method: 'POST', url: 'https://sikho-ai-im1v.onrender.com/api/v1/x402/interview-prep' },
  { method: 'GET', url: 'https://sikho-ai-im1v.onrender.com/api/v1/interview-pro/study-resources' },
  { method: 'GET', url: 'https://sikho-ai-im1v.onrender.com/api/v1/interview-pro/interview-questions' },
  { method: 'POST', url: 'https://sikho-ai-im1v.onrender.com/api/v1/resume/career-fit' },
  { method: 'POST', url: 'https://sikho-ai-im1v.onrender.com/api/v1/resume/unlock' },
  { method: 'GET', url: 'https://sikho-ai-im1v.onrender.com/api/v1/learners/chapters/unlock' },
];

function checkUrl(item) {
  return new Promise((resolve) => {
    const u = new URL(item.url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + (u.search || ''),
      method: item.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          method: item.method,
          url: item.url,
          status: res.statusCode,
          paymentRequiredHeader: res.headers['payment-required'] ? true : false,
          bodySnippet: body.slice(0, 150)
        });
      });
    });
    req.on('error', (e) => {
      resolve({ method: item.method, url: item.url, error: e.message });
    });
    req.end();
  });
}

async function run() {
  for (const t of tests) {
    const res = await checkUrl(t);
    console.log(`${res.method} ${res.url} -> Status: ${res.status || res.error} | PaymentRequiredHeader: ${res.paymentRequiredHeader || false}`);
    if (res.status === 402) {
      console.log(`   Body: ${res.bodySnippet}`);
    } else if (res.status >= 400 && res.status !== 402) {
      console.log(`   Non-402 Body: ${res.bodySnippet}`);
    }
  }
}

run();
