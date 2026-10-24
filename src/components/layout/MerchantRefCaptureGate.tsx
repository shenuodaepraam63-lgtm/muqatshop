"use client";

import { Suspense } from "react";
import { MerchantRefCapture } from "./MerchantRefCapture";

export function MerchantRefCaptureGate() {
  return (
    <Suspense fallback={null}>
      <MerchantRefCapture />
    </Suspense>
  );
}
