import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const LegalPage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-[#FAF8F4] py-8 sm:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-[#E6E0DA] rounded-2xl p-5 sm:p-8 shadow-xl">
          <div className="mb-8">
            <h1 className="font-syne font-bold text-2xl sm:text-3xl text-[#221410] mb-2">Legal Information</h1>
            <p className="font-manrope font-extralight text-sm text-[#4B5563]">
              Please review our Terms & Conditions and Privacy Policy before creating an account.
            </p>
          </div>

          <div id="terms" className="scroll-mt-24 border-t border-[#F3ECE5] pt-6">
            <h2 className="font-syne font-bold text-xl sm:text-2xl text-[#221410] mb-3">Terms & Conditions</h2>
            <div className="space-y-3 font-manrope font-extralight text-sm text-[#4B5563] leading-relaxed">
              <p>
                By using this platform, you agree to provide accurate, complete information and use the service only for
                lawful housing-related purposes.
              </p>
              <p>
                Property listings, rent or buy requests, payment submissions, and maintenance requests are subject to
                verification, approval, and operational review by authorized personnel.
              </p>
              <p>
                Users are responsible for documents and files uploaded to the system, including payment receipts and
                contract scans. Submitting false, misleading, or unauthorized information may result in rejection,
                suspension, or account restrictions.
              </p>
              <p>
                The platform may update workflows, eligibility checks, and service rules to comply with operational and
                regulatory requirements. Continued use after such updates constitutes acceptance of the revised terms.
              </p>
              <p>
                Access to specific modules is controlled by role-based permissions. Unauthorized access attempts and key
                actions may be logged for audit and security purposes.
              </p>
              <p>
                While we aim for high availability and data accuracy, temporary interruptions, maintenance windows, or
                third-party service issues may occur. The platform is provided on a best-effort basis within applicable
                service standards.
              </p>
            </div>
          </div>

          <div id="privacy" className="scroll-mt-24 border-t border-[#F3ECE5] pt-6 mt-8">
            <h2 className="font-syne font-bold text-xl sm:text-2xl text-[#221410] mb-3">Privacy Policy</h2>
            <div className="space-y-3 font-manrope font-extralight text-sm text-[#4B5563] leading-relaxed">
              <p>
                We collect account, contact, and request-related information to provide core services such as
                registration, housing requests, payment verification, lease workflows, and maintenance support.
              </p>
              <p>
                Uploaded files (such as receipts and contract images), references, and request history are processed for
                verification, fraud prevention, audit, and operational decision-making.
              </p>
              <p>
                Personal data is accessible only to authorized roles based on operational need. We apply role-based
                controls, authentication checks, and logging mechanisms to protect user information.
              </p>
              <p>
                We may share limited data with approved service providers strictly for platform operation (for example,
                communication delivery or secure file processing), and only under appropriate safeguards.
              </p>
              <p>
                We retain records for service continuity, compliance, and audit obligations. Retention periods may vary
                by data type and applicable policy or legal requirements.
              </p>
              <p>
                You may request updates to your account details through available profile or support channels. By using
                the platform, you consent to the collection and processing practices described in this policy.
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#F3ECE5] flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center bg-[#D4755B] hover:bg-[#C05621] text-white font-manrope font-bold text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              Back to Sign Up
            </Link>
            <Link
              to="/signin"
              className="inline-flex items-center justify-center border border-[#E6E0DA] text-[#4B5563] hover:text-[#221410] hover:bg-[#FAF8F4] font-manrope font-medium text-sm px-5 py-2.5 rounded-lg transition-colors"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
