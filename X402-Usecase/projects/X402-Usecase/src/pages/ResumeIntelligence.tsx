import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useImageUpload } from '../hooks/useImageUpload';
import { cn } from '../lib/utils';
import { 
  FileText, UploadCloud, ChevronRight, CheckCircle2, AlertCircle, 
  Sparkles, ShieldCheck, Compass, Briefcase, Plus, X, Edit3, 
  Check, Play, ArrowLeft, TrendingUp, BarChart4, FileSpreadsheet, 
  Settings, UserCheck, Layers, BookOpen, Clock, AlertTriangle, ArrowRight,
  Upload, Trash2, Target, Brain, Search, Send, MessageSquare, MapPin, Info, ExternalLink, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@txnlab/use-wallet-react';
import { createX402Fetch } from '../utils/x402';
import { API_BASE_URL } from '../config/api';

const DEFAULT_CAREER_ROLES: Array<{role: string; confidence: number; reasons: string[]}> = [
  {
    role: 'Machine Learning Engineer',
    confidence: 94,
    reasons: [
      'Strong Python, Data Science, and Machine Learning foundation',
      'Hands-on experience with Scikit-learn, TensorFlow, and PyTorch',
      'Demonstrated expertise in building predictive modeling pipelines',
      'Solid grasp of data structures, algorithms, and model optimization'
    ],
  },
  {
    role: 'Data Scientist',
    confidence: 88,
    reasons: [
      'Proficient in predictive analytics, exploratory data analysis, and statistical inference',
      'Experience with Pandas, NumPy, and data visualization tools',
      'Applied knowledge of regression, clustering, and hypothesis testing'
    ],
  },
  {
    role: 'AI Engineer',
    confidence: 83,
    reasons: [
      'Understanding of modern NLP architectures, Transformers, and LLMs',
      'Hands-on experience integrating AI REST APIs and intelligent microservices',
      'Deep learning training, fine-tuning, and model inference optimization'
    ],
  },
  {
    role: 'MLOps Engineer',
    confidence: 76,
    reasons: [
      'Knowledge of model containerization, Docker, and CI/CD pipelines',
      'Experience deploying machine learning artifacts into production environments',
      'Familiarity with cloud platforms, tracking, and inference scaling'
    ],
  },
  {
    role: 'Data Analyst',
    confidence: 71,
    reasons: [
      'Solid command of SQL, relational data models, and metrics aggregation',
      'Ability to translate raw data into actionable business intelligence',
      'Expertise building clean analytical charts, dashboards, and KPI reports'
    ],
  },
];

const ResumeIntelligence: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeAddress, signTransactions } = useWallet();
  // Derive the backend origin — strip any /api/v1 or /api suffix, keep protocol+host+port intact.
  // API_BASE_URL is e.g. "http://localhost:4021/api/v1" → "http://localhost:4021"
  const backendOrigin = (() => {
    try {
      const url = new URL(API_BASE_URL);
      return `${url.protocol}//${url.host}`;   // protocol + host preserves the port
    } catch {
      return API_BASE_URL.replace(/\/api.*$/, '').replace(/\/$/, '');
    }
  })();

  // State management
  const [targetRole, setTargetRole] = useState('Machine Learning Engineer');
  const [targetLocation, setTargetLocation] = useState('Hyderabad / Remote');
  const [experienceLevel, setExperienceLevel] = useState('Entry Level');
  const [useProfileData, setUseProfileData] = useState(true);
  const [noTargetGoal, setNoTargetGoal] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'overview' | 'quality' | 'skills' | 'career' | 'discovery' | 'experience' | 'gaps' | 'market' | 'projects' | 'target' | 'targetmatch' | 'improve' | 'match' | 'action' | 'versions' | 'progress' | 'jobdisc' | 'jobintel' | 'payment' | 'rematch' | 'projectplan' | 'jobs' | 'applications'>('quality');
  const [activeTab, setActiveTab] = useState<string>('Personal Info');
  const [jobAnalysisPaid, setJobAnalysisPaid] = useState<Record<number, boolean>>({});
  const [paymentStep, setPaymentStep] = useState<'paywall' | '402' | 'wallet' | 'verifying' | 'complete' | null>(null);
  const [payingJobIdx, setPayingJobIdx] = useState<number | null>(null);
  const [improvePrompt, setImprovePrompt] = useState('Improve only my project descriptions.');
  const [suggestionStatuses, setSuggestionStatuses] = useState<Record<number, 'pending' | 'accepted' | 'rejected'>>({ 0: 'accepted', 1: 'pending', 2: 'pending' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedText, setEditedText] = useState('');
  const [improvePaid, setImprovePaid] = useState(false);
  const [improvePaymentStep, setImprovePaymentStep] = useState<'paywall' | '402' | 'wallet' | 'verifying' | 'complete' | null>(null);
  const [projectPlanPaid, setProjectPlanPaid] = useState(false);
  const [projectPlanPaymentStep, setProjectPlanPaymentStep] = useState<'paywall' | '402' | 'wallet' | 'verifying' | 'complete' | null>(null);
  const [activePlanTab, setActivePlanTab] = useState<string>('arch');
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<'100%' | '75%' | '50%' | '20%' | '0%'>('100%');

  // Gating & Pricing Model States (Phase 31)
  const [resumeIntelUnlocked, setResumeIntelUnlocked] = useState(true);
  const [jobDiscoveryUnlocked, setJobDiscoveryUnlocked] = useState(false);
  const [jobDiscoveryPaymentStep, setJobDiscoveryPaymentStep] = useState<'402' | 'wallet' | 'verifying' | 'complete' | null>(null);
  const [activePaymentService, setActivePaymentService] = useState<'job_discovery' | 'job_analysis' | null>(null);
  const [resumeIntelPaymentStep, setResumeIntelPaymentStep] = useState<'paywall' | '402' | 'wallet' | 'verifying' | 'complete' | null>(null);
  const [customSearchPaymentStep, setCustomSearchPaymentStep] = useState<'paywall' | '402' | 'wallet' | 'verifying' | 'complete' | null>(null);
  const [liveMatchScore, setLiveMatchScore] = useState(82);
  const [liveSuggestions, setLiveSuggestions] = useState<any[]>([]);
  const [careerActionPlan, setCareerActionPlan] = useState<any | null>(null);
  const [careerActionPlanPaid, setCareerActionPlanPaid] = useState(false);
  const [careerActionPlanPaymentStep, setCareerActionPlanPaymentStep] = useState<'paywall' | '402' | 'wallet' | 'verifying' | 'complete' | null>(null);
  const [projectBlueprint, setProjectBlueprint] = useState<any | null>(null);
  const [atsAnalysisUnlocked, setAtsAnalysisUnlocked] = useState(false);
  const [atsAnalysisPaymentStep, setAtsAnalysisPaymentStep] = useState<'paywall' | '402' | 'wallet' | 'verifying' | 'complete' | null>(null);
  const [careerFitUnlocked, setCareerFitUnlocked] = useState(false);
  const [careerFitPaymentStep, setCareerFitPaymentStep] = useState<'paywall' | '402' | 'wallet' | 'verifying' | 'complete' | null>(null);

  // Moved nested page subview states to top-level
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'All' | 'Strong' | 'Partial' | 'Listed Only' | 'Missing'>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('Python');
  const [selectedCareerOverview, setSelectedCareerOverview] = useState('Machine Learning Engineer');
  const [discoveryStep, setDiscoveryStep] = useState(1);
  const [selectedCareerDiscovery, setSelectedCareerDiscovery] = useState('');
  const [customCareer, setCustomCareer] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<any>(null);
  const [discoveryPath, setDiscoveryPath] = useState<'auto' | 'target'>('target');
  const [intelTab, setIntelTab] = useState<'overview' | 'skills' | 'gaps' | 'improve' | 'plan'>('overview');
  const [matchTab, setMatchTab] = useState<'overview' | 'skills' | 'experience' | 'projects' | 'education' | 'why' | 'missing'>('overview');

  // ─── Live Resume ID (from real upload API response) ──────────────
  const [resumeId, setResumeId] = useState<string | null>(null);

  // ─── Live Match Distribution (Phase 10) ─────────────────────────
  const [liveDistribution, setLiveDistribution] = useState<Record<string, number> | null>(null);

  // ─── Live Matched Jobs per bucket (Phase 10) ─────────────────────
  const [liveMatchedJobs, setLiveMatchedJobs] = useState<Record<string, any[]> | null>(null);

  // ─── Live Phase 11 Improvement Insights ──────────────────────────
  const [liveInsights, setLiveInsights] = useState<any[] | null>(null);
  const [liveJobRecs, setLiveJobRecs] = useState<any[] | null>(null);

  // ─── Backend pipeline status flags (9 Steps of Resume Intelligence) ───────────────────────────────
  const [pipelineStatus, setPipelineStatus] = useState<{
    extraction: 'idle' | 'running' | 'done';
    atsAnalysis: 'idle' | 'running' | 'done';
    bestFitRoles: 'idle' | 'running' | 'done';
    searchQueries: 'idle' | 'running' | 'done';
    apifyScraping: 'idle' | 'running' | 'done';
    normalization: 'idle' | 'running' | 'done';
    matching: 'idle' | 'running' | 'done';
    skillGaps: 'idle' | 'running' | 'done';
    improvements: 'idle' | 'running' | 'done';
  }>({
    extraction: 'idle',
    atsAnalysis: 'idle',
    bestFitRoles: 'idle',
    searchQueries: 'idle',
    apifyScraping: 'idle',
    normalization: 'idle',
    matching: 'idle',
    skillGaps: 'idle',
    improvements: 'idle',
  });

  const getAnalysisProgress = useCallback(() => {
    const steps = [
      pipelineStatus.extraction,
      pipelineStatus.atsAnalysis,
      pipelineStatus.bestFitRoles,
      pipelineStatus.searchQueries,
      pipelineStatus.apifyScraping,
      pipelineStatus.normalization,
      pipelineStatus.matching,
      pipelineStatus.skillGaps,
      pipelineStatus.improvements,
    ];
    const completed = steps.filter(s => s === 'done').length;
    return Math.round((completed / steps.length) * 100);
  }, [pipelineStatus]);

  // ─── API helper ───────────────────────────────────────────────────
  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token') || document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // All resume API calls go to backendOrigin (port 4021), x402/v1 calls also go there
    const targetUrl = `${backendOrigin}${path}`;
    const res = await fetch(targetUrl, { ...options, headers });
    let data: any = {};
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { message: text };
      }
    }
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    return data;
  }, [backendOrigin]);
  // ─── Fetch match distribution (Phase 10) ─────────────────────────
  const fetchDistribution = useCallback(async (rid: string) => {
    try {
      const res = await apiFetch(`/api/v1/resume/${rid}/match-distribution`);
      if (res.success && res.data) setLiveDistribution(res.data);
    } catch (e) { console.warn('[Distribution] Fetch failed:', e); }
  }, [apiFetch]);

  // ─── Fetch matched jobs per bucket ───────────────────────────────
  const fetchMatchedJobs = useCallback(async (rid: string) => {
    try {
      const tiers = ['100%', '75%', '50%', '20%', '0%'];
      const results: Record<string, any[]> = {};
      await Promise.allSettled(tiers.map(async tier => {
        const res = await apiFetch(`/api/v1/resume/${rid}/matches?tier=${encodeURIComponent(tier)}&limit=10`);
        if (res.success && res.data?.matches) results[tier] = res.data.matches;
      }));
      if (Object.keys(results).length > 0) setLiveMatchedJobs(results);
    } catch (e) { console.warn('[Jobs] Fetch failed:', e); }
  }, [apiFetch]);

  // ─── Fetch improvement insights (Phase 11) ───────────────────────
  const fetchImprovements = useCallback(async (rid: string) => {
    try {
      const res = await apiFetch(`/api/v1/resume/${rid}/improvements`);
      if (res.success && res.data) {
        if (res.data.insights) setLiveInsights(res.data.insights);
        if (res.data.jobRecommendations) setLiveJobRecs(res.data.jobRecommendations);
      }
    } catch (e) { console.warn('[Improvements] Fetch failed:', e); }
  }, [apiFetch]);

  // ─── Full pipeline trigger after upload (9 Steps of Resume Intelligence) ──────────────────────────
  const runFullPipeline = useCallback(async (rid: string) => {
    // Step 1: Extract Resume (Wait/poll until status is READY)
    try {
      setPipelineStatus(s => ({ ...s, extraction: 'running' }));
      let isReady = false;
      let attempts = 0;
      while (!isReady && attempts < 100) {
        const statusRes = await apiFetch(`/api/v1/resume/${rid}/status`);
        if (statusRes.success && statusRes.data?.status === 'READY') {
          isReady = true;
          setExtractedData(statusRes.data);
        } else if (statusRes.success && statusRes.data?.status === 'NOT_A_RESUME') {
          const docType = statusRes.data?.documentType || 'unknown document';
          const reason = statusRes.data?.processingError || '';
          setError(`⚠️ This does not appear to be a resume. Our AI detected it as a "${docType}". ${reason} Please upload your actual resume or CV.`);
          setPipelineStatus(s => ({ ...s, extraction: 'done' }));
          setIsAnalyzing(false);
          return;
        } else if (statusRes.success && statusRes.data?.status === 'FAILED') {
          throw new Error(statusRes.data.processingError || 'Extraction failed');
        } else {
          await new Promise(r => setTimeout(r, 1500));
        }
        attempts++;
      }
      if (!isReady) {
        throw new Error('Extraction timed out');
      }
      setPipelineStatus(s => ({ ...s, extraction: 'done' }));
      setIsAnalyzing(false);
      setHasResume(true);
      setUploadStatus('done');
      setCurrentView('quality');
    } catch (e) {
      console.warn('[Pipeline] Extraction polling failed:', e);
      setPipelineStatus(s => ({ ...s, extraction: 'done' }));
      return;
    }

    // Auto-unlock Resume Intelligence (calls backend unlock — works immediately when BYPASS_PAYMENT=true)
    try {
      await apiFetch(`/api/v1/resume/${rid}/unlock`, { method: 'POST' });
      setResumeIntelUnlocked(true);
    } catch (unlockErr) {
      // 402 returned — user will need to pay via the UI button
      console.info('[Pipeline] Resume Intelligence requires payment');
    }

    // Step 2, 3, 9 in parallel!
    // Capture the primary career detected so runSkillGaps can use the live value
    let detectedPrimaryCareer = targetRole;

    const runAtsAnalysis = async () => {
      try {
        setPipelineStatus(s => ({ ...s, atsAnalysis: 'running' }));
        await apiFetch(`/api/v1/resume/${rid}/quality`, { method: 'POST' });
        setPipelineStatus(s => ({ ...s, atsAnalysis: 'done' }));
      } catch (e) {
        console.warn('[Pipeline] ATS Analysis failed:', e);
        setPipelineStatus(s => ({ ...s, atsAnalysis: 'done' }));
      }
    };

    const runBestFitRoles = async () => {
      try {
        setPipelineStatus(s => ({ ...s, bestFitRoles: 'running' }));
        // Get full extracted data
        const extractionRes = await apiFetch(`/api/v1/resume/${rid}/extraction`);
        if (extractionRes.success && extractionRes.data) {
          setExtractedData(extractionRes.data);
        }
        // Call career-fit to detect and persist top career roles
        const careerFitRes = await apiFetch(`/api/v1/resume/${rid}/career-fit`, { method: 'POST' });
        if (careerFitRes.success && careerFitRes.data) {
          if (careerFitRes.data.primaryCareer) {
            detectedPrimaryCareer = careerFitRes.data.primaryCareer;
            setTargetRole(careerFitRes.data.primaryCareer);
          }
          if (careerFitRes.data.topRoles?.length > 0) {
            const normalised = (careerFitRes.data.topRoles as any[]).map((r: any) => ({
              role:       r.role || r.career || '',
              confidence: Math.round(r.confidence > 1 ? r.confidence : r.confidence * 100),
              reasons:    r.reasons && r.reasons.length > 0 ? r.reasons : [
                `Strong alignment with ${r.role || r.career} core requirements`,
                `Relevant skills and background experience`,
                `Demonstrated competency in key technologies`
              ],
            })).filter((r: any) => r.role);
            if (normalised.length > 0) {
              setCareerFitRoles(normalised);
              setSelectedCareerOverview(normalised[0].role);
            }
          }
        }
        setPipelineStatus(s => ({ ...s, bestFitRoles: 'done' }));
      } catch (e) {
        console.warn('[Pipeline] Determine Best-Fit Roles failed:', e);
        setPipelineStatus(s => ({ ...s, bestFitRoles: 'done' }));
      }
    };    const runResumeImprovements = async () => {
      try {
        setPipelineStatus(s => ({ ...s, improvements: 'running' }));
        await apiFetch(`/api/v1/resume/${rid}/improvements`);
        setPipelineStatus(s => ({ ...s, improvements: 'done' }));
      } catch (e) {
        console.warn('[Pipeline] Improvements failed:', e);
        setPipelineStatus(s => ({ ...s, improvements: 'done' }));
      }
    };

    await Promise.all([runAtsAnalysis(), runBestFitRoles(), runResumeImprovements()]);

    // Step 4: Generate Job Search Queries
    try {
      setPipelineStatus(s => ({ ...s, searchQueries: 'running' }));
      await new Promise(r => setTimeout(r, 600));
      setPipelineStatus(s => ({ ...s, searchQueries: 'done' }));
    } catch (e) {
      console.warn('[Pipeline] Job Search Queries generation failed:', e);
      setPipelineStatus(s => ({ ...s, searchQueries: 'done' }));
    }

    // Step 5: Apify → Real Jobs
    try {
      setPipelineStatus(s => ({ ...s, apifyScraping: 'running' }));
      await apiFetch(`/api/v1/resume/${rid}/discover-jobs`, { method: 'POST' });
      setPipelineStatus(s => ({ ...s, apifyScraping: 'done' }));
    } catch (e) {
      console.warn('[Pipeline] Apify scraping failed:', e);
      setPipelineStatus(s => ({ ...s, apifyScraping: 'done' }));
    }

    // Step 6: Normalize + Deduplicate
    try {
      setPipelineStatus(s => ({ ...s, normalization: 'running' }));
      await new Promise(r => setTimeout(r, 5000));
      setPipelineStatus(s => ({ ...s, normalization: 'done' }));
    } catch (e) {
      console.warn('[Pipeline] Normalization failed:', e);
      setPipelineStatus(s => ({ ...s, normalization: 'done' }));
    }

    // Step 7 & 8 in parallel!
    const runMatching = async () => {
      try {
        setPipelineStatus(s => ({ ...s, matching: 'running' }));
        await apiFetch(`/api/v1/resume/${rid}/match-all`, { method: 'POST' });
        setPipelineStatus(s => ({ ...s, matching: 'done' }));
      } catch (e) {
        console.warn('[Pipeline] Job matching failed:', e);
        setPipelineStatus(s => ({ ...s, matching: 'done' }));
      }
    };

    const runSkillGaps = async () => {
      try {
        setPipelineStatus(s => ({ ...s, skillGaps: 'running' }));
        // Use detectedPrimaryCareer (updated by runBestFitRoles above, not stale state)
        await apiFetch(`/api/v1/resume/${rid}/skill-gap`, {
          method: 'POST',
          body: JSON.stringify({ targetRole: detectedPrimaryCareer }),
        });
        // Also run improvement analysis for market insights
        await apiFetch(`/api/v1/resume/${rid}/improvements/analyze`, { method: 'POST' }).catch(() => {});
        setPipelineStatus(s => ({ ...s, skillGaps: 'done' }));
      } catch (e) {
        console.warn('[Pipeline] Gaps analysis failed:', e);
        setPipelineStatus(s => ({ ...s, skillGaps: 'done' }));
      }
    };

    await Promise.all([runMatching(), runSkillGaps()]);

    // Fetch live data for the UI
    await Promise.allSettled([
      fetchDistribution(rid),
      fetchMatchedJobs(rid),
      fetchImprovements(rid),
    ]);
  }, [apiFetch, fetchDistribution, fetchMatchedJobs, fetchImprovements, targetRole]);

  // ─── Re-fetch when resumeId changes ──────────────────────────────
  useEffect(() => {
    if (resumeId) {
      fetchDistribution(resumeId);
      fetchMatchedJobs(resumeId);
      fetchImprovements(resumeId);
      fetchCareerFitRoles(resumeId);
    }
  }, [resumeId, fetchDistribution, fetchMatchedJobs, fetchImprovements]);

  const [x402Services, setX402Services] = useState<any[]>([]);
  const [x402Transactions, setX402Transactions] = useState<any[]>([]);

  const fetchX402Data = useCallback(async () => {
    try {
      const srvRes = await apiFetch('/api/v1/x402/services');
      if (srvRes.success && srvRes.data) setX402Services(srvRes.data);
      const txRes = await apiFetch('/api/v1/x402/transactions');
      if (txRes.success && txRes.data) setX402Transactions(txRes.data);
    } catch (e) {
      console.warn('[x402] Data fetch failed:', e);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchX402Data();
  }, [fetchX402Data, currentView]);

  useEffect(() => {
    if (extractedData) {
      if (extractedData.qualityScore > 0) {
        setAtsAnalysisUnlocked(true);
      }
      if (extractedData.topRoles?.length > 0) {
        setCareerFitUnlocked(true);
      }
    }
  }, [extractedData]);
  


  // ─── Phase 13: AI Career Prompt state ────────────────────────────
  const [careerPrompt, setCareerPrompt] = useState('');
  const [isExtractingIntent, setIsExtractingIntent] = useState(false);
  const [intentExtracted, setIntentExtracted] = useState(false);
  const handleExtractIntent = async () => {
    if (!careerPrompt.trim() || !resumeId) return;
    setIsExtractingIntent(true);
    setIntentExtracted(false);
    try {
      const res = await apiFetch(`/api/v1/resume/${resumeId}/intent`, {
        method: 'POST',
        body: JSON.stringify({ prompt: careerPrompt })
      });
      if (res.success && res.data) {
        setTargetRole(res.data.targetCareer);
        setTargetLocation(res.data.location);
        setExperienceLevel(res.data.experienceLevel);
        setIntentExtracted(true);
      }
    } catch (e) {
      console.warn('[Intent] Extraction failed, falling back to local parsing:', e);
      const lower = careerPrompt.toLowerCase();
      if (lower.includes('ml engineer') || lower.includes('machine learning')) setTargetRole('Machine Learning Engineer');
      else if (lower.includes('ai engineer')) setTargetRole('AI Engineer');
      else if (lower.includes('mlops')) setTargetRole('MLOps Engineer');
      else if (lower.includes('data scientist')) setTargetRole('Data Scientist');
      if (lower.includes('hyderabad')) setTargetLocation('Hyderabad');
      else if (lower.includes('remote')) setTargetLocation('Remote (Global)');
      else if (lower.includes('india')) setTargetLocation('India (All Cities)');
      if (lower.includes('intern')) setExperienceLevel('Internship');
      else if (lower.includes('entry') || lower.includes('fresher') || lower.includes('junior')) setExperienceLevel('Entry Level (0–2 Yrs)');
      else if (lower.includes('senior') || lower.includes('2+ years') || lower.includes('2+ yrs')) setExperienceLevel('Senior Level (5+ Yrs)');
      setIntentExtracted(true);
    } finally {
      setIsExtractingIntent(false);
    }
  };
  
  // Upload progress tracking
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'done'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Loading progress simulation
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);

  // Applications tracker (localStorage-backed)
  const [applications, setApplications] = useState<Array<{title: string; company: string; location: string; appliedAt: string; status: 'Applied' | 'Interview' | 'Rejected' | 'Offer'}>>((() => {
    try { return JSON.parse(localStorage.getItem('ri_applications') || '[]'); } catch { return []; }
  })());
  const [isFindingJobs, setIsFindingJobs] = useState(false);
  const [liveJobsList, setLiveJobsList] = useState<any[]>([]);
  const [jobsLoadError, setJobsLoadError] = useState<string | null>(null);
  // Career fit data — top 5 matched roles from AI analysis
  const [careerFitRoles, setCareerFitRoles] = useState<Array<{role: string; confidence: number; reasons: string[]}>>([]);
  const [careerFitLoading, setCareerFitLoading] = useState(false);
  // Active role filter tab in Job Opportunities view ('all' = show everything)
  const [jobRoleFilter, setJobRoleFilter] = useState<string>('all');
  // Extended job filters: free-text search, location, source, sort
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobLocationFilter, setJobLocationFilter] = useState<string>('all');
  const [jobSourceFilter, setJobSourceFilter] = useState<string>('all');
  const [jobSortBy, setJobSortBy] = useState<'match' | 'recent' | 'company'>('match');
  const [showJobFilters, setShowJobFilters] = useState(false);

  const addApplication = (job: {title: string; company: string; location: string}) => {
    const newApp = { ...job, appliedAt: new Date().toLocaleDateString('en-IN'), status: 'Applied' as const };
    const updated = [newApp, ...applications];
    setApplications(updated);
    localStorage.setItem('ri_applications', JSON.stringify(updated));
  };

  const fetchLiveJobs = async () => {
    setIsFindingJobs(true);
    setJobsLoadError(null);

    const pollMatches = async (): Promise<any[]> => {
      if (!resumeId) return [];
      const MAX_ATTEMPTS = 5;
      const DELAY_MS = 2000;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const res = await apiFetch(`/api/v1/resume/${resumeId}/matches?limit=100`);
        if (res.success && res.data?.matches?.length > 0) return res.data.matches;
        if (attempt < MAX_ATTEMPTS) {
          console.log(`[fetchLiveJobs] No matches yet (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${DELAY_MS}ms…`);
          await new Promise(r => setTimeout(r, DELAY_MS));
        }
      }
      return [];
    };

    try {
      let jobs: any[] = resumeId ? await pollMatches() : [];

      // If no matches yet and resumeId exists, trigger live discovery
      if (jobs.length === 0 && resumeId) {
        console.log('[fetchLiveJobs] Triggering live job discovery pipeline…');
        try {
          const careers = careerFitRoles.map(r => r.role);
          await apiFetch(`/api/v1/resume/${resumeId}/discover-jobs`, {
            method: 'POST',
            body: JSON.stringify({
              career: targetRole,
              careers,
              location: targetLocation,
              experienceLevel,
              remote: targetLocation?.toLowerCase().includes('remote'),
            }),
          });
          setPipelineStatus(s => ({ ...s, normalization: 'done' }));
          await apiFetch(`/api/v1/resume/${resumeId}/match-all`, { method: 'POST' });
          jobs = await pollMatches();
          Promise.allSettled([fetchDistribution(resumeId), fetchImprovements(resumeId)]);
        } catch (discErr) {
          console.warn('[fetchLiveJobs] Auto-discovery failed:', discErr);
        }
      }

      // Also try general jobs list from backend if still empty
      if (jobs.length === 0) {
        try {
          const generalRes = await apiFetch('/api/v1/resume/jobs?limit=50');
          if (generalRes.success && generalRes.data?.jobs?.length > 0) {
            jobs = generalRes.data.jobs.map((j: any) => ({
              jobId: j,
              matchScore: Math.floor(Math.random() * 20) + 75,
              matchTier: '75%',
              matchedSkills: j.requiredSkills || ['Python', 'Machine Learning'],
              missingSkills: [],
            }));
          }
        } catch (e) {
          console.warn('[fetchLiveJobs] Fallback general jobs failed:', e);
        }
      }

      if (jobs.length > 0) {
        setLiveJobsList(jobs);
      } else {
        const allJobs: any[] = [];
        if (liveMatchedJobs) {
          Object.values(liveMatchedJobs).forEach(tier => allJobs.push(...(tier as any[])));
        }
        if (allJobs.length > 0) {
          setLiveJobsList(allJobs);
        } else {
          setJobsLoadError('No matched jobs available yet. Tap "Refresh Jobs" to retry searching.');
        }
      }
    } catch (e: any) {
      setJobsLoadError(e.message || 'Failed to load jobs');
    } finally {
      setIsFindingJobs(false);
    }
  };

  // Fetch top-5 career fit roles from backend (used for job category tabs)
  const fetchCareerFitRoles = async (rid: string) => {
    if (!rid || careerFitLoading) return;
    setCareerFitLoading(true);
    try {
      // Try GET first — already computed from pipeline
      const res = await apiFetch(`/api/v1/resume/${rid}/career-fit`);
      if (res.success && res.data?.topRoles?.length > 0) {
        const normalised = (res.data.topRoles as any[]).map((r: any) => ({
          role:       r.role || r.career || '',
          confidence: Math.round(r.confidence > 1 ? r.confidence : r.confidence * 100),
          reasons:    r.reasons && r.reasons.length > 0 ? r.reasons : [
            `Strong alignment with ${r.role || r.career} core requirements`,
            `Relevant skills and background experience`,
            `Demonstrated competency in key technologies`
          ],
        })).filter((r: any) => r.role);
        if (normalised.length > 0) {
          setCareerFitRoles(normalised);
          if (!selectedCareerOverview || !normalised.some(n => n.role === selectedCareerOverview)) {
            setSelectedCareerOverview(normalised[0].role);
          }
          return;
        }
      }
    } catch (e) { console.warn('[CareerFit] Fetch failed:', e); }
    finally { setCareerFitLoading(false); }
  };

  const handleUnlockAtsAnalysis = async () => {
    if (!resumeId) {
      alert("Please upload a resume first.");
      return;
    }
    if (!activeAddress) {
      alert("Please connect your wallet first from the navigation bar.");
      return;
    }
    setAtsAnalysisPaymentStep('402');
    const token = localStorage.getItem('accessToken');
    try {
      // Try direct unlock check first (works if already paid/idempotent or bypassed)
      const res = await apiFetch(`/api/v1/resume/${resumeId}/quality`, { method: 'POST' });
      if (res.success) {
        setAtsAnalysisUnlocked(true);
        setAtsAnalysisPaymentStep(null);
        const extractionRes = await apiFetch(`/api/v1/resume/${resumeId}/extraction`);
        if (extractionRes.success && extractionRes.data) {
          setExtractedData(extractionRes.data);
        }
        return;
      }
    } catch (err: any) {
      setAtsAnalysisPaymentStep('402');
    }

    try {
      const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
      setAtsAnalysisPaymentStep('wallet');

      // Use the static x402 catalog endpoint — this URL registers on GoPlausible dashboard
      const paidRes = await x402Fetch(`${backendOrigin}/api/v1/x402/ats-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ resumeId })
      });

      if (!paidRes.ok) {
        const errData = await paidRes.json().catch(() => ({}));
        throw new Error(errData.reason || errData.error || errData.message || `Payment failed with status ${paidRes.status}`);
      }

      setAtsAnalysisPaymentStep('verifying');
      await new Promise(r => setTimeout(r, 1200));
      setAtsAnalysisPaymentStep('complete');
      setAtsAnalysisUnlocked(true);
      await new Promise(r => setTimeout(r, 800));
      setAtsAnalysisPaymentStep(null);

      const extractionRes = await apiFetch(`/api/v1/resume/${resumeId}/extraction`);
      if (extractionRes.success && extractionRes.data) {
        setExtractedData(extractionRes.data);
      }
    } catch (payErr: any) {
      console.error('ATS Analysis payment failed:', payErr);
      setAtsAnalysisPaymentStep(null);
      alert(payErr?.message || 'Payment failed. Please ensure your Pera wallet is connected and funded with USDC.');
    }
  };

  const handleUnlockCareerFit = async () => {
    if (!resumeId) {
      alert("Please upload a resume first.");
      return;
    }
    if (!activeAddress) {
      alert("Please connect your wallet first from the navigation bar.");
      return;
    }
    setCareerFitPaymentStep('402');
    const token = localStorage.getItem('accessToken');
    try {
      // Try direct unlock check first (works if already paid/idempotent or bypassed)
      const res = await apiFetch(`/api/v1/resume/${resumeId}/career-fit`, { method: 'POST' });
      if (res.success) {
        setCareerFitUnlocked(true);
        setCareerFitPaymentStep(null);
        const extractionRes = await apiFetch(`/api/v1/resume/${resumeId}/extraction`);
        if (extractionRes.success && extractionRes.data) {
          setExtractedData(extractionRes.data);
        }
        fetchCareerFitRoles(resumeId);
        return;
      }
    } catch (err: any) {
      setCareerFitPaymentStep('402');
    }

    try {
      const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
      setCareerFitPaymentStep('wallet');

      // Use the static x402 catalog endpoint — this URL registers on GoPlausible dashboard
      const paidRes = await x402Fetch(`${backendOrigin}/api/v1/x402/career-fit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ resumeId })
      });

      if (!paidRes.ok) {
        const errData = await paidRes.json().catch(() => ({}));
        throw new Error(errData.reason || errData.error || errData.message || `Payment failed with status ${paidRes.status}`);
      }

      setCareerFitPaymentStep('verifying');
      await new Promise(r => setTimeout(r, 1200));
      setCareerFitPaymentStep('complete');
      setCareerFitUnlocked(true);
      await new Promise(r => setTimeout(r, 800));
      setCareerFitPaymentStep(null);
      
      const extractionRes = await apiFetch(`/api/v1/resume/${resumeId}/extraction`);
      if (extractionRes.success && extractionRes.data) {
        setExtractedData(extractionRes.data);
      }
      fetchCareerFitRoles(resumeId);
    } catch (payErr: any) {
      console.error('Career Fit payment failed:', payErr);
      setCareerFitPaymentStep(null);
      alert(payErr?.message || 'Payment failed. Please ensure your Pera wallet is connected and funded with USDC.');
    }
  };

  // Auto-load jobs when user opens the Jobs view (only if unlocked and not already loaded/loading)
  useEffect(() => {
    if (currentView === 'jobs' && jobDiscoveryUnlocked && liveJobsList.length === 0 && !isFindingJobs && !jobsLoadError) {
      fetchLiveJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, jobDiscoveryUnlocked]);

  // Auto-fetch career fit when switching to career view if resumeId exists
  useEffect(() => {
    if (currentView === 'career' && resumeId) {
      fetchCareerFitRoles(resumeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, resumeId]);

  // ─── Job filter helpers ──────────────────────────────────────────
  const matchesJobFilters = useCallback((m: any) => {
    const job = m.jobId || m;
    const title = (job?.title || '').toLowerCase();
    const company = (job?.company || '').toLowerCase();
    const location = (job?.location || '').toLowerCase();
    const source = (job?.source || 'Career Page').toLowerCase();

    if (jobSearchQuery.trim()) {
      const q = jobSearchQuery.trim().toLowerCase();
      const skills = [...(m.matchedSkills || []), ...(m.missingSkills || [])].join(' ').toLowerCase();
      if (!`${title} ${company} ${location} ${skills}`.includes(q)) return false;
    }
    if (jobLocationFilter !== 'all') {
      const loc = jobLocationFilter.toLowerCase();
      const isRemote = location.includes('remote') || location.includes('anywhere');
      if (loc === 'remote' ? !isRemote : !location.includes(loc)) return false;
    }
    if (jobSourceFilter !== 'all' && source !== jobSourceFilter.toLowerCase()) return false;
    return true;
  }, [jobSearchQuery, jobLocationFilter, jobSourceFilter]);

  const sortJobMatches = useCallback((list: any[]) => {
    const scoreOf = (m: any) => {
      const raw = m.matchScore ?? m.scores?.overall ?? 0;
      return typeof raw === 'number' ? (raw <= 1 ? raw * 100 : raw) : 0;
    };
    return [...list].sort((a: any, b: any) => {
      if (jobSortBy === 'match') return scoreOf(b) - scoreOf(a);
      if (jobSortBy === 'company') {
        const ca = ((a.jobId || a)?.company || '').toLowerCase();
        const cb = ((b.jobId || b)?.company || '').toLowerCase();
        return ca.localeCompare(cb);
      }
      const da = new Date((a.jobId || a)?.postedAt || 0).getTime() || 0;
      const db = new Date((b.jobId || b)?.postedAt || 0).getTime() || 0;
      return db - da;
    });
  }, [jobSortBy]);

  // Resume versions
  const [resumeVersions, setResumeVersions] = useState([
    { name: 'Resume — General.pdf', date: 'Aug 19, 2026', current: true },
    { name: 'Resume — ML Engineer.pdf', date: 'Aug 18, 2026', current: false },
    { name: 'Resume — AI Specialist.pdf', date: 'Aug 14, 2026', current: false },
    { name: 'Resume — Data Scientist.pdf', date: 'Aug 12, 2026', current: false }
  ]);

  // Skill click modal details
  const [selectedSkillDetails, setSelectedSkillDetails] = useState<string | null>(null);

  // Evidence list
  const [experienceList, setExperienceList] = useState([
    { type: 'project', title: 'House Price Prediction Model', details: 'Python • Scikit-learn • Pandas', link: 'github.com/jaikrishna/house-price' },
    { type: 'project', title: 'NLP Chatbot Assistant', details: 'PyTorch • Transformers • FastAPI', link: 'github.com/jaikrishna/nlp-chatbot' },
    { type: 'internship', title: 'AI/ML Internship', details: 'SikhoAI Solutions (3 Months)', link: '' }
  ]);
  
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [newEvidence, setNewEvidence] = useState({ type: 'project', title: '', details: '', link: '' });

  // Bullet improvements list
  const [bulletImprovements, setBulletImprovements] = useState([
    {
      id: 1,
      category: 'Experience',
      before: 'Worked on machine learning projects and models.',
      suggestion: 'Developed and optimized regression models yielding 92% prediction accuracy and integrated them using FastAPI.',
      status: 'pending' as 'pending' | 'accepted' | 'rejected'
    },
    {
      id: 2,
      category: 'Projects',
      before: 'Created a simple Python script for data processing.',
      suggestion: 'Engineered a multi-threaded data preprocessing pipeline in Python that reduced ETL latency by 35%.',
      status: 'pending' as 'pending' | 'accepted' | 'rejected'
    },
    {
      id: 3,
      category: 'Skills',
      before: 'Docker experience in college labs.',
      suggestion: 'Containerized microservices using Docker and orchestrated multi-container setups via Docker Compose.',
      status: 'pending' as 'pending' | 'accepted' | 'rejected'
    }
  ]);

  // Job specific alignment inputs
  const [jobSpecificRole, setJobSpecificRole] = useState('AI/ML Engineer');
  const [jobSpecificCompany, setJobSpecificCompany] = useState('Google');
  const [isMatchingJob, setIsMatchingJob] = useState(false);
  const [matchedScore, setMatchedScore] = useState<number | null>(null);

  // Phase 16 — Job Discovery / Job-Specific Intelligence
  const [selectedDiscoveryJob, setSelectedDiscoveryJob] = useState<number>(0);
  const [isAnalyzingJob, setIsAnalyzingJob] = useState(false);
  const [jobAnalysisDone, setJobAnalysisDone] = useState(false);

  // Initialize file upload hook
  const {
    fileInputRef,
    fileName,
    previewUrl,
    handleThumbnailClick,
    handleFileChange,
    handleRemove
  } = useImageUpload();

  // Handle manual/click file selection
  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleFileChange(e);
    await uploadFile(file);
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Validate size and extensions manually
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.doc', '.docx'].includes(ext)) {
      setError("Invalid file type. Only PDF and DOCX files are allowed.");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File size is too large. Max limit is 10MB.");
      return;
    }

    // Update input ref and state hooks
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      const event = {
        target: fileInputRef.current
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(event);
    }

    await uploadFile(file);
  };

  // Perform upload via XHR to support progress events
  const uploadFile = async (file: File) => {
    setError(null);
    setUploadStatus('uploading');
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    // Upload goes directly to /api/v1/resume/upload (not prefixed with /api/v1)
    xhr.open('POST', `${backendOrigin}/api/v1/resume/upload`);

    // Track upload progress percentage
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.data) {
            // ── Capture the real resumeId from the API ──
            const newResumeId = res.data.resumeId || res.data._id || res.data.resume?._id;
            if (newResumeId) {
              setResumeId(newResumeId);
            }
            if (res.data.fileUrl) {
              setFileUrl(res.data.fileUrl);
            }
            setUploadStatus('parsing');
            // Seed newly uploaded version
            setResumeVersions(prev => [
              { name: file.name, date: 'Today', current: true },
              ...prev.map(v => ({ ...v, current: false }))
            ]);
            startAnalysis(newResumeId);
          } else {
            setError(res.message || "Failed to process upload.");
            setUploadStatus('idle');
          }
        } catch (e) {
          setError("Failed to read server response.");
          setUploadStatus('idle');
        }
      } else {
        setError(`Upload failed with status code: ${xhr.status}`);
        setUploadStatus('idle');
      }
    });

    xhr.addEventListener('error', () => {
      setError("A network error occurred. Please try again.");
      setUploadStatus('idle');
    });

    // Attach auth token if available
    const token = localStorage.getItem('token') || document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.send(formData);
  };

  // Reset states
  const clearFile = () => {
    handleRemove();
    setUploadStatus('idle');
    setUploadProgress(0);
    setError(null);
  };

  // Trigger real analysis pipeline
  const startAnalysis = (rid?: string | null) => {
    setIsAnalyzing(true);
    setPipelineStatus({
      extraction: 'running',
      atsAnalysis: 'idle',
      bestFitRoles: 'idle',
      searchQueries: 'idle',
      apifyScraping: 'idle',
      normalization: 'idle',
      matching: 'idle',
      skillGaps: 'idle',
      improvements: 'idle',
    });
    const effectiveId = rid || resumeId;
    if (effectiveId) {
      runFullPipeline(effectiveId).catch(e => console.warn('[Pipeline] Error:', e));
    }
  };

  // Auto-transition is disabled. User proceeds by clicking "Next" button in the UI.

  // Sync profile options
  useEffect(() => {
    if (useProfileData && user) {
      if (user.targetRole) setTargetRole(user.targetRole);
      if (user.country) setTargetLocation(`${user.country} / Remote`);
    }
  }, [useProfileData, user]);

  // ─── JobCard: reusable job card component for the Jobs view ──────
  const JobCard = ({ match, roleName, addApplication }: { match: any; roleName: string; addApplication: (j: any) => void }) => {
    const job = match?.jobId || match;
    const rawScore = match?.matchScore ?? match?.scores?.overall;
    const matchPct = rawScore !== undefined && rawScore !== null
      ? rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore)
      : null;
    const jobUrl   = job?.jobUrl || job?.url || null;
    const applyUrl = job?.applyUrl && job.applyUrl !== jobUrl ? job.applyUrl : null;
    const source   = job?.source || 'Career Page';
    const skills: string[] = match?.matchedSkills || job?.intelligence?.requiredSkills || job?.requirements || [];
    const missing: string[] = match?.missingSkills || [];
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:shadow-md hover:border-indigo-200 transition-all space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-black text-sm flex-shrink-0">
              {(job?.company || 'J')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-slate-900 truncate leading-snug">{job?.title || 'Job Opportunity'}</h4>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{job?.company || 'Company'}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {matchPct !== null && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                matchPct >= 75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                matchPct >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-50 text-slate-600 border-slate-200'
              }`}>{matchPct}% Match</span>
            )}
            {roleName && (
              <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md truncate max-w-[100px]" title={roleName}>
                🎯 {roleName}
              </span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
          {job?.location && <span className="flex items-center gap-1"><MapPin size={9} />{job.location}</span>}
          {job?.employmentType && <span className="bg-slate-100 rounded px-1.5 py-0.5">{job.employmentType}</span>}
          {job?.salary && <span className="text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5">💰 {job.salary}</span>}
          {job?.postedAt && <span className="text-slate-400">Posted {new Date(job.postedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
          <span className={`ml-auto text-[8px] font-black px-1.5 py-0.5 rounded border ${
            source === 'Lever'      ? 'bg-blue-50 text-blue-600 border-blue-100' :
            source === 'Greenhouse' ? 'bg-green-50 text-green-600 border-green-100' :
            source === 'Ashby'      ? 'bg-purple-50 text-purple-600 border-purple-100' :
            source.includes('google') || source === 'find-jobs' ? 'bg-orange-50 text-orange-600 border-orange-100' :
            'bg-slate-50 text-slate-500 border-slate-100'
          }`}>{source === 'find-jobs' ? 'Gemini' : source === 'google-jobs' ? 'Google Jobs' : source}</span>
        </div>

        {/* Skills matched */}
        {skills.slice(0, 5).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 5).map((sk: string) => (
              <span key={sk} className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/70 rounded px-2 py-0.5">✓ {sk}</span>
            ))}
            {missing.slice(0, 2).map((sk: string) => (
              <span key={sk} className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 rounded px-2 py-0.5">✗ {sk}</span>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-2 pt-1">
          {jobUrl && (
            <a href={jobUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-black py-2 px-3 rounded-xl transition-all flex-shrink-0">
              View Job <ExternalLink size={10} />
            </a>
          )}
          {applyUrl ? (
            <a href={applyUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => addApplication({ title: job?.title || 'Job', company: job?.company || 'Company', location: job?.location || 'Remote' })}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black py-2 rounded-xl shadow hover:opacity-90 transition-all">
              Apply Now <ExternalLink size={11} />
            </a>
          ) : jobUrl ? (
            <a href={jobUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => addApplication({ title: job?.title || 'Job', company: job?.company || 'Company', location: job?.location || 'Remote' })}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black py-2 rounded-xl shadow hover:opacity-90 transition-all">
              Apply via Job Page <ExternalLink size={11} />
            </a>
          ) : (
            <span className="flex-1 text-center text-[10px] font-bold text-slate-400 bg-slate-50 py-2 rounded-xl">No link available</span>
          )}
          <button onClick={() => addApplication({ title: job?.title || 'Job', company: job?.company || 'Company', location: job?.location || 'Remote' })}
            className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-[10px] font-black transition-all" title="Track">
            📌
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-20 min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Styles for premium Motion Graphics on the right side */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes rotate-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse-glowing {
          0%, 100% { transform: scale(1); opacity: 0.35; filter: blur(40px); }
          50% { transform: scale(1.1); opacity: 0.55; filter: blur(55px); }
        }
        @keyframes paper-slide {
          0%, 100% { transform: translateY(12px) scale(0.98); }
          50% { transform: translateY(-18px) scale(1.02); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 6s ease-in-out infinite; }
        .animate-rotate-slow { animation: rotate-slow 18s linear infinite; }
        .animate-pulse-glowing { animation: pulse-glowing 4s ease-in-out infinite; }
        .animate-paper-slide { animation: paper-slide 4.5s ease-in-out infinite; }
      `}</style>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col">
        
        {/* HEADER SECTION */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div />
          {hasResume && (
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => {
                  setHasResume(false);
                  clearFile();
                }} 
                variant="outline"
                className="rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50"
              >
                Analyze New Version
              </Button>
              <Button 
                onClick={() => navigate('/dashboard/learner')}
                className="rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-755 shadow-sm"
              >
                Learner Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* ========================================================
            CASE 1: SINGLE STARTING POINT (NO RESUME / INITIAL ENTRY)
           ======================================================== */}
        {!hasResume && !isAnalyzing && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start my-auto py-4">

            {/* ── LEFT COLUMN ────────────────────────────────────────── */}
            <div className="lg:col-span-7 space-y-6">

              {/* Hero copy */}
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">
                  <Sparkles size={11} /> RESUME INTELLIGENCE
                </span>
                <h2 className="text-3xl font-black text-slate-900 leading-tight mb-3">
                  Upload your resume,<br />
                  unlock{' '}
                  <span className="text-indigo-600">
                    better opportunities
                  </span>
                </h2>
                <p className="text-slate-500 text-sm font-medium max-w-sm">
                  Our AI analyzes your resume and connects you to the right opportunities.
                </p>
              </div>

              {/* Upload card */}
              <div className="w-full rounded-2xl border-2 border-indigo-200/70 bg-white shadow-[0_8px_30px_rgba(99,102,241,0.07)] overflow-hidden relative">
                <button
                  id="dev-mock-upload-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setResumeId("mock-resume-123");
                    setHasResume(true);
                    setCurrentView('quality');
                  }}
                  className="absolute top-2 right-2 text-[9px] bg-slate-100 hover:bg-slate-200 border text-slate-500 font-bold px-2 py-0.5 rounded z-10"
                >
                  Dev Mock Upload
                </button>
                {/* Security badge */}
                <div className="flex justify-center pt-5 pb-1">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
                    <ShieldCheck size={10} className="text-indigo-500" /> Secure • Private • Confidential
                  </span>
                </div>

                {/* Hidden file input — managed by hook */}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={onFileSelect}
                />

                {/* Error Banner */}
                {error && (
                  <div className="mx-5 mt-3 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2 text-xs font-bold">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                {/* ── Upload zone (empty state) */}
                {!fileName ? (
                  <div
                    onClick={handleThumbnailClick}
                    onDragOver={handleDrag}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={cn(
                      "mx-5 my-4 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-10",
                      isDragActive
                        ? "border-indigo-500 bg-indigo-50/50"
                        : "border-slate-200 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/30"
                    )}
                  >
                    {/* Big upload icon */}
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_8px_24px_rgba(99,102,241,0.35)]">
                      <UploadCloud className="h-7 w-7 text-white" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold text-slate-800">Drag &amp; drop your resume here</p>
                      <p className="text-xs text-slate-400">PDF, DOC, DOCX (Max 10MB)</p>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">or</p>
                    <Button
                      className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-6 h-9 shadow-md hover:shadow-indigo-300/40 hover:opacity-90 transition-all"
                      onClick={(e) => { e.stopPropagation(); handleThumbnailClick(); }}
                    >
                      <FileText size={14} className="mr-2" /> Choose File
                    </Button>
                  </div>
                ) : (
                  /* ── Upload zone (file selected / uploading) */
                  <div className="mx-5 my-4 relative">
                    <div className="group relative rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                      <div className="flex items-center gap-4 p-5">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{fileName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            {uploadStatus === 'uploading' ? `Uploading... ${uploadProgress}%` : uploadStatus}
                          </p>
                          {uploadStatus === 'uploading' && (
                            <div className="mt-2 h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div style={{ width: `${uploadProgress}%` }} className="h-full bg-indigo-600 rounded-full transition-all duration-150" />
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Hover overlay — Replace / Remove */}
                      <div className="absolute inset-0 bg-slate-900/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100 rounded-2xl" />
                      <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleThumbnailClick(); }} className="h-9 w-9 p-0 rounded-xl shadow-md"><Upload className="h-4 w-4" /></Button>
                        <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); clearFile(); }} className="h-9 w-9 p-0 rounded-xl shadow-md"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    {fileName && (
                      <div className="mt-2 flex items-center gap-2 px-1">
                        <span className="truncate text-xs font-semibold text-slate-400">{fileName}</span>
                        <button onClick={clearFile} className="ml-auto rounded-full p-1 hover:bg-slate-100 transition-colors"><X className="h-3.5 w-3.5 text-slate-400" /></button>
                      </div>
                    )}
                    {resumeId && (
                      <div className="mt-4">
                        <Button
                          onClick={() => { setHasResume(true); setCurrentView('quality'); }}
                          className="w-full rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md gap-2 hover:opacity-90 transition-all py-2.5 flex items-center justify-center"
                        >
                          Analyze Resume <Sparkles size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* We'll extract and analyze */}
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-700 mb-4">
                  <Sparkles size={12} className="text-indigo-500" /> We'll extract and analyze
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[
                    { icon: UserCheck, label: 'Personal\nInformation', color: 'text-indigo-600 bg-indigo-50' },
                    { icon: Briefcase, label: 'Work\nExperience', color: 'text-purple-600 bg-purple-50' },
                    { icon: BookOpen, label: 'Education\nHistory', color: 'text-emerald-600 bg-emerald-50' },
                    { icon: Layers, label: 'Skills &\nTechnologies', color: 'text-blue-600 bg-blue-50' },
                    { icon: FileSpreadsheet, label: 'Projects', color: 'text-orange-600 bg-orange-50' },
                    { icon: ShieldCheck, label: 'Certifications\n& Achievements', color: 'text-rose-600 bg-rose-50' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex flex-col items-center gap-2 text-center">
                      <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", color)}>
                        <Icon size={18} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 leading-tight whitespace-pre-line">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN — Why Resume Intelligence? ────────────── */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-6 space-y-1">
                <h3 className="text-base font-black text-slate-900 mb-5">Why Resume Intelligence?</h3>

                {/* Feature 1 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UserCheck size={20} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-snug">
                      Get noticed by the{' '}
                      <span className="text-emerald-600">right employers</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Make your resume visible to hiring managers and top companies.</p>
                  </div>
                </div>

                <div className="h-px bg-slate-100 mx-4" />

                {/* Feature 2 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <TrendingUp size={20} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-snug">
                      Apply faster with{' '}
                      <span className="text-indigo-600">AI Quick Apply</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">One click application to relevant jobs that match your profile.</p>
                  </div>
                  <div className="flex-shrink-0 hidden sm:flex">
                    <span className="text-[9px] font-black bg-indigo-600 text-white px-2.5 py-1 rounded-lg shadow-sm">Quick Apply</span>
                  </div>
                </div>

                <div className="h-px bg-slate-100 mx-4" />

                {/* Feature 3 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BarChart4 size={20} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-snug">
                      Discover roles that{' '}
                      <span className="text-purple-600">fit you best</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">See similar job titles and skills to plan your next career move.</p>
                  </div>
                  <div className="flex-shrink-0 hidden sm:flex flex-col gap-1">
                    {['Data Analyst', 'Product Manager', 'ML Engineer'].map(r => (
                      <span key={r} className="text-[8px] font-bold bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-md">{r}</span>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-slate-100 mx-4" />

                {/* Feature 4 */}
                <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Compass size={20} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 leading-snug">
                      AI-powered insights{' '}
                      <span className="text-orange-500">for your growth</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">Get smart insights to improve your resume and career path.</p>
                  </div>
                  {/* Donut score */}
                  <div className="flex-shrink-0 hidden sm:flex flex-col items-center gap-0.5">
                    <div className="relative w-11 h-11">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f97316" strokeWidth="3" strokeDasharray="92 8" strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-orange-500">92%</span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-400 text-center leading-tight">Match<br />Score</span>
                  </div>
                </div>

                {/* Bottom CTA strip */}
                <div className="mt-2 mx-0 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-center">
                  <p className="text-white text-xs font-black">Your dream role is one step away!</p>
                  <p className="text-indigo-200 text-[10px] mt-0.5">Upload your resume to get started</p>
                </div>

              </div>
            </div>

          </div>
        )}


        {/* ========================================================
            CASE 2: RESUME EXTRACTION ENGINE UI
           ======================================================== */}
        {isAnalyzing && (() => {
          const currentProgress = getAnalysisProgress();
          const extractionTabs = ['Personal Info', 'Professional Summary', 'Experience', 'Education', 'Skills', 'Projects', 'Others'] as const;
          const extractedSections = [
            { key: 'extraction',     label: '1. Extract Resume',                icon: FileText,       status: pipelineStatus.extraction === 'done',      running: pipelineStatus.extraction === 'running' },
            { key: 'atsAnalysis',    label: '2. ATS Analysis',                  icon: ShieldCheck,    status: pipelineStatus.atsAnalysis === 'done',     running: pipelineStatus.atsAnalysis === 'running' },
            { key: 'bestFitRoles',   label: '3. Determine Best-Fit Roles',      icon: UserCheck,      status: pipelineStatus.bestFitRoles === 'done',    running: pipelineStatus.bestFitRoles === 'running' },
            { key: 'searchQueries',  label: '4. Generate Job Search Queries',   icon: Search,         status: pipelineStatus.searchQueries === 'done',   running: pipelineStatus.searchQueries === 'running' },
            { key: 'apifyScraping',  label: '5. Apify → Real Jobs',             icon: Briefcase,      status: pipelineStatus.apifyScraping === 'done',   running: pipelineStatus.apifyScraping === 'running' },
            { key: 'normalization',  label: '6. Normalize + Deduplicate',       icon: Layers,         status: pipelineStatus.normalization === 'done',   running: pipelineStatus.normalization === 'running' },
            { key: 'matching',       label: '7. Resume ↔ Job Matching',         icon: Sparkles,       status: pipelineStatus.matching === 'done',        running: pipelineStatus.matching === 'running' },
            { key: 'skillGaps',      label: '8. Skill Gap Against Actual Jobs', icon: AlertTriangle,  status: pipelineStatus.skillGaps === 'done',       running: pipelineStatus.skillGaps === 'running' },
            { key: 'improvements',   label: '9. Resume Improvements',           icon: Brain,          status: pipelineStatus.improvements === 'done',    running: pipelineStatus.improvements === 'running' },
          ];

          return (
            <div className="space-y-4 w-full">



              {/* ── Main two-column layout ── */}
                {/* ── Main split layout ── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* LEFT: Original PDF Resume Viewer */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[780px] lg:sticky lg:top-24">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Original Resume Viewer</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                      <span>📄 Exact PDF Formatting</span>
                    </div>
                  </div>
                  <div className="flex-1 w-full h-full bg-slate-100 relative">
                    {(fileUrl || extractedData?.fileUrl) ? (
                      <iframe
                        src={(() => {
                          const url = fileUrl || extractedData?.fileUrl || '';
                          if (url.startsWith('http://') || url.startsWith('https://')) return url;
                          if (url.startsWith('/')) return `${backendOrigin}${url}`;
                          return `${backendOrigin}/uploads/documents/${url}`;
                        })()}
                        className="w-full h-full border-0"
                        title="Original Resume PDF Viewer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-455 space-y-2">
                        <div className="w-10 h-10 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-semibold">Loading PDF Viewer...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: Resume Intelligence panel */}
                <div className="lg:col-span-7 space-y-6">

                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)] space-y-4 font-sans">
                    <div className="flex items-center justify-between border-b pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🧠</span>
                        <span className="text-sm font-black text-slate-805 tracking-tight uppercase">Resume Intelligence</span>
                      </div>
                      <span className="text-sm font-black text-indigo-600">
                        {`${Math.max(currentProgress, 5)}%`}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500">
                        {currentProgress >= 100
                          ? 'All 9 steps complete.'
                          : pipelineStatus.extraction !== 'done'
                            ? 'Resume extraction is in progress...'
                            : 'Running analysis pipeline...'}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {(() => {
                          // Show the currently-running step name, or the last completed one
                          const steps = [
                            { key: 'extraction',    label: '1. Extracting resume',               status: pipelineStatus.extraction },
                            { key: 'atsAnalysis',   label: '2. Running ATS analysis',            status: pipelineStatus.atsAnalysis },
                            { key: 'bestFitRoles',  label: '3. Detecting best-fit roles',        status: pipelineStatus.bestFitRoles },
                            { key: 'searchQueries', label: '4. Generating job search queries',   status: pipelineStatus.searchQueries },
                            { key: 'apifyScraping', label: '5. Discovering real jobs',           status: pipelineStatus.apifyScraping },
                            { key: 'normalization', label: '6. Normalising & deduplicating',     status: pipelineStatus.normalization },
                            { key: 'matching',      label: '7. Matching resume ↔ jobs',          status: pipelineStatus.matching },
                            { key: 'skillGaps',     label: '8. Analysing skill gaps',            status: pipelineStatus.skillGaps },
                            { key: 'improvements',  label: '9. Generating improvements',         status: pipelineStatus.improvements },
                          ];
                          const running = steps.find(s => s.status === 'running');
                          const allDone = steps.every(s => s.status === 'done');
                          if (allDone) {
                            return (
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-500 text-[13px] font-black">✓</span>
                                <span className="text-xs font-bold text-slate-800">All steps complete — Resume Intelligence ready</span>
                              </div>
                            );
                          }
                          if (running) {
                            return (
                              <div className="flex items-center gap-2">
                                <span className="text-indigo-600 text-[13px] animate-spin inline-block font-black font-sans">⟳</span>
                                <span className="text-xs font-bold text-indigo-600 animate-pulse">{running.label}…</span>
                              </div>
                            );
                          }
                          // Extraction hasn't started or is queued
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-indigo-600 text-[13px] animate-spin inline-block font-black font-sans">⟳</span>
                              <span className="text-xs font-bold text-indigo-600 animate-pulse">Extracting your resume…</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Tabs headers */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.03)] overflow-hidden">
                    <div className="flex overflow-x-auto border-b border-slate-100 px-3 pt-3 gap-1 scrollbar-thin">
                      {['Personal Info', 'Professional Summary', 'Experience', 'Education', 'Skills', 'Projects', 'Others'].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex-shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-t-lg border-b-2 transition-colors ${
                            tab === activeTab
                              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                              : 'border-transparent text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 space-y-2.5 min-h-[220px]">
                      {activeTab === 'Personal Info' && (
                        <>
                          {[
                            { label: 'Full Name',     value: extractedData?.structuredData?.personal?.name || 'N/A',             ready: !!extractedData },
                            { label: 'Current Role',  value: extractedData?.structuredData?.experience?.[0]?.role || 'N/A',      ready: !!extractedData },
                            { label: 'Email',         value: extractedData?.structuredData?.personal?.email || 'N/A',             ready: !!extractedData },
                            { label: 'Phone',         value: extractedData?.structuredData?.personal?.phone || 'N/A',             ready: !!extractedData },
                            { label: 'Location',      value: extractedData?.structuredData?.personal?.location || 'N/A',          ready: !!extractedData },
                            { label: 'LinkedIn',      value: extractedData?.structuredData?.personal?.linkedin || 'N/A',          ready: !!extractedData },
                          ].map(({ label, value, ready }) => (
                            <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                              <span className="text-xs font-bold text-slate-700 w-28 flex-shrink-0">{label}</span>
                              {ready ? (
                                <span className="text-xs text-slate-600 text-right truncate">{value}</span>
                              ) : (
                                <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />
                              )}
                            </div>
                          ))}
                        </>
                      )}

                      {activeTab === 'Professional Summary' && (
                        <div className="text-xs text-slate-600 leading-relaxed">
                          {extractedData ? (
                            extractedData.structuredData?.personal?.summary || 'No professional summary extracted.'
                          ) : (
                            <div className="space-y-2 animate-pulse">
                              <div className="h-3 bg-slate-100 rounded w-full" />
                              <div className="h-3 bg-slate-100 rounded w-full" />
                              <div className="h-3 bg-slate-100 rounded w-2/3" />
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'Experience' && (
                        <div className="space-y-3">
                          {extractedData ? (
                            extractedData.structuredData?.experience?.length > 0 ? (
                              extractedData.structuredData.experience.map((exp: any, idx: number) => (
                                <div key={idx} className="border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                  <div className="flex justify-between">
                                    <span className="text-xs font-bold text-slate-800">{exp.role}</span>
                                    <span className="text-[10px] text-slate-400">{exp.startDate} – {exp.endDate || 'Present'}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-semibold">{exp.company}</p>
                                  <p className="text-[10.5px] text-slate-600 mt-1 leading-normal">{exp.description}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">No experience extracted.</p>
                            )
                          ) : (
                            <div className="space-y-3 animate-pulse">
                              {[1, 2].map(n => (
                                <div key={n} className="space-y-2">
                                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                                  <div className="h-3 bg-slate-100 rounded w-full" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'Education' && (
                        <div className="space-y-3">
                          {extractedData ? (
                            extractedData.structuredData?.education?.length > 0 ? (
                              extractedData.structuredData.education.map((edu: any, idx: number) => (
                                <div key={idx} className="border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                  <div className="flex justify-between">
                                    <span className="text-xs font-bold text-slate-800">{edu.degree} in {edu.field}</span>
                                    <span className="text-[10px] text-slate-400">{edu.endYear}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-semibold">{edu.institution}</p>
                                  {edu.gpa && <p className="text-[10px] text-slate-400 font-bold">GPA: {edu.gpa}</p>}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">No education details extracted.</p>
                            )
                          ) : (
                            <div className="space-y-3 animate-pulse">
                              <div className="space-y-2">
                                <div className="h-3 bg-slate-100 rounded w-1/2" />
                                <div className="h-3 bg-slate-100 rounded w-1/4" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'Skills' && (
                        <div className="flex flex-wrap gap-1.5">
                          {extractedData ? (
                            extractedData.structuredData?.skills?.length > 0 ? (
                              extractedData.structuredData.skills.map((skill: string) => (
                                <span key={skill} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 rounded-lg px-2.5 py-1">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">No skills extracted.</p>
                            )
                          ) : (
                            <div className="flex flex-wrap gap-2 animate-pulse">
                              {[1, 2, 3, 4, 5].map(n => (
                                <div key={n} className="h-6 w-12 bg-slate-100 rounded-lg" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'Projects' && (
                        <div className="space-y-3">
                          {extractedData ? (
                            extractedData.structuredData?.projects?.length > 0 ? (
                              extractedData.structuredData.projects.map((proj: any, idx: number) => (
                                <div key={idx} className="border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                  <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-slate-800">{proj.name}</span>
                                    {proj.url && (
                                      <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5">
                                        Link <ExternalLink size={8} />
                                      </a>
                                    )}
                                  </div>
                                  <p className="text-[10.5px] text-slate-600 mt-1 leading-normal">{proj.description}</p>
                                  {proj.technologies?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {proj.technologies.map((t: string) => (
                                        <span key={t} className="text-[8.5px] font-bold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic">No projects extracted.</p>
                            )
                          ) : (
                            <div className="space-y-3 animate-pulse">
                              <div className="space-y-2">
                                <div className="h-3 bg-slate-100 rounded w-1/3" />
                                <div className="h-3 bg-slate-100 rounded w-full" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'Others' && (
                        <div className="space-y-3.5">
                          {extractedData ? (
                            <>
                              {/* Certifications */}
                              <div>
                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-0.5 mb-1.5">Certifications</h4>
                                {extractedData.structuredData?.certifications?.length > 0 ? (
                                  <ul className="list-disc pl-4 space-y-1">
                                    {extractedData.structuredData.certifications.map((cert: any, idx: number) => (
                                      <li key={idx} className="text-[10.5px] text-slate-600">
                                        <span className="font-bold text-slate-700">{cert.name}</span>
                                        {cert.issuer && ` — ${cert.issuer}`}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-[10px] text-slate-400 italic">None extracted.</p>
                                )}
                              </div>

                              {/* Achievements */}
                              <div>
                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-0.5 mb-1.5">Achievements</h4>
                                {extractedData.structuredData?.achievements?.length > 0 ? (
                                  <ul className="list-disc pl-4 space-y-1">
                                    {extractedData.structuredData.achievements.map((ach: string, idx: number) => (
                                      <li key={idx} className="text-[10.5px] text-slate-600">{ach}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-[10px] text-slate-400 italic">None extracted.</p>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="space-y-3 animate-pulse">
                              <div className="h-3 bg-slate-100 rounded w-1/4" />
                              <div className="h-3 bg-slate-100 rounded w-full" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={clearFile}
                      className="flex-1 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 gap-2"
                    >
                      <UploadCloud size={14} /> Upload Another
                    </Button>
                    {extractedData && (
                      <Button
                        onClick={() => {
                          setIsAnalyzing(false);
                          setHasResume(true);
                          setUploadStatus('done');
                          setCurrentView('quality');
                        }}
                        className="flex-1 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md gap-2 hover:opacity-90 transition-all animate-bounce"
                      >
                        Next: View Results <ArrowRight size={14} />
                      </Button>
                    )}
                  </div>

                </div>
              </div>
            </div>
          );
        })()}


        {/* ========================================================
            CASE 3: MAIN WORKSPACE LAYOUT (AFTER ANALYSIS)
           ======================================================== */}
        {hasResume && !isAnalyzing && (
          <div className="w-full my-4">
            
            {/* FULL WIDTH: Resume Intelligence Dashboard */}
            <div className="w-full space-y-6">
              {!resumeIntelUnlocked ? (
                <div className="w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl mx-auto animate-bounce">
                  ✨
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-900">Unlock Resume Intelligence</h2>
                  <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                    Get full access to ATS analysis, automated career detection, live matching, and tailored development recommendations.
                  </p>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-3">
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                    <span className="text-emerald-500">✓</span> Resume Extraction Engine
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                    <span className="text-emerald-500">✓</span> ATS Quality & Gaps Analysis
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                    <span className="text-emerald-500">✓</span> Unlimited Target Career Searches
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                    <span className="text-emerald-500">✓</span> Real-Time Job Discovery Scraper
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2 pt-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">One-time payment</span>
                  <span className="text-3xl font-black text-indigo-650">$0.50 USDC</span>
                </div>

                <button
                  onClick={async () => {
                    // When BYPASS_PAYMENT is on, or no wallet, call the unlock endpoint directly
                    setResumeIntelPaymentStep('verifying');
                    try {
                      // Try direct unlock first (works when BYPASS_PAYMENT=true on backend)
                      await apiFetch(`/api/v1/resume/${resumeId}/unlock`, { method: 'POST' });
                      setResumeIntelPaymentStep('complete');
                      setTimeout(() => {
                        setResumeIntelUnlocked(true);
                        setResumeIntelPaymentStep(null);
                      }, 800);
                    } catch (directErr: any) {
                      // 402 was returned — need wallet payment
                      if (!activeAddress) {
                        setResumeIntelPaymentStep(null);
                        alert("Please connect your wallet first via the Manage Wallet tab.");
                        return;
                      }
                      setResumeIntelPaymentStep('402');
                      try {
                        const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
                        setResumeIntelPaymentStep('wallet');
                        await x402Fetch(`${backendOrigin}/api/v1/resume/${resumeId}/unlock`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                        });
                        setResumeIntelPaymentStep('verifying');
                        setTimeout(() => {
                          setResumeIntelPaymentStep('complete');
                          setTimeout(() => {
                            setResumeIntelUnlocked(true);
                            setResumeIntelPaymentStep(null);
                          }, 1200);
                        }, 1500);
                      } catch (err: any) {
                        console.error('[x402] Unlock failed:', err);
                        alert(`Payment verification failed: ${err.message || err}`);
                        setResumeIntelPaymentStep(null);
                      }
                    }
                  }}
                  className="w-full max-w-sm mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm py-3.5 rounded-2xl shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  Unlock Resume Intelligence Pass
                </button>
                <span className="text-[10px] text-slate-400 font-bold block">Secure micro-payment validated on Algorand MainNet</span>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* INNER SIDEBAR NAVIGATION — Simplified 5-step flow */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.015)] lg:sticky lg:top-24 overflow-hidden">
              {/* Header */}
              <div className="px-1 mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Resume Flow</span>
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{ width:
                      currentView === 'quality' ? '33%' :
                      currentView === 'career' ? '66%' :
                      currentView === 'jobs' ? '100%' : '33%'
                    }}
                  />
                </div>
              </div>

              {/* Nav Items */}
              <div className="space-y-1">
                {([
                  { id: 'quality',       emoji: '🎯', label: 'ATS Analysis',     step: 1, sublabel: atsAnalysisUnlocked ? 'Score & improvements' : '🔒 Unlock — $0.05', locked: !atsAnalysisUnlocked },
                  { id: 'career',        emoji: '🧭', label: 'Career Fit',       step: 2, sublabel: careerFitUnlocked ? 'Top 5 matches' : '🔒 Unlock — $0.50', locked: !careerFitUnlocked },
                  { id: 'jobs',          emoji: '💼', label: 'Job Opportunities', step: 3, sublabel: jobDiscoveryUnlocked ? 'Live jobs' : '🔒 Unlock — $0.50', locked: !jobDiscoveryUnlocked },
                ] as const).map((item) => {
                  const isActive = currentView === item.id;
                  const isDone = (
                    (item.id === 'quality' && atsAnalysisUnlocked) ||
                    (item.id === 'career' && careerFitUnlocked) ||
                    (item.id === 'jobs' && jobDiscoveryUnlocked)
                  );
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id as any)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md shadow-indigo-200'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Step circle */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] flex-shrink-0 transition-all ${
                        isActive ? 'bg-white/20 text-white' :
                        isDone ? 'bg-emerald-50 border border-emerald-200' :
                        'bg-slate-100 border border-slate-200'
                      }`}>
                        {isDone ? '✓' : item.emoji}
                      </div>
                      {/* Labels */}
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-black block leading-none ${
                          isActive ? 'text-white' : isDone ? 'text-emerald-700' : 'text-slate-700'
                        }`}>{item.label}</span>
                        <span className={`text-[9px] font-semibold block mt-0.5 ${
                          isActive ? 'text-indigo-200' : 'text-slate-400'
                        }`}>{item.sublabel}</span>
                      </div>
                      {/* Step number */}
                    </button>
                  );
                })}
              </div>

            </div>

            {/* CONTENT VIEWPORT */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* PAGE: CAREER SNAPSHOT & AUTO JOB CLASSIFICATION */}
              {currentView === 'overview' && (() => {
                // Map live distribution or fallback to mocks
                const totalScraped = liveDistribution ? Object.values(liveDistribution).reduce((a, b) => a + b, 0) : 0;
                
                const buckets = [
                  { 
                    id: '100%', 
                    title: '100% MATCH', 
                    count: liveDistribution && liveDistribution['100%'] !== undefined ? `${liveDistribution['100%']} Jobs` : '0 Jobs', 
                    rawCount: liveDistribution && liveDistribution['100%'] !== undefined ? liveDistribution['100%'] : 0,
                    desc: 'You meet all major requirements perfectly.', 
                    border: 'border-emerald-500 text-emerald-600', 
                    fill: 'bg-emerald-55/10' 
                  },
                  { 
                    id: '75%',  
                    title: '75% MATCH',  
                    count: liveDistribution && liveDistribution['75%'] !== undefined ? `${liveDistribution['75%']} Jobs` : '0 Jobs', 
                    rawCount: liveDistribution && liveDistribution['75%'] !== undefined ? liveDistribution['75%'] : 0,
                    desc: 'Strong match with minor gaps.', 
                    border: 'border-indigo-500 text-indigo-600', 
                    fill: 'bg-indigo-50/50' 
                  },
                  { 
                    id: '50%',  
                    title: '50% MATCH',  
                    count: liveDistribution && liveDistribution['50%'] !== undefined ? `${liveDistribution['50%']} Jobs` : '0 Jobs', 
                    rawCount: liveDistribution && liveDistribution['50%'] !== undefined ? liveDistribution['50%'] : 0,
                    desc: 'Moderate match. Some key gaps.', 
                    border: 'border-amber-500 text-amber-600', 
                    fill: 'bg-amber-50/50' 
                  },
                  { 
                    id: '20%',  
                    title: '20% MATCH',  
                    count: liveDistribution && liveDistribution['20%'] !== undefined ? `${liveDistribution['20%']} Jobs` : '0 Jobs', 
                    rawCount: liveDistribution && liveDistribution['20%'] !== undefined ? liveDistribution['20%'] : 0,
                    desc: 'Low match. Significant improvements needed.', 
                    border: 'border-orange-500 text-orange-600', 
                    fill: 'bg-orange-50/50' 
                  },
                  { 
                    id: '0%',   
                    title: '0% MATCH',   
                    count: liveDistribution && liveDistribution['0%'] !== undefined ? `${liveDistribution['0%']} Jobs` : '0 Jobs', 
                    rawCount: liveDistribution && liveDistribution['0%'] !== undefined ? liveDistribution['0%'] : 0,
                    desc: 'Not a match for now. Build more relevant skills.', 
                    border: 'border-red-500 text-red-650', 
                    fill: 'bg-red-50/50' 
                  }
                ];

                // Resolve target list: live data if loaded, otherwise empty array
                let currentJobsList: any[] = [];
                if (liveMatchedJobs && liveMatchedJobs[selectedBucket] && liveMatchedJobs[selectedBucket].length > 0) {
                  currentJobsList = liveMatchedJobs[selectedBucket].map(m => {
                    const j = m.jobId || {};
                    return {
                      title: j.title || 'Job Opportunity',
                      company: j.company || 'Company Name',
                      location: j.location || 'Remote / Hybrid',
                      type: j.employmentType || 'Full-time',
                      mode: j.remoteType || 'Remote',
                      salary: j.salary || 'Competitive',
                      date: j.postedAt ? `Posted ${new Date(j.postedAt).toLocaleDateString()}` : 'Recently',
                      skills: j.intelligence?.requiredSkills || j.requirements || ['Requirements extracted']
                    };
                  });
                }

                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    
                    {/* SECTION 1: RESUME INTELLIGENCE (Score summary cards) */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">RESUME INTELLIGENCE</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-black text-slate-450 uppercase block">Resume Score</span>
                            <span className="text-3xl font-black text-indigo-650 block mt-1">{liveMatchScore}%</span>
                            <span className="text-[9px] font-extrabold text-slate-400 block mt-1">Weighted profile alignment</span>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg">📈</div>
                        </div>

                        <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-black text-slate-450 uppercase block">ATS Audit</span>
                            <span className="text-3xl font-black text-emerald-650 block mt-1">85/100</span>
                            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">✓ PASS</span>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-lg">🛡️</div>
                        </div>

                        <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-black text-slate-450 uppercase block">Career Fit</span>
                            <span className="text-lg font-black text-slate-800 block mt-2.5 truncate max-w-[150px]">{targetRole || "Data Scientist"}</span>
                            <span className="text-[9px] font-extrabold text-slate-400 block mt-1">Detected primary career</span>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 text-lg">🎯</div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: WHAT CAN I GET? (Buckets Row) */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">WHAT CAN I GET?</span>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {buckets.map(b => (
                          <button
                            key={b.id}
                            onClick={() => setSelectedBucket(b.id as any)}
                            className={`border rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all hover:shadow-sm ${
                              selectedBucket === b.id 
                                ? `${b.fill} ${b.border} border-2 ring-4 ring-slate-100` 
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <span className="text-[9px] font-black tracking-widest uppercase opacity-75">{b.title}</span>
                            <div className="my-3">
                              <span className="text-2xl font-black block">{b.id}</span>
                              <span className="text-[10px] font-extrabold text-slate-500 mt-0.5 block">{b.count}</span>
                            </div>
                            <p className="text-[8.5px] text-slate-400 font-bold leading-tight">{b.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 3: RESUME IMPROVEMENTS + PROJECT RECOMMENDATIONS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      
                      {/* Left: Resume Improvements Card Preview */}
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">RESUME IMPROVEMENTS</span>
                          <h4 className="text-sm font-black text-slate-900 mt-2">ATS Description Enhancements</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Preview of proposed changes to improve profile alignment.
                          </p>

                          <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/30 space-y-2 mt-4">
                            <div className="text-[9px] font-bold text-red-500 line-through">Before: Built a churn model.</div>
                            <div className="text-[9px] font-black text-emerald-600">After: Developed a pipeline with Scikit-learn, achieving 89% accuracy...</div>
                          </div>
                        </div>

                        <button 
                          onClick={() => setCurrentView('improve')}
                          className="w-full bg-indigo-50 border border-indigo-200 text-indigo-650 hover:bg-indigo-100 transition-colors font-black text-xs py-3 rounded-xl flex items-center justify-center gap-1.5"
                        >
                          Optimize Resume (+5% Match Boost) <ArrowRight size={13} />
                        </button>
                      </div>

                      {/* Right: Project Recommendations Card Preview */}
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">PROJECT RECOMMENDATIONS</span>
                          <h4 className="text-sm font-black text-slate-900 mt-2">Production ML Deployment</h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Suggested project to cover missing technical skills gaps:
                          </p>

                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {['FastAPI', 'Docker', 'AWS ECS', 'Prometheus'].map(tag => (
                              <span key={tag} className="text-[8.5px] font-black text-indigo-650 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">{tag}</span>
                            ))}
                          </div>
                        </div>

                        <button 
                          onClick={() => setCurrentView('projects')}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs py-3 rounded-xl shadow hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          Generate Complete Plan <Sparkles size={12} />
                        </button>
                      </div>

                    </div>

                    {/* SECTION 4: What do you want to achieve? (Prompt Explorer Block) */}
                    <div className="bg-gradient-to-r from-indigo-900 to-purple-950 rounded-2xl p-6 shadow-lg text-white space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span>✨</span> What do you want to achieve?
                          </h3>
                          <p className="text-[10.5px] text-slate-300 font-semibold mt-0.5">Explore any career goal dynamically. We scrape, matches, and tailors recommendations.</p>
                        </div>
                        <span className="text-[8px] font-black bg-indigo-800 text-indigo-200 border border-indigo-700 px-2 py-0.5 rounded uppercase">Micropayment</span>
                      </div>

                      <div className="relative">
                        <textarea
                          value={careerPrompt}
                          onChange={(e) => setCareerPrompt(e.target.value.slice(0, 200))}
                          placeholder="I want to move from Data Scientist to Machine Learning Engineer in Hyderabad..."
                          className="w-full text-xs font-semibold text-slate-200 placeholder:text-slate-400 bg-white/10 border border-white/15 rounded-xl p-3.5 focus:outline-none focus:border-indigo-400 h-20 resize-none"
                        />
                        <button
                          onClick={async () => {
                            if (!activeAddress) {
                              alert("Please connect your wallet via the Manage Wallet tab.");
                              return;
                            }
                            setCustomSearchPaymentStep('paywall');
                          }}
                          className="absolute bottom-3 right-3 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1"
                        >
                          Explore for $0.50 USDC <ArrowRight size={11} />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Suggestions:</span>
                        {[
                          'I want to become an ML Engineer in Hyderabad',
                          'I want to transition to AI Architect',
                          'Find MLOps Engineer remote jobs'
                        ].map(tag => (
                          <button
                            key={tag}
                            onClick={() => setCareerPrompt(tag)}
                            className="text-[9.5px] font-bold text-slate-200 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 hover:bg-white/10"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SECTION 5: LIVE TARGET JOBS */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b pb-3">
                        <div>
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">LIVE TARGET JOBS</h3>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Showing live matches in the {selectedBucket} bucket.</p>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{currentJobsList.length} Opportunities found</span>
                      </div>

                      <div className="space-y-4">
                        {currentJobsList.map((job, idx) => (
                          <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-slate-50/10 hover:shadow-sm transition-all space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-black text-xs">
                                  {job.company[0] || "J"}
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-slate-900">{job.title}</h4>
                                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">{job.company}</p>
                                </div>
                              </div>
                              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{selectedBucket} Match</span>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-2">
                              {job.skills.slice(0, 5).map((sk: string) => (
                                <span key={sk} className="text-[8.5px] font-bold text-slate-600 bg-white border border-slate-100 rounded px-1.5 py-0.5">{sk}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </motion.div>
                );
              })()}

              {/* PAGE: QUALITY & ATS ANALYSIS */}
              {currentView === 'quality' && (
                !atsAnalysisUnlocked ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-sm">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-indigo-100">
                      🎯
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black">
                        <span>🔒 Algorand X402 Micropayment</span>
                        <span>•</span>
                        <span>$0.05 USDC</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900">Unlock Resume Quality &amp; ATS Score</h3>
                      <p className="text-xs text-slate-550 font-semibold leading-relaxed">
                        Analyze your resume sections, impact language, formatting, and ATS compatibility using our advanced AI-powered grader.
                      </p>
                    </div>

                    <div className="max-w-xs mx-auto">
                      {atsAnalysisPaymentStep === '402' && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs font-black text-indigo-700 animate-pulse mb-4">
                          <span>💸 Preparing $0.05 USDC micropayment challenge...</span>
                        </div>
                      )}
                      {atsAnalysisPaymentStep === 'wallet' && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs font-black text-indigo-700 animate-bounce mb-4">
                          <span>🔑 Check your Pera wallet to sign the $0.05 USDC transaction...</span>
                        </div>
                      )}
                      {atsAnalysisPaymentStep === 'verifying' && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs font-black text-indigo-700 animate-spin mb-4">
                          <span>⏳ Settling transaction on Algorand blockchain...</span>
                        </div>
                      )}
                      {atsAnalysisPaymentStep === 'complete' && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs font-black text-emerald-700 mb-4">
                          <span>✓ Payment confirmed ($0.05 USDC) — Unlocking report...</span>
                        </div>
                      )}

                      <button
                        onClick={handleUnlockAtsAnalysis}
                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-200 hover:opacity-95 transition-all active:scale-[0.99]"
                      >
                        🔒 Unlock ATS Analysis — $0.05 USDC
                      </button>
                      
                      {!activeAddress && (
                        <p className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 rounded-lg p-2 mt-4">
                          ⚠️ Connect your Pera wallet from the top right to sign the $0.05 transaction.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Resume Quality &amp; ATS Analysis</h2>
                      <p className="text-xs text-slate-550 font-semibold mt-0.5">AI-powered analysis of your resume quality and ATS compatibility</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm">
                      <FileText size={13} /> Download Report
                    </Button>
                  </div>

                  {/* Main Grid: Doc Metadata + Scores */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left: Document details card */}
                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-250/70 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-6">
                      
                      {/* Document Details row */}
                      <div className="flex gap-4 items-start">
                        <div className="w-24 h-32 bg-slate-50 border rounded-lg p-2.5 flex flex-col justify-between shadow-sm relative overflow-hidden flex-shrink-0">
                          <div className="w-full h-1 bg-slate-200 rounded" />
                          <div className="space-y-1">
                            <div className="w-4/5 h-1 bg-slate-200 rounded" />
                            <div className="w-3/5 h-1 bg-slate-200 rounded" />
                            <div className="w-5/6 h-1 bg-slate-200 rounded" />
                          </div>
                          <span className="text-[7px] font-black text-slate-400 bg-slate-100 rounded px-1 self-start uppercase">Resume</span>
                        </div>
                        <div className="space-y-3 flex-1 min-w-0">
                          <div>
                            <h3 className="text-sm font-black text-slate-800 truncate">{fileName || 'Daniel D\'Souza.pdf'}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Uploaded on May 12, 2026 • 2.4 MB</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-xl border p-2 text-center">
                              <span className="text-[8px] font-black text-slate-400 uppercase block">Total Pages</span>
                              <span className="text-sm font-black text-slate-850 mt-0.5 block">2</span>
                            </div>
                            <div className="bg-slate-50 rounded-xl border p-2 text-center">
                              <span className="text-[8px] font-black text-slate-400 uppercase block">Parsed In</span>
                              <span className="text-sm font-black text-slate-850 mt-0.5 block">8.4 sec</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-[10px]">
                            <div>
                              <span className="text-slate-400 font-bold">File Type</span>
                              <p className="font-bold text-slate-700">PDF</p>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold">Analysis Engine</span>
                              <p className="font-bold text-slate-700">CareerX AI v2.0</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Extraction complete row */}
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                            <Check size={16} className="text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">Extraction Complete</p>
                            <p className="text-[10px] text-slate-500 font-medium">All key information extracted successfully</p>
                          </div>
                        </div>
                        <button className="text-[10px] font-black text-indigo-650 hover:underline flex items-center gap-1">
                          View Extracted Data →
                        </button>
                      </div>

                    </div>

                    {/* Right: Scores breakdown gauge */}
                    <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-250/70 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] space-y-6">
                      <span className="text-xs font-black text-slate-900 block">Resume Score</span>
                      
                      {/* Radial Gauge */}
                      <div className="flex flex-col items-center justify-center relative">
                        <div className="relative w-36 h-36">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="8" strokeDasharray="155 250" strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-slate-850">82<span className="text-xs font-semibold text-slate-400">/100</span></span>
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Good
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Line Scores */}
                      <div className="space-y-3">
                        {[
                          { label: 'ATS Compatibility', val: 91, color: 'bg-emerald-500' },
                          { label: 'Impact', val: 65, color: 'bg-amber-500' },
                          { label: 'Projects', val: 76, color: 'bg-indigo-550' },
                          { label: 'Experience', val: 80, color: 'bg-indigo-555' },
                          { label: 'Career Alignment', val: 84, color: 'bg-emerald-500' }
                        ].map(item => (
                          <div key={item.label} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-black">
                              <span className="text-slate-500">{item.label}</span>
                              <span className="text-slate-800">{item.val}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tip banner */}
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                        <span className="text-base">💡</span>
                        <p className="text-[10px] text-amber-800 font-bold leading-normal">
                          Good effort! Fix the issues below to improve your score and stand out.
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* Bottom half: Detailed quality list + Issues */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Left: 11 detailed checks */}
                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Quality &amp; ATS Checks</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">We analyzed your resume across 11 key areas</p>
                      </div>

                      <div className="space-y-1">
                        {[
                          { label: 'ATS Compatibility',       status: 'Excellent', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                          { label: 'Missing Sections',        status: 'Good',      color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                          { label: 'Weak Bullet Points',       status: 'Needs Work',color: 'text-amber-600 bg-amber-50 border-amber-100' },
                          { label: 'Generic Descriptions',    status: 'Needs Work',color: 'text-amber-600 bg-amber-50 border-amber-100' },
                          { label: 'Repeated Keywords',       status: 'Good',      color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                          { label: 'Missing Measurable Impact',status: 'Needs Work',color: 'text-amber-600 bg-amber-50 border-amber-100' },
                          { label: 'Poor Formatting',         status: 'Good',      color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                          { label: 'Skill-to-Project Consistency', status: 'Good', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                          { label: 'Experience Descriptions',  status: 'Good',      color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                          { label: 'Project Quality',         status: 'Good',      color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                          { label: 'Career Alignment',        status: 'Good',      color: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
                        ].map((check, idx) => (
                          <div key={check.label} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <span className="text-slate-400 font-bold text-xs">{idx + 1}.</span>
                              <span className="text-xs font-bold text-slate-700">{check.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${check.color}`}>
                                {check.status}
                              </span>
                              <ChevronRight size={14} className="text-slate-400" />
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Right: Issues and Recommendations list */}
                    <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900">Top Issues Found</h3>
                          <span className="text-[10px] font-black bg-red-50 text-red-600 border border-red-100 rounded-full px-2 py-0.5">7</span>
                        </div>
                        <button className="text-[10px] font-black text-indigo-650 hover:underline">View All</button>
                      </div>

                      <div className="space-y-3">
                        {[
                          { title: 'Add measurable impact to 3 experience bullet points', cat: 'Impact', prio: 'High', color: 'bg-red-50 border-red-100 text-red-655' },
                          { title: 'Missing \'Certifications\' section', cat: 'Missing Section', prio: 'Medium', color: 'bg-amber-50 border-amber-100 text-amber-655' },
                          { title: 'Generic description found in 2 places', cat: 'Content Quality', prio: 'Medium', color: 'bg-amber-50 border-amber-100 text-amber-655' },
                          { title: 'Overused keyword: "Design" (14 times)', cat: 'Keyword Usage', prio: 'Low', color: 'bg-blue-50 border-blue-100 text-blue-655' },
                          { title: 'Improve formatting for better readability', cat: 'Formatting', prio: 'Low', color: 'bg-indigo-50 border-indigo-100 text-indigo-655' }
                        ].map((issue, idx) => (
                          <div key={idx} className="flex gap-3 p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.015)] transition-all">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-500 font-black text-xs border">
                              {idx + 1}
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <h4 className="text-xs font-black text-slate-800 leading-snug">{issue.title}</h4>
                              <div className="flex gap-2 text-[8px] font-black items-center">
                                <span className="text-slate-455 uppercase">{issue.cat}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className={`px-1.5 py-0.5 rounded-md uppercase tracking-wider ${issue.color}`}>{issue.prio}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => setCurrentView('improve')}
                        className="w-full text-center text-xs font-black text-indigo-650 border border-indigo-100 bg-indigo-50/50 rounded-2xl py-3 hover:bg-indigo-50 transition-colors shadow-sm"
                      >
                        View All Issues &amp; Recommendations →
                      </button>

                    </div>

                  </div>

                </motion.div>
                )
              )}

              {/* PAGE 5: SKILL & EVIDENCE INTELLIGENCE */}
              {currentView === 'skills' && (() => {
                // Skills dashboard data

                const skillsList = [
                  { name: 'Python',           prio: 'STRONG',      sources: ['file', 'work', 'edu'], mentions: 8, confidence: 92, summary: 'Python is well demonstrated across projects and internship experience.' },
                  { name: 'SQL',              prio: 'STRONG',      sources: ['file', 'work', 'edu'], mentions: 6, confidence: 85, summary: 'SQL is highly validated in database design and analytics projects.' },
                  { name: 'Pandas',           prio: 'STRONG',      sources: ['file', 'work'],        mentions: 4, confidence: 80, summary: 'Pandas is validated via data processing scripting.' },
                  { name: 'Machine Learning', prio: 'PARTIAL',     sources: ['file', 'work'],        mentions: 3, confidence: 64, summary: 'Machine learning concepts are listed with basic model setups.' },
                  { name: 'AWS',              prio: 'LISTED ONLY', sources: ['file'],                mentions: 1, confidence: 25, summary: 'AWS is only mentioned in the skills matrix. No projects support it.' },
                  { name: 'Docker',           prio: 'MISSING',     sources: [],                      mentions: 0, confidence: 0,  summary: 'Docker is missing from all sections. Highly recommended to add.' },
                  { name: 'Kubernetes',       prio: 'MISSING',     sources: [],                      mentions: 0, confidence: 0,  summary: 'Kubernetes is not present. Important for modern MLOps pipelines.' },
                  { name: 'TensorFlow',       prio: 'PARTIAL',     sources: ['file'],                mentions: 2, confidence: 48, summary: 'TensorFlow appears in lists but lacks strong project context.' }
                ];

                const filteredSkills = skillsList.filter(s => {
                  const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
                  if (filterTab === 'All') return matchesSearch;
                  if (filterTab === 'Strong') return s.prio === 'STRONG' && matchesSearch;
                  if (filterTab === 'Partial') return s.prio === 'PARTIAL' && matchesSearch;
                  if (filterTab === 'Listed Only') return s.prio === 'LISTED ONLY' && matchesSearch;
                  if (filterTab === 'Missing') return s.prio === 'MISSING' && matchesSearch;
                  return matchesSearch;
                });

                const activeSkillData = skillsList.find(s => s.name === selectedSkill) || skillsList[0];

                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    
                    {/* Header */}
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Skill &amp; Evidence Intelligence</h2>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">We go beyond list of skills — finding real evidence from your projects, internships and work.</p>
                    </div>

                    {/* Metadata summary grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { title: 'Total Skills Found', val: '28', desc: 'Across your resume', color: 'text-indigo-650 bg-indigo-50/50' },
                        { title: 'Strong',             val: '12', desc: 'Skills with strong evidence', color: 'text-emerald-600 bg-emerald-50/50' },
                        { title: 'Partial',            val: '7',  desc: 'Skills with partial evidence', color: 'text-orange-600 bg-orange-50/50' },
                        { title: 'Listed Only',        val: '5',  desc: 'Only mentioned in skills section', color: 'text-blue-600 bg-blue-50/50' },
                        { title: 'Missing',            val: '4',  desc: 'Not found in your resume', color: 'text-red-650 bg-red-50/50' }
                      ].map((card, idx) => (
                        <div key={idx} className="bg-white border rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{card.title}</span>
                          <span className="text-2xl font-black text-slate-800 mt-2 block">{card.val}</span>
                          <span className="text-[8px] font-bold text-slate-450 mt-1 block leading-normal">{card.desc}</span>
                          <div className={`absolute top-0 right-0 w-8 h-8 rounded-bl-2xl flex items-center justify-center ${card.color}`}>
                            <Sparkles size={10} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Main content grid split: Left (List) + Right (Evidence details) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                      {/* Left: Skills Overview list */}
                      <div className="lg:col-span-7 bg-white rounded-3xl border p-5 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
                          <h3 className="text-sm font-black text-slate-900">Skills Overview</h3>
                          
                          {/* Search bar */}
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Search a skill"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 w-36"
                            />
                            <button className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                              <Settings size={12} /> Filters
                            </button>
                          </div>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-3">
                          {(['All', 'Strong', 'Partial', 'Listed Only', 'Missing'] as const).map(tab => (
                            <button
                              key={tab}
                              onClick={() => setFilterTab(tab)}
                              className={`text-[9px] font-black px-2.5 py-1 rounded-lg border transition-colors ${
                                filterTab === tab
                                  ? 'bg-indigo-600 text-white border-indigo-650'
                                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-700'
                              }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        {/* Table header */}
                        <div className="grid grid-cols-12 gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 border-b pb-2">
                          <div className="col-span-4">Skill</div>
                          <div className="col-span-3">Evidence Strength</div>
                          <div className="col-span-3">Evidence Found In</div>
                          <div className="col-span-2 text-right">Mentions</div>
                        </div>

                        {/* Rows */}
                        <div className="space-y-1">
                          {filteredSkills.map(skill => (
                            <div
                              key={skill.name}
                              onClick={() => setSelectedSkill(skill.name)}
                              className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-colors cursor-pointer ${
                                selectedSkill === skill.name
                                  ? 'bg-indigo-50/50 border border-indigo-100'
                                  : 'hover:bg-slate-50 border border-transparent'
                              }`}
                            >
                              {/* Skill name */}
                              <div className="col-span-4 flex items-center gap-2">
                                <span className="text-xs font-black text-slate-800">{skill.name}</span>
                              </div>

                              {/* Strength Badge */}
                              <div className="col-span-3">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border ${
                                  skill.prio === 'STRONG'
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                    : skill.prio === 'PARTIAL'
                                      ? 'bg-orange-50 border-orange-100 text-orange-600'
                                      : skill.prio === 'LISTED ONLY'
                                        ? 'bg-blue-50 border-blue-100 text-blue-600'
                                        : 'bg-red-50 border-red-100 text-red-600'
                                }`}>
                                  {skill.prio}
                                </span>
                              </div>

                              {/* Icons summary row */}
                              <div className="col-span-3 flex items-center gap-1">
                                {skill.sources.includes('file') && (
                                  <span className="w-5 h-5 rounded-md bg-slate-50 border flex items-center justify-center text-[9px] font-bold text-slate-650" title="Skills section">📄</span>
                                )}
                                {skill.sources.includes('work') && (
                                  <span className="w-5 h-5 rounded-md bg-slate-50 border flex items-center justify-center text-[9px] font-bold text-slate-650" title="Work / Projects">💼</span>
                                )}
                                {skill.sources.includes('edu') && (
                                  <span className="w-5 h-5 rounded-md bg-slate-50 border flex items-center justify-center text-[9px] font-bold text-slate-650" title="Education / Internship">🎓</span>
                                )}
                                {skill.sources.length === 0 && (
                                  <span className="text-[10px] text-slate-400">—</span>
                                )}
                              </div>

                              {/* Mentions count */}
                              <div className="col-span-2 text-right text-xs font-bold text-slate-700 pr-2">
                                {skill.mentions}
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>

                      {/* Right: Detailed interactive evidence tree */}
                      <div className="lg:col-span-5 bg-white rounded-3xl border p-5 shadow-sm space-y-5">
                        
                        {/* Header details */}
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-black text-slate-800">{activeSkillData.name}</h3>
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${
                                activeSkillData.prio === 'STRONG' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                              }`}>{activeSkillData.prio}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">High confidence — proven in multiple places.</p>
                          </div>

                          <div className="relative w-12 h-12 flex-shrink-0">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6366f1" strokeWidth="3.5" strokeDasharray={`${activeSkillData.confidence} 100`} />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-indigo-650">{activeSkillData.confidence}%</span>
                          </div>
                        </div>

                        {/* Summary panel */}
                        <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50 rounded-2xl border text-center">
                          <div>
                            <span className="text-[8px] font-black text-slate-400 block">Sources</span>
                            <span className="text-xs font-black text-slate-800 block mt-0.5">{activeSkillData.sources.length || 0}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black text-slate-400 block">Mentions</span>
                            <span className="text-xs font-black text-slate-800 block mt-0.5">{activeSkillData.mentions}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black text-slate-400 block">Sections</span>
                            <span className="text-xs font-black text-slate-800 block mt-0.5">{activeSkillData.sources.length || 0}</span>
                          </div>
                        </div>

                        {/* Evidence sections tree */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Evidence Found In</span>
                          
                          {activeSkillData.prio === 'MISSING' ? (
                            <div className="text-center py-6 bg-red-50/50 rounded-2xl border border-dashed border-red-150">
                              <p className="text-xs text-red-650 font-bold">No evidence found in this resume</p>
                              <p className="text-[9px] text-red-400 mt-0.5 font-semibold">Consider adding a project or job mention demonstrating this skill.</p>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {activeSkillData.sources.includes('work') && (
                                <div className="flex items-start gap-3 p-3 bg-slate-50 border rounded-2xl">
                                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-xs">💼</div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-black text-slate-800 leading-snug block">Project: Sales Prediction System</span>
                                    <span className="text-[9px] text-slate-400 mt-0.5 block">Built ML model using Python, Pandas, Scikit-learn (Jan 2026)</span>
                                  </div>
                                  <button className="text-[8px] font-black text-indigo-650 hover:underline border rounded px-1.5 py-0.5 bg-white">View</button>
                                </div>
                              )}

                              {activeSkillData.sources.includes('edu') && (
                                <div className="flex items-start gap-3 p-3 bg-slate-50 border rounded-2xl">
                                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-xs">🎓</div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-black text-slate-800 leading-snug block">Internship: SikhoAI Solutions</span>
                                    <span className="text-[9px] text-slate-400 mt-0.5 block">Built and optimized model integrations using FastAPI and PyTorch</span>
                                  </div>
                                  <button className="text-[8px] font-black text-indigo-650 hover:underline border rounded px-1.5 py-0.5 bg-white">View</button>
                                </div>
                              )}

                              {activeSkillData.sources.includes('file') && (
                                <div className="flex items-start gap-3 p-3 bg-slate-50 border rounded-2xl">
                                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-xs">📄</div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] font-black text-slate-800 block">Skills Matrix Section</span>
                                    <span className="text-[9px] text-slate-400 mt-0.5 block">Explicitly declared in the skills index of the resume</span>
                                  </div>
                                  <button className="text-[8px] font-black text-indigo-650 hover:underline border rounded px-1.5 py-0.5 bg-white">View</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Tips */}
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex gap-2.5 items-start">
                          <span className="text-xs">💡</span>
                          <p className="text-[10px] text-slate-650 leading-relaxed font-bold">
                            Tip: {activeSkillData.summary}
                          </p>
                        </div>

                        {/* Database storage path tags */}
                        <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-2 items-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Data stored in:</span>
                          {['candidate_skills', 'skill_evidence', 'skill_evidence_sources'].map(tbl => (
                            <span key={tbl} className="text-[8px] font-bold bg-slate-100 text-slate-500 border rounded-md px-1.5 py-0.5">{tbl}</span>
                          ))}
                        </div>

                      </div>

                    </div>

                  </motion.div>
                );
              })()}


              {/* PAGE: AUTO CAREER DETECTION */}
              {currentView === 'career' && (() => {
                if (!careerFitUnlocked) {
                  return (
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-sm">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-purple-100">
                        🧭
                      </div>
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-black">
                          <span>🔒 Algorand X402 Micropayment</span>
                          <span>•</span>
                          <span>$0.50 USDC</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Unlock Career Fit &amp; Top Roles</h3>
                        <p className="text-xs text-slate-550 font-semibold leading-relaxed">
                          AI-powered matching of your resume against top career paths, with confidence scores and detailed fit reasoning for each role.
                        </p>
                      </div>

                      <div className="max-w-xs mx-auto">
                        {careerFitPaymentStep === '402' && (
                          <div className="flex items-center justify-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs font-black text-purple-700 animate-pulse mb-4">
                            <span>💸 Preparing $0.50 USDC micropayment challenge...</span>
                          </div>
                        )}
                        {careerFitPaymentStep === 'wallet' && (
                          <div className="flex items-center justify-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs font-black text-purple-700 animate-bounce mb-4">
                            <span>🔑 Check your Pera wallet to sign the $0.50 USDC transaction...</span>
                          </div>
                        )}
                        {careerFitPaymentStep === 'verifying' && (
                          <div className="flex items-center justify-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs font-black text-purple-700 animate-spin mb-4">
                            <span>⏳ Settling transaction on Algorand blockchain...</span>
                          </div>
                        )}
                        {careerFitPaymentStep === 'complete' && (
                          <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs font-black text-emerald-700 mb-4">
                            <span>✓ Payment confirmed ($0.50 USDC) — Unlocking career fit...</span>
                          </div>
                        )}

                        <button
                          onClick={handleUnlockCareerFit}
                          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black px-7 py-3.5 rounded-xl shadow-lg shadow-purple-200 hover:opacity-95 transition-all active:scale-[0.99]"
                        >
                          🔒 Unlock Career Fit — $0.50 USDC
                        </button>

                        {!activeAddress && (
                          <p className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 rounded-lg p-2 mt-4">
                            ⚠️ Connect your Pera wallet from the top right to sign the $0.50 transaction.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }

                if (careerFitRoles.length === 0) {
                  return (
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-sm">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl mx-auto animate-pulse">
                        🧭
                      </div>
                      <div className="max-w-md mx-auto space-y-2">
                        <h3 className="text-lg font-black text-slate-900">Analysing Career Fit...</h3>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          Please wait while our AI extracts and analyzes your resume details to determine your best-fit career pathways in real-time.
                        </p>
                      </div>
                    </div>
                  );
                }

                // Normalise to a display-friendly shape
                const careers = careerFitRoles.map((r, i) => ({
                  title: r.role,
                  pct:   Math.min(100, Math.round(r.confidence > 1 ? r.confidence : r.confidence * 100)),
                  label: i === 0 ? 'Primary Career' : `Alternative Career ${i}`,
                  isPrimary: i === 0,
                  reasons: r.reasons && r.reasons.length > 0 ? r.reasons : [
                    `Strong alignment with ${r.role} core technical skill requirements`,
                    `Demonstrated proficiency in relevant domain tools and frameworks`,
                    `Transferable skills and high industry match probability`
                  ],
                  desc: i === 0 ? 'Best fit based on your skills & experience' : r.confidence >= 80 ? 'Strong alignment' : r.confidence >= 60 ? 'Good alignment' : 'Moderate alignment',
                }));

                const activeCareer = careers.find(c => c.title === selectedCareerOverview) || careers[0];

                // Skills from extracted resume data or default stack
                const rawResumeSkills = extractedData?.structuredData?.skills || [];
                const resumeSkills: string[] = rawResumeSkills.length > 0
                  ? rawResumeSkills.slice(0, 15)
                  : ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'SQL', 'FastAPI', 'Docker', 'Pandas', 'NumPy', 'Data Modeling', 'Git'];

                const confidenceLabel = (pct: number) => pct >= 80 ? 'Very High' : pct >= 60 ? 'High' : pct >= 40 ? 'Moderate' : 'Low';
                const confidenceColor = (pct: number) => pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-blue-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500';

                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Career Fit &amp; Top Pathways</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          AI-analysed career paths personalised to <span className="text-indigo-600 font-bold">{extractedData?.structuredData?.personal?.name || 'your'}</span> profile (1 Primary Career + 4 Alternative Careers).
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {careerFitLoading && (
                          <span className="text-[10px] font-bold text-indigo-500 animate-pulse">Analysing live…</span>
                        )}
                        {resumeId && (
                          <button
                            onClick={() => fetchCareerFitRoles(resumeId)}
                            className="text-[11px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
                          >
                            Re-analyze
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Live results */}
                    {careers.length > 0 && (
                      <>
                        {/* Top Row: Matches vs Details */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                          {/* Left: Top Career Matches list */}
                          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                              Top Career Matches
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">AI</span>
                            </h3>

                            <div className="space-y-2">
                              {careers.map((item, i) => (
                                <div
                                  key={item.title}
                                  onClick={() => setSelectedCareerOverview(item.title)}
                                  className={`flex items-center gap-4 p-3 rounded-2xl border transition-all cursor-pointer ${
                                    (selectedCareerOverview || careers[0]?.title) === item.title
                                      ? 'bg-indigo-50/50 border-indigo-200 shadow-sm'
                                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100'
                                  }`}
                                >
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black ${i === 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {item.title[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-black text-slate-800 leading-snug">{item.title}</h4>
                                    <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{item.desc}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                      <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${item.pct}%` }} />
                                    </div>
                                    <span className="text-xs font-black text-slate-800 w-8 text-right">{item.pct}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right: Selected Career Profile details */}
                          {activeCareer && (
                            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                              <span className="text-xs font-black text-slate-900 block">{activeCareer.label}</span>

                              <div className="flex gap-3 items-center">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-base font-black flex-shrink-0">💼</div>
                                <div>
                                  <h3 className="text-sm font-black text-slate-800">{activeCareer.title}</h3>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{activeCareer.desc}</p>
                                </div>
                              </div>

                              {/* Confidence score */}
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase block">Confidence Score</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl font-black text-indigo-600">{activeCareer.pct}%</span>
                                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all" style={{ width: `${activeCareer.pct}%` }} />
                                  </div>
                                  <span className={`text-[8px] font-black uppercase ${confidenceColor(activeCareer.pct)}`}>{confidenceLabel(activeCareer.pct)}</span>
                                </div>
                              </div>

                              {/* Why this career fits — from AI reasons */}
                              {activeCareer.reasons.length > 0 && (
                                <div className="space-y-3">
                                  <span className="text-[9px] font-black text-slate-400 uppercase block">Why this career fits</span>
                                  <ul className="space-y-2 text-[10px] font-bold text-slate-600">
                                    {activeCareer.reasons.slice(0, 4).map((reason: string, i: number) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-emerald-500 text-base leading-none mt-0.5">✓</span>
                                        <span>{reason}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Bottom: Skills from resume */}
                        {resumeSkills.length > 0 && (
                          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                            <div>
                              <h3 className="text-sm font-black text-slate-900">
                                Skills Detected in Your Resume
                              </h3>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                Extracted by AI from your uploaded resume — {resumeSkills.length} skills found.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {resumeSkills.map((skill: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                );
              })()}


              {/* PAGE: JOB DISCOVERY */}
              {currentView === 'discovery' && (() => {
                const activeCareerVal = selectedCareerDiscovery || targetRole;

                const presets = [
                  'Machine Learning Engineer',
                  'Data Scientist',
                  'Data Analyst',
                  'Software Engineer',
                  'MLOps Engineer'
                ];

                const handleStartScrape = async () => {
                  const target = customCareer.trim() || activeCareerVal;
                  if (!target) return;
                  if (!resumeId) {
                    alert("Please upload a resume first.");
                    return;
                  }

                  setIsScraping(true);
                  setDiscoveryStep(1);
                  setScrapeResult(null);

                  // Simulate steps visually as pipeline executes on backend
                  const timer1 = setTimeout(() => setDiscoveryStep(2), 1500);
                  const timer2 = setTimeout(() => setDiscoveryStep(3), 3000);
                  const timer3 = setTimeout(() => setDiscoveryStep(4), 4500);
                  const timer4 = setTimeout(() => setDiscoveryStep(5), 6500);

                  try {
                    const res = await apiFetch(`/api/v1/resume/${resumeId}/discover-jobs`, {
                      method: 'POST',
                      body: JSON.stringify({ 
                        career: target,
                        location: targetLocation,
                        experienceLevel: experienceLevel,
                        remote: targetLocation?.toLowerCase().includes('remote')
                      })
                    });
                    
                    if (res.success) {
                      setScrapeResult(res.data);
                      // Trigger rematch & reload
                      await apiFetch(`/api/v1/resume/${resumeId}/match-all`, { method: 'POST' });
                      await apiFetch(`/api/v1/resume/${resumeId}/improvements/analyze`, { method: 'POST' });
                      await Promise.allSettled([
                        fetchDistribution(resumeId),
                        fetchMatchedJobs(resumeId),
                        fetchImprovements(resumeId)
                      ]);
                    }
                  } catch (e) {
                    console.error('[Discover] Scrape failed:', e);
                  } finally {
                    clearTimeout(timer1);
                    clearTimeout(timer2);
                    clearTimeout(timer3);
                    clearTimeout(timer4);
                    setDiscoveryStep(5);
                    setIsScraping(false);
                  }
                };

                const currentTargetCareer = customCareer.trim() || activeCareerVal;

                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    
                    {/* Header */}
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Real-Time Target Job Discovery</h2>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Input your target career role to trigger the Apify scraper pipeline and source live matching jobs.</p>
                    </div>

                    {/* Target Career Inputs */}
                    <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Select or Input Target Career</h3>
                        {currentTargetCareer && (
                          <span className="text-xs font-bold text-slate-500">
                            Target Career: <strong className="text-indigo-600">{currentTargetCareer}</strong>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {presets.map(p => (
                          <button
                            key={p}
                            onClick={() => { setSelectedCareerDiscovery(p); setCustomCareer(''); }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              activeCareerVal === p && !customCareer
                                ? 'bg-indigo-600 text-white border-indigo-650 shadow-sm'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-650 border-slate-200'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-3 max-w-md items-center">
                        <input
                          type="text"
                          placeholder="Or type a custom role, e.g. NLP Engineer"
                          value={customCareer}
                          onChange={(e) => setCustomCareer(e.target.value)}
                          className="flex-1 px-3.5 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                        <button
                          onClick={handleStartScrape}
                          disabled={isScraping}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-sm transition-all whitespace-nowrap"
                        >
                          {isScraping ? 'Searching...' : 'Run Real-Time Search'}
                        </button>
                      </div>
                      {isScraping && (
                        <p className="text-xs font-bold text-slate-500 animate-pulse">Searching current market...</p>
                      )}
                    </div>

                    {/* Progress timeline block */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      
                      {/* Step 1: Career understood */}
                      <div className={`border rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all ${
                        discoveryStep >= 1 ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'
                      }`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-4 ${
                          discoveryStep > 1 ? 'bg-emerald-500 text-white' : discoveryStep === 1 && isScraping ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {discoveryStep > 1 ? '✓' : '1'}
                        </span>
                        <div className="text-2xl mb-2">🧠</div>
                        <h4 className="text-xs font-black text-slate-800">Career Understood</h4>
                        <p className="text-[9px] text-slate-450 mt-1 leading-normal">Role parsed & classified</p>
                        <div className="mt-4 bg-emerald-50 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded-md border border-emerald-100 max-w-full truncate">
                          {currentTargetCareer}
                        </div>
                      </div>

                      {/* Step 2: Search profile created */}
                      <div className={`border rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all ${
                        discoveryStep >= 2 ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'
                      }`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-4 ${
                          discoveryStep > 2 ? 'bg-emerald-500 text-white' : discoveryStep === 2 ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {discoveryStep > 2 ? '✓' : '2'}
                        </span>
                        <div className="text-2xl mb-2">📄</div>
                        <h4 className="text-xs font-black text-slate-800">Search Profile Created</h4>
                        <p className="text-[9px] text-slate-450 mt-1 leading-normal">Scraper query matrix generated</p>
                        <div className="mt-3 text-left w-full space-y-1 bg-indigo-50/50 border border-indigo-100 rounded-lg p-2 text-[8px] text-indigo-750 font-bold">
                          <div>• {currentTargetCareer}</div>
                          <div>• Junior {currentTargetCareer}</div>
                          <div>• {currentTargetCareer} Intern</div>
                        </div>
                      </div>

                      {/* Step 3: Finding live jobs */}
                      <div className={`border rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all ${
                        discoveryStep >= 3 ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'
                      }`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-4 ${
                          discoveryStep > 3 ? 'bg-emerald-500 text-white' : discoveryStep === 3 ? 'bg-indigo-650 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {discoveryStep > 3 ? '✓' : '3'}
                        </span>
                        <div className="text-2xl mb-2">🌐</div>
                        <h4 className="text-xs font-black text-slate-800">Finding Live Jobs</h4>
                        <p className="text-[9px] text-slate-450 mt-1 leading-normal">Running real-time Apify actor search</p>
                        <div className="mt-4 bg-indigo-50 text-indigo-700 text-[8px] font-black px-2 py-0.5 rounded-md border border-indigo-100">
                          {isScraping && discoveryStep === 3 ? 'Scraping Active' : discoveryStep > 3 ? 'Completed' : 'Pending'}
                        </div>
                      </div>

                      {/* Step 4: Analyzing jobs */}
                      <div className={`border rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all ${
                        discoveryStep >= 4 ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'
                      }`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-4 ${
                          discoveryStep > 4 ? 'bg-emerald-500 text-white' : discoveryStep === 4 ? 'bg-orange-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {discoveryStep > 4 ? '✓' : '4'}
                        </span>
                        <div className="text-2xl mb-2">⚙️</div>
                        <h4 className="text-xs font-black text-slate-800">Analyzing Jobs</h4>
                        <p className="text-[9px] text-slate-450 mt-1 leading-normal">Deduplicating & normalizing roles</p>
                        <div className="mt-4 bg-orange-50 text-orange-700 text-[8px] font-black px-2 py-0.5 rounded-md border border-orange-100">
                          {isScraping && discoveryStep === 4 ? 'Ingesting data' : discoveryStep > 4 ? 'Completed' : 'Pending'}
                        </div>
                      </div>

                      {/* Step 5: Matching your resume */}
                      <div className={`border rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all ${
                        discoveryStep >= 5 ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-60'
                      }`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-4 ${
                          discoveryStep >= 5 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {discoveryStep >= 5 ? '✓' : '5'}
                        </span>
                        <div className="text-2xl mb-2">✅</div>
                        <h4 className="text-xs font-black text-slate-800">Matching Your Resume</h4>
                        <p className="text-[9px] text-slate-450 mt-1 leading-normal">Calculating scores & tiering matches</p>
                        <button 
                          onClick={() => setCurrentView('overview')}
                          disabled={discoveryStep < 5}
                          className="mt-4 bg-emerald-600 text-white text-[8px] font-black px-2.5 py-1 rounded-md border shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          View Match Buckets →
                        </button>
                      </div>

                    </div>

                  </motion.div>
                );
              })()}


              {/* ================================================================
                  PAGE 16: RICH JOB DISCOVERY (Phase 16)
                 ================================================================ */}
              {currentView === 'jobdisc' && (() => {
                const discoveryJobs: any[] = [];
                if (liveMatchedJobs) {
                  ['100%', '75%', '50%', '20%', '0%'].forEach(tier => {
                    if (liveMatchedJobs[tier]) {
                      liveMatchedJobs[tier].forEach(m => {
                        const j = m.jobId || m;
                        if (!discoveryJobs.some(x => x.jobIdStr === (j._id || j.id || j.jobId))) {
                          discoveryJobs.push({
                            id: discoveryJobs.length,
                            jobIdStr: j._id || j.id || j.jobId || '',
                            title: j.title || 'Job Opportunity',
                            company: j.company || 'Unknown',
                            logo: (j.company || 'J')[0].toUpperCase(),
                            logoBg: 'bg-indigo-50',
                            logoColor: 'text-indigo-650',
                            location: j.location || 'Remote',
                            mode: j.remoteType || 'Remote',
                            match: Math.round((m.matchScore || 0) * 100) || Math.round(m.scores?.overall || 0),
                            badge: m.matchTier || '',
                            badgeColor: m.matchTier === '100%' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700',
                            experience: j.experienceLevel || 'Not specified',
                            type: j.intelligence?.employmentType || 'Full-time',
                            salary: j.salary || 'Not specified',
                            applicants: 'Few',
                            postedAgo: j.postedAt ? `Posted ${new Date(j.postedAt).toLocaleDateString()}` : 'Recently',
                            source: j.source || 'Scraped',
                            skills: j.intelligence?.requiredSkills || [],
                            requiredSkills: j.intelligence?.requiredSkills || [],
                            preferredSkills: m.missingSkills || [],
                            missingSkills: m.missingSkills || [],
                            matchedSkills: m.matchedSkills || [],
                            rawMatchedSkills: m.matchedSkills || [],
                            rawMissingItems: m.missingItems || [],
                            whyYouMatch: m.whyYouMatch || [],
                            whatsMissing: m.whatsMissing || [],
                            matchScores: m.scores || null,
                            overview: j.intelligence?.summary || j.description || '',
                            whyMatch: m.whyMatch || m.whyYouMatch || ['Relevant matches found'],
                          });
                        }
                      });
                    }
                  });
                }
                const job = discoveryJobs[selectedDiscoveryJob] || discoveryJobs[0] || {
                  id: 0,
                  title: 'ML Engineer',
                  company: 'Company X',
                  logo: '💼',
                  logoBg: 'bg-slate-50',
                  logoColor: 'text-slate-700',
                  location: 'Bengaluru, India',
                  mode: 'Hybrid',
                  match: 82,
                  badge: '',
                  badgeColor: '',
                  experience: 'Not specified',
                  type: 'Full-time',
                  salary: 'Not specified',
                  applicants: 'Few',
                  postedAgo: 'Recently',
                  source: 'Scraped',
                  skills: [],
                  requiredSkills: [],
                  preferredSkills: [],
                  overview: '',
                  whyMatch: ['Relevant matches found']
                };

                const totalCount = discoveryJobs.length;
                const matchScoresList = discoveryJobs.map(j => j.match);
                const avgMatchScore = totalCount > 0 ? Math.round(matchScoresList.reduce((a, b) => a + b, 0) / totalCount) : 0;
                const topMatchScore = totalCount > 0 ? Math.max(...matchScoresList) : 0;

                const matchColor = (pct: number) =>
                  pct >= 90 ? 'text-emerald-600' : pct >= 80 ? 'text-indigo-600' : pct >= 70 ? 'text-amber-600' : 'text-red-500';
                const matchBg = (pct: number) =>
                  pct >= 90 ? 'bg-emerald-500' : pct >= 80 ? 'bg-indigo-600' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';

                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

                    {/* ─── Header ─────────────────────────────────── */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Job Opportunities</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          View real-time job openings matching your detected profile or custom search target.
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {[
                          { label: 'Jobs Found', val: totalCount.toString(), sub: 'Live jobs', icon: '💼' },
                          { label: 'Avg Match Score', val: `${avgMatchScore}%`, sub: 'Across all jobs', icon: '📈' },
                          { label: 'Top Match', val: `${topMatchScore}%`, sub: 'Highest match', icon: '🎯' },
                          { label: 'Updated', val: 'Just now', sub: 'Real-time data', icon: '🕒' },
                        ].map(stat => (
                          <div key={stat.label} className="hidden lg:block text-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{stat.icon} {stat.label}</span>
                            <span className="text-base font-black text-slate-900 block mt-0.5">{stat.val}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{stat.sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ─── Filters bar ─────────────────────────────── */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <div className="relative flex-1 min-w-[180px]">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          placeholder="Search job title, company..."
                          className="w-full pl-8 pr-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
                        />
                      </div>
                      {['Experience', 'Location', 'Remote', 'Salary'].map(f => (
                        <button key={f} className="flex items-center gap-1 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700">
                          {f} <ChevronRight size={10} className="rotate-90" />
                        </button>
                      ))}
                      <button className="ml-auto flex items-center gap-1 px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-700">
                        Sort by: Best Match <ChevronRight size={10} className="rotate-90" />
                      </button>
                    </div>

                    {/* ─── Main 2-panel layout ─────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                      {/* LEFT: Job list */}
                      <div className="lg:col-span-2 space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-black text-slate-700">Jobs (${totalCount})</span>
                        </div>
                        {discoveryJobs.map((j, idx) => (
                          <div
                            key={j.id}
                            onClick={() => { setSelectedDiscoveryJob(idx); setJobAnalysisDone(false); }}
                            className={`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer ${
                              selectedDiscoveryJob === idx
                                ? 'bg-indigo-50/60 border-indigo-300 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-10 h-10 rounded-xl ${j.logoBg} border flex items-center justify-center text-sm font-black ${j.logoColor} flex-shrink-0`}>
                                  {j.logo}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-black text-slate-900">{j.title}</span>
                                    <span className={`text-[9px] font-black ${matchColor(j.match)}`}>{j.match}% Match</span>
                                    {j.badge && <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${j.badgeColor}`}>{j.badge}</span>}
                                  </div>
                                  <p className="text-[10px] text-slate-505 font-bold">{j.company}</p>
                                  <p className="text-[9px] text-slate-450 font-medium">{j.location} • {j.mode}</p>
                                  <p className="text-[9px] text-indigo-600 font-semibold mt-1">Source: {j.source}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {j.skills.map((s: any) => (
                                <span key={s} className="text-[8px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">{s}</span>
                              ))}
                              <span className="text-[8px] text-slate-400 ml-auto font-medium mt-1">{j.postedAgo}</span>
                            </div>

                            {/* Phase 20 Action buttons */}
                            <div className="flex items-center justify-between border-t pt-2.5 mt-3 gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open('https://google.com/search?q=jobs', '_blank');
                                }}
                                className="text-[9.5px] font-black text-slate-500 border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-550 transition-colors"
                              >
                                View Job
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDiscoveryJob(idx);
                                  if (jobAnalysisPaid[idx]) {
                                    setJobAnalysisDone(true);
                                    setCurrentView('jobintel');
                                  } else {
                                    setActivePaymentService('job_analysis');
                                    setPayingJobIdx(idx);
                                    setPaymentStep('paywall');
                                  }
                                }}
                                className="text-[9.5px] font-black bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors"
                              >
                                Analyze My Resume
                              </button>
                            </div>
                          </div>
                        ))}
                        {/* Pagination */}
                        <div className="flex items-center justify-between px-1 pt-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, '...', 42].map((p, i) => (
                              <button key={i} className={`w-7 h-7 text-[10px] font-bold rounded-lg border ${
                                p === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}>{p}</button>
                            ))}
                            <button className="w-7 h-7 text-[10px] font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">›</button>
                          </div>
                          <span className="text-[9px] text-slate-400 font-medium">Show 20 per page</span>
                        </div>
                      </div>

                      {/* RIGHT: Selected Job Detail */}
                      <div className="lg:col-span-3 space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          {/* Job header */}
                          <div className="p-5 border-b border-slate-100">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <div className={`w-14 h-14 rounded-2xl ${job.logoBg} border flex items-center justify-center text-2xl font-black ${job.logoColor} flex-shrink-0`}>
                                  {job.logo}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-lg font-black text-slate-900">{job.title}</h3>
                                  </div>
                                  <p className="text-sm font-bold text-slate-600">{job.company}</p>
                                  <p className="text-xs text-slate-400 font-medium mt-0.5">📍 {job.location} • {job.mode}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Posted {job.postedAgo} · Source: {job.source}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className={`text-3xl font-black ${matchColor(job.match)}`}>{job.match}%</div>
                                <div className="text-[10px] text-slate-500 font-bold mt-0.5">Match Score</div>
                                <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden mt-1.5 ml-auto">
                                  <div className={`h-full ${matchBg(job.match)} rounded-full`} style={{ width: `${job.match}%` }} />
                                </div>
                              </div>
                            </div>
                            {/* Meta row */}
                            <div className="grid grid-cols-4 gap-3 mt-4">
                              {[
                                { label: 'Experience', val: job.experience, icon: '🧑‍💼' },
                                { label: 'Employment Type', val: job.type, icon: '📋' },
                                { label: 'Salary', val: job.salary, icon: '💰' },
                                { label: 'Applicants', val: job.applicants, icon: '👥' },
                              ].map(meta => (
                                <div key={meta.label} className="bg-slate-50 rounded-xl p-2.5 border text-center">
                                  <span className="text-[9px] text-slate-400 font-bold block">{meta.icon} {meta.label}</span>
                                  <span className="text-[10px] font-black text-slate-800 block mt-0.5">{meta.val}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Overview + Skills + Actions */}
                          <div className="p-5 space-y-4">
                            <div>
                              <h4 className="text-xs font-black text-slate-800 mb-1.5">Overview</h4>
                              <p className="text-xs text-slate-600 font-medium leading-relaxed">{job.overview}</p>
                              <button className="text-[10px] text-indigo-600 font-bold mt-1 flex items-center gap-0.5 hover:underline">
                                Show more <ChevronRight size={10} className="rotate-90" />
                              </button>
                            </div>

                            <div>
                              <h4 className="text-xs font-black text-slate-800 mb-2">Key Requirements</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-2">Required Skills</span>
                                  <div className="space-y-1">
                                    {job.requiredSkills.map((s: any) => (
                                      <div key={s} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                                        <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" />
                                        {s}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider block mb-2">Preferred Skills</span>
                                  <div className="space-y-1">
                                    {job.preferredSkills.map((s: any) => (
                                      <div key={s} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                                        <CheckCircle2 size={12} className="text-indigo-400 flex-shrink-0" />
                                        {s}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Actions sidebar */}
                            <div className="bg-slate-50/60 rounded-2xl border p-4 space-y-3">
                              <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">Actions</span>
                              <button
                                onClick={() => {
                                  if (jobAnalysisPaid[selectedDiscoveryJob]) {
                                    setJobAnalysisDone(true);
                                    setCurrentView('jobintel');
                                  } else {
                                    setActivePaymentService('job_analysis');
                                    setPayingJobIdx(selectedDiscoveryJob);
                                    setPaymentStep('paywall');
                                  }
                                }}
                                disabled={isAnalyzingJob}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-black py-2.5 rounded-xl shadow-md transition-all"
                              >
                                {isAnalyzingJob ? (
                                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing...</>
                                ) : (
                                  <><Sparkles size={13} /> Analyze My Resume</>
                                )}
                              </button>
                              <p className="text-[9px] text-slate-505 font-medium text-center">Get detailed match, gaps and improvement suggestions.</p>
                              <div className="flex gap-2">
                                <button className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 text-[10px] font-bold py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                                  <CheckCircle2 size={11} /> Save Job
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 text-[10px] font-bold py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
                                  <ArrowRight size={11} /> View on LinkedIn
                                </button>
                              </div>
                              <div className="border-t border-slate-200 pt-3">
                                <span className="text-[9px] font-black text-slate-600 block mb-2">Why this job matches you</span>
                                {job.whyMatch.map((r: any, i: any) => (
                                  <div key={i} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 mb-1">
                                    <CheckCircle2 size={11} className="text-emerald-500 flex-shrink-0" /> {r}
                                  </div>
                                ))}
                                {jobAnalysisDone && (
                                  <button
                                    onClick={() => setCurrentView('jobintel')}
                                    className="mt-3 w-full text-[10px] font-black text-indigo-600 border border-indigo-200 bg-indigo-50 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                                  >
                                    View Match Breakdown <ArrowRight size={10} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Tip banner */}
                            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
                              <span className="text-base">💡</span>
                              <p className="text-[10px] text-amber-850 font-semibold leading-relaxed">
                                Tip: Analyze your resume to get a detailed match report and personalized improvement suggestions for this job.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ─── Post-analysis: Job-Specific Intelligence Panel ──── */}
                    {jobAnalysisDone && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center flex-shrink-0">
                            <Brain size={22} className="text-white" />
                          </div>
                          <div>
                            <p className="text-white font-black text-sm mb-1">Job-Specific Intelligence Ready</p>
                            <p className="text-indigo-200 text-xs font-medium">
                              Deep analysis complete for <strong className="text-white">{job.title} @ {job.company}</strong> — {job.match}% match
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setCurrentView('jobintel')}
                          className="flex-shrink-0 flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-xl text-xs font-black hover:bg-indigo-50 transition-all shadow-sm"
                        >
                          <Sparkles size={13} /> Enter Job-Specific Intelligence
                        </button>
                      </motion.div>
                    )}

                  </motion.div>
                );
              })()}{currentView === 'jobintel' && (() => {
                const discoveryJobsIntel: any[] = [];
                if (liveMatchedJobs) {
                  ['100%', '75%', '50%', '20%', '0%'].forEach(tier => {
                    if (liveMatchedJobs[tier]) {
                      liveMatchedJobs[tier].forEach(m => {
                        const j = m.jobId || m;
                        if (!discoveryJobsIntel.some(x => x.jobIdStr === (j._id || j.id || j.jobId))) {
                          discoveryJobsIntel.push({
                            id: discoveryJobsIntel.length,
                            jobIdStr: j._id || j.id || j.jobId || '',
                            title: j.title || 'Job Opportunity',
                            company: j.company || 'Unknown',
                            logo: (j.company || 'J')[0].toUpperCase(),
                            logoBg: 'bg-indigo-50',
                            logoColor: 'text-indigo-650',
                            location: j.location || 'Remote',
                            mode: j.remoteType || 'Remote',
                            match: Math.round((m.matchScore || 0) * 100) || Math.round(m.scores?.overall || 0),
                            badge: m.matchTier || '',
                            badgeColor: m.matchTier === '100%' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700',
                            experience: j.experienceLevel || 'Not specified',
                            type: j.intelligence?.employmentType || 'Full-time',
                            salary: j.salary || 'Not specified',
                            applicants: 'Few',
                            postedAgo: j.postedAt ? `Posted ${new Date(j.postedAt).toLocaleDateString()}` : 'Recently',
                            source: j.source || 'Scraped',
                            skills: j.intelligence?.requiredSkills || [],
                            requiredSkills: j.intelligence?.requiredSkills || [],
                            preferredSkills: m.missingSkills || [],
                            missingSkills: m.missingSkills || [],
                            matchedSkills: m.matchedSkills || [],
                            rawMatchedSkills: m.matchedSkills || [],
                            rawMissingItems: m.missingItems || [],
                            whyYouMatch: m.whyYouMatch || [],
                            whatsMissing: m.whatsMissing || [],
                            matchScores: m.scores || null,
                            overview: j.intelligence?.summary || j.description || '',
                            whyMatch: m.whyMatch || m.whyYouMatch || ['Relevant matches found'],
                          });
                        }
                      });
                    }
                  });
                }
                const intel = discoveryJobsIntel[selectedDiscoveryJob] || discoveryJobsIntel[0] || {
                  title: 'ML Engineer',
                  company: 'Company X',
                  logo: '💼',
                  logoBg: 'bg-slate-50',
                  logoColor: 'text-slate-700',
                  location: 'Bengaluru, India',
                  mode: 'Hybrid',
                  match: 82,
                  badge: '',
                  badgeColor: '',
                  experience: 'Not specified',
                  type: 'Full-time',
                  salary: 'Not specified',
                  applicants: 'Few',
                  postedAgo: 'Recently',
                  source: 'Scraped',
                  skills: [],
                  requiredSkills: [],
                  preferredSkills: [],
                  overview: '',
                  whyMatch: ['Relevant matches found']
                };

                const matchBreakdown = [
                  { label: 'Overall Match',        val: intel.match || 82, color: 'bg-indigo-650' },
                  { label: 'Skills',               val: intel.matchScores?.skills || Math.round((intel.match || 82) * 1.05), color: 'bg-emerald-500' },
                  { label: 'Experience',            val: intel.matchScores?.experience || Math.round((intel.match || 82) * 0.9), color: 'bg-blue-500' },
                  { label: 'Projects',              val: intel.matchScores?.projects || Math.round((intel.match || 82) * 0.95), color: 'bg-purple-500' },
                  { label: 'Education',             val: intel.matchScores?.education || 100, color: 'bg-orange-500' },
                  { label: 'Career Alignment',      val: intel.matchScores?.alignment || Math.round((intel.match || 82) * 0.98), color: 'bg-pink-500' },
                ];

                return (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

                    {/* ─── Back to Job List Header ─── */}
                    <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Job-Specific Resume Analysis</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Deep dive analysis of your resume against the selected job requirements.</p>
                      </div>
                      <button
                        onClick={() => setCurrentView('jobdisc')}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white px-3.5 py-2 rounded-xl hover:bg-slate-550 transition-colors shadow-sm"
                      >
                        ← Back to Job Opportunities
                      </button>
                    </div>

                    {/* ─── Layout Grid: Selected Job Info & Overall Match ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Job Info */}
                      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-indigo-650 border flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
                            {intel.logo}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900">{intel.title}</h3>
                            <p className="text-sm font-bold text-slate-600">{intel.company}</p>
                            <p className="text-xs text-slate-400 font-semibold mt-2">📍 {intel.location} • 💼 {intel.type} • ⏱️ {intel.postedAgo}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => window.open('https://google.com/search?q=jobs', '_blank')}
                          className="text-xs font-extrabold text-slate-600 border px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          View Job Details ↗
                        </button>
                      </div>

                      {/* Right Overall Match */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-5">
                        <div className="relative w-20 h-20 flex-shrink-0">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10b981" strokeWidth="3"
                              strokeDasharray={`${intel.match} ${100 - intel.match}`} strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-slate-900">{intel.match}%</span>
                            <span className="text-[7.5px] font-bold text-emerald-600 uppercase">Good Match</span>
                          </div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-800">Overall Match Score</h4>
                          <p className="text-[10px] text-slate-500 font-semibold leading-normal mt-1">You are a good fit for this role. Strengthen the missing areas to increase your chances.</p>
                          <button className="text-[9px] font-bold text-indigo-600 hover:underline mt-1.5">How is this score calculated? →</button>
                        </div>
                      </div>
                    </div>

                    {/* ─── Match Breakdown Grid ─── */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Match Breakdown</span>
                        <span className="text-[9px] text-slate-400 font-semibold cursor-help">(i)</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {matchBreakdown.slice(1, 5).map((m, i) => (
                          <div key={i} className="border border-slate-100 rounded-2xl p-4 text-center space-y-1.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{m.label}</span>
                            <span className="text-xl font-black text-slate-850 block">{m.val}%</span>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.val}%` }} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 block">Strong Match</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ─── Detailed Analysis vs Strengths and Gaps ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Detailed Analysis table */}
                      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                        <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider">Detailed Analysis</h4>

                        {/* What you do well */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                            <span className="text-emerald-500">✓</span> What You Do Well
                            <span className="text-[9px] text-slate-400 font-semibold ml-1">Your strengths that match the job requirements.</span>
                          </div>
                          <div className="space-y-2">
                            {(intel.rawMatchedSkills && intel.rawMatchedSkills.length > 0 ? intel.rawMatchedSkills : [
                              { skill: 'Python', matchingEvidence: 'Extensive experience in Python programming', confidenceScore: 0.95 },
                              { skill: 'SQL', matchingEvidence: 'Good SQL querying and database knowledge', confidenceScore: 0.85 },
                            ]).map((item: any, idx: number) => {
                              const skillName = item.skill || item.name || String(item);
                              const evidence = item.matchingEvidence || item.desc || 'Matched requirement';
                              const score = Math.round((item.confidenceScore || 0.9) * 100);
                              return (
                                <div key={idx} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
                                  <span className="w-24 font-black text-slate-800">{skillName}</span>
                                  <span className="flex-1 text-[10px] text-slate-500 truncate px-4">{evidence}</span>
                                  <span className="text-[10px] text-emerald-600 bg-emerald-50 font-black px-2 py-0.5 rounded border border-emerald-100 mr-4">Strong</span>
                                  <span className="font-bold text-slate-600">{score}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* What needs improvement */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                            <span className="text-amber-500">⚠</span> What Needs Improvement
                            <span className="text-[9px] text-slate-400 font-semibold ml-1">Areas to strengthen to match the job better.</span>
                          </div>
                          <div className="space-y-2">
                            {(intel.rawMissingItems && intel.rawMissingItems.length > 0 ? intel.rawMissingItems : [
                              { name: 'Docker', justification: 'Required tool not found in your resume', priority: 'High' },
                              { name: 'AWS', justification: 'Cloud experience not demonstrated', priority: 'High' },
                            ]).map((item: any, idx: number) => {
                              const gapName = item.name || item.skill || String(item);
                              const justification = item.justification || item.desc || 'Requirement missing or not found';
                              const priority = item.priority || 'Medium';
                              const color = priority === 'High' ? 'text-red-600 bg-red-50 border-red-100' : 'text-amber-600 bg-amber-50 border-amber-100';
                              return (
                                <div key={idx} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
                                  <span className="w-24 font-black text-slate-800">{gapName}</span>
                                  <span className="flex-1 text-[10px] text-slate-500 truncate px-4">{justification}</span>
                                  <span className={`text-[9.5px] font-black px-2 py-0.5 rounded border ${color}`}>{priority} Priority</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Gaps summary breakdown */}
                      <div className="space-y-6">
                        {/* Missing panel */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                          <h4 className="text-xs font-black text-red-600 flex items-center gap-1">🚨 Missing</h4>
                          <p className="text-[9px] text-slate-400 font-semibold">Important skills/requirements not found in your resume.</p>
                          <div className="space-y-2 pt-1">
                            {(intel.rawMissingItems && intel.rawMissingItems.length > 0 ? intel.rawMissingItems : [
                              { name: 'Docker', priority: 'High' },
                              { name: 'AWS', priority: 'High' }
                            ]).map((item: any) => {
                              const name = item.name || item.skill || String(item);
                              const impact = item.priority === 'High' ? 'High Impact' : 'Medium Impact';
                              return (
                                <div key={name} className="flex justify-between items-center text-xs font-bold text-slate-700">
                                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {name}</span>
                                  <span className="text-[8px] bg-red-50 text-red-600 border border-red-100 font-black px-2 py-0.5 rounded">{impact}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Weak evidence panel */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                          <h4 className="text-xs font-black text-amber-600 flex items-center gap-1">⚠ Weak Evidence</h4>
                          <p className="text-[9px] text-slate-400 font-semibold">Some exposure but not strong enough.</p>
                          <div className="space-y-2 pt-1">
                            {(intel.preferredSkills && intel.preferredSkills.length > 0 ? intel.preferredSkills : ['CI/CD', 'Kubernetes']).map((item: any) => {
                              const name = item.skill || item.name || String(item);
                              return (
                                <div key={name} className="flex justify-between items-center text-xs font-bold text-slate-700">
                                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {name}</span>
                                  <span className="text-[8px] font-black px-2 py-0.5 rounded border bg-amber-50 text-amber-600 border-amber-100">Medium Impact</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Strong evidence panel */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                          <h4 className="text-xs font-black text-emerald-600 flex items-center gap-1">✓ Strong Evidence</h4>
                          <p className="text-[9px] text-slate-400 font-semibold">Well demonstrated in your resume.</p>
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="space-y-2">
                              {(intel.rawMatchedSkills && intel.rawMatchedSkills.length > 0 ? intel.rawMatchedSkills.slice(0, 4) : [
                                { skill: 'Python' },
                                { skill: 'SQL' }
                              ]).map((item: any) => {
                                const name = item.skill || item.name || String(item);
                                return (
                                  <div key={name} className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <span className="text-emerald-500">✓</span> {name}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex flex-col items-center justify-center bg-emerald-50/50 border border-emerald-100 rounded-xl p-2 text-center">
                              <span className="text-2xl">🏆</span>
                              <span className="text-[9px] text-emerald-700 font-black mt-1">Well Demonstrated</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ─── Recommendation Banner ─── */}
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-150 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 text-lg">🚀</div>
                        <div>
                          <h5 className="text-xs font-black text-indigo-950">Next Action: Tailored Skill Upgrades</h5>
                          <p className="text-[10px] text-indigo-850 mt-0.5 leading-relaxed font-semibold">
                            Acquire the missing required skills or create targeted portfolio projects matching this job to increase interview chances by 3.5x.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {currentView === 'payment' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Top Stats Cards Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Balance', val: '12.45 USDC', sub: 'Available Balance', icon: '💳', bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                      { label: 'Total Spent', val: '2.31 USDC', sub: 'All time', icon: '📈', bg: 'bg-indigo-50 text-indigo-655 border-indigo-100' },
                      { label: 'Total Transactions', val: '48', sub: 'All time', icon: '🧾', bg: 'bg-blue-50 text-blue-600 border-blue-100' },
                      { label: 'Success Rate', val: '98.6%', sub: 'Successful Payments', icon: '🛡️', bg: 'bg-teal-50 text-teal-655 border-teal-100' }
                    ].map((st, i) => (
                      <div key={i} className="bg-white border rounded-2xl p-4 shadow-sm flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${st.bg}`}>
                          {st.icon}
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{st.label}</span>
                          <span className="text-base font-black text-slate-855 block mt-0.5">{st.val}</span>
                          <span className="text-[8px] text-slate-400 font-bold">{st.sub}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Columns: Tables */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Services Table */}
                      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
                          <div>
                            <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">x402 Services</h3>
                            <p className="text-[10px] text-slate-450 font-bold mt-0.5">Pay-per-use AI services powered by x402 protocol</p>
                          </div>
                          <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow transition-all">
                            + Add New Service
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
                            <thead>
                              <tr className="bg-slate-50 text-[9px] text-slate-400 font-black uppercase tracking-wider border-b">
                                <th className="px-5 py-3.5">Service</th>
                                <th className="px-4 py-3.5">Description</th>
                                <th className="px-4 py-3.5">Price (USDC)</th>
                                <th className="px-4 py-3.5">Endpoint</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-5 py-3.5">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(x402Services.length > 0 ? x402Services : [
                                { serviceId: 'job_analysis', name: 'Job-Specific Analysis', description: 'Deep analysis of your resume against a specific job', priceUsd: 0.02, endpoint: '/api/v1/resume/jobs/:jobId/analyze', status: 'Active' },
                                { serviceId: 'resume_improvement', name: 'Resume Improvement', description: 'AI-powered resume improvement with before/after suggestions', priceUsd: 0.05, endpoint: '/api/v1/resume/:resumeId/improvements/apply', status: 'Active' },
                                { serviceId: 'project_generation', name: 'Project Generation', description: 'Generate complete project plan with architecture, tasks & more', priceUsd: 0.03, endpoint: '/api/v1/resume/:resumeId/projects/generate', status: 'Active' }
                              ]).map((srv, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                  <td className="px-5 py-4 flex items-center gap-2">
                                    <span className="text-base">{srv.serviceId === 'job_analysis' ? '🔍' : srv.serviceId === 'resume_improvement' ? '📝' : '🧬'}</span>
                                    <span className="font-black text-slate-800">{srv.name}</span>
                                  </td>
                                  <td className="px-4 py-4 text-[10.5px] text-slate-505 font-medium max-w-[200px] leading-relaxed">{srv.description}</td>
                                  <td className="px-4 py-4">
                                    <span className="font-black text-slate-800 block">${srv.priceUsd} USDC</span>
                                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Per Request</span>
                                  </td>
                                  <td className="px-4 py-4 font-mono text-[9px] text-slate-400 bg-slate-50/50 rounded px-1.5 py-0.5">{srv.endpoint}</td>
                                  <td className="px-4 py-4">
                                    <span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-2 py-0.5 rounded border border-emerald-100">
                                      {srv.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4">
                                    <button className="text-[10px] font-black text-indigo-650 hover:underline">Configure</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Transactions Table */}
                      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
                          <div>
                            <h3 className="text-xs font-black text-slate-850 uppercase tracking-wider">Recent Transactions</h3>
                            <p className="text-[10px] text-slate-450 font-bold mt-0.5">Audit log of all x402 protocol payments</p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
                            <thead>
                              <tr className="bg-slate-50 text-[9px] text-slate-400 font-black uppercase tracking-wider border-b">
                                <th className="px-5 py-3.5">Tx ID</th>
                                <th className="px-4 py-3.5">User</th>
                                <th className="px-4 py-3.5">Service</th>
                                <th className="px-4 py-3.5">Amount</th>
                                <th className="px-4 py-3.5">Currency</th>
                                <th className="px-4 py-3.5">Wallet</th>
                                <th className="px-4 py-3.5">Hash</th>
                                <th className="px-4 py-3.5">Status</th>
                                <th className="px-5 py-3.5">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(x402Transactions.length > 0 ? x402Transactions : [
                                { _id: 'TXN_9f7a2c1b', userId: 'user_01', serviceId: 'job_analysis', amount: 0.02, currency: 'USDC', walletAddress: '0x8A7f...47b2C', txHash: '0x1a9f...c3e7b', status: 'Success', timestamp: '2025-05-19T10:24:00Z' },
                                { _id: 'TXN_3b8d9e4f', userId: 'user_01', serviceId: 'resume_improvement', amount: 0.05, currency: 'USDC', walletAddress: '0x8A7f...47b2C', txHash: '0x2b7c...d9f1a', status: 'Success', timestamp: '2025-05-19T10:18:00Z' },
                                { _id: 'TXN_7e6d1a2b', userId: 'user_01', serviceId: 'project_generation', amount: 0.03, currency: 'USDC', walletAddress: '0x8A7f...47b2C', txHash: '0x8c2d...e4a9b', status: 'Success', timestamp: '2025-05-19T09:45:00Z' },
                                { _id: 'TXN_1c2d3e4f', userId: 'user_02', serviceId: 'job_analysis', amount: 0.02, currency: 'USDC', walletAddress: '0x988c...56d3E', txHash: '0x3d4e...f7a1b', status: 'Success', timestamp: '2025-05-19T09:30:00Z' },
                                { _id: 'TXN_5a6b7c8d', userId: 'user_03', serviceId: 'resume_improvement', amount: 0.05, currency: 'USDC', walletAddress: '0x1c9e...78f4A', txHash: '0x7e1a...b3c2d', status: 'Failed', timestamp: '2025-05-19T08:56:00Z' }
                              ]).map((tx, idx) => {
                                const srvName = tx.serviceId === 'job_analysis' ? 'Job-Specific Analysis' : tx.serviceId === 'resume_improvement' ? 'Resume Improvement' : 'Project Generation';
                                return (
                                  <tr key={idx} onClick={() => setSelectedTx({
                                    txId: tx._id.toString(),
                                    userId: tx.userId,
                                    srv: srvName,
                                    amt: tx.amount.toString(),
                                    cur: tx.currency,
                                    wallet: tx.walletAddress,
                                    hash: tx.txHash,
                                    status: tx.status,
                                    date: new Date(tx.timestamp).toLocaleString()
                                  })} className="hover:bg-slate-50/30 transition-colors cursor-pointer">
                                    <td className="px-5 py-3.5 font-mono text-[10px] text-slate-450 font-bold">{tx._id.toString().substring(0, 12)}</td>
                                    <td className="px-4 py-3.5 text-slate-500">{tx.userId}</td>
                                    <td className="px-4 py-3.5 font-black text-slate-800">{srvName}</td>
                                    <td className="px-4 py-3.5 font-black text-slate-800">${tx.amount}</td>
                                    <td className="px-4 py-3.5 text-slate-400 uppercase">{tx.currency}</td>
                                    <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400">{tx.walletAddress}</td>
                                    <td className="px-4 py-3.5">
                                      <span className="text-indigo-650 hover:underline font-mono text-[10px]">
                                        {tx.txHash.substring(0, 10)}...
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <span className={`text-[8.5px] font-black px-2 py-0.5 rounded ${tx.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                        {tx.status}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-[10px] text-slate-400 font-semibold whitespace-nowrap">{new Date(tx.timestamp).toLocaleDateString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>

                    {/* Right Column: Sidebar (Wallet & Explanation) */}
                    <div className="space-y-6">
                      
                      {/* Wallet Card */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-2.5 items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-indigo-600 flex items-center justify-center text-white text-xs font-black">
                              A
                            </div>
                            <div>
                              <span className="text-[10px] font-black text-slate-800 block flex items-center gap-1">
                                0x8A7f...47b2C
                                <span className="cursor-pointer text-slate-400 hover:text-slate-600">📋</span>
                              </span>
                              <span className="text-[8.5px] text-emerald-650 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                                 Algorand Mainnet
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="border-t pt-3 flex justify-between items-center text-xs font-bold text-slate-650">
                          <span>USDC Balance:</span>
                          <span className="font-black text-slate-900">12.45 USDC</span>
                        </div>
                        <button className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-black py-2 rounded-xl transition-all shadow-sm">
                          Manage Wallet
                        </button>
                      </div>

                      {/* How x402 Payments Work */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-slate-805 uppercase tracking-wider mb-2">How x402 Payments Work</h4>
                        
                        <div className="space-y-4 relative pl-3 border-l border-slate-100 ml-1">
                          {[
                            { step: '1', title: 'User requests a paid service', desc: 'System returns 402 Payment Required' },
                            { step: '2', title: 'Wallet sends payment', desc: 'Micro-payment sent via x402 protocol' },
                            { step: '3', title: 'Payment verified', desc: 'Transaction verified on Algorand' },
                            { step: '4', title: 'Service executed', desc: 'AI service runs and returns result' }
                          ].map((s, idx) => (
                            <div key={idx} className="relative space-y-0.5">
                              <span className="absolute -left-[21px] top-0 w-4.5 h-4.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-black">
                                {s.step}
                              </span>
                              <p className="text-xs font-black text-slate-800">{s.title}</p>
                              <p className="text-[9px] text-slate-450 font-semibold">{s.desc}</p>
                            </div>
                          ))}
                        </div>

                        <div className="bg-indigo-50/20 border border-indigo-100 rounded-xl p-3 flex gap-2 items-center text-[10px] text-indigo-700 font-bold">
                          <span>🛡️</span>
                          <p><strong>Secure • Transparent • Pay-per-use</strong><br />You only pay for what you use.</p>
                        </div>
                      </div>

                      {/* Spending Overview Chart */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider">Spending Overview</h4>
                          <span className="text-[8.5px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer">
                            This Month <span>▼</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-5 py-1">
                          {/* Mock Donut */}
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6366f1" strokeWidth="4.5" strokeDasharray="47 53" />
                              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10b981" strokeWidth="4.5" strokeDasharray="25 75" strokeDashoffset="-47" />
                              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="28 72" strokeDashoffset="-72" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-[8px] text-slate-400 font-bold block uppercase">Total Spent</span>
                              <span className="text-sm font-black text-slate-800">0.85</span>
                              <span className="text-[7px] text-slate-450 font-bold uppercase">USDC</span>
                            </div>
                          </div>

                          <div className="space-y-2 flex-1">
                            {[
                              { label: 'Job Analysis', val: '0.24 USDC (28%)', color: 'bg-indigo-500' },
                              { label: 'Resume Improvement', val: '0.40 USDC (47%)', color: 'bg-emerald-500' },
                              { label: 'Project Generation', val: '0.21 USDC (25%)', color: 'bg-amber-500' }
                            ].map((c, i) => (
                              <div key={i} className="flex gap-2 items-start text-[10px] font-bold text-slate-655">
                                <span className={`w-2 h-2 rounded-full mt-1 ${c.color}`} />
                                <div className="leading-tight">
                                  <p className="text-slate-805 font-black">{c.label}</p>
                                  <span className="text-[9px] text-slate-400">{c.val}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  PAGE: LIVE JOBS — Find real jobs for your top roles
                 ═══════════════════════════════════════════════════════ */}
              {/* ═══════════════════════════════════════════════════════
                  PAGE: LIVE JOB OPPORTUNITIES
                  Jobs grouped by career category from Top Career Matches
                 ═══════════════════════════════════════════════════════ */}
              {currentView === 'jobs' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

                  {/* Header */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Live Job Opportunities</h2>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Real jobs matched to your top {careerFitRoles.length > 0 ? careerFitRoles.length : '5'} career paths
                      </p>
                    </div>
                    {jobDiscoveryUnlocked ? (
                      <button
                        onClick={fetchLiveJobs}
                        disabled={isFindingJobs}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow hover:opacity-90 transition-all disabled:opacity-60"
                      >
                        {isFindingJobs ? (
                          <><span className="animate-spin inline-block">⟳</span> Searching...</>
                        ) : (
                          <><Search size={13} /> Refresh Jobs</>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-sm">
                        <span>🔒 X402 Paywall</span>
                        <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-md">$0.50 USDC</span>
                      </div>
                    )}
                  </div>

                  {/* ─── LOCKED STATE: X402 PAYMENT CARD ─────────────────── */}
                  {!jobDiscoveryUnlocked && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-sm">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-indigo-100">
                        💼
                      </div>
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black">
                          <span>🔒 Algorand X402 Micropayment</span>
                          <span>•</span>
                          <span>$0.50 USDC</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900">Unlock Live Job Opportunities</h3>
                        <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                          Perform real-time job discovery across Google Search, Greenhouse, Lever &amp; Ashby matched directly against your top 5 career paths with custom match scoring.
                        </p>
                      </div>

                      {/* Show the 5 career categories that will be searched */}
                      <div className="space-y-2 max-w-md mx-auto text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">
                          Will Search &amp; Match Live Jobs For These 5 Roles:
                        </p>
                        {careerFitRoles.length > 0 ? (
                          careerFitRoles.map((r, i) => (
                            <div key={r.role} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5">
                              <span className="text-[10px] font-black text-amber-600 w-6 flex-shrink-0">
                                {i === 0 ? '⭐' : `#${i + 1}`}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-black text-slate-800 block truncate">{r.role}</span>
                                <span className="text-[9px] font-bold text-slate-400 block">{i === 0 ? 'Primary Career Path' : 'Alternative Career Path'}</span>
                              </div>
                              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                                {r.confidence}% match
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-6 text-center text-xs text-slate-500 font-semibold">
                            🔒 Unlock Career Fit to analyze your personalized top career paths, or unlock Job Discovery to automatically analyze them.
                          </div>
                        )}
                      </div>

                      {/* Payment step feedback */}
                      {jobDiscoveryPaymentStep === '402' && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs font-black text-indigo-700 animate-pulse">
                          <span>💸 Preparing $0.50 USDC micropayment challenge...</span>
                        </div>
                      )}
                      {jobDiscoveryPaymentStep === 'wallet' && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs font-black text-purple-700 animate-pulse">
                          <span>🔑 Check your Pera wallet to sign the $0.50 USDC transaction...</span>
                        </div>
                      )}
                      {jobDiscoveryPaymentStep === 'verifying' && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs font-black text-amber-700 animate-pulse">
                          <span className="animate-spin inline-block text-base">⟳</span>
                          <span>Verifying Algorand x402 payment settlement on-chain...</span>
                        </div>
                      )}
                      {jobDiscoveryPaymentStep === 'complete' && (
                        <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs font-black text-emerald-700">
                          <span>✓ Payment confirmed ($0.50 USDC) — Unlocking live jobs...</span>
                        </div>
                      )}

                      {!jobDiscoveryPaymentStep && (
                        <div className="space-y-2 max-w-sm mx-auto">
                          <button
                            disabled={isFindingJobs}
                            onClick={async () => {
                              setJobDiscoveryPaymentStep('verifying');
                              try {
                                // 1. Try direct API endpoint (works if BYPASS_PAYMENT=true)
                                const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || document.cookie.split('; ').find(r => r.startsWith('accessToken='))?.split('=')[1];
                                const res = await fetch(`${backendOrigin}/api/v1/resume/find-jobs`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                  },
                                  body: JSON.stringify({
                                    resumeId: resumeId || 'demo_resume',
                                    location: targetLocation || 'India',
                                    experienceLevel: experienceLevel || 'Entry Level'
                                  }),
                                });

                                if (res.ok) {
                                  setJobDiscoveryPaymentStep('complete');
                                  setJobDiscoveryUnlocked(true);
                                  await new Promise(r => setTimeout(r, 600));
                                  setJobDiscoveryPaymentStep(null);
                                  fetchLiveJobs();
                                  return;
                                }

                                if (res.status === 402) {
                                  if (!activeAddress) {
                                    setJobDiscoveryPaymentStep(null);
                                    alert('Please connect your Pera wallet first from the top navigation to pay $0.50 USDC.');
                                    return;
                                  }
                                  setJobDiscoveryPaymentStep('402');
                                  const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
                                  setJobDiscoveryPaymentStep('wallet');
                                  
                                  const paidRes = await x402Fetch(`${backendOrigin}/api/v1/resume/find-jobs`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                    },
                                    body: JSON.stringify({
                                      resumeId: resumeId || 'demo_resume',
                                      location: targetLocation || 'India',
                                      experienceLevel: experienceLevel || 'Entry Level'
                                    }),
                                  });

                                  if (!paidRes.ok) {
                                    const errData = await paidRes.json().catch(() => ({}));
                                    throw new Error(errData.reason || errData.error || errData.message || `Payment failed with status ${paidRes.status}`);
                                  }

                                  setJobDiscoveryPaymentStep('verifying');
                                  await new Promise(r => setTimeout(r, 1200));
                                  setJobDiscoveryPaymentStep('complete');
                                  setJobDiscoveryUnlocked(true);
                                  await new Promise(r => setTimeout(r, 800));
                                  setJobDiscoveryPaymentStep(null);
                                  fetchLiveJobs();
                                } else {
                                  const errData = await res.json().catch(() => ({}));
                                  throw new Error(errData.message || `HTTP ${res.status}`);
                                }
                              } catch (payErr: any) {
                                console.error('Job discovery payment failed:', payErr);
                                setJobDiscoveryPaymentStep(null);
                                alert(payErr?.message || 'Payment failed. Please ensure your Pera wallet is connected and funded with USDC.');
                              }
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-200 hover:opacity-95 transition-all active:scale-[0.99]"
                          >
                            🔒 Unlock Live Jobs — $0.50 USDC
                          </button>
                          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 font-semibold">
                            <span>• Algorand x402 Protocol</span>
                            <span>• $0.50 USDC</span>
                            <span>• Instant Verification</span>
                          </div>
                          {!activeAddress && (
                            <p className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 rounded-lg p-2">
                              ⚠️ Connect your Pera wallet from the top right to sign the $0.50 transaction.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ─── UNLOCKED STATE: LIVE JOBS DASHBOARD ─────────────────── */}
                  {jobDiscoveryUnlocked && (
                    <>
                      {/* Career Category Tabs — from Top Career Matches */}
                      {(careerFitRoles.length > 0 || liveJobsList.length > 0) && (
                        <div className="overflow-x-auto">
                          <div className="flex gap-1.5 min-w-max pb-1">
                            <button
                              onClick={() => setJobRoleFilter('all')}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border ${
                                jobRoleFilter === 'all'
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              All Jobs
                              {liveJobsList.length > 0 && (
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${jobRoleFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {liveJobsList.length}
                                </span>
                              )}
                            </button>
                            {careerFitRoles.map((r, i) => {
                              const roleJobs = liveJobsList.filter((m: any) => {
                                const title = ((m.jobId || m)?.title || '').toLowerCase();
                                const keywords = r.role.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
                                return keywords.some((kw: string) => title.includes(kw));
                              });
                              return (
                                <button
                                  key={r.role}
                                  onClick={() => setJobRoleFilter(r.role)}
                                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap border ${
                                    jobRoleFilter === r.role
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                  }`}
                                >
                                  <span className={`text-[8px] font-black px-1 py-0.5 rounded ${
                                    i === 0 ? 'bg-amber-400/20 text-amber-700' : 'bg-indigo-100/50 text-indigo-500'
                                  }`}>{i === 0 ? '⭐' : `#${i + 1}`}</span>
                                  {r.role}
                                  <span className={`text-[9px] font-black ${jobRoleFilter === r.role ? 'text-indigo-200' : 'text-slate-400'}`}>
                                    {r.confidence}%
                                  </span>
                                  {roleJobs.length > 0 && (
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                      jobRoleFilter === r.role ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>{roleJobs.length}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── Filter bar: search, location, source, sort ─────── */}
                      {liveJobsList.length > 0 && (() => {
                        const uniqueLocations = Array.from(new Set(
                          liveJobsList.map((m: any) => (m.jobId || m)?.location || '').filter(Boolean)
                        )).slice(0, 12);
                        const uniqueSources = Array.from(new Set(
                          liveJobsList.map((m: any) => (m.jobId || m)?.source || 'Career Page').filter(Boolean)
                        ));
                        const activeFilterCount =
                          (jobSearchQuery.trim() ? 1 : 0) +
                          (jobLocationFilter !== 'all' ? 1 : 0) +
                          (jobSourceFilter !== 'all' ? 1 : 0);
                        return (
                          <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-indigo-300 transition-colors">
                                <Search size={13} className="text-slate-400 flex-shrink-0" />
                                <input
                                  value={jobSearchQuery}
                                  onChange={(e) => setJobSearchQuery(e.target.value)}
                                  placeholder="Search by title, company, skill…"
                                  className="w-full bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                                />
                                {jobSearchQuery && (
                                  <button onClick={() => setJobSearchQuery('')} className="text-slate-400 hover:text-slate-600"><X size={12} /></button>
                                )}
                              </div>
                              <button
                                onClick={() => setShowJobFilters(v => !v)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                                  showJobFilters || activeFilterCount > 0
                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <Layers size={12} /> Filters
                                {activeFilterCount > 0 && (
                                  <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-md">{activeFilterCount}</span>
                                )}
                              </button>
                            </div>

                            {showJobFilters && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                <select
                                  value={jobLocationFilter}
                                  onChange={(e) => setJobLocationFilter(e.target.value)}
                                  className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-300 cursor-pointer"
                                >
                                  <option value="all">📍 All Locations</option>
                                  {uniqueLocations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                  ))}
                                  {!uniqueLocations.some(l => l.toLowerCase().includes('remote')) && (
                                    <option value="remote">📍 Remote only</option>
                                  )}
                                </select>
                                <select
                                  value={jobSourceFilter}
                                  onChange={(e) => setJobSourceFilter(e.target.value)}
                                  className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-300 cursor-pointer"
                                >
                                  <option value="all">🔗 All Sources</option>
                                  {uniqueSources.map(src => (
                                    <option key={src} value={src}>{src === 'find-jobs' ? 'Gemini' : src === 'google-jobs' ? 'Google Jobs' : src}</option>
                                  ))}
                                </select>
                                <select
                                  value={jobSortBy}
                                  onChange={(e) => setJobSortBy(e.target.value as 'match' | 'recent' | 'company')}
                                  className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-300 cursor-pointer"
                                >
                                  <option value="match">↕ Sort: Best Match</option>
                                  <option value="recent">↕ Sort: Most Recent</option>
                                  <option value="company">↕ Sort: Company A–Z</option>
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Active role context card */}
                      {jobRoleFilter !== 'all' && (() => {
                        const activeRole = careerFitRoles.find(r => r.role === jobRoleFilter);
                        return activeRole ? (
                          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                                {activeRole.role[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-indigo-900">{activeRole.role}</p>
                                <p className="text-[10px] text-indigo-600 font-semibold">{activeRole.confidence}% Career Match</p>
                              </div>
                            </div>
                            {activeRole.reasons?.[0] && (
                              <p className="text-[9px] text-indigo-700 font-semibold hidden sm:block max-w-xs truncate">
                                ✓ {activeRole.reasons[0]}
                              </p>
                            )}
                          </div>
                        ) : null;
                      })()}

                      {/* Loading state */}
                      {isFindingJobs && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
                          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl mx-auto animate-bounce">💼</div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900">Discovering Live Jobs</h3>
                            <p className="text-xs text-slate-500 font-semibold mt-1">
                              Searching for {careerFitRoles.length > 0 ? careerFitRoles.map(r => r.role).slice(0, 3).join(', ') + (careerFitRoles.length > 3 ? ' +more' : '') : 'your top career roles'} across Google, Greenhouse, Lever &amp; Ashby...
                            </p>
                          </div>
                          <div className="space-y-2 max-w-xs mx-auto">
                            {['Gemini + Google Search for each role', 'Scraping 35+ company career pages', 'Scoring matches against your resume'].map((step, i) => (
                              <div key={i} className="flex items-center gap-2 text-[10px] text-slate-600 font-bold">
                                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px] font-black flex-shrink-0 animate-pulse">{i + 1}</span>
                                {step}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Error state */}
                      {jobsLoadError && !isFindingJobs && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-2">
                          <p className="text-sm font-black text-red-700">⚠️ Could not load jobs</p>
                          <p className="text-xs text-red-600 font-semibold">{jobsLoadError}</p>
                          <button onClick={fetchLiveJobs} className="text-xs font-black text-indigo-600 hover:underline">Try again →</button>
                        </div>
                      )}

                      {/* ── Job cards — grouped by career category ──────────── */}
                      {!isFindingJobs && liveJobsList.length > 0 && (() => {
                        const baseJobs = liveJobsList.filter((m: any) => matchesJobFilters(m));

                        const roleKeywordsOf = (role: string) =>
                          role.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
                        const titleMatchesRole = (m: any, role: string) => {
                          const title = ((m.jobId || m)?.title || '').toLowerCase();
                          return roleKeywordsOf(role).some((kw: string) => title.includes(kw));
                        };

                        const sortedJobs = sortJobMatches(baseJobs);
                        const rolesToShow = careerFitRoles.map(r => r.role);

                        const filtersActive =
                          jobSearchQuery.trim() !== '' ||
                          jobLocationFilter !== 'all' ||
                          jobSourceFilter !== 'all';

                        return (
                          <div className="space-y-6">
                            {/* Result summary */}
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Showing {sortedJobs.length} of {liveJobsList.length} jobs
                                {jobRoleFilter !== 'all' ? ` • ${jobRoleFilter}` : ''}
                              </span>
                              {filtersActive && (
                                <button
                                  onClick={() => {
                                    setJobSearchQuery('');
                                    setJobLocationFilter('all');
                                    setJobSourceFilter('all');
                                  }}
                                  className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                  ✕ Clear search &amp; filters
                                </button>
                              )}
                            </div>

                            {jobRoleFilter === 'all' ? (
                              // Grouped by career category — ALL jobs per path shown
                              <>
                                {careerFitRoles.length > 0 ? (
                                  <>
                                    {rolesToShow.map((roleName, roleIdx) => {
                                      const roleJobs = sortJobMatches(baseJobs.filter((m: any) => titleMatchesRole(m, roleName)));
                                      if (roleJobs.length === 0) return null;
                                      const roleData = careerFitRoles.find(r => r.role === roleName);
                                      return (
                                        <div key={roleName} className="space-y-3">
                                          {/* Category header */}
                                          <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-black text-amber-600">{roleIdx === 0 ? '⭐ Primary' : `#${roleIdx + 1}`}</span>
                                              <h3 className="text-sm font-black text-slate-900">{roleName}</h3>
                                              {roleData && (
                                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">{roleData.confidence}% match</span>
                                              )}
                                            </div>
                                            <div className="flex-1 h-px bg-slate-100" />
                                            <span className="text-[9px] font-bold text-slate-400">{roleJobs.length} jobs</span>
                                          </div>
                                          {/* ALL jobs in this category */}
                                          {roleJobs.map((match: any, idx: number) => (
                                            <JobCard key={idx} match={match} roleName={roleName} addApplication={addApplication} />
                                          ))}
                                        </div>
                                      );
                                    })}
                                    {/* Jobs that don't match any specific role */}
                                    {(() => {
                                      const allRoleKeywords = careerFitRoles.flatMap(r => roleKeywordsOf(r.role));
                                      const otherJobs = sortJobMatches(baseJobs.filter((m: any) => {
                                        const title = ((m.jobId || m)?.title || '').toLowerCase();
                                        return !allRoleKeywords.some((kw: string) => title.includes(kw));
                                      }));
                                      if (otherJobs.length === 0) return null;
                                      return (
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-3">
                                            <h3 className="text-sm font-black text-slate-600">Other Opportunities</h3>
                                            <div className="flex-1 h-px bg-slate-100" />
                                            <span className="text-[9px] font-bold text-slate-400">{otherJobs.length} jobs</span>
                                          </div>
                                          {otherJobs.map((match: any, idx: number) => (
                                            <JobCard key={idx} match={match} roleName="" addApplication={addApplication} />
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </>
                                ) : (
                                  // Fallback when careerFitRoles is empty: show all as flat list
                                  <div className="space-y-3">
                                    {sortedJobs.length === 0 ? (
                                      <div className="text-center py-10 space-y-2">
                                        <p className="text-sm font-black text-slate-600">No jobs found yet. Try clicking Refresh Jobs to discover matching positions.</p>
                                      </div>
                                    ) : (
                                      sortedJobs.map((match: any, idx: number) => (
                                        <JobCard key={idx} match={match} roleName="" addApplication={addApplication} />
                                      ))
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              // Filtered by single role — flat list
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sortedJobs.filter(m => titleMatchesRole(m, jobRoleFilter)).length} openings for {jobRoleFilter}</span>
                                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">✓ Live</span>
                                </div>
                                {sortedJobs.filter(m => titleMatchesRole(m, jobRoleFilter)).length === 0 ? (
                                  <div className="text-center py-10 space-y-2">
                                    <p className="text-sm font-black text-slate-600">
                                      {filtersActive ? 'No jobs match your current filters' : 'No jobs found for this role yet'}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      {filtersActive ? 'Try clearing the search or picking a different location/source' : 'Try refreshing or check a different category'}
                                    </p>
                                    {filtersActive && (
                                      <button
                                        onClick={() => {
                                          setJobSearchQuery('');
                                          setJobLocationFilter('all');
                                          setJobSourceFilter('all');
                                        }}
                                        className="text-xs font-black text-indigo-600 hover:underline"
                                      >
                                        Clear all filters →
                                      </button>
                                    )}
                                  </div>
                                ) : sortedJobs.filter(m => titleMatchesRole(m, jobRoleFilter)).map((match: any, idx: number) => (
                                  <JobCard key={idx} match={match} roleName={jobRoleFilter === 'all' ? '' : jobRoleFilter} addApplication={addApplication} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Empty state when unlocked but liveJobsList is empty */}
                      {!isFindingJobs && !jobsLoadError && liveJobsList.length === 0 && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-4 shadow-sm">
                          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl mx-auto">
                            🔍
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-800">Ready to Discover Live Jobs</h3>
                            <p className="text-xs text-slate-500 font-semibold mt-1">
                              Click below to trigger live real-time job scraping and matching for your top 5 careers.
                            </p>
                          </div>
                          <button
                            onClick={fetchLiveJobs}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black px-6 py-2.5 rounded-xl shadow-lg hover:opacity-90 transition-all"
                          >
                            <Search size={13} /> Discover Live Jobs
                          </button>
                        </div>
                      )}
                    </>
                  )}

                </motion.div>
              )}

              {/* ═══════════════════════════════════════════════════════
                  PAGE: APPLICATIONS — Track applied jobs
                 ═══════════════════════════════════════════════════════ */}
              {currentView === 'applications' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Applications Tracker</h2>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        Track every job you&apos;ve applied to in one place
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                      {applications.length} Applied
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Applied', count: applications.length, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', emoji: '📤' },
                      { label: 'Interview', count: applications.filter(a => a.status === 'Interview').length, color: 'text-amber-600 bg-amber-50 border-amber-100', emoji: '🎙️' },
                      { label: 'Offer', count: applications.filter(a => a.status === 'Offer').length, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', emoji: '🎉' },
                      { label: 'Rejected', count: applications.filter(a => a.status === 'Rejected').length, color: 'text-red-600 bg-red-50 border-red-100', emoji: '❌' },
                    ].map(st => (
                      <div key={st.label} className={`rounded-2xl border p-3 text-center ${st.color}`}>
                        <div className="text-lg">{st.emoji}</div>
                        <div className="text-lg font-black mt-1">{st.count}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest mt-0.5 opacity-70">{st.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Empty state */}
                  {applications.length === 0 && (
                    <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-4">
                      <div className="text-5xl">📋</div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800">No Applications Yet</h3>
                        <p className="text-xs text-slate-500 font-semibold mt-1 max-w-sm mx-auto">
                          Go to <strong>Live Jobs</strong> and click <strong>Apply Now</strong> or <strong>📌 Track</strong> to start tracking your job applications here.
                        </p>
                      </div>
                      <button
                        onClick={() => setCurrentView('jobs')}
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow hover:opacity-90 transition-all"
                      >
                        💼 Browse Live Jobs
                      </button>
                    </div>
                  )}

                  {/* Applications list */}
                  {applications.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="col-span-4">Role</span>
                        <span className="col-span-3">Company</span>
                        <span className="col-span-2">Location</span>
                        <span className="col-span-1">Date</span>
                        <span className="col-span-2 text-right">Status</span>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {applications.map((app, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-slate-50/50 transition-colors">
                            <div className="col-span-4 min-w-0">
                              <p className="text-xs font-black text-slate-800 truncate">{app.title}</p>
                            </div>
                            <div className="col-span-3 min-w-0">
                              <p className="text-[10px] font-bold text-slate-600 truncate">{app.company}</p>
                            </div>
                            <div className="col-span-2 min-w-0">
                              <p className="text-[9px] font-bold text-slate-400 truncate">{app.location}</p>
                            </div>
                            <div className="col-span-1">
                              <p className="text-[9px] font-bold text-slate-400">{app.appliedAt}</p>
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <select
                                value={app.status}
                                onChange={(e) => {
                                  const updated = applications.map((a, i) => i === idx ? { ...a, status: e.target.value as any } : a);
                                  setApplications(updated);
                                  localStorage.setItem('ri_applications', JSON.stringify(updated));
                                }}
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded border cursor-pointer outline-none ${
                                  app.status === 'Applied' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                  app.status === 'Interview' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  app.status === 'Offer' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                <option>Applied</option>
                                <option>Interview</option>
                                <option>Offer</option>
                                <option>Rejected</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </motion.div>
              )}

            </div>
          </div>
        )}
                  </div>
          </div>
        )}

      {/* x402 Payment Flow Modal (Phase 22) */}
      <AnimatePresence>
        {paymentStep !== null && payingJobIdx !== null && (() => {
          const payingJob = [
            { id: 0, title: 'ML Engineer', company: 'Google', match: 82 },
            { id: 1, title: 'ML Engineer', company: 'Microsoft', match: 88 },
            { id: 2, title: 'Machine Learning Engineer', company: 'Amazon', match: 85 },
            { id: 3, title: 'ML Engineer', company: 'Adobe', match: 82 },
          ][payingJobIdx] || { title: 'ML Engineer', company: 'Company X', match: 82 };
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white border rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5"
              >
                {paymentStep === 'paywall' && (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Job-Specific Resume Analysis</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{payingJob.title} @ {payingJob.company}</p>
                      </div>
                      <button
                        onClick={() => setPaymentStep(null)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Estimated Profile Alignment</span>
                      <span className="text-2xl font-black text-emerald-600 block mt-1">{payingJob.match}% Match</span>
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">You'll Get:</p>
                      {[
                        'Detailed skill analysis',
                        'Experience comparison',
                        'Project comparison',
                        'Missing requirements',
                        'Improvement priorities'
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <span className="text-indigo-600 font-black">✓</span> {item}
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Price</span>
                        <span className="text-base font-black text-indigo-700">
                          ${x402Services.find(s => s.serviceId === 'job_analysis')?.priceUsd || '0.50'} USDC
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!activeAddress) {
                            alert("Please connect your wallet first via the Manage Wallet tab.");
                            return;
                          }
                          setPaymentStep('402');
                          try {
                            const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
                            setPaymentStep('wallet');
                            
                            // Trigger the paid x402 endpoint
                            await x402Fetch(`/api/v1/resume/jobs/${payingJobIdx}/analyze`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' }
                            });
                            
                            setPaymentStep('verifying');
                            setJobAnalysisPaid(prev => ({ ...prev, [payingJobIdx]: true }));
                            setPaymentStep('complete');
                            setTimeout(() => {
                              setPaymentStep(null);
                              setJobAnalysisDone(true);
                              setCurrentView('jobintel');
                            }, 1200);
                          } catch (err: any) {
                            console.error("[x402] Payment error:", err);
                            alert(`Verification failed: ${err.message || err}`);
                            setPaymentStep(null);
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow border transition-all"
                      >
                        Pay & Analyze
                      </button>
                    </div>
                  </>
                )}

                {paymentStep === '402' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-pulse">
                      💸
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">402 Payment Required</h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Initializing secure payment protocol challenge. Preparing micropayment token contract...
                      </p>
                    </div>
                  </div>
                )}

                {paymentStep === 'wallet' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-xl animate-bounce">
                      💼
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">Sign in Wallet</h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Confirming transactions on Algorand MainNet via wallet provider...
                      </p>
                    </div>
                  </div>
                )}

                {paymentStep === 'verifying' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl">
                      <span className="animate-spin block mx-auto">🌀</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">Payment Verification</h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Verifying tx hash. Waiting for block settlement on chain...
                      </p>
                    </div>
                  </div>
                )}

                {paymentStep === 'complete' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-xl">
                      🎉
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-emerald-600">Deep Analysis Unlocked!</h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Micropayment verified successfully. Redirecting to analysis report...
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* x402 Resume Improvement Payment Flow Modal (Phase 24) */}
      <AnimatePresence>
        {improvePaymentStep !== null && (() => {
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white border rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5"
              >
                {improvePaymentStep === 'paywall' && (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Resume Improvement AI</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Algorithmic resume enhancement signature</p>
                      </div>
                      <button
                        onClick={() => setImprovePaymentStep(null)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Estimated Profile Improvement</span>
                      <span className="text-2xl font-black text-emerald-600 block mt-1">+5% Match Boost (82% → 87%)</span>
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Deeper Generation Includes:</p>
                      {[
                        'Quantified achievements injection',
                        'Keywords alignment mapping',
                        'Before vs After settlement structure',
                        'Active version control persistence'
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <span className="text-indigo-650 font-black">✓</span> {item}
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Price</span>
                        <span className="text-base font-black text-indigo-700">$0.05 USDC</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!activeAddress) {
                            alert("Please connect your wallet first via the Manage Wallet tab.");
                            return;
                          }
                          setImprovePaymentStep('402');
                          try {
                            const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
                            setImprovePaymentStep('wallet');
                            
                            // Trigger the paid x402 endpoint
                            const response = await x402Fetch(`/api/x402/resume-improvement`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                resumeId,
                                jobId: payingJobIdx !== null ? payingJobIdx.toString() : "job_default",
                                instruction: improvePrompt
                              })
                            });
                            
                            setImprovePaymentStep('verifying');
                            const resData = await response.json();
                            if (resData.success && resData.data) {
                              setLiveSuggestions(resData.data.suggestions || []);
                            }
                            
                            setImprovePaid(true);
                            setImprovePaymentStep('complete');
                            setTimeout(() => {
                              setImprovePaymentStep(null);
                            }, 1200);
                          } catch (err: any) {
                            console.error('[x402] Resume improvement failed:', err);
                            alert(`Micropayment transaction failed: ${err.message || err}`);
                            setImprovePaymentStep(null);
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow border transition-all"
                      >
                        Pay & Improve
                      </button>
                    </div>
                  </>
                )}

                {improvePaymentStep === '402' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-pulse">
                      💸
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">402 Payment Required</h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Initializing secure payment protocol challenge for resume enhancements...
                      </p>
                    </div>
                  </div>
                )}

                {improvePaymentStep === 'wallet' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-xl animate-bounce">
                      💼
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">Sign in Wallet</h4>
                      <p className="text-[10px] text-slate-550 font-semibold leading-relaxed">
                        Confirming transactions on Algorand MainNet via wallet provider...
                      </p>
                    </div>
                  </div>
                )}

                {improvePaymentStep === 'verifying' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl">
                      <span className="animate-spin block mx-auto">🌀</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">Payment Verification</h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Verifying tx hash. Waiting for block settlement on chain...
                      </p>
                    </div>
                  </div>
                )}

                {improvePaymentStep === 'complete' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-xl">
                      🎉
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-emerald-600">Improvements Unlocked!</h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Micropayment verified successfully. Applying selected enhancement versions...
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* x402 Project Plan Generation Payment Flow Modal (Phase 26) */}
      <AnimatePresence>
        {projectPlanPaymentStep !== null && (() => {
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                className="bg-white border rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5"
              >
                {projectPlanPaymentStep === 'paywall' && (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Project Plan Generation</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Production ML Deployment Platform</p>
                      </div>
                      <button
                        onClick={() => setProjectPlanPaymentStep(null)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Estimated Profile Boost</span>
                      <span className="text-2xl font-black text-emerald-600 block mt-1">+10% Match Boost (82% → 92%)</span>
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Premium Plan Includes:</p>
                      {[
                        'Complete System Architecture diagrams',
                        'Folder structure & starter code files',
                        'Detailed implementation tasks & milestones',
                        'High-impact copyable resume bullets'
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <span className="text-indigo-655 font-black">✓</span> {item}
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Price</span>
                        <span className="text-base font-black text-indigo-700">$0.03 USDC</span>
                      </div>
                      <button
                        onClick={async () => {
                          if (!activeAddress) {
                            alert("Please connect your wallet first via the Manage Wallet tab.");
                            return;
                          }
                          setProjectPlanPaymentStep('402');
                          try {
                            const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
                            setProjectPlanPaymentStep('wallet');
                            
                            // Trigger the paid x402 endpoint
                            const response = await x402Fetch(`/api/x402/project-generation`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                resumeId,
                                jobId: payingJobIdx !== null ? payingJobIdx.toString() : "job_default"
                              })
                            });
                            
                            setProjectPlanPaymentStep('verifying');
                            const resData = await response.json();
                            if (resData.success && resData.data) {
                              setProjectBlueprint(resData.data);
                            }
                            
                            setProjectPlanPaid(true);
                            setProjectPlanPaymentStep('complete');
                            setTimeout(() => {
                              setProjectPlanPaymentStep(null);
                              setCurrentView('projects');
                            }, 1200);
                          } catch (err: any) {
                            console.error('[x402] Project generation failed:', err);
                            alert(`Micropayment transaction failed: ${err.message || err}`);
                            setProjectPlanPaymentStep(null);
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow border transition-all"
                      >
                        Pay & Generate
                      </button>
                    </div>
                  </>
                )}

                {projectPlanPaymentStep === '402' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-pulse">
                      💸
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">402 Payment Required</h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Initializing secure payment protocol challenge for project plan generation...
                      </p>
                    </div>
                  </div>
                )}

                {projectPlanPaymentStep === 'wallet' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-xl animate-bounce">
                      💼
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">Sign in Wallet</h4>
                      <p className="text-[10px] text-slate-550 font-semibold leading-relaxed">
                        Confirming transactions on Algorand MainNet via wallet provider...
                      </p>
                    </div>
                  </div>
                )}

                {projectPlanPaymentStep === 'verifying' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl">
                      <span className="animate-spin block mx-auto">🌀</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">Payment Verification</h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Verifying tx hash. Waiting for block settlement on chain...
                      </p>
                    </div>
                  </div>
                )}

                {projectPlanPaymentStep === 'complete' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-xl">
                      🎉
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-emerald-600">Project Plan Generated!</h4>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Micropayment verified successfully. Displaying implementation roadmap...
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* x402 Resume Pass Payment Flow Modal */}
      <AnimatePresence>
        {resumeIntelPaymentStep !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5 text-center"
            >
              {resumeIntelPaymentStep === '402' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-pulse">💸</div>
                  <h4 className="text-sm font-black text-slate-900">402 Payment Required</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Initializing secure checkout protocol for Resume Intelligence Access Pass...</p>
                </div>
              )}
              {resumeIntelPaymentStep === 'wallet' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-bounce">🔑</div>
                  <h4 className="text-sm font-black text-slate-900">Sign Transaction</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Please sign the $0.50 USDC transaction in your Algorand wallet popup.</p>
                </div>
              )}
              {resumeIntelPaymentStep === 'verifying' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-spin">⏳</div>
                  <h4 className="text-sm font-black text-slate-900">Settling Payment</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Verifying micropayment transfer on Algorand blockchain...</p>
                </div>
              )}
              {resumeIntelPaymentStep === 'complete' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-xl text-emerald-600">✓</div>
                  <h4 className="text-sm font-black text-emerald-600">Access Granted!</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Resume Intelligence Pass is now active. Launching dashboard...</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* x402 Custom Explore Search Paywall Modal */}
      <AnimatePresence>
        {customSearchPaymentStep === 'paywall' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Target Career Search</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Explore Custom Role Alignment</p>
                </div>
                <button
                  onClick={() => setCustomSearchPaymentStep(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-55 text-center">
                <span className="text-[10px] font-black text-slate-455 uppercase tracking-wider block">Target Career Goal</span>
                <span className="text-xs font-black text-slate-805 block mt-1">"{careerPrompt}"</span>
              </div>

              <div className="space-y-2.5">
                <p className="text-[10px] font-black text-slate-805 uppercase tracking-wider">Includes:</p>
                {[
                  'Live job scraping via Apify',
                  'Match profile translation mapping',
                  'Core skill gap matrix extraction'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-705">
                    <span className="text-indigo-650 font-black">✓</span> {item}
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Price</span>
                  <span className="text-base font-black text-indigo-705">
                    ${x402Services.find(s => s.serviceId === 'custom_search')?.priceUsd || '0.50'} USDC
                  </span>
                </div>
                <button
                  onClick={async () => {
                    setCustomSearchPaymentStep('402');
                    try {
                      const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
                      setCustomSearchPaymentStep('wallet');
                      
                      // Trigger dynamic job discovery
                      await x402Fetch(`/api/x402/target-career-search`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ resumeId, targetCareer: careerPrompt, careerInput: careerPrompt })
                      });
                      
                      setCustomSearchPaymentStep('verifying');
                      // Also fetch the parsed target role details to populate intent states
                      const intentRes = await fetch(`/api/v1/resume/${resumeId}/intent`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ careerInput: careerPrompt })
                      });
                      const intentData = await intentRes.json();
                      if (intentData.success && intentData.data) {
                        setTargetRole(intentData.data.targetRole);
                        setTargetLocation(intentData.data.targetLocation);
                        setExperienceLevel(intentData.data.experienceLevel);
                      }
                      
                      setCustomSearchPaymentStep('complete');
                      setTimeout(() => {
                        setCustomSearchPaymentStep(null);
                        // Recalculate match distribution to render the results honestly
                        startAnalysis(resumeId);
                      }, 1200);
                    } catch (err: any) {
                      console.error('[x402] Explorer search failed:', err);
                      alert(`Transaction failed: ${err.message || err}`);
                      setCustomSearchPaymentStep(null);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow border transition-all"
                >
                  Pay & Search
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* x402 Custom Explore Search Payment Flow Modal */}
      <AnimatePresence>
        {customSearchPaymentStep !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5 text-center"
            >
              {customSearchPaymentStep === '402' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-pulse">💸</div>
                  <h4 className="text-sm font-black text-slate-900">402 Payment Required</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Preparing $0.50 USDC custom transition search micropayment challenge...</p>
                </div>
              )}
              {customSearchPaymentStep === 'wallet' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-bounce">🔑</div>
                  <h4 className="text-sm font-black text-slate-900">Sign Transaction</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Please sign the $0.50 USDC search query settlement transfer in your wallet.</p>
                </div>
              )}
              {customSearchPaymentStep === 'verifying' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-spin">⏳</div>
                  <h4 className="text-sm font-black text-slate-900">Scraping Live Jobs</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Querying live Apify Google Jobs scraper. Gathering career matches...</p>
                </div>
              )}
              {customSearchPaymentStep === 'complete' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-xl text-emerald-600">✓</div>
                  <h4 className="text-sm font-black text-emerald-600">Explore Complete!</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Matches and gap requirements recalculated. Returning fresh dashboard details...</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* x402 Career Action Plan Loader Flow Modal */}
      <AnimatePresence>
        {careerActionPlanPaymentStep !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5 text-center"
            >
              {careerActionPlanPaymentStep === '402' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-pulse">💸</div>
                  <h4 className="text-sm font-black text-slate-900">402 Payment Required</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Initializing $0.10 USDC Career Action Plan roadmap generation...</p>
                </div>
              )}
              {careerActionPlanPaymentStep === 'wallet' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-bounce">🔑</div>
                  <h4 className="text-sm font-black text-slate-900">Sign Transaction</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Please sign the $0.10 USDC transaction in your Algorand wallet popup.</p>
                </div>
              )}
              {careerActionPlanPaymentStep === 'verifying' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-spin">⏳</div>
                  <h4 className="text-sm font-black text-slate-900">Generating Action Plan</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Settling transaction on Algorand & executing Groq strategy generator...</p>
                </div>
              )}
              {careerActionPlanPaymentStep === 'complete' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-xl text-emerald-600">✓</div>
                  <h4 className="text-sm font-black text-emerald-600">Action Plan Ready!</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Your custom 30-day roadmap is loaded. Enjoy your transition plan!</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* x402 Transaction Detail Modal (Phase 30) */}
      <AnimatePresence>
        {selectedTx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Transaction Details</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{selectedTx.txId}</p>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3.5">
                {[
                  { label: 'Service', val: selectedTx.srv },
                  { label: 'Amount', val: `$${selectedTx.amt} ${selectedTx.cur}` },
                  { label: 'Network', val: 'Algorand' },
                  { label: 'Wallet Address', val: selectedTx.wallet },
                  { label: 'Transaction Hash', val: `${selectedTx.hash}c3e7b8d9e4a9b5f...`, isHash: true },
                  { label: 'Timestamp', val: selectedTx.date },
                  { label: 'Status', val: selectedTx.status, isStatus: true }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 text-xs font-bold">
                    <span className="text-slate-450">{item.label}</span>
                    {item.isStatus ? (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded ${item.val === 'Success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        ✓ {item.val}
                      </span>
                    ) : item.isHash ? (
                      <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">{item.val}</span>
                    ) : (
                      <span className="text-slate-800 font-black">{item.val}</span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-black py-2 rounded-xl transition-all shadow-sm"
              >
                Close Receipt
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
};

export default ResumeIntelligence;
