import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Software Engineer",
    content:
      "The AI tutor is incredible! It explains complex concepts in simple terms. The pay-per-lesson model is perfect for my learning style.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100&h=100",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Student",
    content:
      "Finally, a platform that lets me learn what I want, when I want. No expensive subscriptions! The blockchain payments are seamless.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100&h=100",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Product Manager",
    content:
      "The interactive quizzes and learning analytics helped me track my progress effectively. Highly recommend!",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100&h=100",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 px-4 bg-slate-50/50 dark:bg-slate-900/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">What Our Learners Say</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base">
            Join thousands of professionals and students learning dynamically.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-6 h-full border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-800 transition-all rounded-2xl flex flex-col justify-between">
                <div>
                  <Quote className="h-6 w-6 text-primary/30 mb-4" />
                  <CardContent className="p-0 mb-6">
                    <p className="text-slate-650 dark:text-slate-350 leading-relaxed text-sm italic">
                      "{testimonial.content}"
                    </p>
                  </CardContent>
                </div>
                <CardFooter className="p-0 flex items-center gap-4 border-t border-slate-100 dark:border-slate-850/50 pt-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-xs text-slate-500">{testimonial.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-amber-450 text-amber-450"
                      />
                    ))}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
