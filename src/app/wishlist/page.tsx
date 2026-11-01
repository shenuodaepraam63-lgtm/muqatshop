"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Compatibility redirect: wishlist lives under the customer account shell. */
export default function WishlistRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/account/wishlist");
  }, [router]);
  return (
    <div className="min-h-[40vh] grid place-items-center bg-[#F6F8FB] text-sm text-[#718096]">
      جاري فتح المفضلة في حسابك...
    </div>
  );
}
