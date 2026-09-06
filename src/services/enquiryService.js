/**
 * enquiryService.js
 * Buyer and B2B Enquiry management abstraction boundary.
 *
 * Currently backed by local demo persistence.
 * Team 2 will replace this with:
 * addDoc(collection(db, 'enquiries'), data) + Cloud Function notification triggers.
 */

const STORAGE_KEY = 'shilpsetu_demo_enquiries';
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

function loadEnquiries() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) || [];
    }
  } catch {
    // Ignore storage parse error
  }
  return [];
}

function saveEnquiries(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage quota handling
  }
}

export const enquiryService = {
  /**
   * Submit an enquiry for an artisan product or bulk requirement.
   * @param {Object} enquiryData
   * @returns {Promise<Object>}
   */
  async createEnquiry(enquiryData) {
    await delay(300);

    if (!enquiryData.name || (!enquiryData.contact && !enquiryData.email && !enquiryData.phone)) {
      throw new Error('Please provide your name and contact information.');
    }

    const enquiries = loadEnquiries();
    const newEnquiry = {
      id: 'enq-' + Date.now(),
      type: enquiryData.type || 'retail', // 'retail' or 'b2b'
      productId: enquiryData.productId || null,
      productTitle: enquiryData.productTitle || null,
      artisanId: enquiryData.artisanId || null,
      artisanName: enquiryData.artisanName || 'Artisan',
      buyerId: enquiryData.buyerId || null,
      buyerName: enquiryData.name,
      buyerContact: enquiryData.contact || enquiryData.phone || enquiryData.email,
      quantity: Number(enquiryData.quantity) || 1,
      message: enquiryData.message || 'I am interested in this craft piece.',
      budget: enquiryData.budget || null,
      status: 'received',
      createdAt: new Date().toISOString(),
    };

    const updated = [newEnquiry, ...enquiries];
    saveEnquiries(updated);

    return {
      success: true,
      enquiry: newEnquiry,
      message: 'Enquiry recorded in demo mode. The artisan will respond within 2 business days.',
    };
  },

  /**
   * Get all enquiries (for demo review).
   * @returns {Promise<Array>}
   */
  async getEnquiries() {
    await delay(100);
    return loadEnquiries();
  },

  /**
   * Get enquiries for a specific artisan.
   * @param {string} artisanId
   * @returns {Promise<Array>}
   */
  async getEnquiriesByArtisan(artisanId) {
    await delay(100);
    const list = loadEnquiries();
    if (!artisanId) return list;
    return list.filter((e) => e.artisanId === artisanId || (!e.artisanId && artisanId === 'a1'));
  },

  /**
   * Get enquiries submitted by a specific buyer.
   * @param {string} buyerId
   * @returns {Promise<Array>}
   */
  async getEnquiriesByBuyer(buyerId) {
    await delay(100);
    const list = loadEnquiries();
    if (!buyerId) return list;
    return list.filter((e) => e.buyerId === buyerId);
  },
};

