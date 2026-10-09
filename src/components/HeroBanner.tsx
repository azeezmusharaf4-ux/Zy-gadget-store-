import React from 'react';
import { ArrowRight } from 'lucide-react';
import { StoreSettings } from '../types';

interface HeroBannerProps {
  settings: StoreSettings;
  onBrowseCatalogue: () => void;
  onContactStore: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  settings,
  onBrowseCatalogue,
  onContactStore,
}) => {
  return (
    <section className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-10 sm:py-14 px-4 sm:px-6 border-b border-slate-800 relative overflow-hidden">
      {/* Decorative subtle ambient circles */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 text-center space-y-5">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Quality Tech, Phones & Modern Gadgets at <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">{settings.storeName || 'ZY GADGET STORE'}</span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Explore authentic gadgets, smartphones, accessories, and audio gear. Browse our current live inventory, inspect real product specifications, and submit direct purchase inquiries.
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onBrowseCatalogue}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all shadow-md shadow-blue-600/25"
          >
            <span>Browse Live Catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onContactStore}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm px-5 py-3 rounded-xl border border-slate-700 transition-all"
          >
            <span>Contact Store</span>
          </button>
        </div>
      </div>
    </section>
  );
};
