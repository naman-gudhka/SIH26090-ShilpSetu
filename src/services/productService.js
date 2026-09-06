/**
 * productService.js
 * Product data access abstraction boundary.
 *
 * Currently backed by realistic mock data with local demo persistence.
 * Team 2 will replace this implementation with Firestore queries:
 * collection(db, 'products')
 */

import { products as initialProducts } from '../data/mockData.js';

const STORAGE_KEY = 'shilpsetu_demo_products';
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

function loadProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse errors, fallback to initial
  }
  return [...initialProducts];
}

function saveProducts(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota or access error handling
  }
}

export const productService = {
  /**
   * Get all products with optional filtering.
   * @param {Object} [filter]
   * @returns {Promise<Array>}
   */
  async getProducts(filter = {}) {
    await delay(120);
    let list = loadProducts();

    if (filter.craft && filter.craft !== 'All') {
      list = list.filter((p) => p.craft === filter.craft);
    }
    if (filter.status) {
      list = list.filter((p) => p.status === filter.status);
    }
    if (filter.artisanId) {
      list = list.filter((p) => p.artisanId === filter.artisanId);
    }
    if (filter.category && filter.category !== 'All') {
      list = list.filter((p) => p.category?.toLowerCase().includes(filter.category.toLowerCase()));
    }
    return list;
  },

  /**
   * Get a single product by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getProductById(id) {
    await delay(80);
    const list = loadProducts();
    return list.find((p) => p.id === id) || null;
  },

  /**
   * Get all products for a specific artisan.
   * @param {string} artisanId
   * @returns {Promise<Array>}
   */
  async getProductsByArtisan(artisanId) {
    await delay(100);
    const list = loadProducts();
    return list.filter((p) => p.artisanId === artisanId);
  },

  /**
   * Create and publish a new product in the local demo store.
   * @param {Object} productData
   * @returns {Promise<Object>}
   */
  async createProduct(productData) {
    await delay(250);
    const list = loadProducts();
    const newId = 'p-' + Date.now();
    const newProduct = {
      id: newId,
      artisanId: productData.artisanId || 'a1',
      artisanName: productData.artisanName || 'Meera Devi',
      artisanLocation: productData.artisanLocation || 'Madhubani, Bihar',
      title: productData.title || productData.productName || 'Handcrafted Artisan Item',
      titleHindi: productData.titleHindi || productData.productNameHindi || '',
      description: productData.description || 'Finely crafted handmade piece.',
      descriptionHindi: productData.descriptionHindi || '',
      price: Number(productData.price) || 2000,
      priceRange: productData.priceRange || {
        min: Math.round((Number(productData.price) || 2000) * 0.85),
        max: Math.round((Number(productData.price) || 2000) * 1.15),
      },
      craft: productData.craft || 'Kutch Embroidery',
      category: productData.category || 'Accessories',
      materials: Array.isArray(productData.materials)
        ? productData.materials
        : (productData.materials || 'Handwoven cotton, Thread').split(',').map((s) => s.trim()),
      colors: Array.isArray(productData.colors)
        ? productData.colors
        : (productData.colors || 'Natural').split(',').map((s) => s.trim()),
      dimensions: productData.dimensions || '30cm × 25cm',
      weight: productData.weight || '250g',
      tags: [productData.craft?.toLowerCase(), 'handcrafted', 'shilpsetu'].filter(Boolean),
      status: productData.status || 'published',
      images: productData.images || (productData.photoUrl ? [productData.photoUrl] : []),
      region: productData.region || 'Gujarat',
      language: productData.language || 'en',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      isLocalDemo: true,
    };

    const updated = [newProduct, ...list];
    saveProducts(updated);
    return newProduct;
  },

  /**
   * Update an existing product.
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateProduct(id, updates) {
    await delay(150);
    const list = loadProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error(`Product ${id} not found`);
    }
    const updatedProduct = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    list[idx] = updatedProduct;
    saveProducts(list);
    return updatedProduct;
  },

  /**
   * Delete a product from the local demo store.
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async deleteProduct(id) {
    await delay(150);
    const list = loadProducts();
    const updated = list.filter((p) => p.id !== id);
    if (updated.length === list.length) {
      throw new Error(`Product ${id} not found`);
    }
    saveProducts(updated);
    return true;
  },

  /**
   * Reset local demo products back to initial mockData.
   */
  resetDemoProducts() {
    saveProducts([...initialProducts]);
    return [...initialProducts];
  },
};

function getSavedKey(userId) {
  return userId ? `shilpsetu_saved_${userId}` : 'shilpsetu_demo_saved_items';
}

export const savedItemsService = {
  getSavedIds(userId) {
    try {
      const key = getSavedKey(userId);
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
      // Migration / fallback: if user-specific store doesn't exist yet, check legacy demo storage
      if (userId) {
        const legacy = localStorage.getItem('shilpsetu_demo_saved_items');
        if (legacy) return JSON.parse(legacy);
      }
      return [];
    } catch {
      return [];
    }
  },

  isSaved(id, userId) {
    if (!id) return false;
    return this.getSavedIds(userId).includes(id);
  },

  saveItem(id, userId) {
    if (!id) return false;
    const key = getSavedKey(userId);
    const ids = this.getSavedIds(userId);
    if (!ids.includes(id)) {
      const updated = [...ids, id];
      try {
        localStorage.setItem(key, JSON.stringify(updated));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('shilpsetu_saved_items_changed'));
        }
      } catch {
        // Storage quota handling
      }
      return true;
    }
    return false;
  },

  removeItem(id, userId) {
    if (!id) return false;
    const key = getSavedKey(userId);
    const ids = this.getSavedIds(userId);
    const updated = ids.filter((item) => item !== id);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('shilpsetu_saved_items_changed'));
      }
    } catch {
      // Storage quota handling
    }
    return true;
  },

  toggleSave(id, userId) {
    if (this.isSaved(id, userId)) {
      this.removeItem(id, userId);
      return false;
    } else {
      this.saveItem(id, userId);
      return true;
    }
  },

  async getSavedProducts(userId) {
    await delay(100);
    const ids = this.getSavedIds(userId);
    if (ids.length === 0) return [];
    const all = loadProducts();
    // Gracefully handle stale IDs
    return all.filter((p) => ids.includes(p.id));
  },
};

