import React from "react";
import { Play } from "lucide-react";

const WorkflowSection: React.FC = () => {
  return (
    <section className="py-20 bg-white border-t border-slate-100 font-sans">
      <div className="max-w-5xl mx-auto px-6">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-blue-600 font-bold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">
            Demo
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            SikhoAI Workflow
          </h2>
          <p className="text-slate-500 mt-2 text-base font-semibold">
            Watch a live demonstration of requesting and unlocking learning resources.
          </p>
        </div>

        {/* Video Player Container with Premium Shadow & Frame */}
        <div className="relative mx-auto max-w-4xl rounded-3xl overflow-hidden bg-slate-950 p-2 shadow-2xl border border-slate-200/60 hover:shadow-[0_20px_50px_rgba(99,102,241,0.15)] transition-all duration-500">
          
          {/* Decorative browser dots at top */}
          <div className="flex gap-1.5 items-center px-4 py-2 border-b border-slate-800 bg-slate-900 rounded-t-2xl">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-slate-500 font-mono ml-4 font-semibold select-none">
              workflow_demo.mp4
            </span>
          </div>

          {/* Actual HTML5 Video Player */}
          <video 
            src="/Exactly_—_you_want_a_pure_work.mp4" 
            controls
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-auto aspect-video rounded-b-2xl object-cover"
          />

        </div>

      </div>
    </section>
  );
};

export default WorkflowSection;
