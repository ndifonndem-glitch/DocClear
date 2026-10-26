export interface SimplificationRequest {
  text: string;
  readingLevel?: "simplified" | "standard" | "detailed";
}

export interface ReadingLevelMetrics {
  original_grade: number;
  simplified_grade: number;
  reduction_percentage: number;
  flesch_reading_ease_original?: number;
  flesch_reading_ease_simplified?: number;
  reliability?: "reliable" | "preliminary (short text)";
}

export interface VocabularyHelp {
  term: string;
  explanation: string;
}

export interface ExtractedDeadline {
  dateOrDuration: string;
  actionRequired: string;
  consequenceOrContext?: string;
  isRecurring?: boolean;
  tag?: "START" | "RECURRING" | "ACTION NEEDED" | "MILESTONE" | string;
  title?: string;
  description?: string;
}

export interface ExtractedFact {
  category: "financial" | "deadline" | "risk" | "right";
  title: string;
  detail: string;
  amountOrDate?: string;
}

export interface HeroMetric {
  label: string;
  value: string;
  subtext: string;
}

export interface DetailItem {
  label: string;
  value: string;
}

export interface DetailSection {
  title: string;
  theme: "blue" | "green" | "orange";
  items: DetailItem[];
}

export interface SimplificationResponse {
  status: "done" | "needs_review";
  runId: string;
  label: string;
  confidence: number;
  original_text: string;
  simplified_text: string;
  document_title?: string;
  document_subtitle?: string;
  hero_metrics?: HeroMetric[];
  detail_sections?: DetailSection[];
  cautionary_note?: string;
  reading_level: ReadingLevelMetrics;
  key_points: string[];
  structured_deadlines?: ExtractedDeadline[];
  structured_facts?: ExtractedFact[];
  vocabulary?: VocabularyHelp[];
  disclaimer: string;
}

export interface APIErrorResponse {
  status: "error";
  code: string;
  message: string;
  retryable: boolean;
}
