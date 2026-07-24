
import z from "zod";
import db from "../db/database";
import { Router } from "express";
import { APIReponse, Files } from "../type";

//definition du schema de validation des donnees

const file_schema = z.object({
    project_id: z.number(),
    filename: z.string(),
    path: z.string(),
    type: z.enum(["image", "pdf", "video"]),
    size: z.number()
})

function validate(schema){
    return (req,res,next)=>{
        const result = schema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({
                succes: false,
                error_message: result.error.issues.map(item=>({field:item.path[0],message:item.message}))
            } as APIReponse<{field:string,message:string}[]>)
        }
        req.body = result.data;
        next()
    }
}

const files_router = Router();

files_router.post("/",validate(file_schema),(req,res)=>{
    //extraitre les informations du corps de la requete http
    const {project_id, filename, path, type, size} = req.body as Files

    //verifier si le projet  existe
    const projet = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id) 

    if(!projet){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de projet avec l\'id '+project_id
        } as APIReponse<string>)
    }


    //le fichier en base de donnees
    const insert = db.prepare(`INSERT INTO files (
            project_id,
            filename,
            path,
            type,
            size
        ) VALUES (
            ?, ?, ?, ?, ?
        );`).run(project_id, filename, path, type, size)

    const id_insert = insert.lastInsertRowid

    const new_file = db.prepare('select * from files where id = ?').get(id_insert) as Files




        res.status(201).json({
            succes: true,
            data: new_file
        } as APIReponse<Files>)
})


files_router.delete("/:id",(req,res)=>{

    //recuperer l'id du fichier dans les params de la requete
    const id = req.params.id

    //verifier si le fichier  existe
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id) as Files | undefined

    if(!file){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de file avec l\'id '+id
        } as APIReponse<string>)
    }


    //supprimer le fichier en base de donnees
    db.prepare(`delete from files where id = ?`).run(id)

        res.status(201).json({
            succes: true,
        } as APIReponse<undefined>)
})

export default files_router;