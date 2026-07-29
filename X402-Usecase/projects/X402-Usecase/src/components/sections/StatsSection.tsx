import React from "react";
import { motion } from "framer-motion";

const stats = [
  { number: "10K+", label: "Interactive Lessons" },
  { number: "50K+", label: "Active Learners" },
  { number: "1.2M+", label: "AI Explanations" },
  { number: "100K+", label: "ALGO Micropayments" },
];

const StatsSection = () => {
  return (
    <section className="py-20 px-4 bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-850">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="text-center"
            >
              <h3 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary via-indigo-500 to-accent bg-clip-text text-transparent mb-2">
                {stat.number}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
