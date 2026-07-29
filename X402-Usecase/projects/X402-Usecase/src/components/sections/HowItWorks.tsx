import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Server, Wallet, Unlock, Zap } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Choose Lesson",
    description: "Browse and select the lesson you want to learn",
    icon: BookOpen,
  },
  {
    number: "02",
    title: "HTTP 402 Check",
    description: "System verifies access and identifies required payment",
    icon: Server,
  },
  {
    number: "03",
    title: "Approve Payment",
    description: "Pay instantly using x402 micropayments",
    icon: Wallet,
  },
  {
    number: "04",
    title: "Unlock Lesson",
    description: "Get immediate access to your content",
    icon: Unlock,
  },
  {
    number: "05",
    title: "Start Learning",
    description: "Begin your learning journey with AI assistance",
    icon: Zap,
  },
];

const HowItWorks = () => {
  return (
    <section id="about" className="py-24 px-4 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">How x402 Works</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base">
            Simple, fast, and secure learning experience powered by direct blockchain micro-payments.
          </p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-[44px] left-8 right-8 h-0.5 bg-slate-200 dark:bg-slate-800" />
          <div className="grid md:grid-cols-5 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative text-center flex flex-col items-center"
              >
                <div className="relative z-10 w-16 h-16 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:border-primary transition-colors">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-bold text-slate-400 dark:text-slate-600 block mb-2 font-mono">
                  {step.number}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[170px]">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
