import fs from "fs"
import path from "path"
// const 
const UPLOAD_ROOT = path.join(process.cwd(), "ups")
console.log(fs.mkdirSync(UPLOAD_ROOT, {recursive: true})
)
// type FileCategory = "images" | "videos" | "pdf" | "others"

function resolveCategory(mimetype) {
  if (mimetype.startsWith("image/")) return "images";
  if (mimetype.startsWith("video/")) return "videos";
  if (mimetype === "application/pdf") return "pdf";
  return "others";
}


fs.mkdirSync(path.join(UPLOAD_ROOT,resolveCategory("image/png")), {recursive: true})
fs.mkdirSync(path.join(UPLOAD_ROOT,resolveCategory("application/pdf")), {recursive: true})
fs.mkdirSync(path.join(UPLOAD_ROOT,resolveCategory("video/mp4")), {recursive: true})
