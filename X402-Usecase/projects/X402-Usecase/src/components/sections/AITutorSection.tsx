import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Brain, User, Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AITutorSection = () => {
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  const fullResponse = `Binary Search is an efficient algorithm for finding an item from a sorted list of items. It works by repeatedly dividing in half the portion of the list that could contain the item, until you've narrowed down the possible locations to just one.

Here's a simple Python implementation:

\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
\`\`\`

Would you like me to explain this step by step?`;

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullResponse.length) {
        setTypingText(fullResponse.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 20);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="ai-tutor" className="py-24 px-4 bg-slate-50 dark:bg-slate-900/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-full mb-6">
            <Brain className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">AI Guidance</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">Meet Your AI Tutor</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base">
            Get instant contextual help, interactive code explanations, and customized summaries on any learning topic.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl bg-white dark:bg-slate-950">
            <CardContent className="p-0">
              {/* OpenAI-like top header */}
              <div className="bg-slate-950 text-white px-6 py-4 border-b border-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <span className="font-semibold text-sm">SikhoAI Chat Console</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 block" />
                  <span className="text-[10px] text-slate-400 font-mono">Agent Active</span>
                </div>
              </div>
              
              <div className="p-6 space-y-6 min-h-[360px] flex flex-col justify-end bg-slate-50/50 dark:bg-slate-950/20">
                {/* User Prompt */}
                <div className="flex gap-4 max-w-xl self-end flex-row-reverse">
                  <div className="w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="bg-primary text-white p-3.5 rounded-2xl rounded-tr-none shadow-md shadow-primary/5">
                    <p className="text-sm">Explain Binary Search</p>
                  </div>
                </div>

                {/* AI Tutor Response */}
                <div className="flex gap-4 max-w-2xl">
                  <div className="w-9 h-9 bg-slate-900 dark:bg-slate-800 text-primary border border-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl rounded-tl-none shadow-sm max-w-xl">
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-mono text-xs">
                      {typingText}
                      {isTyping && <span className="animate-pulse text-primary font-bold">|</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Console Input Footer */}
              <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-950 flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Ask a follow-up question..." 
                  disabled
                  className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs w-full outline-none text-slate-400 cursor-not-allowed"
                />
                <Button className="rounded-xl px-4 py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white flex items-center gap-1.5" disabled>
                  <Send className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-900 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between text-xs">
                <span className="text-slate-550 dark:text-slate-450">Unlock individual lessons to ask the AI Tutor questions in real-time.</span>
                <Button variant="link" className="text-xs p-0 text-primary font-semibold flex items-center gap-1 hover:underline" asChild>
                  <Link to="/courses">
                    Try AI Tutor Now <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default AITutorSection;
