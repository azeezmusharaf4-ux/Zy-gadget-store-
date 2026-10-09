import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Product, Category, StoreSettings } from './types';
import {
  subscribeToProducts,
  subscribeToCategories,
  subscribeToStoreSettings,
  DEFAULT_CATEGORIES,
  INITIAL_SETTINGS
} from './services/storeService';

import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { AuthModal } from './components/AuthModal';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';

import {
  Sparkles,
  PackageX,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Smartphone
} from 'lucide-react';

function Storefront() {
  const { user, loading: authLoading } = useAuth();

  // Store Data States (Exclusively from Cloud Firestore)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);

  // Connection & Loading States
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [priceSort, setPriceSort] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  // Modal States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<{
    orderId: string;
    whatsappText: string;
  } | null>(null);

  // Check URL pathname or hash for /admin on load
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || hash === '#admin') {
        setIsAdminOpen(true);
      }
    };
    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  // Sync admin view with browser URL
  const handleOpenAdmin = () => {
    setIsAdminOpen(true);
    try {
      window.history.pushState(null, '', '#admin');
    } catch {
      // Ignore if iframe policy restricts pushState
    }
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    try {
      if (window.location.hash === '#admin') {
        window.history.pushState(null, '', window.location.pathname);
      }
    } catch {
      // Ignore
    }
  };

  // Subscribe to Live Products from Cloud Firestore
  useEffect(() => {
    setProductsLoading(true);
    setProductsError(null);

    const unsubscribe = subscribeToProducts(
      (items) => {
        setProducts(items);
        setProductsLoading(false);
        setProductsError(null);
      },
      (error) => {
        console.error('Failed to load products from Cloud Firestore:', error);
        setProductsLoading(false);
        setProductsError('Unable to connect to live catalogue. Please verify your internet connection.');
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to Categories
  useEffect(() => {
    const unsubscribe = subscribeToCategories(
      (items) => {
        if (items.length > 0) {
          setCategories(items);
        } else {
          // If no categories yet created in firestore, provide category names for browsing
          setCategories(
            DEFAULT_CATEGORIES.map((c) => ({
              id: c.slug,
              name: c.name,
              slug: c.slug,
              description: c.description,
            }))
          );
        }
      },
      (err) => {
        console.warn('Category sync note:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to Store Settings
  useEffect(() => {
    const unsubscribe = subscribeToStoreSettings(
      (data) => setSettings(data),
      (err) => console.warn('Settings sync note:', err)
    );

    return () => unsubscribe();
  }, []);

  // Retry loading products
  const handleRetryLoad = () => {
    setProductsLoading(true);
    setProductsError(null);
    subscribeToProducts(
      (items) => {
        setProducts(items);
        setProductsLoading(false);
        setProductsError(null);
      },
      (err) => {
        setProductsLoading(false);
        setProductsError('Unable to connect to live catalogue. Please retry.');
      }
    );
  };

  // Compute product count per category
  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Featured products (Strictly real products entered by owner with isFeatured: true)
  const featuredProducts = useMemo(() => {
    return products.filter((p) => p.isFeatured && p.status !== 'archived');
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Exclude archived products from public customer view
      if (p.status === 'archived') return false;

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        const matchesDesc = (p.description || '').toLowerCase().includes(q);
        const matchesSpecs = (p.specifications || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBrand && !matchesCat && !matchesDesc && !matchesSpecs) {
          return false;
        }
      }

      // Category match
      if (selectedCategory !== 'all') {
        if (p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // Condition match
      if (selectedCondition !== 'all') {
        if (p.condition !== selectedCondition) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (priceSort === 'price-asc') return a.price - b.price;
      if (priceSort === 'price-desc') return b.price - a.price;
      // Default: featured first, then newest
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [products, searchQuery, selectedCategory, selectedCondition, priceSort]);

  // Scroll helpers
  const scrollToCatalog = () => {
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToContact = () => {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBrowseCatalogue = () => {
    if (user) {
      scrollToCatalog();
    } else {
      setIsAuthOpen(true);
    }
  };

  // Prevent flash of wrong layout while Firebase auth state is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/25 animate-pulse">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div className="text-base font-extrabold tracking-tight">ZY GADGET STORE</div>
        <div className="text-xs text-blue-400 mt-1 font-semibold uppercase tracking-wider">
          Authentic Electronics
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. Top Announcement Bar */}
      <AnnouncementBar settings={settings} />

      {/* 2. Main Header / Navbar */}
      <Navbar
        settings={settings}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        onNavigateHome={() => {
          setSelectedCategory('all');
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onScrollToCatalog={handleBrowseCatalogue}
        onScrollToContact={scrollToContact}
      />

      {/* CONDITIONAL CONTENT: BEFORE LOGIN (WELCOME PAGE ONLY) vs AFTER LOGIN (PRODUCT CATALOGUE) */}
      {!user ? (
        /* 1. BEFORE LOGIN — SHOW ONLY THE WELCOME PAGE */
        <main className="flex-1 flex flex-col bg-slate-900">
          {/* Blue Welcome Section */}
          <HeroBanner
            settings={settings}
            onBrowseCatalogue={() => setIsAuthOpen(true)}
            onContactStore={scrollToContact}
          />
        </main>
      ) : (
        /* 2. AFTER SUCCESSFUL LOGIN — DIRECTLY TO SHOPPING CATALOGUE */
        <main className="flex-1 flex flex-col">
          {/* Category Navigation Bar */}
          <CategoryNav
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              scrollToCatalog();
            }}
            productCountByCategory={productCountByCategory}
            totalProductsCount={products.length}
          />

          {/* Featured Products Section (Rendered ONLY if owner has marked real products as featured) */}
          {featuredProducts.length > 0 && !searchQuery && selectedCategory === 'all' && (
            <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-10 sm:pt-12 w-full">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      Featured Highlights
                    </h2>
                    <p className="text-xs text-slate-500">
                      Top picks selected by store owner
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 max-[280px]:grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {featuredProducts.slice(0, 4).map((product) => (
                  <ProductCard
                    key={`featured-${product.id}`}
                    product={product}
                    settings={settings}
                    onViewDetails={setSelectedProduct}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Main Product Catalogue Section */}
          <section id="catalog-section" className="max-w-7xl mx-auto px-3 sm:px-6 py-10 sm:py-12 flex-1 w-full">
            {/* Section Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {selectedCategory === 'all' ? 'All Live Gadgets' : selectedCategory}
                  </h2>
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {filteredProducts.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {searchQuery
                    ? `Showing search results for "${searchQuery}"`
                    : 'Browse our real-time database inventory'}
                </p>
              </div>

              {/* Catalog Controls (Condition filter + Price sorting) */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Condition Filter */}
                <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="bg-transparent focus:outline-none text-base sm:text-xs font-medium cursor-pointer"
                  >
                    <option value="all">All Conditions</option>
                    <option value="Brand New">Brand New</option>
                    <option value="Open Box">Open Box</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used - Like New">Used - Like New</option>
                    <option value="Used - Good">Used - Good</option>
                  </select>
                </div>

                {/* Price Sort */}
                <div className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-700">
                  <select
                    value={priceSort}
                    onChange={(e) => setPriceSort(e.target.value as any)}
                    className="bg-transparent focus:outline-none text-base sm:text-xs font-medium cursor-pointer"
                  >
                    <option value="featured">Sort: Featured & Newest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>

                {/* Clear filters button if active */}
                {(selectedCategory !== 'all' || selectedCondition !== 'all' || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedCondition('all');
                      setSearchQuery('');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* CATALOG CONTENT STATES: Loading, Error, Empty, or Product Grid */}
            {productsLoading ? (
              /* Loading State: Pulse Skeletons */
              <div className="grid grid-cols-2 max-[280px]:grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 animate-pulse"
                  >
                    <div className="w-full pt-[85%] bg-slate-200 rounded-xl" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-5 bg-slate-200 rounded w-1/2 pt-2" />
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="h-7 sm:h-8 bg-slate-200 rounded-lg sm:rounded-xl" />
                      <div className="h-7 sm:h-8 bg-slate-200 rounded-lg sm:rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : productsError ? (
              /* Database Error State with Retry */
              <div className="bg-white rounded-2xl border border-rose-200 p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Catalogue Connection Notice</h3>
                  <p className="text-xs text-slate-500 mt-1">{productsError}</p>
                </div>
                <button
                  onClick={handleRetryLoad}
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
              </div>
            ) : products.length === 0 ? (
              /* Clean Empty Catalogue State (NO FAKE PRODUCTS) */
              <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-16 text-center max-w-lg mx-auto space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <PackageX className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    No products available yet. Please check back soon.
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                    ZY GADGET STORE is freshly initialized with a live Cloud Firestore backend. As per store policy, no fake or sample products are displayed. Real products will appear as soon as the store owner enters inventory.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleOpenAdmin}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md"
                  >
                    <span>Store Owner? Manage Products in Dashboard</span>
                  </button>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              /* Empty Search Results State */
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto space-y-3 shadow-xs">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">No Matching Gadgets Found</h3>
                <p className="text-xs text-slate-500">
                  We couldn't find any products matching your current search and filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedCondition('all');
                    setSearchQuery('');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              /* Real Customer Product Grid */
              <div className="grid grid-cols-2 max-[280px]:grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    settings={settings}
                    onViewDetails={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </section>

        </main>
      )}

      {/* Footer */}
      <Footer
        settings={settings}
        onOpenAdmin={handleOpenAdmin}
        onScrollToCatalog={handleBrowseCatalogue}
        onScrollToContact={scrollToContact}
      />

      {/* MODAL 1: Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        settings={settings}
        onClose={() => setSelectedProduct(null)}
      />

      {/* MODAL 2: Cart & Checkout Inquiry Slide-over Drawer */}
      <CartDrawer
        settings={settings}
        onOrderSuccess={(orderId, whatsappText) => {
          setOrderConfirmation({ orderId, whatsappText });
        }}
      />

      {/* MODAL 3: Order Confirmation Modal */}
      {orderConfirmation && (
        <OrderConfirmationModal
          orderId={orderConfirmation.orderId}
          whatsappText={orderConfirmation.whatsappText}
          settings={settings}
          onClose={() => setOrderConfirmation(null)}
        />
      )}

      {/* MODAL 4: User Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* MODAL 5: Customer Account Modal */}
      <CustomerAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        settings={settings}
      />

      {/* MODAL 6: Full Owner-Only Admin Dashboard */}
      {isAdminOpen && (
        <AdminDashboard
          products={products}
          categories={categories}
          settings={settings}
          onClose={handleCloseAdmin}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Storefront />
      </CartProvider>
    </AuthProvider>
  );
}
