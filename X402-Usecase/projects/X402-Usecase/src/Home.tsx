import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Hero from './components/sections/Hero';
import FeaturesSection from './components/sections/FeaturesSection';
import WorkflowSection from './components/sections/WorkflowSection';
import Footer from './components/Footer';

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else {
        navigate('/dashboard/learner', { replace: true });
      }
    }
  }, [user, navigate]);

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-[#0F172A] selection:bg-blue-100 selection:text-blue-900 relative font-sans">
      <div id="how-it-works">
        <Hero />
      </div>
      <div id="ai-tools">
        <FeaturesSection />
      </div>
      <div id="workflow-demo">
        <WorkflowSection />
      </div>
      <Footer />
    </div>
  );
}

export default Home;
