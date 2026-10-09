import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Product,
  Category,
  OrderInquiry,
  StoreSettings,
  ProductCondition,
  ProductStatus,
  OrderStatus
} from '../types';
import {
  addProduct,
  updateProduct,
  deleteProduct,
  addCategory,
  deleteCategory,
  bootstrapDefaultCategories,
  updateStoreSettings,
  subscribeToAllOrders,
  updateOrderStatus,
  deleteOrder
} from '../services/storeService';
import { OWNER_EMAIL } from '../lib/firebase';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Package,
  Layers,
  ShoppingBag,
  Settings,
  Sparkles,
  CheckCircle,
  AlertCircle,
  X,
  Upload,
  Phone,
  MessageCircle,
  Save,
  ArrowLeft,
  ExternalLink,
  Landmark,
  Truck,
  CreditCard
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  categories,
  settings,
  onClose,
  onOpenAuth,
}) => {
  const { user, isAdmin, isOwner, signInWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'orders' | 'settings'>('products');

  // Search & Filter state for products
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Product Add / Edit modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: '',
    price: '',
    originalPrice: '',
    description: '',
    imageUrl: '',
    additionalImages: '',
    stock: '1',
    condition: 'Brand New' as ProductCondition,
    status: 'in_stock' as ProductStatus,
    isFeatured: false,
    specifications: '',
    colors: '',
    storageCapacity: '',
  });
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  // Delete product confirmation modal
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Category Add form
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  // Orders Delete and Bootstrap Modals
  const [orderToDelete, setOrderToDelete] = useState<OrderInquiry | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [isConfirmingBootstrap, setIsConfirmingBootstrap] = useState(false);

  // Store Settings Form
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Orders Management
  const [orders, setOrders] = useState<OrderInquiry[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');

  // Success flash messages
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  // Subscribe to all orders when on orders tab and user is admin
  useEffect(() => {
    if (!isAdmin) return;
    setOrdersLoading(true);
    const unsubscribe = subscribeToAllOrders(
      (data) => {
        setOrders(data);
        setOrdersLoading(false);
      },
      (err) => {
        console.error('Admin orders subscribe error:', err);
        setOrdersLoading(false);
      }
    );
    return () => unsubscribe();
  }, [isAdmin]);

  const showFlash = (msg: string) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(null), 3500);
  };

  // Image file compression and conversion to high-fidelity persistent Data URL
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProductFormError('Selected file must be an image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress to max 1000px dimension
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1000;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setProductForm((prev) => ({ ...prev, imageUrl: dataUrl }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle open add product modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      brand: '',
      category: categories[0]?.name || 'Smartphones',
      price: '',
      originalPrice: '',
      description: '',
      imageUrl: '',
      additionalImages: '',
      stock: '5',
      condition: 'Brand New',
      status: 'in_stock',
      isFeatured: false,
      specifications: '',
      colors: '',
      storageCapacity: '',
    });
    setProductFormError(null);
    setIsProductModalOpen(true);
  };

  // Handle open edit product modal
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      price: prod.price.toString(),
      originalPrice: prod.originalPrice ? prod.originalPrice.toString() : '',
      description: prod.description || '',
      imageUrl: prod.imageUrl || '',
      additionalImages: prod.additionalImages ? prod.additionalImages.join(', ') : '',
      stock: prod.stock.toString(),
      condition: prod.condition,
      status: prod.status,
      isFeatured: Boolean(prod.isFeatured),
      specifications: prod.specifications || '',
      colors: prod.colors || '',
      storageCapacity: prod.storageCapacity || '',
    });
    setProductFormError(null);
    setIsProductModalOpen(true);
  };

  // Handle submit product form
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError(null);

    const name = productForm.name.trim();
    const brand = productForm.brand.trim();
    const category = productForm.category.trim();
    const price = parseFloat(productForm.price);
    const stock = parseInt(productForm.stock, 10);

    if (!name) {
      setProductFormError('Product name is required.');
      return;
    }
    if (!brand) {
      setProductFormError('Brand is required.');
      return;
    }
    if (!category) {
      setProductFormError('Category is required.');
      return;
    }
    if (isNaN(price) || price < 0) {
      setProductFormError('Please enter a valid price (greater than or equal to 0).');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setProductFormError('Please enter a valid stock quantity (0 or more).');
      return;
    }

    const originalPrice = productForm.originalPrice.trim()
      ? parseFloat(productForm.originalPrice)
      : undefined;

    const additionalImages = productForm.additionalImages
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setProductSubmitting(true);

    try {
      if (editingProduct) {
        // Update product
        await updateProduct(editingProduct.id, {
          name,
          brand,
          category,
          price,
          originalPrice,
          description: productForm.description.trim(),
          imageUrl: productForm.imageUrl.trim(),
          additionalImages,
          stock,
          condition: productForm.condition,
          status: stock === 0 ? 'out_of_stock' : productForm.status,
          isFeatured: productForm.isFeatured,
          specifications: productForm.specifications.trim(),
          colors: productForm.colors.trim(),
          storageCapacity: productForm.storageCapacity.trim(),
        });
        showFlash(`Product "${name}" updated successfully in Cloud Firestore!`);
      } else {
        // Add new product
        await addProduct({
          name,
          brand,
          category,
          price,
          originalPrice,
          description: productForm.description.trim(),
          imageUrl: productForm.imageUrl.trim(),
          additionalImages,
          stock,
          condition: productForm.condition,
          status: stock === 0 ? 'out_of_stock' : productForm.status,
          isFeatured: productForm.isFeatured,
          specifications: productForm.specifications.trim(),
          colors: productForm.colors.trim(),
          storageCapacity: productForm.storageCapacity.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        showFlash(`New product "${name}" added successfully to live catalog!`);
      }

      setIsProductModalOpen(false);
    } catch (err: unknown) {
      console.error('Failed to save product:', err);
      setProductFormError('Failed to save product to Cloud Firestore. Please verify permissions and connection.');
    } finally {
      setProductSubmitting(false);
    }
  };

  // Handle delete product
  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await deleteProduct(productToDelete.id);
      showFlash(`Product "${productToDelete.name}" deleted from store.`);
      setProductToDelete(null);
    } catch (err) {
      console.error('Failed to delete product:', err);
      showFlash('Failed to delete product. Please check owner permissions.');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Handle delete category
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);
    try {
      await deleteCategory(categoryToDelete.id);
      showFlash(`Category "${categoryToDelete.name}" deleted.`);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Failed to delete category:', err);
      showFlash('Failed to delete category. Please check owner permissions.');
    } finally {
      setIsDeletingCategory(false);
    }
  };

  // Handle delete order
  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeletingOrder(true);
    try {
      await deleteOrder(orderToDelete.id);
      showFlash(`Order #${orderToDelete.id} removed.`);
      setOrderToDelete(null);
    } catch (err) {
      console.error('Failed to delete order:', err);
      showFlash('Failed to delete order. Please check owner permissions.');
    } finally {
      setIsDeletingOrder(false);
    }
  };

  // Quick toggle product featured
  const handleToggleFeatured = async (prod: Product) => {
    try {
      await updateProduct(prod.id, { isFeatured: !prod.isFeatured });
      showFlash(`Product featured status updated.`);
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const slug = newCatSlug.trim() || newCatName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    setCategorySubmitting(true);
    try {
      await addCategory({
        name: newCatName.trim(),
        slug,
        description: newCatDesc.trim(),
      });
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDesc('');
      showFlash(`Category "${newCatName.trim()}" created.`);
    } catch (err) {
      console.error('Failed to create category:', err);
      showFlash('Failed to create category in database.');
    } finally {
      setCategorySubmitting(false);
    }
  };

  // Bootstrap Categories
  const handleBootstrapCategories = () => {
    setIsConfirmingBootstrap(true);
  };

  const handleConfirmBootstrapCategories = async () => {
    setIsConfirmingBootstrap(false);
    try {
      await bootstrapDefaultCategories();
      showFlash('Standard categories initialized successfully!');
    } catch (err) {
      console.error('Failed to bootstrap categories:', err);
      showFlash('Failed to initialize default categories.');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsSuccess(false);
    setSettingsError(null);
    try {
      await updateStoreSettings(settingsForm);
      setSettingsSuccess(true);
      showFlash('Store settings and contact details updated in Cloud Firestore!');
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setSettingsError('Failed to save settings to Firestore.');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      productSearch === '' ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  // Currency symbol
  const currency = settings.currencySymbol || '$';

  /* -------------------------------------------------------------
     ACCESS RESTRICTION CHECK
     ------------------------------------------------------------- */
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Store Owner Sign In</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            The ZY GADGET STORE administrative dashboard is strictly restricted. Please authenticate with the authorized store owner Google account ({OWNER_EMAIL}) to access inventory and product management.
          </p>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-md mb-3"
          >
            <span>Sign In with Owner Google Account</span>
          </button>

          <button
            onClick={onOpenAuth}
            className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors mb-2"
          >
            Sign In with Email / Password
          </button>

          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Return to Store
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-200">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            You are signed in as <span className="font-semibold text-slate-900">{user.email}</span>.
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left mb-6">
            <p className="font-semibold mb-1">Administrative Privileges Required</p>
            <p className="text-[11px] text-amber-800">
              Only authorized store owner accounts (such as <span className="font-mono font-bold">{OWNER_EMAIL}</span>) possess access to add products, modify pricing, manage inventory, and view customer inquiries.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
     AUTHORIZED OWNER DASHBOARD VIEW
     ------------------------------------------------------------- */
  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="bg-slate-900 text-white px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
            title="Back to Storefront"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                ZY GADGET STORE
              </span>
              <span className="bg-blue-600/90 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                Owner
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-xs md:max-w-none">
              Owner: <span className="text-blue-400 font-mono">{user.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">View Live Store</span>
            <span className="sm:hidden">Store</span>
          </button>
        </div>
      </header>

      {/* Flash Banner */}
      {flashMessage && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 animate-fadeIn flex-shrink-0">
          <CheckCircle className="w-4 h-4" />
          <span>{flashMessage}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between overflow-x-auto no-scrollbar flex-shrink-0">
        <div className="flex items-center space-x-1 sm:space-x-4 py-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products & Inventory ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Store Contact & Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* TAB 1: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Controls bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {/* Search */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search live inventory by name, brand..."
                      className="w-full text-base sm:text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 sm:top-2.5" />
                  </div>

                  {/* Category Filter */}
                  <div className="relative">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full sm:w-auto text-base sm:text-xs py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id || c.slug} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Add Product Button */}
                <button
                  onClick={handleOpenAddProduct}
                  className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Products Table / Empty state */}
              {products.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Product Catalogue is Currently Empty
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                      As required, no fake or sample products are pre-loaded into the store. You have full control as the store owner to add real gadgets, prices, conditions, and stock.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddProduct}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Real Product</span>
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                  No products matched your search filter "{productSearch}".
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  {/* Mobile-Friendly Product Cards (hidden on desktop) */}
                  <div className="block sm:hidden divide-y divide-slate-100">
                    {filteredProducts.map((prod) => (
                      <div key={`m-${prod.id}`} className="p-3.5 space-y-2.5">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {prod.imageUrl ? (
                              <img src={prod.imageUrl} alt={prod.name} className="max-h-full max-w-full object-contain" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p className="font-bold text-slate-900 text-xs truncate">
                                {prod.name}
                              </p>
                              <button
                                onClick={() => handleToggleFeatured(prod)}
                                className={`p-1 rounded-md transition-colors ${
                                  prod.isFeatured ? 'text-amber-500' : 'text-slate-300'
                                }`}
                                title={prod.isFeatured ? 'Featured' : 'Not featured'}
                              >
                                <Sparkles className="w-3.5 h-3.5 fill-current" />
                              </button>
                            </div>
                            <p className="text-[10px] text-blue-600 font-bold uppercase">
                              {prod.brand} • {prod.category}
                            </p>
                            <div className="flex items-baseline gap-1.5 mt-1">
                              <span className="font-extrabold text-slate-900 text-xs">
                                {currency}{prod.price.toFixed(2)}
                              </span>
                              {prod.originalPrice && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  {currency}{prod.originalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {prod.condition}
                            </span>
                            <span className="font-semibold text-slate-600">
                              Stock: <span className="font-bold text-slate-900">{prod.stock}</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setProductToDelete(prod)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View (hidden on small mobile screens) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="p-3.5">Product</th>
                          <th className="p-3.5">Category</th>
                          <th className="p-3.5">Price</th>
                          <th className="p-3.5">Condition</th>
                          <th className="p-3.5">Stock</th>
                          <th className="p-3.5 text-center">Featured</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Product Info */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-3 min-w-[200px]">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {prod.imageUrl ? (
                                    <img src={prod.imageUrl} alt={prod.name} className="max-h-full max-w-full object-contain" />
                                  ) : (
                                    <Package className="w-5 h-5 text-slate-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate max-w-[220px]">
                                    {prod.name}
                                  </p>
                                  <p className="text-[11px] text-blue-600 font-semibold uppercase">
                                    {prod.brand}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="p-3.5 text-slate-600 font-medium">
                              {prod.category}
                            </td>

                            {/* Price */}
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="font-extrabold text-slate-900">
                                {currency}{prod.price.toFixed(2)}
                              </div>
                              {prod.originalPrice && (
                                <div className="text-[10px] text-slate-400 line-through">
                                  {currency}{prod.originalPrice.toFixed(2)}
                                </div>
                              )}
                            </td>

                            {/* Condition */}
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                                {prod.condition}
                              </span>
                            </td>

                            {/* Stock & Status */}
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    prod.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                  }`}
                                />
                                <span className="font-bold text-slate-800">{prod.stock} units</span>
                              </div>
                              <span className="text-[10px] text-slate-400 capitalize block">
                                {prod.status.replace('_', ' ')}
                              </span>
                            </td>

                            {/* Featured toggle */}
                            <td className="p-3.5 text-center">
                              <button
                                onClick={() => handleToggleFeatured(prod)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  prod.isFeatured
                                    ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                                    : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
                                }`}
                                title={prod.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                              >
                                <Sparkles className="w-4 h-4 fill-current" />
                              </button>
                            </td>

                            {/* Action Buttons */}
                            <td className="p-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditProduct(prod)}
                                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit Product"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setProductToDelete(prod)}
                                  className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Add category form */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">Add New Category</h3>
                  <button
                    onClick={handleBootstrapCategories}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Reset Defaults
                  </button>
                </div>

                <form onSubmit={handleAddCategory} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => {
                        setNewCatName(e.target.value);
                        if (!newCatSlug) {
                          setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'));
                        }
                      }}
                      placeholder="e.g. Smartwatches"
                      className="w-full text-base p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Slug (URL Identifier)
                    </label>
                    <input
                      type="text"
                      value={newCatSlug}
                      onChange={(e) => setNewCatSlug(e.target.value)}
                      placeholder="e.g. smartwatches"
                      className="w-full text-base p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      placeholder="Brief note about gadgets in this category"
                      className="w-full text-base p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={categorySubmitting}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {categorySubmitting ? 'Saving...' : 'Add Category'}
                  </button>
                </form>
              </div>

              {/* Category List */}
              <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-3">
                  Active Categories ({categories.length})
                </h3>

                {categories.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No categories defined. Click "Reset Defaults" above to load standard categories.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((cat) => {
                      const count = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
                      return (
                        <div
                          key={cat.id || cat.slug}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{cat.name}</span>
                              <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                                {count} products
                              </span>
                            </div>
                            {cat.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{cat.description}</p>
                            )}
                          </div>

                          <button
                            onClick={() => setCategoryToDelete(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER ORDERS & INQUIRIES */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {(['all', 'pending', 'contacted', 'processing', 'completed', 'cancelled'] as (OrderStatus | 'all')[]).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => setOrderStatusFilter(st)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold capitalize whitespace-nowrap transition-colors ${
                          orderStatusFilter === st
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {ordersLoading ? (
                <div className="bg-white p-12 text-center text-xs text-slate-500 rounded-2xl border border-slate-200">
                  Loading order inquiries from Cloud Firestore...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-2">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700">No order inquiries in this status</p>
                  <p className="text-[11px]">When customers place inquiries on the store, they will appear here in real time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map((order) => {
                    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
                    const customerMsg = `Hello ${order.customerName}, regarding your inquiry #${order.id} on ${settings.storeName || 'ZY GADGET STORE'}:`;

                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3"
                      >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-600 text-sm">
                                #{order.id}
                              </span>
                              <span className="text-slate-400">
                                {new Date(order.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="font-bold text-slate-900 mt-1">
                              Customer: {order.customerName} • {order.customerPhone}
                              {order.customerEmail && ` • ${order.customerEmail}`}
                            </p>
                            {/* Payment method badge */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment:</span>
                              {order.paymentMethod === 'bank_transfer' ? (
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Landmark className="w-3 h-3" />
                                  <span>Bank Transfer</span>
                                </span>
                              ) : order.paymentMethod === 'pay_on_delivery' ? (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Truck className="w-3 h-3" />
                                  <span>Pay on Delivery / Pickup</span>
                                </span>
                              ) : order.paymentMethod === 'whatsapp_order' ? (
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WhatsApp Order</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                  Inquiry
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status changer */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-slate-500">Status:</span>
                            <select
                              value={order.status}
                              onChange={async (e) => {
                                await updateOrderStatus(order.id, e.target.value as OrderStatus);
                                showFlash(`Order #${order.id} status updated to ${e.target.value}.`);
                              }}
                              className="text-base sm:text-xs font-bold py-1 px-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800"
                            >
                              <option value="pending">Pending</option>
                              <option value="contacted">Contacted</option>
                              <option value="processing">Processing</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>

                        {/* Items list */}
                        <div className="space-y-1.5 py-1">
                          {order.items.map((it, i) => (
                            <div key={i} className="flex justify-between items-center text-xs text-slate-700">
                              <span className="font-medium">
                                {it.quantity}x {it.name} ({it.brand}
                                {it.storage ? `, ${it.storage}` : ''}
                                {it.color ? `, ${it.color}` : ''})
                              </span>
                              <span className="font-extrabold text-slate-900">
                                {currency}{(it.price * it.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Notes / Address */}
                        {(order.deliveryAddress || order.notes) && (
                          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                            {order.deliveryAddress && (
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Delivery / Pickup:</span>{' '}
                                {order.deliveryAddress}
                              </p>
                            )}
                            {order.notes && (
                              <p className="text-slate-600">
                                <span className="font-bold text-slate-700">Customer Note:</span>{' '}
                                {order.notes}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Footer & Contact Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                          <div className="text-sm font-extrabold text-slate-900">
                            Total: <span className="text-blue-600">{currency}{order.totalAmount.toFixed(2)}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(customerMsg)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>WhatsApp Customer</span>
                              </a>
                            )}
                            <a
                              href={`tel:${order.customerPhone.replace(/[^0-9+]/g, '')}`}
                              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call</span>
                            </a>
                            <button
                              onClick={() => setOrderToDelete(order)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Inquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STORE SETTINGS & CONTACT */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Store Contact & Branding Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  These details configure the public contact buttons, WhatsApp links, and storefront branding.
                </p>
              </div>

              {settingsSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Settings saved successfully to Cloud Firestore!</span>
                </div>
              )}

              {settingsError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{settingsError}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Store Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Store WhatsApp Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.whatsapp}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                      placeholder="e.g. +1234567890"
                      className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Include country code for direct WhatsApp chat links.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Service Phone *
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      placeholder="e.g. +1 (555) 019-2834"
                      className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Support Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={settingsForm.email}
                      onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                      className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      value={settingsForm.currencySymbol}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })}
                      placeholder="$"
                      className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Store Physical Address / Pickup Location
                  </label>
                  <input
                    type="text"
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    placeholder="Enter store location or 'Direct Delivery / Local Pickup Hub'"
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Business Hours
                  </label>
                  <input
                    type="text"
                    value={settingsForm.businessHours}
                    onChange={(e) => setSettingsForm({ ...settingsForm, businessHours: e.target.value })}
                    placeholder="Mon - Sat: 9:00 AM - 7:00 PM"
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Header Announcement Bar Text
                  </label>
                  <input
                    type="text"
                    value={settingsForm.announcement}
                    onChange={(e) => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Bank Account & Payment Options */}
                <div className="pt-4 border-t border-slate-200 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                      <Landmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Store Bank & Direct Payment Details</h4>
                      <p className="text-[11px] text-slate-500">
                        Displayed to customers during checkout and order confirmation for direct transfers.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={settingsForm.bankName || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                        placeholder="e.g. Access Bank, GTBank, Chase"
                        className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={settingsForm.accountNumber || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, accountNumber: e.target.value })}
                        placeholder="e.g. 0123456789"
                        className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Account Name / Business Beneficiary
                    </label>
                    <input
                      type="text"
                      value={settingsForm.accountName || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, accountName: e.target.value })}
                      placeholder="e.g. ZY GADGET STORE VENTURES"
                      className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Verification Note
                    </label>
                    <input
                      type="text"
                      value={settingsForm.paymentInstructions || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, paymentInstructions: e.target.value })}
                      placeholder="e.g. Send transfer receipt to store WhatsApp for instant order dispatch."
                      className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{settingsSaving ? 'Saving to Firestore...' : 'Save Settings to Firestore'}</span>
                </button>
              </form>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 relative flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingProduct ? 'Edit Gadget Product' : 'Add New Real Product'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
              {productFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{productFormError}</span>
                </div>
              )}

              {/* Title & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. iPhone 15 Pro Max 256GB"
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="e.g. Apple, Samsung, Google"
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Category, Condition, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Device Condition *
                  </label>
                  <select
                    value={productForm.condition}
                    onChange={(e) =>
                      setProductForm({ ...productForm, condition: e.target.value as ProductCondition })
                    }
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Open Box">Open Box</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used - Like New">Used - Like New</option>
                    <option value="Used - Good">Used - Good</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={productForm.status}
                    onChange={(e) =>
                      setProductForm({ ...productForm, status: e.target.value as ProductStatus })
                    }
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="pre_order">Pre-Order</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Price, Original Price, Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="e.g. 899.99"
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Original Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    placeholder="e.g. 999.99"
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Available Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Product Image Selection & Upload */}
              <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800">
                  Product Image
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-8">
                    <input
                      type="url"
                      value={productForm.imageUrl}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      placeholder="Paste Image URL (or upload below)"
                      className="w-full text-base sm:text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload photo from phone/computer</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="sm:col-span-4 flex justify-center">
                    <div className="w-20 h-20 rounded-lg border border-slate-300 bg-white p-1 flex items-center justify-center overflow-hidden">
                      {productForm.imageUrl ? (
                        <img
                          src={productForm.imageUrl}
                          alt="Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 text-center">No image selected</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Additional Image URLs (comma-separated, optional)
                  </label>
                  <input
                    type="text"
                    value={productForm.additionalImages}
                    onChange={(e) => setProductForm({ ...productForm, additionalImages: e.target.value })}
                    placeholder="https://example.com/img2.jpg, https://example.com/img3.jpg"
                    className="w-full text-base sm:text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Colors & Storage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Available Colours (comma separated)
                  </label>
                  <input
                    type="text"
                    value={productForm.colors}
                    onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })}
                    placeholder="e.g. Space Black, Titanium Gray, Silver"
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storage Capacity (comma separated)
                  </label>
                  <input
                    type="text"
                    value={productForm.storageCapacity}
                    onChange={(e) => setProductForm({ ...productForm, storageCapacity: e.target.value })}
                    placeholder="e.g. 128GB, 256GB, 512GB"
                    className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Key features, warranty notes, included accessories..."
                  className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Specifications */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Technical Specifications
                </label>
                <textarea
                  rows={2}
                  value={productForm.specifications}
                  onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })}
                  placeholder="Screen: 6.7 OLED | Processor: A17 Pro | RAM: 8GB | Battery: 4422mAh"
                  className="w-full text-base sm:text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              {/* Featured checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={productForm.isFeatured}
                  onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="isFeatured" className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Highlight in Featured Products section on Homepage</span>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {productSubmitting ? 'Saving to Firestore...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE PRODUCT CONFIRMATION */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Delete Product?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to permanently remove <span className="font-bold text-slate-800">"{productToDelete.name}"</span> from Cloud Firestore? This will also remove it from the live customer catalogue.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-md"
              >
                {isDeletingProduct ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CATEGORY CONFIRMATION */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Delete Category?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to delete category <span className="font-bold text-slate-800">"{categoryToDelete.name}"</span>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeletingCategory}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteCategory}
                disabled={isDeletingCategory}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-md"
              >
                {isDeletingCategory ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE ORDER CONFIRMATION */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Delete Order Inquiry?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to remove inquiry <span className="font-bold text-slate-800">#{orderToDelete.id}</span> from the database?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setOrderToDelete(null)}
                disabled={isDeletingOrder}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteOrder}
                disabled={isDeletingOrder}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors shadow-md"
              >
                {isDeletingOrder ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BOOTSTRAP CATEGORIES CONFIRMATION */}
      {isConfirmingBootstrap && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Initialize Categories</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add standard electronics categories (Smartphones, iPhones, Tablets, Laptops, etc.) to Cloud Firestore?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsConfirmingBootstrap(false)}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBootstrapCategories}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-md"
              >
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
