"use client";

import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ImageUploader({
  disabled,
  label = "Uploader une image HD",
  helper = "Portrait 9:16 recommande, JPG/PNG/WEBP/AVIF",
  onUpload,
}: {
  disabled?: boolean;
  label?: string;
  helper?: string;
  onUpload: (file: File) => void;
}) {
  return (
    <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#D4AF37]/40 bg-white/70 p-5 text-center transition hover:bg-white has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      <Upload className="mb-3 size-7 text-[#D4AF37]" />
      <span className="font-medium">{label}</span>
      <span className="mt-1 text-sm text-muted-foreground">{helper}</span>
      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.currentTarget.value = "";
        }}
      />
    </label>
  );
}
