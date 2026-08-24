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

content = content.replace(oldSidebarPattern, newSidebarContent);

// 3. Replace jobdisc and jobintel subviews
const jobdiscIdx = content.indexOf("currentView === 'jobdisc' && (() => {");
const jobintelIdx = content.indexOf("currentView === 'jobintel' && (() => {");

if (jobdiscIdx === -1 || jobintelIdx === -1) {
  console.error("Subview indexes not found!");
  process.exit(1);
}

// Slice out the jobdisc block
const prefix = content.slice(0, jobdiscIdx);
// Find ending of jobdisc subview by searching backwards from jobintelIdx or looking for "})()}"
const suffixWithIntel = content.slice(jobintelIdx);

// Build new jobdisc subview implementation
const newJobdiscSubview = `currentView === 'jobdisc' && (() => {
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
                  pct >= 90 ? 'text-emerald-600' : pct >= 80 ? 'text-indigo-600' : pct >= 70 ? 'text-amber-600' : 'text-red-505';
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
                              <p className="text-xs text-slate-655 font-medium leading-relaxed">{job.overview}</p>
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
              })()}\n\n`;

// Find where jobdisc finishes (right before jobintel start)
const jobdiscFinishIdx = suffixWithIntel.indexOf("currentView === 'jobintel'");
if (jobdiscFinishIdx === -1) {
  console.error("Jobintel subview finish index not found!");
  process.exit(1);
}

const middlePartAndSuffix = suffixWithIntel.slice(jobdiscFinishIdx);

// Now patch jobintel subview inside middlePartAndSuffix
let suffixWithIntelPatched = middlePartAndSuffix;

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
                            logoColor: 'text-indigo-655',
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

if (!suffixWithIntelPatched.includes(oldJobIntelPatternStart)) {
  console.error("oldJobIntelPatternStart not found inside middlePartAndSuffix!");
  process.exit(1);
}
suffixWithIntelPatched = suffixWithIntelPatched.replace(oldJobIntelPatternStart, newJobIntelPatternStart);

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

if (!suffixWithIntelPatched.includes(oldBreakdownPattern)) {
  console.error("breakdown pattern not found inside middlePartAndSuffix!");
  process.exit(1);
}
suffixWithIntelPatched = suffixWithIntelPatched.replace(oldBreakdownPattern, newBreakdownPattern);

// Update selected job info header in detail view
const oldJobInfoHeader = `                          <div className="w-16 h-16 rounded-2xl bg-slate-900 border flex items-center justify-center text-3xl font-black text-white flex-shrink-0">
                            𝕏
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-900">ML Engineer</h3>
                            <p className="text-sm font-bold text-slate-650">Company X</p>
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

if (!suffixWithIntelPatched.includes(oldJobInfoHeader)) {
  console.error("Job info header pattern not found inside middlePartAndSuffix!");
  process.exit(1);
}
suffixWithIntelPatched = suffixWithIntelPatched.replace(oldJobInfoHeader, newJobInfoHeader);

// Update circular match score percent label
suffixWithIntelPatched = suffixWithIntelPatched.replace(`strokeDasharray="82 18"`, `strokeDasharray={\`\${intel.match} \${100 - intel.match}\`}`);
suffixWithIntelPatched = suffixWithIntelPatched.replace(`<span className="text-xl font-black text-slate-900">82%</span>`, `<span className="text-xl font-black text-slate-900">{intel.match}%</span>`);

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

if (!suffixWithIntelPatched.includes(oldWhatYouDoWellPattern)) {
  console.error("WhatYouDoWell pattern not found inside middlePartAndSuffix!");
  process.exit(1);
}
suffixWithIntelPatched = suffixWithIntelPatched.replace(oldWhatYouDoWellPattern, newWhatYouDoWellPattern);

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
                                <span className={\`text-[9.5px] font-black px-2 py-0.5 rounded border \...
// Wait, the what needs improvement template has color: text-amber-600. Let's look up the exact template in lines 3180-3200 of file
`;

// Let's write the complete patch file directly to be absolutely sure.
fs.writeFileSync(targetFilePath, prefix + newJobdiscSubview + suffixWithIntelPatched, 'utf8');
console.log("SUCCESSFULLY APPLIED FRONTEND WORKSPACE UPDATES!");
