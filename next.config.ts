import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
      { protocol: "https", hostname: "litter.catbox.moe" },
      { protocol: "https", hostname: "**.catbox.moe" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
  async redirects() {
    return [
      { source: "/welcome", destination: "/login", permanent: true },
      { source: "/welcome/:path*", destination: "/login", permanent: true },
      { source: "/merchant/login", destination: "/login", permanent: true },
      { source: "/merchant/register", destination: "/register/affiliate", permanent: true },
    ];
  },
};

export default nextConfig;
