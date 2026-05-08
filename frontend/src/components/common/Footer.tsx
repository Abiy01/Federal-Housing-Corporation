import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, MapPin, Phone, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#111827] text-white">
      <div className="max-w-[1280px] mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          {/* Brand Column */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src="/Logo2.png" alt="FHC" className="h-10 w-auto brightness-0 invert" />
              <span className="font-fraunces text-2xl font-bold">FHC</span>
            </Link>
            <p className="font-manrope font-extralight text-[#9ca3af] text-sm leading-relaxed mb-6">
            Federal housing platform connecting tenants, buyers, and sellers through trusted listings, transparent workflows, and accountable service.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[rgba(255,255,255,0.05)] hover:bg-[#D4755B] border border-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center transition-all group"
              >
                <Facebook className="w-5 h-5 text-[#9ca3af] group-hover:text-white transition-colors" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[rgba(255,255,255,0.05)] hover:bg-[#D4755B] border border-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center transition-all group"
              >
                <Twitter className="w-5 h-5 text-[#9ca3af] group-hover:text-white transition-colors" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[rgba(255,255,255,0.05)] hover:bg-[#D4755B] border border-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center transition-all group"
              >
                <Instagram className="w-5 h-5 text-[#9ca3af] group-hover:text-white transition-colors" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[rgba(255,255,255,0.05)] hover:bg-[#D4755B] border border-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center transition-all group"
              >
                <Linkedin className="w-5 h-5 text-[#9ca3af] group-hover:text-white transition-colors" />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[rgba(255,255,255,0.05)] hover:bg-[#D4755B] border border-[rgba(255,255,255,0.1)] rounded-lg flex items-center justify-center transition-all group"
              >
                <Youtube className="w-5 h-5 text-[#9ca3af] group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="font-syne font-bold text-white text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/properties" className="font-manrope font-extralight text-[#9ca3af] text-sm hover:text-white hover:pl-2 transition-all inline-block">
                  Browse Properties
                </Link>
              </li>
              <li>
                <Link to="/about" className="font-manrope font-extralight text-[#9ca3af] text-sm hover:text-white hover:pl-2 transition-all inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="font-manrope font-extralight text-[#9ca3af] text-sm hover:text-white hover:pl-2 transition-all inline-block">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info Column */}
          <div>
            <h4 className="font-syne font-bold text-white text-lg mb-6">Contact Info</h4>
            <ul className="space-y-4">
              <li>
                <a href="https://maps.app.goo.gl/MqhnuoQCEoz7TXXy8?g_st=atm" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 font-manrope font-extralight text-[#9ca3af] text-sm hover:text-white transition-colors group">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-[#D4755B]" />
                  <span className="leading-relaxed">
                    Mexico Square, FHC Building,<br />
                    Addis Ababa, Ethiopia
                  </span>
                </a>
              </li>
              <li>
                <a href="tel:+251-115-513-000" className="flex items-center gap-3 font-manrope font-extralight text-[#9ca3af] text-sm hover:text-white transition-colors">
                  <Phone className="w-5 h-5 flex-shrink-0 text-[#D4755B]" />
                  <span>+251-115-513-000</span>
                </a>
              </li>
              <li>
                <a href="mailto:info@fhc.gov.et" className="flex items-center gap-3 font-manrope font-extralight text-[#9ca3af] text-sm hover:text-white transition-colors">
                  <Mail className="w-5 h-5 flex-shrink-0 text-[#D4755B]" />
                  <span>info@fhc.gov.et</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[rgba(255,255,255,0.1)] pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-manrope font-extralight text-[#6b7280] text-sm text-center md:text-left">
              © 2026 FHC. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/legal#privacy" className="font-manrope font-extralight text-[#6b7280] text-sm hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/legal#terms" className="font-manrope font-extralight text-[#6b7280] text-sm hover:text-white transition-colors">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;