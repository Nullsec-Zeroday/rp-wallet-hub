"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function AuroraGlow({ isStatic = false, className }: { isStatic?: boolean; className?: string }) {
  const pathname = usePathname();
  
  if (pathname === "/buy") {
    return null;
  }
  
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]",
        className,
      )}
    >
      {/* <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(20, 10, 40, 0.6) 0%, transparent 100%)",
        }}
      /> */}
      <div className={cn("absolute -left-[10%] top-[50px] h-[300px] w-[300px] rounded-full bg-[#5d2bbc] opacity-[0.25] blur-[100px] md:h-[450px] md:w-[450px] md:blur-[150px]", !isStatic && "animate-aurora-1")} />
      <div className={cn("absolute -right-[5%] top-[100px] h-[250px] w-[250px] rounded-full bg-[#4c2299] opacity-[0.25] blur-[100px] md:h-[400px] md:w-[400px] md:blur-[140px]", !isStatic && "animate-aurora-2")} />
      
      {/* Central hero glow */}
      <div className={cn("absolute left-1/2 -translate-x-1/2 top-[150px] h-[350px] w-[350px] rounded-full bg-[#7c3aed] opacity-[0.24] blur-[100px] md:h-[500px] md:w-[500px] md:blur-[160px]", !isStatic && "animate-aurora-3")} />
      
      <div className={cn("absolute left-[5%] top-[350px] h-[300px] w-[300px] rounded-full bg-[#2e1261] opacity-[0.3] blur-[100px] md:h-[450px] md:w-[450px] md:blur-[150px]", !isStatic && "animate-aurora-1")} />
      <div className={cn("absolute right-[10%] top-[400px] h-[250px] w-[250px] rounded-full bg-[#6b31c9] opacity-[0.2] blur-[100px] md:h-[350px] md:w-[350px] md:blur-[130px]", !isStatic && "animate-aurora-2")} />
    </div>
  );
}
