/**
 * artisanService.js
 * Artisan profile and directory access abstraction boundary.
 *
 * Currently backed by realistic mock data with local demo persistence.
 * Team 2 will replace this implementation with Firestore queries:
 * collection(db, 'artisans')
 */

import { artisans as initialArtisans } from '../data/mockData.js';

const STORAGE_KEY = 'shilpsetu_demo_artisans';
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

function loadArtisans() {
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
  return [...initialArtisans];
}

function saveArtisans(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota or access error handling
  }
}

export const artisanService = {
  /**
   * Get all artisans with optional craft/state filter.
   * @param {Object} [filter]
   * @returns {Promise<Array>}
   */
  async getArtisans(filter = {}) {
    await delay(120);
    let list = loadArtisans();
    if (filter.craft && filter.craft !== 'All') {
      list = list.filter((a) => a.craft === filter.craft);
    }
    if (filter.state && filter.state !== 'All') {
      list = list.filter((a) => a.state === filter.state);
    }
    if (filter.verified !== undefined) {
      list = list.filter((a) => a.verified === filter.verified);
    }
    return list;
  },

  /**
   * Get an artisan by ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getArtisanById(id) {
    await delay(80);
    const list = loadArtisans();
    return list.find((a) => a.id === id) || null;
  },

  /**
   * Update an artisan profile in demo mode.
   * @param {string} id
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateArtisan(id, updates) {
    await delay(180);
    const list = loadArtisans();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) {
      // If updating the active user's own profile, create/merge
      const newArtisan = {
        id,
        name: updates.name || 'Artisan Partner',
        craft: updates.craft || 'Indian Handicrafts',
        village: updates.village || 'Jaipur',
        state: updates.state || 'Rajasthan',
        experience: updates.experience || '5 years',
        bio: updates.bio || 'Dedicated traditional artisan creating authentic handmade products.',
        languages: updates.languages || ['Hindi'],
        products: [],
        published: 0,
        drafts: 0,
        rating: 4.9,
        totalOrders: 0,
        verified: false,
        joinedDate: new Date().toISOString().split('T')[0],
        ...updates,
      };
      saveArtisans([newArtisan, ...list]);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('shilpsetu_artisans_changed', {
            detail: { id, artisan: newArtisan, updates },
          })
        );
      }
      return newArtisan;
    }

    const updated = {
      ...list[idx],
      ...updates,
    };
    list[idx] = updated;
    saveArtisans(list);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('shilpsetu_artisans_changed', {
          detail: { id, artisan: updated, updates },
        })
      );
    }
    return updated;
  },
};

