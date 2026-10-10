// Copies the images in jake_projects/<folder>/media/ to public/jake/<folder>/media/ so the static export serves them.
// Runs before `next dev` and `next build` (see package.json). The copy is gitignored; jake_projects/ is the source.
import fs from "node:fs";
import path from "node:path";

const src = process.env.JAKE_PROJECTS_DIR || path.resolve(process.cwd(), "..", "jake_projects");
const dest = path.resolve(process.cwd(), "public", "jake");
fs.rmSync(dest, { recursive: true, force: true });
if (!fs.existsSync(src)) {
  console.warn(`copy-jake-media: ${src} not found, skipping`);
  process.exit(0);
}
let n = 0;
for (const folder of fs.readdirSync(src)) {
  const media = path.join(src, folder, "media");
  if (!fs.existsSync(media) || !fs.statSync(media).isDirectory()) continue;
  for (const file of fs.readdirSync(media)) {
    if (file.startsWith(".")) continue;
    fs.mkdirSync(path.join(dest, folder, "media"), { recursive: true });
    fs.copyFileSync(path.join(media, file), path.join(dest, folder, "media", file));
    n++;
  }
}
console.log(`copy-jake-media: ${n} files -> public/jake/`);
