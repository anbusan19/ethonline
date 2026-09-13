import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This app lives inside the vault402 monorepo (root package-lock.json), so
  // Next.js can't infer the workspace root on its own — pin it explicitly.
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
