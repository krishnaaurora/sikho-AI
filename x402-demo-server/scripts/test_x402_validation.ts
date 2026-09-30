import axios from "axios";
import { env, ALGORAND_TESTNET_CAIP2, ALGORAND_MAINNET_CAIP2, USDC_TESTNET_ASA_ID, USDC_MAINNET_ASA_ID } from "../config/env";
import { validatePaymentPayload, decodePaymentSignatureHeader } from "../services/payment";

const BASE_URL = process.env.TEST_API_URL || `http://localhost:${env.PORT}`;

interface TestCase {
  name: string;
  method: "GET" | "POST";
  path: string;
  expectedPriceUsd: number;
  expectedAmountMicro: string;
  data?: any;
}

const TEST_SERVICES: TestCase[] = [
  {
    name: "Doubt Solve AI",
    method: "POST",
    path: "/api/v1/ai/doubt-solve",
    expectedPriceUsd: 0.002,
    expectedAmountMicro: "2000",
    data: { question: "What is an Algorand Standard Asset (ASA)?" },
  },
  {
    name: "Code Debug AI",
    method: "POST",
    path: "/api/v1/ai/debug",
    expectedPriceUsd: 0.003,
    expectedAmountMicro: "3000",
    data: { code: "def add(a, b): return a - b", error: "Subtraction instead of addition" },
  },
  {
    name: "Resume Analysis AI",
    method: "POST",
    path: "/api/v1/ai/resume-analysis",
    expectedPriceUsd: 0.004,
    expectedAmountMicro: "4000",
    data: { resumeText: "Senior Software Engineer with TypeScript and Algorand experience." },
  },
  {
    name: "Code Review AI",
    method: "POST",
    path: "/api/v1/ai/code-review",
    expectedPriceUsd: 0.005,
    expectedAmountMicro: "5000",
    data: { code: "function pay() { console.log('paid'); }" },
  },
  {
    name: "Career Roadmap AI",
    method: "POST",
    path: "/api/v1/ai/career-roadmap",
    expectedPriceUsd: 0.005,
    expectedAmountMicro: "5000",
    data: { targetRole: "Blockchain Engineer", currentSkills: "TypeScript, Python" },
  },
  {
    name: "Technical Interview Questions",
    method: "GET",
    path: "/api/v1/interview-pro/interview-questions",
    expectedPriceUsd: 0.15,
    expectedAmountMicro: "150000",
  },
  {
    name: "Learning Path 3-Module Batch",
    method: "GET",
    path: "/api/v1/interview-pro/learning-path",
    expectedPriceUsd: 0.15,
    expectedAmountMicro: "150000",
  },
  {
    name: "Curated Study Resources",
    method: "GET",
    path: "/api/v1/interview-pro/study-resources",
    expectedPriceUsd: 0.15,
    expectedAmountMicro: "150000",
  },
  {
    name: "Visual Concept Explainer",
    method: "POST",
    path: "/api/v1/x402/visual-explainer",
    expectedPriceUsd: 0.30,
    expectedAmountMicro: "300000",
    data: { concept: "Algorand Consensus Mechanism", difficulty: "intermediate" },
  },
  {
    name: "Course Chapter Micro-Unlock",
    method: "GET",
    path: "/api/v1/learners/chapters/unlock",
    expectedPriceUsd: 0.30,
    expectedAmountMicro: "300000",
  },
  {
    name: "GitHub Review Sikho Platform Fee",
    method: "GET",
    path: "/api/v1/services/github-review/sikho-x402",
    expectedPriceUsd: 0.05,
    expectedAmountMicro: "50000",
  },
];

export async function runX402ValidationSuite() {
  console.log("================================================================================");
  console.log("SIKHO AI x402 PROTOCOL & SETTLEMENT VALIDATION SUITE");
  console.log("================================================================================");
  console.log(`Target Host: ${BASE_URL}`);
  console.log(`Active Network: ${env.IS_TESTNET ? "ALGORAND TESTNET" : "ALGORAND MAINNET"}`);
  console.log(`Network Identifier: ${env.X402_NETWORK}`);
  console.log(`USDC Asset ID: ${env.X402_ASSET}`);
  console.log(`Sikho PayTo Address: ${env.X402_PAY_TO}`);
  console.log(`Facilitator URL: ${env.X402_FACILITATOR_URL}\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function report(name: string, ok: boolean, details?: string) {
    totalTests++;
    if (ok) {
      passedTests++;
      console.log(`  ✅ [PASS] ${name}${details ? ` -> ${details}` : ""}`);
    } else {
      failedTests++;
      console.error(`  ❌ [FAIL] ${name}${details ? ` -> ${details}` : ""}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CONFIGURATION CHECKS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("--- 1. ACTIVE CONFIGURATION INTEGRITY CHECKS ---");
  if (env.IS_TESTNET) {
    report("TestNet CAIP-2 Identifier", env.X402_NETWORK === ALGORAND_TESTNET_CAIP2, env.X402_NETWORK);
    report("TestNet USDC ASA ID", env.X402_ASSET === USDC_TESTNET_ASA_ID, env.X402_ASSET);
  } else {
    report("MainNet CAIP-2 Identifier", env.X402_NETWORK === ALGORAND_MAINNET_CAIP2, env.X402_NETWORK);
    report("MainNet USDC ASA ID", env.X402_ASSET === USDC_MAINNET_ASA_ID, env.X402_ASSET);
  }
  report("Facilitator URL configured", env.X402_FACILITATOR_URL === "https://facilitator.goplausible.xyz", env.X402_FACILITATOR_URL);
  report("PayTo Address format valid", /^[A-Z2-7]{58}$/.test(env.X402_PAY_TO), env.X402_PAY_TO);

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. 402 PAYMENT REQUIRED FLOW VERIFICATION (Sections 6, 7, 8, 9)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 2. CORE PAID ENDPOINTS 402 PROTOCOL CHALLENGE VALIDATION ---");

  for (const s of TEST_SERVICES) {
    try {
      const res = await axios({
        method: s.method,
        url: `${BASE_URL}${s.path}`,
        data: s.data,
        validateStatus: () => true, // capture 402
      });

      const is402 = res.status === 402;
      const data = res.data;
      const accept = data?.accepts?.[0];
      const reqHeader = res.headers["payment-required"] || res.headers["PAYMENT-REQUIRED"];

      const matchesNetwork = accept?.network === env.X402_NETWORK;
      const matchesAsset = String(accept?.asset) === String(env.X402_ASSET);
      const matchesPayTo = accept?.payTo === env.X402_PAY_TO;
      const matchesAmount = String(accept?.amount) === s.expectedAmountMicro;
      const hasHeader = typeof reqHeader === "string" && reqHeader.length > 20;

      const allValid = is402 && matchesNetwork && matchesAsset && matchesPayTo && matchesAmount && hasHeader;

      report(
        `${s.name} (${s.path})`,
        allValid,
        `Status ${res.status} | Price $${s.expectedPriceUsd} | Micro: ${accept?.amount} | Asset: ${accept?.asset} | Net: ${accept?.network?.substring(0, 16)}...`
      );
    } catch (err: any) {
      report(`${s.name} (${s.path})`, false, `Network error: ${err.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. PAYMENT ERROR HANDLING VALIDATION (Section 10)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n--- 3. PAYMENT ERROR HANDLING & SECURITY CONTROLS (Section 10) ---");

  // A. Missing Payment: Ensure paid AI does not execute without payment
  try {
    const res = await axios.post(`${BASE_URL}/api/v1/ai/doubt-solve`, {
      question: "Will this execute without payment?"
    }, { validateStatus: () => true });
    report("Missing Payment rejected with HTTP 402", res.status === 402, `Status: ${res.status}`);
  } catch (e: any) {
    report("Missing Payment rejected with HTTP 402", false, e.message);
  }

  // B. Malformed / Invalid Payment Signature: Ensure rejected
  try {
    const res = await axios.post(`${BASE_URL}/api/v1/ai/doubt-solve`, {
      question: "Test question"
    }, {
      headers: { "X-PAYMENT": "not-valid-base64-json" },
      validateStatus: () => true,
    });
    report("Malformed Payment Header rejected (400 or 402)", res.status === 400 || res.status === 402, `Status: ${res.status}`);
  } catch (e: any) {
    report("Malformed Payment Header rejected", false, e.message);
  }

  // C. Bad Scheme in payload
  try {
    const fakePayload = Buffer.from(JSON.stringify({
      x402Version: 2,
      accepted: { scheme: "wrong-scheme", network: env.X402_NETWORK, payTo: env.X402_PAY_TO },
      payload: { paymentGroup: ["AQ=="], paymentIndex: 0 }
    })).toString("base64");

    const res = await axios.post(`${BASE_URL}/api/v1/ai/doubt-solve`, {
      question: "Test question"
    }, {
      headers: { "X-PAYMENT": fakePayload },
      validateStatus: () => true,
    });
    report("Invalid scheme rejected (400 or 402)", res.status === 400 || res.status === 402, `Status: ${res.status}`);
  } catch (e: any) {
    report("Invalid scheme rejected", false, e.message);
  }

  // D. Empty payload validator unit check
  let payloadCheckPassed = false;
  try {
    validatePaymentPayload(null);
  } catch (err: any) {
    payloadCheckPassed = true;
  }
  report("Payload validator rejects empty object", payloadCheckPassed);

  let schemeCheckPassed = false;
  try {
    validatePaymentPayload({
      x402Version: 2,
      accepted: { scheme: "non-exact" },
      payload: {}
    });
  } catch (err: any) {
    schemeCheckPassed = true;
  }
  report("Payload validator rejects non-exact scheme", schemeCheckPassed);

  // E. Base64 Header Decoder
  let decodeSuccess = false;
  try {
    const raw = {
      x402Version: 2,
      accepted: { scheme: "exact", network: env.X402_NETWORK, payTo: env.X402_PAY_TO },
      payload: { paymentGroup: ["dGVzdA=="], paymentIndex: 0 }
    };
    const b64 = Buffer.from(JSON.stringify(raw)).toString("base64");
    const decoded = decodePaymentSignatureHeader(b64);
    decodeSuccess = decoded.x402Version === 2 && decoded.accepted.scheme === "exact";
  } catch (err: any) {
    decodeSuccess = false;
  }
  report("x402 Base64 signature decoder decodes valid payload", decodeSuccess);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  console.log("\n================================================================================");
  console.log(`TOTAL CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log(`STATUS: ${failedTests === 0 ? "PASSED (ALL CHECKS OK)" : "FAILED"}`);
  console.log("================================================================================\n");

  return { totalTests, passedTests, failedTests, passed: failedTests === 0 };
}

if (require.main === module) {
  runX402ValidationSuite().then((r) => {
    process.exit(r.passed ? 0 : 1);
  }).catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}
