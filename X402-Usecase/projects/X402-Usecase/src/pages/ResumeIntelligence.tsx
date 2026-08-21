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
  const [hasResume, setHasResume] = useState(false);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'overview' | 'quality' | 'skills' | 'career' | 'discovery' | 'experience' | 'gaps' | 'market' | 'projects' | 'target' | 'targetmatch' | 'improve' | 'match' | 'action' | 'versions' | 'progress' | 'jobdisc' | 'jobintel' | 'payment' | 'rematch' | 'projectplan'>('overview');
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
  const [resumeIntelUnlocked, setResumeIntelUnlocked] = useState(false);
  const [resumeIntelPaymentStep, setResumeIntelPaymentStep] = useState<'paywall' | '402' | 'wallet' | 'verifying' | 'complete' | null>(null);
  const [customSearchPaymentStep, setCustomSearchPaymentStep] = useState<'paywall' | '402' | 'wallet' | 'verifying' | 'complete' | null>(null);
  const [liveMatchScore, setLiveMatchScore] = useState(82);
  const [liveSuggestions, setLiveSuggestions] = useState<any[]>([]);
  const [careerActionPlan, setCareerActionPlan] = useState<any | null>(null);
  const [careerActionPlanPaid, setCareerActionPlanPaid] = useState(false);
  const [careerActionPlanPaymentStep, setCareerActionPlanPaymentStep] = useState<'paywall' | '402' | 'wallet' | 'verifying' | 'complete' | null>(null);
  const [projectBlueprint, setProjectBlueprint] = useState<any | null>(null);

  // Moved nested page subview states to top-level
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'All' | 'Strong' | 'Partial' | 'Listed Only' | 'Missing'>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('Python');
  const [selectedCareerOverview, setSelectedCareerOverview] = useState('Data Scientist');
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
      const res = await apiFetch(`/api/resume/${rid}/match-distribution`);
      if (res.success && res.data) setLiveDistribution(res.data);
    } catch (e) { console.warn('[Distribution] Fetch failed:', e); }
  }, [apiFetch]);

  // ─── Fetch matched jobs per bucket ───────────────────────────────
  const fetchMatchedJobs = useCallback(async (rid: string) => {
    try {
      const tiers = ['100%', '75%', '50%', '20%', '0%'];
      const results: Record<string, any[]> = {};
      await Promise.allSettled(tiers.map(async tier => {
        const res = await apiFetch(`/api/resume/${rid}/matches?tier=${encodeURIComponent(tier)}&limit=10`);
        if (res.success && res.data?.matches) results[tier] = res.data.matches;
      }));
      if (Object.keys(results).length > 0) setLiveMatchedJobs(results);
    } catch (e) { console.warn('[Jobs] Fetch failed:', e); }
  }, [apiFetch]);

  // ─── Fetch improvement insights (Phase 11) ───────────────────────
  const fetchImprovements = useCallback(async (rid: string) => {
    try {
      const res = await apiFetch(`/api/resume/${rid}/improvements`);
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
        const statusRes = await apiFetch(`/api/resume/${rid}/status`);
        if (statusRes.success && statusRes.data?.status === 'READY') {
          isReady = true;
          setExtractedData(statusRes.data);
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
    } catch (e) {
      console.warn('[Pipeline] Extraction polling failed:', e);
      setPipelineStatus(s => ({ ...s, extraction: 'done' }));
      return;
    }

    // Auto-unlock Resume Intelligence (calls backend unlock — works immediately when BYPASS_PAYMENT=true)
    try {
      await apiFetch(`/api/resume/${rid}/unlock`, { method: 'POST' });
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
        await apiFetch(`/api/resume/${rid}/quality`, { method: 'POST' });
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
        const extractionRes = await apiFetch(`/api/resume/${rid}/extraction`);
        if (extractionRes.success && extractionRes.data) {
          setExtractedData(extractionRes.data);
        }
        // Call career-fit to detect and persist top career roles
        const careerFitRes = await apiFetch(`/api/resume/${rid}/career-fit`, { method: 'POST' });
        if (careerFitRes.success && careerFitRes.data?.primaryCareer) {
          detectedPrimaryCareer = careerFitRes.data.primaryCareer;
          setTargetRole(careerFitRes.data.primaryCareer);
        }
        setPipelineStatus(s => ({ ...s, bestFitRoles: 'done' }));
      } catch (e) {
        console.warn('[Pipeline] Determine Best-Fit Roles failed:', e);
        setPipelineStatus(s => ({ ...s, bestFitRoles: 'done' }));
      }
    };    const runResumeImprovements = async () => {
      try {
        setPipelineStatus(s => ({ ...s, improvements: 'running' }));
        await apiFetch(`/api/resume/${rid}/improvements`);
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
      await apiFetch(`/api/resume/${rid}/discover-jobs`, { method: 'POST' });
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
        await apiFetch(`/api/resume/${rid}/match-all`, { method: 'POST' });
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
        await apiFetch(`/api/resume/${rid}/skill-gap`, {
          method: 'POST',
          body: JSON.stringify({ targetRole: detectedPrimaryCareer }),
        });
        // Also run improvement analysis for market insights
        await apiFetch(`/api/resume/${rid}/improvements/analyze`, { method: 'POST' }).catch(() => {});
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
  
  // Upload and parsing states
  const [targetRole, setTargetRole] = useState('Machine Learning Engineer');
  const [targetLocation, setTargetLocation] = useState('Hyderabad / Remote');
  const [experienceLevel, setExperienceLevel] = useState('Entry Level');
  const [useProfileData, setUseProfileData] = useState(true);
  const [noTargetGoal, setNoTargetGoal] = useState(false);

  // ─── Phase 13: AI Career Prompt state ────────────────────────────
  const [careerPrompt, setCareerPrompt] = useState('');
  const [isExtractingIntent, setIsExtractingIntent] = useState(false);
  const [intentExtracted, setIntentExtracted] = useState(false);
  const handleExtractIntent = async () => {
    if (!careerPrompt.trim() || !resumeId) return;
    setIsExtractingIntent(true);
    setIntentExtracted(false);
    try {
      const res = await apiFetch(`/api/resume/${resumeId}/intent`, {
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
    // Upload goes directly to /api/resume/upload (not prefixed with /api/v1)
    xhr.open('POST', `${backendOrigin}/api/resume/upload`);

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
              <div className="w-full rounded-2xl border-2 border-indigo-200/70 bg-white shadow-[0_8px_30px_rgba(99,102,241,0.07)] overflow-hidden">
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
                          onClick={() => { setHasResume(true); setCurrentView('overview'); }}
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
                          setCurrentView('overview');
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-4 w-full">
            
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

            {/* RIGHT: Resume Intelligence Dashboard */}
            <div className="lg:col-span-7 space-y-6 w-full">
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
                  <span className="text-3xl font-black text-indigo-650">$0.10 USDC</span>
                </div>

                <button
                  onClick={async () => {
                    // When BYPASS_PAYMENT is on, or no wallet, call the unlock endpoint directly
                    setResumeIntelPaymentStep('verifying');
                    try {
                      // Try direct unlock first (works when BYPASS_PAYMENT=true on backend)
                      await apiFetch(`/api/resume/${resumeId}/unlock`, { method: 'POST' });
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
                        await x402Fetch(`${backendOrigin}/api/resume/${resumeId}/unlock`, {
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
            
            {/* INNER SIDEBAR NAVIGATION */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.015)] space-y-1 lg:sticky lg:top-24">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 block mb-3">Workspace Nav</span>
              {[
                { id: 'overview', label: 'Career Snapshot', icon: Layers },
                { id: 'quality', label: 'Quality & ATS Analysis', icon: ShieldCheck },
                { id: 'skills', label: 'Skill & Evidence', icon: Sparkles },
                { id: 'career', label: 'Auto Career Detection', icon: Compass },
                { id: 'discovery', label: 'Job Discovery', icon: Play },
                { id: 'experience', label: 'Experience & Evidence', icon: Briefcase },
                { id: 'gaps', label: 'Career Gaps', icon: AlertTriangle },
                { id: 'market', label: 'Job Market', icon: BarChart4 },
                { id: 'projects', label: 'Projects', icon: BookOpen },
                { id: 'target', label: 'Target Career', icon: Target },
                { id: 'targetmatch', label: 'Career Readiness', icon: CheckCircle2 },
                { id: 'improve', label: 'Improve Resume', icon: Edit3 },
                { id: 'match', label: 'Job Match', icon: UserCheck },
                { id: 'jobdisc', label: 'Job-Specific Intel', icon: Brain },
                { id: 'action', label: 'Action Plan', icon: Clock },
                { id: 'versions', label: 'Versions', icon: FileSpreadsheet },
                { id: 'payment', label: 'Payment Center', icon: CreditCard }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all ${
                      currentView === item.id 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* CONTENT VIEWPORT */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* PAGE: CAREER SNAPSHOT & AUTO JOB CLASSIFICATION */}
              {currentView === 'overview' && (() => {
                // Map live distribution or fallback to mocks
                const totalScraped = liveDistribution ? Object.values(liveDistribution).reduce((a, b) => a + b, 0) : 1849;
                
                const buckets = [
                  { 
                    id: '100%', 
                    title: '100% MATCH', 
                    count: liveDistribution && liveDistribution['100%'] !== undefined ? `${liveDistribution['100%']} Jobs` : '12 Jobs', 
                    rawCount: liveDistribution && liveDistribution['100%'] !== undefined ? liveDistribution['100%'] : 12,
                    desc: 'You meet all major requirements perfectly.', 
                    border: 'border-emerald-500 text-emerald-600', 
                    fill: 'bg-emerald-55/10' 
                  },
                  { 
                    id: '75%',  
                    title: '75% MATCH',  
                    count: liveDistribution && liveDistribution['75%'] !== undefined ? `${liveDistribution['75%']} Jobs` : '48 Jobs', 
                    rawCount: liveDistribution && liveDistribution['75%'] !== undefined ? liveDistribution['75%'] : 48,
                    desc: 'Strong match with minor gaps.', 
                    border: 'border-indigo-500 text-indigo-600', 
                    fill: 'bg-indigo-50/50' 
                  },
                  { 
                    id: '50%',  
                    title: '50% MATCH',  
                    count: liveDistribution && liveDistribution['50%'] !== undefined ? `${liveDistribution['50%']} Jobs` : '137 Jobs', 
                    rawCount: liveDistribution && liveDistribution['50%'] !== undefined ? liveDistribution['50%'] : 137,
                    desc: 'Moderate match. Some key gaps.', 
                    border: 'border-amber-500 text-amber-600', 
                    fill: 'bg-amber-50/50' 
                  },
                  { 
                    id: '20%',  
                    title: '20% MATCH',  
                    count: liveDistribution && liveDistribution['20%'] !== undefined ? `${liveDistribution['20%']} Jobs` : '412 Jobs', 
                    rawCount: liveDistribution && liveDistribution['20%'] !== undefined ? liveDistribution['20%'] : 412,
                    desc: 'Low match. Significant improvements needed.', 
                    border: 'border-orange-500 text-orange-600', 
                    fill: 'bg-orange-50/50' 
                  },
                  { 
                    id: '0%',   
                    title: '0% MATCH',   
                    count: liveDistribution && liveDistribution['0%'] !== undefined ? `${liveDistribution['0%']} Jobs` : '1240 Jobs', 
                    rawCount: liveDistribution && liveDistribution['0%'] !== undefined ? liveDistribution['0%'] : 1240,
                    desc: 'Not a match for now. Build more relevant skills.', 
                    border: 'border-red-500 text-red-650', 
                    fill: 'bg-red-50/50' 
                  }
                ];

                const mockBucketJobs = {
                  '100%': [
                    { title: 'Data Scientist', company: 'InnovaTech Solutions', location: 'Bengaluru, India', type: 'Full-time', mode: 'Hybrid', salary: '₹10 – 16 LPA', date: 'Posted 2 days ago', skills: ['Python', 'SQL', 'Machine Learning', 'Pandas', 'Statistics'] },
                    { title: 'Junior Data Scientist', company: 'Quantico Analytics', location: 'Hyderabad, India', type: 'Full-time', mode: 'Hybrid', salary: '₹7 – 11 LPA', date: 'Posted 1 day ago', skills: ['Python', 'SQL', 'ML', 'Data Analysis', 'Excel'] },
                    { title: 'Data Science Intern', company: 'NeuraByte Labs', location: 'Remote', type: 'Internship', mode: 'Remote', salary: '₹15K – 25K / month', date: 'Posted 3 days ago', skills: ['Python', 'Machine Learning', 'Pandas', 'Data Analysis'] }
                  ],
                  '75%': [
                    { title: 'Associate ML Engineer', company: 'AxiomCorp', location: 'Hyderabad, India', type: 'Full-time', mode: 'On-site', salary: '₹8 – 12 LPA', date: 'Posted 4 days ago', skills: ['Python', 'SQL', 'TensorFlow', 'Docker'] }
                  ],
                  '50%': [
                    { title: 'Data Engineer', company: 'NovaTech Analytics', location: 'Bengaluru, India', type: 'Full-time', mode: 'Remote', salary: '₹12 – 18 LPA', date: 'Posted 1 week ago', skills: ['SQL', 'Python', 'Spark', 'AWS'] }
                  ],
                  '20%': [
                    { title: 'BI Developer', company: 'InsightMetrics', location: 'Mumbai, India', type: 'Full-time', mode: 'Hybrid', salary: '₹5 – 8 LPA', date: 'Posted 2 weeks ago', skills: ['SQL', 'Power BI', 'Excel'] }
                  ],
                  '0%': [
                    { title: 'Frontend Developer', company: 'WebCraft', location: 'Remote', type: 'Full-time', mode: 'Remote', salary: '₹6 – 10 LPA', date: 'Posted 3 weeks ago', skills: ['React', 'CSS', 'HTML'] }
                  ]
                };

                // Resolve target list: live data if loaded, otherwise mock fallback
                let currentJobsList = mockBucketJobs[selectedBucket];
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
                          Explore for $0.02 USDC <ArrowRight size={11} />
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
                              {job.skills.slice(0, 5).map(sk => (
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
                const careers = [
                  { title: 'Data Scientist', desc: 'Best fit based on your skills', pct: 91, label: 'Primary Career', explanation: 'High confidence that your resume fits this career.' },
                  { title: 'Data Analyst',  desc: 'Strong alignment',             pct: 86, label: 'Alternative Career', explanation: 'Good fit with analytical tools and python core.' },
                  { title: 'ML Engineer',   desc: 'Good alignment',               pct: 74, label: 'Alternative Career', explanation: 'Requires minor evidence gaps coverage in deployment.' },
                  { title: 'AI Engineer',   desc: 'Good alignment',               pct: 69, label: 'Alternative Career', explanation: 'Requires evidence of large language model APIs.' },
                  { title: 'Software Engineer', desc: 'Moderate alignment',       pct: 42, label: 'Alternative Career', explanation: 'Declined due to lower system architecture mentions.' }
                ];
                
                const activeCareer = careers.find(c => c.title === selectedCareerOverview) || careers[0];

                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    
                    {/* Header */}
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Auto Career Detection</h2>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">We analyze your skills and experience to find the career paths that best match your profile.</p>
                    </div>

                    {/* Top Row: Matches vs Details split */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                      {/* Left: Top Career Matches list */}
                      <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                          Top Career Matches <span className="text-[9px] text-slate-450 font-black cursor-pointer">ⓘ</span>
                        </h3>
                        
                        <div className="space-y-2">
                          {careers.map(item => (
                            <div
                              key={item.title}
                              onClick={() => setSelectedCareerOverview(item.title)}
                              className={`flex items-center gap-4 p-3 rounded-2xl border transition-all cursor-pointer ${
                                selectedCareerOverview === item.title
                                  ? 'bg-indigo-50/50 border-indigo-150 shadow-sm'
                                  : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-650 flex-shrink-0 text-sm font-black">
                                {item.title[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-slate-800 leading-snug">{item.title}</h4>
                                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{item.desc}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${item.pct}%` }} />
                                </div>
                                <span className="text-xs font-black text-slate-800 w-8 text-right">{item.pct}%</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button className="w-full text-center text-[10px] font-black text-indigo-600 hover:underline pt-2">
                          View all career matches →
                        </button>
                      </div>

                      {/* Right: Selected Career Profile details card */}
                      <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-205 p-6 shadow-sm space-y-5">
                        <span className="text-xs font-black text-slate-900 block">Primary Career</span>

                        <div className="flex gap-3 items-center">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-655 text-base font-black flex-shrink-0">
                            💼
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-black text-slate-800">{activeCareer.title}</h3>
                              <span className="text-[8px] font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md">
                                {activeCareer.label}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-455 font-bold uppercase mt-1">{activeCareer.explanation}</p>
                          </div>
                        </div>

                        {/* Confidence score block */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-slate-455 uppercase block">Confidence Score</span>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-indigo-650">{activeCareer.pct}%</span>
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-650 rounded-full" style={{ width: `${activeCareer.pct}%` }} />
                            </div>
                            <span className="text-[8px] font-black text-emerald-600 uppercase">Very High</span>
                          </div>
                        </div>

                        {/* Why this career fits checklist */}
                        <div className="space-y-3">
                          <span className="text-[9px] font-black text-slate-455 uppercase block">Why this career fits</span>
                          <ul className="space-y-2 text-[10px] font-bold text-slate-655">
                            <li className="flex items-center gap-2">
                              <span className="text-emerald-500 text-base">✓</span> Strong match for your technical skills (Python, SQL, Pandas, ML)
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-emerald-500 text-base">✓</span> Relevant project experience in data analysis and ML
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-emerald-500 text-base">✓</span> Education and background align with industry requirements
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="text-emerald-500 text-base">✓</span> High demand and strong growth potential
                            </li>
                          </ul>
                        </div>

                      </div>

                    </div>

                    {/* Bottom Row: Skill assessment list */}
                    <div className="bg-white rounded-3xl border border-slate-205 p-6 shadow-sm space-y-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Initial Skill Assessment for {activeCareer.title}</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">We evaluated your skills against the requirements for a {activeCareer.title} role.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { name: 'Python', status: 'Strong', desc: 'Strong evidence from Projects, Experience', badge: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                          { name: 'SQL',    status: 'Strong', desc: 'Strong evidence from Projects, Experience', badge: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                          { name: 'Pandas', status: 'Strong', desc: 'Strong evidence from Projects, Experience', badge: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                          { name: 'ML',     status: 'Strong', desc: 'Strong evidence from Projects, Experience', badge: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                          { name: 'Docker', status: 'Gap',    desc: 'Limited to no evidence',                  badge: 'bg-red-50 border-red-100 text-red-600' },
                          { name: 'AWS',    status: 'Gap',    desc: 'Listed only in skills section',           badge: 'bg-red-50 border-red-100 text-red-600' },
                          { name: 'MLOps',  status: 'Gap',    desc: 'Missing from resume',                     badge: 'bg-red-50 border-red-100 text-red-600' }
                        ].map(item => (
                          <div key={item.name} className="border rounded-2xl p-4 flex flex-col justify-between hover:shadow-[0_2px_8px_rgba(0,0,0,0.015)] transition-all">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-800">{item.name}</span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border ${item.badge}`}>{item.status}</span>
                            </div>
                            <p className="text-[9px] text-slate-455 mt-3 font-semibold leading-relaxed">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
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
                    const res = await apiFetch(`/api/resume/${resumeId}/discover-jobs`, {
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
                      await apiFetch(`/api/resume/${resumeId}/match-all`, { method: 'POST' });
                      await apiFetch(`/api/resume/${resumeId}/improvements/analyze`, { method: 'POST' });
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

                const targetJobs = [
                  { id: 0, title: 'ML Engineer', company: 'Google', logo: 'G', logoBg: 'bg-blue-50', logoColor: 'text-blue-600', location: 'Bengaluru, India', mode: 'Hybrid', match: 92, badge: '🔥 Hot', badgeColor: 'bg-orange-100 text-orange-600', experience: '0 – 2 years', type: 'Full-time', salary: '₹12 – 18 LPA', applicants: '250+', postedAgo: 'Posted 2h ago', source: 'LinkedIn', skills: ['Python', 'TensorFlow', 'ML', '+5'], requiredSkills: ['Python', 'Machine Learning', 'TensorFlow / PyTorch', 'SQL', 'Data Structures & Algorithms', 'Statistics & Probability'], preferredSkills: ['Deep Learning', 'MLOps', 'Cloud (GCP/AWS)', 'Docker', 'Kubernetes'], overview: 'As an ML Engineer at Google, you will build and deploy machine learning models at scale to solve real-world problems that impact billions of users.', whyMatch: ['Your skills match 85% of the required skills', 'Relevant projects and experience', 'Good fit for your target career'] },
                  { id: 1, title: 'ML Engineer', company: 'Microsoft', logo: '⊞', logoBg: 'bg-slate-50', logoColor: 'text-slate-700', location: 'Hyderabad, India', mode: 'Hybrid', match: 88, badge: '', badgeColor: '', experience: '1 – 3 years', type: 'Full-time', salary: '₹14 – 22 LPA', applicants: '180+', postedAgo: 'Posted 5h ago', source: 'LinkedIn', skills: ['Python', 'Azure', 'ML', '+6'], requiredSkills: ['Python', 'Azure ML', 'Deep Learning', 'Distributed Systems', 'MLflow', 'REST APIs'], preferredSkills: ['PyTorch', 'ONNX', 'Kubernetes', 'Spark'], overview: 'Join Microsoft AI to build next-generation ML infrastructure powering products used by hundreds of millions globally.', whyMatch: ['Strong Python and ML skills', 'Azure knowledge is a bonus', 'Your experience aligns well'] },
                  { id: 2, title: 'Machine Learning Engineer', company: 'Amazon', logo: 'a', logoBg: 'bg-orange-50', logoColor: 'text-orange-500', location: 'Pune, India', mode: 'On-site', match: 85, badge: '', badgeColor: '', experience: '0 – 2 years', type: 'Full-time', salary: '₹10 – 16 LPA', applicants: '320+', postedAgo: 'Posted yesterday', source: 'LinkedIn', skills: ['Python', 'AWS', 'Deep Learning', '+4'], requiredSkills: ['Python', 'SageMaker', 'AWS', 'Deep Learning', 'Statistics', 'Pandas'], preferredSkills: ['Spark', 'Docker', 'CI/CD', 'Model Monitoring'], overview: 'Amazon ML team is looking for engineers to build and scale ML systems for product recommendations, fraud detection, and more.', whyMatch: ['Python and ML evidence is strong', 'AWS basics can be upskilled quickly', 'Good academic background'] },
                  { id: 3, title: 'ML Engineer', company: 'Adobe', logo: 'A', logoBg: 'bg-red-50', logoColor: 'text-red-600', location: 'Noida, India', mode: 'Hybrid', match: 82, badge: '', badgeColor: '', experience: '1 – 3 years', type: 'Full-time', salary: '₹12 – 20 LPA', applicants: '150+', postedAgo: 'Posted 2 days ago', source: 'Indeed', skills: ['Python', 'PyTorch', 'NLP', '+5'], requiredSkills: ['Python', 'PyTorch', 'NLP', 'Transformers', 'Computer Vision', 'SQL'], preferredSkills: ['MLOps', 'Model Deployment', 'Docker', 'GCP'], overview: 'Adobe AI Research is hiring ML Engineers to build AI-powered creative tools used by millions of designers worldwide.', whyMatch: ['NLP and PyTorch skills match well', 'Relevant project evidence found', 'Strong Python foundation'] },
                  { id: 4, title: 'Associate ML Engineer', company: 'ZS Associates', logo: 'Z', logoBg: 'bg-slate-100', logoColor: 'text-slate-700', location: 'Bengaluru, India', mode: 'Hybrid', match: 78, badge: '', badgeColor: '', experience: '0 – 1 year', type: 'Full-time', salary: '₹8 – 12 LPA', applicants: '90+', postedAgo: 'Posted 4 days ago', source: 'Naukri', skills: ['Python', 'Statistics', '+3'], requiredSkills: ['Python', 'Statistics', 'Machine Learning', 'Data Analysis', 'SQL'], preferredSkills: ['R', 'PowerBI', 'Pandas', 'Feature Engineering'], overview: 'ZS Associates is looking for associate engineers to support their analytics and ML consulting projects across healthcare and pharma clients.', whyMatch: ['Good match for entry-level analytics ML', 'Statistics background helps', 'Solid Python and pandas foundation'] },
                ];

                const autoJobs = [
                  { id: 0, title: 'Data Scientist', company: 'InnovaTech Solutions', logo: 'I', logoBg: 'bg-emerald-50', logoColor: 'text-emerald-600', location: 'Bengaluru, India', mode: 'Hybrid', match: 96, badge: '🔥 Hot', badgeColor: 'bg-orange-100 text-orange-600', experience: '1 – 3 years', type: 'Full-time', salary: '₹10 – 16 LPA', applicants: '120+', postedAgo: 'Posted 3 hours ago', source: 'LinkedIn', skills: ['Python', 'SQL', 'ML', '+4'], requiredSkills: ['Python', 'SQL', 'Machine Learning', 'Pandas', 'Statistics'], preferredSkills: ['Deep Learning', 'AWS', 'Docker'], overview: 'We are looking for a Data Scientist to join our analytics team and help build ML models for business intelligence.', whyMatch: ['96% match for your Data Science skills', 'Relevant project experience', 'Exact fit for current career path'] },
                  { id: 1, title: 'Junior Data Scientist', company: 'Quantico Analytics', logo: 'Q', logoBg: 'bg-indigo-50', logoColor: 'text-indigo-650', location: 'Hyderabad, India', mode: 'Hybrid', match: 91, badge: '', badgeColor: '', experience: '0 – 2 years', type: 'Full-time', salary: '₹7 – 11 LPA', applicants: '95+', postedAgo: 'Posted yesterday', source: 'Indeed', skills: ['Python', 'SQL', 'Pandas', '+3'], requiredSkills: ['Python', 'SQL', 'Pandas', 'Data Analysis', 'Excel'], preferredSkills: ['Machine Learning', 'Git'], overview: 'Quantico is seeking an entry-level Data Scientist to analyze business trends and implement standard models.', whyMatch: ['Strong SQL and Python foundation', 'Great entry-level match', 'Hyderabad location match'] }
                ];

                const discoveryJobs = discoveryPath === 'target' ? targetJobs : autoJobs;
                const job = discoveryJobs[selectedDiscoveryJob] || discoveryJobs[0];

                const handleAnalyzeResume = async () => {
                  setIsAnalyzingJob(true);
                  setJobAnalysisDone(false);
                  await new Promise(r => setTimeout(r, 2200));
                  setIsAnalyzingJob(false);
                  setJobAnalysisDone(true);
                };

                const matchColor = (pct: number) =>
                  pct >= 90 ? 'text-emerald-600' : pct >= 80 ? 'text-indigo-600' : pct >= 70 ? 'text-amber-600' : 'text-red-500';
                const matchBg = (pct: number) =>
                  pct >= 90 ? 'bg-emerald-500' : pct >= 80 ? 'bg-indigo-600' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';

                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

                    {/* ─── Header ─────────────────────────────────── */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Job Discovery</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          View real-time job openings matching your detected profile or custom search transition target.
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {[
                          { label: 'Jobs Found', val: discoveryPath === 'target' ? '982' : '1,247', sub: 'Live jobs', icon: '💼' },
                          { label: 'Avg Match Score', val: discoveryPath === 'target' ? '72%' : '84%', sub: 'Across all jobs', icon: '📈' },
                          { label: 'Top Match', val: discoveryPath === 'target' ? '92%' : '96%', sub: 'Highest match', icon: '🎯' },
                          { label: 'Updated', val: 'Just now', sub: 'Real-time data', icon: '🕐' },
                        ].map(stat => (
                          <div key={stat.label} className="hidden lg:block text-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{stat.icon} {stat.label}</span>
                            <span className="text-base font-black text-slate-900 block mt-0.5">{stat.val}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{stat.sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ─── Discovery Paths Selection (Phase 16) ─── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Automatically Discovered */}
                      <button
                        onClick={() => { setDiscoveryPath('auto'); setSelectedDiscoveryJob(0); }}
                        className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                          discoveryPath === 'auto'
                            ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-50'
                            : 'bg-white border-slate-200 hover:bg-slate-50/50'
                        }`}
                      >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Automatically Discovered</span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Based on your detected career</span>
                        <div className="flex justify-between items-end w-full mt-3">
                          <span className="text-sm font-black text-slate-800">Data Scientist</span>
                          <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-md">1,247 jobs analyzed</span>
                        </div>
                      </button>

                      {/* User-targeted */}
                      <button
                        onClick={() => { setDiscoveryPath('target'); setSelectedDiscoveryJob(0); }}
                        className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all ${
                          discoveryPath === 'target'
                            ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-50'
                            : 'bg-white border-slate-200 hover:bg-slate-50/50'
                        }`}
                      >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">User-targeted</span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Based on your goal</span>
                        <div className="flex justify-between items-end w-full mt-3">
                          <span className="text-sm font-black text-slate-800">{targetRole}</span>
                          <span className="text-[10px] font-bold text-indigo-655 bg-indigo-50 px-2.5 py-0.5 rounded-md">982 jobs analyzed</span>
                        </div>
                      </button>
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
                          <span className="text-xs font-black text-slate-700">Jobs (828)</span>
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
                                  <p className="text-[10px] text-slate-500 font-bold">{j.company}</p>
                                  <p className="text-[9px] text-slate-400 font-medium">{j.location} • {j.mode}</p>
                                  <p className="text-[9px] text-indigo-600 font-semibold mt-1">Source: {j.source}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {j.skills.map(s => (
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
                                className="text-[9.5px] font-black text-slate-500 border border-slate-200 px-3 py-1 rounded-lg hover:bg-slate-50 transition-colors"
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
                                    {job.requiredSkills.map(s => (
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
                                    {job.preferredSkills.map(s => (
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
                                onClick={handleAnalyzeResume}
                                disabled={isAnalyzingJob}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-black py-2.5 rounded-xl shadow-md transition-all"
                              >
                                {isAnalyzingJob ? (
                                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing...</>
                                ) : (
                                  <><Sparkles size={13} /> Analyze My Resume</>
                                )}
                              </button>
                              <p className="text-[9px] text-slate-500 font-medium text-center">Get detailed match, gaps and improvement suggestions.</p>
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
                                {job.whyMatch.map((r, i) => (
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
                              <p className="text-[10px] text-amber-800 font-semibold leading-relaxed">
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
              })()}


              {/* ================================================================
                  PAGE 16B: JOB-SPECIFIC INTELLIGENCE (Phase 16)
                 ================================================================ */}
              {currentView === 'jobintel' && (() => {

                // Use the last selected discovery job, or fallback to index 0
                const discoveryJobsIntel = [
                  { id: 0, title: 'ML Engineer', company: 'Google', match: 82, logo: 'G', logoBg: 'bg-blue-50', logoColor: 'text-blue-600' },
                  { id: 1, title: 'ML Engineer', company: 'Microsoft', match: 88, logo: '⊞', logoBg: 'bg-slate-50', logoColor: 'text-slate-700' },
                  { id: 2, title: 'Machine Learning Engineer', company: 'Amazon', match: 85, logo: 'a', logoBg: 'bg-orange-50', logoColor: 'text-orange-500' },
                  { id: 3, title: 'ML Engineer', company: 'Adobe', match: 82, logo: 'A', logoBg: 'bg-red-50', logoColor: 'text-red-600' },
                ];
                const intel = discoveryJobsIntel[Math.min(selectedDiscoveryJob, discoveryJobsIntel.length - 1)] || discoveryJobsIntel[0];

                const matchBreakdown = [
                  { label: 'Overall Match',        val: 82, color: 'bg-indigo-600' },
                  { label: 'Skills',               val: 88, color: 'bg-emerald-500' },
                  { label: 'Experience',            val: 74, color: 'bg-blue-500' },
                  { label: 'Projects',              val: 91, color: 'bg-purple-500' },
                  { label: 'Education',             val: 100, color: 'bg-orange-500' },
                  { label: 'Career Alignment',      val: 86, color: 'bg-pink-500' },
                ];

                const skillMatrix = [
                  { skill: 'Python',              status: 'Matched',   you: 95, req: 95, icon: '✓', color: 'text-emerald-600 bg-emerald-50/70 border-emerald-100' },
                  { skill: 'SQL',                 status: 'Matched',   you: 90, req: 90, icon: '✓', color: 'text-emerald-600 bg-emerald-50/70 border-emerald-100' },
                  { skill: 'Machine Learning',    status: 'Matched',   you: 92, req: 92, icon: '✓', color: 'text-emerald-600 bg-emerald-50/70 border-emerald-100' },
                  { skill: 'TensorFlow',          status: 'Matched',   you: 85, req: 85, icon: '✓', color: 'text-emerald-600 bg-emerald-50/70 border-emerald-100' },
                  { skill: 'Docker',              status: 'Missing',   you: 0,  req: 80, icon: '✗', color: 'text-red-600 bg-red-50/70 border-red-100' },
                  { skill: 'AWS',                 status: 'Missing',   you: 0,  req: 85, icon: '✗', color: 'text-red-600 bg-red-50/70 border-red-100' },
                  { skill: 'MLOps',               status: 'Missing',   you: 0,  req: 75, icon: '✗', color: 'text-red-600 bg-red-50/70 border-red-100' },
                ];

                return (
                           <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

                    {/* ─── Back to Job List Header ─── */}
                    <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Job-Specific Resume Analysis <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 border px-1.5 py-0.5 rounded-md ml-1.5">Phase 21</span></h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Deep dive analysis of your resume against the selected job requirements.</p>
                      </div>
                      <button
                        onClick={() => setCurrentView('discovery')}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 border border-slate-200 bg-white px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        ← Back to Job List
                      </button>
                    </div>

                    {/* ─── Layout Grid: Selected Job Info & Overall Match ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Job Info */}
                      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-slate-900 border flex items-center justify-center text-3xl font-black text-white flex-shrink-0">
                            𝕏
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900">ML Engineer</h3>
                            <p className="text-sm font-bold text-slate-600">Company X</p>
                            <p className="text-xs text-slate-400 font-semibold mt-2">📍 Bengaluru, India • 💼 Full-time • ⏱️ Posted 2 days ago</p>
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
                              strokeDasharray="82 18" strokeLinecap="round" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-slate-900">82%</span>
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
                        {[
                          { label: 'Skills', val: 88, desc: 'Strong Match', color: 'bg-indigo-600' },
                          { label: 'Experience', val: 74, desc: 'Good Match', color: 'bg-blue-500' },
                          { label: 'Projects', val: 91, desc: 'Strong Match', color: 'bg-emerald-500' },
                          { label: 'Education', val: 100, desc: 'Excellent Match', color: 'bg-orange-500' },
                        ].map((m, i) => (
                          <div key={i} className="border border-slate-100 rounded-2xl p-4 text-center space-y-1.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">{m.label}</span>
                            <span className="text-xl font-black text-slate-850 block">{m.val}%</span>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.val}%` }} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 block">{m.desc}</span>
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
                            {[
                              { name: 'Python', desc: 'Extensive experience in Python programming', strength: 'Strong', pct: 95 },
                              { name: 'TensorFlow', desc: 'Hands-on experience with TensorFlow in projects', strength: 'Strong', pct: 90 },
                              { name: 'Scikit-learn', desc: 'Good use of ML algorithms and scikit-learn', strength: 'Strong', pct: 85 },
                              { name: 'Data Analysis', desc: 'Strong data analysis and visualization skills', strength: 'Strong', pct: 85 },
                              { name: 'SQL', desc: 'Good SQL querying and database knowledge', strength: 'Strong', pct: 80 }
                            ].map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
                                <span className="w-24 font-black text-slate-800">{item.name}</span>
                                <span className="flex-1 text-[10px] text-slate-500 truncate px-4">{item.desc}</span>
                                <span className="text-[10px] text-emerald-600 bg-emerald-50 font-black px-2 py-0.5 rounded border border-emerald-100 mr-4">{item.strength}</span>
                                <span className="font-bold text-slate-600">{item.pct}%</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* What needs improvement */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                            <span className="text-amber-500">⚠</span> What Needs Improvement
                            <span className="text-[9px] text-slate-400 font-semibold ml-1">Areas to strengthen to match the job better.</span>
                          </div>
                          <div className="space-y-2">
                            {[
                              { name: 'Docker', desc: 'Required but not found in your resume', prio: 'High Priority', color: 'text-red-600 bg-red-50 border-red-100' },
                              { name: 'AWS', desc: 'Cloud experience is required for this role', prio: 'High Priority', color: 'text-red-600 bg-red-50 border-red-100' },
                              { name: 'MLOps', desc: 'MLOps tools and CI/CD experience missing', prio: 'Medium Priority', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                              { name: 'System Design', desc: 'Basic system design knowledge needed', prio: 'Medium Priority', color: 'text-amber-600 bg-amber-50 border-amber-100' }
                            ].map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
                                <span className="w-24 font-black text-slate-800">{item.name}</span>
                                <span className="flex-1 text-[10px] text-slate-500 truncate px-4">{item.desc}</span>
                                <span className={`text-[9.5px] font-black px-2 py-0.5 rounded border ${item.color}`}>{item.prio}</span>
                              </div>
                            ))}
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
                            {['Docker', 'AWS', 'MLOps'].map(s => (
                              <div key={s} className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {s}</span>
                                <span className="text-[8px] bg-red-50 text-red-600 border border-red-100 font-black px-2 py-0.5 rounded">High Impact</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Weak evidence panel */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                          <h4 className="text-xs font-black text-amber-600 flex items-center gap-1">⚠ Weak Evidence</h4>
                          <p className="text-[9px] text-slate-400 font-semibold">Some exposure but not strong enough.</p>
                          <div className="space-y-2 pt-1">
                            {[
                              { name: 'Production Deployment', prio: 'Medium Impact', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                              { name: 'Kubernetes', prio: 'Medium Impact', color: 'bg-amber-50 text-amber-600 border-amber-100' },
                              { name: 'CI/CD', prio: 'Low Impact', color: 'bg-slate-50 text-slate-500 border-slate-200' }
                            ].map(item => (
                              <div key={item.name} className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {item.name}</span>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${item.color}`}>{item.prio}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Strong evidence panel */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                          <h4 className="text-xs font-black text-emerald-600 flex items-center gap-1">✓ Strong Evidence</h4>
                          <p className="text-[9px] text-slate-400 font-semibold">Well demonstrated in your resume.</p>
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="space-y-2">
                              {['Python', 'TensorFlow', 'Scikit-learn'].map(s => (
                                <div key={s} className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <span className="text-emerald-500">✓</span> {s}
                                </div>
                              ))}
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
                        <span className="text-xl">⭐️</span>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">Recommendation</h4>
                          <p className="text-[10px] text-slate-650 font-semibold mt-0.5">Focus on gaining Docker, AWS and MLOps experience. Add a deployment project to strengthen your profile.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-[9px] text-slate-400 font-extrabold hover:underline cursor-pointer" onClick={() => setCurrentView('projects')}>Get AI-powered suggestions →</span>
                        <button
                          onClick={() => setCurrentView('improve')}
                          className="bg-indigo-600 text-white text-xs font-black px-4 py-2 rounded-xl border shadow hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                        >
                          Improve My Resume 🔒
                        </button>
                      </div>
                    </div>

                  </motion.div>
                );
              })()}


              {/* PAGE 6: EXPERIENCE & EVIDENCE */}
              {currentView === 'experience' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  
                  {/* Experience Timeline */}
                  <div className="bg-white border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Evidence Timeline</h3>
                    <div className="relative pl-6 border-l border-slate-200 space-y-6">
                      {experienceList.map((item, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[30px] top-1 w-2 h-2 rounded-full bg-indigo-650 ring-4 ring-indigo-50" />
                          <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                            {item.title}
                            <span className="bg-slate-100 text-slate-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">{item.type}</span>
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.details}</p>
                          {item.link && <p className="text-[10px] text-indigo-600 hover:underline mt-1">{item.link}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evidence Categories chart */}
                  <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Evidence Strength Categories</h3>
                    {[
                      { label: 'Technical Depth', score: 80 },
                      { label: 'Project Detail Validation', score: 70 },
                      { label: 'Production MLOps integration', score: 30 },
                      { label: 'Business Impact metrics', score: 20 }
                    ].map(cat => (
                      <div key={cat.label} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-650">{cat.label}</span>
                          <span className="text-slate-800">{cat.score}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600" style={{ width: `${cat.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add evidence trigger */}
                  <div className="flex justify-end">
                    <Button 
                      onClick={() => setShowAddEvidenceModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-xs rounded-xl px-4 py-2.5 flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Add new evidence item
                    </Button>
                  </div>

                  {/* Add Evidence modal overlay */}
                  {showAddEvidenceModal && (
                    <div className="p-5 border border-slate-200 bg-white rounded-2xl shadow-md space-y-4">
                      <h4 className="text-xs font-black text-slate-850 uppercase">Add Evidence Item</h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-650 mb-1">Type</label>
                          <select 
                            value={newEvidence.type} 
                            onChange={e => setNewEvidence({ ...newEvidence, type: e.target.value })}
                            className="w-full p-2 border rounded-xl bg-white"
                          >
                            <option value="project">Project</option>
                            <option value="internship">Internship</option>
                            <option value="hackathon">Hackathon</option>
                            <option value="certification">Certification</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-650 mb-1">Title / Name</label>
                          <input 
                            type="text" 
                            value={newEvidence.title} 
                            onChange={e => setNewEvidence({ ...newEvidence, title: e.target.value })}
                            className="w-full p-2 border rounded-xl"
                            placeholder="e.g. FastAPI API"
                          />
                        </div>
                      </div>
                      <div className="text-xs">
                        <label className="block font-bold text-slate-650 mb-1">Details (Tech Stack, Company)</label>
                        <input 
                          type="text" 
                          value={newEvidence.details} 
                          onChange={e => setNewEvidence({ ...newEvidence, details: e.target.value })}
                          className="w-full p-2 border rounded-xl"
                          placeholder="e.g. PyTorch, Docker"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          onClick={() => setShowAddEvidenceModal(false)}
                          variant="outline"
                          className="text-xs px-3 py-1.5"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            if (newEvidence.title) {
                              setExperienceList([...experienceList, newEvidence]);
                              setNewEvidence({ type: 'project', title: '', details: '', link: '' });
                            }
                            setShowAddEvidenceModal(false);
                          }}
                          className="bg-indigo-600 text-white text-xs px-4 py-1.5"
                        >
                          Save Evidence
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* PAGE 7: CAREER GAP ANALYSIS */}
              {currentView === 'gaps' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-white border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider">Career Gap Analysis</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {[
                          { title: 'Skill Gap', desc: '6 missing core target skills (Docker, Cloud, MLOps)', severity: 'High' },
                          { title: 'Experience Gap', desc: 'Needs production level deploy mentions', severity: 'High' },
                          { title: 'Project Gap', desc: 'Needs 1 advanced production project', severity: 'Medium' }
                        ].map((gap, idx) => (
                          <div key={idx} className="p-4 border rounded-xl space-y-1">
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-black text-slate-800">{gap.title}</h4>
                              <span className="bg-red-50 text-red-700 text-[9px] font-black px-2 py-0.5 rounded-full">{gap.severity}</span>
                            </div>
                            <p className="text-[10px] text-slate-405 text-slate-400 font-semibold">{gap.desc}</p>
                          </div>
                        ))}
                      </div>

                      {/* Prioritization matrix */}
                      <div className="bg-slate-50 p-5 rounded-2xl border space-y-4">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Priority Gaps Checklist</h4>
                        <div className="space-y-2 text-xs font-bold text-slate-650">
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Docker Containerization (High)</div>
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Model Deployment API (High)</div>
                          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Cloud Hosting basics (Medium)</div>
                        </div>
                        <div className="bg-white border rounded-xl p-3 text-[10px] font-semibold text-slate-500">
                          <span className="font-extrabold text-indigo-650 block mb-1">Projected Improvement</span>
                          Completing these high-priority items could improve your market alignment score from 68% to an estimated 81%.
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PAGE 8: JOB MARKET INTELLIGENCE */}
              {currentView === 'market' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-white border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b pb-4 mb-4">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Job Market Intelligence</h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full">
                        2,483 jobs analyzed
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-semibold mb-6">
                      Comparing target roles from LinkedIn, Indeed, Glassdoor, Naukri, and Google Jobs against your profile:
                    </p>

                    <div className="space-y-4">
                      {[
                        { name: 'Python', marketPct: 87, userPct: 91, match: true },
                        { name: 'SQL', marketPct: 73, userPct: 78, match: true },
                        { name: 'PyTorch', marketPct: 62, userPct: 72, match: true },
                        { name: 'Docker', marketPct: 58, userPct: 20, match: false },
                        { name: 'AWS', marketPct: 54, userPct: 15, match: false }
                      ].map(row => (
                        <div key={row.name} className="grid grid-cols-3 items-center text-xs font-bold py-2 border-b last:border-0">
                          <span className="text-slate-800">{row.name}</span>
                          <span className="text-slate-400">Market Demand: {row.marketPct}%</span>
                          <div className="flex items-center gap-1.5 justify-end">
                            {row.match ? (
                              <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-[9px]">Matched ({row.userPct}%)</span>
                            ) : (
                              <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-[9px]">Missing</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Emerging skills */}
                    <div className="bg-indigo-50/50 p-4 border border-indigo-100 rounded-2xl text-xs mt-6">
                      <h4 className="font-black text-indigo-700 block mb-1">Emerging skills in high demand</h4>
                      <p className="text-slate-500 font-semibold">Fast growing requirements: LLMOps, RAG, MLflow, Kubernetes.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PAGE 9: PROJECT RECOMMENDATIONS (Phase 25 — Job-Specific Project Recommendation) */}
              {currentView === 'projects' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* Title Bar */}
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      Job-Specific Project Recommendation
                      <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 border px-1.5 py-0.5 rounded-md">Phase 25</span>
                    </h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">AI-generated projects tailored to this exact job to help you win.</p>
                  </div>

                  {/* Top Target Job Card */}
                  <div className="bg-white border rounded-2xl p-5 shadow-sm flex flex-wrap md:flex-nowrap justify-between items-center gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-lg text-white font-black">𝕏</div>
                      <div>
                        <h3 className="text-sm font-black text-slate-950">ML Engineer</h3>
                        <p className="text-xs text-slate-600 font-bold mt-0.5">Company X</p>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-2 text-[10px] text-slate-450 font-bold">
                          <span>📍 Bengaluru, India</span>
                          <span>•</span>
                          <span>💼 Full-time</span>
                          <span>•</span>
                          <span>📅 Posted 2 days ago</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-center border-r pr-5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Current Match Score</span>
                        <span className="text-xl font-black text-emerald-600 block mt-0.5">82%</span>
                        <span className="text-[8px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded mt-1 inline-block">● Good Match</span>
                      </div>
                      <button className="text-[10px] font-black text-indigo-650 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors flex items-center gap-1">
                        View Job Details <ExternalLink size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Layout Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left & Middle Column */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Section 1: Skills & Tools You're Missing */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">1. Skills & Tools You're Missing for This Job</h3>
                        <div className="flex flex-wrap gap-2.5 items-center">
                          {[
                            { name: 'Docker', icon: '🐳' },
                            { name: 'AWS', icon: '☁️' },
                            { name: 'MLOps', icon: '♾️' },
                            { name: 'FastAPI', icon: '⚡' },
                            { name: 'CI/CD', icon: '⚙️' }
                          ].map((item, idx) => (
                            <span key={idx} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 border border-slate-100 bg-slate-50/50 rounded-xl px-3 py-1.5 shadow-sm">
                              <span>{item.icon}</span> {item.name}
                            </span>
                          ))}
                          <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl px-3 py-1.5">+ 5 more</span>
                        </div>
                        {/* Down pointing arrow */}
                        <div className="flex justify-center pt-2">
                          <span className="text-lg text-slate-300">↓</span>
                        </div>
                      </div>

                      {/* Section 2: Project Generator (AI) */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">2. Project Generator (AI)</h3>
                            <p className="text-[10px] text-slate-450 font-semibold mt-0.5">We analyze the job requirements and generate projects to help you cover the missing skills.</p>
                          </div>
                          <button className="flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-black px-3.5 py-2 rounded-xl shadow hover:bg-indigo-700 transition-colors">
                            <Sparkles size={11} /> Regenerate Projects
                          </button>
                        </div>

                        {/* Main Project recommendation card */}
                        <div className="border-2 border-indigo-100 rounded-2xl p-5 bg-gradient-to-r from-white to-slate-50/20 relative flex flex-col md:flex-row gap-5">
                          {/* Visual representation */}
                          <div className="w-full md:w-44 h-36 bg-slate-900 rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0 text-white">
                            {/* Diagram mockup circles */}
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                            <div className="absolute w-20 h-20 rounded-full border border-indigo-500/30 flex items-center justify-center animate-spin-slow">
                              <span className="text-[8px] font-bold text-indigo-400">AWS • DOCKER</span>
                            </div>
                            <div className="z-10 text-center space-y-1">
                              <span className="bg-indigo-600/90 text-[8px] font-black px-1.5 py-0.5 rounded border border-indigo-400">FASTAPI</span>
                              <p className="text-[10px] font-black tracking-widest block uppercase text-indigo-200">MLOPS</p>
                              <span className="text-xs font-black">⚙️ ENGINE</span>
                            </div>
                          </div>

                          <div className="flex-1 space-y-3.5">
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Highly Relevant</span>
                                <h4 className="text-sm font-black text-slate-950 mt-1.5">Production ML Deployment Platform</h4>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-[10px] text-slate-400 font-semibold">Relevance to Job</p>
                                <span className="text-sm font-black text-emerald-600 block">17 / 17</span>
                                <p className="text-[7.5px] text-slate-400 font-bold">Requirements Covered</p>
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                              End-to-end ML platform to train, deploy, monitor and manage ML models in production with CI/CD, Docker, AWS and FastAPI.
                            </p>

                            <div className="space-y-1 bg-slate-50 border border-slate-100 rounded-xl p-3">
                              <span className="text-[9px] font-black text-slate-450 uppercase block">Why this project?</span>
                              <p className="text-[10px] text-slate-655 font-bold leading-normal">
                                This project demonstrates your ability to build and deploy ML solutions in production using industry-standard tools and best practices.
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {['Python', 'FastAPI', 'Docker', 'AWS', 'MLflow', 'GitHub Actions', '+2'].map(tag => (
                                <span key={tag} className="text-[8.5px] font-black text-indigo-650 bg-indigo-50 border rounded px-1.5 py-0.5">{tag}</span>
                              ))}
                            </div>

                            <div className="flex gap-2 pt-1.5 border-t border-slate-100">
                              <button onClick={() => setCurrentView('projectplan' as any)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black py-2 rounded-xl transition-all text-center animate-pulse">
                                View Project Plan
                              </button>
                              <button className="flex items-center justify-center gap-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-black px-4 py-2 rounded-xl transition-all">
                                ☆ Save Project
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: More Projects Tailored for This Job */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">3. More Projects Tailored for This Job</h3>
                        
                        <div className="space-y-3">
                          {[
                            {
                              title: 'Real-time Fraud Detection System',
                              desc: 'Build a real-time fraud detection API with streaming data, feature store, and real-time model inference using AWS and Docker.',
                              covered: '14 / 17'
                            },
                            {
                              title: 'MLOps Monitoring & Alerting Dashboard',
                              desc: 'Create a monitoring dashboard for ML models with data drift detection, alerts, and performance tracking.',
                              covered: '13 / 17'
                            }
                          ].map((item, idx) => (
                            <div key={idx} className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/20">
                              <div className="space-y-1 flex-1">
                                <h4 className="text-xs font-black text-slate-850">{item.title}</h4>
                                <p className="text-[10px] text-slate-550 font-medium leading-relaxed">{item.desc}</p>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-center min-w-[90px]">
                                  <span className="text-[9px] text-slate-400 font-bold block">Requirements Covered</span>
                                  <span className="text-xs font-black text-emerald-600">{item.covered}</span>
                                </div>
                                <div className="flex gap-1.5">
                                  <button className="text-[9.5px] font-black text-slate-700 border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 hover:bg-slate-50">View Details</button>
                                  <button className="text-[9.5px] font-black text-indigo-650 border border-indigo-200 bg-white rounded-lg px-2.5 py-1.5 hover:bg-indigo-50">☆ Save</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button className="w-full text-center text-xs font-black text-indigo-650 hover:underline pt-2 block">
                          View All Recommended Projects →
                        </button>
                      </div>

                    </div>

                    {/* Right Column: Sidebar snapshot */}
                    <div className="space-y-6">
                      
                      {/* Job Requirements Snapshot */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Job Requirements Snapshot</h4>
                          <div className="text-right">
                            <span className="text-[8px] font-bold text-slate-400 block">Total Requirements</span>
                            <span className="text-xs font-black text-emerald-600">17</span>
                          </div>
                        </div>

                        <div className="space-y-3 text-xs font-bold text-slate-700">
                          {[
                            { label: 'Technical Skills', val: 10, dot: 'bg-emerald-500' },
                            { label: 'Tools & Frameworks', val: 5, dot: 'bg-orange-500' },
                            { label: 'Cloud / DevOps', val: 4, dot: 'bg-amber-500' },
                            { label: 'Other Requirements', val: 3, dot: 'bg-indigo-500' }
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} /> {item.label}</span>
                              <span className="font-black text-slate-900">{item.val}</span>
                            </div>
                          ))}
                        </div>

                        <button className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-indigo-650 text-xs font-black py-2 rounded-xl transition-all shadow-sm">
                          View All Job Requirements
                        </button>
                      </div>

                      {/* Why This Project is Relevant? */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Why This Project is Relevant?</h4>
                        
                        <div className="space-y-3">
                          {[
                            'Demonstrates Docker containerization',
                            'Deploys on AWS (EC2, S3, ECR)',
                            'Implements FastAPI for model serving',
                            'Uses MLflow for experiment tracking',
                            'CI/CD pipeline with GitHub Actions',
                            'Monitoring & logging for MLOps'
                          ].map((text, idx) => (
                            <div key={idx} className="flex gap-2 items-start text-[10px] font-bold text-slate-700 leading-tight">
                              <span className="text-emerald-500 font-black">✓</span>
                              <p>{text}</p>
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-3.5 mt-2.5 text-center">
                          <p className="text-[10px] text-slate-455 font-extrabold">Covers 17 job requirements</p>
                        </div>
                      </div>

                      {/* Next Steps */}
                      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Next Steps</h4>
                        
                        <div className="space-y-4">
                          {[
                            { num: '1', title: 'Choose a project that covers the most missing skills' },
                            { num: '2', title: 'Build the project and showcase on your portfolio' },
                            { num: '3', title: 'Improve your match score and get more interviews' }
                          ].map((item, idx) => (
                            <div key={idx} className="flex gap-3 items-start text-xs font-bold text-slate-700">
                              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{item.num}</span>
                              <p className="leading-tight">{item.title}</p>
                            </div>
                          ))}
                        </div>

                        <button onClick={() => setCurrentView('versions')} className="w-full bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md mt-2">
                          Go to My Projects
                        </button>
                      </div>

                    </div>
                  </div>

                </motion.div>
              )}

              {/* PAGE 12B: TARGET CAREER (Phase 13 — AI Career Prompt) */}

              {/* PAGE 9B: PROJECT PLAN (Phase 26 — x402 Project Generation) */}
              {currentView === ('projectplan' as any) && (() => {
                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {/* Header Recommended Project details card */}
                    <div className="bg-white border rounded-2xl p-5 shadow-sm flex flex-wrap md:flex-nowrap justify-between items-center gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-650 flex items-center justify-center text-lg text-white font-black text-center pt-2">ML</div>
                        <div>
                          <span className="bg-indigo-50 text-indigo-750 border border-indigo-100 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Recommended Project</span>
                          <h3 className="text-sm font-black text-slate-955 mt-1.5">Production ML Deployment Platform</h3>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">End-to-end platform to train, deploy, monitor and manage ML models in production with CI/CD, Docker, AWS and FastAPI.</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                            {['Python', 'FastAPI', 'Docker', 'AWS', 'MLOps', '+2'].map(tag => (
                              <span key={tag} className="text-[8.5px] font-black text-indigo-650 bg-indigo-50 border rounded px-1.5 py-0.5">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="text-center border-r pr-5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Relevance to Job</span>
                          <span className="text-sm font-black text-emerald-600 block mt-0.5">17 / 17</span>
                          <span className="text-[8px] text-slate-400 font-bold block">Requirements Covered</span>
                        </div>
                        <button onClick={() => setCurrentView('projects')} className="text-[10px] font-black text-indigo-650 border border-indigo-200 rounded-xl px-4 py-2 hover:bg-indigo-50 transition-colors">
                          View Project Details
                        </button>
                      </div>
                    </div>

                    {/* Main Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left: What you get or active plan */}
                      <div className="lg:col-span-2 space-y-6">
                        
                        {!projectPlanPaid ? (
                          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
                            <h3 className="text-sm font-black text-slate-900 border-b pb-3 uppercase tracking-wider">What You Will Get <span className="text-[10px] text-slate-400 font-bold font-sans">(Full Project Plan)</span></h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {[
                                { id: 1, label: '1. Architecture', desc: 'System design, components, services and data flow diagrams.', icon: '🌐' },
                                { id: 2, label: '2. Tech Stack', desc: 'Detailed list of technologies and tools used with versions and purpose.', icon: '🧬' },
                                { id: 3, label: '3. Folder Structure', desc: 'Complete project directory structure and file organization.', icon: '📁' },
                                { id: 4, label: '4. Milestones', desc: 'Step-by-step milestones to build the project from start to finish.', icon: '🏁' },
                                { id: 5, label: '5. Tasks', desc: 'Detailed tasks under each milestone with clear descriptions.', icon: '📋' },
                                { id: 6, label: '6. APIs', desc: 'All API endpoints, request/response formats and examples.', icon: '📡' },
                                { id: 7, label: '7. Deployment', desc: 'Deployment guide for AWS (EC2, S3, ECR, etc.) with commands.', icon: '☁️' },
                                { id: 8, label: '8. Resume Bullet', desc: 'Powerful resume bullet points based on this project to boost your profile.', icon: '📝' },
                                { id: 9, label: '9. GitHub README', desc: 'Professional README structure ready to use for your GitHub repo.', icon: '🐙' }
                              ].map(item => (
                                <div key={item.id} className="border border-slate-100 bg-slate-50/20 rounded-xl p-4 space-y-1.5 hover:shadow-sm transition-all">
                                  <div className="text-lg">{item.icon}</div>
                                  <h4 className="text-xs font-black text-slate-800">{item.label}</h4>
                                  <p className="text-[10px] text-slate-450 leading-relaxed font-semibold">{item.desc}</p>
                                </div>
                              ))}
                            </div>

                            <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-3.5 flex items-center gap-2.5 text-[10px] text-indigo-700 font-bold">
                              <span>ℹ️</span>
                              <p>This detailed plan is AI-generated based on the job requirements, your skill gaps and industry best practices.</p>
                            </div>
                          </div>
                        ) : (
                          /* Unlocked project details! */
                          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
                            <div className="flex justify-between items-center border-b pb-3.5">
                              <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                  <span>🔓 Full Project Plan Unlocked</span>
                                  <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Active</span>
                                </h3>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Explore each plan component below to build your repository.</p>
                              </div>
                              <button onClick={() => setCurrentView('projects')} className="text-xs text-indigo-650 hover:underline font-black">Back to Projects</button>
                            </div>

                            {/* Inner Tab bar */}
                            <div className="flex border-b overflow-x-auto gap-1 pb-1.5">
                              {[
                                { id: 'arch', label: 'Architecture' },
                                { id: 'tech', label: 'Tech Stack' },
                                { id: 'folder', label: 'Folder structure' },
                                { id: 'milestones', label: 'Milestones & Tasks' },
                                { id: 'apis', label: 'APIs spec' },
                                { id: 'deploy', label: 'AWS Deployment' },
                                { id: 'bullets', label: 'Resume bullets' },
                                { id: 'readme', label: 'GitHub README' }
                              ].map(tab => (
                                <button
                                  key={tab.id}
                                  onClick={() => setActivePlanTab(tab.id)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${
                                    activePlanTab === tab.id
                                      ? 'bg-indigo-50 border-indigo-205 text-indigo-700'
                                      : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>

                            {/* Tab Content viewport */}
                            <div className="space-y-4 pt-1.5 text-xs font-bold text-slate-700">
                              {activePlanTab === 'arch' && (
                                <div className="space-y-4">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">System Architecture Diagram</span>
                                  <div className="border border-slate-150 rounded-xl p-4 bg-slate-905 font-mono text-[9px] text-slate-655 space-y-2 whitespace-pre leading-relaxed overflow-x-auto">
{`┌──────────────────┐      HTTP POST      ┌──────────────────────┐      gRPC Call      ┌──────────────────┐
│   React Client   │ ──────────────────> │ FastAPI Web Server   │ ──────────────────> │ Triton Inference │
│  (Tailwind UI)   │                     │  (Docker Container)  │                     │  (GPU Server)    │
└──────────────────┘                     └──────────────────────┘                     └──────────────────┘
                                                    │
                                                    │ Store Metrics
                                                    ▼
                                         ┌──────────────────────┐
                                         │ Prometheus / Grafana │
                                         │  (Cloud Monitoring)  │
                                         └──────────────────────┘`}
                                  </div>
                                  <p className="text-[10px] leading-relaxed font-semibold text-slate-500">This architecture employs a high-performance FastAPI proxy gateway containerized in Docker, routing validation challenges to a dedicated Triton GPU inference backend. Prometheus metrics are exported to visualize latency distributions.</p>
                                </div>
                              )}

                              {activePlanTab === 'tech' && (
                                <div className="space-y-3">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tech Stack & Library Versions</span>
                                  <div className="border rounded-xl overflow-hidden">
                                    <table className="w-full text-left border-collapse text-[10px] font-bold">
                                      <thead>
                                        <tr className="bg-slate-50 border-b text-slate-400 uppercase tracking-wider">
                                          <th className="p-3">Technology</th>
                                          <th className="p-3">Version</th>
                                          <th className="p-3">Role / Purpose</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y text-slate-700">
                                        <tr>
                                          <td className="p-3 text-slate-900 font-extrabold">FastAPI</td>
                                          <td className="p-3">0.110.0</td>
                                          <td className="p-3">Asynchronous API endpoints serving low latency predictions</td>
                                        </tr>
                                        <tr>
                                          <td className="p-3 text-slate-900 font-extrabold">Docker</td>
                                          <td className="p-3">25.0.3</td>
                                          <td className="p-3">Application containerization & isolation wrapper</td>
                                        </tr>
                                        <tr>
                                          <td className="p-3 text-slate-900 font-extrabold">MLflow</td>
                                          <td className="p-3">2.11.1</td>
                                          <td className="p-3">Model registry, run tracking, parameters logger</td>
                                        </tr>
                                        <tr>
                                          <td className="p-3 text-slate-900 font-extrabold">AWS SDK (Boto3)</td>
                                          <td className="p-3">1.34.40</td>
                                          <td className="p-3">Loading datasets dynamically from S3 buckets</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {activePlanTab === 'folder' && (
                                <div className="space-y-3">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Repository Directory Tree</span>
                                  <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 font-mono text-[10px] text-slate-700 whitespace-pre leading-relaxed overflow-x-auto">
{`my-mlops-platform/
├── .github/
│   └── workflows/
│       └── deploy-ci.yml      # CI/CD deployment pipeline configuration
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI entrypoint file
│   ├── config.py              # Env configuration settings
│   └── utils.py               # Model download & S3 utilities
├── Dockerfile                 # Production multi-stage Docker build
├── requirements.txt           # Python application dependencies
├── docker-compose.yml         # Local stack deployment orchestration
└── README.md                  # Project installation & documentation`}
                                  </div>
                                </div>
                              )}

                              {activePlanTab === 'milestones' && (
                                <div className="space-y-4">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Project Implementation Roadmap</span>
                                  
                                  <div className="space-y-3.5">
                                    {[
                                      { title: 'Milestone 1: FastAPI Base Backend Setup', desc: 'Initialize Python environment, set up application configurations and write basic ping/health check endpoints.', tasks: ['Configure Boto3 AWS environment credentials locally.', 'Implement basic asynchronous endpoint shell in main.py.'] },
                                      { title: 'Milestone 2: Docker Orchestration', desc: 'Write multi-stage Dockerfile optimized for footprint and configure docker-compose for PostgreSQL metrics logger.', tasks: ['Compile dependency lists in requirements.txt.', 'Verify image builds using target compilation stages.'] },
                                      { title: 'Milestone 3: S3 Integration & Model Serving', desc: 'Establish connection pipeline to AWS S3, pull active weight models and load inference engines on startup.', tasks: ['Load pickle weights safely on web startup triggers.', 'Add inference schema support using Pydantic request classes.'] }
                                    ].map((m, i) => (
                                      <div key={i} className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/30 space-y-2">
                                        <span className="text-[9.5px] font-black text-indigo-755 block uppercase">Phase {i+1}: {m.title}</span>
                                        <p className="text-[10px] text-slate-500 font-semibold leading-normal">{m.desc}</p>
                                        <div className="space-y-1.5 pt-1">
                                          {m.tasks.map((t, idx) => (
                                            <div key={idx} className="flex gap-2 items-center text-[10px] text-slate-700 font-bold">
                                              <input type="checkbox" className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 w-3.5 h-3.5" />
                                              <span>{t}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {activePlanTab === 'apis' && (
                                <div className="space-y-4">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">API Endpoint Specifications</span>
                                  
                                  <div className="border rounded-xl p-4 bg-slate-50 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded">POST</span>
                                      <span className="font-mono text-xs text-slate-800">/api/v1/predict</span>
                                    </div>
                                    <p className="text-[10px] font-semibold text-slate-500 leading-normal">Submit request data payload to fetch predictions from the loaded random forest model weights.</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                      <div>
                                        <span className="text-[8px] font-black text-slate-450 uppercase block mb-1">Request Payload</span>
                                        <pre className="border border-slate-200 bg-white rounded-lg p-2.5 font-mono text-[9px] text-slate-750 overflow-x-auto">
{`{
  "features": [
    0.82, 1.45, 0.0,
    9.12, 10.3, 0.44
  ]
}`}
                                        </pre>
                                      </div>
                                      <div>
                                        <span className="text-[8px] font-black text-slate-455 uppercase block mb-1">Response JSON</span>
                                        <pre className="border border-slate-200 bg-white rounded-lg p-2.5 font-mono text-[9px] text-slate-755 overflow-x-auto">
{`{
  "prediction": "ML_ENGINEER",
  "confidence": 0.8921,
  "elapsed_ms": 14.5
}`}
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {activePlanTab === 'deploy' && (
                                <div className="space-y-3">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AWS Cloud Deployment Blueprint</span>
                                  <p className="text-[10px] font-semibold text-slate-550 leading-relaxed">Follow these sequential shell commands to configure AWS ECS (Elastic Container Service) instance parameters and push the application image to ECR.</p>
                                  <div className="border border-slate-150 rounded-xl p-4 bg-slate-900 font-mono text-[10px] text-slate-100 whitespace-pre leading-relaxed overflow-x-auto">
{`# 1. Authenticate local Docker daemon with AWS ECR Registry
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# 2. Tag local image wrapper for target registry
docker tag my-ml-platform:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-ml-platform:v1.0

# 3. Push container binary to repository server
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-ml-platform:v1.0`}
                                  </div>
                                </div>
                              )}

                              {activePlanTab === 'bullets' && (
                                <div className="space-y-3">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">High-Impact Resume Bullets</span>
                                  <p className="text-[10px] font-semibold text-slate-550 leading-relaxed">Copy and paste these pre-formatted metrics bullet points directly into your portfolio resume versions to target career selectors:</p>
                                  
                                  <div className="space-y-2">
                                    {[
                                      'Designed and launched a containerized machine learning serving gateway using FastAPI and Docker, reducing application response latencies by 41% across 10k monthly request calls.',
                                      'Configured automated deployment workflows via AWS Elastic Container Service (ECS) and GitHub Actions, lowering developer build cycles from 20 minutes to 3.5 minutes.'
                                    ].map((b, idx) => (
                                      <div key={idx} className="border border-slate-150 bg-slate-50/40 rounded-xl p-3 flex justify-between items-center gap-3">
                                        <p className="text-[10.5px] font-bold text-slate-800 leading-normal flex-1">→ {b}</p>
                                        <button onClick={() => alert('Copied to clipboard!')} className="bg-white border text-[9px] font-black text-indigo-650 px-2 py-1 rounded hover:bg-slate-50 flex-shrink-0">Copy</button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {activePlanTab === 'readme' && (
                                <div className="space-y-3">
                                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">GitHub README Template Outline</span>
                                  <div className="border border-slate-150 rounded-xl p-4 bg-slate-50 font-mono text-[9.5px] text-slate-700 whitespace-pre leading-relaxed overflow-x-auto">
{`# Production ML Deployment Platform

Containerized low-latency prediction endpoint pipeline with automated CI/CD deployment configuration.

## Features
- **FastAPI Core**: Serves model weights in less than 15ms.
- **Docker Wrapper**: Containerized for consistency.
- **MLflow Tracking**: Active logging for model drift parameters.

## Setup Instructions
\`\`\`bash
# Build the local Docker container
docker-compose up --build

# Submit client prediction request
curl -X POST http://localhost:8000/api/v1/predict -d @payload.json
\`\`\``}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Gating sidebar or unlocked panel */}
                      <div className="lg:col-span-1 space-y-6">
                        
                        {!projectPlanPaid ? (
                          <>
                            {/* Unlock Complete Project Plan Card */}
                            <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-black border border-purple-100">
                                  🔒
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider">Unlock Complete Project Plan</h4>
                                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Pay a small fee to generate plan instantly.</p>
                                </div>
                              </div>

                              <div className="bg-indigo-50/20 border border-indigo-100 rounded-xl p-5 text-center space-y-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase block">Price</span>
                                <span className="text-2xl font-black text-indigo-700 block">$0.03 USDC</span>
                              </div>

                              <div className="space-y-2.5">
                                {[
                                  'One-time payment',
                                  'Instant access to full project plan',
                                  'Secure payment via x402 protocol',
                                  'No subscription. Pay per project.'
                                ].map((tick, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                    <span className="text-emerald-500 font-black">✓</span> {tick}
                                  </div>
                                ))}
                              </div>

                              <button
                                onClick={() => {
                                  setProjectPlanPaymentStep('paywall');
                                }}
                                className="w-full bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                              >
                                🔒 Pay & Generate
                              </button>
                              <span className="text-[8.5px] text-slate-400 font-bold text-center block">Secure x402 Payment</span>
                            </div>

                            {/* How it works */}
                            <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">How it works?</h4>
                              <div className="flex items-center gap-2 text-center text-[10px] font-bold text-slate-700">
                                <div className="flex-1 space-y-1 bg-slate-50 border rounded-lg p-2.5">
                                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-650 border border-indigo-100 flex items-center justify-center mx-auto text-[9px] font-black">1</span>
                                  <p className="leading-tight">Select Project</p>
                                </div>
                                <span className="text-slate-300">→</span>
                                <div className="flex-1 space-y-1 bg-slate-50 border rounded-lg p-2.5">
                                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-650 border border-indigo-100 flex items-center justify-center mx-auto text-[9px] font-black">2</span>
                                  <p className="leading-tight">Pay Securely</p>
                                </div>
                                <span className="text-slate-300">→</span>
                                <div className="flex-1 space-y-1 bg-slate-50 border rounded-lg p-2.5">
                                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-650 border border-indigo-100 flex items-center justify-center mx-auto text-[9px] font-black">3</span>
                                  <p className="leading-tight">Get Full Plan</p>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5 shadow-sm space-y-3.5 text-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-650 flex items-center justify-center text-lg mx-auto">🎉</div>
                            <div>
                              <h4 className="text-xs font-black text-slate-800">You Own This Plan</h4>
                              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Use code blueprints to implement Docker MLOps pipelines.</p>
                            </div>
                            <button onClick={() => setCurrentView('projects')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2 rounded-xl transition-all shadow border">
                                      Back to Project Directory
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Right column of projectplan view */}
                      <div className="lg:col-span-1 space-y-6">
                        {!projectPlanPaid ? (
                          <>
                            {/* Unlock Complete Project Plan Card */}
                            <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm font-black border border-purple-100">
                                  🔒
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider">Unlock Complete Project Plan</h4>
                                  <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Pay a small fee to generate plan instantly.</p>
                                </div>
                              </div>

                              <div className="bg-indigo-50/20 border border-indigo-100 rounded-xl p-5 text-center space-y-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase block">Price</span>
                                <span className="text-2xl font-black text-indigo-700 block">$0.03 USDC</span>
                              </div>

                              <div className="space-y-2.5">
                                {[
                                  'One-time payment',
                                  'Instant access to full project plan',
                                  'Secure payment via x402 protocol',
                                  'No subscription. Pay per project.'
                                ].map((tick, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                    <span className="text-emerald-500 font-black">✓</span> {tick}
                                  </div>
                                ))}
                              </div>

                              <button
                                onClick={() => {
                                  setProjectPlanPaymentStep('paywall');
                                }}
                                className="w-full bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                              >
                                🔒 Pay & Generate
                              </button>
                              <span className="text-[8.5px] text-slate-400 font-bold text-center block">Secure x402 Payment</span>
                            </div>

                            {/* How it works */}
                            <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                              <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider">How it works?</h4>
                              <div className="flex items-center gap-2 text-center text-[10px] font-bold text-slate-700">
                                <div className="flex-1 space-y-1 bg-slate-50 border rounded-lg p-2.5">
                                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-650 border border-indigo-100 flex items-center justify-center mx-auto text-[9px] font-black">1</span>
                                  <p className="leading-tight">Select Project</p>
                                </div>
                                <span className="text-slate-300">→</span>
                                <div className="flex-1 space-y-1 bg-slate-50 border rounded-lg p-2.5">
                                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-650 border border-indigo-100 flex items-center justify-center mx-auto text-[9px] font-black">2</span>
                                  <p className="leading-tight">Pay Securely</p>
                                </div>
                                <span className="text-slate-300">→</span>
                                <div className="flex-1 space-y-1 bg-slate-50 border rounded-lg p-2.5">
                                  <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-650 border border-indigo-100 flex items-center justify-center mx-auto text-[9px] font-black">3</span>
                                  <p className="leading-tight">Get Full Plan</p>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5 shadow-sm space-y-3.5 text-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-655 flex items-center justify-center text-lg mx-auto">🎉</div>
                            <div>
                              <h4 className="text-xs font-black text-slate-805">You Own This Plan</h4>
                              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Use code blueprints to implement Docker MLOps pipelines.</p>
                            </div>
                            <button onClick={() => setCurrentView('projects')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2 rounded-xl transition-all shadow border">
                              Back to Project Directory
                            </button>
                          </div>
                        )}

                        {/* Next Steps List */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider">Next Steps</h4>
                          <div className="space-y-4">
                            {[
                              { num: '1', title: 'Choose a project that covers the most missing skills' },
                              { num: '2', title: 'Build the project and showcase on your portfolio' },
                              { num: '3', title: 'Improve your match score and get more interviews' }
                            ].map((item, idx) => (
                              <div key={idx} className="flex gap-3 items-start text-xs font-bold text-slate-700">
                                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-750 border border-indigo-100 flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{item.num}</span>
                                <p className="leading-tight">{item.title}</p>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => setCurrentView('projects')} className="w-full bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md mt-2">
                            Go to My Projects
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Bottom Tip Banner */}
                    <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
                      <span className="text-lg">💡</span>
                      <p className="text-[10.5px] text-slate-655 font-bold leading-normal">
                        <strong>Tip:</strong> This project is highly relevant to the selected job and helps you showcase the most in-demand skills.
                      </p>
                    </div>

                  </motion.div>
                );
              })()}

              {/* PAGE 9C: RE-MATCHING RESULTS (Phase 28) */}
              {currentView === ('rematch' as any) && (() => {
                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-4 border-slate-200">
                      <div>
                        <h2 className="text-xl font-black text-slate-905 flex items-center gap-2">
                          Re-Matching Results
                          <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 border px-1.5 py-0.5 rounded-md">Phase 28</span>
                        </h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">See how your improved profile is performing across the job market.</p>
                      </div>
                      <button onClick={() => setCurrentView('targetmatch')} className="flex items-center gap-1.5 border hover:bg-slate-50 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all">
                        ← View Previous Matches
                      </button>
                    </div>

                    {/* Top Hero Layout Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left side: Your Match Improvement Summary */}
                      <div className="lg:col-span-2 bg-white border rounded-2xl p-6 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Your Match Improvement Summary</h3>
                        
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
                          {/* Before chart */}
                          <div className="text-center space-y-2.5">
                            <span className="text-[10px] font-black text-slate-450 uppercase block">Before Improvement</span>
                            <div className="relative w-28 h-28 mx-auto">
                              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="82 18" strokeLinecap="round" />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-black text-slate-850">82%</span>
                                <span className="text-[8px] text-slate-400 font-bold block uppercase">Match Score</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-455 font-bold block">Matched to 75 jobs</span>
                          </div>

                          {/* Center transition details */}
                          <div className="text-center space-y-2">
                            <div className="flex items-center justify-center gap-4 text-2xl font-black">
                              <span className="text-slate-450">82%</span>
                              <span className="text-slate-300">→</span>
                              <span className="text-emerald-600">89%</span>
                            </div>
                            <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9.5px] font-black px-2.5 py-0.5 rounded-full inline-block">
                              + 7% improvement
                            </span>
                            <p className="text-[10px] text-slate-400 font-semibold max-w-[200px] mx-auto leading-relaxed mt-2">
                              Great job! Your changes made a real impact.
                            </p>
                          </div>

                          {/* After chart */}
                          <div className="text-center space-y-2.5">
                            <span className="text-[10px] font-black text-slate-450 uppercase block">After Improvement</span>
                            <div className="relative w-28 h-28 mx-auto">
                              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="89 11" strokeLinecap="round" />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-black text-slate-850">89%</span>
                                <span className="text-[8px] text-emerald-650 font-bold block uppercase">Match Score</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-emerald-655 font-bold block">Matched to 109 jobs</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Summary Indicators card */}
                      <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden">
                        <div className="flex gap-4 items-start">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-lg flex-shrink-0 animate-bounce">
                            🚀
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase">Stronger Than Before!</h4>
                            <p className="text-[9px] text-slate-400 font-semibold mt-0.5 leading-relaxed">Your profile is now matching with more high-quality job opportunities.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100">
                          <div className="text-center space-y-1">
                            <span className="text-2xl font-black text-emerald-600 block">+7%</span>
                            <span className="text-[8.5px] text-slate-400 uppercase tracking-wider block">Improvement</span>
                          </div>
                          <div className="text-center space-y-1">
                            <span className="text-2xl font-black text-emerald-600 block">+34</span>
                            <span className="text-[8.5px] text-slate-400 uppercase tracking-wider block">Additional Jobs</span>
                          </div>
                        </div>

                        <div className="bg-emerald-50/20 border border-emerald-100 rounded-xl p-3 flex gap-2 items-center text-[10px] text-slate-700 font-bold leading-tight">
                          <span>🏆</span>
                          <p>You are now in the <strong className="text-emerald-700 font-black">Top 18%</strong> of candidates for ML Engineer roles.</p>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown table & Side columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left side detail panel */}
                      <div className="lg:col-span-2 space-y-6">
                        
                        {/* Match Score Breakdown */}
                        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Match Score Breakdown</h3>
                          
                          <div className="space-y-4">
                            {[
                              { label: 'Skills Match', before: 88, after: 94, diff: '↑ 6%', color: 'text-emerald-600' },
                              { label: 'Experience Match', before: 74, after: 82, diff: '↑ 8%', color: 'text-emerald-600' },
                              { label: 'Projects Match', before: 80, after: 90, diff: '↑ 10%', color: 'text-emerald-600' },
                              { label: 'Education Match', before: 100, after: 100, diff: '—', color: 'text-slate-400' },
                              { label: 'Overall Strength', before: 82, after: 89, diff: '↑ 7%', color: 'text-emerald-600' }
                            ].map((row, idx) => (
                              <div key={idx} className="grid grid-cols-12 items-center gap-4 text-xs font-bold text-slate-700">
                                <div className="col-span-3 text-[11px] font-black text-slate-855">{row.label}</div>
                                <div className="col-span-1 text-right text-indigo-650">{row.before}%</div>
                                <div className="col-span-3">
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${row.before}%` }} />
                                  </div>
                                </div>
                                <div className="col-span-1 text-right text-emerald-650">{row.after}%</div>
                                <div className="col-span-3">
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${row.after}%` }} />
                                  </div>
                                </div>
                                <div className={`col-span-1 text-right text-[10px] font-black ${row.color}`}>{row.diff}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Match Score Trend chart */}
                        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Match Score Trend</h3>
                          
                          <div className="border border-slate-100 bg-slate-50/20 rounded-2xl p-5 relative min-h-[170px] flex flex-col justify-end">
                            {/* Graphic points mock */}
                            <div className="absolute inset-x-6 top-10 bottom-12 border-b border-dashed flex justify-between items-end">
                              {[
                                { pct: 68, label: '68%', tag: 'Initial Match', h: 68 },
                                { pct: 82, label: '82%', tag: 'After Resume Improvement', h: 82 },
                                { pct: 85, label: '85%', tag: 'After Projects Added', h: 85 },
                                { pct: 89, label: '89%', tag: 'Current (Phase 28)', h: 89 }
                              ].map((pt, i) => (
                                <div key={i} className="flex flex-col items-center relative flex-1">
                                  <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-md flex items-center justify-center z-10 ${i === 3 ? 'bg-emerald-500 animate-pulse scale-110' : 'bg-indigo-500'}`} />
                                  <span className={`text-[10px] font-black absolute -top-6 ${i === 3 ? 'text-emerald-600' : 'text-slate-800'}`}>{pt.label}</span>
                                  <span className="text-[8px] text-slate-400 font-extrabold text-center uppercase tracking-wider block mt-2.5 max-w-[85px] leading-tight">{pt.tag}</span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Connecting gradient paths mockup background */}
                            <div className="absolute inset-x-6 top-10 bottom-12 opacity-10 bg-gradient-to-t from-indigo-500 to-transparent rounded-t-xl" />
                          </div>

                          <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-3 flex gap-2 items-center text-[10px] text-indigo-700 font-bold leading-relaxed">
                            <span>✨</span>
                            <p><strong>Amazing Progress!</strong> Your consistent efforts are paying off. Keep building and stay ahead of the competition.</p>
                          </div>
                        </div>

                      </div>

                      {/* Right side widgets */}
                      <div className="space-y-6">
                        
                        {/* New Opportunities Unlocked */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black text-slate-850 uppercase tracking-wider">New Opportunities Unlocked</h4>
                            <span className="bg-indigo-100 text-indigo-700 text-[8.5px] font-black px-2 py-0.5 rounded">+34</span>
                          </div>

                          <div className="flex items-center justify-around py-3 border rounded-xl bg-slate-50/50">
                            <div className="text-center">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Before</span>
                              <span className="text-xl font-black text-slate-800 block mt-0.5">75</span>
                              <span className="text-[7.5px] text-slate-400 font-bold">Matched Jobs</span>
                            </div>
                            <span className="text-slate-300 font-black">→</span>
                            <div className="text-center">
                              <span className="text-xl font-black text-emerald-650 block mt-0.5">109</span>
                              <span className="text-[7.5px] text-emerald-655 font-bold">Matched Jobs</span>
                            </div>
                            <div className="text-center border-l pl-4">
                              <span className="text-2xl font-black text-emerald-650 block">+34</span>
                              <span className="text-[7.5px] text-slate-400 font-bold">Additional Jobs</span>
                            </div>
                          </div>

                          <button className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-indigo-650 text-xs font-black py-2 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1">
                            Explore New Matches <ExternalLink size={11} />
                          </button>
                        </div>

                        {/* Top 5 New Jobs You Now Match */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                          <div className="flex justify-between items-center border-b pb-2.5 border-slate-100">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Top 5 New Jobs You Now Match</h4>
                            <span className="bg-emerald-100 text-emerald-700 text-[8.5px] font-black px-2 py-0.5 rounded">NEW</span>
                          </div>

                          <div className="space-y-3">
                            {[
                              { id: 1, title: 'Machine Learning Engineer', company: 'Amazon', match: 92 },
                              { id: 2, title: 'Applied ML Engineer', company: 'Microsoft', match: 91 },
                              { id: 3, title: 'Data Scientist (ML Focus)', company: 'Flipkart', match: 90 },
                              { id: 4, title: 'ML Engineer (NLP)', company: 'Oracle', match: 89 },
                              { id: 5, title: 'AI/ML Engineer', company: 'Samsung R&D', match: 88 }
                            ].map((job, idx) => (
                              <div key={job.id} className="flex justify-between items-center text-xs font-bold text-slate-700 py-0.5 border-b border-slate-50 last:border-0">
                                <div className="space-y-0.5 flex-1 pr-2">
                                  <p className="text-slate-900 font-black truncate max-w-[150px]">{job.id}. {job.title}</p>
                                  <span className="text-[9px] text-slate-400 font-bold block">{job.company}</span>
                                </div>
                                <span className="text-emerald-655 font-black whitespace-nowrap">{job.match}% Match</span>
                              </div>
                            ))}
                          </div>

                          <button onClick={() => setCurrentView('discovery')} className="w-full text-center text-xs font-black text-indigo-650 hover:underline pt-2 block">
                            View All 34 New Matching Jobs →
                          </button>
                        </div>

                        {/* Continue Button */}
                        <button onClick={() => setCurrentView('discovery')} className="w-full bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5">
                          Continue Improving <ArrowRight size={12} />
                        </button>

                      </div>

                    </div>
                  </motion.div>
                );
              })()}
              
              {currentView === 'target' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">

                  {/* Page Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                      <Target size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Target Career</h3>
                      <p className="text-xs text-slate-500 font-medium">Describe your career goal and we'll build your personalized job search profile.</p>
                    </div>
                  </div>

                  {/* Section 1: AI Prompt textarea */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">1. Your AI Prompt</h4>
                    <p className="text-xs text-slate-500 font-medium mb-4">Describe your career goal, preferred role, location or any other preferences.</p>

                    <div className="relative border-2 border-indigo-200 focus-within:border-indigo-500 rounded-2xl transition-colors overflow-hidden">
                      <textarea
                        value={careerPrompt}
                        onChange={(e) => setCareerPrompt(e.target.value.slice(0, 500))}
                        placeholder="I want to move from Data Scientist to ML Engineer."
                        rows={4}
                        className="w-full px-4 pt-4 pb-10 text-sm text-slate-800 font-medium placeholder:text-slate-400 bg-white resize-none focus:outline-none"
                      />
                      <div className="absolute bottom-3 left-4 text-[10px] text-slate-400 font-semibold">
                        {careerPrompt.length}/500
                      </div>
                      <button
                        onClick={handleExtractIntent}
                        disabled={!careerPrompt.trim() || isExtractingIntent}
                        className="absolute bottom-3 right-3 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center transition-all shadow-sm"
                      >
                        {isExtractingIntent ? (
                          <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : (
                          <Send size={15} className="text-white" />
                        )}
                      </button>
                    </div>

                    {/* Example prompt chips */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">Example prompts:</span>
                      {[
                        'I want ML Engineer jobs in Hyderabad',
                        'I want AI Engineer internships',
                        'Find remote MLOps jobs for 2+ years experience',
                      ].map(ex => (
                        <button
                          key={ex}
                          onClick={() => setCareerPrompt(ex)}
                          className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sections 2 + 3: side-by-side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Section 2: Workflow */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">2. Workflow</h4>
                      <p className="text-xs text-slate-500 font-medium mb-6">See how your prompt is processed.</p>

                      <div className="flex items-start gap-1">
                        {([
                          { icon: MessageSquare, label: 'User Prompt',       desc: 'You enter your goal in natural language.', color: 'bg-indigo-100 text-indigo-600'  },
                          { icon: Brain,         label: 'Intent Extraction', desc: 'AI extracts intent and key details.',      color: 'bg-purple-100 text-purple-600'  },
                          { icon: FileText,      label: 'Profile Building',  desc: 'AI builds your search profile.',          color: 'bg-emerald-100 text-emerald-600' },
                          { icon: Search,        label: 'Search Profile',    desc: 'Ready to find relevant opportunities.',   color: 'bg-orange-100 text-orange-500'  },
                        ] as { icon: React.ElementType; label: string; desc: string; color: string }[]).map((step, i, arr) => (
                          <React.Fragment key={step.label}>
                            <div className="flex flex-col items-center gap-2 flex-1 min-w-0 text-center">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${step.color}`}>
                                <step.icon size={17} />
                              </div>
                              <span className="text-[9px] font-black text-slate-700 leading-tight">{step.label}</span>
                              <span className="text-[8px] text-slate-400 font-medium leading-tight">{step.desc}</span>
                            </div>
                            {i < arr.length - 1 && (
                              <div className="flex items-start pt-3 flex-shrink-0">
                                <ArrowRight size={12} className="text-slate-300" />
                              </div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      <div className="mt-5 flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <ShieldCheck size={10} className="text-indigo-600" />
                        </div>
                        <p className="text-[10px] text-indigo-800 font-semibold leading-snug">
                          <strong>Next Step:</strong> We will use this profile to find real-time jobs for your target career.
                        </p>
                      </div>
                    </div>

                    {/* Section 3: Extracted Features */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-1">3. Extracted Features</h4>
                      <p className="text-xs text-slate-500 font-medium mb-5">AI has identified the following from your prompt.</p>

                      <div className="space-y-0">
                        {([
                          { icon: UserCheck,  label: 'Current Career',    value: 'Data Scientist',                              done: true            },
                          { icon: Target,     label: 'Target Career',     value: intentExtracted ? targetRole      : '—',        done: intentExtracted },
                          { icon: MapPin,     label: 'Location',          value: intentExtracted ? targetLocation  : '—',        done: intentExtracted },
                          { icon: Briefcase,  label: 'Experience Level',  value: intentExtracted ? experienceLevel : '—',        done: intentExtracted },
                          { icon: Clock,      label: 'Job Type',          value: intentExtracted ? 'Full-time Jobs' : '—',       done: intentExtracted },
                          { icon: ArrowRight, label: 'Career Transition', value: intentExtracted ? 'Yes (Switching Career)' : '—', done: intentExtracted },
                        ] as { icon: React.ElementType; label: string; value: string; done: boolean }[]).map((feat) => (
                          <div key={feat.label} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                                <feat.icon size={13} className="text-slate-500" />
                              </div>
                              <span className="text-xs font-bold text-slate-600">{feat.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black ${feat.done ? 'text-slate-900' : 'text-slate-300'}`}>{feat.value}</span>
                              {feat.done && (
                                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                                  <Check size={11} className="text-emerald-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Launch CTA — shown only after intent extracted */}
                  {intentExtracted && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
                    >
                      <div>
                        <p className="text-white font-black text-sm mb-1">Profile Ready — Launch Target Job Search</p>
                        <p className="text-indigo-200 text-xs font-medium">Find real-time {targetRole} jobs via Apify job intelligence.</p>
                      </div>
                      <button
                        onClick={() => setCurrentView('discovery')}
                        className="flex-shrink-0 flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-xl text-xs font-black hover:bg-indigo-50 transition-all shadow-sm"
                      >
                        <Play size={13} /> Find Jobs Now
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* PAGE 15: TARGET CAREER JOB MATCHING */}
              {currentView === 'targetmatch' && (() => {
                const targetBuckets = [
                  { tier: '100%', count: liveDistribution?.['100%'] ?? 5,   desc: 'Perfect match for your current profile',      borderT: 'border-t-emerald-400', border: 'border-emerald-300', textColor: 'text-emerald-600', bg: 'bg-emerald-50', btnBg: 'bg-emerald-600 hover:bg-emerald-700' },
                  { tier: '75%',  count: liveDistribution?.['75%']  ?? 32,  desc: 'Great match with minor skill gaps',            borderT: 'border-t-blue-400',    border: 'border-blue-300',    textColor: 'text-blue-600',    bg: 'bg-blue-50',    btnBg: 'bg-blue-600 hover:bg-blue-700'    },
                  { tier: '50%',  count: liveDistribution?.['50%']  ?? 81,  desc: 'Moderate match with some gaps',               borderT: 'border-t-amber-400',   border: 'border-amber-300',   textColor: 'text-amber-600',   bg: 'bg-amber-50',   btnBg: 'bg-amber-600 hover:bg-amber-700'  },
                  { tier: '20%',  count: liveDistribution?.['20%']  ?? 210, desc: 'Low match, significant improvements needed',  borderT: 'border-t-orange-400',  border: 'border-orange-300',  textColor: 'text-orange-600',  bg: 'bg-orange-50',  btnBg: 'bg-orange-600 hover:bg-orange-700'},
                  { tier: '0%',   count: liveDistribution?.['0%']   ?? 500, desc: 'Not a match currently',                       borderT: 'border-t-red-400',     border: 'border-red-300',     textColor: 'text-red-600',     bg: 'bg-red-50',     btnBg: 'bg-red-600 hover:bg-red-700'     },
                ];

                return (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">

                    {/* ─── Hero: My Target Career ─────────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
                      <div className="grid grid-cols-12 gap-5 items-center">

                        {/* Left: Title */}
                        <div className="col-span-12 md:col-span-5">
                          <h3 className="text-2xl font-black text-slate-900 mb-2">My Target Career</h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            We analyzed your resume and skills to match you with your target career:{' '}
                            <span className="text-indigo-600 font-black">{targetRole}</span>
                          </p>
                        </div>

                        {/* Center: Target Illustration */}
                        <div className="col-span-12 md:col-span-3 flex justify-center">
                          <div className="relative w-32 h-32">
                            {/* Concentric target rings */}
                            <div className="absolute inset-0 rounded-full bg-indigo-50 border border-indigo-100" />
                            <div className="absolute inset-3 rounded-full bg-indigo-100 border border-indigo-200" />
                            <div className="absolute inset-6 rounded-full bg-indigo-200 border border-indigo-300" />
                            {/* Center bullseye */}
                            <div className="absolute inset-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg flex items-center justify-center z-10">
                              <Target size={16} className="text-white" />
                            </div>
                            {/* Floating badges */}
                            <div className="absolute -top-1 right-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm z-20">91%</div>
                            <div className="absolute bottom-1 -left-1 bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm z-20">Ready</div>
                            {/* Mini bar chart */}
                            <div className="absolute -right-5 top-1/2 -translate-y-1/2 flex items-end gap-0.5 z-20">
                              {[9, 14, 7, 18, 12].map((h, i) => (
                                <div key={i} style={{ height: `${h}px`, width: '4px' }} className="bg-indigo-400 rounded-sm opacity-70" />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right: Career Readiness Score */}
                        <div className="col-span-12 md:col-span-4">
                          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                            <div className="flex items-center gap-1 mb-3">
                              <span className="text-xs font-black text-slate-700">Your Career Readiness Score</span>
                              <Info size={11} className="text-slate-400 cursor-help flex-shrink-0" />
                            </div>
                            <div className="flex items-center gap-4">
                              {/* Donut */}
                              <div className="relative w-20 h-20 flex-shrink-0">
                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6366f1" strokeWidth="3.5"
                                    strokeDasharray="82 18" strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-xl font-black text-slate-900">82%</span>
                                  <span className="text-[8px] font-bold text-indigo-600">Ready</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800 mb-1">You are well on your way!</p>
                                <p className="text-[10px] text-slate-500 font-medium mb-3 leading-relaxed">Keep improving the missing areas to reach 90%+</p>
                                <button
                                  onClick={() => setCurrentView('improve')}
                                  className="text-[10px] font-black text-indigo-600 flex items-center gap-1 hover:underline"
                                >
                                  View Readiness Details <ArrowRight size={10} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ─── Detected Target + Alternative Matches ───────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                      {/* Detected Target Career */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Detected Target Career</span>
                          <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">Primary Match</span>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                            <Briefcase size={20} className="text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-900">{targetRole}</p>
                            <p className="text-sm font-black text-emerald-600">91% Confidence</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Best fit based on your skills, experience, projects and certifications.
                        </p>
                      </div>

                      {/* Alternative Career Matches */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Alternative Career Matches</span>
                          <button className="text-[10px] text-indigo-600 font-black hover:underline">View All</button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { pct: 78, label: 'Data Scientist' },
                            { pct: 72, label: 'Data Analyst'   },
                            { pct: 68, label: 'AI Engineer'    },
                            { pct: 65, label: 'Data Engineer'  },
                          ].map(alt => (
                            <div key={alt.label} className="text-center p-3 rounded-xl border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all cursor-pointer">
                              <p className="text-xl font-black text-indigo-600 mb-1">{alt.pct}%</p>
                              <p className="text-[9px] font-bold text-slate-500 leading-tight">{alt.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ─── What Can I Get? Job Buckets ─────────────────── */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <div>
                          <h4 className="text-sm font-black text-slate-900">
                            What Can I Get?{' '}
                            <span className="text-slate-400 font-semibold text-xs">(Jobs Based on Your Match)</span>
                          </h4>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">Real-time job opportunities for {targetRole}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Last updated: Just now
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-3">
                        {targetBuckets.map(bucket => (
                          <div key={bucket.tier} className={`border-t-4 ${bucket.borderT.replace('border-t-', 'border-t-[3px] border-t-')} rounded-2xl p-4 bg-white border border-slate-100 text-center space-y-2.5 hover:shadow-md transition-all group`}>
                            <span className={`text-[10px] font-black uppercase tracking-wide ${bucket.textColor}`}>
                              {bucket.tier} Match
                            </span>
                            <div className={`w-14 h-14 rounded-full ${bucket.bg} flex items-center justify-center mx-auto border-2 ${bucket.border} shadow-sm`}>
                              <span className={`text-xl font-black ${bucket.textColor}`}>{bucket.count}</span>
                            </div>
                            <p className={`text-[10px] font-black ${bucket.textColor}`}>Jobs</p>
                            <p className="text-[9px] text-slate-400 font-medium leading-snug">{bucket.desc}</p>
                            <button
                              onClick={() => setCurrentView('discovery')}
                              className={`w-full flex items-center justify-center gap-1 text-white text-[9px] font-black py-1.5 rounded-xl ${bucket.btnBg} transition-all shadow-sm`}
                            >
                              View {bucket.tier} Jobs <ArrowRight size={9} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })()}

              {/* PAGE 10: IMPROVE RESUME */}
              {currentView === 'improve' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-white border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider font-sans">Improve Resume Bullets</h3>
                    
                    <div className="space-y-5">
                      {bulletImprovements.map((b) => (
                        <div key={b.id} className="p-5 border rounded-2xl space-y-3.5 bg-slate-50/20 relative">
                          <div className="flex justify-between items-center border-b pb-2">
                            <span className="text-[10px] font-black text-indigo-650 uppercase">{b.category} Bullet</span>
                            
                            {/* Action states indicator */}
                            {b.status === 'accepted' && <span className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ Accepted</span>}
                            {b.status === 'rejected' && <span className="text-[9px] font-bold text-red-650 bg-red-50 px-2 py-0.5 rounded-full">✗ Rejected</span>}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Current Bullet</span>
                              <p className="text-slate-600 line-through bg-red-50/20 p-2.5 rounded-xl border border-red-55">{b.before}</p>
                            </div>
                            <div>
                              <span className="block text-[10px] font-bold text-indigo-600 uppercase mb-1">CareerX402 Suggestion</span>
                              <p className="text-indigo-900 bg-indigo-50/20 p-2.5 rounded-xl border border-indigo-55">{b.suggestion}</p>
                            </div>
                          </div>

                          {b.status === 'pending' && (
                            <div className="flex justify-end gap-2 pt-2">
                              <button 
                                onClick={() => {
                                  setBulletImprovements(bulletImprovements.map(x => x.id === b.id ? { ...x, status: 'rejected' } : x));
                                }}
                                className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-55 text-[10px] font-bold rounded-xl"
                              >
                                Reject
                              </button>
                              <button 
                                onClick={() => {
                                  setBulletImprovements(bulletImprovements.map(x => x.id === b.id ? { ...x, status: 'accepted' } : x));
                                }}
                                className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-xl shadow-sm"
                              >
                                Accept Change
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PAGE 11: JOB MATCH */}
              {currentView === 'match' && (() => {
                
                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    
                    {/* Header bar with controls */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Resume ↔ Job Matching Engine</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">We connect your resume with real jobs and calculate how well you match.</p>
                      </div>
                      <div className="flex gap-2.5">
                        <button onClick={() => setCurrentView('discovery')} className="flex items-center gap-1.5 border hover:bg-slate-50 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
                          <ArrowLeft size={13} /> Back to Job Discovery
                        </button>
                        <button className="flex items-center gap-1.5 border hover:bg-slate-50 text-indigo-650 text-xs font-bold px-3 py-1.5 rounded-xl transition-all">
                          <Compass size={13} /> How it works
                        </button>
                      </div>
                    </div>

                    {/* Target Job Header Card */}
                    <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-wrap md:flex-nowrap items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 text-xl font-bold border border-indigo-100">
                          💼
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                            Data Scientist 
                            <CheckCircle2 size={13} className="text-emerald-500" />
                          </h3>
                          <p className="text-xs font-extrabold text-slate-650 mt-0.5">InnovaTech Solutions</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 text-[10px] text-slate-450 font-bold">
                            <span>📍 Bengaluru, India</span>
                            <span>•</span>
                            <span>Hybrid</span>
                            <span>•</span>
                            <span>0-2 Yrs Experience</span>
                            <span>•</span>
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">Full-time</span>
                            <span>•</span>
                            <span>Posted 2 days ago</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 border-l pl-6 min-w-[240px]">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Overall Match Score</span>
                          <span className="text-3xl font-black text-emerald-600 block mt-1">89%</span>
                          <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded-md mt-1.5 inline-block">Great Match! 🎉</span>
                        </div>
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="26" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                            <circle cx="32" cy="32" r="26" stroke="#10b981" strokeWidth="6" fill="transparent" strokeDasharray={163.36} strokeDashoffset={163.36 * (1 - 0.89)} />
                          </svg>
                          <span className="absolute text-xs font-black text-slate-800">89%</span>
                        </div>
                      </div>
                    </div>

                    {/* Nav tabs for matching detail */}
                    <div className="flex border-b overflow-x-auto no-scrollbar gap-1">
                      {[
                        { id: 'overview', label: 'Match Overview' },
                        { id: 'skills', label: 'Skill Match' },
                        { id: 'experience', label: 'Experience Match' },
                        { id: 'projects', label: 'Project Match' },
                        { id: 'education', label: 'Education Match' },
                        { id: 'why', label: 'Why You Match' },
                        { id: 'missing', label: "What's Missing" }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setMatchTab(tab.id as any)}
                          className={`px-4 py-2 border-b-2 font-bold text-xs whitespace-nowrap transition-all ${
                            matchTab === tab.id
                              ? 'border-indigo-600 text-indigo-650'
                              : 'border-transparent text-slate-650 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab contents viewport */}
                    {matchTab === 'overview' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Match Breakdown list */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            Match Breakdown <span className="text-[10px] text-slate-400 font-semibold">(i)</span>
                          </h4>
                          <div className="space-y-3.5">
                            {[
                              { label: 'Skill Match', val: 91, color: 'bg-emerald-500' },
                              { label: 'Experience Match', val: 84, color: 'bg-emerald-500' },
                              { label: 'Project Match', val: 88, color: 'bg-emerald-500' },
                              { label: 'Education Match', val: 100, color: 'bg-emerald-500' },
                              { label: 'Domain Match', val: 82, color: 'bg-indigo-600' }
                            ].map(item => (
                              <div key={item.label} className="space-y-1.5">
                                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                                  <span>{item.label}</span>
                                  <span>{item.val}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Key Highlights */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Key Highlights</h4>
                          <div className="space-y-3">
                            {[
                              'Strong technical skills alignment',
                              'Relevant projects found',
                              'Education matches the requirement',
                              'Some preferred skills are missing'
                            ].map((text, i) => (
                              <div key={i} className="flex items-start gap-2.5 text-[11px] text-slate-650 font-bold">
                                <span className={i === 3 ? 'text-amber-500' : 'text-emerald-500'}>
                                  {i === 3 ? '➖' : '✓'}
                                </span>
                                <span>{text}</span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t pt-4 grid grid-cols-2 gap-4 text-center">
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">Job Experience Required</span>
                              <span className="text-[11px] font-black text-slate-800 block mt-0.5">0 - 2 years</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block font-bold">Your Experience</span>
                              <span className="text-[11px] font-black text-emerald-600 block mt-0.5">1.2 years</span>
                            </div>
                          </div>
                        </div>

                        {/* Match Distribution */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Match Distribution (All Jobs)</h4>
                          <div className="flex items-center justify-between gap-4">
                            {/* Distribution Donut Placeholder */}
                            <div className="w-20 h-20 bg-indigo-50/50 rounded-full flex items-center justify-center border border-indigo-100 border-dashed">
                              🍩
                            </div>
                            <div className="space-y-1.5 flex-1 text-[10px] font-bold text-slate-650">
                              {[
                                { label: '100% Match', count: 12, dot: 'bg-emerald-500' },
                                { label: '75% Match', count: 48, dot: 'bg-emerald-500' },
                                { label: '50% Match', count: 137, dot: 'bg-amber-500' },
                                { label: '20% Match', count: 412, dot: 'bg-orange-500' },
                                { label: '0% Match', count: 1240, dot: 'bg-red-500' }
                              ].map(row => (
                                <div key={row.label} className="flex justify-between items-center">
                                  <span className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${row.dot}`} />
                                    {row.label}
                                  </span>
                                  <span className="text-slate-700">{row.count} Jobs</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button className="w-full mt-2 border hover:bg-slate-50 text-indigo-650 text-xs font-black py-2 rounded-xl transition-all">
                            View All Matched Jobs →
                          </button>
                        </div>

                        {/* Why You Match */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                            Why You Match
                            <span className="text-[9px] bg-emerald-50 text-emerald-650 px-2 py-0.5 rounded border border-emerald-100 font-black">Top Matching Factors</span>
                          </h4>
                          <div className="space-y-3">
                            {[
                              { label: 'Python', strength: 'Strong Match' },
                              { label: 'SQL', strength: 'Strong Match' },
                              { label: 'Machine Learning', strength: 'Strong Match' },
                              { label: 'Pandas', strength: 'Strong Match' },
                              { label: 'Data Analysis', strength: 'Strong Match' },
                              { label: 'Relevant End-to-End Project', strength: 'Strong Match' }
                            ].map(row => (
                              <div key={row.label} className="flex justify-between items-center text-[11px] font-bold">
                                <span className="flex items-center gap-2 text-slate-700">
                                  <span className="text-emerald-500">✓</span>
                                  {row.label}
                                </span>
                                <span className="text-emerald-600 text-[10px]">{row.strength}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* What's Missing */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                            What's Missing / Improve
                            <span className="text-[9px] bg-amber-50 text-amber-650 px-2 py-0.5 rounded border border-amber-100 font-black">Focus Areas</span>
                          </h4>
                          <div className="space-y-3">
                            {[
                              { label: 'Docker', strength: 'Not Found' },
                              { label: 'AWS', strength: 'Not Found' },
                              { label: 'MLOps', strength: 'Not Found' },
                              { label: 'Kubernetes', strength: 'Not Found' },
                              { label: 'Deep Learning', strength: 'Basic Level' }
                            ].map(row => (
                              <div key={row.label} className="flex justify-between items-center text-[11px] font-bold">
                                <span className="flex items-center gap-2 text-slate-700">
                                  <span className="text-amber-550">➖</span>
                                  {row.label}
                                </span>
                                <span className={row.strength === 'Not Found' ? 'text-red-500 text-[10px]' : 'text-amber-600 text-[10px]'}>{row.strength}</span>
                              </div>
                            ))}
                          </div>
                          <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-3.5 space-y-2 mt-4">
                            <span className="text-[9px] text-indigo-700 font-black block">💡 Improve these skills to increase your match score to 95%+</span>
                            <button onClick={() => setCurrentView('improve')} className="w-full text-indigo-650 bg-white border border-indigo-150 hover:bg-indigo-50/50 text-[10px] font-black py-1.5 rounded-lg shadow-sm transition-all">
                              Get Improvement Plan →
                            </button>
                          </div>
                        </div>

                      </div>
                    )}

                    {matchTab !== 'overview' && (
                      <div className="bg-white border rounded-2xl p-6 shadow-sm min-h-[220px] flex flex-col items-center justify-center text-center">
                        <span className="text-3xl mb-2">🔍</span>
                        <h4 className="text-xs font-black text-slate-800">Detail tab content active</h4>
                        <p className="text-[10px] text-slate-500 max-w-xs mt-1">Specific metrics and explanations under analysis for "{matchTab}". Adjust resume keywords to sync highlights.</p>
                      </div>
                    )}

                    {/* Next Steps Buttons */}
                    <div className="bg-white border rounded-3xl p-5 shadow-sm space-y-4">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Next Steps</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        
                        <button onClick={() => setCurrentView('improve')} className="flex items-center justify-between border rounded-2xl p-4 hover:shadow-sm hover:border-indigo-150 transition-all text-left bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">📝</span>
                            <div>
                              <span className="text-[10px] font-black text-slate-800 block">Improve Resume</span>
                              <span className="text-[9px] text-slate-455 font-bold block mt-0.5">Get AI suggestions to tailor resume</span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>

                        <button onClick={() => setCurrentView('projects')} className="flex items-center justify-between border rounded-2xl p-4 hover:shadow-sm hover:border-indigo-150 transition-all text-left bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">📂</span>
                            <div>
                              <span className="text-[10px] font-black text-slate-800 block">Recommended Projects</span>
                              <span className="text-[9px] text-slate-450 font-bold block mt-0.5">Build projects to fill the gaps</span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>

                        <button onClick={() => setCurrentView('rematch' as any)} className="flex items-center justify-between border rounded-2xl p-4 hover:shadow-sm hover:border-indigo-150 transition-all text-left bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🔄</span>
                            <div>
                              <span className="text-[10px] font-black text-slate-800 block">Re-match After Improvement</span>
                              <span className="text-[9px] text-slate-455 font-bold block mt-0.5">Improve profile and get updated matches</span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>

                      </div>
                    </div>

                  </motion.div>
                );
              })()}

              {/* PAGE: IMPROVE RESUME (Phase 23 Resume Improvement AI) */}
              {currentView === 'improve' && (() => {
                const suggestions = liveSuggestions.length > 0 ? liveSuggestions.map((s, idx) => ({
                  id: idx,
                  title: `${idx + 1}. ${s.title || 'Resume Adjustment'}`,
                  impact: s.impact || 'High Impact',
                  color: s.impact === 'Medium Impact' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100',
                  before: s.before,
                  after: s.after,
                  badges: s.badges || ['Added Impact', 'Quantified', 'Tools Added']
                })) : [
                  {
                    id: 0,
                    title: '1. Customer Churn Prediction Model',
                    impact: 'High Impact',
                    color: 'bg-red-50 text-red-600 border-red-100',
                    before: 'Built a machine learning model for predicting customer churn.',
                    after: 'Developed a customer churn prediction pipeline using Python and Scikit-learn, achieving 89% validation accuracy across 10,000+ customer records.',
                    badges: ['Added Impact', 'Quantified', 'Tools Added', 'Outcome Added']
                  },
                  {
                    id: 1,
                    title: '2. Recommendation System',
                    impact: 'Medium Impact',
                    color: 'bg-amber-50 text-amber-600 border-amber-100',
                    before: 'Built a recommendation system for product suggestions.',
                    after: 'Developed a content-based recommendation system using Python and cosine similarity, increasing user engagement by 27%.',
                    badges: ['Added Impact', 'Quantified', 'Tools Added', 'Outcome Added']
                  },
                  {
                    id: 2,
                    title: '3. Data Analysis Dashboard',
                    impact: 'Low Impact',
                    color: 'bg-slate-50 text-slate-500 border-slate-200',
                    before: 'Created a dashboard for data visualization.',
                    after: 'Designed an interactive dashboard using Power BI to visualize key metrics, helping stakeholders reduce reporting time by 40%.',
                    badges: ['Added Impact', 'Quantified', 'Tools Added', 'Outcome Added']
                  }
                ];

                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-4 border-slate-200">
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Resume Improvement AI <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 border px-1.5 py-0.5 rounded-md ml-1.5">Phase 23</span></h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">Improve your resume using AI suggestions tailored to the selected job.</p>
                      </div>
                      {/* Job details card badge */}
                      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-sm text-white font-black">𝕏</div>
                        <div>
                          <p className="text-xs font-black text-slate-800">ML Engineer</p>
                          <p className="text-[9px] text-slate-400 font-bold block">Company X • Good Match (82%)</p>
                        </div>
                      </div>
                    </div>

                    {/* Main Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left side: Instructions + Suggestions list */}
                      <div className="lg:col-span-2 space-y-5">
                        
                        {/* Section 1: Instructions */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-650 text-white flex items-center justify-center text-[10px] font-black">1</span>
                            Provide Improvement Instruction
                          </h3>
                          <p className="text-[10px] text-slate-400 font-semibold">Tell AI what you want to improve in your resume.</p>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 relative">
                              <textarea
                                value={improvePrompt}
                                onChange={(e) => setImprovePrompt(e.target.value.slice(0, 200))}
                                className="w-full text-xs font-semibold text-slate-800 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-indigo-500 h-24 resize-none bg-slate-50/30"
                              />
                              <span className="absolute bottom-2 right-3 text-[9px] text-slate-400 font-semibold">{improvePrompt.length}/200</span>
                            </div>
                            
                            {/* Quick suggestions */}
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Quick Suggestions</span>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  'Improve project descriptions',
                                  'Add quantifiable achievements',
                                  'Strengthen skills section',
                                  'Improve summary',
                                  'Fix grammar & clarity'
                                ].map((item, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => setImprovePrompt(item)}
                                    className="text-[9.5px] font-bold text-slate-655 border border-slate-200 rounded-lg px-2 py-1 bg-white hover:bg-slate-50 transition-colors"
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button className="flex items-center gap-1 bg-indigo-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow hover:bg-indigo-700 transition-colors">
                              <Sparkles size={13} /> Generate Suggestions
                            </button>
                          </div>
                        </div>

                        {/* Section 2: AI Suggestions */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-650 text-white flex items-center justify-center text-[10px] font-black">2</span>
                              AI Suggestions <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded ml-1">3 suggestions found</span>
                            </h3>
                            <div className="flex gap-1.5">
                              <button className="text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg px-2.5 py-1">Comparison View</button>
                              <button className="text-[10px] font-bold text-slate-500 border border-slate-200 rounded-lg px-2.5 py-1 hover:bg-slate-50">Preview Resume</button>
                            </div>
                          </div>

                          <div className="space-y-4 pt-1">
                            {suggestions.map((item) => {
                              const isAccepted = suggestionStatuses[item.id] === 'accepted';
                              const isRejected = suggestionStatuses[item.id] === 'rejected';
                              const isEditing = editingIndex === item.id;

                              return (
                                <div key={item.id} className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50/20">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-slate-800">{item.title}</span>
                                    <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded border ${item.color}`}>{item.impact}</span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Before */}
                                    <div className="bg-red-50/25 border border-red-100 rounded-xl p-3 space-y-1">
                                      <span className="text-[9px] font-black text-red-500 uppercase tracking-wider">Before</span>
                                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.before}</p>
                                    </div>

                                    {/* After / Editor */}
                                    <div className="bg-emerald-50/25 border border-emerald-100 rounded-xl p-3 space-y-1 relative">
                                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider block">After — AI Suggestion</span>
                                      {isEditing ? (
                                        <textarea
                                          value={editedText}
                                          onChange={(e) => setEditedText(e.target.value)}
                                          className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:border-indigo-500 h-16 resize-none"
                                        />
                                      ) : (
                                        <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                                          {suggestionStatuses[item.id] === 'accepted' && editedText && editingIndex === null ? editedText : item.after}
                                        </p>
                                      )}
                                      
                                      {/* Tags */}
                                      <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-emerald-100/50">
                                        {item.badges.map((b: string) => (
                                          <span key={b} className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{b}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex justify-end items-center gap-2 pt-1">
                                    {isEditing ? (
                                      <>
                                        <button
                                          onClick={() => setEditingIndex(null)}
                                          className="text-[10px] font-bold text-slate-500 hover:underline px-2"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingIndex(null);
                                            setSuggestionStatuses(prev => ({ ...prev, [item.id]: 'accepted' }));
                                          }}
                                          className="text-[10px] font-black bg-indigo-650 text-white rounded-lg px-3 py-1 hover:bg-indigo-700"
                                        >
                                          Save Change
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => setSuggestionStatuses(prev => ({ ...prev, [item.id]: 'accepted' }))}
                                          className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-lg border transition-all ${
                                            isAccepted
                                              ? 'bg-emerald-600 text-white border-emerald-600'
                                              : 'bg-white text-slate-655 border-slate-200 hover:bg-slate-55'
                                          }`}
                                        >
                                          ✓ Accept
                                        </button>
                                        <button
                                          onClick={() => setSuggestionStatuses(prev => ({ ...prev, [item.id]: 'rejected' }))}
                                          className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-lg border transition-all ${
                                            isRejected
                                              ? 'bg-red-600 text-white border-red-600'
                                              : 'bg-white text-slate-655 border-slate-200 hover:bg-slate-55'
                                          }`}
                                        >
                                          ✕ Reject
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingIndex(item.id);
                                            setEditedText(item.after);
                                          }}
                                          className="flex items-center gap-1 text-[10px] font-black bg-white text-indigo-650 border border-indigo-200 px-3 py-1 rounded-lg hover:bg-indigo-50"
                                        >
                                          ✎ Edit
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Improvement summary */}
                      <div className="space-y-6">
                        
                        {/* Match score evolution panel */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Improvement Summary</h4>
                          <div className="flex items-center justify-around py-2">
                            <div className="text-center space-y-2">
                              <span className="text-[10px] font-black text-slate-400 block">Current Match</span>
                              <div className="relative w-16 h-16 mx-auto">
                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="82 18" strokeLinecap="round" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-850">82%</span>
                              </div>
                            </div>
                            
                            <span className="text-lg text-slate-400 font-black">→</span>

                            <div className="text-center space-y-2">
                              <span className="text-[10px] font-black text-slate-400 block">Potential Match</span>
                              <div className="relative w-16 h-16 mx-auto animate-pulse">
                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="87 13" strokeLinecap="round" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-850">87%</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-[9.5px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-center font-bold">+5% Improvement potential</p>
                          <button
                            onClick={() => improvePaid ? setCurrentView('versions') : setImprovePaymentStep('paywall')}
                            className="w-full bg-indigo-600 text-white text-xs font-black py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                          >
                            Apply Selected Changes
                          </button>
                          <p className="text-[9px] text-slate-400 font-semibold text-center">✓ 3 changes selected</p>
                        </div>

                        {/* Why these changes */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Why these changes?</h4>
                          {[
                            'Added specific tools and technologies matching the job requirements.',
                            'Included quantifiable results and impact to demonstrate your value.',
                            'Strengthened descriptions to showcase your role and outcomes better.'
                          ].map((item, idx) => (
                            <div key={idx} className="flex gap-2 items-start text-[10px] font-bold text-slate-700">
                              <span className="text-emerald-500 font-black">✓</span>
                              <p className="leading-tight">{item}</p>
                            </div>
                          ))}
                        </div>

                        {/* Top skills missing */}
                        <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-3">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Top Job Skills You're Missing</h4>
                          {[
                            { name: 'Docker', prio: 'High' },
                            { name: 'AWS', prio: 'High' },
                            { name: 'MLOps', prio: 'High' }
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-1 text-xs font-bold text-slate-700">
                              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {item.name}</span>
                              <span className="text-[9px] text-red-650 font-extrabold uppercase">{item.prio}</span>
                            </div>
                          ))}
                          <button onClick={() => setCurrentView('jobintel')} className="text-[9.5px] font-extrabold text-indigo-650 hover:underline block pt-2">View Full Skill Gap Analysis →</button>
                        </div>
                      </div>
                    </div>

                    {/* Disclaimer Footer */}
                    <div className="bg-slate-50 border rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-400">ℹ️</span>
                        <p className="text-[10px] text-slate-550 font-semibold leading-relaxed">
                          All suggestions are AI-generated based on the job description, your resume and market insights. You have full control — Accept, Reject or Edit each change.
                        </p>
                      </div>
                      <button onClick={() => improvePaid ? setCurrentView('versions') : setImprovePaymentStep('paywall')} className="text-xs font-black text-indigo-650 border border-indigo-200 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 whitespace-nowrap">
                        Preview Full Resume
                      </button>
                    </div>
                  </motion.div>
                );
              })()}

              {/* PAGE 12: ACTION PLAN */}
              {currentView === 'action' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {!careerActionPlanPaid ? (
                    <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6 my-6">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl mx-auto animate-bounce">
                        📅
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900">Career Action Plan</h2>
                        <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                          Generate a personalized 30-day timeline roadmap to smoothly transition into your target career of <strong>{targetRole || 'ML Engineer'}</strong>.
                        </p>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-3">
                        <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                          <span className="text-indigo-650">✓</span> Week-by-Week Focus & Day-by-Day Tasks
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                          <span className="text-indigo-650">✓</span> Hand-Picked High-Impact Learning Resources
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                          <span className="text-indigo-650">✓</span> Dynamic AI Interview Mock Prep Questions
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-1 pt-2">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">Price</span>
                        <span className="text-3xl font-black text-indigo-650">$0.10 USDC</span>
                      </div>

                      <button
                        onClick={async () => {
                          if (!activeAddress) {
                            alert("Please connect your wallet first via the Manage Wallet tab.");
                            return;
                          }
                          setCareerActionPlanPaymentStep('402');
                          try {
                            const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
                            setCareerActionPlanPaymentStep('wallet');
                            const response = await x402Fetch(`/api/x402/career-action-plan`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                resumeId,
                                targetCareer: targetRole || "Machine Learning Engineer"
                              })
                            });
                            setCareerActionPlanPaymentStep('verifying');
                            const resData = await response.json();
                            if (resData.success && resData.data) {
                              setCareerActionPlan(resData.data);
                            }
                            setCareerActionPlanPaid(true);
                            setCareerActionPlanPaymentStep('complete');
                            setTimeout(() => {
                              setCareerActionPlanPaymentStep(null);
                            }, 1200);
                          } catch (err: any) {
                            console.error('[x402] Career action plan failed:', err);
                            alert(`Micropayment transaction failed: ${err.message || err}`);
                            setCareerActionPlanPaymentStep(null);
                          }
                        }}
                        className="w-full max-w-sm mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm py-3.5 rounded-2xl shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
                      >
                        Generate 30-Day Plan
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="flex justify-between items-center border-b pb-4">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <span>📅 30-Day Career Transition Roadmap</span>
                            <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Unlocked</span>
                          </h3>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                            Target: {careerActionPlan?.targetCareer || targetRole || 'Machine Learning Engineer'}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-655 font-bold leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-4">
                        {careerActionPlan?.overview || 'Transition plan generated.'}
                      </p>

                      <div className="space-y-6">
                        {careerActionPlan?.weeks?.map((week: any, wIdx: number) => (
                          <div key={wIdx} className="border rounded-2xl p-5 border-slate-200/80 space-y-3.5">
                            <span className="text-xs font-black text-indigo-755 uppercase tracking-wider block">Week {week.weekNumber}: {week.focus}</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {week.days?.map((d: any, dIdx: number) => (
                                <div key={dIdx} className="flex gap-2.5 items-start p-3 border border-slate-100 rounded-xl bg-slate-50/20 text-[10px] font-bold text-slate-700">
                                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black flex-shrink-0">
                                    {d.day}
                                  </span>
                                  <p className="leading-relaxed font-semibold text-slate-655">{d.task}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Learning resources & interview tips */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recommended Learning Resources</h4>
                          <div className="space-y-2">
                            {careerActionPlan?.learningResources?.map((res: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-slate-655 bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-3">
                                <span>📚</span>
                                <span>{res}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Mock Interview Prep Tips</h4>
                          <div className="space-y-2">
                            {careerActionPlan?.interviewPrep?.map((tip: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-slate-655 bg-emerald-50/30 border border-emerald-100/50 rounded-xl p-3">
                                <span>💡</span>
                                <span>{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* PAGE 13: VERSIONS */}
              {currentView === 'versions' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-white border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider font-sans">Resume Versions</h3>
                    
                    <div className="space-y-3">
                      {resumeVersions.map((ver, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-slate-400" />
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">{ver.name}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">Analyzed on {ver.date}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {ver.current && <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-1 rounded-lg mr-2 flex items-center">Active</span>}
                            <button className="text-xs text-indigo-650 hover:underline font-bold">Manage</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PAGE 14: PROGRESS */}
              {currentView === 'progress' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="bg-white border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-wider font-sans">Resume Progress</h3>
                    
                    <div className="grid grid-cols-3 gap-4 text-center mb-6">
                      <div className="border rounded-xl p-3 bg-slate-50">
                        <span className="text-[9px] text-slate-450 block font-bold">Readiness Evolution</span>
                        <span className="text-lg font-black text-indigo-600 block mt-1">74 → 81</span>
                      </div>
                      <div className="border rounded-xl p-3 bg-slate-50">
                        <span className="text-[9px] text-slate-450 block font-bold">Skills Support</span>
                        <span className="text-lg font-black text-purple-600 block mt-1">68 → 79</span>
                      </div>
                      <div className="border rounded-xl p-3 bg-slate-50">
                        <span className="text-[9px] text-slate-455 block font-bold">Market Fit Score</span>
                        <span className="text-lg font-black text-emerald-600 block mt-1">61 → 73</span>
                      </div>
                    </div>

                    <div className="border-l-2 border-slate-200 pl-4 space-y-4 text-xs font-bold text-slate-700">
                      <span className="text-[10px] text-slate-405 uppercase tracking-widest block mb-1">Resume Updates Milestones</span>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Aug 19, 2026</span>
                        <p className="text-slate-800 font-semibold mt-0.5">Resume version 4 submitted for parsing</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Aug 15, 2026</span>
                        <p className="text-slate-800 font-semibold mt-0.5">Completed Docker and API containerization task</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">Aug 10, 2026</span>
                        <p className="text-slate-800 font-semibold mt-0.5">Linked GitHub model repos to project list</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PAGE 15: PAYMENT CENTER (Phase 29 — x402 Payment Center) */}
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
                                { serviceId: 'job_analysis', name: 'Job-Specific Analysis', description: 'Deep analysis of your resume against a specific job', priceUsd: 0.02, endpoint: '/api/resume/jobs/:jobId/analyze', status: 'Active' },
                                { serviceId: 'resume_improvement', name: 'Resume Improvement', description: 'AI-powered resume improvement with before/after suggestions', priceUsd: 0.05, endpoint: '/api/resume/:resumeId/improvements/apply', status: 'Active' },
                                { serviceId: 'project_generation', name: 'Project Generation', description: 'Generate complete project plan with architecture, tasks & more', priceUsd: 0.03, endpoint: '/api/resume/:resumeId/projects/generate', status: 'Active' }
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
                          ${x402Services.find(s => s.serviceId === 'job_analysis')?.priceUsd || '0.02'} USDC
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
                            await x402Fetch(`/api/resume/jobs/${payingJobIdx}/analyze`, {
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
                  <p className="text-[10px] text-slate-500 font-semibold">Please sign the $0.10 USDC transaction in your Algorand wallet popup.</p>
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
                    ${x402Services.find(s => s.serviceId === 'custom_search')?.priceUsd || '0.02'} USDC
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
                      const intentRes = await fetch(`/api/resume/${resumeId}/intent`, {
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
                  <p className="text-[10px] text-slate-500 font-semibold">Preparing $0.02 USDC custom transition search micropayment challenge...</p>
                </div>
              )}
              {customSearchPaymentStep === 'wallet' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-bounce">🔑</div>
                  <h4 className="text-sm font-black text-slate-900">Sign Transaction</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Please sign the $0.02 USDC search query settlement transfer in your wallet.</p>
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
