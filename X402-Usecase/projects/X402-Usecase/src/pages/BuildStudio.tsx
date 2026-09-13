import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, ShieldAlert, Sparkles, Terminal, FileCode, CheckCircle2,
  AlertTriangle, ArrowLeft, Play, Copy, Check, ExternalLink,
  Lock, RefreshCw, Cpu, Layers, Download, Bug, Zap, Eye,
  DollarSign, CheckCheck, GitBranch, FolderGit2, AlertCircle,
  FileCheck, ShieldCheck, ArrowRight, CornerDownRight
} from 'lucide-react';
import { githubReviewApi } from '../utils/api';

interface DiscoveredFileMeta {
  fileReviewId: string;
  filePath: string;
  language: string;
  size: number;
  status: string;
}

interface DiscoveryData {
  reviewId: string;
  owner: string;
  repository: string;
  repoUrl: string;
  defaultBranch: string;
  commitSha: string;
  reviewableFileCount: number;
  prismPricePerFile: number;
  platformFeePerFile: number;
  userPricePerFile: number;
  providerTotal: number;
  platformFeeTotal: number;
  userTotal: number;
  status: string;
  files: DiscoveredFileMeta[];
}

interface FileReviewItem {
  fileReviewId: string;
  filePath: string;
  language: string;
  size: number;
  status: string;
  platformFeeAmount?: number;
  platformFeeStatus?: string;
  platformFeeTransactionId?: string;
  providerAmount?: number;
  providerPaymentTxId?: string;
  reviewResult?: {
    overallQuality?: string;
    securityScore?: number;
    testCoverageEstimate?: string;
    summary?: string;
    architecturalNotes?: string;
    findings?: Array<{
      type: string;
      severity: string;
      title: string;
      line?: number;
      description: string;
      recommendation: string;
      fixedCodeSnippet?: string;
    }>;
  };
  error?: string;
}

const PRESET_REPOS = [
  {
    name: 'AlgoKit Utils (Algorand TS SDK)',
    url: 'https://github.com/algorandfoundation/algokit-utils-ts',
    desc: 'Algorand MainNet & TestNet deployment utilities, smart contract client wrappers',
  },
  {
    name: 'Express CORS Middleware',
    url: 'https://github.com/expressjs/cors',
    desc: 'Node.js CORS header security configuration and request pre-flight handling',
  },
  {
    name: 'Fastify Rate Limit Plugin',
    url: 'https://github.com/fastify/fastify-rate-limit',
    desc: 'DDoS mitigation and IP throttling middleware for high-concurrency microservices',
  },
];

export const BuildStudio: React.FC = () => {
  const navigate = useNavigate();
  const { activeAddress, signTransactions } = useWallet();

  const [repoUrlInput, setRepoUrlInput] = useState(
    'https://github.com/algorandfoundation/algokit-utils-ts'
  );

  // States
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData | null>(null);
  const [activeReviewId, setActiveReviewId] = useState<string | null>(null);
  const [maxFilesLimit, setMaxFilesLimit] = useState<number>(3); // Default to 3 files ($0.75) for 1-click acceptance test
  const [walletUsdcBalance, setWalletUsdcBalance] = useState<number | null>(null);

  const [isPaying, setIsPaying] = useState(false);
  const [reviewState, setReviewState] = useState<'idle' | 'discovered' | 'processing' | 'completed' | 'partial'>('idle');
  const [reviewSummary, setReviewSummary] = useState<any>(null);
  const [fileReviews, setFileReviews] = useState<FileReviewItem[]>([]);
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [selectedSeverityTab, setSelectedSeverityTab] = useState<string>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);

  // Clean up polling interval
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Fetch connected wallet USDC balance (ASA 31566704)
  useEffect(() => {
    if (!activeAddress) {
      setWalletUsdcBalance(null);
      return;
    }
    const fetchBalance = async () => {
      try {
        const client = new algosdk.Algodv2(
          import.meta.env.VITE_ALGOD_TOKEN || '',
          import.meta.env.VITE_ALGOD_SERVER || 'https://mainnet-api.algonode.cloud',
          import.meta.env.VITE_ALGOD_PORT || ''
        );
        const acctInfo = await client.accountInformation(activeAddress).do();
        const assets: any[] = acctInfo.assets || [];
        const usdcAsset = assets.find(
          (a: any) => a['asset-id'] === 31566704 || a.assetId === 31566704
        );
        if (usdcAsset) {
          setWalletUsdcBalance(usdcAsset.amount / 1000000);
        } else {
          setWalletUsdcBalance(0);
        }
      } catch (e) {
        console.warn('Could not fetch wallet USDC balance:', e);
      }
    };
    fetchBalance();
  }, [activeAddress]);

  // 1. Discover Repository
  const handleDiscover = async (customUrl?: string, customMaxFiles?: number) => {
    const targetUrl = customUrl || repoUrlInput;
    const effectiveLimit = customMaxFiles || maxFilesLimit;
    if (!targetUrl.trim()) {
      setError('Please provide a valid GitHub repository URL.');
      return;
    }

    setIsDiscovering(true);
    setError(null);
    setDiscoveryData(null);
    setReviewState('idle');
    setReviewSummary(null);
    setFileReviews([]);

    try {
      const res = await githubReviewApi.discover(targetUrl.trim(), effectiveLimit);
      if (res.success && res.data) {
        setDiscoveryData(res.data);
        setActiveReviewId(res.data.reviewId);
        setReviewState('discovered');
        // Initial list of files
        setFileReviews(
          res.data.files.map((f) => ({
            fileReviewId: f.fileReviewId,
            filePath: f.filePath,
            language: f.language,
            size: f.size,
            status: f.status || 'pending',
          }))
        );
      } else {
        throw new Error(res.message || 'Failed to discover GitHub repository.');
      }
    } catch (err: any) {
      console.error('Discovery error:', err);
      setError(err.message || 'Failed to discover repository. Verify the URL is public on github.com.');
    } finally {
      setIsDiscovering(false);
    }
  };

  // 2. Start Single Payment & Trigger Orchestration
  const handlePayAndStartReview = async () => {
    if (!activeAddress) {
      setError('Please connect your Algorand wallet in the top navigation bar to proceed with payment.');
      return;
    }

    if (!discoveryData) {
      setError('Please discover a repository first.');
      return;
    }

    setIsPaying(true);
    setError(null);

    try {
      // Calculate total micro-USDC ($0.25 * N files = userTotal * 1,000,000)
      const expectedMicroUSDC = Math.round(discoveryData.userTotal * 1000000);
      const treasuryAddress =
        import.meta.env.VITE_AVM_ADDRESS ||
        '2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY';

      const client = new algosdk.Algodv2(
        import.meta.env.VITE_ALGOD_TOKEN || '',
        import.meta.env.VITE_ALGOD_SERVER || 'https://mainnet-api.algonode.cloud',
        import.meta.env.VITE_ALGOD_PORT || ''
      );

      const params = await client.getTransactionParams().do();
      const enc = new TextEncoder();
      const noteBytes = enc.encode(
        JSON.stringify({
          service: 'multi-file-github-review',
          reviewId: discoveryData.reviewId,
          repo: `${discoveryData.owner}/${discoveryData.repository}`,
          files: discoveryData.reviewableFileCount,
          timestamp: Date.now(),
        })
      );

      const tx = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: treasuryAddress,
        amount: expectedMicroUSDC,
        assetIndex: 31566704, // Algorand MainNet USDC ASA
        suggestedParams: params,
        note: noteBytes,
      } as any);

      const binaryTx = tx.toByte();
      const signedArray = await signTransactions([binaryTx]);
      const signedRaw = signedArray.filter(Boolean) as Uint8Array[];

      const sendRes: any = await client.sendRawTransaction(signedRaw).do();
      const txId: string = sendRes.txId || sendRes.txid || (tx as any).txID();
      console.log(`[Multi-File Review] User payment broadcast on Algorand MainNet: ${txId}`);

      // Wait for on-chain confirmation
      await algosdk.waitForConfirmation(client, txId, 4);

      // Call backend to start multi-file batch execution
      const startRes = await githubReviewApi.startReview(discoveryData.reviewId, txId);
      if (!startRes.success) {
        throw new Error(startRes.message || 'Failed to initialize repository review queue.');
      }

      setReviewState('processing');
      // Begin polling for live updates
      startPolling(discoveryData.reviewId);
    } catch (err: any) {
      console.error('Payment / Start Review error:', err);
      let userMsg = err.message || 'Failed to authorize payment or start review.';
      if (typeof userMsg === 'string' && userMsg.includes('underflow on subtracting')) {
        const match = userMsg.match(/subtracting\s+(\d+)\s+from\s+sender\s+amount\s+(\d+)/i);
        if (match) {
          const reqUsdc = (parseInt(match[1], 10) / 1000000).toFixed(2);
          const balUsdc = (parseInt(match[2], 10) / 1000000).toFixed(2);
          userMsg = `Insufficient USDC Balance: Your wallet has $${balUsdc} USDC, but this repository review requires $${reqUsdc} USDC (${discoveryData.reviewableFileCount} files × $0.25). Please select a 3-file limit ($0.75) or fund your wallet with USDC.`;
        }
      }
      setError(userMsg);
    } finally {
      setIsPaying(false);
    }
  };

  // 3. Polling Review Status
  const startPolling = (reviewId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await githubReviewApi.getReviewStatus(reviewId);
        if (res.success && res.data) {
          const { review, files } = res.data;
          setReviewSummary(review);
          setFileReviews(files || []);

          if (review.status === 'completed' || review.status === 'partial' || review.status === 'failed') {
            setReviewState(review.status);
            clearInterval(pollIntervalRef.current);
          }
        }
      } catch (pollErr) {
        console.warn('Status polling error:', pollErr);
      }
    }, 2500);
  };

  // 4. Retry Failed Single File
  const handleRetryFile = async (fileId: string) => {
    if (!activeReviewId) return;
    try {
      const res = await githubReviewApi.retryFile(activeReviewId, fileId);
      if (res.success) {
        // Refresh status
        const statusRes = await githubReviewApi.getReviewStatus(activeReviewId);
        if (statusRes.success && statusRes.data) {
          setReviewSummary(statusRes.data.review);
          setFileReviews(statusRes.data.files || []);
        }
      }
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const completedCount = fileReviews.filter((f) => f.status === 'completed').length;
  const failedCount = fileReviews.filter((f) => f.status === 'failed').length;
  const totalCount = fileReviews.length || (discoveryData?.reviewableFileCount ?? 0);
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Aggregate Findings Filter
  const allFindings = fileReviews.flatMap((f) =>
    (f.reviewResult?.findings || []).map((finding) => ({
      ...finding,
      filePath: f.filePath,
      fileReviewId: f.fileReviewId,
    }))
  );

  const filteredFindings = allFindings.filter((f) => {
    if (selectedSeverityTab === 'all') return true;
    return f.severity.toLowerCase() === selectedSeverityTab.toLowerCase();
  });

  return (
    <div className="pt-20 min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-20">
      
      {/* ── TOP HEADER BAR ── */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
              title="Return to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-md border border-violet-200/60 flex items-center gap-1">
                  <Code2 size={12} /> GitHub Review
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  x402 Dual-Settlement Marketplace
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                Multi-File GitHub Repository Security Audit &amp; Code Review
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Prism ($0.20) + Sikho Fee ($0.05)</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-8">

        {/* ── REPO URL INPUT & PRESETS CARD ── */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-md border border-violet-100">
                1. Target GitHub Repository
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                Enter Public GitHub Repository URL
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sikho AI recursively inspects your commit tree, selects all reviewable source files, and coordinates individual Prism AI x402 audits.
              </p>
            </div>

            {/* Wallet Info Badge */}
            {activeAddress ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono">
                    {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                  </span>
                  <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-1.5 py-0.5 rounded font-bold">
                    MainNet
                  </span>
                </div>
                {walletUsdcBalance !== null && (
                  <div className="bg-violet-50 border border-violet-200 text-violet-800 text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 font-medium">
                    <DollarSign size={13} className="text-violet-600" />
                    <span>Balance:</span>
                    <span className="font-bold font-mono text-violet-950">${walletUsdcBalance.toFixed(2)} USDC</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 shrink-0">
                <AlertCircle size={14} />
                <span>Connect wallet in navbar to sign payments</span>
              </div>
            )}
          </div>

          {/* URL Search Input */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FolderGit2 size={18} />
              </div>
              <input
                type="text"
                value={repoUrlInput}
                onChange={(e) => setRepoUrlInput(e.target.value)}
                placeholder="https://github.com/owner/repository"
                disabled={isDiscovering || isPaying}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
              />
            </div>
            <button
              onClick={() => handleDiscover()}
              disabled={isDiscovering || isPaying}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition shrink-0"
            >
              {isDiscovering ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Discovering Tree...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Discover &amp; Price Files</span>
                </>
              )}
            </button>
          </div>

          {/* File Limit Selector */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Review Limit:</span>
            {[
              { label: '3 Files ($0.75)', value: 3 },
              { label: '5 Files ($1.25)', value: 5 },
              { label: '10 Files ($2.50)', value: 10 },
              { label: '50 Files ($12.50)', value: 50 },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setMaxFilesLimit(opt.value);
                  if (discoveryData) {
                    handleDiscover(undefined, opt.value);
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                  maxFilesLimit === opt.value
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Presets */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              Quick Test Presets
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {PRESET_REPOS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setRepoUrlInput(preset.url);
                    handleDiscover(preset.url);
                  }}
                  className="p-3 text-left bg-slate-50 hover:bg-violet-50/60 border border-slate-200/80 hover:border-violet-300 rounded-xl transition group"
                >
                  <div className="font-bold text-xs text-slate-900 group-hover:text-violet-700 flex items-center justify-between">
                    <span>{preset.name}</span>
                    <ArrowRight size={12} className="text-slate-400 group-hover:text-violet-600 transition" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── DISCOVERY QUOTATION & PRICING CARD ── */}
        {discoveryData && (
          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                  2. Discovered Tree &amp; Pricing Quotation
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <h3 className="text-lg font-black text-slate-900">
                    {discoveryData.owner}/{discoveryData.repository}
                  </h3>
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1">
                    <GitBranch size={10} /> {discoveryData.defaultBranch}
                  </span>
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                    SHA: {discoveryData.commitSha.substring(0, 7)}
                  </span>
                </div>
              </div>

              {/* Price Breakdown Summary */}
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Total Order Price</div>
                  <div className="text-xl font-black text-violet-700">
                    ${discoveryData.userTotal.toFixed(2)} USDC
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>Prism AI ({discoveryData.reviewableFileCount} × $0.20): <strong>${discoveryData.providerTotal.toFixed(2)}</strong></div>
                  <div>Sikho Fee ({discoveryData.reviewableFileCount} × $0.05): <strong>${discoveryData.platformFeeTotal.toFixed(2)}</strong></div>
                </div>
              </div>
            </div>

            {/* Discovered Files Matrix */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Detected Reviewable Source Files ({discoveryData.reviewableFileCount})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Filtered non-source binaries, lockfiles, and node_modules
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-slate-50/50">
                {discoveryData.files.map((file, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-white transition">
                    <div className="flex items-center gap-2.5 font-mono text-slate-700 truncate max-w-[480px]">
                      <FileCode size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{file.filePath}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        {file.language}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Single Payment & Start Trigger */}
            {reviewState === 'discovered' && (
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Clicking below authorizes <strong>ONE Algorand transaction</strong> of <strong>${discoveryData.userTotal.toFixed(2)} USDC</strong> to Sikho treasury.
                </div>

                <button
                  onClick={handlePayAndStartReview}
                  disabled={isPaying}
                  className="w-full sm:w-auto px-8 py-3.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2.5 shadow-md shadow-violet-500/20 transition shrink-0"
                >
                  {isPaying ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Authorizing Algorand Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>Pay ${discoveryData.userTotal.toFixed(2)} USDC &amp; Start Review</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── REAL-TIME MULTI-FILE EXECUTION PROGRESS MATRIX ── */}
        {(reviewState === 'processing' || reviewState === 'completed' || reviewState === 'partial') && (
          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                    reviewState === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : reviewState === 'partial'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {reviewState === 'completed' ? '✓ Audit Completed' : reviewState === 'partial' ? '⚠ Partial Completion' : '⟳ Multi-File Orchestration in Progress'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    ({completedCount}/{totalCount} files finished)
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Per-File Dual-Settlement Progress Matrix
                </h3>
              </div>

              {/* Verified Ledger Counter */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Prism x402 Calls ($0.20)</span>
                  <span className="text-sm font-black text-slate-900">{completedCount} / {totalCount}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Sikho Fee Ops ($0.05)</span>
                  <span className="text-sm font-black text-violet-700">{completedCount} / {totalCount}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Repository Review Queue</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-violet-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* File-by-File Ledger & Status Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">File Path</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Sikho Fee ($0.05)</th>
                    <th className="py-3 px-4">Prism Payment ($0.20)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {fileReviews.map((f) => (
                    <React.Fragment key={f.fileReviewId}>
                      <tr className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2 max-w-[320px] truncate">
                          <FileCode size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{f.filePath}</span>
                        </td>

                        <td className="py-3 px-4">
                          {f.status === 'completed' ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 size={10} /> Completed
                            </span>
                          ) : f.status === 'processing' || f.status === 'fee_pending' || f.status === 'provider_payment_pending' ? (
                            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                              <RefreshCw size={10} className="animate-spin" /> Processing
                            </span>
                          ) : f.status === 'failed' ? (
                            <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                              <AlertTriangle size={10} /> Failed
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                              ○ Pending
                            </span>
                          )}
                        </td>

                        {/* Sikho Platform Fee */}
                        <td className="py-3 px-4 text-[11px]">
                          {f.platformFeeTransactionId ? (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <Check size={12} />
                              <span>Paid $0.05</span>
                              <span className="text-[9px] font-mono text-slate-400 truncate max-w-[90px]">
                                ({f.platformFeeTransactionId})
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Waiting...</span>
                          )}
                        </td>

                        {/* Prism Provider Payment */}
                        <td className="py-3 px-4 text-[11px]">
                          {f.providerPaymentTxId ? (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <Check size={12} />
                              <span>Paid $0.20</span>
                              <a
                                href={`https://allo.info/tx/${f.providerPaymentTxId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-violet-600 hover:underline flex items-center gap-0.5 text-[9px] font-mono"
                                title="Verify on Algorand Explorer"
                              >
                                Tx <ExternalLink size={9} />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400">Waiting...</span>
                          )}
                        </td>

                        {/* Action / Expand */}
                        <td className="py-3 px-4 text-right">
                          {f.status === 'completed' ? (
                            <button
                              onClick={() =>
                                setExpandedFileId(expandedFileId === f.fileReviewId ? null : f.fileReviewId)
                              }
                              className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            >
                              {expandedFileId === f.fileReviewId ? 'Hide Review' : 'View Review'}
                            </button>
                          ) : f.status === 'failed' ? (
                            <button
                              onClick={() => handleRetryFile(f.fileReviewId)}
                              className="px-2.5 py-1 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition"
                            >
                              Retry
                            </button>
                          ) : null}
                        </td>
                      </tr>
                      {f.status === 'failed' && f.error && (
                        <tr key={`err_${f.fileReviewId}`} className="bg-red-50/60 text-[11px] text-red-700">
                          <td colSpan={5} className="py-2.5 px-4 font-mono">
                            <div className="flex items-center gap-2">
                              <AlertCircle size={14} className="shrink-0 text-red-600" />
                              <span><strong>Error:</strong> {f.error}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── AGGREGATED REPOSITORY REVIEW & AUDIT REPORT ── */}
        {(reviewState === 'completed' || reviewState === 'partial') && reviewSummary?.aggregateReview && (
          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-md border border-violet-100">
                  4. Consolidated Repository Audit Report
                </span>
                <h3 className="text-2xl font-black text-slate-900 mt-2">
                  Repository-Level Architecture &amp; Security Findings
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Synthesized across all {completedCount} independently audited files with verified on-chain x402 settlements.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-4 bg-slate-900 text-white rounded-2xl text-center min-w-[110px]">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Overall Score</div>
                  <div className="text-2xl font-black text-emerald-400">
                    {reviewSummary.aggregateReview.overallScore}/100
                  </div>
                </div>
                <div className="p-4 bg-slate-900 text-white rounded-2xl text-center min-w-[110px]">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Security Score</div>
                  <div className="text-2xl font-black text-violet-400">
                    {reviewSummary.aggregateReview.securityScore}/100
                  </div>
                </div>
              </div>
            </div>

            {/* Severity Breakdown Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-red-200 bg-red-50/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-red-800 uppercase block">Critical Findings</span>
                  <span className="text-xl font-black text-red-700">{reviewSummary.aggregateReview.criticalCount}</span>
                </div>
                <ShieldAlert size={20} className="text-red-500" />
              </div>

              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">High Severity</span>
                  <span className="text-xl font-black text-amber-700">{reviewSummary.aggregateReview.highCount}</span>
                </div>
                <AlertTriangle size={20} className="text-amber-500" />
              </div>

              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Medium Findings</span>
                  <span className="text-xl font-black text-blue-700">{reviewSummary.aggregateReview.mediumCount}</span>
                </div>
                <Bug size={20} className="text-blue-500" />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase block">Low / Refactor</span>
                  <span className="text-xl font-black text-slate-800">{reviewSummary.aggregateReview.lowCount}</span>
                </div>
                <Zap size={20} className="text-slate-400" />
              </div>
            </div>

            {/* Key Recommendations */}
            {reviewSummary.aggregateReview.recommendations?.length > 0 && (
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-600" /> Key Architectural Recommendations
                </h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                  {reviewSummary.aggregateReview.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200/60">
                      <span className="text-violet-600 font-bold shrink-0">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Expanded File Review Detail Modal / Section */}
            {expandedFileId && (
              <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl space-y-6">
                {(() => {
                  const activeFile = fileReviews.find((f) => f.fileReviewId === expandedFileId);
                  if (!activeFile || !activeFile.reviewResult) return null;
                  const res = activeFile.reviewResult;

                  return (
                    <>
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <div>
                          <div className="text-[10px] text-slate-400 font-mono">File Review Detail</div>
                          <h4 className="text-base font-bold text-white font-mono">{activeFile.filePath}</h4>
                        </div>
                        <button
                          onClick={() => setExpandedFileId(null)}
                          className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1 bg-slate-800 rounded-lg"
                        >
                          Close File View
                        </button>
                      </div>

                      {/* File Findings */}
                      <div className="space-y-4">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Detected Security &amp; Refactor Findings ({res.findings?.length || 0})
                        </h5>

                        <div className="space-y-3">
                          {(res.findings || []).map((f: any, idx: number) => (
                            <div key={idx} className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                    f.severity === 'Critical' ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  }`}>
                                    {f.severity}
                                  </span>
                                  <span className="text-xs font-bold text-white">{f.title}</span>
                                </div>
                                {f.line && <span className="text-[10px] font-mono text-slate-400">Line {f.line}</span>}
                              </div>

                              <p className="text-xs text-slate-300">{f.description}</p>
                              <div className="text-xs text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/40">
                                <strong>Fix:</strong> {f.recommendation}
                              </div>

                              {f.fixedCodeSnippet && (
                                <div className="mt-2">
                                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                                    <span>Recommended Patch:</span>
                                    <button
                                      onClick={() => handleCopy(f.fixedCodeSnippet, `code_${idx}`)}
                                      className="text-slate-400 hover:text-white flex items-center gap-1"
                                    >
                                      {copiedText === `code_${idx}` ? <Check size={10} /> : <Copy size={10} />}
                                      <span>Copy</span>
                                    </button>
                                  </div>
                                  <pre className="p-3 bg-black/60 rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto">
                                    {f.fixedCodeSnippet}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  );
};

export default BuildStudio;
