import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { NextFederationPlugin } = require("@module-federation/nextjs-mf");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enableFederation = process.env.ENABLE_MF !== "false";
// const homeRemoteBase = (process.env.HOME_REMOTE_URL ?? "http://localhost:3001").replace(/\/$/, "");
const homeRemoteBase = "http://localhost:3001";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer || !enableFederation) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "home/HomePage": path.resolve(__dirname, "lib/remote-home-placeholder.tsx"),
      };
    }

    if (!isServer && enableFederation) {
      config.plugins.push(
        new NextFederationPlugin({
          name: "host",
          filename: "static/chunks/remoteEntry.js",
          remotes: {
            home: `home@${homeRemoteBase}/_next/static/chunks/remoteEntry.js`,
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
