import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@txnlab/use-wallet-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Code2,
  ExternalLink,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  Upload,
  Target,
  Plus,
  X,
  Edit3,
  Check,
  Play,
  TrendingUp,
  AlertTriangle,
  Award,
  Terminal,
  Brain,
  ChevronRight,
  Layers,
  Clock,
  Briefcase,
  Lock,
  Building2,
  CheckCircle,
  Globe,
  Database,
  Zap,
  BookMarked,
  BarChart2,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { submitCodeReview, CodeReviewResult } from '../services/codeReviewService';
import { createX402Fetch } from '../utils/x402';
import { API_BASE_URL } from '../config/api';

export interface Module {
  id?: string;
  title: string;
  duration: string;
  difficulty: string;
  summary: string;
  keyConcepts: string[];
  personalizedTips: string[];
  completed?: boolean;
}

export interface Chapter {
  id?: string;
  title: string;
  modules: Module[];
}

export interface LearningPath {
  chapters: Chapter[];
  project?: { title: string; description: string; deliverables: string[] };
}

export interface Milestone {
  title: string;
  actionType: string;
  score?: number;
  timestamp: string;
}

export interface CareerMissionData {
  _id?: string;
  targetRole: string;
  targetCompany?: string;
  experienceLevel: string;
  daysUntilInterview: number;
  resumeSkills: string[];
  jdSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  learningPath: LearningPath;
  progress: number;
  milestones: Milestone[];
}

export interface ExtractionResult {
  targetRole: string;
  targetCompany: string;
  resumeSkills: string[];
  jdSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
}

export interface PracticeQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  hints?: string[];
  sampleAnswer?: string;
}

export interface PracticeResult {
  moduleTitle: string;
  questions: PracticeQuestion[];
}

export interface EvaluationResult {
  score: number;
  strengths: string[];
  missingKeywords: string[];
  constructiveFeedback: string;
  idealAnswer: string;
}

export interface InterviewQuestionItem {
  id: string;
  question: string;
  questionType: string;
  difficulty: string;
  expectedSkills: string[];
  userAnswer?: string;
  evaluation?: EvaluationResult;
  score?: number;
}

export interface InterviewRoundItem {
  id: string;
  roundType: string;
  title: string;
  description: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  score?: number;
  questions: InterviewQuestionItem[];
}

export interface ReadinessScore {
  technical: number;
  coding: number;
  communication: number;
  behavioral: number;
  overall: number;
  feedback: string;
  recommendedAction?: string;
}

export interface InterviewMissionData {
  _id?: string;
  careerMissionId: string;
  companyName: string;
  companySource: 'jd' | 'user' | 'role_only';
  jobTitle: string;
  experienceLevel: string;
  status: 'locked' | 'in_progress' | 'completed';
  rounds: InterviewRoundItem[];
  currentRoundIndex: number;
  currentQuestionIndex: number;
  readinessScore?: ReadinessScore;
}

export interface CompanyResource {
  title: string;
  type: string;
  description: string;
  url: string;
  estimatedTime: string;
}

export interface UseCase {
  title: string;
  company: string;
  problem: string;
  solution: string;
  skills: string[];
  impact: string;
}

export interface CaseStudy {
  title: string;
  scenario: string;
  challenge: string;
  approach: string;
  outcome: string;
  interviewAngle: string;
  skills: string[];
}

export interface CompanyInsights {
  overview: string;
  techStack: string[];
  interviewStyle: string;
  hiringFocus: string[];
}

export interface CompanyResourcesData {
  companyInsights: CompanyInsights;
  officialResources: CompanyResource[];
  realWorldUseCases: UseCase[];
  caseStudies: CaseStudy[];
  practiceTopics: string[];
}

type Step = 'upload' | 'review' | 'dashboard';
type MainTab = 'curriculum' | 'interview_mission';
type CurriculumSubTab = 'modules' | 'resources';
type ResourcesSubTab = 'insights' | 'resources' | 'usecases' | 'casestudies';
type ActiveActionType = 'practice' | 'evaluate' | 'interview_start_round' | 'interview_submit_answer' | 'interview_start_mock' | 'company_resources' | 'generate_resources' | null;

export default function InterviewPrep() {
  const navigate = useNavigate();
  const { activeAddress, signTransactions } = useWallet();

  const [step, setStep] = useState<Step>('upload');
  const [activeTab, setActiveTab] = useState<MainTab>('curriculum');
  const [curriculumSubTab, setCurriculumSubTab] = useState<CurriculumSubTab>('modules');
  const [resourcesSubTab, setResourcesSubTab] = useState<ResourcesSubTab>('insights');

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('text');
  const [level, setLevel] = useState('Beginner');
  const [days, setDays] = useState(7);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [editedRole, setEditedRole] = useState('');
  const [editedCompany, setEditedCompany] = useState('');
  const [companySourceMode, setCompanySourceMode] = useState<'jd' | 'user' | 'role_only'>('role_only');
  const [editableMissingSkills, setEditableMissingSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const [mission, setMission] = useState<CareerMissionData | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [interviewMission, setInterviewMission] = useState<InterviewMissionData | null>(null);
  const [currentAnswerInput, setCurrentAnswerInput] = useState('');

  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);
  const [selectedPracticeIndex, setSelectedPracticeIndex] = useState(0);
  const [userPracticeAnswer, setUserPracticeAnswer] = useState('');
  const [practiceEvaluation, setPracticeEvaluation] = useState<EvaluationResult | null>(null);

  const [companyResources, setCompanyResources] = useState<CompanyResourcesData | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set([0]));
  const [resourcesExpanded, setResourcesExpanded] = useState(true);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [sidebarNavMode, setSidebarNavMode] = useState<'modules' | 'resources' | 'interview_mission'>('modules');
  const [interviewSubTab, setInterviewSubTab] = useState<'dashboard' | 'company_prep' | 'ai_mock' | 'evaluation'>('dashboard');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showLockedAlertModal, setShowLockedAlertModal] = useState(false);
  const [codingCodeInput, setCodingCodeInput] = useState('#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your optimal solution here\n    return 0;\n}');
  const [codingLanguage, setCodingLanguage] = useState('cpp');
  const [codeReviewLoading, setCodeReviewLoading] = useState(false);
  const [codeReviewResult, setCodeReviewResult] = useState<CodeReviewResult | null>(null);
  const [selectedInterviewType, setSelectedInterviewType] = useState<'Technical' | 'Coding' | 'HR'>('Technical');

  const [activeAction, setActiveAction] = useState<ActiveActionType>(null);
  const [paymentStep, setPaymentStep] = useState<'paywall' | '402' | 'wallet' | 'verifying' | 'complete' | null>(null);
  const [actionPrice, setActionPrice] = useState('0.005');
  const [actionTitle, setActionTitle] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/interview-prep/mission`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setMission(d.data);
          const firstMod = d.data.learningPath?.chapters?.[0]?.modules?.[0];
          if (firstMod) setSelectedModule(firstMod);
          // Do not auto-skip to dashboard, let user see upload page
          fetchInterviewMission(d.data._id);
        }
      })
      .catch(() => { });
  }, []);

  const fetchInterviewMission = (careerMissionId: string) => {
    fetch(`${API_BASE_URL}/interview/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ careerMissionId }),
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setInterviewMission(d.data); })
      .catch(() => { });
  };

  const handleAnalyze = async () => {
    if (!resumeFile) { setError('Please upload a resume file.'); return; }
    if (inputMode === 'file' && !jdFile) { setError('Please upload a JD file.'); return; }
    if (inputMode === 'text' && !jdText.trim()) { setError('Please paste the JD text.'); return; }
    setAnalyzing(true); setError('');
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      if (inputMode === 'file' && jdFile) formData.append('jobDescription', jdFile);
      else formData.append('jobDescriptionText', jdText);
      const res = await fetch(`${API_BASE_URL}/interview-prep/analyze`, { method: 'POST', body: formData, credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Analysis failed');
      const ext: ExtractionResult = data.data;
      setExtraction(ext);
      setEditedRole(ext.targetRole || 'Software Engineer');
      const co = ext.targetCompany?.trim() || '';
      setEditedCompany(co);
      setCompanySourceMode(co ? 'jd' : 'role_only');
      setEditableMissingSkills(ext.missingSkills || []);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Analysis failed.');
    } finally { setAnalyzing(false); }
  };

  const handleGenerateMission = async () => {
    if (!editedRole.trim()) { setError('Target role is required.'); return; }
    setGeneratingPlan(true); setError('');
    try {
      const payload = {
        targetRole: editedRole,
        targetCompany: companySourceMode === 'role_only' ? '' : editedCompany,
        experienceLevel: level, daysUntilInterview: days,
        resumeSkills: extraction?.resumeSkills || [],
        jdSkills: extraction?.jdSkills || [],
        matchedSkills: extraction?.matchedSkills || [],
        missingSkills: editableMissingSkills,
      };
      const res = await fetch(`${API_BASE_URL}/interview-prep/mission`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to create mission');
      setMission(data.data);
      const firstMod = data.data.learningPath?.chapters?.[0]?.modules?.[0];
      if (firstMod) setSelectedModule(firstMod);
      if (data.data._id) fetchInterviewMission(data.data._id);
      setStep('dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to generate plan.');
    } finally { setGeneratingPlan(false); }
  };

  const handleRemoveSkill = (s: string) => setEditableMissingSkills((p) => p.filter((x) => x !== s));
  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    if (!editableMissingSkills.includes(newSkillInput.trim()))
      setEditableMissingSkills((p) => [...p, newSkillInput.trim()]);
    setNewSkillInput(''); setIsAddingSkill(false);
  };

  const triggerAction = (type: ActiveActionType, price: string, title: string) => {
    if (!activeAddress) { alert('Please connect your Algorand wallet first.'); return; }
    setActiveAction(type); setActionPrice(price); setActionTitle(title); setPaymentStep('paywall');
  };

  const executePaidAction = async () => {
    if (!activeAddress) return;
    setPaymentStep('402');
    try {
      const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
      setPaymentStep('wallet');
      let endpoint = ''; let bodyData: any = {};
      if (activeAction === 'practice') {
        endpoint = '/api/v1/interview-prep/practice';
        bodyData = { missionId: mission?._id, moduleTitle: selectedModule?.title || 'Core Problem Solving', missingSkills: mission?.missingSkills || [], targetRole: mission?.targetRole };
      } else if (activeAction === 'evaluate') {
        endpoint = '/api/v1/interview-prep/evaluate-answer';
        const currentQ = practiceResult?.questions?.[selectedPracticeIndex]?.question || 'Technical Problem';
        bodyData = { missionId: mission?._id, question: currentQ, userAnswer: userPracticeAnswer, targetRole: mission?.targetRole };
      } else if (activeAction === 'company_resources') {
        endpoint = '/api/v1/interview-prep/company-resources';
        bodyData = { missionId: mission?._id, targetRole: mission?.targetRole, targetCompany: mission?.targetCompany || '', missingSkills: mission?.missingSkills || [], experienceLevel: mission?.experienceLevel };
      } else if (activeAction === 'interview_start_round') {
        endpoint = '/api/v1/interview/start-round';
        bodyData = { missionId: interviewMission?._id, roundIndex: interviewMission?.currentRoundIndex || 0 };
      } else if (activeAction === 'interview_submit_answer') {
        endpoint = '/api/v1/interview/submit-answer';
        bodyData = { missionId: interviewMission?._id, roundIndex: interviewMission?.currentRoundIndex || 0, questionIndex: interviewMission?.currentQuestionIndex || 0, userAnswer: currentAnswerInput };
      } else if (activeAction === 'interview_start_mock') {
        endpoint = '/api/v1/interview/start-mock';
        bodyData = { missionId: interviewMission?._id };
      }
      const res = await x402Fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyData) });
      setPaymentStep('verifying');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Action failed');
      if (activeAction === 'practice') { setPracticeResult(data.data.practiceData); setSelectedPracticeIndex(0); setUserPracticeAnswer(''); setPracticeEvaluation(null); }
      else if (activeAction === 'evaluate') { setPracticeEvaluation(data.data.evaluation); }
      else if (activeAction === 'company_resources') { setCompanyResources(data.data.resources); setCurriculumSubTab('resources'); setResourcesSubTab('insights'); }
      else if (['interview_submit_answer', 'interview_start_round', 'interview_start_mock'].includes(activeAction || '')) {
        if (data.data.mission) setInterviewMission(data.data.mission); else if (data.data) setInterviewMission(data.data);
        setCurrentAnswerInput('');
      }
      const freshRes = await fetch(`${API_BASE_URL}/interview-prep/mission`, { credentials: 'include' });
      const freshData = await freshRes.json();
      if (freshData.success && freshData.data) setMission(freshData.data);
      setPaymentStep('complete');
      setTimeout(() => setPaymentStep(null), 1000);
    } catch (err: any) {
      console.error('[x402 Action Error]', err);
      alert(`Action failed: ${err.message || err}`);
      setPaymentStep(null);
    }
  };

  // ── STEP 1: UPLOAD ──
  if (step === 'upload') {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4">
        <div className="mx-auto max-w-4xl">
          <button onClick={() => navigate('/dashboard/learner')} className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-8 text-white">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-white/10 rounded-xl"><Sparkles size={24} className="text-yellow-300" /></span>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">AI Skill-Gap Analysis & Interview Mission</h1>
                  <p className="text-xs text-blue-100 mt-1">Upload your resume and Job Description. Groq AI extracts target role, company, and skill gaps.</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-700 flex items-center gap-2"><FileText size={16} className="text-blue-600" /> Upload Resume</label>
                  <label className="cursor-pointer block">
                    <input className="hidden" type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
                    <div className={`flex min-h-44 flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition-all ${resumeFile ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/60 hover:border-blue-400'}`}>
                      <Upload className={resumeFile ? 'text-emerald-600' : 'text-slate-400'} size={32} />
                      <p className="mt-3 text-xs font-bold">{resumeFile ? resumeFile.name : 'Drop resume here or click to browse'}</p>
                      <p className="mt-1 text-[10px] text-slate-400">PDF, DOC, DOCX or TXT</p>
                    </div>
                  </label>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-2"><Target size={16} className="text-blue-600" /> Target Job Description</label>
                    <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[10px] font-bold">
                      {['text', 'file'].map((m) => (
                        <button key={m} onClick={() => setInputMode(m as any)} className={`px-3 py-1 rounded-md transition-all ${inputMode === m ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{m === 'text' ? 'Paste Text' : 'Upload File'}</button>
                      ))}
                    </div>
                  </div>
                  {inputMode === 'file' ? (
                    <label className="cursor-pointer block">
                      <input className="hidden" type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setJdFile(e.target.files?.[0] || null)} />
                      <div className={`flex min-h-44 flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 transition-all ${jdFile ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/60 hover:border-blue-400'}`}>
                        <Upload className={jdFile ? 'text-emerald-600' : 'text-slate-400'} size={32} />
                        <p className="mt-3 text-xs font-bold">{jdFile ? jdFile.name : 'Drop JD file here or click to browse'}</p>
                        <p className="mt-1 text-[10px] text-slate-400">PDF, DOC, DOCX or TXT</p>
                      </div>
                    </label>
                  ) : (
                    <textarea value={jdText} onChange={(e) => setJdText(e.target.value)} placeholder="Paste job description here..." className="w-full min-h-44 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none placeholder:text-slate-400" />
                  )}
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-slate-100">
                <div>
                  <p className="mb-2 text-xs font-bold text-slate-700">Target Experience Level</p>
                  <div className="flex gap-2">
                    {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                      <button key={lvl} onClick={() => setLevel(lvl)} className={`flex-1 rounded-lg border py-2 text-xs font-bold transition-all ${level === lvl ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{lvl}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-slate-700">Days to Interview</p>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">{days} Days Left</span>
                  </div>
                  <input className="w-full accent-indigo-600 mt-2" type="range" min="1" max="60" value={days} onChange={(e) => setDays(+e.target.value)} />
                </div>
              </div>
              {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-center gap-2"><AlertTriangle size={16} className="shrink-0" />{error}</div>}
              <button disabled={!resumeFile || (inputMode === 'file' ? !jdFile : !jdText.trim()) || analyzing} onClick={handleAnalyze} className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white font-bold text-sm rounded-full shadow-md flex items-center justify-center gap-2 transition-all">
                {analyzing ? <><Loader2 className="animate-spin" size={18} />Extracting Role & Company from JD…</> : <><Sparkles size={18} className="text-yellow-300" />Analyze & Extract Skill Gaps</>}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── STEP 2: REVIEW ──
  if (step === 'review' && extraction) {
    return (
      <main className="min-h-screen bg-[#f8fafc] text-slate-900 py-10 px-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <button onClick={() => setStep('upload')} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"><ArrowLeft size={16} /> Edit Uploaded Documents</button>
          <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm flex items-center gap-4">
            <span className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100"><Sparkles size={26} /></span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AI Skill-Gap Analysis</h1>
              <p className="text-xs text-slate-500 mt-0.5">Review your target career parameters and the skills you need to learn.</p>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-center gap-3">
            <CheckCircle className="text-emerald-600" size={22} />
            <div>
              <h3 className="text-xs font-bold text-slate-900">Job Description Processed</h3>
              <p className="text-[11px] text-slate-500">We have analyzed your JD and extracted the key information.</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Briefcase size={16} /></span>Target Role</div>
              <input type="text" value={editedRole} onChange={(e) => setEditedRole(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none" />
              <span className="text-[10px] font-semibold text-slate-400">Identified from your JD</span>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700"><span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Building2 size={16} /></span>Target Company</div>
              {companySourceMode === 'jd' && editedCompany ? (
                <div>
                  <div className="flex items-center gap-2">
                    <input type="text" value={editedCompany} onChange={(e) => setEditedCompany(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none" />
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">✓ Identified</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 mt-1 block">Identified from your uploaded JD</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-700">Which company is this JD for?</p>
                  <input type="text" value={editedCompany} onChange={(e) => { setEditedCompany(e.target.value); if (e.target.value.trim()) setCompanySourceMode('user'); }} placeholder="Enter company name (e.g. Google, Microsoft)" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none placeholder:text-slate-400" />
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCompanySourceMode('user')} disabled={!editedCompany.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm disabled:opacity-40">Confirm Company</button>
                    <button onClick={() => { setCompanySourceMode('role_only'); setEditedCompany(''); }} className="text-slate-500 hover:text-slate-700 text-[11px] font-bold underline">Continue without company</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4"><Target size={18} className="text-blue-600" /> Skill Gap Summary</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { count: extraction.resumeSkills.length, label: 'Skills in your resume', bg: 'bg-emerald-50/40', icon: <FileText size={20} className="text-emerald-700" />, iconBg: 'bg-emerald-100', textColor: 'text-emerald-800', subColor: 'text-emerald-600' },
                { count: extraction.jdSkills.length, label: 'Skills required in JD', bg: 'bg-blue-50/40', icon: <BookOpen size={20} className="text-blue-700" />, iconBg: 'bg-blue-100', textColor: 'text-blue-800', subColor: 'text-blue-600' },
                { count: extraction.matchedSkills.length, label: 'Skills already matched', bg: 'bg-amber-50/40', icon: <CheckCircle size={20} className="text-amber-700" />, iconBg: 'bg-amber-100', textColor: 'text-amber-800', subColor: 'text-amber-600' },
              ].map((card, i) => (
                <div key={i} className={`rounded-xl border border-slate-100 ${card.bg} p-4 flex items-center gap-3`}>
                  <span className={`p-2.5 ${card.iconBg} rounded-xl`}>{card.icon}</span>
                  <div><span className={`text-lg font-bold ${card.textColor}`}>{card.count}</span><p className={`text-[11px] font-semibold ${card.subColor}`}>{card.label}</p></div>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-rose-500" size={20} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{editableMissingSkills.length} skills to strengthen</h4>
                    <p className="text-[11px] text-slate-500">Focus on these to match the job requirements.</p>
                  </div>
                </div>
                {!isAddingSkill && <button onClick={() => setIsAddingSkill(true)} className="flex items-center gap-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50"><Plus size={14} /> Add Skill</button>}
              </div>
              {isAddingSkill && (
                <div className="flex gap-2">
                  <input type="text" value={newSkillInput} onChange={(e) => setNewSkillInput(e.target.value)} placeholder="Enter custom missing skill" className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none" />
                  <button onClick={handleAddSkill} className="bg-indigo-600 text-white font-bold text-xs px-4 py-1.5 rounded-lg">Add</button>
                  <button onClick={() => setIsAddingSkill(false)} className="text-slate-400 text-xs px-2">Cancel</button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {editableMissingSkills.map((skill) => (
                  <span key={skill} className="bg-rose-100/70 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200/80 flex items-center gap-2">
                    {skill}<button onClick={() => handleRemoveSkill(skill)} className="text-rose-400 hover:text-rose-700"><X size={14} /></button>
                  </span>
                ))}
              </div>
            </div>
            {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">{error}</div>}
            <button disabled={generatingPlan} onClick={handleGenerateMission} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-full shadow-md flex items-center justify-center gap-2 transition-all">
              {generatingPlan ? <><Loader2 className="animate-spin" size={18} />Compiling Learning Path & Interview Mission…</> : <><Sparkles size={18} className="text-yellow-300" />Generate Career Mission & Learning Path</>}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!mission) return <main className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={32} /></main>;

  const totalModules = mission.learningPath?.chapters?.reduce((acc, chap) => acc + (chap.modules?.length || 0), 0) || 0;
  const isLearningCompleted = totalModules > 0 && completedModules.length >= totalModules;
  const currentProgress = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0;

  const handleMarkModuleComplete = (moduleTitle: string) => {
    if (!completedModules.includes(moduleTitle)) {
      const newCompleted = [...completedModules, moduleTitle];
      setCompletedModules(newCompleted);

      if (totalModules > 0 && newCompleted.length >= totalModules) {
        setShowUnlockModal(true);
        setSidebarNavMode('interview_mission');
        setInterviewSubTab('dashboard');
      }
    }
  };

  const handleRunCodeReview = async () => {
    if (!codingCodeInput.trim()) return;
    setCodeReviewLoading(true);
    setCodeReviewResult(null);
    try {
      const res = await submitCodeReview({
        code: codingCodeInput,
        language: codingLanguage,
        problemStatement: 'Write an optimal algorithm to process streaming data with O(1) lookup time.'
      });
      setCodeReviewResult(res);
    } catch (err: any) {
      setError(err.message || 'Code review failed.');
    } finally {
      setCodeReviewLoading(false);
    }
  };

  // ── STEP 3: DASHBOARD ──
  const totalModules2 = 0; // unused alias kept for TS
  const resourceItems = [
    { key: 'company_questions', label: 'Company Questions', colorClass: 'text-indigo-600', bgClass: 'bg-indigo-50 border-indigo-100', desc: "Questions related to the company's work and projects", detail: `Prepare for questions about the company's products, engineering culture, and real-world challenges. Focus on their core business, mission, and recent engineering decisions.` },
    { key: 'company_projects', label: 'Company Projects', colorClass: 'text-blue-600', bgClass: 'bg-blue-50 border-blue-100', desc: 'Real projects, technologies, and practical work', detail: `Explore the company's major projects, open-source contributions, and flagship products. Understanding the tech stack and architectural decisions is key.` },
    { key: 'case_studies', label: 'Case Studies', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50 border-emerald-100', desc: 'Real-world problems and how they are solved', detail: `Study real engineering challenges the company has solved. Each case study walks through the problem, solution approach, trade-offs, and business impact.` },
    { key: 'technical_resources', label: 'Technical Resources', colorClass: 'text-amber-600', bgClass: 'bg-amber-50 border-amber-100', desc: 'Technologies, tools, and concepts used in the company', detail: `Deep-dive into core technologies, frameworks, and tools. Covers system design patterns, internal tooling, DevOps practices, and relevant libraries.` },
    { key: 'interview_questions', label: 'Interview Questions', colorClass: 'text-rose-600', bgClass: 'bg-rose-50 border-rose-100', desc: 'Questions to prepare for company interviews', detail: `A curated list of technical and behavioral interview questions. Covers data structures, algorithms, system design, and cultural-fit questions.` },
  ];
  const activeResource = resourceItems.find(r => r.key === selectedResource);
  const isCollapsed = isSidebarCollapsed && !isSidebarHovered;

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16">

      {/* ── HEADER ── */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setStep('upload')} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
              <ArrowLeft size={16} /> New Analysis
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <h1 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase size={16} className="text-blue-600" />{mission.targetRole}
              {mission.targetCompany && <span className="text-indigo-600">@ {mission.targetCompany}</span>}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">{mission.experienceLevel} Level</span>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">{mission.daysUntilInterview} Days Left</span>
            {/* Learning progress badge */}
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${isLearningCompleted ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
              {isLearningCompleted ? '✓ Learning Done' : `${completedModules.length}/${totalModules} Modules`}
            </span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT: SIDEBAR + CONTENT AREA ── */}
      <div className={`mx-auto max-w-7xl px-6 py-6 grid gap-6 transition-all duration-300 ${isCollapsed ? 'xl:grid-cols-[72px_minmax(0,1fr)]' : 'xl:grid-cols-[280px_minmax(0,1fr)]'}`}>

        {/* ── LEFT COLLAPSIBLE SIDEBAR ── */}
        <aside
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden self-start sticky top-20 transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-full'}`}
        >
          {isCollapsed ? (
            /* ── COLLAPSED SIDEBAR ── */
            <div className="py-4 flex flex-col items-center gap-4 select-none">
              <button
                onClick={(e) => { e.stopPropagation(); setIsSidebarCollapsed(false); }}
                title="Expand Sidebar"
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-8 h-px bg-slate-100" />
              {/* Modules icon */}
              <button
                onClick={(e) => { e.stopPropagation(); setSidebarNavMode('modules'); setSelectedResource(null); }}
                title="Learning Modules"
                className={`p-3 rounded-2xl transition-all ${sidebarNavMode === 'modules' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <FileText size={20} />
              </button>
              {/* Resources icon */}
              <button
                onClick={(e) => { e.stopPropagation(); setSidebarNavMode('resources'); setSelectedModule(null); if (!selectedResource) setSelectedResource('company_questions'); }}
                title="Company Resources"
                className={`p-3 rounded-2xl transition-all ${sidebarNavMode === 'resources' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <BookMarked size={20} />
              </button>
              {/* Interview Mission icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLearningCompleted) { setShowLockedAlertModal(true); }
                  else { setSidebarNavMode('interview_mission'); setSelectedModule(null); setSelectedResource(null); }
                }}
                title={isLearningCompleted ? 'Interview Mission (Unlocked)' : 'Interview Mission (Locked — complete learning first)'}
                className={`p-3 rounded-2xl transition-all ${sidebarNavMode === 'interview_mission' ? 'bg-amber-500 text-white shadow-md' : isLearningCompleted ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:bg-slate-100'}`}
              >
                {isLearningCompleted ? <Sparkles size={20} /> : <Lock size={20} />}
              </button>
            </div>
          ) : (
            /* ── EXPANDED SIDEBAR ── */
            <div>
              {/* Header */}
              <div className="px-3.5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-100 flex items-center justify-between gap-2 select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsSidebarCollapsed(true); }}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-lg transition-colors shrink-0"
                    title="Collapse Sidebar"
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <div className="min-w-0">
                    <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider truncate">
                      {sidebarNavMode === 'modules' ? 'Learning Path' : sidebarNavMode === 'resources' ? 'Company Resources' : 'Interview Mission'}
                    </h3>
                    <p className="text-[9px] text-slate-400 truncate">
                      {sidebarNavMode === 'modules' ? `${completedModules.length}/${totalModules} completed` : sidebarNavMode === 'resources' ? 'Company preparation' : isLearningCompleted ? 'Unlocked ✓' : 'Complete learning to unlock'}
                    </p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setIsSidebarCollapsed(true); }} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg shrink-0">
                  <PanelLeftClose size={15} />
                </button>
              </div>

              {/* Mode Pills */}
              <div className="p-1.5 bg-slate-50 border-b border-slate-100 flex gap-1 text-[10px] font-bold select-none">
                <button
                  onClick={() => { setSidebarNavMode('modules'); setSelectedResource(null); }}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${sidebarNavMode === 'modules' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <FileText size={11} /><span>Modules</span>
                </button>
                <button
                  onClick={() => { setSidebarNavMode('resources'); setSelectedModule(null); if (!selectedResource) setSelectedResource('company_questions'); }}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${sidebarNavMode === 'resources' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <BookMarked size={11} /><span>Resources</span>
                </button>
                <button
                  onClick={() => {
                    if (!isLearningCompleted) { setShowLockedAlertModal(true); }
                    else { setSidebarNavMode('interview_mission'); setSelectedModule(null); setSelectedResource(null); }
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 ${sidebarNavMode === 'interview_mission' ? 'bg-white text-amber-600 shadow-sm border border-slate-200' : isLearningCompleted ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-400'}`}
                >
                  {isLearningCompleted ? <Sparkles size={11} /> : <Lock size={11} />}
                  <span>Interview</span>
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="max-h-[calc(100vh-220px)] overflow-y-auto">

                {/* MODULES MODE */}
                {sidebarNavMode === 'modules' && (
                  <div className="space-y-0.5 py-1">
                    {mission.learningPath?.chapters?.map((chapter, cIdx) => {
                      const isOpen = expandedChapters.has(cIdx);
                      const chapterDone = chapter.modules?.every(m => completedModules.includes(m.title));
                      return (
                        <div key={chapter.id || cIdx}>
                          <button
                            onClick={() => setExpandedChapters(prev => { const n = new Set(prev); if (n.has(cIdx)) n.delete(cIdx); else n.add(cIdx); return n; })}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`shrink-0 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${chapterDone ? 'bg-emerald-500 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                                {chapterDone ? '✓' : cIdx + 1}
                              </span>
                              <span className="text-[11px] font-bold text-slate-700 truncate text-left">{chapter.title}</span>
                            </div>
                            <ChevronRight size={12} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="bg-slate-50/60">
                              {chapter.modules?.map((mod, mIdx) => (
                                <button
                                  key={mod.id || mIdx}
                                  onClick={() => { setSelectedModule(mod); setSelectedResource(null); if (sidebarNavMode !== 'modules') setSidebarNavMode('modules'); }}
                                  className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-all border-l-2 ${selectedModule?.title === mod.title && sidebarNavMode === 'modules' && !selectedResource ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-medium' : 'border-transparent text-slate-600 hover:bg-slate-100 hover:border-slate-300'}`}
                                >
                                  <span className={`shrink-0 w-3.5 h-3.5 rounded-full border flex items-center justify-center ${completedModules.includes(mod.title) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                                    {completedModules.includes(mod.title) && <CheckCircle size={8} className="text-white" />}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-semibold truncate">{mod.title}</p>
                                    <p className="text-[9px] text-slate-400">{mod.duration}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {/* Overall progress */}
                    <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 mb-1.5">
                        <span>Learning Progress</span>
                        <span>{currentProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 transition-all duration-500 rounded-full" style={{ width: `${currentProgress}%` }} />
                      </div>
                      {isLearningCompleted && (
                        <button
                          onClick={() => setSidebarNavMode('interview_mission')}
                          className="mt-2 w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1 hover:from-amber-600 hover:to-orange-600 transition-all"
                        >
                          <Sparkles size={11} /> Start Interview Mission →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* RESOURCES MODE */}
                {sidebarNavMode === 'resources' && (
                  <div className="p-2 space-y-1">
                    {resourceItems.map((res) => (
                      <button
                        key={res.key}
                        onClick={() => { setSelectedResource(res.key); setSelectedModule(null); }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-2.5 transition-all border ${selectedResource === res.key ? 'border-indigo-200 bg-indigo-50/80 text-indigo-900 shadow-sm' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'}`}
                      >
                        <span className={`shrink-0 w-2 h-2 rounded-full mt-2 ${res.bgClass} border`} />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-800">{res.label}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate">{res.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* INTERVIEW MISSION MODE — show sub-navigation */}
                {sidebarNavMode === 'interview_mission' && isLearningCompleted && (
                  <div className="p-2 space-y-1">
                    {[
                      { key: 'dashboard', label: 'Interview Dashboard', icon: <BarChart2 size={14} /> },
                      { key: 'company_prep', label: 'Company Prep', icon: <Building2 size={14} /> },
                      { key: 'ai_mock', label: 'AI Mock Interview', icon: <Code2 size={14} /> },
                      { key: 'evaluation', label: 'Interview Evaluation', icon: <Award size={14} /> },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setInterviewSubTab(item.key as any)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all border text-xs font-bold ${interviewSubTab === item.key ? 'border-amber-200 bg-amber-50/80 text-amber-900 shadow-sm' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'}`}
                      >
                        <span className={interviewSubTab === item.key ? 'text-amber-600' : 'text-slate-400'}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}
        </aside>

        {/* ── RIGHT CONTENT AREA ── */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[500px]">

          {/* ── LEARNING MODULE DETAIL ── */}
          {sidebarNavMode === 'modules' && selectedModule && !selectedResource && (
            <>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">{selectedModule.duration} · {selectedModule.difficulty}</span>
                <h2 className="text-lg font-bold mt-1">{selectedModule.title}</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2"><BookOpen size={15} className="text-blue-600" /> Module Overview</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{selectedModule.summary}</p>
                </div>
                {selectedModule.keyConcepts?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2"><Lightbulb size={15} className="text-amber-500" /> Key Concepts</h4>
                    <ul className="space-y-2">
                      {selectedModule.keyConcepts.map((c, i) => (
                        <li key={i} className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2">
                          <span className="text-indigo-600 font-bold shrink-0">•</span><span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedModule.personalizedTips?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-2"><Zap size={15} className="text-indigo-500" /> Personalized Tips</h4>
                    <ul className="space-y-2">
                      {selectedModule.personalizedTips.map((tip, i) => (
                        <li key={i} className="text-xs text-slate-700 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-start gap-2">
                          <span className="text-indigo-600 font-bold shrink-0">→</span><span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <button
                    onClick={() => handleMarkModuleComplete(selectedModule.title)}
                    disabled={completedModules.includes(selectedModule.title)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
                  >
                    {completedModules.includes(selectedModule.title)
                      ? <><CheckCircle size={17} /> Module Completed</>
                      : <><CheckCircle size={17} /> Mark as Complete</>}
                  </button>
                  <button
                    onClick={() => triggerAction('practice', '0.005', `Practice: ${selectedModule.title}`)}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Play size={14} /> Practice Questions · 0.005 USDC
                  </button>
                </div>
                {/* Practice result */}
                {practiceResult && (
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2"><Brain size={15} className="text-indigo-600" /> Practice Questions</h4>
                    {practiceResult.questions?.map((q, qi) => (
                      <div key={q.id || qi} className={`rounded-xl border p-4 space-y-3 ${selectedPracticeIndex === qi ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-100'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-800">{qi + 1}. {q.question}</p>
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">{q.difficulty}</span>
                        </div>
                        {selectedPracticeIndex === qi && (
                          <div className="space-y-2">
                            <textarea
                              value={userPracticeAnswer}
                              onChange={(e) => setUserPracticeAnswer(e.target.value)}
                              placeholder="Type your answer here..."
                              className="w-full min-h-24 rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none placeholder:text-slate-400"
                            />
                            <div className="flex gap-2">
                              <button
                                disabled={!userPracticeAnswer.trim()}
                                onClick={() => triggerAction('evaluate', '0.005', 'Evaluate Answer')}
                                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl"
                              >
                                Evaluate · 0.005 USDC
                              </button>
                            </div>
                            {practiceEvaluation && (
                              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-800">Score</span>
                                  <span className="text-lg font-bold text-emerald-700">{practiceEvaluation.score}/100</span>
                                </div>
                                <p className="text-[11px] text-emerald-900 leading-relaxed">{practiceEvaluation.constructiveFeedback}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {selectedPracticeIndex !== qi && (
                          <button onClick={() => { setSelectedPracticeIndex(qi); setUserPracticeAnswer(''); setPracticeEvaluation(null); }} className="text-[10px] font-bold text-indigo-600 hover:underline">
                            Answer this question →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── COMPANY RESOURCE DETAIL ── */}
          {sidebarNavMode === 'resources' && selectedResource && activeResource && (
            <>
              <div className="p-6 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Company Resource</span>
                <h2 className={`text-xl font-bold mt-1 ${activeResource.colorClass}`}>{activeResource.label}</h2>
                <p className="text-xs text-slate-500 mt-1">{activeResource.desc}</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{activeResource.detail}</p>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-indigo-700 mb-1">🤖 AI-Generated Content</p>
                  <p className="text-xs text-indigo-600 leading-relaxed">
                    Detailed {activeResource.label.toLowerCase()} content for <strong>{mission.targetCompany || 'your target company'}</strong> will be AI-generated based on your profile.
                  </p>
                </div>
                <button
                  onClick={() => triggerAction('generate_resources', '0.01', `Generate ${activeResource.label}`)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles size={15} /> Generate {activeResource.label} · 0.01 USDC
                </button>
              </div>
            </>
          )}

          {/* ── INTERVIEW MISSION LOCKED STATE ── */}
          {sidebarNavMode === 'interview_mission' && !isLearningCompleted && (
            <div className="flex flex-col items-center justify-center min-h-[500px] p-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-4xl shadow-inner">🔒</div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-xl font-bold text-slate-900">Interview Mission Locked</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Interview Mission unlocks automatically after you complete your entire Learning Path. Keep learning — you're almost there!
                </p>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 max-w-sm w-full text-left space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Learning Progress</span>
                  <span className="text-indigo-600">{completedModules.length} / {totalModules} Modules</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-500 rounded-full" style={{ width: `${currentProgress}%` }} />
                </div>
                <p className="text-[11px] text-slate-500">{totalModules - completedModules.length} module(s) remaining before auto-unlock.</p>
              </div>
              <button
                onClick={() => setSidebarNavMode('modules')}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-md transition-all"
              >
                Continue Learning Path →
              </button>
            </div>
          )}

          {/* ── INTERVIEW MISSION CONTENT (UNLOCKED) ── */}
          {sidebarNavMode === 'interview_mission' && isLearningCompleted && (
            <div>
              {/* Sub-tab bar */}
              <div className="p-2 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-1 text-xs font-bold">
                {[
                  { key: 'dashboard', label: 'Interview Dashboard', icon: <BarChart2 size={13} /> },
                  { key: 'company_prep', label: 'Company Prep', icon: <Building2 size={13} /> },
                  { key: 'ai_mock', label: 'AI Mock Interview', icon: <Code2 size={13} /> },
                  { key: 'evaluation', label: 'Interview Evaluation', icon: <Award size={13} /> },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setInterviewSubTab(item.key as any)}
                    className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition-all ${interviewSubTab === item.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:border hover:border-slate-200'}`}
                  >
                    {item.icon}{item.label}
                  </button>
                ))}
              </div>

              {/* 1. INTERVIEW DASHBOARD */}
              {interviewSubTab === 'dashboard' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">Interview Mission Unlocked 🎉</span>
                      <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                        {mission.targetCompany || 'Top Tech Companies'} <span className="text-slate-400">·</span> {mission.targetRole}
                      </h2>
                    </div>
                    <button onClick={() => setInterviewSubTab('company_prep')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0">
                      <Sparkles size={13} /> Start Interview Prep
                    </button>
                  </div>

                  {/* Readiness score */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: 'Overall Readiness', value: `${interviewMission?.readinessScore?.overall || 65}%`, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
                      { label: 'Technical', value: `${interviewMission?.readinessScore?.technical || 70}%`, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                      { label: 'Communication', value: `${interviewMission?.readinessScore?.communication || 75}%`, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                      { label: 'Behavioral', value: `${interviewMission?.readinessScore?.behavioral || 80}%`, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                    ].map((stat, i) => (
                      <div key={i} className={`rounded-xl border ${stat.bg} p-4 text-center`}>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] font-semibold text-slate-600 mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Skills overview */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5"><CheckCircle size={14} /> Verified Skills ({mission.matchedSkills?.length || 0})</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(mission.matchedSkills || []).slice(0, 8).map(s => (
                          <span key={s} className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">{s}</span>
                        ))}
                        {(mission.matchedSkills?.length || 0) > 8 && <span className="text-[10px] text-emerald-600">+{mission.matchedSkills!.length - 8} more</span>}
                      </div>
                    </div>
                    <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 space-y-2">
                      <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5"><AlertTriangle size={14} /> Skill Gaps ({mission.missingSkills?.length || 0})</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(mission.missingSkills || []).slice(0, 8).map(s => (
                          <span key={s} className="text-[10px] font-semibold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">{s}</span>
                        ))}
                        {(mission.missingSkills?.length || 0) > 8 && <span className="text-[10px] text-rose-600">+{mission.missingSkills!.length - 8} more</span>}
                      </div>
                    </div>
                  </div>

                  {/* Next steps */}
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-800">Recommended Next Steps</h4>
                    <div className="space-y-2">
                      {[
                        { step: 1, text: 'Review Company Prep to understand the interview process', action: () => setInterviewSubTab('company_prep') },
                        { step: 2, text: 'Start with a Technical Mock Interview to assess readiness', action: () => { setInterviewSubTab('ai_mock'); setSelectedInterviewType('Technical'); } },
                        { step: 3, text: 'Review your Evaluation Report and improve weak areas', action: () => setInterviewSubTab('evaluation') },
                      ].map(item => (
                        <button key={item.step} onClick={item.action} className="w-full flex items-center gap-3 text-left p-3 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">{item.step}</span>
                          <span className="text-xs font-semibold text-slate-700">{item.text}</span>
                          <ChevronRight size={13} className="text-slate-400 ml-auto shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. COMPANY PREP */}
              {interviewSubTab === 'company_prep' && (
                <div className="p-6 space-y-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Company Interview Prep</span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">{mission.targetCompany || 'Top Tech Companies'}</h2>
                    <p className="text-xs text-slate-500 mt-1">Personalized preparation plan for <strong>{mission.targetRole}</strong></p>
                  </div>

                  {/* Interview process */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Interview Process</h4>
                    {['Round 1: Screening & Introduction (30 mins)', 'Round 2: Technical Deep Dive & Architecture (45 mins)', 'Round 3: Coding & Problem Solving (60 mins)', 'Round 4: Behavioral & Culture Fit (45 mins)'].map((r, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs text-slate-700 font-medium">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        {r}
                      </div>
                    ))}
                  </div>

                  {/* Topics */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-2">
                      <h4 className="text-xs font-bold text-blue-800">Technical Topics to Prepare</h4>
                      <ul className="space-y-1">
                        {(mission.missingSkills?.length > 0 ? mission.missingSkills : ['Data Structures', 'Algorithms', 'System Design', 'OOP']).slice(0, 6).map(s => (
                          <li key={s} className="text-[11px] text-blue-900 flex items-center gap-2">
                            <span className="text-blue-400">•</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-800">Your Strengths</h4>
                      <ul className="space-y-1">
                        {(mission.matchedSkills || ['Problem Solving', 'Core Programming']).slice(0, 6).map(s => (
                          <li key={s} className="text-[11px] text-emerald-900 flex items-center gap-2">
                            <span className="text-emerald-500">✓</span>{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => setInterviewSubTab('ai_mock')}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Play size={16} /> Start Mock Interview
                  </button>
                </div>
              )}

              {/* 3. AI MOCK INTERVIEW */}
              {interviewSubTab === 'ai_mock' && (
                <div className="p-6 space-y-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">AI Mock Interview</span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">{mission.targetRole} {mission.targetCompany ? `@ ${mission.targetCompany}` : ''}</h2>
                  </div>

                  {/* Interview type selector */}
                  <div className="grid grid-cols-3 gap-3">
                    {(['Technical', 'Coding', 'HR'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedInterviewType(type)}
                        className={`py-4 rounded-xl border font-bold text-sm flex flex-col items-center gap-2 transition-all ${selectedInterviewType === type ? 'border-indigo-400 bg-indigo-50 text-indigo-800 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        {type === 'Technical' && <Terminal size={22} className={selectedInterviewType === type ? 'text-indigo-600' : 'text-slate-400'} />}
                        {type === 'Coding' && <Code2 size={22} className={selectedInterviewType === type ? 'text-indigo-600' : 'text-slate-400'} />}
                        {type === 'HR' && <MessageSquare size={22} className={selectedInterviewType === type ? 'text-indigo-600' : 'text-slate-400'} />}
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Coding interview */}
                  {selectedInterviewType === 'Coding' && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-200 bg-slate-900 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Code Editor</span>
                          <select
                            value={codingLanguage}
                            onChange={(e) => setCodingLanguage(e.target.value)}
                            className="text-xs font-bold bg-slate-700 text-slate-200 border border-slate-600 rounded-lg px-2 py-1"
                          >
                            {['cpp', 'python', 'java', 'javascript', 'typescript'].map(l => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          value={codingCodeInput}
                          onChange={(e) => setCodingCodeInput(e.target.value)}
                          className="w-full min-h-56 bg-transparent text-slate-100 font-mono text-xs focus:outline-none resize-none"
                          spellCheck={false}
                        />
                      </div>
                      <button
                        onClick={handleRunCodeReview}
                        disabled={codeReviewLoading || !codingCodeInput.trim()}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        {codeReviewLoading ? <><Loader2 size={16} className="animate-spin" /> Reviewing Code…</> : <><Terminal size={16} /> Submit Code for AI Review</>}
                      </button>
                      {codeReviewResult && (
                        <div className="space-y-3">
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Code Review Result</h4>
                              <span className="text-2xl font-bold text-emerald-700">{codeReviewResult.score}/100</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed mb-3">{codeReviewResult.review}</p>
                            {codeReviewResult.strengths?.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-emerald-700 uppercase">Strengths</p>
                                {codeReviewResult.strengths.map((s, i) => <p key={i} className="text-xs text-slate-600">✓ {s}</p>)}
                              </div>
                            )}
                            {codeReviewResult.suggestions?.length > 0 && (
                              <div className="space-y-1 mt-2">
                                <p className="text-[10px] font-bold text-amber-700 uppercase">Suggestions</p>
                                {codeReviewResult.suggestions.map((s, i) => <p key={i} className="text-xs text-slate-600">→ {s}</p>)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Technical / HR interview */}
                  {selectedInterviewType !== 'Coding' && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{selectedInterviewType} Interview</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {selectedInterviewType === 'Technical'
                            ? `The AI will ask you technical questions based on your skill gaps (${(mission.missingSkills || []).slice(0, 3).join(', ')}) and evaluate your responses in real time.`
                            : `The AI will ask behavioral and culture-fit questions, evaluating communication, leadership, and your problem-solving approach.`}
                        </p>
                      </div>
                      {(interviewMission?.rounds?.[(interviewMission?.currentRoundIndex ?? 0)]?.questions?.length ?? 0) > 0 ? (
                        <div className="space-y-4">
                          {interviewMission!.rounds[interviewMission!.currentRoundIndex].questions.slice(0, 1).map(q => (
                            <div key={q.id} className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5 space-y-3">
                              <p className="text-sm font-semibold text-slate-800">{q.question}</p>
                              <textarea
                                value={currentAnswerInput}
                                onChange={(e) => setCurrentAnswerInput(e.target.value)}
                                placeholder="Type your answer..."
                                className="w-full min-h-28 rounded-xl border border-slate-200 bg-white p-3 text-xs focus:border-indigo-400 focus:outline-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  disabled={!currentAnswerInput.trim()}
                                  onClick={() => triggerAction('interview_submit_answer', '0.005', 'Submit Answer')}
                                  className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl"
                                >
                                  Submit Answer
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => triggerAction('interview_start_round', '0.02', `Start ${selectedInterviewType} Interview`)}
                          className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
                        >
                          <Play size={16} /> Start {selectedInterviewType} Interview · 0.02 USDC
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 4. INTERVIEW EVALUATION */}
              {interviewSubTab === 'evaluation' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Interview Evaluation Report</span>
                      <h2 className="text-lg font-bold text-slate-900 mt-0.5">{mission.targetRole} {mission.targetCompany ? `@ ${mission.targetCompany}` : ''}</h2>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center text-lg font-bold text-emerald-700 shrink-0">
                      {interviewMission?.readinessScore?.overall || 78}%
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-emerald-50/70 p-5 rounded-xl border border-emerald-100 space-y-2">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 size={14} /> Key Strengths</h4>
                      <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
                        <li>• Solid grasp of core language fundamentals for {mission.targetRole}</li>
                        <li>• Clear problem-solving approach and structured communication</li>
                        <li>• Good understanding of core data structure trade-offs</li>
                      </ul>
                    </div>
                    <div className="bg-rose-50/70 p-5 rounded-xl border border-rose-100 space-y-2">
                      <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5"><AlertTriangle size={14} /> Weak Areas</h4>
                      <ul className="space-y-1.5 text-xs text-rose-950 font-medium">
                        {(mission.missingSkills || ['Dynamic Programming', 'System Design']).slice(0, 3).map(s => (
                          <li key={s}>• {s} — needs more practice</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-blue-50/70 p-5 rounded-xl border border-blue-100 space-y-2">
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5"><Sparkles size={14} /> Actionable Next Steps</h4>
                    <ul className="space-y-1.5 text-xs text-blue-950 font-medium">
                      <li>1. Practice 3 algorithm problems focusing on time complexity optimization</li>
                      <li>2. Review system design patterns for {mission.targetRole}</li>
                      <li>3. Re-run Technical Mock Interview to improve score to 85%+</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setInterviewSubTab('ai_mock')}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <Play size={15} /> Re-run Mock Interview
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── EMPTY STATE ── */}
          {((sidebarNavMode === 'modules' && !selectedModule) || (sidebarNavMode === 'resources' && !selectedResource)) && (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                <BookOpen size={26} className="text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 mb-2">
                {sidebarNavMode === 'modules' ? 'Select a Module' : 'Select a Resource'}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs">
                {sidebarNavMode === 'modules'
                  ? 'Choose a learning module from the left sidebar to view its content.'
                  : 'Choose a company resource from the left sidebar to view preparation content.'}
              </p>
            </div>
          )}

        </section>
      </div>

      {/* ── UNLOCK CELEBRATION MODAL ── */}
      <AnimatePresence>
        {showUnlockModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl mx-auto shadow-sm">🎉</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Learning Path Completed!</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">You have finished your learning journey. Your Interview Mission is now automatically unlocked.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Career Setup</span>
                <p className="text-sm font-bold text-slate-900">{mission?.targetCompany || 'Top Tech Companies'} · {mission?.targetRole}</p>
              </div>
              <button
                onClick={() => { setShowUnlockModal(false); setSidebarNavMode('interview_mission'); setInterviewSubTab('dashboard'); }}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all"
              >
                Start Interview Mission →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LOCKED ALERT MODAL ── */}
      <AnimatePresence>
        {showLockedAlertModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl mx-auto">🔒</div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Interview Mission Locked</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Complete your personalized learning path to unlock company-specific interview preparation.</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-left space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                  <span>Learning Progress</span><span>{completedModules.length}/{totalModules} Modules</span>
                </div>
                <div className="w-full h-2 rounded-full bg-amber-200/60 overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-300 rounded-full" style={{ width: `${currentProgress}%` }} />
                </div>
                <p className="text-[10px] text-amber-700 font-medium">{totalModules - completedModules.length} required module(s) remaining.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowLockedAlertModal(false)} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all">
                  Close
                </button>
                <button
                  onClick={() => { setShowLockedAlertModal(false); setSidebarNavMode('modules'); }}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Continue Learning →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── x402 PAYMENT MODAL ── */}
      <AnimatePresence>
        {paymentStep !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl max-w-sm w-full space-y-5 text-slate-900">
              {paymentStep === 'paywall' && (
                <>
                  <div className="flex justify-between items-start">
                    <div><h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{actionTitle}</h3><p className="text-[10px] text-indigo-600 font-semibold mt-0.5">x402 Micropayment Protocol</p></div>
                    <button onClick={() => setPaymentStep(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                  </div>
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Price</span>
                    <span className="text-2xl font-bold text-emerald-600 block mt-1">${actionPrice} USDC</span>
                  </div>
                  <div className="space-y-2 text-xs font-bold text-slate-600">
                    <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600" /> Signed on Algorand MainNet</div>
                    <div className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600" /> Groq AI Model Response</div>
                  </div>
                  <button onClick={executePaidAction} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all">Pay ${actionPrice} USDC & Execute</button>
                </>
              )}
              {paymentStep === '402' && <div className="text-center py-6 space-y-3"><div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-xl animate-pulse">💸</div><h4 className="text-sm font-bold text-slate-900">HTTP 402 Payment Required</h4><p className="text-[10px] text-slate-500 leading-relaxed">Received x402 challenge from Sikho AI Gateway. Preparing Algorand transaction...</p></div>}
              {paymentStep === 'wallet' && <div className="text-center py-6 space-y-3"><div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-xl animate-bounce">🔑</div><h4 className="text-sm font-bold text-slate-900">Sign in Wallet</h4><p className="text-[10px] text-slate-500 leading-relaxed">Please approve and sign the ${actionPrice} USDC transaction in your wallet.</p></div>}
              {paymentStep === 'verifying' && <div className="text-center py-6 space-y-3"><div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto"><Loader2 className="animate-spin text-indigo-600" size={22} /></div><h4 className="text-sm font-bold text-slate-900">Verifying Settlement</h4><p className="text-[10px] text-slate-500 leading-relaxed">Verifying on Algorand. Executing AI response...</p></div>}
              {paymentStep === 'complete' && <div className="text-center py-6 space-y-3"><div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 text-xl">✓</div><h4 className="text-sm font-bold text-emerald-600">Action Complete!</h4><p className="text-[10px] text-slate-500 leading-relaxed">Micropayment settled. Unlocked AI response!</p></div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
