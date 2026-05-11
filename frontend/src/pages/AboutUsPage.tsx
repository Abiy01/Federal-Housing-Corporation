import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useSEO } from '../hooks/useSEO';
import AboutHeroSection from '../components/about/AboutHeroSection';
import AboutHeritageSection from '../components/about/AboutHeritageSection';
import AboutStatsSection from '../components/about/AboutStatsSection';
import AboutValuesSection from '../components/about/AboutValuesSection';
import AboutCTASection from '../components/about/AboutCTASection';

const AboutUsPage: React.FC = () => {
  useSEO({
    title: 'About Us',
    description:
      'Learn about the Federal Housing Corporation — our mission to modernize public housing services, verified listings, and trusted digital access for Ethiopians.',
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Sticky Navigation */}
      <Navbar />

      {/* Hero Section */}
      <AboutHeroSection />

      {/* Our Heritage Section */}
      <AboutHeritageSection />

      {/* Stats Section */}
      <AboutStatsSection />

      {/* Values Section - Driven by Purpose */}
      <AboutValuesSection />

      {/* CTA Section */}
      <AboutCTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutUsPage;
