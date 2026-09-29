import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className = "", hoverable = false, children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-[#E8E8EC] p-5 transition-all duration-150 ${
        hoverable ? "hover:border-[#D1D0D7] hover:shadow-sm" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}