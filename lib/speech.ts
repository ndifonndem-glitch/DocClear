export interface SpeechSpeedPreset {
  val: number;
  shortLabel: string;
  label: string;
}

/**
 * Canonical Web Speech playback rates aligned across Settings and the audio bar.
 */
export const SPEECH_SPEED_PRESETS: SpeechSpeedPreset[] = [
  { val: 0.8, shortLabel: "Slow", label: "0.8x Slow" },
  { val: 1, shortLabel: "Normal", label: "1x Normal" },
  { val: 1.25, shortLabel: "Steady", label: "1.25x Steady" },
  { val: 1.5, shortLabel: "Fast", label: "1.5x Fast" },
  { val: 2, shortLabel: "Faster", label: "2x Faster" },
];

/**
 * Normalizes legacy persisted speeds (such as 1.2 from pilot builds) onto 1.25
 * and falls back to 1x when an unknown or NaN value is stored.
 */
export function normalizeSpeechRate(raw: string | number | null | undefined): number {
  const numeric = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""));
  if (numeric === 1.2) return 1.25;
  const matched = SPEECH_SPEED_PRESETS.find((preset) => preset.val === numeric);
  return matched ? matched.val : 1;
}

export function getSpeechSpeedPreset(rate: number): SpeechSpeedPreset {
  return (
    SPEECH_SPEED_PRESETS.find((preset) => preset.val === rate) ??
    SPEECH_SPEED_PRESETS[1]
  );
}
