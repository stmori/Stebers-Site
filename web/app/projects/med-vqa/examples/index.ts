// Example images for the empty chat. They live in this folder (not public/), so they're imported here
// and Next.js bundles them; `src` is the URL to use in <img> and fetch().
import type { StaticImageData } from "next/image";
import type { Example } from "../lib/types";
import data from "./examples.json";
import openi_cxr_00 from "./openi_cxr_00.jpg";
import openi_cxr_02 from "./openi_cxr_02.jpg";
import openi_cxr_06 from "./openi_cxr_06.jpg";
import vqarad_09 from "./vqarad_09.jpg";

const images: Record<string, StaticImageData> = {
  "openi_cxr_00.jpg": openi_cxr_00,
  "openi_cxr_02.jpg": openi_cxr_02,
  "openi_cxr_06.jpg": openi_cxr_06,
  "vqarad_09.jpg": vqarad_09,
};

export const EXAMPLES: Example[] = data
  .filter((e) => images[e.file])
  .map((e) => ({ ...e, src: images[e.file].src }));
