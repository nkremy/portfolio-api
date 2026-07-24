
import z from "zod";
import db from "../db/database";
import { Router } from "express";
import { APIReponse } from "../type";

//definition du schema de validation des donnees

const project_categories_schema = z.object({
    project_id: z.number(),
    category_id: z.number()
})

function validate_categories(schema){
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

const project_categories_router = Router();

project_categories_router.post("/",validate_categories(project_categories_schema),(req,res)=>{
    //extraitre les informations du corps de la requete http
    const {project_id, category_id} = req.body as {project_id: number, category_id: number}

    //verifier si le projet et la categorie exister
    const projet = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id) 

    //verifier si le projet existe
    if(!projet){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de projet avec l\'id '+project_id
        } as APIReponse<string>)
    }

    const categories = db.prepare('select * from categories where id = ?').get(category_id)

    //verifier si la categories est trouver
    if(!categories){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de categorie avec l\'id '+category_id
        } as APIReponse<string>)
    }

    //sauvegarde des donnees en base de donnees
    db.prepare(`INSERT INTO project_categories (
            project_id,
            category_id
        ) VALUES (
            ?, ?
        );`).run(project_id, category_id)


        res.status(201).json({
            succes: true,
        } as APIReponse<undefined>)
})

project_categories_router.delete("/",validate_categories(project_categories_schema),(req,res)=>{
    //extraitre les informations du corps de la requete http
    const {project_id, category_id} = req.body as {project_id: number, category_id: number}

    //verifier si le projet et la categorie exister
    const projet = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id) 

    //verifier si le projet existe
    if(!projet){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de projet avec l\'id '+project_id
        } as APIReponse<string>)
    }

    const categories = db.prepare('select * from categories where id = ?').get(category_id)

    //verifier si la categories est trouver
    if(!categories){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de categorie avec l\'id '+category_id
        } as APIReponse<string>)
    }

    //sauvegarde des donnees en base de donnees
    db.prepare(`delete from project_categories where project_id = ? and category_id = ?`).run(project_id, category_id)


        res.status(200).json({
            succes: true,
        } as APIReponse<undefined>)
})

export default project_categories_router