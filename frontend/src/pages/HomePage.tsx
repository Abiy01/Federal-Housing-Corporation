import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useSEO } from '../hooks/useSEO';
import HeroSection from '../components/home/HeroSection';
import StatsSection from '../components/home/StatsSection';
import CuratedListingsSection from '../components/home/CuratedListingsSection';
import TrustSignalsSection from '../components/home/TrustSignalsSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import CTASection from '../components/home/CTASection';

const HomePage: React.FC = () => {
  useSEO({
    title: 'Federal Housing Digital Platform',
    description:
      'FHC connects citizens, tenants, and buyers with verified property listings and transparent rental and sale workflows across Ethiopia.',
  });

  return (
    <div className="bg-[#F8F6F6] min-h-screen">
      {/* Sticky Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />

      {/* AI Intelligence Section */}
      {/* <AIIntelligenceSection /> */}

      {/* Curated Listings Section */}
      <CuratedListingsSection />

      {/* The Path to Your New Beginning Section */}
      {/* <ProcessSection /> */}

      {/* Modernizing Federal Housing Services Section */}
      <TrustSignalsSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;