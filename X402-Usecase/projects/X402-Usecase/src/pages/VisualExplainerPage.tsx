import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Search, Play, Pause, RotateCcw,
  Layers, Brain, ArrowLeft, ArrowRight, MessageSquare, HelpCircle,
  Zap, Compass, Globe, CheckCircle2, ChevronRight,
  Send, Loader2, BookOpen
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { IsometricStage } from '../components/visual-explainer/IsometricStage';
import { RequestDistributionVisual } from '../components/visual-explainer/RequestDistributionVisual';
import { TokenStreamingVisual } from '../components/visual-explainer/TokenStreamingVisual';
import { UniversalVisualizer } from '../components/visual-explainer/UniversalVisualizer';
import { StepControls } from '../components/visual-explainer/StepControls';
import { QuizCard } from '../components/visual-explainer/QuizCard';

import { useWallet } from '@txnlab/use-wallet-react';
import { createX402Fetch } from '../utils/x402';
import { ellipseAddress } from '../utils/ellipseAddress';
import { API_BASE_URL } from '../config/api';

interface VisualStep {
  id: number;
  stepNumber: number;
  title: string;
  description: string;
  animation: string;
  highlightNodes: string[];
  caption: string;
}

interface VisualData {
  concept: string;
  title: string;
  subtitle: string;
  difficulty: string;
  duration: number;
  visualType: string;
  author: string;
  metrics: {
    labelLeft: string;
    valueLeft: string;
    labelRight: string;
    valueRight: string;
  };
  steps: VisualStep[];
  realWorldExample: string;
  challenge: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  };
}

const PRESET_TOPICS = [
  { label: "Load Balancing", query: "Explain Load Balancing" },
  { label: "Token Streaming", query: "Token Streaming" },
  { label: "Caching & Redis", query: "Explain Caching" },
  { label: "API Gateway", query: "API Gateway Architecture" }
];

export default function VisualExplainerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || "Explain Load Balancing";

  const { activeAddress, signTransactions } = useWallet();

  const [inputTopic, setInputTopic] = useState(queryParam);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [visualData, setVisualData] = useState<VisualData | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Transactions ledger state
  const [showTxModal, setShowTxModal] = useState(false);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Ask about this step drawer state
  const [askQuestion, setAskQuestion] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState<string | null>(null);

  // Speech Synth
  const speakCurrentStep = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!isSpeaking) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => {};
    window.speechSynthesis.speak(utterance);
  };

  const fetchVisualExplanation = async (topic: string) => {
    setLoading(true);
    setAskAnswer(null);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/x402/visual-explainer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ concept: topic, userQuery: topic })
      });

      if (response.status === 402) {
        // 402 Payment Required returned — user must unlock via x402 payment
        setVisualData(null);
        return;
      }

      const res = await response.json();
      const payload = res?.data || res;
      if (payload && payload.steps && payload.steps.length > 0) {
        setVisualData(payload);
        setCurrentStepIndex(0);
        setIsPlaying(true);
        if (isSpeaking && payload.steps?.[0]) {
          speakCurrentStep(payload.steps[0].description);
        }
      }
    } catch (err) {
      console.error("Failed to load visual explanation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayX402 = async () => {
    if (!activeAddress) {
      alert("Please connect your Algorand wallet first to unlock this feature with x402.");
      return;
    }
    setPaying(true);
    try {
      const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await x402Fetch(`${API_BASE_URL}/x402/visual-explainer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ concept: inputTopic, difficulty: "intermediate" })
      });
      const data = await res.json();
      const payload = data?.data || data;
      if (payload && payload.steps && payload.steps.length > 0) {
        setVisualData(payload);
        setCurrentStepIndex(0);
        setIsPlaying(true);
        setPaymentSuccess(true);
        setTimeout(() => setPaymentSuccess(false), 5000);
        loadTxHistory();
      } else {
        throw new Error(data?.message || "Visual schematic could not be generated.");
      }
    } catch (err: any) {
      console.error("x402 payment error:", err);
      alert(err.message || "Payment challenge failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const loadTxHistory = async () => {
    setLoadingTx(true);
    try {
      const res = await fetch(`${API_BASE_URL}/x402/transactions?serviceId=visual_explainer`);
      const data = await res.json();
      if (data.success && data.data) {
        setTxHistory(data.data);
      }
    } catch (e) {
      console.error("Failed to load txs:", e);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    if (queryParam) {
      setInputTopic(queryParam);
      fetchVisualExplanation(queryParam);
    }
  }, [queryParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTopic.trim()) return;
    setSearchParams({ q: inputTopic.trim() });
    fetchVisualExplanation(inputTopic.trim());
  };

  const handleNextStep = () => {
    if (!visualData || currentStepIndex >= visualData.steps.length - 1) return;
    const nextIdx = currentStepIndex + 1;
    setCurrentStepIndex(nextIdx);
    if (isSpeaking && visualData.steps[nextIdx]) {
      speakCurrentStep(visualData.steps[nextIdx].description);
    }
  };

  const handlePrevStep = () => {
    if (!visualData || currentStepIndex <= 0) return;
    const prevIdx = currentStepIndex - 1;
    setCurrentStepIndex(prevIdx);
    if (isSpeaking && visualData.steps[prevIdx]) {
      speakCurrentStep(visualData.steps[prevIdx].description);
    }
  };

  const handleReplay = () => {
    setCurrentStepIndex(0);
    setIsPlaying(true);
    if (isSpeaking && visualData?.steps?.[0]) {
      speakCurrentStep(visualData.steps[0].description);
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      if (visualData?.steps?.[currentStepIndex]) {
        speakCurrentStep(visualData.steps[currentStepIndex].description);
      }
    }
  };

  const handleAskStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuestion.trim() || !visualData) return;
    setAskLoading(true);
    try {
      const activeStep = visualData.steps[currentStepIndex];
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const questionText = `Regarding Step ${activeStep.stepNumber} ("${activeStep.title}") of ${visualData.concept}: ${askQuestion.trim()}`;
      
      const res = await fetch(`${API_BASE_URL}/ai/doubt-solve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          doubt: questionText,
          question: questionText,
          topic: visualData.concept
        })
      });
      const data = await res.json();
      const payload = data?.data || data;
      if (payload && (payload.answer || payload.explanation || payload.content)) {
        setAskAnswer(payload.answer || payload.explanation || payload.content);
      } else {
        setAskAnswer(`In Step ${activeStep.stepNumber} ("${activeStep.title}"), ${activeStep.description}`);
      }
    } catch {
      const activeStep = visualData.steps[currentStepIndex];
      setAskAnswer(`In Step ${activeStep.stepNumber} ("${activeStep.title}"), ${activeStep.description}`);
    } finally {
      setAskLoading(false);
    }
  };

  const activeStep = visualData?.steps?.[currentStepIndex];

  return (
    <div className="min-h-screen bg-[#040812] text-slate-100 selection:bg-cyan-500 selection:text-black pt-20 pb-16">
      
      {/* Top Background Glow Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-6">
        
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/learner')}
            className="text-slate-400 hover:text-cyan-400 hover:bg-slate-900/60 rounded-xl"
          >
            <ArrowLeft size={16} className="mr-1.5" />
            <span>Learner Dashboard</span>
          </Button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowTxModal(true);
                loadTxHistory();
              }}
              className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-all flex items-center gap-1.5"
            >
              <Zap size={12} className="text-amber-400" />
              <span>x402 Ledger</span>
            </button>

            <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300">
              🔒 $0.06 USDC Pass
            </span>
          </div>
        </div>

        {/* Permanent Endpoint Info Ribbon */}
        <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono mb-4 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">PERMANENT ENDPOINT:</span>
            <code className="text-slate-200">/api/v1/x402/visual-explainer</code>
          </div>
          <div className="flex items-center gap-3">
            <span>Rate: <strong className="text-amber-400">$0.06 USDC</strong></span>
            {activeAddress ? (
              <button
                onClick={handlePayX402}
                disabled={paying}
                className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-500 text-cyan-200 hover:bg-cyan-500 hover:text-black font-bold transition-all text-[10px]"
              >
                {paying ? "Signing..." : "Test x402 Payment"}
              </button>
            ) : (
              <span className="text-slate-500 text-[10px]">(Connect Wallet to Sign)</span>
            )}
          </div>
        </div>

        {paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 mb-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono text-center"
          >
            ✓ x402 Micropayment of $0.06 USDC settled on Algorand MainNet! Logged in endpoint transaction ledger.
          </motion.div>
        )}

        {/* Search Bar & Prompt Selection */}
        <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-md mb-6">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={inputTopic}
                onChange={(e) => setInputTopic(e.target.value)}
                placeholder="Ask any concept: 'Explain Load Balancing', 'Token Streaming', 'Caching'..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-medium"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-5 py-3 shadow-lg shadow-cyan-500/20"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Visualize"}
            </Button>
          </form>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/80">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Popular Blueprints:</span>
            {PRESET_TOPICS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputTopic(preset.query);
                  setSearchParams({ q: preset.query });
                }}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all border ${
                  inputTopic.toLowerCase().includes(preset.label.toLowerCase())
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="w-full py-24 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
              <Sparkles size={28} className="animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <h3 className="text-lg font-black text-white">Synthesizing Interactive Schematic</h3>
            <p className="text-xs font-mono text-cyan-400/80 mt-1">Generating 3D isometric animation nodes & real-world telemetry...</p>
          </div>
        )}

        {/* Locked / Paywall State */}
        {!loading && !visualData && (
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-5 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-cyan-500/20 animate-bounce">
              🔒
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold">
                <span>⚡ Algorand x402 Micropayment</span>
                <span>•</span>
                <span>$0.06 USDC</span>
              </div>
              <h3 className="text-xl font-black text-white">Unlock 3D Visual Concept Explainer &amp; AI Answers</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Generate an interactive 3D step-by-step schematic, dynamic packet routing animations, and AI doubt solving for <span className="text-cyan-300 font-bold">"{inputTopic || 'this concept'}"</span>.
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-2 pt-2">
              <button
                onClick={handlePayX402}
                disabled={paying}
                className="w-full bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 hover:opacity-95 text-slate-950 font-black text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                {paying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Signing $0.30 USDC with Wallet...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Explainer for $0.30 USDC</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
              <p className="text-[10px] font-mono text-slate-500">
                {activeAddress ? `Connected: ${ellipseAddress(activeAddress)}` : 'Connect your Algorand wallet to sign transaction'}
              </p>
            </div>
          </div>
        )}

        {/* Loaded Visual Concept Experience */}
        {!loading && visualData && (
          <div className="space-y-6">
            
            {/* 1. Main Isometric Schematic Stage */}
            <IsometricStage
              conceptTitle={visualData.title}
              conceptSubtitle={visualData.subtitle}
              authorBadge={visualData.author}
              leftMetric={{
                label: visualData.metrics.labelLeft,
                value: visualData.metrics.valueLeft
              }}
              rightMetric={{
                label: visualData.metrics.labelRight,
                value: visualData.metrics.valueRight
              }}
              caption={activeStep?.caption}
            >
              {visualData.visualType === 'token_streaming' ? (
                <TokenStreamingVisual
                  stepNumber={activeStep?.stepNumber || 1}
                  isPlaying={isPlaying}
                />
              ) : visualData.visualType === 'request_distribution' ? (
                <RequestDistributionVisual
                  stepNumber={activeStep?.stepNumber || 1}
                  isPlaying={isPlaying}
                  highlightNodes={activeStep?.highlightNodes}
                  animationMode={activeStep?.animation}
                />
              ) : (
                <UniversalVisualizer
                  concept={visualData.concept || visualData.title}
                  visualType={visualData.visualType || 'universal'}
                  stepNumber={activeStep?.stepNumber || 1}
                  isPlaying={isPlaying}
                  highlightNodes={activeStep?.highlightNodes}
                  animationMode={activeStep?.animation}
                  stepTitle={activeStep?.title}
                />
              )}
            </IsometricStage>

            {/* 2. Step Playback & Controls Bar */}
            <StepControls
              currentStep={(activeStep?.stepNumber) || 1}
              totalSteps={visualData.steps.length}
              isPlaying={isPlaying}
              isSpeaking={isSpeaking}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              onReplay={handleReplay}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              onToggleSpeech={toggleSpeech}
              onSelectStep={(num) => setCurrentStepIndex(num - 1)}
            />

            {/* 3. Step Explanation Details Card */}
            {activeStep && (
              <motion.div
                key={activeStep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 tracking-wider">
                    Step {activeStep.stepNumber} of {visualData.steps.length}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Duration: ~{Math.round(visualData.duration / visualData.steps.length)}s
                  </span>
                </div>
                <h3 className="text-xl font-black text-white tracking-tight mb-2">
                  {activeStep.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-normal">
                  {activeStep.description}
                </p>
              </motion.div>
            )}

            {/* 4. Real-World Use Case & Ask Contextual Question */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Real World Example */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase mb-2">
                    <Globe size={16} />
                    <span>Real-World Implementation</span>
                  </div>
                  <h4 className="text-sm font-black text-white mb-2">Where do you see this in production?</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {visualData.realWorldExample}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Architecture Pattern</span>
                  <span className="text-cyan-400 font-semibold">{visualData.visualType}</span>
                </div>
              </div>

              {/* Ask About This Step Mini-Drawer */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
                <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase mb-2">
                  <MessageSquare size={16} />
                  <span>Ask About Step {activeStep?.stepNumber}</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">Have a question about what happens in this exact step?</p>
                
                <form onSubmit={handleAskStep} className="flex gap-2">
                  <input
                    type="text"
                    value={askQuestion}
                    onChange={(e) => setAskQuestion(e.target.value)}
                    placeholder={`Why did this happen in step ${activeStep?.stepNumber}?`}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={askLoading}
                    className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3"
                  >
                    {askLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </Button>
                </form>

                {askAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 leading-relaxed font-sans"
                  >
                    {askAnswer}
                  </motion.div>
                )}
              </div>

            </div>

            {/* 5. Concept Mastery Quick Challenge */}
            {visualData.challenge && (
              <QuizCard challenge={visualData.challenge} />
            )}

          </div>
        )}

      </div>

      {/* x402 Transactions Ledger Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Endpoint Transaction History</h3>
                  <p className="text-[10px] font-mono text-cyan-400">/api/v1/x402/visual-explainer</p>
                </div>
              </div>
              <button
                onClick={() => setShowTxModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="py-4 max-h-80 overflow-y-auto space-y-2">
              {loadingTx ? (
                <div className="py-8 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin text-cyan-400" />
                  <span>Loading ledger from MongoDB...</span>
                </div>
              ) : txHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-mono">
                  No recorded transactions yet for this endpoint.
                </div>
              ) : (
                txHistory.map((tx, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">{tx.serviceId || 'visual_explainer'}</div>
                      <div className="text-[10px] text-slate-500">Wallet: {ellipseAddress(tx.walletAddress)}</div>
                      <div className="text-[10px] text-slate-600">Tx: {tx.txHash ? tx.txHash.substring(0, 16) + '...' : 'N/A'}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-400 font-bold">${tx.amount} {tx.currency || 'USDC'}</span>
                      <div className="text-[10px] text-slate-500">{new Date(tx.timestamp || tx.createdAt).toLocaleTimeString()}</div>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-[9px] text-emerald-300">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>Total Transactions: {txHistory.length}</span>
              <a
                href="https://facilitator.goplausible.xyz/dashboard/merchants/c2e058960979f0f2"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline"
              >
                View on GoPlausible Facilitator →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
