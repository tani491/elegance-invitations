import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const standaloneNextDir = resolve(root, ".next", "standalone", ".next");

mkdirSync(standaloneNextDir, { recursive: true });

const staticDir = resolve(root, ".next", "static");
if (existsSync(staticDir)) {
  cpSync(staticDir, resolve(standaloneNextDir, "static"), { recursive: true });
}

const publicDir = resolve(root, "public");
if (existsSync(publicDir)) {
  cpSync(publicDir, resolve(root, ".next", "standalone", "public"), { recursive: true });
}
