import { chromium, type BrowserContext, type TestInfo } from "@playwright/test";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";

export type RuntimeProbeAssets = {
  html: string;
  script: string;
};

export const extensionPath = path.resolve(process.cwd(), "dist-extension");

export const buildRuntimeProbeAssets = (): RuntimeProbeAssets => ({
  html: `
      <!doctype html>
      <html>
        <head><title>Michi runtime probe</title></head>
        <body>
          <main>
            <h1>Michi runtime probe</h1>
            <pre id="response">pending</pre>
          </main>
          <script src="runtime-probe.js"></script>
        </body>
      </html>
    `,
  script: `
      const responseElement = document.getElementById("response");
      chrome.runtime.sendMessage({ type: "MICHI_GET_PAGE_CONTEXT" })
        .then((response) => {
          responseElement.textContent = JSON.stringify(response);
          responseElement.dataset.ready = "true";
        })
        .catch((error) => {
          responseElement.textContent = JSON.stringify({
            type: "MICHI_PROBE_RUNTIME_ERROR",
            reason: error instanceof Error ? error.message : "Probe could not reach runtime."
          });
          responseElement.dataset.ready = "true";
        });
    `
});

export const installRuntimeProbe = (extensionDirectory = extensionPath) => {
  const assets = buildRuntimeProbeAssets();

  writeFileSync(path.join(extensionDirectory, "runtime-probe.html"), assets.html);
  writeFileSync(path.join(extensionDirectory, "runtime-probe.js"), assets.script);
};

export const hasExtensionBuild = (extensionDirectory = extensionPath) =>
  existsSync(path.join(extensionDirectory, "manifest.json"));

export const buildExtensionLaunchArgs = (extensionDirectory = extensionPath) => [
  `--disable-extensions-except=${extensionDirectory}`,
  `--load-extension=${extensionDirectory}`
];

export const launchExtensionRuntime = async (
  testInfo: TestInfo,
  extensionDirectory = extensionPath
): Promise<BrowserContext> => {
  installRuntimeProbe(extensionDirectory);

  return await chromium.launchPersistentContext(testInfo.outputPath("extension-user-data"), {
    channel: "chromium",
    headless: true,
    args: buildExtensionLaunchArgs(extensionDirectory)
  });
};

export const getRuntimeProbeUrl = (extensionId: string) =>
  `chrome-extension://${extensionId}/runtime-probe.html`;
