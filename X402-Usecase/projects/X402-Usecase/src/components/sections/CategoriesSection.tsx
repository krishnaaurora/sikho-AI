import React from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Brain, Code2, Database, Globe, BarChart3, Lock, Cloud, Terminal } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  { name: "Artificial Intelligence", icon: Brain, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30" },
  { name: "Programming", icon: Code2, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30" },
  { name: "Blockchain", icon: Database, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30" },
  { name: "Web Development", icon: Globe, color: "text-sky-600 bg-sky-50 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30" },
  { name: "Data Science", icon: BarChart3, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30" },
  { name: "Cyber Security", icon: Lock, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30" },
  { name: "Cloud Computing", icon: Cloud, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30" },
  { name: "DevOps", icon: Terminal, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/30" },
];

const CategoriesSection = () => {
  return (
    <section id="courses" className="py-24 px-4 bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">Explore by Category</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base">
            Discover tailored learning paths backed by AI tutor guidance and secured via decentralized micropayments.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link to={`/category/${category.name.toLowerCase().replace(/ /g, '-')}`}>
                <Card className="p-6 cursor-pointer hover:border-primary/40 dark:hover:border-primary/40 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group rounded-xl">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 group-hover:scale-105 transition-transform ${category.color}`}>
                    <category.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{category.name}</h3>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
