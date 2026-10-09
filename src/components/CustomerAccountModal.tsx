import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { OrderInquiry, StoreSettings } from '../types';
import { subscribeToCustomerOrders } from '../services/storeService';
import { X, User, LogOut, Package, Clock, CheckCircle, AlertTriangle, MessageCircle, ExternalLink } from 'lucide-react';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const [orders, setOrders] = useState<OrderInquiry[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user || !isOpen) return;

    setLoadingOrders(true);
    const unsubscribe = subscribeToCustomerOrders(
      user.uid,
      (fetchedOrders) => {
        setOrders(fetchedOrders);
        setLoadingOrders(false);
      },
      (err) => {
        console.error('Customer orders error:', err);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const currency = settings.currencySymbol || '$';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Completed</span>;
      case 'processing':
        return <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">Processing</span>;
      case 'contacted':
        return <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">Contacted</span>;
      case 'cancelled':
        return <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">Cancelled</span>;
      default:
        return <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">Pending Review</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-base">Customer Account</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div>
            <p className="text-sm font-bold truncate max-w-[220px]">
              {user.displayName || user.email?.split('@')[0]}
            </p>
            <p className="text-xs text-slate-400 truncate max-w-[220px]">
              {user.email}
            </p>
            <span className="inline-block mt-1 text-[10px] font-semibold bg-blue-900/80 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded-md">
              Customer Account
            </span>
          </div>
          <button
            onClick={async () => {
              await logout();
              onClose();
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Orders Section */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Your Inquiries & Orders ({orders.length})</span>
            </h3>
          </div>

          {loadingOrders ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Loading your submitted orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No orders placed yet</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                When you submit gadget purchase inquiries through our store, they will appear here with live tracking.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <div>
                      <span className="font-mono font-bold text-blue-600 text-[11px]">
                        #{order.id}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      {order.paymentMethod && (
                        <span className="text-[10px] text-blue-700 font-semibold ml-2 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {order.paymentMethod === 'bank_transfer'
                            ? 'Bank Transfer'
                            : order.paymentMethod === 'pay_on_delivery'
                            ? 'Pay on Delivery'
                            : 'WhatsApp Order'}
                        </span>
                      )}
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="space-y-1">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-slate-700 text-[11px]">
                        <span className="truncate max-w-[200px]">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {currency}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 font-bold text-slate-900">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">
                      {currency}{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security & Access Info note */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-500 text-center">
          Customer account data is strictly isolated. Administrative store management is restricted to authorized store owners.
        </div>
      </div>
    </div>
  );
};
