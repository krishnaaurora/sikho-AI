import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const SearchSection = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const suggestions = ["React", "AI", "Blockchain", "DSA", "Python"];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/courses?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    navigate(`/courses?search=${encodeURIComponent(suggestion)}`);
  };

  return (
    <section className="py-24 px-4 bg-slate-50 dark:bg-slate-900/30">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-8 text-slate-900 dark:text-white">What do you want to learn today?</h2>
          
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for courses, lessons, or topics..."
              className="h-14 pl-12 pr-28 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all w-full"
            />
            <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 rounded-xl bg-slate-900 dark:bg-slate-850 hover:bg-slate-800 text-white font-semibold text-xs transition-all">Search</Button>
          </form>
          
          <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
            <span className="text-xs text-slate-400 font-medium">Popular:</span>
            {suggestions.map((suggestion, idx) => (
              <motion.button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 hover:border-primary hover:text-primary transition-all text-xs font-semibold rounded-lg shadow-sm"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SearchSection;
