import React from 'react';

const teamImage = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1400&q=80';

const TrustSignalsSection: React.FC = () => {
  return (
    <section className="bg-[#F8F6F6] py-24">
      <div className="max-w-[1280px] mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-fraunces text-5xl text-[#111827] mb-6">Modernizing Federal Housing Services</h2>
          <div className="w-24 h-1 bg-[#D4755B] mx-auto" />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left - Image with Border */}
          <div className="relative">
            <div className="border-2 border-[rgba(212,117,91,0.2)] rounded-2xl p-4">
              <img
                src={teamImage}
                alt="Team meeting in modern office"
                className="rounded-2xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] w-full"
              />
            </div>
          </div>

          {/* Right - Features */}
          <div className="space-y-12">
            {/* Feature 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white rounded-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-center">
                  <span className="font-material-icons text-2xl text-[#D4755B]">verified_user</span>
                </div>
              </div>
              <div>
                <h4 className="font-syne font-bold text-xl text-[#111827] mb-2">Verified Listings</h4>
                <p className="font-manrope text-base text-[#4b5563] leading-relaxed">
                 Every listing is reviewed and validated to provide accurate property information and trusted availability.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white rounded-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-center">
                  <span className="font-material-icons text-2xl text-[#D4755B]">support_agent</span>
                </div>
              </div>
              <div>
                <h4 className="font-syne font-bold text-xl text-[#111827] mb-2">Guided Support</h4>
                <p className="font-manrope text-base text-[#4b5563] leading-relaxed">
                Get help with requests, viewing coordination, and process guidance through official FHC service channels.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white rounded-lg shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1)] flex items-center justify-center">
                  <span className="font-material-icons text-2xl text-[#D4755B]">savings</span>
                </div>
              </div>
              <div>
                <h4 className="font-syne font-bold text-xl text-[#111827] mb-2">Transparent Pricing</h4>
                <p className="font-manrope text-base text-[#4b5563] leading-relaxed">
                See clear rent or sale values and recorded payment references with no hidden charges.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSignalsSection;
