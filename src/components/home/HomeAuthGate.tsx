"use client";

import type { ReactNode } from "react";

/**
 * Root "/" always shows the customer store homepage (shelves, campaigns).
 * Marketing landing is kept available via props for future /welcome route if needed.
 */
export function HomeAuthGate({
  store,
}: {
  store: ReactNode;
  marketing?: ReactNode;
}) {
  return <>{store}</>;
}
