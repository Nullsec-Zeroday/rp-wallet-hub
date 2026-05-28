import { cn } from "@/lib/utils";

export function AuroraGlow({ isStatic = false, className }: { isStatic?: boolean; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]",
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(20, 10, 40, 0.6) 0%, transparent 100%)",
        }}
      />
      <div className={cn("absolute left-[10%] top-[50px] h-[150px] w-[150px] rounded-full bg-[#5d2bbc] opacity-[0.35] blur-[60px] md:h-[200px] md:w-[200px] md:blur-[80px]", !isStatic && "animate-aurora-1")} />
      <div className={cn("absolute right-[15%] top-[100px] h-[120px] w-[120px] rounded-full bg-[#4c2299] opacity-[0.40] blur-[50px] md:h-[180px] md:w-[180px] md:blur-[70px]", !isStatic && "animate-aurora-2")} />
      <div className={cn("absolute left-[20%] top-[300px] h-[180px] w-[180px] rounded-full bg-[#2e1261] opacity-[0.35] blur-[70px] md:h-[250px] md:w-[250px] md:blur-[90px]", !isStatic && "animate-aurora-3")} />
      <div className={cn("absolute right-[20%] top-[250px] h-[140px] w-[140px] rounded-full bg-[#6b31c9] opacity-[0.25] blur-[60px] md:h-[220px] md:w-[220px] md:blur-[80px]", !isStatic && "animate-aurora-1")} />
      <div className={cn("absolute left-[45%] top-[150px] h-[100px] w-[100px] rounded-full bg-[#7f66ff] opacity-[0.30] blur-[40px] md:h-[150px] md:w-[150px] md:blur-[60px]", !isStatic && "animate-aurora-2")} />
    </div>
  );
}
