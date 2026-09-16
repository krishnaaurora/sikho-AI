import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.TARGET_API_URL || "https://sikho-ai.onrender.com";

interface EndpointTarget {
  name: string;
  method: "GET" | "POST";
  path: string;
  body?: any;
  query?: Record<string, string>;
  priceUsd: number;
}

const ENDPOINTS: EndpointTarget[] = [
  {
    name: "AI Visual Concept Explainer",
    method: "POST",
    path: "/api/v1/x402/visual-explainer",
    body: { concept: "Distributed Load Balancing", difficulty: "intermediate" },
    priceUsd: 0.06,
  },
  {
    name: "Adaptive Technical Interview Preparation",
    method: "POST",
    path: "/api/v1/x402/interview-prep",
    body: { topic: "Data Structures & Algorithms", action: "start" },
    priceUsd: 0.06,
  },
  {
    name: "AI Auto-Fixed ATS Resume PDF Download",
    method: "POST",
    path: "/api/v1/x402/download-resume",
    body: { resumeId: "65cb765f0123456789abcdef", format: "pdf" },
    priceUsd: 0.03,
  },
  {
    name: "Technical Interview Questions AI Pass",
    method: "GET",
    path: "/api/v1/interview-pro/interview-questions",
    priceUsd: 0.06,
  },
  {
    name: "Learning Path 3-Module Batch Unlock",
    method: "GET",
    path: "/api/v1/interview-pro/learning-path",
    priceUsd: 0.09,
  },
  {
    name: "Curated Study Resources Pass",
    method: "GET",
    path: "/api/v1/interview-pro/study-resources",
    priceUsd: 0.06,
  },
  {
    name: "ATS Resume Quality Audit Pass",
    method: "POST",
    path: "/api/v1/resume/quality",
    body: { resumeId: "65cb765f0123456789abcdef" },
    priceUsd: 0.06,
  },
  {
    name: "Target Career Job Discovery",
    method: "POST",
    path: "/api/v1/resume/find-jobs",
    body: { resumeId: "65cb765f0123456789abcdef", targetRole: "Machine Learning Engineer" },
    priceUsd: 0.06,
  },
  {
    name: "Course Chapter Micro-Unlock",
    method: "GET",
    path: "/api/v1/learners/chapters/unlock",
    priceUsd: 0.019,
  }
];

async function probeEndpoint(target: EndpointTarget) {
  const url = `${BASE_URL}${target.path}`;
  console.log(`\n------------------------------------------------------------`);
  console.log(`📡 Probing [${target.method}] ${target.name} (${url})`);
  
  try {
    const res = await axios({
      method: target.method,
      url,
      data: target.body,
      params: target.query,
      validateStatus: () => true, // Don't throw on 402
    });

    console.log(`Status: HTTP ${res.status}`);
    const paymentRequiredHeader = res.headers["payment-required"] || res.headers["PAYMENT-REQUIRED"];
    
    if (res.status === 402) {
      console.log(`✅ 402 Payment Challenge received correctly.`);
      if (paymentRequiredHeader) {
        console.log(`Header PAYMENT-REQUIRED: Present (${paymentRequiredHeader.substring(0, 40)}...)`);
      }
      if (res.data && res.data.accepts) {
        console.log(`Price: $${res.data.accepts[0]?.amount} ${res.data.accepts[0]?.unit || 'USDC'}`);
        console.log(`Payee: ${res.data.accepts[0]?.payee}`);
        console.log(`Resource: ${res.data.resource?.url}`);
      }
    } else if (res.status === 200) {
      console.log(`🎉 Endpoint unlocked directly (HTTP 200).`);
    } else {
      console.log(`⚠️ Unexpected status: ${res.status}`);
    }
  } catch (err: any) {
    console.error(`❌ Request failed: ${err.message}`);
  }
}

async function runTrafficCheck() {
  console.log(`🚀 Starting x402 Global Challenge Endpoint Health & Discovery Scan`);
  console.log(`Target Backend: ${BASE_URL}`);
  console.log(`Merchant ID: c2e058960979f0f2 (Sikho AI)`);
  console.log(`Total Endpoints to Verify: ${ENDPOINTS.length}`);

  for (const ep of ENDPOINTS) {
    await probeEndpoint(ep);
    // Pause briefly between probes
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n============================================================`);
  console.log(`🏁 All ${ENDPOINTS.length} endpoints probed.`);
  console.log(`Check live transactions & growth on the GoPlausible Leaderboard:`);
  console.log(`https://facilitator.goplausible.xyz/dashboard/merchants/c2e058960979f0f2`);
  console.log(`============================================================\n`);
}

runTrafficCheck();
