import { readFile, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
const root = fileURLToPath(new URL("..", import.meta.url));
const stateFile = root + "/.local-server.json";
const cmd = process.env.ComSpec || "cmd.exe";
function open(url) {
  spawn(cmd, ["/d", "/s", "/c", `start "" ${url}`], {
    stdio: "ignore",
    windowsHide: true,
    windowsVerbatimArguments: true,
  });
}
async function alive(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/local-info`, {
      signal: AbortSignal.timeout(1800),
    });
    return (await response.json()).app === "alfa-credit-cabinet";
  } catch {
    return false;
  }
}
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 20 || (major === 20 && minor < 9)) {
  console.error(
    "Нужен Node.js 20.9 или новее. Рекомендуется установленный у тебя Node.js 22.",
  );
  process.exit(1);
}
try {
  const previous = JSON.parse(await readFile(stateFile, "utf8"));
  if (Number.isInteger(previous.port) && (await alive(previous.port))) {
    open(`http://127.0.0.1:${previous.port}`);
    console.log("Уже запущено. Открыл вкладку браузера.");
    process.exit(0);
  }
} catch {}
const port = await new Promise((resolve, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const chosen = server.address().port;
    server.close(() => resolve(chosen));
  });
});
const url = `http://127.0.0.1:${port}`;
console.log(`Запускаем кабинет: ${url}`);
console.log("Это окно оставь открытым. Для остановки нажми Ctrl+C.");
const child = spawn(
  cmd,
  ["/d", "/s", "/c", `npm.cmd run dev -- --port ${port}`],
  { cwd: root, stdio: "inherit", windowsHide: false, windowsVerbatimArguments: true },
);
await writeFile(stateFile, JSON.stringify({ port, pid: child.pid }));
let running = true;
child.once("error", (error) => {
  console.error(error.message);
  running = false;
  process.exitCode = 1;
});
child.once("exit", async (code) => {
  running = false;
  try {
    await unlink(stateFile);
  } catch {}
  process.exitCode = code || 0;
});
for (let i = 0; i < 90 && running; i++) {
  if (await alive(port)) {
    open(url);
    console.log(`Готово: ${url}`);
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
