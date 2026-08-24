const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '../src/pages/ResumeIntelligence.tsx');
let content = fs.readFileSync(targetFilePath, 'utf8');

// 1. resumeIntelUnlocked default value to true
content = content.replace(
  `const [resumeIntelUnlocked, setResumeIntelUnlocked] = useState(false);`,
  `const [resumeIntelUnlocked, setResumeIntelUnlocked] = useState(true);\n  const [jobDiscoveryUnlocked, setJobDiscoveryUnlocked] = useState(false);\n  const [activePaymentService, setActivePaymentService] = useState<'job_discovery' | 'job_analysis' | null>(null);`
);

// 2. INNER SIDEBAR NAVIGATION
const oldSidebarPattern = `            {/* INNER SIDEBAR NAVIGATION */}
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
                    className={\`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all \${
                      currentView === item.id 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-650 hover:bg-slate-50'
                    }\`}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>`;

const newSidebarContent = `            {/* INNER SIDEBAR NAVIGATION */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.015)] space-y-1 lg:sticky lg:top-24">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 block mb-3">Workspace Nav</span>
              {[
                { id: 'overview', label: '📄 Resume', icon: Layers },
                { id: 'quality', label: '🎯 ATS Analysis', icon: ShieldCheck },
                { id: 'career', label: '🧭 Career Fit', icon: Compass },
                { id: 'jobdisc', label: '💼 Job Opportunities', icon: Brain }
              ].map((item) => {
                const Icon = item.icon;
                const isLocked = item.id === 'jobdisc' && !jobDiscoveryUnlocked;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isLocked) {
                        setActivePaymentService('job_discovery');
                        setPaymentStep('paywall');
                      } else {
                        setCurrentView(item.id as any);
                      }
                    }}
                    className={\`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold transition-all \${
                      currentView === item.id 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-650 hover:bg-slate-50'
                    }\`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </div>
                    {isLocked && <span className="text-[10px] font-extrabold text-indigo-600">🔒 $0.02</span>}
                  </button>
                );
              })}
            </div>`;

// Replace sidebar nav
if (!content.includes(oldSidebarPattern)) {
  console.error("Sidebar nav pattern not found!");
  process.exit(1);
}
content = content.replace(oldSidebarPattern, newSidebarContent);

// 3. PAGE 16: RICH JOB DISCOVERY
const oldJobDiscPatternStart = `              {currentView === 'jobdisc' && (() => {

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
                        <p className="text-xs text-slate-505 font-semibold mt-0.5">
                          View real-time job openings matching your detected profile or custom search transition target.
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {[
                          { label: 'Jobs Found', val: discoveryPath === 'target' ? '982' : '1,247', sub: 'Live jobs', icon: '💼' },
                          { label: 'Avg Match Score', val: discoveryPath === 'target' ? '72%' : '84%', sub: 'Across all jobs', icon: '📈' },
                          { label: 'Top Match', val: discoveryPath === 'target' ? '92%' : '96%', sub: 'Highest match', icon: '🎯' },
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

                    {/* ─── Discovery Paths Selection (Phase 16) ─── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Automatically Discovered */}
                      <button
                        onClick={() => { setDiscoveryPath('auto'); setSelectedDiscoveryJob(0); }}
                        className={\`flex flex-col items-start p-4 rounded-2xl border text-left transition-all \${
                          discoveryPath === 'auto'
                            ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-50'
                            : 'bg-white border-slate-200 hover:bg-slate-50/50'
                        }\`}
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
                        className={\`flex flex-col items-start p-4 rounded-2xl border text-left transition-all \${
                          discoveryPath === 'target'
                            ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-50'
                            : 'bg-white border-slate-200 hover:bg-slate-50/50'
                        }\`}
                      >
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">User-targeted</span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Based on your goal</span>
                        <div className="flex justify-between items-end w-full mt-3">
                          <span className="text-sm font-black text-slate-800">\${targetRole}</span>
                          <span className="text-[10px] font-bold text-indigo-655 bg-indigo-50 px-2.5 py-0.5 rounded-md">982 jobs analyzed</span>
                        </div>
                      </button>
                    </div>`;

const newJobDiscContentStart = `              {currentView === 'jobdisc' && (() => {

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
                            postedAgo: j.postedAt ? \`Posted \${new Date(j.postedAt).toLocaleDateString()}\` : 'Recently',
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
                        <h2 className="text-xl font-black text-slate-900">Job Opportunities</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          View real-time job openings matching your detected profile or custom search transition target.
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {[
                          { label: 'Jobs Found', val: totalCount.toString(), sub: 'Live jobs', icon: '💼' },
                          { label: 'Avg Match Score', val: \`\${avgMatchScore}%\`, sub: 'Across all jobs', icon: '📈' },
                          { label: 'Top Match', val: \`\${topMatchScore}%\`, sub: 'Highest match', icon: '🎯' },
                          { label: 'Updated', val: 'Just now', sub: 'Real-time data', icon: '🕒' },
                        ].map(stat => (
                          <div key={stat.label} className="hidden lg:block text-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">{stat.icon} {stat.label}</span>
                            <span className="text-base font-black text-slate-900 block mt-0.5">{stat.val}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{stat.sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>`;

// Replace jobdisc block
if (!content.includes(oldJobDiscPatternStart)) {
  console.error("PAGE 16 pattern not found!");
  process.exit(1);
}
content = content.replace(oldJobDiscPatternStart, newJobDiscContentStart);

// Update count label "Jobs (828)" dynamically to `Jobs (${totalCount})`
content = content.replace(`Jobs (828)`, `Jobs (\${totalCount})`);

// 4. Update the "Analyze My Resume" button in job list loop to set activePaymentService
const oldAnalyzeBtnPattern = `                              <button
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
                              </button>`;

const newAnalyzeBtnPattern = `                              <button
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
                              </button>`;

if (!content.includes(oldAnalyzeBtnPattern)) {
  console.error("Analyze My Resume button pattern not found!");
  process.exit(1);
}
content = content.replace(oldAnalyzeBtnPattern, newAnalyzeBtnPattern);

// 5. UNIFIED X402 PAYMENT FLOW MODAL
const oldModalPattern = `      {/* x402 Payment Flow Modal (Phase 22) */}
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
                        className="text-slate-400 hover:text-slate-655 transition-colors"
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
                          \${x402Services.find(s => s.serviceId === 'job_analysis')?.priceUsd || '0.02'} USDC
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
                            await x402Fetch(\`/api/resume/jobs/\${payingJobIdx}/analyze\`, {
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
                            alert(\`Verification failed: \${err.message || err}\`);
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
                      <p className="text-[10px] text-slate-505 font-semibold leading-relaxed">
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
                      <p className="text-[10px] text-slate-505 font-semibold leading-relaxed">
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
                      <p className="text-[10px] text-slate-505 font-semibold leading-relaxed">
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
                      <p className="text-[10px] text-slate-505 font-semibold leading-relaxed">
                        Micropayment verified successfully. Redirecting to analysis report...
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>`;

const newModalContent = `      {/* x402 Payment Flow Modal (Phase 22) */}
      <AnimatePresence>
        {paymentStep !== null && (activePaymentService === 'job_discovery' || (activePaymentService === 'job_analysis' && payingJobIdx !== null)) && (() => {
          // Rebuild dynamic discoveryJobs list from liveMatchedJobs
          const discoveryJobs = [];
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
                      match: Math.round((m.matchScore || 0) * 100) || Math.round(m.scores?.overall || 0),
                    });
                  }
                });
              }
            });
          }

          const isDiscovery = activePaymentService === 'job_discovery';
          const payingJob = !isDiscovery && payingJobIdx !== null ? (discoveryJobs[payingJobIdx] || { title: 'ML Engineer', company: 'Company X', match: 82 }) : null;
          const serviceTitle = isDiscovery ? 'Real-Time Job Discovery' : 'Job-Specific Resume Analysis';
          const serviceDesc = isDiscovery 
            ? 'Run Apify scraper pipeline to source live matching jobs personalized to your career.' 
            : \`\${payingJob?.title} @ \${payingJob?.company}\`;
          const servicePrice = '0.02';
          const serviceGains = isDiscovery 
            ? [
                'Scrape live matching jobs',
                'Algorithmic match tiering',
                'LinkedIn/Greenhouse/Lever jobs',
                'Last 7 days postings',
                'Resume-to-job matching'
              ]
            : [
                'Detailed skill analysis',
                'Experience comparison',
                'Project comparison',
                'Missing requirements',
                'Improvement priorities'
              ];

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
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">{serviceTitle}</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{serviceDesc}</p>
                      </div>
                      <button
                        onClick={() => setPaymentStep(null)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {!isDiscovery && payingJob && (
                      <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Estimated Profile Alignment</span>
                        <span className="text-2xl font-black text-emerald-600 block mt-1">{payingJob.match}% Match</span>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">You'll Get:</p>
                      {serviceGains.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <span className="text-indigo-600 font-black">✓</span> {item}
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Price</span>
                        <span className="text-base font-black text-indigo-700">
                          \${servicePrice} USDC
                        </span>
                      </div>
                      <button
                        onClick={async () => {
                          setPaymentStep('402');
                          try {
                            // Try direct bypass payment first (dev mode)
                            if (isDiscovery) {
                              await apiFetch(\`/api/resume/\${resumeId}/find-jobs\`, { method: 'POST' });
                              setJobDiscoveryUnlocked(true);
                              await Promise.allSettled([
                                fetchDistribution(resumeId),
                                fetchMatchedJobs(resumeId)
                              ]);
                            } else {
                              const targetJob = discoveryJobs[payingJobIdx];
                              const actualJobId = targetJob?.jobIdStr || payingJobIdx;
                              await apiFetch(\`/api/resume/jobs/\${actualJobId}/analyze\`, { method: 'POST' });
                              setJobAnalysisPaid(prev => ({ ...prev, [payingJobIdx]: true }));
                            }

                            setPaymentStep('complete');
                            setTimeout(() => {
                              setPaymentStep(null);
                              if (isDiscovery) {
                                setCurrentView('jobdisc');
                              } else {
                                setJobAnalysisDone(true);
                                setCurrentView('jobintel');
                              }
                            }, 1200);
                          } catch (directErr) {
                            // If 402 is returned, prompt wallet sign
                            if (!activeAddress) {
                              alert("Please connect your wallet first via the Manage Wallet tab.");
                              setPaymentStep(null);
                              return;
                            }
                            try {
                              const x402Fetch = await createX402Fetch({ address: activeAddress, signTransactions });
                              setPaymentStep('wallet');

                              if (isDiscovery) {
                                await x402Fetch(\`/api/resume/\${resumeId}/find-jobs\`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' }
                                });
                                setJobDiscoveryUnlocked(true);
                                await Promise.allSettled([
                                  fetchDistribution(resumeId),
                                  fetchMatchedJobs(resumeId)
                                ]);
                              } else {
                                const targetJob = discoveryJobs[payingJobIdx];
                                const actualJobId = targetJob?.jobIdStr || payingJobIdx;
                                await x402Fetch(\`/api/resume/jobs/\${actualJobId}/analyze\`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' }
                                });
                                setJobAnalysisPaid(prev => ({ ...prev, [payingJobIdx]: true }));
                              }

                              setPaymentStep('verifying');
                              setPaymentStep('complete');
                              setTimeout(() => {
                                setPaymentStep(null);
                                if (isDiscovery) {
                                  setCurrentView('jobdisc');
                                } else {
                                  setJobAnalysisDone(true);
                                  setCurrentView('jobintel');
                                }
                              }, 1200);
                            } catch (walletErr) {
                              console.error("[x402] Wallet verification failed:", walletErr);
                              alert(\`Payment verification failed: \${walletErr.message || walletErr}\`);
                              setPaymentStep(null);
                            }
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow border transition-all"
                      >
                        Pay &amp; Unlock
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
                      <p className="text-[10px] text-slate-505 font-semibold leading-relaxed">
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
                      <p className="text-[10px] text-slate-550 font-semibold leading-relaxed">
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
                      <p className="text-[10px] text-slate-550 font-semibold leading-relaxed">
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
                      <h4 className="text-sm font-black text-emerald-600">Unlocked successfully!</h4>
                      <p className="text-[10px] text-slate-550 font-semibold leading-relaxed">
                        Micropayment verified successfully. Redirecting...
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>`;

// Replace payment modal
if (!content.includes(oldModalPattern)) {
  console.error("Modal pattern not found!");
  process.exit(1);
}
content = content.replace(oldModalPattern, newModalContent);

// 6. PAGE 17: JOB-SPECIFIC REPORT (currentView === 'jobintel')
const oldJobIntelPatternStart = `              {currentView === 'jobintel' && (() => {

                // Use the last selected discovery job, or fallback to index 0
                const discoveryJobsIntel = [
                  { id: 0, title: 'ML Engineer', company: 'Google', match: 82, logo: 'G', logoBg: 'bg-blue-50', logoColor: 'text-blue-600' },
                  { id: 1, title: 'ML Engineer', company: 'Microsoft', match: 88, logo: '⊞', logoBg: 'bg-slate-50', logoColor: 'text-slate-700' },
                  { id: 2, title: 'Machine Learning Engineer', company: 'Amazon', match: 85, logo: 'a', logoBg: 'bg-orange-50', logoColor: 'text-orange-500' },
                  { id: 3, title: 'ML Engineer', company: 'Adobe', match: 82, logo: 'A', logoBg: 'bg-red-50', logoColor: 'text-red-600' },
                ];
                const intel = discoveryJobsIntel[Math.min(selectedDiscoveryJob, discoveryJobsIntel.length - 1)] || discoveryJobsIntel[0];`;

const newJobIntelPatternStart = `              {currentView === 'jobintel' && (() => {

                const discoveryJobsIntel = [];
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
                            postedAgo: j.postedAt ? \`Posted \${new Date(j.postedAt).toLocaleDateString()}\` : 'Recently',
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
                };`;

// Replace jobintel patterns
if (!content.includes(oldJobIntelPatternStart)) {
  console.error("PAGE 17 pattern not found!");
  process.exit(1);
}
content = content.replace(oldJobIntelPatternStart, newJobIntelPatternStart);

// Update matchBreakdown array definition
const oldBreakdownPattern = `                const matchBreakdown = [
                  { label: 'Overall Match',        val: 82, color: 'bg-indigo-600' },
                  { label: 'Skills',               val: 88, color: 'bg-emerald-500' },
                  { label: 'Experience',            val: 74, color: 'bg-blue-500' },
                  { label: 'Projects',              val: 91, color: 'bg-purple-500' },
                  { label: 'Education',             val: 100, color: 'bg-orange-500' },
                  { label: 'Career Alignment',      val: 86, color: 'bg-pink-500' },
                ];`;

const newBreakdownPattern = `                const matchBreakdown = [
                  { label: 'Overall Match',        val: intel.match || 82, color: 'bg-indigo-600' },
                  { label: 'Skills',               val: intel.matchScores?.skills || Math.round((intel.match || 82) * 1.05), color: 'bg-emerald-500' },
                  { label: 'Experience',            val: intel.matchScores?.experience || Math.round((intel.match || 82) * 0.9), color: 'bg-blue-500' },
                  { label: 'Projects',              val: intel.matchScores?.projects || Math.round((intel.match || 82) * 0.95), color: 'bg-purple-500' },
                  { label: 'Education',             val: intel.matchScores?.education || 100, color: 'bg-orange-500' },
                  { label: 'Career Alignment',      val: intel.matchScores?.alignment || Math.round((intel.match || 82) * 0.98), color: 'bg-pink-500' },
                ];`;

if (!content.includes(oldBreakdownPattern)) {
  console.error("breakdown pattern not found!");
  process.exit(1);
}
content = content.replace(oldBreakdownPattern, newBreakdownPattern);

// Update selected job info header in detail view
const oldJobInfoHeader = `                          <div className="w-16 h-16 rounded-2xl bg-slate-900 border flex items-center justify-center text-3xl font-black text-white flex-shrink-0">
                            𝕏
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900">ML Engineer</h3>
                            <p className="text-sm font-bold text-slate-600">Company X</p>
                            <p className="text-xs text-slate-400 font-semibold mt-2">📍 Bengaluru, India • 💼 Full-time • ⏱️ Posted 2 days ago</p>
                          </div>`;

const newJobInfoHeader = `                          <div className="w-16 h-16 rounded-2xl bg-indigo-600 border flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
                            {intel.logo}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900">{intel.title}</h3>
                            <p className="text-sm font-bold text-slate-600">{intel.company}</p>
                            <p className="text-xs text-slate-400 font-semibold mt-2">📍 {intel.location} • 💼 {intel.type} • ⏱️ {intel.postedAgo}</p>
                          </div>`;

if (!content.includes(oldJobInfoHeader)) {
  console.error("Job info header pattern not found!");
  process.exit(1);
}
content = content.replace(oldJobInfoHeader, newJobInfoHeader);

// Update circular match score percent label
content = content.replace(`strokeDasharray="82 18"`, `strokeDasharray="\${intel.match} \${100 - intel.match}"`);
content = content.replace(`<span className="text-xl font-black text-slate-900">82%</span>`, `<span className="text-xl font-black text-slate-900">\${intel.match}%</span>`);

// Update "What You Do Well" list mapping
const oldWhatYouDoWellPattern = `                        {/* What you do well */}
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
                        </div>`;

const newWhatYouDoWellPattern = `                        {/* What you do well */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                            <span className="text-emerald-500">✓</span> What You Do Well
                            <span className="text-[9px] text-slate-400 font-semibold ml-1">Your strengths that match the job requirements.</span>
                          </div>
                          <div className="space-y-2">
                            {(intel.rawMatchedSkills && intel.rawMatchedSkills.length > 0 ? intel.rawMatchedSkills : [
                              { skill: 'Python', matchingEvidence: 'Extensive experience in Python programming', confidenceScore: 0.95 },
                              { skill: 'SQL', matchingEvidence: 'Good SQL querying and database knowledge', confidenceScore: 0.85 },
                            ]).map((item, idx) => {
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
                        </div>`;

if (!content.includes(oldWhatYouDoWellPattern)) {
  console.error("WhatYouDoWell pattern not found!");
  process.exit(1);
}
content = content.replace(oldWhatYouDoWellPattern, newWhatYouDoWellPattern);

// Update "What Needs Improvement" list mapping
const oldWhatNeedsImprovementPattern = `                        {/* What needs improvement */}
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
                                <span className={\`text-[9.5px] font-black px-2 py-0.5 rounded border \${item.color}\`}>{item.prio}</span>
                              </div>
                            ))}
                          </div>
                        </div>`;

const newWhatNeedsImprovementPattern = `                        {/* What needs improvement */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                            <span className="text-amber-500">⚠</span> What Needs Improvement
                            <span className="text-[9px] text-slate-400 font-semibold ml-1">Areas to strengthen to match the job better.</span>
                          </div>
                          <div className="space-y-2">
                            {(intel.rawMissingItems && intel.rawMissingItems.length > 0 ? intel.rawMissingItems : [
                              { name: 'Docker', justification: 'Required tool not found in your resume', priority: 'High' },
                              { name: 'AWS', justification: 'Cloud experience not demonstrated', priority: 'High' },
                            ]).map((item, idx) => {
                              const gapName = item.name || item.skill || String(item);
                              const justification = item.justification || item.desc || 'Requirement missing or not found';
                              const priority = item.priority || 'Medium';
                              const color = priority === 'High' ? 'text-red-600 bg-red-50 border-red-100' : 'text-amber-600 bg-amber-50 border-amber-100';
                              return (
                                <div key={idx} className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
                                  <span className="w-24 font-black text-slate-800">{gapName}</span>
                                  <span className="flex-1 text-[10px] text-slate-500 truncate px-4">{justification}</span>
                                  <span className={\`text-[9.5px] font-black px-2 py-0.5 rounded border \${color}\`}>{priority} Priority</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>`;

if (!content.includes(oldWhatNeedsImprovementPattern)) {
  console.error("WhatNeedsImprovement pattern not found!");
  process.exit(1);
}
content = content.replace(oldWhatNeedsImprovementPattern, newWhatNeedsImprovementPattern);

// Update Right Gaps Summary column: Missing, Weak Evidence, Strong Evidence
const oldRightColPattern = `                      {/* Right: Gaps summary breakdown */}
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
                              { name: 'CI/CD', prio: 'Low Impact', color: 'bg-slate-50 text-slate-505 border-slate-200' }
                            ].map(item => (
                              <div key={item.name} className="flex justify-between items-center text-xs font-bold text-slate-700">
                                <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {item.name}</span>
                                <span className={\`text-[8px] font-black px-2 py-0.5 rounded border \${item.color}\`}>{item.prio}</span>
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
                      </div>`;

const newRightColPattern = `                      {/* Right: Gaps summary breakdown */}
                      <div className="space-y-6">
                        {/* Missing panel */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                          <h4 className="text-xs font-black text-red-600 flex items-center gap-1">🚨 Missing</h4>
                          <p className="text-[9px] text-slate-400 font-semibold">Important skills/requirements not found in your resume.</p>
                          <div className="space-y-2 pt-1">
                            {(intel.rawMissingItems && intel.rawMissingItems.length > 0 ? intel.rawMissingItems : [
                              { name: 'Docker', priority: 'High' },
                              { name: 'AWS', priority: 'High' }
                            ]).map((item) => {
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
                            {(intel.preferredSkills && intel.preferredSkills.length > 0 ? intel.preferredSkills : ['CI/CD', 'Kubernetes']).map((item) => {
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
                              ]).map((item) => {
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
                      </div>`;

if (!content.includes(oldRightColPattern)) {
  console.error("Right column summary pattern not found!");
  process.exit(1);
}
content = content.replace(oldRightColPattern, newRightColPattern);

fs.writeFileSync(targetFilePath, content, 'utf8');
console.log("SUCCESSFULLY APPLIED ALL FEATURE CHANGES TO FRONTEND PAGE!");
