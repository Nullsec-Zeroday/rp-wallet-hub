import React from "react";
import { Sparkles } from "lucide-react";

export default function PerpsPage() {
  return (
    <div className="flex w-full h-[80vh] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-utility-1-opacity-5 flex items-center justify-center mb-2">
          <Sparkles className="text-utility-1-opacity-1" size={32} />
        </div>
        <h2 className="typography-header-24 text-utility-1-default font-bold">Coming Soon</h2>
        <p className="typography-body-14 text-utility-1-opacity-1 font-medium max-w-[280px]">
          We're working hard to bring you the new Rewards experience. Stay tuned!
        </p>
      </div>
    </div>
  );
}
