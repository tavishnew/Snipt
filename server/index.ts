import express from "express";
import { createServer, request as httpRequest } from "http";
import { request as httpsRequest } from "https";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  const apiUrl = process.env.API_URL || "http://localhost:8000";

  // Proxy /api requests to backend API server
  app.use("/api", (req, res) => {
    const target = new URL(req.url, apiUrl.endsWith("/") ? apiUrl : apiUrl + "/");
    const isHttps = target.protocol === "https:";
    const requestFn = isHttps ? httpsRequest : httpRequest;

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key.toLowerCase() !== "host" && value !== undefined) {
        headers[key] = Array.isArray(value) ? value.join(", ") : value;
      }
    }
    if (req.headers.host) {
      headers["x-forwarded-host"] = req.headers.host;
    }

    const proxyReq = requestFn(
      target,
      {
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      }
    );

    proxyReq.on("error", (err) => {
      console.error("API proxy error:", err);
      if (!res.headersSent) {
        res.status(502).json({ error: { code: "BAD_GATEWAY", message: "API server unavailable" } });
      }
    });

    req.pipe(proxyReq, { end: true });
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
