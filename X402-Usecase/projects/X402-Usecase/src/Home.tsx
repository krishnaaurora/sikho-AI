import Navbar from './components/Navbar'
import Hero from './components/sections/Hero'
import SearchSection from './components/sections/SearchSection'
import CategoriesSection from './components/sections/CategoriesSection'
import WhyChooseUs from './components/sections/WhyChooseUs'
import AITutorSection from './components/sections/AITutorSection'
import StatsSection from './components/sections/StatsSection'
import TestimonialsSection from './components/sections/TestimonialsSection'
import CTASection from './components/sections/CTASection'
import Footer from './components/Footer'

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <SearchSection />
        <CategoriesSection />
        <WhyChooseUs />
        <AITutorSection />
        <StatsSection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

export default Home
