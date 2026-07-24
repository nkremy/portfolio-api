
import z from "zod";
import db from "../db/database";
import { Router } from "express";
import { APIReponse } from "../type";

//definition du schema de validation des donnees

const project_technologies_schema = z.object({
    project_id: z.number(),
    technology_id: z.number()
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

const project_technologies_router = Router();

project_technologies_router.post("/",validate(project_technologies_schema),(req,res)=>{
    //extraitre les informations du corps de la requete http
    const {project_id,technology_id: technologie_id} = req.body as {project_id: number, technology_id: number}

    //verifier si le projet et la categorie exister
    const projet = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id) 

    //verifier si le projet existe
    if(!projet){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de projet avec l\'id '+project_id
        } as APIReponse<string>)
    }

    const technologies = db.prepare('select * from technologies where id = ?').get(technologie_id)

    //verifier si la categories est trouver
    if(!technologies){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de categorie avec l\'id '+technologie_id
        } as APIReponse<string>)
    }

    //sauvegarde des donnees en base de donnees
    db.prepare(`INSERT INTO project_technologies (
            project_id,
            technology_id
        ) VALUES (
            ?, ?
        );`).run(project_id, technologie_id)


        res.status(201).json({
            succes: true,
        } as APIReponse<undefined>)
})

project_technologies_router.delete("/",validate(project_technologies_schema),(req,res)=>{
   //extraitre les informations du corps de la requete http
    const {project_id, technology_id: technologie_id} = req.body as {project_id: number, technology_id: number}

    //verifier si le projet et la categorie exister
    const projet = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id) 

    //verifier si le projet existe
    if(!projet){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de projet avec l\'id '+project_id
        } as APIReponse<string>)
    }

    const technologies = db.prepare('select * from technologies where id = ?').get(technologie_id)

    //verifier si la categories est trouver
    if(!technologies){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de categorie avec l\'id '+technologie_id
        } as APIReponse<string>)
    }

    //sauvegarde des donnees en base de donnees
    db.prepare(`delete from project_technologies where
            project_id = ? 
            and technology_id = ?`).run(project_id, technologie_id)


        res.status(201).json({
            succes: true,
        } as APIReponse<undefined>)
})

export default project_technologies_router