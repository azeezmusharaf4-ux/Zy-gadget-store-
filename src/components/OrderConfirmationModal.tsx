import React from 'react';
import { StoreSettings } from '../types';
import { CheckCircle2, MessageCircle, X, Copy, Phone } from 'lucide-react';

interface OrderConfirmationModalProps {
  orderId: string;
  whatsappText: string;
  settings: StoreSettings;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  orderId,
  whatsappText,
  settings,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  const cleanWhatsapp = settings.whatsapp?.replace(/[^0-9]/g, '');
  const hasWhatsapp = cleanWhatsapp && settings.whatsapp !== 'Update WhatsApp in Admin Settings';
  const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(whatsappText)}`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 mb-1">
          Order Inquiry Submitted!
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Your order request has been securely recorded in our live store database.
        </p>

        {/* Reference code box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Reference ID
            </span>
            <span className="font-mono text-sm font-bold text-blue-600">
              #{orderId}
            </span>
          </div>
          <button
            onClick={handleCopyRef}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-md"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Bank Account Details if configured by store owner */}
        {settings.accountNumber && (
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 mb-4 text-left space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 border-b border-blue-200/60 pb-1">
              <span className="text-blue-900 font-bold">Store Bank Account Details</span>
              {settings.bankName && (
                <span className="text-[10px] font-semibold bg-blue-200/80 text-blue-800 px-1.5 py-0.5 rounded">
                  {settings.bankName}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="font-mono font-bold text-slate-900 text-sm">
                {settings.accountNumber}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(settings.accountNumber || '');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-[11px] font-semibold text-blue-600 bg-white border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors"
              >
                Copy Account
              </button>
            </div>
            {settings.accountName && (
              <p className="text-[11px] text-slate-600">
                <span className="font-medium text-slate-700">Name:</span> {settings.accountName}
              </p>
            )}
            {settings.paymentInstructions && (
              <p className="text-[10px] text-slate-500 italic pt-0.5">
                {settings.paymentInstructions}
              </p>
            )}
          </div>
        )}

        {/* Direct WhatsApp trigger */}
        {hasWhatsapp ? (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-slate-700">
              For fastest dispatch, send this pre-filled message directly to our WhatsApp:
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send via WhatsApp to Store Owner</span>
            </a>
          </div>
        ) : (
          settings.phone && settings.phone !== 'Update Phone in Admin Settings' && (
            <div className="mb-4">
              <p className="text-xs text-slate-600 mb-2">You can also contact our store directly by phone:</p>
              <a
                href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Store: {settings.phone}</span>
              </a>
            </div>
          )
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};
