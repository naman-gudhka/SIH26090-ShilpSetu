/**
 * matchingService.js
 * B2B artisan matching abstraction boundary.
 * Replace mock with: AI matching model / Elasticsearch / custom algorithm
 */

import { b2bMatches } from '../data/mockData.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const matchingService = {
  /**
   * Find artisans that match a B2B bulk requirement.
   * Replace with: AI matching model or search API
   *
   * @param {Object} requirement
   * @param {string} requirement.description - What they need
   * @param {number} requirement.quantity - Units required
   * @param {string} requirement.craft - Preferred craft
   * @param {string} requirement.region - Preferred region
   * @param {number} requirement.budget - Budget per unit (INR)
   * @param {string} requirement.deadline - Delivery deadline
   * @returns {Promise<Object>} Matched artisans with scores
   */
  async findMatches(requirement = {}) {
    await delay(1200);

    // Dynamic scoring simulation based on craft, region, budget, and quantity
    const scoredMatches = b2bMatches.map((item) => {
      let score = 50;

      // Craft match (highest weight: 30%)
      if (requirement.craft && item.craft.toLowerCase() === requirement.craft.toLowerCase()) {
        score += 30;
      } else if (requirement.description && requirement.description.toLowerCase().includes(item.craft.toLowerCase())) {
        score += 20;
      }

      // Region match (weight: 12%)
      if (requirement.region && item.region.toLowerCase() === requirement.region.toLowerCase()) {
        score += 12;
      }

      // Budget friendliness & capacity adjustment
      if (requirement.budget && requirement.budget >= 1000) {
        score += 4;
      }
      if (item.verified) {
        score += 4;
      }

      // Cap score between 45% and 98%
      const finalScore = Math.min(98, Math.max(45, score));

      return {
        ...item,
        matchPercentage: finalScore,
      };
    });

    // Sort by matchPercentage descending
    scoredMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return {
      success: true,
      matches: scoredMatches,
      totalFound: scoredMatches.length,
      searchId: 'search-' + Date.now(),
    };
  },

  /**
   * Send an enquiry to a matched artisan.
   */
  async sendEnquiry(_artisanId, _requirementData, _buyerInfo) {
    await delay(1000);
    return {
      success: true,
      enquiryId: 'enq-' + Date.now(),
      message: `Enquiry sent to artisan. They will respond within 2 business days.`,
    };
  },
};
