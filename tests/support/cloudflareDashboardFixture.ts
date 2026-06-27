import type { Route } from "@playwright/test";

export type CloudflareDashboardFixture = {
  contentType: "text/html";
  body: string;
};

const pageShell = (body: string, includeWorkersNavigation = true): CloudflareDashboardFixture => ({
  contentType: "text/html",
  body: `
    <!doctype html>
    <html>
      <head>
        <title>Workers & Pages</title>
        <style>
          body { min-height: 1800px; }
          main { padding-top: 360px; }
          [data-scroll-container] {
            height: 260px;
            overflow: auto;
            border: 1px solid #ddd;
          }
          [data-scroll-spacer] {
            height: 520px;
            padding-top: 360px;
          }
        </style>
      </head>
      <body>
        ${includeWorkersNavigation ? '<nav><a href="/workers-and-pages">Workers & Pages</a></nav>' : ""}
        <main>
          ${body}
        </main>
      </body>
    </html>
  `
});

export const buildCloudflareDashboardFixture = (requestUrl: string): CloudflareDashboardFixture => {
  const requestPath = new URL(requestUrl).pathname;

  if (requestUrl.includes("/missing-target")) {
    return pageShell("<h1>Workers & Pages</h1><p>Loading actions...</p>", false);
  }

  if (requestUrl.includes("/analytics")) {
    return pageShell("<h1>Analytics</h1><p>Traffic insights for this account.</p>");
  }

  if (requestUrl.includes("/workers-and-pages/nested-scroll")) {
    return pageShell(`
      <section data-scroll-container>
        <div data-scroll-spacer>
          <h1>Workers & Pages</h1>
          <button>Create Worker</button>
        </div>
      </section>
    `);
  }

  if (requestUrl.includes("/workers/starter-editor")) {
    return pageShell(`
      <h1>Worker starter editor</h1>
      <pre><code>export default { async fetch(request) { return new Response("Hello from Michi"); } }</code></pre>
    `);
  }

  if (requestUrl.includes("/workers/deploy-review")) {
    return pageShell(`
      <h1>Deploy Worker</h1>
      <p>Review the Worker deployment before publishing.</p>
      <button>Deploy Worker</button>
    `);
  }

  if (requestUrl.includes("/workers/deploy-result")) {
    return pageShell(`
      <h1>Deployment complete</h1>
      <p>Your Worker is available at:</p>
      <a href="https://michi-starter.example.workers.dev">https://michi-starter.example.workers.dev</a>
    `);
  }

  if (requestUrl.includes("/pages/deploy-review")) {
    return pageShell(`
      <h1>Deploy Pages project</h1>
      <p>Review the Pages deployment before publishing.</p>
      <button>Deploy Pages project</button>
    `);
  }

  if (requestUrl.includes("/pages/deploy-result")) {
    return pageShell(`
      <h1>Deployment complete</h1>
      <p>Your Pages site is available at:</p>
      <a href="https://michi-static.pages.dev">https://michi-static.pages.dev</a>
    `);
  }

  if (/\/pages\/?$/.test(requestPath)) {
    return pageShell(`
      <h1>Pages projects</h1>
      <button>Create Pages project</button>
    `);
  }

  return pageShell(`
    <h1>Workers & Pages</h1>
    <button>Create Worker</button>
  `);
};

export const fulfillCloudflareDashboardRoute = async (route: Route) => {
  await route.fulfill(buildCloudflareDashboardFixture(route.request().url()));
};
