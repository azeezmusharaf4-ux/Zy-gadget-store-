import React from 'react';
import { StoreSettings } from '../types';
import { Smartphone, ShieldCheck, Lock } from 'lucide-react';

interface FooterProps {
  settings: StoreSettings;
  onOpenAdmin: () => void;
  onScrollToCatalog: () => void;
  onScrollToContact: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  onOpenAdmin,
  onScrollToCatalog,
  onScrollToContact,
}) => {
  return (
    <footer id="contact-section" className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                {settings.storeName || 'ZY GADGET STORE'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Your trusted electronics and smartphone destination. Accurate device grading, real inventory synchronization, and direct order communication.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Explore
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button
                  onClick={onScrollToCatalog}
                  className="hover:text-white transition-colors"
                >
                  Live Product Catalogue
                </button>
              </li>
              <li>
                <button
                  onClick={onScrollToContact}
                  className="hover:text-white transition-colors"
                >
                  Customer Support & Hours
                </button>
              </li>
              <li>
                <button
                  onClick={onScrollToCatalog}
                  className="hover:text-white transition-colors"
                >
                  Smartphones & Flagships
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Store Details */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Store Information
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-400">
              {settings.phone && settings.phone !== 'Update Phone in Admin Settings' && (
                <p>Phone: {settings.phone}</p>
              )}
              {settings.email && (
                <p>Email: {settings.email}</p>
              )}
              {settings.businessHours && (
                <p>Hours: {settings.businessHours}</p>
              )}
            </div>
          </div>

          {/* Col 4: Store Administration */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Store Administration
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Restricted owner-only portal for inventory management and customer inquiries.
            </p>
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-400 hover:text-blue-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Owner Portal</span>
            </button>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 text-center sm:text-left">
          <p>© {new Date().getFullYear()} {settings.storeName || 'ZY GADGET STORE'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
