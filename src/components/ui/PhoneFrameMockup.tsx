import type { ReactNode } from "react";

export function PhoneFrameMockup({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[2rem] bg-[#1A1818] p-3 shadow-2xl">
      <div className="mx-auto mb-2 h-5 w-24 rounded-full bg-white/10" />
      <div className="overflow-hidden rounded-[1.25rem]" style={{ aspectRatio: "9/16" }}>
        {children}
      </div>
    </div>
  );
}
