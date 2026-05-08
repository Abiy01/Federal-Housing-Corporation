import React from 'react';

const mainAboutImage = 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1600&q=80';

const AboutHeroSection: React.FC = () => {
  return (
    <section className="relative bg-[#C05621] h-[480px] overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{ 
          backgroundImage: `url('${mainAboutImage}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} 
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center max-w-[702px] px-8">
          <h1 className="font-fraunces text-[56px] leading-[61.6px] text-[#F2EFE9] mb-6">
          Modernizing Federal Housing Services with<br />
            <span className="italic"> Clarity & Trust</span>
          </h1>
          
          {/* Divider */}
          <div className="w-24 h-px bg-[rgba(242,239,233,0.4)] mx-auto mb-8" />
          
          <p className="font-manrope font-extralight text-lg text-[rgba(242,239,233,0.9)] tracking-wide">
          Where verified data, transparent workflows, and citizen-focused service come together.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutHeroSection;