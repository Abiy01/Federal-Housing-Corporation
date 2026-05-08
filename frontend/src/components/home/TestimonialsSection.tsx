import React from 'react';

const TestimonialsSection: React.FC = () => {
  return (
    <section className="bg-[#F9F7F2] py-24">
      <div className="max-w-[1280px] mx-auto px-8">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-16">
          <div>
            <div className="font-space-mono text-sm text-[#D4755B] uppercase tracking-widest mb-4">Testimonials</div>
            <h2 className="font-fraunces text-5xl text-[#111827]">What Our Clients Say</h2>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Testimonial 1 */}
          <div className="bg-white border border-[#f3f4f6] rounded-2xl p-8">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-icons text-[#FCD34D] text-xl">star</span>
              ))}
            </div>
            <p className="font-manrope text-base text-[#4b5563] leading-relaxed mb-6">
              "FHC’s digital process helped us submit our housing request quickly, and every step was clearly tracked."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E5E7EB] rounded-full" />
              <div>
                <div className="font-syne font-bold text-sm text-[#111827]">Eden Mulugeta</div>
                <div className="font-manrope text-xs text-[#6b7280]">Piazza, Addis Ababa</div>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white border border-[#f3f4f6] rounded-2xl p-8">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-icons text-[#FCD34D] text-xl">star</span>
              ))}
            </div>
            <p className="font-manrope text-base text-[#4b5563] leading-relaxed mb-6">
              "Verified listing details and location information gave us confidence before scheduling a visit."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E5E7EB] rounded-full" />
              <div>
                <div className="font-syne font-bold text-sm text-[#111827]">Bisrat Dereje</div>
                <div className="font-manrope text-xs text-[#6b7280]">Bole, Addis Ababa</div>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white border border-[#f3f4f6] rounded-2xl p-8">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-icons text-[#FCD34D] text-xl">star</span>
              ))}
            </div>
            <p className="font-manrope text-base text-[#4b5563] leading-relaxed mb-6">
              "A transparent and reliable housing experience that reduced delays and made decisions easier."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#E5E7EB] rounded-full" />
              <div>
                <div className="font-syne font-bold text-sm text-[#111827]">Hailu Tefera</div>
                <div className="font-manrope text-xs text-[#6b7280]">4 kilo, Addis Ababa</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
