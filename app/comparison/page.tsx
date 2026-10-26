"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ComparisonView } from "@/components/comparison/ComparisonView";
import { SimplificationResponse } from "@/types/api";

export default function ComparisonPage() {
  const router = useRouter();
  const [resultData, setResultData] = useState<SimplificationResponse | null>(null);

  useEffect(() => {
    const storedResult = sessionStorage.getItem("docclear_simplified_result");
    if (!storedResult) {
      router.push("/");
      return;
    }
    try {
      setResultData(JSON.parse(storedResult));
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!resultData) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-600 text-sm font-medium">Loading document summary...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ComparisonView data={resultData} />
    </div>
  );
}
