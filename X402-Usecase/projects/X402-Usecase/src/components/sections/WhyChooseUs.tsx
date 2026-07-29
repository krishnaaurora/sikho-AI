import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Brain, DollarSign, Zap, ShieldCheck, FileQuestion, BarChart2, Award, Smartphone } from "lucide-react";

const features = [
  {
    title: "AI Tutor",
    description: "Get personalized learning assistance 24/7 with our intelligent AI tutor",
    icon: Brain,
  },
  {
    title: "Pay Per Lesson",
    description: "Only pay for what you learn, no subscription required",
    icon: DollarSign,
  },
  {
    title: "Instant Access",
    description: "Unlock lessons instantly with x402 micropayments",
    icon: Zap,
  },
  {
    title: "Blockchain Payments",
    description: "Secure, transparent payments powered by Algorand blockchain",
    icon: ShieldCheck,
  },
  {
    title: "Interactive Quizzes",
    description: "Test your knowledge with engaging quizzes and exercises",
    icon: FileQuestion,
  },
  {
    title: "Learning Analytics",
    description: "Track your progress and improve with detailed insights",
    icon: BarChart2,
  },
  {
    title: "Certificates",
    description: "Earn verifiable certificates upon completion",
    icon: Award,
  },
  {
    title: "Responsive Learning",
    description: "Learn on any device, anywhere, anytime",
    icon: Smartphone,
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-24 px-4 bg-slate-50 dark:bg-slate-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">Why Choose Us?</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base">
            Everything you need for a modern, blockchain-secured learning experience.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-6 h-full border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 hover:border-primary/45 dark:hover:border-primary/45 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 rounded-2xl">
                <CardHeader className="p-0 mb-4">
                  <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base font-bold text-slate-850 dark:text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
