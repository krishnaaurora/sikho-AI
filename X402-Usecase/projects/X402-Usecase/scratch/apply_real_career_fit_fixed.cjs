const fs = require('fs');

const filePath = 'c:\\Users\\krish\\OneDrive\\Desktop\\xx\\sikho-AI\\X402-Usecase\\projects\\X402-Usecase\\src\\pages\\ResumeIntelligence.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Search for the career fit page block start
const careerSearch = `              {/* PAGE: AUTO CAREER DETECTION */}
              {currentView === 'career' && careerSubView === 'fit' && (() => {
                const careers = [
                  { title: 'Data Scientist', desc: 'Best fit based on your skills', pct: 91, label: 'Primary Career', explanation: 'High confidence that your resume fits this career.' },
                  { title: 'Data Analyst',  desc: 'Strong alignment',             pct: 86, label: 'Alternative Career', explanation: 'Good fit with analytical tools and python core.' },
                  { title: 'ML Engineer',   desc: 'Good alignment',               pct: 74, label: 'Alternative Career', explanation: 'Requires minor evidence gaps coverage in deployment.' },
                  { title: 'AI Engineer',   desc: 'Good alignment',               pct: 69, label: 'Alternative Career', explanation: 'Requires evidence of large language model APIs.' },
                  { title: 'Software Engineer', desc: 'Moderate alignment',       pct: 42, label: 'Alternative Career', explanation: 'Declined due to lower system architecture mentions.' }
                ];
                
                const activeCareer = careers.find(c => c.title === selectedCareerOverview) || careers[0];

                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">`;

const careerReplace = `              {/* PAGE: AUTO CAREER DETECTION */}
              {currentView === 'career' && careerSubView === 'fit' && (() => {
                const rawRoles: any[] = careerFitData?.topRoles || [];
                const primaryCareer   = careerFitData?.primaryCareer || targetRole;

                const careers = rawRoles.map((r: any, idx: number) => {
                  const careerTitle = r.career || r.role || 'Career Option';
                  const confVal = Math.round(r.confidence > 1 ? r.confidence : r.confidence * 100);
                  return {
                    title: careerTitle,
                    desc: idx === 0 ? 'Best fit based on your skills' : 'Alternative Career Alignment',
                    pct: confVal,
                    label: idx === 0 ? 'Primary Career' : 'Alternative Career',
                    explanation: idx === 0 ? 'High confidence match' : 'Good fit with your profile',
                    reasons: r.reasons || [
                      \`Skills match for \${careerTitle} requirements\`,
                      \`Relevant profile details align with this direction\`
                    ]
                  };
                });
                
                const activeCareer = careers.find(c => c.title === selectedCareerOverview) || careers[0];

                return (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    
                    {careerFitLoading && (
                      <div className="animate-pulse space-y-4">
                        <div className="h-40 bg-slate-100 rounded-3xl" />
                        <div className="h-40 bg-slate-100 rounded-3xl" />
                      </div>
                    )}

                    {!careerFitLoading && careers.length === 0 && (
                      <div className="bg-white border rounded-3xl p-10 text-center space-y-4">
                        <span className="text-4xl">🧭</span>
                        <h3 className="text-base font-black text-slate-800">No Career Fit Data</h3>
                        <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
                          No career paths detected yet. Please re-run analysis in the ATS page to populate career fits.
                        </p>
                      </div>
                    )}

                    {!careerFitLoading && careers.length > 0 && activeCareer && (
                    <>`;

content = content.replace(careerSearch, careerReplace);

// 2. Wrap the end of career fit layout in the conditional closing tags:
content = content.replace(
  `                      </div>
                    </div>
                  </motion.div>
                );
              })()}


              {/* PAGE: JOB DISCOVERY */}`,
  `                      </div>
                    </div>
                    </>
                    )}
                  </motion.div>
                );
              })()}


              {/* PAGE: JOB DISCOVERY */}`
);

// 3. Dynamic reason rendering mapping:
const reasonSearch = `                        {/* Why this career fits checklist */}
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
                              <span className="text-emerald-500 text-base">✓</span> Educational qualifications support this direction
                            </li>
                          </ul>
                        </div>`;

const reasonReplace = `                        {/* Why this career fits checklist */}
                        <div className="space-y-3">
                          <span className="text-[9px] font-black text-slate-450 uppercase block">Why this career fits</span>
                          <ul className="space-y-2 text-[10px] font-bold text-slate-600">
                            {activeCareer.reasons.map((r: string, idx: number) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-emerald-500 text-base">✓</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>`;

content = content.replace(reasonSearch, reasonReplace);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Real career fit data integrated successfully!");
