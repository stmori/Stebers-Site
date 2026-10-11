// Copies every project's images from ../projects/<person>/<folder>/media/ to public/media/<person>/<folder>/media/
// so the static export serves them at /media/... Runs before `next dev` and `next build` (see package.json).
// The copy is gitignored; projects/ is the source.
import fs from "node:fs";
import path from "node:path";

const src = process.env.PROJECTS_DIR || path.resolve(process.cwd(), "..", "projects");
const dest = path.resolve(process.cwd(), "public", "media");
fs.rmSync(dest, { recursive: true, force: true });
if (!fs.existsSync(src)) {
  console.warn(`copy-project-media: ${src} not found, skipping`);
  process.exit(0);
}
const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory();
let n = 0;
for (const person of fs.readdirSync(src)) {
  if (!isDir(path.join(src, person))) continue;
  for (const folder of fs.readdirSync(path.join(src, person))) {
    const media = path.join(src, person, folder, "media");
    if (!isDir(media)) continue;
    for (const file of fs.readdirSync(media)) {
      if (file.startsWith(".")) continue;
      const out = path.join(dest, person, folder, "media");
      fs.mkdirSync(out, { recursive: true });
      fs.copyFileSync(path.join(media, file), path.join(out, file));
      n++;
    }
  }
}
console.log(`copy-project-media: ${n} files -> public/media/`);
