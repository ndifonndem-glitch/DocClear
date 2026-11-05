
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "pdf-parse",
      "mammoth",
      "@napi-rs/canvas",
    ],
    outputFileTracingIncludes: {
      "/api/extract-doc": [
        "./node_modules/@napi-rs/canvas/**/*",
        "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
      ],
    },
  },
};

export default nextConfig;

