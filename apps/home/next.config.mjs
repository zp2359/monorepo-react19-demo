import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { NextFederationPlugin } = require("@module-federation/nextjs-mf");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer && process.env.NODE_ENV === "development") {
      config.plugins.push(
        new NextFederationPlugin({
          name: "home",
          filename: "static/chunks/remoteEntry.js",
          exposes: {
            "./HomePage": "./pages/index.tsx",
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
