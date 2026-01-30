/**
 * Vendor ranking system based on distance, grading, pricing, availability, reviews,
 * and real-time demand/supply signals.
 *
 * Scoring rules:
 * - Distance: lower is better (normalized inverse)
 * - Grading: higher is better (normalized)
 * - Pricing: lower is better (normalized inverse)
 * - Availability: higher is better (normalized)
 * - Reviews: higher is better (normalized)
 * - Demand/Supply: higher demand and lower supply score better
 *
 * All inputs are normalized to 0..1 per batch, then combined by weights.
 */

const DEFAULT_WEIGHTS = {
  distance: 0.28,
  grading: 0.22,
  pricing: 0.18,
  availability: 0.10,
  reviews: 0.12,
  demandSupply: 0.10,
};

/**
 * Compute distance in kilometers using the Haversine formula.
 * @param {{lat: number, lng: number}} buyerLocation
 * @param {{lat: number, lng: number}} vendorLocation
 * @returns {number|null}
 */
function computeDistanceKm(buyerLocation, vendorLocation) {
  if (!buyerLocation || !vendorLocation) return null;
  const { lat: lat1, lng: lon1 } = buyerLocation;
  const { lat: lat2, lng: lon2 } = vendorLocation;
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Normalize a value within a range.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function normalize(value, min, max) {
  if (Number.isNaN(value) || value === null || value === undefined) return 0;
  if (max === min) return 1;
  return (value - min) / (max - min);
}

/**
 * Normalize inverse (lower is better).
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function normalizeInverse(value, min, max) {
  if (Number.isNaN(value) || value === null || value === undefined) return 0;
  if (max === min) return 1;
  return (max - value) / (max - min);
}

/**
 * Compute min/max for a field across vendors.
 * @param {Array<object>} vendors
 * @param {string} field
 * @returns {{min: number, max: number}}
 */
function getMinMax(vendors, field) {
  let min = Infinity;
  let max = -Infinity;
  for (const vendor of vendors) {
    const v = vendor[field];
    if (v === null || v === undefined || Number.isNaN(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === Infinity) min = 0;
  if (max === -Infinity) max = 0;
  return { min, max };
}

/**
 * Rank vendors by composite score.
 *
 * @param {Array<object>} vendors
 * @param {object} [weights]
 * @param {object} [options]
 * @param {number} [options.requiredAvailability] Minimum availability required to be listed
 * @param {{lat: number, lng: number}} [options.buyerLocation] Buyer location for distance scoring
 * @param {object} [options.marketSignals] Map by materialType to { demandIndex, supplyIndex }
 * @returns {Array<object>} ranked vendors with score and breakdown
 */
function rankVendors(vendors, weights = DEFAULT_WEIGHTS, options = {}) {
  const w = {
    ...DEFAULT_WEIGHTS,
    ...(weights || {}),
  };

  const requiredAvailability = Number.isFinite(options.requiredAvailability)
    ? options.requiredAvailability
    : null;

  const hasBooleanAvailability = vendors.some(
    (v) => typeof v.availability === "boolean"
  );

  const eligibleVendors = requiredAvailability !== null
    ? vendors.filter(
        (vendor) =>
          Number.isFinite(vendor.availability) &&
          vendor.availability >= requiredAvailability
      )
    : hasBooleanAvailability
      ? vendors.filter((vendor) => vendor.availability === true)
      : vendors;

  const enrichedVendors = eligibleVendors.map((vendor) => {
    const vendorLocation = vendor.location || {
      lat: vendor.lat,
      lng: vendor.lng,
    };

    const distanceKm = Number.isFinite(vendor.distanceKm)
      ? vendor.distanceKm
      : computeDistanceKm(options.buyerLocation, vendorLocation);

    const reviewRating = Number.isFinite(vendor.reviewRating)
      ? vendor.reviewRating
      : Number.isFinite(vendor.reviewsRating)
        ? vendor.reviewsRating
        : Number.isFinite(vendor.reviewsScore)
          ? vendor.reviewsScore
          : null;

    const materialType = vendor.materialType || vendor.material || null;
    const signal = materialType && options.marketSignals
      ? options.marketSignals[materialType]
      : null;

    const demandIndex = Number.isFinite(vendor.demandIndex)
      ? vendor.demandIndex
      : signal && Number.isFinite(signal.demandIndex)
        ? signal.demandIndex
        : null;

    const supplyIndex = Number.isFinite(vendor.supplyIndex)
      ? vendor.supplyIndex
      : signal && Number.isFinite(signal.supplyIndex)
        ? signal.supplyIndex
        : null;

    return {
      ...vendor,
      distanceKm,
      reviewRating,
      demandIndex,
      supplyIndex,
    };
  });

  const distanceRange = getMinMax(enrichedVendors, "distanceKm");
  const gradingRange = getMinMax(enrichedVendors, "grading");
  const pricingRange = getMinMax(enrichedVendors, "pricing");
  const availabilityRange = getMinMax(enrichedVendors, "availability");
  const reviewsRange = getMinMax(enrichedVendors, "reviewRating");
  const demandRange = getMinMax(enrichedVendors, "demandIndex");
  const supplyRange = getMinMax(enrichedVendors, "supplyIndex");

  const scored = enrichedVendors.map((vendor) => {
    const distanceScore = normalizeInverse(
      vendor.distanceKm,
      distanceRange.min,
      distanceRange.max
    );
    const gradingScore = normalize(
      vendor.grading,
      gradingRange.min,
      gradingRange.max
    );
    const pricingScore = normalizeInverse(
      vendor.pricing,
      pricingRange.min,
      pricingRange.max
    );

    const availabilityScore =
      typeof vendor.availability === "boolean"
        ? (vendor.availability ? 1 : 0)
        : normalize(
            vendor.availability,
            availabilityRange.min,
            availabilityRange.max
          );

    const reviewsScore = normalize(
      vendor.reviewRating,
      reviewsRange.min,
      reviewsRange.max
    );
    const demandScore = normalize(
      vendor.demandIndex,
      demandRange.min,
      demandRange.max
    );
    const supplyScore = normalizeInverse(
      vendor.supplyIndex,
      supplyRange.min,
      supplyRange.max
    );
    const demandSupplyScore = (demandScore * 0.6) + (supplyScore * 0.4);

    const score =
      distanceScore * w.distance +
      gradingScore * w.grading +
      pricingScore * w.pricing +
      availabilityScore * w.availability +
      reviewsScore * w.reviews +
      demandSupplyScore * w.demandSupply;

    return {
      ...vendor,
      score: Number(score.toFixed(6)),
      scoreBreakdown: {
        distanceScore,
        gradingScore,
        pricingScore,
        availabilityScore,
        reviewsScore,
        demandScore,
        supplyScore,
        demandSupplyScore,
      },
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

export {
  rankVendors,
  normalize,
  normalizeInverse,
  getMinMax,
  computeDistanceKm,
  DEFAULT_WEIGHTS,
};
