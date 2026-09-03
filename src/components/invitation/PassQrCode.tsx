"use client";

import { QRCodeSVG } from "qrcode.react";

export function PassQrCode({ value, size = 168 }: { value: string; size?: number }) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="H"
      bgColor="transparent"
      fgColor="#2f251f"
      marginSize={1}
    />
  );
}
