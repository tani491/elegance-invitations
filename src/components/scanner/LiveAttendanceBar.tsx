"use client";

import { Activity, Users, UserCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export type AttendanceStats = {
  expectedPeople: number;
  checkedInPeople: number;
  totalPasses: number;
  checkedPasses: number;
  attendanceRate: number;
};

export function LiveAttendanceBar({ stats }: { stats: AttendanceStats }) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-[#111111]/95 px-4 py-3 text-white shadow-2xl backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#2DD4BF]/15 text-[#2DD4BF]">
          <Activity className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-semibold">Affluence en direct</span>
            <span className="font-mono text-[#2DD4BF]">{stats.attendanceRate}%</span>
          </div>
          <Progress value={stats.attendanceRate} className="h-2 bg-white/10" />
        </div>
        <div className="hidden items-center gap-5 text-sm sm:flex">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-white/60" />
            <span>{stats.expectedPeople} attendus</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="size-4 text-[#2DD4BF]" />
            <span>{stats.checkedInPeople} entres</span>
          </div>
        </div>
        <div className="text-right text-xs text-white/70 sm:hidden">
          <div>{stats.expectedPeople} attendus</div>
          <div>{stats.checkedInPeople} entres</div>
        </div>
      </div>
    </div>
  );
}
