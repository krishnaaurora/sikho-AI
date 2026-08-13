import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Wallet, Play, FlaskConical, Code2, BarChart2, FileText } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-[#F3F6FF] via-[#FCFDFF] to-[#F9F6FF] font-sans pt-24 pb-12">
      {/* Style tag for animated cards and background elements */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-card-1 {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-card-2 {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(-3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-card-3 {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-card-4 {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-9px) rotate(-2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-card-5 {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-11px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float-1 { animation: float-card-1 6s ease-in-out infinite; }
        .animate-float-2 { animation: float-card-2 7s ease-in-out infinite; }
        .animate-float-3 { animation: float-card-3 5.5s ease-in-out infinite; }
        .animate-float-4 { animation: float-card-4 8s ease-in-out infinite; }
        .animate-float-5 { animation: float-card-5 6.5s ease-in-out infinite; }
      `}} />

      {/* ══════════════════════════════════════════
          DECORATIVE BACKGROUND ELEMENTS
          ══════════════════════════════════════════ */}
      
      {/* Light star outline (Top Left) */}
      <div className="absolute left-[8%] top-[14%] opacity-20 pointer-events-none">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>

      {/* Faint dashed circle (Top Right) */}
      <div className="absolute right-[6%] top-[12%] opacity-20 pointer-events-none">
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke="#6366F1" strokeWidth="2" strokeDasharray="6 6">
          <circle cx="50" cy="50" r="40" />
        </svg>
      </div>

      {/* Orange sparkle (Right side) */}
      <div className="absolute right-[4%] top-[45%] opacity-70 pointer-events-none">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2V22M2 12H22M5 5L19 19M5 19L19 5" />
        </svg>
      </div>

      {/* Purple circle outline (Left middle) */}
      <div className="absolute left-[38%] top-[55%] opacity-20 pointer-events-none">
        <circle cx="12" cy="12" r="10" stroke="#8B5CF6" strokeWidth="2" fill="none" />
      </div>

      {/* Star outline (Bottom Left) */}
      <div className="absolute left-[3%] top-[70%] opacity-25 pointer-events-none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>

      {/* ══════════════════════════════════════════
          CONTENT GRID
          ══════════════════════════════════════════ */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Student Illustration and Hovering Badge Cards */}
          <div className="lg:col-span-6 flex justify-center relative">
            <div className="relative w-full max-w-md sm:max-w-lg">
              
              {/* Central Illustration */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10"
              >
                {/* Faces left naturally to match the mockup design */}
                <img
                  src="/hero_illustration.png"
                  alt="Student learning on laptop"
                  className="w-full h-auto object-contain select-none"
                />
              </motion.div>

              {/* ── FIVE ANIMATED FLOATING BADGE CARDS ── */}

              {/* Card 1: Beaker (Teal/Green) - Left middle */}
              <div className="absolute left-[2%] top-[38%] z-20 animate-float-1">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-[0_12px_24px_rgba(0,0,0,0.06)] border border-slate-100/80 flex items-center justify-center">
                  <div className="p-2 bg-[#E6FDF5] text-[#10B981] rounded-xl">
                    <FlaskConical className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Card 2: Play/Video (Indigo) - Top left */}
              <div className="absolute left-[16%] top-[12%] z-20 animate-float-2">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-[0_12px_24px_rgba(0,0,0,0.06)] border border-slate-100/80 flex items-center justify-center">
                  <div className="p-2 bg-[#EEF2FF] text-[#6366F1] rounded-xl">
                    <Play className="h-6 w-6 fill-current" />
                  </div>
                </div>
              </div>

              {/* Card 3: Code Brackets (Purple) - Top right */}
              <div className="absolute right-[12%] top-[18%] z-20 animate-float-3">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-[0_12px_24px_rgba(0,0,0,0.06)] border border-slate-100/80 flex items-center justify-center">
                  <div className="p-2 bg-[#F5F3FF] text-[#8B5CF6] rounded-xl">
                    <Code2 className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Card 4: Bar Chart (Orange) - Middle right */}
              <div className="absolute right-[2%] top-[45%] z-20 animate-float-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-[0_12px_24px_rgba(0,0,0,0.06)] border border-slate-100/80 flex items-center justify-center">
                  <div className="p-2 bg-[#FFF7ED] text-[#F97316] rounded-xl">
                    <BarChart2 className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Card 5: Document text (Gray) - Bottom right */}
              <div className="absolute right-[8%] top-[68%] z-20 animate-float-5">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-[0_12px_24px_rgba(0,0,0,0.06)] border border-slate-100/80 flex items-center justify-center">
                  <div className="p-2 bg-[#F8FAFC] text-[#64748B] rounded-xl">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Hero Content */}
          <div className="lg:col-span-6 flex flex-col items-start text-left pl-0 lg:pl-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full"
            >
              {/* Tag / Category Badge */}
              <div className="flex flex-col items-start mb-6">
                <span className="text-[#2563EB] font-bold text-sm sm:text-base tracking-[0.05em] uppercase font-mono">
                  Smart learning. Fair pay.
                </span>
                {/* Accent orange line */}
                <div className="w-10 h-[3px] bg-[#F97316] mt-1.5" />
              </div>

              {/* Title Header */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#0E172C] leading-[1.1] tracking-tight mb-6">
                Learn anything. <br />
                Pay <span className="text-[#0D7A70]">only</span> for <br />
                <span className="relative inline-block">
                  what you use.
                  {/* Premium Wavy Brush Stroke Underline */}
                  <svg
                    className="absolute -bottom-3 left-0 w-full h-3 text-[#F97316]"
                    viewBox="0 0 300 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 5 7 Q 75 1, 150 7 T 295 7"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
              </h1>

              {/* Paragraph Description */}
              <p className="text-slate-600 text-base sm:text-lg md:text-xl font-medium leading-relaxed mb-8 max-w-xl">
                Get instant access to expert-designed lessons, interactive practice, and real-world skills.
                No subscriptions. No wasted time.
              </p>

              {/* Action Button */}
              <div className="mb-14">
                <Button className="rounded-full px-8 py-6 bg-[#004BFF] hover:bg-[#003DD6] font-bold text-white text-base sm:text-lg flex items-center gap-2.5 transition-colors shadow-lg shadow-blue-500/20">
                  <span>Explore Learning Labs</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Feature/Metrics Footer inside right column */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200/60 z-10">
                
                {/* Feature 1: Micro-payments */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#E5F7ED] flex items-center justify-center flex-shrink-0">
                    <Wallet className="h-5 w-5 text-[#15803D]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">Micro-payments</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">as low as $0.001</p>
                  </div>
                </div>

                {/* Feature 2: Secure & Transparent */}
                <div className="flex items-center gap-3 sm:border-l sm:border-slate-200/80 sm:pl-6">
                  <div className="w-11 h-11 rounded-full bg-[#E8F0FE] flex items-center justify-center flex-shrink-0">
                    <Shield className="h-5 w-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">Secure & Transparent</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Built on x402 + Algorand</p>
                  </div>
                </div>

                {/* Feature 3: Instant Access */}
                <div className="flex items-center gap-3 sm:border-l sm:border-slate-200/80 sm:pl-6">
                  <div className="w-11 h-11 rounded-full bg-[#FFF3EB] flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-[#F97316]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">Instant Access</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Learn without waiting</p>
                  </div>
                </div>

              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
