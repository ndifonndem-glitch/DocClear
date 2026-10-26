import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "default" | "large" | "small";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "default",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  // WCAG 2.5.5: Minimum 48px touch targets for mobile touch accessibility
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl min-h-[48px] min-w-[48px] px-5 py-3 transition-all focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none text-base";

  const variants = {
    primary:
      "bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white shadow-md focus:ring-blue-300 focus:ring-offset-white",
    secondary:
      "bg-slate-800 hover:bg-slate-900 active:bg-black text-white shadow-sm focus:ring-slate-300 focus:ring-offset-white",
    outline:
      "bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 border-2 border-slate-300 hover:border-slate-400 focus:ring-blue-200 focus:ring-offset-white",
    danger:
      "bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white shadow-md focus:ring-rose-200 focus:ring-offset-white",
    ghost:
      "bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-700 focus:ring-slate-200",
  };

  const sizes = {
    small: "px-3 py-2 text-sm min-h-[44px]",
    default: "px-5 py-3 text-base min-h-[48px]",
    large: "px-6 py-4 text-lg min-h-[56px]",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          <span>Processing...</span>
        </span>
      ) : (
        <span className="flex items-center gap-2">
          {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
        </span>
      )}
    </button>
  );
};
