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
  path: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ name, description, icon, iconBg, path }) => {
  return (
    <Link 
      to={path}
      className="group block relative bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
    >
      <div className="flex flex-col h-full min-h-[135px] justify-between">
        <div>
          {/* Icon container */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          
          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 mt-3 tracking-tight group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
          
          {/* Description */}
          <p className="text-slate-500 text-xs mt-1.5 font-medium leading-relaxed">
            {description}
          </p>
        </div>
        
        {/* Bottom Arrow */}
        <div className="flex justify-end mt-3">
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
        </div>
      </div>
    </Link>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      name: "/explain",
      description: "Explain difficult concepts simply",
      icon: <MessageSquare className="w-5 h-5" />,
      iconBg: "bg-blue-50 text-blue-600",
      path: "/explain"
    },
    {
      name: "/doubt-solve",
      description: "Solve personalized doubts instantly",
      icon: <HelpCircle className="w-5 h-5" />,
      iconBg: "bg-purple-50 text-purple-600",
      path: "/playground?path=/api/v1/ai/doubt-solve"
    },
    {
      name: "/code-review",
      description: "Get AI-powered code reviews",
      icon: <Code2 className="w-5 h-5" />,
      iconBg: "bg-emerald-50 text-emerald-600",
      path: "/playground?path=/api/v1/ai/code-review"
    },
    {
      name: "/debug",
      description: "Find and fix bugs with AI help",
      icon: <Bug className="w-5 h-5" />,
      iconBg: "bg-red-50 text-red-600",
      path: "/playground?path=/api/v1/ai/debug"
    },
    {
      name: "/generate-quiz",
      description: "Create personalized quizzes in seconds",
      icon: <FileSpreadsheet className="w-5 h-5" />,
      iconBg: "bg-amber-50 text-amber-600",
      path: "/playground?path=/api/v1/ai/generate-quiz"
    },
    {
      name: "/mock-interview",
      description: "AI-powered mock interviews",
      icon: <UserCheck className="w-5 h-5" />,
      iconBg: "bg-violet-50 text-violet-600",
      path: "/playground?path=/api/v1/ai/mock-interview"
    },
    {
      name: "/research-analysis",
      description: "Analyze papers and get key insights",
      icon: <Microscope className="w-5 h-5" />,
      iconBg: "bg-indigo-50 text-indigo-600",
      path: "/playground?path=/api/v1/ai/research-analysis"
    },
    {
      name: "/interactive-lab",
      description: "Run experiments in an interactive way",
      icon: <FlaskConical className="w-5 h-5" />,
      iconBg: "bg-pink-50 text-pink-600",
      path: "/playground?path=/api/v1/ai/interactive-lab"
    },
    {
      name: "/resume-analysis",
      description: "Analyze your resume and improve it",
      icon: <FileText className="w-5 h-5" />,
      iconBg: "bg-cyan-50 text-cyan-600",
      path: "/playground?path=/api/v1/ai/resume-analysis"
    },
    {
      name: "/career-roadmap",
      description: "Get a personalized career roadmap",
      icon: <Flag className="w-5 h-5" />,
      iconBg: "bg-green-50 text-green-600",
      path: "/playground?path=/api/v1/ai/career-roadmap"
    }
  ];

  return (
    <section className="py-16 bg-slate-50/50 border-t border-slate-100 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
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

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {features.map((feature, idx) => (
            <FeatureCard 
              key={idx}
              name={feature.name}
              description={feature.description}
              icon={feature.icon}
              iconBg={feature.iconBg}
              path={feature.path}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
