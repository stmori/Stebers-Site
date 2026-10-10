// Static export: `next build` writes plain HTML/JS to out/, which Caddy serves (see Dockerfile and deploy/Caddyfile).
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
