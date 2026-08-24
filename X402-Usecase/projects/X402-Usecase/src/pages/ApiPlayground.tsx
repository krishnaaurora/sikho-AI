import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Sparkles, Play, Code2, HelpCircle, Terminal, Microscope, 
  UserCheck, Compass, MessageSquare, AlertCircle, FileSpreadsheet,
  Wallet
} from 'lucide-react';
import { useWallet } from '@txnlab/use-wallet-react';
// @ts-ignore
import { encodePaymentSignatureHeader } from "@x402/core/http";

interface EndpointInfo {
  path: string;
  name: string;
  price: string;
  icon: React.ReactNode;
  placeholderInput: string;
}

const ENDPOINTS: EndpointInfo[] = [
  { path: "/api/v1/ai/explain", name: "1. Explain", price: "$0.002", icon: <Sparkles size={16} />, placeholderInput: JSON.stringify({ query: "Explain WebSockets", learningStyle: "visual", language: "English" }, null, 2) },
  { path: "/api/v1/ai/doubt-solve", name: "2. Doubt Solve", price: "$0.002", icon: <HelpCircle size={16} />, placeholderInput: JSON.stringify({ doubt: "Why is WebSocket better than polling?" }, null, 2) },
  { path: "/api/v1/ai/code-review", name: "3. Code Review", price: "$0.005", icon: <Code2 size={16} />, placeholderInput: JSON.stringify({ language: "python", code: "def add(a,b): return a+b" }, null, 2) },
  { path: "/api/v1/ai/debug", name: "4. Debug", price: "$0.003", icon: <Terminal size={16} />, placeholderInput: JSON.stringify({ language: "python", code: "print(items[10])", error: "IndexError" }, null, 2) },
  { path: "/api/v1/ai/generate-quiz", name: "5. Generate Quiz", price: "$0.005", icon: <FileSpreadsheet size={16} />, placeholderInput: JSON.stringify({ topic: "Operating Systems", difficulty: "medium", numberOfQuestions: 3 }, null, 2) },
  { path: "/api/v1/ai/mock-interview", name: "6. Mock Interview", price: "$0.008", icon: <MessageSquare size={16} />, placeholderInput: JSON.stringify({ role: "Backend Developer", experience: "Fresher", numberOfQuestions: 3 }, null, 2) },
  { path: "/api/v1/ai/research-analysis", name: "7. Research Analysis", price: "$0.010", icon: <Microscope size={16} />, placeholderInput: JSON.stringify({ title: "Attention Is All You Need", abstract: "We propose Transformer, a model architecture relying entirely on self-attention mechanisms..." }, null, 2) },
  { path: "/api/v1/ai/interactive-lab", name: "8. Interactive Lab", price: "$0.003", icon: <Compass size={16} />, placeholderInput: JSON.stringify({ labId: "http-request-response", topic: "HTTP" }, null, 2) },
  { path: "/api/v1/ai/resume-analysis", name: "9. Resume Analysis", price: "$0.004", icon: <UserCheck size={16} />, placeholderInput: JSON.stringify({ resumeText: "Sneha, Backend Developer. Skills: Python, Node.js.", targetRole: "Software Engineer" }, null, 2) },
  { path: "/api/v1/ai/career-roadmap", name: "10. Career Roadmap", price: "$0.005", icon: <Compass size={16} />, placeholderInput: JSON.stringify({ targetRole: "ML Engineer", currentSkills: ["Python", "Machine Learning"], experienceLevel: "Beginner" }, null, 2) }
];

function getCustomPlaceholder(endpointPath: string, query: string): string {
  const ep = ENDPOINTS.find(e => e.path === endpointPath);
  if (!ep) return "";
  try {
    const obj = JSON.parse(ep.placeholderInput);
    if (endpointPath === "/api/v1/ai/explain") {
      obj.query = query;
    } else if (endpointPath === "/api/v1/ai/doubt-solve") {
      obj.doubt = query;
    } else if (endpointPath === "/api/v1/ai/code-review") {
      obj.code = query;
    } else if (endpointPath === "/api/v1/ai/debug") {
      obj.code = query;
    } else if (endpointPath === "/api/v1/ai/generate-quiz") {
      obj.topic = query;
    } else if (endpointPath === "/api/v1/ai/mock-interview") {
      obj.role = query;
    } else if (endpointPath === "/api/v1/ai/research-analysis") {
      obj.title = query;
    } else if (endpointPath === "/api/v1/ai/interactive-lab") {
      obj.topic = query;
    } else if (endpointPath === "/api/v1/ai/resume-analysis") {
      obj.resumeText = query;
    } else if (endpointPath === "/api/v1/ai/career-roadmap") {
      obj.targetRole = query;
    }
    return JSON.stringify(obj, null, 2);
  } catch (_) {
    return ep.placeholderInput;
  }
}

const ApiPlayground: React.FC = () => {
  const { activeAddress, signTransactions } = useWallet();
  const [searchParams] = useSearchParams();
  const pathParam = searchParams.get('path');
  const queryParam = searchParams.get('q');

  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointInfo>(() => {
    if (pathParam) {
      const ep = ENDPOINTS.find(e => e.path === pathParam);
      if (ep) return ep;
    }
    return ENDPOINTS[0];
  });
  
  const [inputJson, setInputJson] = useState<string>(() => {
    if (pathParam) {
      if (queryParam) {
        return getCustomPlaceholder(pathParam, queryParam);
      }
      const ep = ENDPOINTS.find(e => e.path === pathParam);
      if (ep) return ep.placeholderInput;
    }
    return ENDPOINTS[0].placeholderInput;
  });

  useEffect(() => {
    if (pathParam) {
      const ep = ENDPOINTS.find(e => e.path === pathParam);
      if (ep) {
        setSelectedEndpoint(ep);
        if (queryParam) {
          setInputJson(getCustomPlaceholder(pathParam, queryParam));
        } else {
          setInputJson(ep.placeholderInput);
        }
      }
    }
  }, [pathParam, queryParam]);
  
  const [httpStatus, setHttpStatus] = useState<number | null>(null);
  const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});
  const [responseBody, setResponseBody] = useState<any>(null);
  const [paymentRequiredPayload, setPaymentRequiredPayload] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null);

  const handleEndpointSelect = (ep: EndpointInfo) => {
    setSelectedEndpoint(ep);
    setInputJson(ep.placeholderInput);
    setHttpStatus(null);
    setResponseHeaders({});
    setResponseBody(null);
    setPaymentRequiredPayload(null);
    setPaymentTxHash(null);
  };

  const executeRequest = async (signedPaymentHeader?: string) => {
    setLoading(true);
    setHttpStatus(null);
    setResponseBody(null);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
    };

    if (signedPaymentHeader) {
      headers["X-PAYMENT"] = signedPaymentHeader;
    }

    try {
      const response = await fetch(selectedEndpoint.path, {
        method: "POST",
        headers,
        body: inputJson
      });

      setHttpStatus(response.status);
      const headersObj: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        headersObj[key] = val;
      });
      setResponseHeaders(headersObj);

      const json = await response.json();
      setResponseBody(json);

      if (response.status === 402) {
        setPaymentRequiredPayload(json);
      } else {
        setPaymentRequiredPayload(null);
      }
    } catch (err: any) {
      setResponseBody({ error: "Network request failed", details: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePayAndExecute = async () => {
    if (!paymentRequiredPayload || !activeAddress) {
      alert("Connect wallet and trigger a 402 payment required state first.");
      return;
    }

    try {
      const requirement = paymentRequiredPayload.accepts[0];
      const algosdk = (window as any).algosdk;
      if (!algosdk) {
        alert("algosdk library not loaded on window context.");
        return;
      }

      // Build mainnet/testnet atomic transfer transaction block
      const client = new algosdk.Algodv2(
        import.meta.env.VITE_ALGOD_TOKEN || "",
        import.meta.env.VITE_ALGOD_SERVER || "https://mainnet-api.algonode.cloud",
        import.meta.env.VITE_ALGOD_PORT || ""
      );

      const params = await client.getTransactionParams().do();
      const enc = new TextEncoder();

      // Build exact token payment transfer
      const tx = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: activeAddress,
        to: requirement.payTo,
        amount: parseInt(requirement.amount),
        assetIndex: parseInt(requirement.asset),
        suggestedParams: params,
        note: enc.encode(JSON.stringify(requirement.extra || {}))
      });

      const binaryTx = tx.toByte();
      const signedArray = await signTransactions([binaryTx]);
      const { txId } = await client.sendRawTransaction(signedArray).do();
      setPaymentTxHash(txId);

      // Construct verified signed payment header token format matching @x402 standard
      const signedPaymentHeader = JSON.stringify({
        txid: txId,
        sender: activeAddress,
        network: requirement.network
      });

      // Resubmit to backend with payment confirmation header
      await executeRequest(signedPaymentHeader);
    } catch (err: any) {
      alert(`Payment transaction signing failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-24 px-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[10px] font-mono bg-blue-50 border border-blue-200 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            SikhoAI Ecosystem
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">x402 API Playground & Validation Center</h1>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Test unpaid 402 requirements, sign Algorand micro-payments, and verify structured AI JSON outputs.
          </p>
        </div>
        <div>
          {activeAddress ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Wallet: {activeAddress.substring(0, 10)}...</span>
            </div>
          ) : (
            <div className="bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <Wallet size={14} />
              <span>Connect Wallet in Navbar</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid split-pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Left endpoint selector sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest px-1">Endpoints List</h2>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-1.5 shadow-sm">
            {ENDPOINTS.map((ep) => (
              <button
                key={ep.path}
                onClick={() => handleEndpointSelect(ep)}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-xs font-bold transition-all border ${
                  selectedEndpoint.path === ep.path
                    ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                    : 'bg-slate-55/60 border-transparent text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  {ep.icon}
                  <span>{ep.name}</span>
                </div>
                <span className="text-[10px] font-mono bg-white border px-2 py-0.5 rounded text-slate-500 shadow-sm">
                  {ep.price}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Center/Right execute workspace */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
            
            {/* Active Endpoint Spec */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">
                  POST
                </span>
                <span className="ml-2 font-mono text-xs font-bold text-slate-700">{selectedEndpoint.path}</span>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                Cost: {selectedEndpoint.price} USDC
              </span>
            </div>

            {/* Input JSON area */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                JSON Request Payload Body
              </label>
              <textarea
                rows={5}
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-slate-800 focus:border-blue-500 transition-all shadow-inner"
              />
            </div>

            {/* Actions button */}
            <div className="flex gap-4">
              <button
                onClick={() => executeRequest()}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {loading ? "Executing API..." : "Send Unpaid Request (Assert 402)"}
              </button>

              {paymentRequiredPayload && (
                <button
                  onClick={handlePayAndExecute}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Wallet size={14} />
                  <span>Connect & Pay {selectedEndpoint.price} USDC</span>
                </button>
              )}
            </div>

            {/* Transaction Hash */}
            {paymentTxHash && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs font-semibold text-slate-700 shadow-inner">
                <span>Payment Tx ID:</span>
                <span className="font-mono text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] select-all shadow-sm">
                  {paymentTxHash}
                </span>
              </div>
            )}

            {/* Response Console */}
            {httpStatus !== null && (
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">HTTP Response Status</h3>
                  <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full border ${
                    httpStatus === 200 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    httpStatus === 402 ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' :
                    'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    {httpStatus} {httpStatus === 402 ? "Payment Required" : httpStatus === 200 ? "Success OK" : "Error"}
                  </span>
                </div>

                {/* Headers */}
                {responseHeaders["payment-required"] && (
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                    <h4 className="text-[10px] font-bold text-amber-700 font-mono">ENCODED PAYMENT-REQUIRED HEADER</h4>
                    <p className="font-mono text-[9px] text-slate-600 break-all select-all bg-white p-2 rounded border border-amber-100">
                      {responseHeaders["payment-required"]}
                    </p>
                  </div>
                )}

                {/* Body output */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                    Response JSON Payload
                  </label>
                  <pre className="bg-[#0f172a] text-slate-100 font-mono text-xs p-4 rounded-xl overflow-x-auto shadow-inner">
                    <code>{JSON.stringify(responseBody, null, 2)}</code>
                  </pre>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default ApiPlayground;
