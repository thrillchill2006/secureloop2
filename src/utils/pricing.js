/**
 * Price recommendation engine based on real-time demand/supply, quality grade,
 * and market reference price.
 */

const DEFAULT_PRICING_CONFIG = {
  demandWeight: 0.6,
  supplyWeight: 0.4,
  minMultiplier: 0.85,
  maxMultiplier: 1.25,
  gradeMinMultiplier: 0.90,
  gradeMaxMultiplier: 1.10,
  baseSpreadPct: 0.08,
  maxExtraSpreadPct: 0.12,
};

/**
 * Clamp a value to a range.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Normalize a numeric grade to 0..1.
 * Accepts grades in [0..1], [1..5], or [1..10].
 * @param {number} grade
 * @returns {number}
 */
function normalizeGrade(grade) {
  if (!Number.isFinite(grade)) return 0.5;
  if (grade >= 0 && grade <= 1) return grade;
  if (grade >= 1 && grade <= 5) return (grade - 1) / 4;
  if (grade >= 1 && grade <= 10) return (grade - 1) / 9;
  return 0.5;
}

/**
 * Compute multiplier from demand/supply indices (0..1 recommended).
 * Higher demand and lower supply => higher multiplier.
 * @param {number} demandIndex
 * @param {number} supplyIndex
 * @param {object} config
 * @returns {number}
 */
function computeDemandSupplyMultiplier(demandIndex, supplyIndex, config) {
  const d = clamp(demandIndex, 0, 1);
  const s = clamp(supplyIndex, 0, 1);
  const composite = d * config.demandWeight + (1 - s) * config.supplyWeight;
  const scaled = config.minMultiplier + composite * (config.maxMultiplier - config.minMultiplier);
  return clamp(scaled, config.minMultiplier, config.maxMultiplier);
}

/**
 * Compute grade multiplier.
 * @param {number} grade
 * @param {object} config
 * @returns {number}
 */
function computeGradeMultiplier(grade, config) {
  const g = normalizeGrade(grade);
  return config.gradeMinMultiplier + g * (config.gradeMaxMultiplier - config.gradeMinMultiplier);
}

/**
 * Recommend price with band and confidence.
 *
 * @param {object} input
 * @param {number} input.baseMarketPrice Reference market price per unit
 * @param {number} [input.grade] Quality grade
 * @param {number} [input.demandIndex] 0..1
 * @param {number} [input.supplyIndex] 0..1
 * @param {number} [input.availability] Availability signal (0..1 or quantity)
 * @param {object} [config]
 * @returns {{recommendedPrice: number, low: number, high: number, multiplier: number, confidence: number}}
 */
function recommendPrice(input, config = DEFAULT_PRICING_CONFIG) {
  const baseMarketPrice = Number(input?.baseMarketPrice);
  if (!Number.isFinite(baseMarketPrice) || baseMarketPrice <= 0) {
    return {
      recommendedPrice: 0,
      low: 0,
      high: 0,
      multiplier: 0,
      confidence: 0,
    };
  }

  const demandIndex = Number.isFinite(input?.demandIndex) ? input.demandIndex : 0.5;
  const supplyIndex = Number.isFinite(input?.supplyIndex) ? input.supplyIndex : 0.5;
  const gradeMultiplier = computeGradeMultiplier(input?.grade, config);
  const demandSupplyMultiplier = computeDemandSupplyMultiplier(
    demandIndex,
    supplyIndex,
    config
  );

  const multiplier = gradeMultiplier * demandSupplyMultiplier;
  const recommendedPrice = Number((baseMarketPrice * multiplier).toFixed(2));

  const signalCount = [input?.grade, input?.demandIndex, input?.supplyIndex]
    .filter(Number.isFinite).length;
  const confidence = clamp(0.4 + signalCount * 0.2, 0, 1);

  const spreadPct = config.baseSpreadPct + (1 - confidence) * config.maxExtraSpreadPct;
  const low = Number((recommendedPrice * (1 - spreadPct)).toFixed(2));
  const high = Number((recommendedPrice * (1 + spreadPct)).toFixed(2));

  return {
    recommendedPrice,
    low,
    high,
    multiplier: Number(multiplier.toFixed(4)),
    confidence: Number(confidence.toFixed(2)),
  };
}

export {
  recommendPrice,
  computeDemandSupplyMultiplier,
  computeGradeMultiplier,
  normalizeGrade,
  DEFAULT_PRICING_CONFIG,
};
