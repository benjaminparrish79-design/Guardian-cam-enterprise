import express from "express";
import next from "next";
import { parse } from "node:url";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Use /.*/ to replace "*" for compatibility with Express 5+ paths
  server.all(/.*/, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  server.listen(port, hostname, () => {
    console.log(`[Production Server] Next.js custom server ready on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error("Failed to start custom server:", err);
  process.exit(1);
});
