/**
 * Flesch-Kincaid Reading Grade & Readability Calculation
 * Measures text accessibility, sentence length, and syllable counts.
 */

function countSyllables(word: string): number {
  word = word.toLowerCase().trim();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, "");
  word = word.replace(/^y/, "");
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

export function calculateReadability(text: string) {
  if (!text || text.trim().length === 0) {
    return {
      fleschKincaidGrade: 0,
      fleschReadingEase: 100,
      readingLevelDescription: "No text",
      wordCount: 0,
      sentenceCount: 0,
    };
  }

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.match(/\b[A-Za-z0-9'-]+\b/g) || [];

  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);

  let totalSyllables = 0;
  for (const word of words) {
    totalSyllables += countSyllables(word);
  }

  // Flesch-Kincaid Grade Level formula:
  // 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0;

  const rawGrade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  const gradeLevel = Math.max(1, Math.min(18, Math.round(rawGrade * 10) / 10));

  // Flesch Reading Ease formula:
  // 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
  const rawEase = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  const readingEase = Math.max(0, Math.min(100, Math.round(rawEase)));

  let description = "Standard Reading Level";
  if (gradeLevel <= 6) {
    description = "Very Easy (Grade 5-6)";
  } else if (gradeLevel <= 8) {
    description = "Plain Language (Grade 7-8)";
  } else if (gradeLevel <= 12) {
    description = "Moderate / High School";
  } else {
    description = "Complex / Formal Legal";
  }

  return {
    fleschKincaidGrade: gradeLevel,
    fleschReadingEase: readingEase,
    readingLevelDescription: description,
    wordCount,
    sentenceCount,
  };
}
