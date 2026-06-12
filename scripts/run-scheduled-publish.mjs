import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const rootDir = process.cwd();
const queueDir = path.join(rootDir, "content", "queue");
const logPath = path.join(rootDir, "publish-log.json");
const entries = (await fs.readdir(queueDir)).filter(
  (name) => name.endsWith(".json") && !name.endsWith(".done.json") && !name.endsWith(".error.json")
);

if (entries.length === 0) {
  console.log("No queued posts.");
  process.exit(0);
}

const cadenceDays = Number(process.env.PUBLISH_CADENCE_DAYS || 3);
const publishLog = await readPublishLog(logPath);
if (publishLog.lastPublishedAt) {
  const diffDays = (Date.now() - new Date(publishLog.lastPublishedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < cadenceDays) {
    console.log(`Cadence hold. ${diffDays.toFixed(2)} days since last publish.`);
    process.exit(0);
  }
}

entries.sort();
const nextFile = path.join("content", "queue", entries[0]);

try {
  const publish = await execFileAsync("node", ["scripts/publish-static-post.mjs", nextFile], {
    cwd: rootDir
  });
  const result = publish.stdout.trim();

  await fs.writeFile(
    logPath,
    JSON.stringify({ lastPublishedAt: new Date().toISOString(), lastQueueFile: entries[0] }, null, 2),
    "utf8"
  );

  await execFileAsync("git", ["add", "."], { cwd: rootDir });
  await execFileAsync("git", ["commit", "-m", `Publish ${entries[0].replace(/\.json$/, "")}`], { cwd: rootDir });
  await execFileAsync("git", ["push", "origin", "main"], { cwd: rootDir });

  const notifyPayload = result || "Shootsense 발행 완료";
  await execFileAsync("node", ["scripts/notify-telegram.mjs", notifyPayload], {
    cwd: rootDir,
    env: process.env
  });

  console.log(result);
} catch (error) {
  if (error.stdout) {
    console.error(error.stdout);
  }
  if (error.stderr) {
    console.error(error.stderr);
  }
  process.exit(1);
}

async function readPublishLog(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return {};
  }
}
