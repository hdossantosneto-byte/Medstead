import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Documented placeholder — not a live public host.
 * Set CAPACITOR_SERVER_URL to Hairson’s HTTPS origin when it exists.
 * Do not use bolt.host as production.
 */
const PLACEHOLDER_SERVER_URL = "https://YOUR-LIVE-HTTPS-HOST.example";

function remoteServer() {
  const url = (process.env.CAPACITOR_SERVER_URL || PLACEHOLDER_SERVER_URL).trim();
  let hostname = "YOUR-LIVE-HTTPS-HOST.example";
  try {
    hostname = new URL(url).hostname;
  } catch {
    /* keep placeholder hostname */
  }
  return { url, hostname };
}

const remote = remoteServer();

const config: CapacitorConfig = {
  appId: "com.medstead.app",
  appName: "MedStead",
  webDir: "ios-shell/www",
  backgroundColor: "#F6F4EF",
  server: {
    url: remote.url,
    errorPath: "offline.html",
    allowNavigation: [remote.hostname],
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "App",
  },
};

export default config;
