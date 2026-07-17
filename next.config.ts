import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/crm", destination: "/sales/crm", permanent: true },
      { source: "/landings", destination: "/marketing", permanent: true },
      { source: "/funnels", destination: "/marketing", permanent: true },
      { source: "/bookings", destination: "/reservations", permanent: true },
      { source: "/roomrack", destination: "/operations/room-rack", permanent: true },
      { source: "/billing", destination: "/finance", permanent: true }
      // /night-audit serves its own page directly — no redirect needed
    ];
  }
};

export default nextConfig;
