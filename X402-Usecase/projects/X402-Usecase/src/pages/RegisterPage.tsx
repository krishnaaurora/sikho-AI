import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Mail, Lock, User, ArrowRight, Sparkles, BookOpen, Brain, Code2, Microscope, Compass } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Wizard state: Step 1 (Credentials), Step 2 (Learner Profile), Step 3 (Interests & Goals)
  const [step, setStep] = useState(1);

  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    educationLevel: 'Undergraduate',
    interests: [] as string[],
    currentSkills: [] as string[],
    targetRole: 'Software Engineer',
    experienceLevel: 'Beginner',
    preferredLanguage: 'English',
    whatAreYouHereToDo: [] as string[]
  });

  const [interestInput, setInterestInput] = useState('');
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard/learner');
      }
    }
  }, [user, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setStep(1);
      return;
    }

    setIsLoading(true);

    try {
      await register(registerData);
      setSuccess('Registration & Onboarding complete! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInterest = () => {
    if (interestInput.trim() && !registerData.interests.includes(interestInput.trim())) {
      setRegisterData({
        ...registerData,
        interests: [...registerData.interests, interestInput.trim()]
      });
      setInterestInput('');
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !registerData.currentSkills.includes(skillInput.trim())) {
      setRegisterData({
        ...registerData,
        currentSkills: [...registerData.currentSkills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const toggleGoal = (goal: string) => {
    const activeGoals = registerData.whatAreYouHereToDo;
    if (activeGoals.includes(goal)) {
      setRegisterData({
        ...registerData,
        whatAreYouHereToDo: activeGoals.filter(g => g !== goal)
      });
    } else {
      setRegisterData({
        ...registerData,
        whatAreYouHereToDo: [...activeGoals, goal]
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left side: Premium Split Graphic (Hidden on mobile) */}
      <div className="hidden lg:relative lg:flex lg:w-1/2 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] opacity-70" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
        
        {/* Top-Left Logo */}
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2.5 z-20">
          <span className="text-white font-black text-2xl tracking-wider">SikhoAI</span>
        </Link>

        {/* Bottom Text Overlay */}
        <div className="absolute bottom-16 left-12 right-12 z-20 text-white">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold rounded-full uppercase tracking-wider">
            Onboarding Dashboard
          </span>
          <h3 className="text-4xl font-extrabold tracking-tight mt-4 leading-tight">
            Construct Your Personal Learning Roadmap
          </h3>
          <p className="mt-4 text-base text-slate-400 max-w-lg leading-relaxed">
            Onboard directly to generate adaptive concepts, solve code reviews, practice quizzes, and build career progressions.
          </p>
        </div>
      </div>

      {/* Right side: Onboarding Form Wizard */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-lg">
          
          {/* Progress Indicators */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
              <span className="text-xs font-bold text-slate-700">Account</span>
            </div>
            <div className="h-px bg-slate-200 flex-1 mx-4" />
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
              <span className="text-xs font-bold text-slate-700">Profile</span>
            </div>
            <div className="h-px bg-slate-200 flex-1 mx-4" />
            <div className="flex items-center gap-2">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
              <span className="text-xs font-bold text-slate-700">Goals</span>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {step === 1 ? "Create your account" : step === 2 ? "Configure Learner Profile" : "What are you here to do?"}
          </h2>
          <p className="text-xs text-slate-500 font-semibold mb-6">
            {step === 1 ? "Fill in your secure credentials to get started." : step === 2 ? "Let's customize the workspace to your education level." : "Select your primary goals and focus areas."}
          </p>

          {error && (
            <div className="p-3.5 mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 mb-6 bg-green-50 border border-green-200 text-green-600 rounded-xl text-sm font-semibold flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            
            {/* STEP 1: ACCOUNT CREDENTIALS */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Full Name</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><User size={16} /></div>
                    <input
                      type="text"
                      required
                      value={registerData.fullName}
                      onChange={e => setRegisterData({ ...registerData, fullName: e.target.value })}
                      className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-950 placeholder-slate-400 outline-none focus:border-blue-500 transition-all font-semibold"
                      placeholder="Jai Kumar"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Email Address</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Mail size={16} /></div>
                    <input
                      type="email"
                      required
                      value={registerData.email}
                      onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                      className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-950 placeholder-slate-400 outline-none focus:border-blue-500 transition-all font-semibold"
                      placeholder="jai@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Password</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Lock size={16} /></div>
                    <input
                      type="password"
                      required
                      value={registerData.password}
                      onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                      className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-950 placeholder-slate-400 outline-none focus:border-blue-500 transition-all font-semibold"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Confirm Password</label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Lock size={16} /></div>
                    <input
                      type="password"
                      required
                      value={registerData.confirmPassword}
                      onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-950 placeholder-slate-400 outline-none focus:border-blue-500 transition-all font-semibold"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!registerData.fullName || !registerData.email || !registerData.password) {
                        setError('Please complete all credential fields');
                        return;
                      }
                      setError('');
                      setStep(2);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Continue to Profile Configuration</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: LEARNER PROFILE */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Education Level</label>
                    <select
                      value={registerData.educationLevel}
                      onChange={e => setRegisterData({ ...registerData, educationLevel: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs font-bold text-slate-750 outline-none"
                    >
                      <option value="High School">High School</option>
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Professional">Professional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Preferred Language</label>
                    <select
                      value={registerData.preferredLanguage}
                      onChange={e => setRegisterData({ ...registerData, preferredLanguage: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs font-bold text-slate-750 outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Target Role</label>
                    <input
                      type="text"
                      value={registerData.targetRole}
                      onChange={e => setRegisterData({ ...registerData, targetRole: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                      placeholder="e.g. ML Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Experience Level</label>
                    <select
                      value={registerData.experienceLevel}
                      onChange={e => setRegisterData({ ...registerData, experienceLevel: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs font-bold text-slate-750 outline-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Add dynamic lists for interests and current skills */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Interests</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={interestInput}
                      onChange={e => setInterestInput(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                      placeholder="e.g. Distributed Systems"
                    />
                    <button
                      type="button"
                      onClick={handleAddInterest}
                      className="px-4 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {registerData.interests.map((it, idx) => (
                      <span key={idx} className="bg-blue-50 border border-blue-150 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {it}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Current Skills</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-xs font-semibold text-slate-800 outline-none"
                      placeholder="e.g. Python"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {registerData.currentSkills.map((sk, idx) => (
                      <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Configure Goals</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: GOALS SELECTOR */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { key: "Learn", desc: "Understand concepts deeply", icon: <BookOpen className="text-blue-500" size={16} /> },
                    { key: "Practice", desc: "Practice coding & assessments", icon: <Brain className="text-emerald-500" size={16} /> },
                    { key: "Build", desc: "Build hands-on prototypes", icon: <Code2 className="text-indigo-500" size={16} /> },
                    { key: "Research", desc: "Analyze research publications", icon: <Microscope className="text-rose-500" size={16} /> },
                    { key: "Career", desc: "Plan roadmap & target roles", icon: <Compass className="text-amber-500" size={16} /> }
                  ].map((goalObj) => (
                    <button
                      key={goalObj.key}
                      type="button"
                      onClick={() => toggleGoal(goalObj.key)}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all ${
                        registerData.whatAreYouHereToDo.includes(goalObj.key)
                          ? 'border-blue-500 bg-blue-50/20 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="p-2 bg-slate-50 rounded-lg border">
                        {goalObj.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-800">{goalObj.key}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{goalObj.desc}</p>
                      </div>
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        registerData.whatAreYouHereToDo.includes(goalObj.key)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {registerData.whatAreYouHereToDo.includes(goalObj.key) && <span className="text-[8px]">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? "Saving Profile..." : "Complete Registration & Onboard"}
                  </button>
                </div>
              </div>
            )}
            
          </form>

          <div className="mt-8 pt-4 border-t border-slate-150 text-center">
            <p className="text-xs text-slate-400 font-semibold">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">
                Log in here
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
