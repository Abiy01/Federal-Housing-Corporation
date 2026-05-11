import React from 'react';
import { Link } from 'react-router-dom';

const CTASection: React.FC = () => {
  return (
    <section className="bg-[#EC4613] py-24 relative overflow-hidden">
      {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay pointer-events-none"
          aria-hidden
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,255,255,0.07) 8px, rgba(255,255,255,0.07) 16px)',
          }}
        />
        <div className="absolute top-0 left-1/4 w-96"/>

      <div className="max-w-[1280px] mx-auto px-8 text-center relative z-10">
        <h2 className="font-fraunces text-5xl text-white mb-6">
        Ready to Find the Right Home?
        </h2>
        <p className="font-manrope font-light text-xl text-white/90 mb-10 max-w-[680px] mx-auto">
        Join citizens, tenants, and buyers using FHC’s trusted digital platform for transparent rental and property services.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/signup" className="bg-white text-[#C05621] font-manrope font-bold text-lg px-10 py-4 rounded-xl shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] hover:shadow-2xl transition-all inline-block">
            Get Started
          </Link>
          <Link to="/contact" className="border-2 border-white text-white font-manrope font-bold text-lg px-10 py-4 rounded-xl hover:bg-white hover:text-[#C05621] transition-all inline-block">
            Schedule a Demo
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
