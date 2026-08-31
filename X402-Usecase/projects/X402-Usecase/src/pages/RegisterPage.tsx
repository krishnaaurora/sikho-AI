import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  Mail, Lock, User, Sparkles, ArrowRight, ArrowLeft, Check, 
  Search, Plus, X, UploadCloud, Rocket, HelpCircle, Briefcase, 
  GraduationCap, ChevronDown, CheckCircle2, Clock, Globe, Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '../utils/api';

const RegisterPage: React.FC = () => {
  const { register, user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1: REGISTER, 2: WELCOME, 3: ABOUT YOU, 4: CAREER DIRECTION, 
  // 5: CAREER DETAILS / DISCOVERY, 6: SKILLS, 7: EXPERIENCE, 
  // 8: RESUME, 9: AVAILABILITY, 10: AI PROFILE CREATED
  const [step, setStep] = useState(1);

  // Registration data
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    termsAccepted: false
  });

  // Onboarding states
  const [aboutYou, setAboutYou] = useState({
    collegeUniversity: '',
    degree: '',
    specialization: '',
    graduationYear: '',
    currentYear: '',
    currentSemester: ''
  });

  const [careerDirection, setCareerDirection] = useState(''); // 'exactly', 'ideas', 'not_sure'

  // If known goal / ideas:
  const [careerGoal, setCareerGoal] = useState({
    targetRole: '',
    preferredIndustry: '',
    targetCompanies: [] as string[],
    preferredLocations: [] as string[],
    targetTimeline: '',
    expectedSalary: ''
  });

  // If no idea (discovery path):
  const [discoveryAnswers, setDiscoveryAnswers] = useState({
    interests: [] as string[],
    preferredScenario: ''
  });

  // Skills
  const [userSkills, setUserSkills] = useState<{ name: string; proficiency: 'Beginner' | 'Intermediate' | 'Advanced' }[]>([]);
  const [isJustStartingSkills, setIsJustStartingSkills] = useState(false);

  // Experience
  const [hasNoExperience, setHasNoExperience] = useState(false);
  const [experience, setExperience] = useState({
    projects: [] as any[],
    internships: [] as any[],
    hackathons: [] as any[],
    certifications: [] as any[],
    openSource: [] as any[],
    achievements: [] as any[]
  });

  // Resume
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeName, setResumeName] = useState('');

  // Learning Availability
  const [learningAvailability, setLearningAvailability] = useState({
    timePerDay: '',
    preferredTime: ''
  });

  // Sub-inputs
  const [targetCompanyInput, setTargetCompanyInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Experience modals and temp forms
  const [activeExpModal, setActiveExpModal] = useState<string | null>(null);
  const [projForm, setProjForm] = useState({ title: '', desc: '' });
  const [internForm, setInternForm] = useState({ company: '', role: '', duration: '' });
  const [hackForm, setHackForm] = useState({ name: '', project: '' });
  const [certForm, setCertForm] = useState({ name: '', issuer: '' });
  const [ossForm, setOssForm] = useState({ repo: '', desc: '' });
  const [achieveForm, setAchieveForm] = useState({ title: '', issuer: '' });

  // AI analysis simulation
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);

  useEffect(() => {
    if (user && user.onboardingCompleted) {
      if (user.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else {
        navigate('/dashboard/learner', { replace: true });
      }
    }
  }, [user, navigate]);

  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!registerData.termsAccepted) {
      setError('You must agree to the Terms & Privacy Policy');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        fullName: registerData.fullName,
        email: registerData.email,
        password: registerData.password,
        confirmPassword: registerData.confirmPassword,
        country: registerData.country
      });
      // Immediately move to Welcome
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Start analysis loader
  const triggerAIAnalysis = () => {
    setIsAnalysisRunning(true);
    setStep(10);
    setAnalysisProgress(0);
    setAnalysisStep(0);
  };

  useEffect(() => {
    if (isAnalysisRunning) {
      const interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsAnalysisRunning(false);
            return 100;
          }
          const nextVal = prev + Math.floor(Math.random() * 8) + 4;
          return nextVal > 100 ? 100 : nextVal;
        });
      }, 250);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isAnalysisRunning]);

  useEffect(() => {
    if (isAnalysisRunning) {
      if (analysisProgress < 15) setAnalysisStep(0);
      else if (analysisProgress < 30) setAnalysisStep(1);
      else if (analysisProgress < 45) setAnalysisStep(2);
      else if (analysisProgress < 60) setAnalysisStep(3);
      else if (analysisProgress < 75) setAnalysisStep(4);
      else if (analysisProgress < 90) setAnalysisStep(5);
      else setAnalysisStep(6);
    }
  }, [analysisProgress, isAnalysisRunning]);

  const finishOnboarding = async () => {
    setIsLoading(true);
    try {
      // Package onboarding metrics
      const payload = {
        // About You
        collegeUniversity: aboutYou.collegeUniversity || 'I haven\'t decided yet',
        degree: aboutYou.degree || 'Not sure',
        specialization: aboutYou.specialization || 'Not sure',
        graduationYear: aboutYou.graduationYear || 'Not sure',
        currentYearSemester: `${aboutYou.currentYear || 'Not sure'} / ${aboutYou.currentSemester || 'Not sure'}`,
        
        // Career Direction
        careerJourneyState: careerDirection === 'exactly' 
          ? 'Exactly what I want' 
          : careerDirection === 'ideas' 
          ? 'A few ideas' 
          : 'I don\'t know yet',

        // Goals / Discovery
        targetRole: careerGoal.targetRole || 'Exploring',
        preferredIndustry: careerGoal.preferredIndustry || 'Technology',
        targetCompanies: careerGoal.targetCompanies,
        preferredLocations: careerGoal.preferredLocations,
        targetTimeline: careerGoal.targetTimeline || 'Not sure',
        expectedSalary: careerGoal.expectedSalary || 'Not sure',
        careerDiscoveryAnswers: discoveryAnswers,

        // Skills & Proficiencies
        currentSkills: isJustStartingSkills ? [] : userSkills.map(s => s.name),
        skillProficiencies: isJustStartingSkills 
          ? {} 
          : userSkills.reduce((acc: any, s) => { acc[s.name] = s.proficiency; return acc; }, {}),
        experienceLevel: isJustStartingSkills ? 'Beginner' : (userSkills.some(s => s.proficiency === 'Advanced') ? 'Advanced' : 'Intermediate'),

        // Experience
        projects: hasNoExperience ? [] : experience.projects,
        internships: hasNoExperience ? [] : experience.internships,
        hackathons: hasNoExperience ? [] : experience.hackathons,
        certifications: hasNoExperience ? [] : experience.certifications,
        openSource: hasNoExperience ? [] : experience.openSource,
        achievements: hasNoExperience ? [] : experience.achievements,

        // Resume & Availability
        resumeText: resumeUploaded ? 'Uploaded' : '',
        learningTimePerDay: learningAvailability.timePerDay || 'I\'m not sure',
        preferredLearningTime: learningAvailability.preferredTime || 'Evening',
        country: registerData.country,
        onboardingCompleted: true
      };

      await authApi.updateProfile(payload);
      await checkAuth();
      navigate('/dashboard/learner');
    } catch (err) {
      console.error(err);
      navigate('/dashboard/learner');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper arrays
  const countries = ["India", "United States", "United Kingdom", "Canada", "Australia", "Singapore", "Germany", "United Arab Emirates"];
  const industries = ["AI / Technology", "Finance / Fintech", "Healthcare", "E-commerce", "Education", "Consulting", "Other"];
  const degrees = ["B.Tech", "B.E.", "B.Sc", "M.Tech", "M.Sc", "M.B.A.", "B.C.A.", "M.C.A.", "Not sure"];
  const specializations = ["Artificial Intelligence & ML", "Computer Science & Eng", "Data Science", "Information Technology", "Electronics & Comm", "Not sure"];
  const gradYears = ["2025", "2026", "2027", "2028", "2029", "2030", "Not sure"];
  const currentYears = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate", "Not sure"];
  const currentSemesters = ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester", "Not sure"];
  
  const suggestedSkills = ["Python", "PyTorch", "SQL", "C++", "TensorFlow", "JavaScript", "React", "Git", "Docker", "Machine Learning", "Statistics"];
  
  const learningHours = ["<30 min/day", "30–60 min/day", "1–2 hours/day", "2–4 hours/day", "4+ hours/day", "My schedule changes", "I'm not sure"];
  const preferredTimes = ["Morning", "Afternoon", "Evening", "Night"];

  // Skills selectors mapping
  const toggleSkill = (skill: string) => {
    setIsJustStartingSkills(false);
    const existing = userSkills.find(s => s.name === skill);
    if (existing) {
      setUserSkills(userSkills.filter(s => s.name !== skill));
    } else {
      setUserSkills([...userSkills, { name: skill, proficiency: 'Intermediate' }]);
    }
  };

  const updateSkillProficiency = (skillName: string, level: 'Beginner' | 'Intermediate' | 'Advanced') => {
    setUserSkills(userSkills.map(s => s.name === skillName ? { ...s, proficiency: level } : s));
  };

  const addCustomSkill = () => {
    if (customSkillInput.trim()) {
      const name = customSkillInput.trim();
      if (!userSkills.find(s => s.name === name)) {
        setUserSkills([...userSkills, { name, proficiency: 'Intermediate' }]);
      }
      setCustomSkillInput('');
    }
  };

  // Companies & Locations tag builders
  const addTargetCompany = () => {
    if (targetCompanyInput.trim() && !careerGoal.targetCompanies.includes(targetCompanyInput.trim())) {
      setCareerGoal({ ...careerGoal, targetCompanies: [...careerGoal.targetCompanies, targetCompanyInput.trim()] });
      setTargetCompanyInput('');
    }
  };

  const addLocation = () => {
    if (locationInput.trim() && !careerGoal.preferredLocations.includes(locationInput.trim())) {
      setCareerGoal({ ...careerGoal, preferredLocations: [...careerGoal.preferredLocations, locationInput.trim()] });
      setLocationInput('');
    }
  };

  // Career Discovery checkboxes
  const toggleDiscoveryInterest = (interest: string) => {
    const list = discoveryAnswers.interests;
    if (list.includes(interest)) {
      setDiscoveryAnswers({ ...discoveryAnswers, interests: list.filter(i => i !== interest) });
    } else {
      setDiscoveryAnswers({ ...discoveryAnswers, interests: [...list, interest] });
    }
  };

  // Render persistent progress bar
  const renderProgressBar = (activeItem: 'career' | 'skills' | 'experience' | 'resume' | 'availability') => {
    const steps = [
      { id: 'career', label: 'Career' },
      { id: 'skills', label: 'Skills' },
      { id: 'experience', label: 'Experience' },
      { id: 'resume', label: 'Resume' },
      { id: 'availability', label: 'Availability' }
    ];
    const currentIndex = steps.findIndex(s => s.id === activeItem);

    return (
      <div className="max-w-md mx-auto mb-8">
        <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase mb-2">
          {steps.map((s, idx) => (
            <span key={s.id} className={idx === currentIndex ? 'text-indigo-650 font-black' : 'text-slate-400 font-semibold'}>
              {s.label}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between relative">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-200" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2.5px] bg-indigo-600 transition-all duration-300"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((s, idx) => (
            <div 
              key={s.id} 
              className={`w-3.5 h-3.5 rounded-full border-2 relative z-10 transition-colors ${
                idx <= currentIndex ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  // Check if Case B (Zero-Start User)
  const isCaseB = () => {
    return careerDirection === 'not_sure' || isJustStartingSkills || hasNoExperience;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <AnimatePresence mode="wait">
        
        {/* ========================================================
            SCREEN 01: REGISTER
           ======================================================== */}
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)]"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
                Career<span className="text-indigo-600 bg-gradient-to-r from-indigo-600 via-purple-650 to-pink-500 bg-clip-text text-transparent">X402</span>
              </h2>
              <p className="text-slate-500 text-sm font-semibold mt-1">Create your account to start your career journey</p>
            </div>

            {error && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={registerData.fullName}
                  onChange={e => setRegisterData({ ...registerData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none focus:border-indigo-500"
                  placeholder="Jai Krishna"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={registerData.email}
                  onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none focus:border-indigo-500"
                  placeholder="jai@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={registerData.password}
                  onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none focus:border-indigo-500"
                  placeholder="Create a password"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={registerData.confirmPassword}
                  onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none focus:border-indigo-500"
                  placeholder="Confirm your password"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Country</label>
                <select
                  required
                  value={registerData.country}
                  onChange={e => setRegisterData({ ...registerData, country: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm font-semibold outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>Select your country</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="terms"
                  checked={registerData.termsAccepted}
                  onChange={e => setRegisterData({ ...registerData, termsAccepted: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="terms" className="text-xs text-slate-500 font-semibold leading-none">
                  I agree to the <span className="text-indigo-600 font-bold hover:underline cursor-pointer">Terms &amp; Privacy Policy</span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
              >
                {isLoading ? "Creating Account..." : "Create Account →"}
              </Button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
              <span className="relative bg-white px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">or continue with</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-colors">
                Google
              </button>
              <button className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-colors">
                GitHub
              </button>
            </div>

            <div className="mt-6 text-center text-xs font-bold text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            SCREEN 02: WELCOME
           ======================================================== */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-center relative overflow-hidden"
          >
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1">
              Welcome to Career<span className="text-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">X402</span> 👋
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-semibold">
              Your AI-powered career workspace.
            </p>

            <div className="my-8 relative h-32 flex items-center justify-center">
              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Rocket size={64} className="text-indigo-600 rotate-45" />
              </motion.div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 text-left border border-slate-100 mb-6">
              <div className="space-y-4 text-xs font-extrabold text-slate-700">
                <div className="flex items-start gap-3">
                  <span className="text-lg">🎯</span>
                  <div>
                    <h4 className="font-bold text-slate-800">Build your career path</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Explore roles and plan personalized roadmaps</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">📚</span>
                  <div>
                    <h4 className="font-bold text-slate-800">Learn and practice with AI</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Custom exercises, assessments, and labs</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-lg">🚀</span>
                  <div>
                    <h4 className="font-bold text-slate-800">Move toward real opportunities</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Align skills with actual internships and jobs</p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setStep(3)}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <span>Let's build your profile</span>
              <ArrowRight size={16} />
            </Button>
            <span className="text-[10px] font-bold text-slate-400 mt-3 block">
              Takes about 3–5 minutes. You can change your information later.
            </span>
          </motion.div>
        )}

        {/* ========================================================
            SCREEN 03: ABOUT YOU (EDUCATION)
           ======================================================== */}
        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)]"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tell us about yourself</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">This helps CareerX402 understand your academic background</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">College / University</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                    <GraduationCap size={16} />
                  </div>
                  <input
                    type="text"
                    value={aboutYou.collegeUniversity}
                    onChange={e => setAboutYou({ ...aboutYou, collegeUniversity: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none focus:border-indigo-500"
                    placeholder="e.g. Jawahar Institute of Technology, or I haven't decided yet"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Degree</label>
                  <select
                    value={aboutYou.degree}
                    onChange={e => setAboutYou({ ...aboutYou, degree: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>Select degree</option>
                    {degrees.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Specialization</label>
                  <select
                    value={aboutYou.specialization}
                    onChange={e => setAboutYou({ ...aboutYou, specialization: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>Select specialization</option>
                    {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Graduation Year</label>
                  <select
                    value={aboutYou.graduationYear}
                    onChange={e => setAboutYou({ ...aboutYou, graduationYear: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-xs font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>Select year</option>
                    {gradYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Year</label>
                  <select
                    value={aboutYou.currentYear}
                    onChange={e => setAboutYou({ ...aboutYou, currentYear: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-xs font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>Select year</option>
                    {currentYears.map(cy => <option key={cy} value={cy}>{cy}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Semester</label>
                  <select
                    value={aboutYou.currentSemester}
                    onChange={e => setAboutYou({ ...aboutYou, currentSemester: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-xs font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>Select semester</option>
                    {currentSemesters.map(cs => <option key={cs} value={cs}>{cs}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            SCREEN 04: CAREER DIRECTION
           ======================================================== */}
        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)]"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Where are you in your career journey?</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">This helps us guide you better</p>
            </div>

            <div className="space-y-4">
              {[
                { 
                  id: 'exactly',
                  title: '🎯 I know exactly what I want',
                  desc: 'I already have a career goal and clear target role.'
                },
                { 
                  id: 'ideas',
                  title: '💡 I have a few ideas',
                  desc: 'I am considering several possible career directions.'
                },
                { 
                  id: 'not_sure',
                  title: '🧭 I don\'t know yet',
                  desc: 'Help me discover the right career path.'
                }
              ].map((card) => (
                <button
                  key={card.id}
                  onClick={() => setCareerDirection(card.id)}
                  className={`w-full flex flex-col p-5 rounded-2xl border text-left transition-all ${
                    careerDirection === card.id 
                      ? 'border-indigo-600 bg-indigo-50/15 shadow-sm' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <h4 className="text-base font-bold text-slate-800">{card.title}</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-1 leading-relaxed">{card.desc}</p>
                </button>
              ))}

              <div className="flex gap-4 pt-4 border-t border-slate-100 mt-6">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  disabled={!careerDirection}
                  onClick={() => setStep(5)}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-755 disabled:bg-indigo-400 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            SCREEN 05: CAREER DETAILS / DISCOVERY (ADAPTIVE BRANCH)
           ======================================================== */}
        {step === 5 && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)]"
          >
            {careerDirection !== 'not_sure' ? (
              // CASE A / BRANCH: WHAT DO YOU WANT TO BECOME?
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">What do you want to become?</h2>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Career Goal / Role</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Briefcase size={16} />
                    </div>
                    <input
                      type="text"
                      value={careerGoal.targetRole}
                      onChange={e => setCareerGoal({ ...careerGoal, targetRole: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none focus:border-indigo-500"
                      placeholder="e.g. Machine Learning Engineer, Software Engineer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Industry</label>
                  <select
                    value={careerGoal.preferredIndustry}
                    onChange={e => setCareerGoal({ ...careerGoal, preferredIndustry: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>Select industry</option>
                    {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Target Companies</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={targetCompanyInput}
                        onChange={e => setTargetCompanyInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 border rounded-xl text-xs outline-none"
                        placeholder="e.g. Google"
                      />
                      <button 
                        type="button" 
                        onClick={addTargetCompany}
                        className="px-3 bg-indigo-50 border border-indigo-150 text-indigo-650 rounded-xl text-xs font-bold"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {careerGoal.targetCompanies.map(c => (
                        <span key={c} className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          {c} <X size={10} className="cursor-pointer" onClick={() => setCareerGoal({ ...careerGoal, targetCompanies: careerGoal.targetCompanies.filter(co => co !== c) })} />
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Preferred Locations</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={locationInput}
                        onChange={e => setLocationInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 border rounded-xl text-xs outline-none"
                        placeholder="e.g. Bangalore"
                      />
                      <button 
                        type="button" 
                        onClick={addLocation}
                        className="px-3 bg-indigo-50 border border-indigo-150 text-indigo-650 rounded-xl text-xs font-bold"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {careerGoal.preferredLocations.map(loc => (
                        <span key={loc} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          {loc} <X size={10} className="cursor-pointer" onClick={() => setCareerGoal({ ...careerGoal, preferredLocations: careerGoal.preferredLocations.filter(l => l !== loc) })} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Timeline</label>
                    <select
                      value={careerGoal.targetTimeline}
                      onChange={e => setCareerGoal({ ...careerGoal, targetTimeline: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 text-sm font-semibold outline-none focus:border-indigo-500"
                    >
                      <option value="" disabled>Select timeline</option>
                      <option value="6 months">6 Months</option>
                      <option value="1 year">1 Year</option>
                      <option value="2 years">2 Years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expected Salary (Optional)</label>
                    <input
                      type="text"
                      value={careerGoal.expectedSalary}
                      onChange={e => setCareerGoal({ ...careerGoal, expectedSalary: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none focus:border-indigo-500"
                      placeholder="e.g. ₹8 – ₹12 LPA"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // CASE B / DISCOVERY BRANCH: WE'LL HELP YOU DISCOVER ONE
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Career Discovery</span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">That's okay. We'll help you discover one.</h2>
                  <p className="text-slate-450 text-xs font-semibold mt-1">You don't need to have your career figured out before starting.</p>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    What sounds interesting to you?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Building things", "Solving problems", "Working with data", 
                      "Creating designs", "Researching", "Working with people", 
                      "Business", "Technology"
                    ].map((item) => {
                      const isSelected = discoveryAnswers.interests.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleDiscoveryInterest(item)}
                          className={`py-2 px-3 border rounded-xl text-left text-xs font-bold transition-all ${
                            isSelected 
                              ? 'border-indigo-650 bg-indigo-50/20 text-indigo-650' 
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">
                    Which project scenario sounds most interesting?
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'A', text: 'Build an AI chatbot (Engineering/AI)' },
                      { key: 'B', text: 'Design a mobile app interface (Design/UX)' },
                      { key: 'C', text: 'Analyze market or business data (Data/Business)' },
                      { key: 'D', text: 'Research a new blockchain technology (Research)' }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setDiscoveryAnswers({ ...discoveryAnswers, preferredScenario: opt.key })}
                        className={`w-full p-3 border rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all ${
                          discoveryAnswers.preferredScenario === opt.key 
                            ? 'border-indigo-650 bg-indigo-50/20 text-indigo-650' 
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.text}</span>
                        <div className={`w-3.5 h-3.5 rounded-full border ${
                          discoveryAnswers.preferredScenario === opt.key ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-slate-100 mt-6">
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                disabled={careerDirection !== 'not_sure' ? !careerGoal.targetRole : (!discoveryAnswers.preferredScenario || discoveryAnswers.interests.length === 0)}
                onClick={() => setStep(6)}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-755 disabled:bg-indigo-400 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            SCREEN 06: BUILD CAREER PROFILE - SKILLS
           ======================================================== */}
        {step === 6 && (
          <motion.div 
            key="step6"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)]"
          >
            {renderProgressBar('skills')}
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">What skills do you already have?</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">Select your skills or state if you are starting fresh</p>
            </div>

            <div className="space-y-4">
              
              {/* Zero state toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsJustStartingSkills(!isJustStartingSkills);
                  if (!isJustStartingSkills) setUserSkills([]);
                }}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isJustStartingSkills 
                    ? 'border-indigo-600 bg-indigo-50/15' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <h4 className="text-xs font-black text-slate-800">🌱 I'm just starting / I have no skills yet</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">We will begin our learning journey from the absolute basics</p>
                </div>
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  isJustStartingSkills ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-350 bg-white'
                }`}>
                  {isJustStartingSkills && <Check size={12} className="stroke-[3.5]" />}
                </div>
              </button>

              {!isJustStartingSkills && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Skill search */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={e => setSkillSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-900 placeholder-slate-400 text-sm font-semibold outline-none focus:border-indigo-500"
                      placeholder="Search skills..."
                    />
                  </div>

                  {/* Suggestions list */}
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills
                      .filter(s => s.toLowerCase().includes(skillSearch.toLowerCase()))
                      .map((skill) => {
                        const isSelected = userSkills.some(s => s.name === skill);
                        return (
                          <button
                            key={skill}
                            onClick={() => toggleSkill(skill)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {skill}
                          </button>
                        );
                      })}
                  </div>

                  {/* Selected skill proficiencies */}
                  {userSkills.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3.5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Set Skill Levels</h4>
                      {userSkills.map((s) => (
                        <div key={s.name} className="flex items-center justify-between gap-4 text-xs">
                          <span className="font-bold text-slate-800">{s.name}</span>
                          <div className="flex gap-1">
                            {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => updateSkillProficiency(s.name, lvl)}
                                className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold transition-all ${
                                  s.proficiency === lvl 
                                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Custom skill */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSkillInput}
                      onChange={e => setCustomSkillInput(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-xl text-xs font-semibold outline-none"
                      placeholder="Add other skill..."
                    />
                    <button
                      type="button"
                      onClick={addCustomSkill}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100 mt-6">
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  disabled={!isJustStartingSkills && userSkills.length === 0}
                  onClick={() => setStep(7)}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-755 disabled:bg-indigo-400 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            SCREEN 07: BUILD CAREER PROFILE - EXPERIENCE
           ======================================================== */}
        {step === 7 && (
          <motion.div 
            key="step7"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)] relative"
          >
            {renderProgressBar('experience')}

            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tell us about what you've done</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">Add items or mark if starting from zero</p>
            </div>

            <div className="space-y-4">
              
              {/* Zero state toggle */}
              <button
                type="button"
                onClick={() => {
                  setHasNoExperience(!hasNoExperience);
                  if (!hasNoExperience) {
                    setExperience({
                      projects: [], internships: [], hackathons: [], 
                      certifications: [], openSource: [], achievements: []
                    });
                  }
                }}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  hasNoExperience 
                    ? 'border-indigo-600 bg-indigo-50/15' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <h4 className="text-xs font-black text-slate-800">🌱 I am starting from zero / No experience yet</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">We will build up your profile evidence together</p>
                </div>
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  hasNoExperience ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-350 bg-white'
                }`}>
                  {hasNoExperience && <Check size={12} className="stroke-[3.5]" />}
                </div>
              </button>

              {!hasNoExperience ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  {[
                    { type: 'projects', title: 'Projects', desc: 'Add academic or personal projects', count: experience.projects.length },
                    { type: 'internships', title: 'Internships', desc: 'Add your internship experience', count: experience.internships.length },
                    { type: 'hackathons', title: 'Hackathons', desc: 'Add hackathons you participated in', count: experience.hackathons.length },
                    { type: 'certifications', title: 'Certifications', desc: 'Add courses or certifications', count: experience.certifications.length },
                    { type: 'openSource', title: 'Open Source', desc: 'Add open source contributions', count: experience.openSource.length },
                    { type: 'achievements', title: 'Achievements', desc: 'Add any achievements or awards', count: experience.achievements.length }
                  ].map((sec) => (
                    <div key={sec.type} className="flex items-center justify-between p-3 border border-slate-150 rounded-xl bg-slate-50/20">
                      <div>
                        <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          {sec.title}
                          {sec.count > 0 && <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">{sec.count}</span>}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{sec.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveExpModal(sec.type)}
                        className="text-xs font-extrabold text-indigo-650 flex items-center gap-1 border border-indigo-150 bg-white hover:bg-indigo-50/20 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-5 border text-center my-6">
                  <span className="text-2xl">🌱</span>
                  <h4 className="text-xs font-extrabold text-slate-700 mt-2">Starting from zero?</h4>
                  <p className="text-[10px] text-slate-400 font-medium max-w-sm mx-auto mt-1 leading-relaxed">
                    CareerX402 will help you build experience through guided projects, practice, assessments, and real career activities.
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100 mt-6">
                <button
                  onClick={() => setStep(6)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setStep(8)}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* EXP ADD DETAILS MODALS */}
            {activeExpModal && (
              <div className="absolute inset-0 bg-white/95 rounded-3xl p-8 flex flex-col justify-between z-20">
                <div>
                  <h3 className="text-base font-black text-slate-900 mb-4">Add {activeExpModal}</h3>
                  {activeExpModal === 'projects' && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-650 mb-1">Project Name</label>
                        <input
                          type="text"
                          value={projForm.title}
                          onChange={e => setProjForm({ ...projForm, title: e.target.value })}
                          className="w-full p-2.5 border rounded-xl"
                          placeholder="e.g. House Price Prediction"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-650 mb-1">Description (Tools &amp; Tech)</label>
                        <input
                          type="text"
                          value={projForm.desc}
                          onChange={e => setProjForm({ ...projForm, desc: e.target.value })}
                          className="w-full p-2.5 border rounded-xl"
                          placeholder="e.g. Python • Pandas • Scikit-learn"
                        />
                      </div>
                    </div>
                  )}
                  {activeExpModal === 'internships' && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-655 mb-1">Company</label>
                        <input
                          type="text"
                          value={internForm.company}
                          onChange={e => setInternForm({ ...internForm, company: e.target.value })}
                          className="w-full p-2.5 border rounded-xl"
                          placeholder="e.g. Google"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-655 mb-1">Role / Duration</label>
                        <input
                          type="text"
                          value={internForm.role}
                          onChange={e => setInternForm({ ...internForm, role: e.target.value })}
                          className="w-full p-2.5 border rounded-xl"
                          placeholder="e.g. ML Intern (3 Months)"
                        />
                      </div>
                    </div>
                  )}
                  {activeExpModal === 'hackathons' && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-655 mb-1">Hackathon Name</label>
                        <input
                          type="text"
                          value={hackForm.name}
                          onChange={e => setHackForm({ ...hackForm, name: e.target.value })}
                          className="w-full p-2.5 border rounded-xl"
                          placeholder="e.g. ETHGlobal"
                        />
                      </div>
                    </div>
                  )}
                  {activeExpModal === 'certifications' && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-655 mb-1">Certification / Course</label>
                        <input
                          type="text"
                          value={certForm.name}
                          onChange={e => setCertForm({ ...certForm, name: e.target.value })}
                          className="w-full p-2.5 border rounded-xl"
                          placeholder="e.g. Deep Learning Specialization"
                        />
                      </div>
                    </div>
                  )}
                  {activeExpModal === 'openSource' && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-655 mb-1">Repository Name</label>
                        <input
                          type="text"
                          value={ossForm.repo}
                          onChange={e => setOssForm({ ...ossForm, repo: e.target.value })}
                          className="w-full p-2.5 border rounded-xl"
                          placeholder="e.g. facebook/react"
                        />
                      </div>
                    </div>
                  )}
                  {activeExpModal === 'achievements' && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-655 mb-1">Achievement / Award</label>
                        <input
                          type="text"
                          value={achieveForm.title}
                          onChange={e => setAchieveForm({ ...achieveForm, title: e.target.value })}
                          className="w-full p-2.5 border rounded-xl"
                          placeholder="e.g. Rank 50 in Coding Contest"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveExpModal(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (activeExpModal === 'projects') {
                        setExperience({ ...experience, projects: [...experience.projects, projForm] });
                        setProjForm({ title: '', desc: '' });
                      } else if (activeExpModal === 'internships') {
                        setExperience({ ...experience, internships: [...experience.internships, internForm] });
                        setInternForm({ company: '', role: '', duration: '' });
                      } else if (activeExpModal === 'hackathons') {
                        setExperience({ ...experience, hackathons: [...experience.hackathons, hackForm] });
                        setHackForm({ name: '', project: '' });
                      } else if (activeExpModal === 'certifications') {
                        setExperience({ ...experience, certifications: [...experience.certifications, certForm] });
                        setCertForm({ name: '', issuer: '' });
                      } else if (activeExpModal === 'openSource') {
                        setExperience({ ...experience, openSource: [...experience.openSource, ossForm] });
                        setOssForm({ repo: '', desc: '' });
                      } else if (activeExpModal === 'achievements') {
                        setExperience({ ...experience, achievements: [...experience.achievements, achieveForm] });
                        setAchieveForm({ title: '', issuer: '' });
                      }
                      setActiveExpModal(null);
                    }}
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl"
                  >
                    Save Entry
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================
            SCREEN 08: BUILD CAREER PROFILE - RESUME
           ======================================================== */}
        {step === 8 && (
          <motion.div 
            key="step8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)]"
          >
            {renderProgressBar('resume')}

            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upload your resume</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">
                CareerX402 will analyze your resume and use it to improve your recommendations.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Drag and Drop box */}
              <div 
                onClick={() => {
                  setResumeUploaded(true);
                  setResumeName('Jai_Krishna_Resume.pdf');
                }}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50/80 cursor-pointer text-center transition-colors relative"
              >
                <span className="text-4xl">📄</span>
                <span className="text-xs font-bold text-slate-650 mt-3">
                  {resumeUploaded ? `✓ Resume uploaded (${resumeName})` : 'Drag & drop your resume or Browse'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 font-semibold">PDF / DOCX (Max 5MB)</span>
              </div>

              {resumeUploaded && (
                <div className="bg-green-50/60 border border-green-150 rounded-2xl p-4 text-xs font-semibold text-green-700 animate-in fade-in duration-200">
                  <h4 className="font-bold flex items-center gap-1"><CheckCircle2 size={14} /> Resume Uploaded successfully</h4>
                  <p className="text-[10px] text-green-600/80 mt-1">We'll automatically extract: Skills, Experience, Projects, Education, Certifications.</p>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-100 mt-6">
                <button
                  onClick={() => setStep(7)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setStep(9)}
                  className={`flex-1 py-3 font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 ${
                    resumeUploaded 
                      ? 'bg-indigo-600 hover:bg-indigo-755 text-white' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-750 border'
                  }`}
                >
                  <span>{resumeUploaded ? 'Continue' : 'Skip for now →'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            SCREEN 09: BUILD CAREER PROFILE - LEARNING AVAILABILITY
           ======================================================== */}
        {step === 9 && (
          <motion.div 
            key="step9"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)]"
          >
            {renderProgressBar('availability')}

            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">How much time can you dedicate to learning?</h2>
              <p className="text-slate-400 text-xs font-semibold mt-1">This plan doesn't need to be exact forever.</p>
            </div>

            <div className="space-y-6">
              
              {/* Daily commitment */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">
                  Learning Commitment Per Day
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {learningHours.map((time) => (
                    <button
                      key={time}
                      onClick={() => setLearningAvailability({ ...learningAvailability, timePerDay: time })}
                      className={`py-3 rounded-xl border text-center text-xs font-extrabold transition-all ${
                        learningAvailability.timePerDay === time 
                          ? 'border-indigo-600 bg-indigo-50/20 text-indigo-650' 
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred time */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">
                  Preferred Time Slot
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {preferredTimes.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setLearningAvailability({ ...learningAvailability, preferredTime: slot })}
                      className={`py-2 rounded-xl border text-center text-xs font-bold transition-all ${
                        learningAvailability.preferredTime === slot 
                          ? 'border-indigo-650 bg-indigo-50/20 text-indigo-650' 
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100 mt-6">
                <button
                  onClick={() => setStep(8)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  onClick={triggerAIAnalysis}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 animate-pulse"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================
            SCREEN 10: AI PROFILE CREATED & ANALYSIS OUTCOMES
           ======================================================== */}
        {step === 10 && (
          <motion.div 
            key="step10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-lg bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)]"
          >
            {isAnalysisRunning ? (
              // SUB-STATE: PROCESSING PROGRESS LOADER
              <div className="text-center py-6">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Building your CareerX402 profile...</span>
                
                <div className="my-8 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-indigo-50 flex items-center justify-center relative">
                    <div className="absolute inset-2 bg-indigo-100 rounded-full animate-ping opacity-75" />
                    <div className="absolute inset-4 bg-indigo-600 rounded-full flex items-center justify-center z-10">
                      <Sparkles size={24} className="text-white animate-pulse" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border text-left space-y-3 font-semibold text-xs text-slate-600 mb-6 max-w-sm mx-auto">
                  {[
                    "Understanding your background",
                    "Analyzing your skills",
                    "Reading your career goal",
                    "Evaluating your experience",
                    "Analyzing your resume",
                    "Identifying skill gaps",
                    "Building your personalized path"
                  ].map((line, idx) => (
                    <div key={line} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center">
                        {idx < analysisStep ? (
                          <Check size={12} className="text-green-500 stroke-[3]" />
                        ) : idx === analysisStep ? (
                          <div className="w-3 h-3 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-200" />
                        )}
                      </div>
                      <span className={idx <= analysisStep ? 'text-slate-800' : 'text-slate-400'}>{line}</span>
                    </div>
                  ))}
                </div>

                <div className="relative pt-1 max-w-xs mx-auto">
                  <div className="overflow-hidden h-2 flex rounded-full bg-slate-100">
                    <div 
                      style={{ width: `${analysisProgress}%` }}
                      className="bg-indigo-600 transition-all duration-300 rounded-full"
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-450 mt-2 block text-right">{analysisProgress}%</span>
                </div>
              </div>
            ) : (
              // SUB-STATE: COMPLETED REPORT RESULT DISPLAY (ADAPTIVE CASE A vs B)
              <div className="space-y-6">
                {!isCaseB() ? (
                  // CASE A SUCCESS
                  <>
                    <div className="text-center">
                      <span className="text-2xl">🎉</span>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Your Career Profile is Ready</h2>
                      <p className="text-slate-400 text-xs font-semibold mt-1">We've mapped your goals and verified your roadmap.</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 text-xs font-semibold">
                      <div className="grid grid-cols-2 gap-4 border-b border-slate-200/60 pb-3.5">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Career Goal</span>
                          <span className="text-slate-800 font-extrabold">{careerGoal.targetRole || 'Software Engineer'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Level</span>
                          <span className="text-slate-800 font-extrabold">Intermediate</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-b border-slate-200/60 pb-3.5 text-center">
                        <div className="bg-white border rounded-xl p-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Readiness</span>
                          <span className="text-indigo-600 font-black text-sm mt-0.5 block">72 / 100</span>
                        </div>
                        <div className="bg-white border rounded-xl p-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Roadmap</span>
                          <span className="text-slate-800 font-black text-sm mt-0.5 block">8 Months</span>
                        </div>
                        <div className="bg-white border rounded-xl p-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Time</span>
                          <span className="text-slate-800 font-black text-xs mt-1 block leading-tight">
                            {learningAvailability.timePerDay.split(' ')[0] || '1-2 hrs'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Strong Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {userSkills.slice(0, 3).map(s => (
                              <span key={s.name} className="bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{s.name}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Skill Gaps</span>
                          <div className="flex flex-wrap gap-1">
                            <span className="bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Deep Learning</span>
                            <span className="bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">MLOps</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={finishOnboarding}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Enter CareerX402</span>
                      <ArrowRight size={16} />
                    </Button>
                  </>
                ) : (
                  // CASE B SUCCESS (ZERO-START PROFILE CREATED)
                  <>
                    <div className="text-center">
                      <span className="text-2xl">🚀</span>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Your CareerX402 journey starts here</h2>
                      <p className="text-slate-400 text-xs font-semibold mt-1">We'll help you explore and build your profile step-by-step.</p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 text-xs font-semibold">
                      <div className="grid grid-cols-2 gap-4 border-b border-slate-200/60 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Career Direction</span>
                          <span className="text-slate-800 font-extrabold">Still exploring</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Skill Level</span>
                          <span className="text-slate-800 font-extrabold">Beginner</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Your Recommended First Steps</span>
                        <div className="space-y-2 text-[11px] font-bold text-slate-650">
                          <div className="flex items-center gap-2"><span className="text-indigo-600 font-black">1.</span> Discover your career interests</div>
                          <div className="flex items-center gap-2"><span className="text-indigo-600 font-black">2.</span> Explore 5 career paths</div>
                          <div className="flex items-center gap-2"><span className="text-indigo-600 font-black">3.</span> Complete a basic skill assessment</div>
                          <div className="flex items-center gap-2"><span className="text-indigo-600 font-black">4.</span> Learn foundational coding skills</div>
                          <div className="flex items-center gap-2"><span className="text-indigo-600 font-black">5.</span> Build your first small project</div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={finishOnboarding}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-755 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
                    >
                      <span>Start My Journey</span>
                      <ArrowRight size={16} />
                    </Button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default RegisterPage;
