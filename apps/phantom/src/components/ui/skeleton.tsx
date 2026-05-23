import React from "react";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={`animate-pulse rounded-md bg-[#2C2C2E] ${className || ""}`}
      {...props}
    />
  );
}
