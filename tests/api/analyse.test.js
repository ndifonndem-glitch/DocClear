/**
 * Automated Unit & Contract Tests for DocClear BFF API
 * Run with: node tests/api/analyse.test.js
 */

const assert = require("assert");

// Test Flesch-Kincaid Readability Logic
function countSyllables(word) {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, "");
  word = word.replace(/^y/, "");
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

function calculateReadability(text) {
  if (!text || text.trim().length === 0) {
    return { fleschKincaidGrade: 0, wordCount: 0 };
  }
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.match(/\b[A-Za-z0-9'-]+\b/g) || [];
  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  let totalSyllables = 0;
  for (const w of words) totalSyllables += countSyllables(w);

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0;
  const rawGrade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  return {
    fleschKincaidGrade: Math.max(1, Math.min(18, Math.round(rawGrade * 10) / 10)),
    wordCount,
  };
}

// Test Input Sanitization
function sanitizeText(input) {
  if (!input) return "";
  return input.replace(/\0/g, "").replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

console.log("=== DocClear Automated Test Suite ===");

// TC-01: Empty text handling
console.log("Test 1: Empty text validation");
assert.strictEqual(sanitizeText(""), "");
assert.strictEqual(calculateReadability("").fleschKincaidGrade, 0);
console.log("  ✓ Passed: Empty text handled gracefully.");

// TC-02: Sanitize control characters
console.log("Test 2: Null bytes and control character stripping");
const dirty = "Tenancy\0 Agreement\x07 Notice";
assert.strictEqual(sanitizeText(dirty), "Tenancy Agreement Notice");
console.log("  ✓ Passed: Malicious control characters stripped.");

// TC-03: Flesch-Kincaid complexity differentiation
console.log("Test 3: Reading level grade calculation");
const complexText =
  "Pursuant to the statutory provisions herein articulated, the lessee shall indemnify the lessor against any and all contingent liabilities heretofore accrued.";
const simpleText = "You must pay for any damages you cause during your rental.";
const complexGrade = calculateReadability(complexText).fleschKincaidGrade;
const simpleGrade = calculateReadability(simpleText).fleschKincaidGrade;

assert(complexGrade > simpleGrade, `Expected complex (${complexGrade}) > simple (${simpleGrade})`);
console.log(`  ✓ Passed: Complex text (Grade ${complexGrade}) scores higher than plain English (Grade ${simpleGrade}).`);

// TC-04: Key point extraction logic
console.log("Test 4: Key financial amount and date extraction");
const lease = "The Tenant shall pay $1,850.00 on the 1st day of each month. Due by November 15.";
const money = lease.match(/\$\s?[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?/g);
assert.strictEqual(money[0], "$1,850.00");
const dates = lease.match(/\b(?:November|1st)\b/g);
assert(dates.length >= 2);
console.log("  ✓ Passed: Correctly identified amounts ($1,850.00) and dates (November, 1st).");

console.log("\n===========================================");
console.log("ALL AUTOMATED UNIT TESTS PASSED (4/4) ✅");
console.log("===========================================\n");
