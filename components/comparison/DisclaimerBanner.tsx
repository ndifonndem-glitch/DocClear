import React from "react";
import { AlertTriangle } from "lucide-react";

export const DisclaimerBanner: React.FC = () => {
  return (
    <div
      role="note"
      aria-label="Important legal and comprehension disclaimer"
      className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-r-xl shadow-sm text-amber-950 text-xs sm:text-sm leading-relaxed"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <strong className="font-bold block text-amber-900 mb-0.5">
            Always Verify Important Details Against the Original
          </strong>
          <span>
            DocClear is an educational and accessibility aid designed to explain difficult phrasing. It is{" "}
            <strong>not</strong> qualified legal, medical, or financial advice. Always check critical payment deadlines,
            dollar amounts, and contractual penalties against the original document text before taking action.
          </span>
        </div>
      </div>
    </div>
  );
};
