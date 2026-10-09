import React from 'react';
import { StoreSettings } from '../types';
import { Phone, MessageCircle, Clock } from 'lucide-react';

interface AnnouncementBarProps {
  settings: StoreSettings;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ settings }) => {
  return (
    <div className="bg-slate-900 text-slate-200 text-xs py-2 px-3 sm:px-6 border-b border-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4 text-center sm:text-left min-w-0">
        <p className="font-medium text-slate-100 truncate w-full sm:w-auto max-w-xl min-w-0">
          {settings.announcement || 'Welcome to ZY GADGET STORE — Authentic Gadgets & Mobile Tech'}
        </p>
        <div className="flex items-center justify-center flex-wrap gap-3 sm:gap-4 text-slate-300 text-[11px] sm:text-xs min-w-0">
          {settings.phone && settings.phone !== 'Update Phone in Admin Settings' && (
            <a
              href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>{settings.phone}</span>
            </a>
          )}
          {settings.whatsapp && settings.whatsapp !== 'Update WhatsApp in Admin Settings' && (
            <a
              href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">WhatsApp Inquiries</span>
            </a>
          )}
          {settings.businessHours && (
            <span className="hidden lg:flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{settings.businessHours}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
