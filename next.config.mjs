/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // three ships ESM that needs transpiling for some drei deps
  transpilePackages: ["three"],
  webpack: (config) => {
    // fabric's optional node-only deps are not needed in the browser
    config.externals = [...(config.externals || []), { canvas: "canvas", jsdom: "jsdom" }];
    return config;
  },
};
export default nextConfig;
