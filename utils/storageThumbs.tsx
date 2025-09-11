import { getDownloadURL, ref } from "firebase/storage";
import { FIREBASE_STORE } from "~/firebase";

const TITLE_TO_FILENAME: Array<{ keywords: string[]; filename: string }> = [
  { keywords: ["rest"], filename: "restday.jpg" },
  { keywords: ["push", "upper", "chest", "shoulder", "arms", "back"], filename: "upper.jpg" },
  { keywords: ["leg", "lower", "glute", "quad", "hamstring"], filename: "lower.jpg" },
  { keywords: ["core", "abs"], filename: "core.jpg" },
  { keywords: ["full body", "total body"], filename: "fullbody.jpg" },
];

const DEFAULT_FILENAME = "default.jpg";

const urlCache = new Map<string, Promise<string>>();

function pickFilenameForTitle(title?: string): string {
  const t = (title || "").toLowerCase();
  for (const { keywords, filename } of TITLE_TO_FILENAME) {
    if (keywords.some(k => t.includes(k))) return filename;
  }
  return DEFAULT_FILENAME;
}

export function fetchThumbUrlForTitle(title?: string): Promise<string> {
  const filename = pickFilenameForTitle(title);
  const storagePath = `Exercisemedia/RoutineThumbnail/${filename}`;

  if (!urlCache.has(storagePath)) {
    const p = getDownloadURL(ref(FIREBASE_STORE, storagePath));
    urlCache.set(storagePath, p);
  }
  return urlCache.get(storagePath)!;
}
