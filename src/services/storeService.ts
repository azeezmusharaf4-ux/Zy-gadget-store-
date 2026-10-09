import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Product,
  Category,
  OrderInquiry,
  StoreSettings,
  OrderStatus
} from '../types';

export const DEFAULT_CATEGORIES: { name: string; slug: string; description: string }[] = [
  { name: 'Smartphones', slug: 'smartphones', description: 'Latest flagship & budget smartphones' },
  { name: 'Android Phones', slug: 'android-phones', description: 'Samsung, Google Pixel, Xiaomi, OnePlus' },
  { name: 'iPhones', slug: 'iphones', description: 'Apple iPhone models & editions' },
  { name: 'Tablets', slug: 'tablets', description: 'iPads, Android tablets, drawing pads' },
  { name: 'Laptops', slug: 'laptops', description: 'Ultrabooks, MacBooks, and work laptops' },
  { name: 'Smartwatches', slug: 'smartwatches', description: 'Fitness trackers & connected smartwatches' },
  { name: 'Earbuds & Headphones', slug: 'earbuds-headphones', description: 'Wireless earbuds, noise-canceling headsets' },
  { name: 'Phone Accessories', slug: 'phone-accessories', description: 'Cases, screen protectors, mounts' },
  { name: 'Chargers & Cables', slug: 'chargers-cables', description: 'Fast chargers, USB-C, MagSafe, braided cables' },
  { name: 'Power Banks', slug: 'power-banks', description: 'High-capacity portable battery packs' },
  { name: 'Speakers', slug: 'speakers', description: 'Bluetooth portable & desktop sound systems' },
  { name: 'Gaming Accessories', slug: 'gaming-accessories', description: 'Controllers, phone coolers, mobile gaming gear' },
  { name: 'Other Gadgets', slug: 'other-gadgets', description: 'Smart home, tools, tech lifestyle items' }
];

export const INITIAL_SETTINGS: StoreSettings = {
  id: 'store',
  storeName: 'ZY GADGET STORE',
  phone: 'Update Phone in Admin Settings',
  whatsapp: 'Update WhatsApp in Admin Settings',
  email: 'zenetofficialhub@gmail.com',
  address: 'Update Store Location in Admin Settings',
  businessHours: 'Mon - Sat: 9:00 AM - 7:00 PM',
  announcement: 'Welcome to ZY GADGET STORE — Contact directly for inquiries and fast dispatch',
  currencySymbol: '$',
  bankName: '',
  accountNumber: '',
  accountName: '',
  paymentInstructions: 'Direct transfer to our verified store bank account with immediate order confirmation.'
};

/**
 * Recursively strips all undefined properties from an object or array.
 * Cloud Firestore throws a fatal "Unsupported field value: undefined" error if any property
 * has an undefined value in setDoc or updateDoc.
 */
export function removeUndefined<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => removeUndefined(item)) as unknown as T;
  }
  if (typeof value === 'object' && value !== null) {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        cleaned[k] = removeUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

/* -------------------------------------------------------------
   PRODUCTS SERVICE
   ------------------------------------------------------------- */

export function subscribeToProducts(
  onData: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const productsRef = collection(db, 'products');

  return onSnapshot(
    productsRef,
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || '',
          brand: data.brand || '',
          category: data.category || '',
          price: Number(data.price) || 0,
          originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          additionalImages: Array.isArray(data.additionalImages) ? data.additionalImages : [],
          stock: Number(data.stock) || 0,
          condition: data.condition || 'Brand New',
          status: data.status || 'in_stock',
          isFeatured: Boolean(data.isFeatured),
          specifications: data.specifications || '',
          colors: data.colors || '',
          storageCapacity: data.storageCapacity || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, 'products');
    }
  );
}

export async function addProduct(product: Omit<Product, 'id'>, customId?: string): Promise<string> {
  const path = 'products';
  const id = customId || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const payload: Product = {
    ...product,
    id,
    createdAt: product.createdAt || now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, path, id);
    await setDoc(docRef, removeUndefined(payload));
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${id}`);
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const path = `products/${id}`;
  try {
    const docRef = doc(db, 'products', id);
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(docRef, removeUndefined(payload));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const path = `products/${id}`;
  try {
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* -------------------------------------------------------------
   CATEGORIES SERVICE
   ------------------------------------------------------------- */

export function subscribeToCategories(
  onData: (categories: Category[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const categoriesRef = collection(db, 'categories');

  return onSnapshot(
    categoriesRef,
    (snapshot) => {
      const items: Category[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          createdAt: data.createdAt || '',
        });
      });
      // Sort alphabetically by name
      items.sort((a, b) => a.name.localeCompare(b.name));
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, 'categories');
    }
  );
}

export async function addCategory(category: Omit<Category, 'id'>, customId?: string): Promise<string> {
  const path = 'categories';
  const id = customId || category.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  try {
    const docRef = doc(db, path, id);
    await setDoc(docRef, removeUndefined({
      id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      createdAt: new Date().toISOString(),
    }));
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${id}`);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const path = `categories/${id}`;
  try {
    const docRef = doc(db, 'categories', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function bootstrapDefaultCategories(): Promise<void> {
  for (const cat of DEFAULT_CATEGORIES) {
    const id = cat.slug;
    try {
      await setDoc(doc(db, 'categories', id), {
        id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // Continue next category
    }
  }
}

/* -------------------------------------------------------------
   STORE SETTINGS SERVICE
   ------------------------------------------------------------- */

export function subscribeToStoreSettings(
  onData: (settings: StoreSettings) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const settingsDocRef = doc(db, 'settings', 'store');

  return onSnapshot(
    settingsDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onData({
          id: 'store',
          storeName: data.storeName || INITIAL_SETTINGS.storeName,
          phone: data.phone || INITIAL_SETTINGS.phone,
          whatsapp: data.whatsapp || INITIAL_SETTINGS.whatsapp,
          email: data.email || INITIAL_SETTINGS.email,
          address: data.address || INITIAL_SETTINGS.address,
          businessHours: data.businessHours || INITIAL_SETTINGS.businessHours,
          announcement: data.announcement || INITIAL_SETTINGS.announcement,
          currencySymbol: data.currencySymbol || INITIAL_SETTINGS.currencySymbol,
          updatedAt: data.updatedAt,
        });
      } else {
        onData(INITIAL_SETTINGS);
      }
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.GET, 'settings/store');
    }
  );
}

export async function updateStoreSettings(settings: Partial<StoreSettings>): Promise<void> {
  const path = 'settings/store';
  try {
    const docRef = doc(db, 'settings', 'store');
    const payload = {
      ...INITIAL_SETTINGS,
      ...settings,
      id: 'store',
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, removeUndefined(payload), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* -------------------------------------------------------------
   ORDERS & INQUIRIES SERVICE
   ------------------------------------------------------------- */

export async function createOrderInquiry(inquiry: Omit<OrderInquiry, 'id' | 'createdAt' | 'status'>): Promise<string> {
  const path = 'orders';
  const id = `zy_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const payload: OrderInquiry = {
    ...inquiry,
    id,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = doc(db, path, id);
    await setDoc(docRef, removeUndefined(payload));
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${id}`);
  }
}

export function subscribeToCustomerOrders(
  userId: string,
  onData: (orders: OrderInquiry[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: OrderInquiry[] = [];
      snapshot.forEach((docSnap) => {
        orders.push(docSnap.data() as OrderInquiry);
      });
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(orders);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'orders');
    }
  );
}

export function subscribeToAllOrders(
  onData: (orders: OrderInquiry[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ordersRef = collection(db, 'orders');

  return onSnapshot(
    ordersRef,
    (snapshot) => {
      const orders: OrderInquiry[] = [];
      snapshot.forEach((docSnap) => {
        orders.push(docSnap.data() as OrderInquiry);
      });
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(orders);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'orders');
    }
  );
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    const docRef = doc(db, 'orders', orderId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
