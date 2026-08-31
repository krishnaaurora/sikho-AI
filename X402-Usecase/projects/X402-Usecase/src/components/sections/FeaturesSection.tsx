import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, HelpCircle, Code2, Bug, FileSpreadsheet, 
  UserCheck, Microscope, FlaskConical, FileText, Flag,
  ArrowRight, LayoutGrid
} from 'lucide-react';

interface FeatureCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  linkColor: string;
  watermarkBg: React.ReactNode;
  path: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  name, 
  description, 
  icon, 
  iconBg, 
  iconColor,
  linkColor, 
  watermarkBg, 
  path 
}) => {
  return (
    <Link 
      to={path}
      className="group block relative bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Background Watermark / Watermark Graphics */}
      <div className="absolute top-2 right-2 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity pointer-events-none select-none">
        {watermarkBg}
      </div>

      <div className="flex flex-col h-full min-h-[160px] justify-between relative z-10">
        <div>
          {/* Icon container */}
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg} ${iconColor} transition-transform group-hover:scale-105`}>
            {icon}
          </div>
          
          {/* Title */}
          <h3 className="text-xl font-extrabold text-slate-900 mt-5 tracking-tight">
            {name}
          </h3>
          
          {/* Description */}
          <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed">
            {description}
          </p>
        </div>
        
        {/* Bottom Link "Open Tool ->" */}
        <div className={`flex items-center gap-1.5 mt-6 font-bold text-sm ${linkColor} transition-all duration-200`}>
          <span>Open Tool</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      name: "/explain",
      description: "Explain difficult concepts in simple terms",
      icon: <MessageSquare className="w-6 h-6" />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      linkColor: "text-blue-600",
      watermarkBg: <MessageSquare className="w-28 h-28 text-blue-600" />,
      path: "/explain"
    },
    {
      name: "/doubt-solve",
      description: "Solve your personalized doubts instantly",
      icon: <HelpCircle className="w-6 h-6" />,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      linkColor: "text-purple-600",
      watermarkBg: <HelpCircle className="w-28 h-28 text-purple-600" />,
      path: "/playground?path=/api/v1/ai/doubt-solve"
    },
    {
      name: "/code-review",
      description: "Get AI-powered code reviews and suggestions",
      icon: <Code2 className="w-6 h-6" />,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      linkColor: "text-emerald-600",
      watermarkBg: <Code2 className="w-28 h-28 text-emerald-600" />,
      path: "/playground?path=/api/v1/ai/code-review"
    },
    {
      name: "/debug",
      description: "Find and fix bugs with AI assistance",
      icon: <Bug className="w-6 h-6" />,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      linkColor: "text-red-500",
      watermarkBg: <Bug className="w-28 h-28 text-red-500" />,
      path: "/playground?path=/api/v1/ai/debug"
    },
    {
      name: "/generate-quiz",
      description: "Create personalized quizzes in seconds",
      icon: <FileSpreadsheet className="w-6 h-6" />,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      linkColor: "text-amber-600",
      watermarkBg: <FileSpreadsheet className="w-28 h-28 text-amber-600" />,
      path: "/playground?path=/api/v1/ai/generate-quiz"
    },
    {
      name: "/mock-interview",
      description: "AI-powered mock interviews with feedback",
      icon: <UserCheck className="w-6 h-6" />,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      linkColor: "text-violet-600",
      watermarkBg: <UserCheck className="w-28 h-28 text-violet-600" />,
      path: "/playground?path=/api/v1/ai/mock-interview"
    },
    {
      name: "/research-analysis",
      description: "Analyze papers and get key insights",
      icon: <Microscope className="w-6 h-6" />,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      linkColor: "text-blue-600",
      watermarkBg: <Microscope className="w-28 h-28 text-blue-500" />,
      path: "/playground?path=/api/v1/ai/research-analysis"
    },
    {
      name: "/interactive-lab",
      description: "Run experiments in an interactive way",
      icon: <FlaskConical className="w-6 h-6" />,
      iconBg: "bg-pink-50",
      iconColor: "text-pink-500",
      linkColor: "text-pink-500",
      watermarkBg: <FlaskConical className="w-28 h-28 text-pink-500" />,
      path: "/playground?path=/api/v1/ai/interactive-lab"
    },
    {
      name: "/resume-analysis",
      description: "Analyze your resume and improve it",
      icon: <FileText className="w-6 h-6" />,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
      linkColor: "text-cyan-600",
      watermarkBg: <FileText className="w-28 h-28 text-cyan-600" />,
      path: "/playground?path=/api/v1/ai/resume-analysis"
    },
    {
      name: "/career-roadmap",
      description: "Get a personalized career roadmap",
      icon: <Flag className="w-6 h-6" />,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      linkColor: "text-emerald-600",
      watermarkBg: <Flag className="w-28 h-28 text-emerald-500" />,
      path: "/playground?path=/api/v1/ai/career-roadmap"
    }
  ];

  return (
    <section className="py-16 bg-slate-50/50 border-t border-slate-100 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              All AI Learning Tools
            </h2>
            <p className="text-slate-500 mt-2 text-lg font-medium">
              10+ powerful endpoints to accelerate your learning
            </p>
          </div>
          
          <Link 
            to="/playground"
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-semibold text-sm transition-all shadow-sm"
          >
            <LayoutGrid className="w-4 h-4 text-slate-500" />
            <span>Explore All</span>
          </Link>
        </div>

        {/* Feature Grid - 5 columns matching screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {features.map((feature, idx) => (
            <FeatureCard 
              key={idx}
              name={feature.name}
              description={feature.description}
              icon={feature.icon}
              iconBg={feature.iconBg}
              iconColor={feature.iconColor}
              linkColor={feature.linkColor}
              watermarkBg={feature.watermarkBg}
              path={feature.path}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

