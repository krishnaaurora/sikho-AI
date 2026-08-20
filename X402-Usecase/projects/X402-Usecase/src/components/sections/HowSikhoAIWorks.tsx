import React from "react";
import { motion, Variants } from "framer-motion";
import { FileText, Wallet, Check, Lock, PartyPopper } from "lucide-react";

interface StepItem {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  circleBg: string;
  numBg: string;
}

const steps: StepItem[] = [
  {
    number: 1,
    title: "Request",
    description: "You request a specialized learning service.",
    icon: <FileText className="w-7 h-7 text-blue-600" />,
    circleBg: "bg-blue-50/80 text-blue-600",
    numBg: "bg-blue-600",
  },
  {
    number: 2,
    title: "402 Payment Required",
    description: "SikhoAI returns payment requirements via x402.",
    icon: <span className="text-lg font-black text-orange-600 tracking-tight font-mono">402</span>,
    circleBg: "bg-orange-50/80 text-orange-600",
    numBg: "bg-orange-500",
  },
  {
    number: 3,
    title: "Pay & Sign",
    description: "You sign the payment securely on Algorand.",
    icon: <Wallet className="w-7 h-7 text-emerald-600" />,
    circleBg: "bg-emerald-50/80 text-emerald-600",
    numBg: "bg-emerald-600",
  },
  {
    number: 4,
    title: "Verified & Delivered",
    description: "Payment verified. Your learning experience is unlocked instantly.",
    icon: <Check className="w-7 h-7 text-blue-600" strokeWidth={3} />,
    circleBg: "bg-blue-50/80 text-blue-600",
    numBg: "bg-blue-600",
  }
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.25,
    }
  }
};

const circleVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 120, damping: 14 }
  }
};

const textVariants: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" as const }
  }
};

const HowSikhoAIWorks: React.FC = () => {
  return (
    <section className="py-24 bg-white border-t border-slate-100 font-sans overflow-hidden">
      <div className="max-w-[500px] mx-auto px-6">
        
        {/* Title Block */}
        <div className="mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            How SikhoAI Works
          </h2>
          <p className="text-slate-500 mt-2 text-base font-semibold">
            Pay-per-use learning powered by{" "}
            <span className="text-orange-500 font-bold bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100/50">
              x402
            </span>
          </p>
        </div>

        {/* Timeline Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-col gap-12 relative"
        >
          {steps.map((step, idx) => (
            <div key={step.number} className="flex items-center gap-8 relative z-10">
              
              {/* Left Column: Outer Circle & Dashed Line */}
              <div className="relative flex flex-col items-center flex-shrink-0">
                <motion.div 
                  variants={circleVariants}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-sm border border-slate-100/50 ${step.circleBg}`}
                >
                  {step.icon}
                </motion.div>
                
                {/* Vertical connecting line */}
                {idx < steps.length - 1 && (
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.25 + 0.1, ease: "easeInOut" }}
                    className="absolute top-[80px] bottom-[-48px] left-1/2 -translate-x-1/2 w-[2px] border-l-2 border-dashed border-slate-200 origin-top"
                  />
                )}
              </div>

              {/* Right Column: Step content card */}
              <motion.div 
                variants={textVariants}
                className="flex gap-4 items-start flex-grow"
              >
                {/* Step Index Badge */}
                <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-white font-bold text-xs mt-0.5 flex-shrink-0 shadow-sm ${step.numBg}`}>
                  {step.number}
                </div>
                
                {/* Step Details */}
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 text-[13px] font-semibold mt-1.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>

            </div>
          ))}
        </motion.div>

        {/* Bottom unlocked banner */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
          className="mt-12 bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 leading-tight">
                Experience Unlocked
              </h4>
              <p className="text-slate-500 text-xs font-semibold mt-1 leading-snug">
                You can now access your learning resource.
              </p>
            </div>
          </div>
          
          {/* Animated Popper Emoji / Icon */}
          <motion.div
            animate={{ 
              rotate: [0, -10, 15, -10, 0],
              scale: [1, 1.1, 0.95, 1.05, 1]
            }}
            transition={{ 
              duration: 2.2, 
              ease: "easeInOut", 
              repeat: Infinity,
              repeatDelay: 1.5
            }}
            className="flex-shrink-0 text-emerald-600 bg-emerald-50 p-2 rounded-xl border border-emerald-100"
          >
            <PartyPopper className="w-6 h-6" />
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
};

export default HowSikhoAIWorks;
