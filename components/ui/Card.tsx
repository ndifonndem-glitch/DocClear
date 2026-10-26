import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered";
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const base = "rounded-2xl overflow-hidden transition-shadow";
  const variants = {
    default: "bg-white border border-slate-200 shadow-sm",
    elevated: "bg-white shadow-md border border-slate-100",
    bordered: "bg-white border-2 border-slate-300",
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};
