const raw = process.env.BACKEND_URL || "http://127.0.0.1:8080";
const target = new URL(raw);
if (
  !["http:", "https:"].includes(target.protocol) ||
  target.username ||
  target.password ||
  !["", "/"].includes(target.pathname)
) {
  throw new Error(
    "BACKEND_URL должен быть адресом сервера, например http://127.0.0.1:8080, без /docs и /api/v1",
  );
}
const config = {
  agentRules: false,
  devIndicators: false,
  poweredByHeader: false,
  experimental: { proxyTimeout: 180000 },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${target.origin}/api/v1/:path*`,
      },
    ];
  },
};
export default config;
