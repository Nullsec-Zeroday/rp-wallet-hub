import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary";
}

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "default" && "bg-slate-950 text-white shadow hover:bg-slate-800",
        variant === "secondary" && "bg-slate-100 text-slate-950 hover:bg-slate-200",
        variant === "outline" && "border border-slate-200 bg-white hover:bg-slate-50",
        variant === "ghost" && "hover:bg-slate-100",
        className,
      )}
      {...props}
    />
  );
}
