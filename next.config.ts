import type { NextConfig } from "next";

const securityHeaders = [
  // Force HTTPS for a year, apply to subdomains, allow preload lists.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  // Block being iframed by other sites (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from MIME-sniffing responses.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't send full URL to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny access to sensor / device APIs we don't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
