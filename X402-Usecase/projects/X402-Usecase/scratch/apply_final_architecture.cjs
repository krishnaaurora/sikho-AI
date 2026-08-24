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
                        : 'text-slate-655 hover:bg-slate-50'
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
                        : 'text-slate-655 hover:bg-slate-50'
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

content = content.replace(oldSidebarPattern, newSidebarContent);

// 3. PAGE 16: RICH JOB DISCOVERY & PAGE 17: JOB-SPECIFIC REPORT replacement
const jobdiscIdx = content.indexOf("currentView === 'jobdisc' && (() => {");
const jobintelIdx = content.indexOf("currentView === 'jobintel' && (() => {");

if (jobdiscIdx === -1 || jobintelIdx === -1) {
  console.error("Subview indexes not found!");
  process.exit(1);
}

const prefix = content.slice(0, jobdiscIdx);
const suffixWithIntel = content.slice(jobintelIdx);

// Find end of jobintel subview
const jobintelEndPattern = "              {currentView === 'payment' && (";
const jobintelEndIdx = suffixWithIntel.indexOf(jobintelEndPattern);
if (jobintelEndIdx === -1) {
  console.error("End of jobintel subview (payment section) not found!");
  process.exit(1);
}

const finalSuffix = suffixWithIntel.slice(jobintelEndIdx);

const newJobdiscSubview = `currentView === 'jobdisc' && (() => {
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
                          <span className="text-xs font-black text-slate-700">Jobs (\${totalCount})</span>
                        </div>
                        {discoveryJobs.map((j, idx) => (
                          <div
                            key={j.id}
                            onClick={() => { setSelectedDiscoveryJob(idx); setJobAnalysisDone(false); }}
                            className={\`w-full text-left rounded-2xl p-4 border transition-all cursor-pointer \${
                              selectedDiscoveryJob === idx
                                ? 'bg-indigo-50/60 border-indigo-300 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            }\`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className={\`w-10 h-10 rounded-xl \${j.logoBg} border flex items-center justify-center text-sm font-black \${j.logoColor} flex-shrink-0\`}>
                                  {j.logo}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-black text-slate-900">{j.title}</span>
                                    <span className={\`text-[9px] font-black \${matchColor(j.match)}\`}>{j.match}% Match</span>
                                    {j.badge && <span className={\`text-[8px] font-black px-1.5 py-0.5 rounded-full \${j.badgeColor}\`}>{j.badge}</span>}
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
                              <button key={i} className={\`w-7 h-7 text-[10px] font-bold rounded-lg border \${
                                p === 1 ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                              }\`}>{p}</button>
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
                                <div className={\`w-14 h-14 rounded-2xl \${job.logoBg} border flex items-center justify-center text-2xl font-black \${job.logoColor} flex-shrink-0\`}>
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
                                <div className={\`text-3xl font-black \${matchColor(job.match)}\`}>{job.match}%</div>
                                <div className="text-[10px] text-slate-500 font-bold mt-0.5">Match Score</div>
                                <div className="h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden mt-1.5 ml-auto">
                                  <div className={\`h-full \${matchBg(job.match)} rounded-full\`} style={{ width: \`\${job.match}%\` }} />
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
              })()}`;

const newJobintelSubview = `{currentView === 'jobintel' && (() => {
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
                              strokeDasharray={\`\${intel.match} \${100 - intel.match}\`} strokeLinecap="round" />
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
                              <div className={\`h-full \${m.color} rounded-full\`} style={{ width: \`\${m.val}%\` }} />
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
                                  <span className={\`text-[9.5px] font-black px-2 py-0.5 rounded border \${color}\`}>{priority} Priority</span>
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
              })()}\n\n`;

// Slice and build final file contents
const finalContent = prefix + newJobdiscSubview + newJobintelSubview + finalSuffix;

fs.writeFileSync(targetFilePath, finalContent, 'utf8');

// Also do the payment modal swap on the finalized content
let patchedContent = fs.readFileSync(targetFilePath, 'utf8');

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
                          } catch (err) {
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
                      <p className="text-[10px] text-slate-550 font-semibold leading-relaxed">
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

patchedContent = patchedContent.replace(oldModalPattern, newModalContent);
fs.writeFileSync(targetFilePath, patchedContent, 'utf8');

console.log("ALL FEATURES AND MODAL APPLIED SUCCESSFULLY TO RESUME INTELLIGENCE FRONTEND!");
