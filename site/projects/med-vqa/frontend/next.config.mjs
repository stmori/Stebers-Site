// Static export: `next build` writes plain HTML/JS to out/, which Caddy serves (see Dockerfile).
// NEXT_PUBLIC_BASE_PATH lets the same build live at a sub-path, e.g. "/projects/med-vqa" on the main site.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
