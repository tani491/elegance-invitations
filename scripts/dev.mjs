import { createWriteStream } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const logFile = createWriteStream(resolve(root, "dev.log"), { flags: "w" });
const nextCli = resolve(root, "node_modules", "next", "dist", "bin", "next");

const child = spawn(process.execPath, [
  nextCli,
  "dev",
  "--webpack",
  "-p",
  process.env.PORT ?? "3000",
], {
  cwd: root,
  env: process.env,
  stdio: ["inherit", "pipe", "pipe"],
});

const mirrorOutput = (chunk, stream) => {
  stream.write(chunk);
  logFile.write(chunk);
};

child.stdout.on("data", (chunk) => mirrorOutput(chunk, process.stdout));
child.stderr.on("data", (chunk) => mirrorOutput(chunk, process.stderr));

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    child.kill(signal);
  });
}

child.on("error", (error) => {
  const message = `${error.stack ?? error.message}\n`;

  process.stderr.write(message);
  logFile.write(message);
  logFile.end(() => {
    process.exit(1);
  });
});

child.on("exit", (code, signal) => {
  logFile.end(() => {
    if (signal) {
      process.exit(0);
    }

    process.exit(code ?? 0);
  });
});
