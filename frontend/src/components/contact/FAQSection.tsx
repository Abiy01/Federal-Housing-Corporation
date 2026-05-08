import React, { useState } from 'react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: "How do I request to rent or buy a property?",
      answer: "Open a property details page, choose Request to Rent or Request to Buy, then submit your payment reference with the required receipt and clear scanned contract image. Your request is sent for admin review."
    },
    {
      id: 2,
      question: "Which payment methods are supported?",
      answer: "The platform supports Telebirr, CBE Birr, and CBE. After payment, upload your proof and reference number so the finance/admin workflow can verify and process your request."
    },
    {
      id: 3,
      question: "How do I know if my request is approved or rejected?",
      answer: "You can track status from your transaction requests page. Requests move through pending, approved, or rejected states, and payment review notes are shown when provided."
    },
    {
      id: 4,
      question: "Who can submit maintenance requests?",
      answer: "Only users with an active rent lease for a property can submit maintenance requests for that unit. Assigned maintenance staff and admins then handle progress updates and resolution."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-white py-24">
      <div className="max-w-[1280px] mx-auto px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-3">
            <span className="font-space-mono text-xs text-[#D4755B] uppercase tracking-widest">
              Help Center
            </span>
          </div>
          <h2 className="font-syne font-bold text-4xl text-[#221410] mb-4">
            Common Questions
          </h2>
          <p className="font-manrope text-lg text-[#4B5563] leading-relaxed max-w-[640px] mx-auto">
            Find quick answers about housing requests, payments, approvals, and support services.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-[800px] mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={faq.id}
              className="bg-[#F9F7F2] border border-[#E6E0DA] rounded-xl overflow-hidden transition-all"
            >
              {/* Question */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center gap-4 p-6 text-left hover:bg-[#F2EFE9] transition-colors"
              >
                {/* Number Badge */}
                <div className="w-8 h-8 bg-[#F9F7F2] border border-[#E6E0DA] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-syne font-bold text-sm text-[#D4755B]">
                    {String(faq.id).padStart(2, '0')}
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="flex-1 font-syne font-bold text-lg text-[#221410]">
                  {faq.question}
                </h3>

                {/* Expand/Collapse Icon */}
                <span className={`material-icons text-[#D4755B] transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}>
                  expand_more
                </span>
              </button>

              {/* Answer */}
              {openIndex === index && (
                <div className="px-6 pb-6 pl-[72px]">
                  <p className="font-manrope font-extralight text-sm text-[#4B5563] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View All Questions Link */}
        <div className="text-center mt-12">
          <a 
            href="#" 
            className="inline-flex items-center gap-2 font-manrope font-bold text-base text-[#D4755B] hover:text-[#C05621] transition-colors group"
          >
            <span>Contact Support Team</span>
            <span className="material-icons text-lg group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;