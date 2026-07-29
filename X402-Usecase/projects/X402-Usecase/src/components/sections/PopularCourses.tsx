import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Star, Clock, Users, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const courses = [
  {
    title: "Complete React Masterclass",
    category: "Web Development",
    difficulty: "Intermediate",
    duration: "12 hours",
    rating: 4.9,
    students: 12450,
    price: "Starts from ₹2",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400&h=250",
  },
  {
    title: "Deep Learning Fundamentals",
    category: "Artificial Intelligence",
    difficulty: "Advanced",
    duration: "18 hours",
    rating: 4.8,
    students: 8900,
    price: "Starts from ₹2",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=400&h=250",
  },
  {
    title: "Blockchain & Smart Contracts",
    category: "Blockchain",
    difficulty: "Intermediate",
    duration: "15 hours",
    rating: 4.9,
    students: 7600,
    price: "Starts from ₹2",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=400&h=250",
  },
  {
    title: "Python for Beginners",
    category: "Programming",
    difficulty: "Beginner",
    duration: "8 hours",
    rating: 4.7,
    students: 18900,
    price: "Starts from ₹2",
    image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&q=80&w=400&h=250",
  },
];

const PopularCourses = () => {
  return (
    <section id="features" className="py-24 px-4 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-16">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-slate-900 dark:text-white">Popular Courses</h2>
            <p className="text-slate-500 dark:text-slate-450 text-base">Start learning and pay incrementally for what you actually consume.</p>
          </div>
          <Link to="/courses" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group">
            Browse All Courses
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {courses.map((course, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="overflow-hidden border border-slate-200 dark:border-slate-850 hover:border-primary/45 dark:hover:border-primary/45 bg-slate-50/20 dark:bg-slate-900/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group rounded-2xl flex flex-col h-full">
                <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <Badge variant="secondary" className="absolute top-4 left-4 font-semibold backdrop-blur-md bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 border-none px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-lg shadow-sm">
                    {course.difficulty}
                  </Badge>
                </div>
                <CardContent className="pt-5 pb-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-accent dark:text-accent uppercase tracking-wider mb-2 block">
                      {course.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-455 text-amber-455" />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{course.rating}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{course.students >= 1000 ? `${(course.students/1000).toFixed(1)}k` : course.students}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50 px-5 py-3.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Micro-pricing</span>
                  <span className="text-base font-bold text-primary">{course.price}</span>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCourses;
