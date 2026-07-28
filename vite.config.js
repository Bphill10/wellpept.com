import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Local /api middleware so Stripe PaymentIntents work in `vite`/`vite preview`
 * the same way they do on Vercel serverless.
 */
function stripeLocalApiPlugin(env) {
  return {
    name: "undisclosed-stripe-api",
    configureServer(server) {
      attachApi(server, env);
    },
    configurePreviewServer(server) {
      attachApi(server, env);
    },
  };
}

function attachApi(server, env) {
  // Make secrets available to API handlers during local dev.
  for (const [key, value] of Object.entries(env)) {
    if (value != null && process.env[key] == null) process.env[key] = value;
  }

  const root = path.resolve(".");

  async function runHandler(fileName, req, res) {
    const fileUrl = pathToFileURL(path.join(root, "api", fileName)).href;
    const mod = await import(`${fileUrl}?t=${Date.now()}`);
    const handler = mod.default;
    await handler(req, res);
  }

  server.middlewares.use(async (req, res, next) => {
    const url = req.url?.split("?")[0] || "";
    try {
      if (url === "/api/payment-config") {
        await runHandler("payment-config.js", req, res);
        return;
      }
      if (url === "/api/create-payment-intent") {
        await runHandler("create-payment-intent.js", req, res);
        return;
      }
    } catch (err) {
      console.error("Local Stripe API error", err);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err?.message || "API error" }));
      return;
    }
    next();
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), stripeLocalApiPlugin(env)],
  };
});
