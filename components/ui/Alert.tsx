import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export interface AlertProps {
  type?: "info" | "warning" | "error" | "success";
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  children,
  action,
  className = "",
}) => {
  const configs = {
    info: {
      container: "bg-blue-50 border-blue-200 text-blue-950",
      icon: <Info className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" aria-hidden="true" />,
      role: "region",
    },
    warning: {
      container: "bg-amber-50 border-amber-200 text-amber-950",
      icon: <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" aria-hidden="true" />,
      role: "region",
    },
    error: {
      container: "bg-rose-50 border-rose-200 text-rose-950",
      icon: <AlertCircle className="w-5 h-5 text-rose-700 mt-0.5 flex-shrink-0" aria-hidden="true" />,
      role: "alert", // WCAG 4.1.3: Immediate alert announcement for errors
    },
    success: {
      container: "bg-emerald-50 border-emerald-200 text-emerald-950",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" aria-hidden="true" />,
      role: "status",
    },
  };

  const current = configs[type];

  return (
    <div
      role={current.role}
      className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3 text-sm leading-relaxed ${current.container} ${className}`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {current.icon}
        <div className="flex-1 min-w-0">
          {title && <h3 className="font-bold text-sm mb-1">{title}</h3>}
          <div className="break-words">{children}</div>
        </div>
      </div>
      {action && <div className="sm:ml-auto flex-shrink-0 pl-8 sm:pl-0">{action}</div>}
    </div>
  );
};
