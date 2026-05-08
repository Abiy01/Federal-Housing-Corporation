import React from 'react';
import { Lightbulb, Eye, Award } from 'lucide-react';

const AboutValuesSection: React.FC = () => {
  const values = [
    {
      icon: Lightbulb,
      title: 'Digital Transformation',
      description: 'We modernize federal housing operations with practical technology that improves speed, consistency, and service quality.'
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: 'Clear listings, recorded approvals, and traceable actions help users make informed decisions with confidence.'
    },
    {
      icon: Award,
      title: 'Service Excellence',
      description: 'From first search to final approval, we deliver reliable support, accountable processes, and consistent housing service standards.'
    }
  ];

  return (
    <section className="bg-[#F8F6F6] py-24">
      <div className="max-w-[1280px] mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="font-space-mono text-xs text-[#D4755B] uppercase tracking-[1.2px] mb-4">
            Our Ethos
          </div>
          <h2 className="font-syne text-4xl text-[#221410]">
          Driven by Public Service
          </h2>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => (
            <div 
              key={index}
              className="bg-white border border-[#E6E0DA] rounded-xl p-8 text-center hover:shadow-lg transition-shadow"
            >
              {/* Icon Circle */}
              <div className="w-16 h-16 bg-[rgba(236,70,19,0.1)] rounded-full flex items-center justify-center mx-auto mb-6">
                <value.icon className="w-8 h-8 text-[#D4755B]" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3 className="font-syne text-xl text-[#221410] mb-4">
                {value.title}
              </h3>

              {/* Description */}
              <p className="font-manrope font-extralight text-sm leading-[22.75px] text-[#4b5563]">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutValuesSection;