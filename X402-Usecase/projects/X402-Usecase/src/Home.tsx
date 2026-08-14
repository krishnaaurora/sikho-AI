import React from 'react';
import Hero from './components/sections/Hero';
import FeaturesSection from './components/sections/FeaturesSection';
import WorkflowSection from './components/sections/WorkflowSection';
import Footer from './components/Footer';

function Home() {
  return (
    <div className="min-h-screen bg-white text-[#0F172A] selection:bg-blue-100 selection:text-blue-900 relative font-sans">
      <Hero />
      <FeaturesSection />
      <WorkflowSection />
      <Footer />
    </div>
  );
}

export default Home;
