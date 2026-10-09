import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { StoreSettings, ContactMethod, PaymentMethod, OrderItem } from '../types';
import { createOrderInquiry } from '../services/storeService';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldAlert,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
  Landmark,
  Truck,
  Copy,
  Check,
  CreditCard
} from 'lucide-react';

interface CartDrawerProps {
  settings: StoreSettings;
  onOrderSuccess: (orderId: string, whatsappText: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ settings, onOrderSuccess }) => {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice, isCartOpen, setIsCartOpen } = useCart();
  const { user } = useAuth();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('whatsapp');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [copiedBank, setCopiedBank] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const currency = settings.currencySymbol || '$';

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please enter your telephone or WhatsApp number.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Your shopping cart is currently empty.');
      return;
    }

    setSubmitting(true);

    try {
      const orderItems: OrderItem[] = items.map((item) => {
        const itemObj: OrderItem = {
          productId: item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          price: item.product.price,
          quantity: item.quantity,
        };
        if (item.selectedColor) itemObj.color = item.selectedColor;
        if (item.selectedStorage) itemObj.storage = item.selectedStorage;
        if (item.product.imageUrl) itemObj.imageUrl = item.product.imageUrl;
        return itemObj;
      });

      const orderData: Parameters<typeof createOrderInquiry>[0] = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: orderItems,
        totalAmount: totalPrice,
        contactMethod,
        paymentMethod,
      };

      if (customerEmail.trim()) {
        orderData.customerEmail = customerEmail.trim();
      }
      if (deliveryAddress.trim()) {
        orderData.deliveryAddress = deliveryAddress.trim();
      }
      if (notes.trim()) {
        orderData.notes = notes.trim();
      }
      if (user?.uid) {
        orderData.userId = user.uid;
      }

      // Persistently record to Cloud Firestore
      const orderId = await createOrderInquiry(orderData);

      const paymentLabel =
        paymentMethod === 'bank_transfer'
          ? 'Direct Bank Transfer'
          : paymentMethod === 'pay_on_delivery'
          ? 'Pay on Delivery / Pickup'
          : 'Direct WhatsApp Confirmation';

      // Construct WhatsApp message pre-fill
      const formattedItemsList = items
        .map(
          (i, idx) =>
            `${idx + 1}. *${i.product.name}* (${i.selectedStorage ? `${i.selectedStorage}, ` : ''}${i.selectedColor ? `${i.selectedColor}, ` : ''}Qty: ${i.quantity}) - ${currency}${(i.product.price * i.quantity).toFixed(2)}`
        )
        .join('\n');

      const whatsappText = `*NEW ORDER INQUIRY [Ref: #${orderId}]*
Store: ${settings.storeName || 'ZY GADGET STORE'}

*Customer Name:* ${customerName.trim()}
*Contact Phone:* ${customerPhone.trim()}
${customerEmail ? `*Email:* ${customerEmail.trim()}\n` : ''}${deliveryAddress ? `*Delivery/Pickup:* ${deliveryAddress.trim()}\n` : ''}*Preferred Contact:* ${contactMethod.toUpperCase()}
*Payment Method:* ${paymentLabel}

*Items:*
${formattedItemsList}

*Total Order Value:* ${currency}${totalPrice.toFixed(2)}
${notes ? `\n*Notes:* ${notes.trim()}` : ''}`;

      clearCart();
      setIsCheckingOut(false);
      setIsCartOpen(false);
      onOrderSuccess(orderId, whatsappText);
    } catch (err: unknown) {
      console.error('Failed to submit order inquiry:', err);
      setErrorMessage('Failed to submit order to database. Please check your network connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-base">
              {isCheckingOut ? 'Complete Order Inquiry' : `Shopping Cart (${items.length})`}
            </h2>
          </div>
          <button
            onClick={() => {
              setIsCartOpen(false);
              setIsCheckingOut(false);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Your cart is empty</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Explore our smartphone and gadget catalogue to add items to your cart.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                Continue Browsing
              </button>
            </div>
          ) : isCheckingOut ? (
            /* Checkout Inquiry Form */
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">No online card payment required.</span>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    Your inquiry will be logged directly into our store database. The store owner will verify stock and contact you to arrange payment and delivery.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full text-base p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +1 234 567 8900"
                  className="w-full text-base p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full text-base p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Address or Pickup Preference
                </label>
                <textarea
                  rows={2}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. 124 Main Street, City (or Store Pickup)"
                  className="w-full text-base p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method Preference *
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      paymentMethod === 'bank_transfer' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Direct Bank Transfer</span>
                        {paymentMethod === 'bank_transfer' && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md">Selected</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Transfer to verified store bank account with immediate proof verification.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay_on_delivery')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                      paymentMethod === 'pay_on_delivery'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      paymentMethod === 'pay_on_delivery' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Pay on Delivery / Store Pickup</span>
                        {paymentMethod === 'pay_on_delivery' && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md">Selected</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Inspect gadget and make payment on physical arrival or pickup hub.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('whatsapp_order')}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-colors cursor-pointer ${
                      paymentMethod === 'whatsapp_order'
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                      paymentMethod === 'whatsapp_order' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Direct WhatsApp Confirmation</span>
                        {paymentMethod === 'whatsapp_order' && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md">Selected</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        Confirm details and discuss payment arrangement directly with owner.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bank Account Details Card if Bank Transfer Selected */}
              {paymentMethod === 'bank_transfer' && (settings.bankName || settings.accountNumber) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs animate-fadeIn">
                  <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-blue-600" />
                      Store Account Details
                    </span>
                    {settings.bankName && (
                      <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-semibold">
                        {settings.bankName}
                      </span>
                    )}
                  </div>

                  {settings.accountNumber && (
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Account Number</span>
                        <span className="font-mono font-bold text-slate-900 text-sm tracking-wider">
                          {settings.accountNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(settings.accountNumber || '');
                          setCopiedBank(true);
                          setTimeout(() => setCopiedBank(false), 2000);
                        }}
                        className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                      >
                        {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedBank ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  {settings.accountName && (
                    <p className="text-slate-600 text-[11px]">
                      <span className="font-semibold text-slate-700">Account Name:</span> {settings.accountName}
                    </p>
                  )}

                  {settings.paymentInstructions && (
                    <p className="text-slate-500 text-[10px] italic">
                      {settings.paymentInstructions}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Contact Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['whatsapp', 'phone', 'email'] as ContactMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setContactMethod(method)}
                      className={`text-xs py-2 px-2 rounded-lg border font-medium capitalize text-center ${
                        contactMethod === method
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-300'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any questions on gadget conditions, accessories, etc."
                  className="w-full text-base p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="w-1/3 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-2/3 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Confirm Order Inquiry'}
                </button>
              </div>
            </form>
          ) : (
            /* Item list */
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={`${item.product.id}-${item.selectedColor}-${item.selectedStorage}-${idx}`}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 items-center"
                >
                  <div className="w-14 h-14 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center flex-shrink-0">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-blue-600 font-medium">
                      {item.product.brand}
                    </p>
                    {(item.selectedColor || item.selectedStorage) && (
                      <p className="text-[10px] text-slate-500">
                        {[item.selectedStorage, item.selectedColor].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    <p className="text-xs font-extrabold text-slate-900 mt-1">
                      {currency}{item.product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => removeFromCart(item.product.id, item.selectedColor, item.selectedStorage)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center border border-slate-300 rounded-md bg-white">
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity - 1, item.selectedColor, item.selectedStorage)
                        }
                        className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 py-0.5 text-[11px] font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product.id, item.quantity + 1, item.selectedColor, item.selectedStorage)
                        }
                        className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && !isCheckingOut && (
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 font-medium">Total Amount:</span>
              <span className="text-xl font-extrabold text-slate-900">
                {currency}{totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={() => setIsCheckingOut(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all text-sm"
            >
              <span>Proceed to Order Inquiry</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={clearCart}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-600"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
