"use strict";

// ─── Accord key order ─────────────────────────────────────────────────────────
// Must stay consistent with the Mongoose perfumeProfileSchema field order.
// Every vector produced by profileToVector() uses this same index mapping.

const ACCORD_KEYS = [
  "woody", "oriental", "sweet", "citrus",
  "floral", "spicy", "powdery", "fresh",
];

// ─── profileToVector ──────────────────────────────────────────────────────────
// Converts a perfumeProfile sub-document into a fixed-length numeric vector.
// Missing or undefined keys are treated as 0 (absent accord).
//
// @param  {object} perfumeProfile  - Mongoose perfumeProfile sub-document (or plain object).
// @returns {number[]}             - 8-element array aligned to ACCORD_KEYS.

function profileToVector(perfumeProfile = {}) {
  return ACCORD_KEYS.map((k) => perfumeProfile[k] ?? 0);
}

// ─── hasAnyAccord ─────────────────────────────────────────────────────────────
// Returns true when at least one accord in the profile is > 0.
// Used to pre-filter products before cosine computation — a zero vector has
// no direction and produces a similarity of 0 against everything.

function hasAnyAccord(perfumeProfile = {}) {
  return ACCORD_KEYS.some((k) => (perfumeProfile[k] ?? 0) > 0);
}

// ─── cosineSimilarity ─────────────────────────────────────────────────────────
// Computes cosine similarity between two equal-length numeric vectors.
//
// Formula:
//   similarity = dot(a, b) / (‖a‖ · ‖b‖)
//
// Range: [0, 1] for non-negative inputs (accord values are always 0–10).
//   1 = identical direction (same accord fingerprint)
//   0 = orthogonal (no overlap) OR one/both vectors are zero
//
// Edge case: if either magnitude is 0 → return 0 to avoid division by zero.
//
// @param  {number[]} a
// @param  {number[]} b
// @returns {number}   Similarity in [0, 1]

function cosineSimilarity(a, b) {
  let dot = 0;
  let sumA = 0;
  let sumB = 0;

  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    sumA += a[i] * a[i];
    sumB += b[i] * b[i];
  }

  const magA = Math.sqrt(sumA);
  const magB = Math.sqrt(sumB);

  if (magA === 0 || magB === 0) return 0;

  return dot / (magA * magB);
}

module.exports = { ACCORD_KEYS, profileToVector, hasAnyAccord, cosineSimilarity };
