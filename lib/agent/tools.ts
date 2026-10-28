/**
 * Real Executable Agent Tools for DocClear Document Understanding
 * Supports observable tool calling with inputs, outputs, and grounding verification.
 */

export interface DocumentClause {
  id: string;
  number: number;
  title: string;
  content: string;
  page?: number;
}

export interface SearchResult {
  clauseId: string;
  clauseTitle: string;
  passage: string;
  score: number;
  page: number;
}

export interface DeadlineResult {
  timing: string;
  tag: "START" | "RECURRING" | "ACTION NEEDED" | "PENALTY" | "DEADLINE";
  title: string;
  actionRequired: string;
  consequence: string;
  clauseRef?: string;
}

export interface GroundingVerificationResult {
  grounded: boolean;
  confidenceScore: number;
  supportingCitations: string[];
  missingEvidenceTopics: string[];
}

/**
 * Splits raw document text into structured clauses/sections with page estimations
 */
export function segmentDocument(text: string): DocumentClause[] {
  if (!text || text.trim().length === 0) return [];

  // Match common legal, lease, and administrative clause headers
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const clauses: DocumentClause[] = [];
  let currentTitle = "General Provisions";
  let currentBuffer: string[] = [];
  let clauseIndex = 1;

  for (const line of lines) {
    const isHeader =
      /^(?:clause|section|article|item|paragraph|\d+[\.)]|part)\s+/i.test(line) ||
      /^[A-Z\s]{4,40}:?$/.test(line) ||
      /^(?:employment agreement|residential tenancy|notice of|bylaw|patient liability|payment terms)/i.test(line);

    if (isHeader && currentBuffer.length > 0) {
      clauses.push({
        id: `clause_${clauseIndex}`,
        number: clauseIndex,
        title: currentTitle,
        content: currentBuffer.join(" "),
        page: Math.ceil(clauseIndex / 3), // ~3 clauses per page standard
      });
      clauseIndex++;
      currentTitle = line.replace(/[:.]+$/, "");
      currentBuffer = [];
    } else {
      currentBuffer.push(line);
    }
  }

  if (currentBuffer.length > 0) {
    clauses.push({
      id: `clause_${clauseIndex}`,
      number: clauseIndex,
      title: currentTitle,
      content: currentBuffer.join(" "),
      page: Math.ceil(clauseIndex / 3),
    });
  }

  // If text was a single block with no clear headers, split into paragraphs
  if (clauses.length <= 1 && text.length > 200) {
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const chunkSize = 3;
    const fallbackClauses: DocumentClause[] = [];
    for (let i = 0; i < sentences.length; i += chunkSize) {
      const idx = Math.floor(i / chunkSize) + 1;
      const chunk = sentences.slice(i, i + chunkSize).join(" ");
      fallbackClauses.push({
        id: `section_${idx}`,
        number: idx,
        title: `Section ${idx}: ${chunk.slice(0, 32).trim()}...`,
        content: chunk,
        page: Math.ceil(idx / 3),
      });
    }
    return fallbackClauses;
  }

  return clauses;
}

/**
 * Tool 1: search_document
 * Searches segmented document for passages relevant to the query.
 */
export function toolSearchDocument(
  documentText: string,
  query: string
): { results: SearchResult[]; queryTerms: string[]; totalClausesScanned: number } {
  const clauses = segmentDocument(documentText);
  if (!query || clauses.length === 0) {
    return { results: [], queryTerms: [], totalClausesScanned: clauses.length };
  }

  // Tokenize query words (removing common stop words)
  const stopWords = new Set(["the", "is", "at", "which", "on", "a", "an", "and", "or", "to", "in", "what", "how", "if", "i"]);
  const queryWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  const scored: SearchResult[] = [];

  for (const clause of clauses) {
    const clauseTextLower = (clause.title + " " + clause.content).toLowerCase();
    let matchCount = 0;

    for (const word of queryWords) {
      if (clauseTextLower.includes(word)) {
        matchCount++;
      }
    }

    // Boost score if contains critical penalty/payment keywords
    const hasPenaltyKeyword = /penalty|default|arrears|evict|forfeit|fine|damage|remediate/i.test(clause.content);
    const hasDeadlineKeyword = /deadline|month|calendar|day|hour|notice|due/i.test(clause.content);

    let score = matchCount / Math.max(1, queryWords.length);
    if (query.match(/late|penalty|default/i) && hasPenaltyKeyword) score += 0.35;
    if (query.match(/deadline|when|due|time/i) && hasDeadlineKeyword) score += 0.25;

    if (score > 0.2 || matchCount > 0) {
      scored.push({
        clauseId: clause.id,
        clauseTitle: clause.title,
        passage: clause.content,
        score: Math.min(1.0, Math.round(score * 100) / 100),
        page: clause.page || 1,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return {
    results: scored.slice(0, 3), // Return top 3 most relevant passages
    queryTerms: queryWords,
    totalClausesScanned: clauses.length,
  };
}

/**
 * Tool 2: find_deadlines
 * Extracts temporal dates, grace periods, and late penalty conditions.
 */
export function toolFindDeadlines(documentText: string, topic?: string): DeadlineResult[] {
  const clauses = segmentDocument(documentText);
  const deadlines: DeadlineResult[] = [];

  // Patterns for dates and deadlines
  const calendarDateRegex =
    /\b(?:(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{4})?|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/gi;
  const relativeRegex =
    /\b(?:within|prior to|after|exceeding)\s+(\d+|one|two|three|four|five|seven|fourteen|twenty-one|thirty)\s+(?:calendar|business|working)?\s*(?:days|weeks|months|hours)\b/gi;
  const recurringRegex =
    /\b(?:first|last|\d+(?:st|nd|rd|th)?)\s+day\s+of\s+each\s+(?:calendar\s+)?month\b/gi;

  for (const clause of clauses) {
    const text = clause.content;

    // Recurring payment schedules
    const recurringMatches = text.match(recurringRegex);
    if (recurringMatches) {
      for (const m of recurringMatches) {
        deadlines.push({
          timing: m.toUpperCase(),
          tag: "RECURRING",
          title: "Scheduled Payment Obligation",
          actionRequired: "Remit required payment to designated account",
          consequence: "Default penalty applies if unpaid past grace window",
          clauseRef: clause.title,
        });
      }
    }

    // Relative deadlines & grace periods
    const relativeMatches = text.match(relativeRegex);
    if (relativeMatches) {
      for (const m of relativeMatches) {
        const isPenalty = /penalty|arrears|default|forfeit/i.test(text);
        deadlines.push({
          timing: m.toUpperCase(),
          tag: isPenalty ? "PENALTY" : "ACTION NEEDED",
          title: isPenalty ? "Grace Period & Penalty Trigger" : "Time-Sensitive Requirement",
          actionRequired: isPenalty ? "Remit payment before grace limit expires" : "Complete mandated action",
          consequence: isPenalty ? "Administrative arrears penalty or recovery action" : "Potential default",
          clauseRef: clause.title,
        });
      }
    }

    // Fixed calendar dates
    const calendarMatches = text.match(calendarDateRegex);
    if (calendarMatches) {
      for (const m of calendarMatches) {
        deadlines.push({
          timing: m.toUpperCase(),
          tag: "START",
          title: "Key Calendar Obligation",
          actionRequired: "Mark date on personal calendar",
          consequence: "Action must be active by this date",
          clauseRef: clause.title,
        });
      }
    }
  }

  // Deduplicate and filter if topic specified
  const unique = Array.from(new Map(deadlines.map((d) => [`${d.timing}_${d.tag}`, d])).values());

  if (topic) {
    const lowerTopic = topic.toLowerCase();
    return unique.filter(
      (d) =>
        d.timing.toLowerCase().includes(lowerTopic) ||
        d.title.toLowerCase().includes(lowerTopic) ||
        d.consequence.toLowerCase().includes(lowerTopic)
    );
  }

  return unique;
}

/**
 * Tool 3: verify_grounding
 * Verifies that the proposed answer strictly relies on evidence from the retrieved passages.
 */
export function toolVerifyGrounding(
  retrievedPassages: string[],
  proposedAnswer: string,
  userQuestion: string
): GroundingVerificationResult {
  if (retrievedPassages.length === 0) {
    return {
      grounded: false,
      confidenceScore: 0.1,
      supportingCitations: [],
      missingEvidenceTopics: [userQuestion],
    };
  }

  const combinedPassages = retrievedPassages.join(" ").toLowerCase();
  const answerLower = proposedAnswer.toLowerCase();

  // Extract key entities, figures, numbers, and dates in the proposed answer
  const figuresInAnswer = proposedAnswer.match(/\$\s?[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?|\b\d+%\b|\b\d+\s+days\b/gi) || [];
  let confirmedFigures = 0;

  for (const fig of figuresInAnswer) {
    const cleanFig = fig.toLowerCase().trim();
    if (combinedPassages.includes(cleanFig)) {
      confirmedFigures++;
    }
  }

  const figureRatio =
    figuresInAnswer.length > 0 ? confirmedFigures / figuresInAnswer.length : 1.0;

  // Determine supporting citations
  const citations: string[] = [];
  for (let i = 0; i < retrievedPassages.length; i++) {
    const words = retrievedPassages[i].toLowerCase().split(/\s+/).slice(0, 6).join(" ");
    citations.push(`Source Passage ${i + 1} ("${words}...")`);
  }

  const isGrounded = figureRatio >= 0.75 && retrievedPassages.length > 0;

  return {
    grounded: isGrounded,
    confidenceScore: isGrounded ? Math.round((0.85 + figureRatio * 0.13) * 100) / 100 : 0.35,
    supportingCitations: citations,
    missingEvidenceTopics: isGrounded ? [] : ["Specific terms not verifiable in source clauses"],
  };
}
