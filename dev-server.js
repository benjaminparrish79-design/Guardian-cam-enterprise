import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const nextArgs = ["dev"];

let port = "3000";
let host = "0.0.0.0";

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "-p" || arg === "--port") {
    port = args[++i] || "3000";
  } else if (arg === "--host" || arg === "-H" || arg === "--hostname") {
    host = args[++i] || "0.0.0.0";
  } else if (arg.startsWith("--host=")) {
    host = arg.substring(7);
  } else if (arg.startsWith("--port=")) {
    port = arg.substring(7);
  } else if (arg === "--") {
    // Skip double-dash argument separator
  } else {
    // Positional fallback
    if (/^\d+$/.test(arg)) {
      port = arg;
    } else if (arg === "0.0.0.0" || arg === "localhost" || arg.includes(".")) {
      host = arg;
    }
  }
}

nextArgs.push("-p", port);
nextArgs.push("-H", host);

console.log(`[Dev Wrapper] Starting Next.js dev server with args: next ${nextArgs.join(" ")}`);

const child = spawn("npx", ["next", ...nextArgs], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
