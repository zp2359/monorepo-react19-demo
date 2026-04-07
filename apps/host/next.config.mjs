import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { NextFederationPlugin } = require("@module-federation/nextjs-mf");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer || process.env.NODE_ENV !== "development") {
      config.resolve.alias = {
        ...config.resolve.alias,
        "home/HomePage": path.resolve(__dirname, "lib/remote-home-placeholder.tsx"),
      };
    }

    if (!isServer && process.env.NODE_ENV === "development") {
      config.plugins.push(
        new NextFederationPlugin({
          name: "host",
          filename: "static/chunks/remoteEntry.js",
          remotes: {
            home: "home@http://localhost:3001/_next/static/chunks/remoteEntry.js",
          },
          shared: {
            react: {
              singleton: true,
              requiredVersion: false,
            },
            "react-dom": {
              singleton: true,
              requiredVersion: false,
            },
          },
          extraOptions: {
            exposePages: false,
          },
        })
      );
    }

    return config;
  },
};

export default nextConfig;
