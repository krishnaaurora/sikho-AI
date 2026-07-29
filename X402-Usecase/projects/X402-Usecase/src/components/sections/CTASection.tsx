import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-24 px-4 bg-white dark:bg-slate-950">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden bg-gradient-to-br from-primary via-indigo-650 to-accent rounded-3xl p-12 md:p-20 text-center shadow-xl shadow-primary/10"
        >
          {/* Subtle overlay glow */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 border border-white/20 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">Start Learning Today</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Ready to Learn Smarter?
            </h2>
            
            <p className="text-base md:text-lg text-white/85 mb-10 max-w-2xl mx-auto leading-relaxed">
              Unlock bite-sized knowledge increments with direct blockchain micropayments. Start your custom learning journey with SikhoAI.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-primary hover:bg-slate-50 text-xs font-bold rounded-xl px-8 shadow-md" asChild>
                <Link to="/register">
                  Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border border-white/30 text-white hover:bg-white/10 text-xs font-bold rounded-xl px-8"
                asChild
              >
                <Link to="/courses">
                  Explore Courses
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
