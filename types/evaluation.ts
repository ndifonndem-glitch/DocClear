export interface SUSResponse {
  q1: number; // I think that I would like to use this system frequently
  q2: number; // I found the system unnecessarily complex
  q3: number; // I thought the system was easy to use
  q4: number; // I think that I would need the support of a technical person to be able to use this system
  q5: number; // I found the various functions in this system were well integrated
  q6: number; // I thought there was too much inconsistency in this system
  q7: number; // I would imagine that most people would learn to use this system very quickly
  q8: number; // I found the system very cumbersome to use
  q9: number; // I felt very confident using the system
  q10: number; // I needed to learn a lot of things before I could get going with this system
}

export interface HeuristicItem {
  id: string;
  category: "Visibility" | "Real World Match" | "User Control" | "Consistency" | "Error Prevention" | "Recognition" | "Flexibility" | "Aesthetic" | "Error Recovery" | "Help" | "Accessibility";
  title: string;
  description: string;
  status: "pass" | "fail" | "untested";
  severity?: 0 | 1 | 2 | 3 | 4; // 0=None, 1=Cosmetic, 2=Minor, 3=Major, 4=Catastrophe
  notes?: string;
}
