import React, { useState } from 'react';
import { Product, StoreSettings } from '../types';
import { useCart } from '../context/CartContext';
import { X, ShoppingBag, MessageCircle, Phone, CheckCircle, Shield, AlertCircle } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  settings: StoreSettings;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  settings,
  onClose,
}) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const [selectedImage, setSelectedImage] = useState(product.imageUrl);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Parse color options
  const colorList = product.colors
    ? product.colors.split(',').map((c) => c.trim()).filter(Boolean)
    : [];
  const [selectedColor, setSelectedColor] = useState(colorList[0] || '');

  // Parse storage options
  const storageList = product.storageCapacity
    ? product.storageCapacity.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const [selectedStorage, setSelectedStorage] = useState(storageList[0] || '');

  const currency = settings.currencySymbol || '$';
  const isOutOfStock = product.status === 'out_of_stock' || product.stock <= 0;

  const allImages = [
    product.imageUrl,
    ...(product.additionalImages || [])
  ].filter(Boolean);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity, selectedColor || undefined, selectedStorage || undefined);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  // Construct direct WhatsApp message
  const whatsappNumber = settings.whatsapp?.replace(/[^0-9]/g, '');
  const orderMessage = `Hello ${settings.storeName || 'ZY GADGET STORE'}!
I am interested in purchasing:
*Product:* ${product.name}
*Brand:* ${product.brand}
*Condition:* ${product.condition}
${selectedStorage ? `*Storage:* ${selectedStorage}\n` : ''}${selectedColor ? `*Color:* ${selectedColor}\n` : ''}*Price:* ${currency}${product.price.toFixed(2)}
*Quantity:* ${quantity}

Please confirm availability and how I can proceed with delivery/pickup.`;

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs px-4 sm:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
              {product.brand} • {product.category}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-sm sm:max-w-md">
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Left: Gallery */}
          <div className="md:col-span-6 space-y-3">
            <div className="w-full pt-[85%] relative bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-contain p-4"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <AlertCircle className="w-10 h-10 mb-2" />
                  <span className="text-xs">No image provided</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`w-16 h-16 rounded-lg border-2 p-1 bg-slate-50 flex-shrink-0 transition-all ${
                      selectedImage === img
                        ? 'border-blue-600 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Condition & Authenticity Note */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>Device Condition: {product.condition}</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                {product.condition === 'Brand New'
                  ? 'Factory sealed in original retail box with full manufacturer components.'
                  : product.condition === 'Open Box'
                  ? 'Opened box or customer return; fully inspected, clean condition with original accessories.'
                  : product.condition === 'Refurbished'
                  ? 'Professionally inspected, cleaned, tested, and fully functional.'
                  : 'Inspected and certified fully working gadget by store technician.'}
              </p>
            </div>
          </div>

          {/* Right: Info & Controls */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Pricing & Stock */}
              <div>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {currency}{product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-sm text-slate-400 line-through">
                      {currency}{product.originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Save {currency}{(product.originalPrice - product.price).toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{isOutOfStock ? 'Currently Out of Stock' : `In Stock (${product.stock} units available)`}</span>
                  </span>
                </div>
              </div>

              {/* Color Selection */}
              {colorList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Available Colour: <span className="text-blue-600">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorList.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`px-3 py-1 text-xs rounded-lg border font-medium transition-all ${
                          selectedColor === c
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Storage Selection */}
              {storageList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Storage Capacity: <span className="text-blue-600">{selectedStorage}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {storageList.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedStorage(s)}
                        className={`px-3 py-1 text-xs rounded-lg border font-medium transition-all ${
                          selectedStorage === s
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              {!isOutOfStock && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-700">Quantity:</span>
                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-slate-800 min-w-[28px] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    Product Description
                  </h4>
                  <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100 max-h-36 overflow-y-auto">
                    {product.description}
                  </div>
                </div>
              )}

              {/* Specifications */}
              {product.specifications && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    Key Specifications
                  </h4>
                  <div className="text-xs text-slate-700 bg-blue-50/50 p-3 rounded-xl border border-blue-100 whitespace-pre-line font-mono text-[11px]">
                    {product.specifications}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-4 border-t border-slate-200">
              {addedNotice && (
                <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 animate-fadeIn">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Item successfully added to shopping cart!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                    isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                {whatsappNumber && settings.whatsapp !== 'Update WhatsApp in Admin Settings' ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquire on WhatsApp</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Proceed to Order</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
