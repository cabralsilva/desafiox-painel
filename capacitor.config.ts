import type { CapacitorConfig } from "@capacitor/cli";

const devServerUrl = process.env.CAPACITOR_DEV_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.desafiox.painel",
  appName: "DESAFIOX Painel",
  webDir: "dist",
  ...(devServerUrl
    ? {
        server: {
          url: devServerUrl,
          cleartext: true,
        },
      }
    : {}),
};

export default config;
