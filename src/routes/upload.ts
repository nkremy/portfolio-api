import path from "node:path"
import fs from "fs"
import multer , { StorageEngine } from "multer"
import { Router } from "express";
import { APIReponse } from "../type";

console.log(process.cwd())

//creer le repertoire de stockage de fichier si elle n'existe pas encore
const UPLOAD_DIR = path.join(process.cwd(),"uploads");
fs.mkdirSync(UPLOAD_DIR,{recursive: true})

function getCategorieFile(mimeType: string): "images" | "videos" | "pdf" | "others"
{
    if(mimeType.startsWith("image/")) return "images"
    if(mimeType.startsWith("video/")) return "videos"
    if(mimeType === "application/pdf") return "pdf"
    return "others"
}




function getDirectParentOfFile(mimeType: string): string{
    const categorieFile = getCategorieFile(mimeType)
    
    console.log('ici dans [categorieFile] : '+ categorieFile)
    fs.mkdirSync(path.join(UPLOAD_DIR,categorieFile), {recursive:true}) as string
    return path.join(UPLOAD_DIR,categorieFile)
}

//creation du middleware qui vas automiquement recevoir le fichier et le sauvegarde au bon emplacement
const storage = multer.diskStorage({
    destination: (req,file,cd) => {
        console.log(`ici dans [destination] file.mimeType = ${file.mimetype}`)
        const chemin = getDirectParentOfFile(file.mimetype)
        console.log(`ici dans [destination] : ${chemin}`)
        cd(null, chemin)
    },
    filename: (req, file, cd) => {
        //obtenir l'extension du fichier
        const ext = path.extname(file.originalname);

        //generation du nom unique du fichier
        const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`

        cd(null, uniqueName)
    }
})

const upload = multer({storage})

const route_upload = Router()

route_upload.post("/", upload.single('file'), (req, res)=>{
    const file = req.file;

    if (!file) {
        return res.status(400).json({ 
            succes: false,
            error_message: "Aucun fichier reçu",
        } as APIReponse<string>);
    }

    res.status(201).json({
        succes: true,
        data: {
            nomOriginal: file.originalname,
            nomStocke: file.filename,
            taille: file.size,          // en octets
            type: file.mimetype,
            extension: path.extname(file.originalname),
            cheminComplet: file.path,
        }
    })
})

export default route_upload