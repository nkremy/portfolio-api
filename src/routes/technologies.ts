import { Router } from "express";
import { APIReponse, Technologies } from "../type";
import z from "zod";
import db from "../db/database";

const schema_technologies = z.object({
    name: z.string().min(3),
    logo: z.string().optional(),
    color: z.string().optional()

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

const technologies_router = Router()

technologies_router.post("/",validate(schema_technologies),(req,res)=>{
    //extraction des information du body de la requete
    const {name, logo, color}  = req.body as Technologies


    //sauvegarde des informations du projet en base de donnees
    const insert = db.prepare(`INSERT INTO technologies (
            name,
            logo,
            color
        ) VALUES (
            ?, ?, ?
        )
    `)

    const result = insert.run(name, logo, color);
    const idElement = result.lastInsertRowid as number

    //selection du nouveau projet en base de donnees
    const new_technologies = db.prepare(`SELECT * FROM technologies WHERE id = ?`).get(idElement) as Technologies

    res.status(201).json({
        succes:true,
        data: new_technologies
    } as APIReponse<Technologies>)
})

technologies_router.put("/:id",validate(schema_technologies),(req,res)=>{
    
    //recupere l'id des params de la requete http
    const id = req.params.id

    //rechercher la technologies qui ce trouve en base de donnees
    const technologies = db.prepare('select * from technologies where id = ?').get(id) as Technologies | undefined

    //verifier si la technologies est trouver
    if(!technologies){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de technologies avec l\'id = '+id
        } as APIReponse<string>)
    }

     //extraction des information du body de la requete
    const {name, logo, color}  = req.body as Technologies


    //sauvegarde des informations du projet en base de donnees
    const updated = db.prepare(`UPDATE technologies
        SET
            name = ?,
            logo = ?,
            color = ?
        WHERE id = ?;
    `).run(name, logo, color, id)


    //selection du nouveau projet en base de donnees
    const new_technologies = db.prepare(`SELECT * FROM technologies WHERE id = ?`).get(id) as Technologies

    res.status(201).json({
        succes:true,
        data: new_technologies
    } as APIReponse<Technologies>)
})


technologies_router.get("/",(req,res)=>{

    const technologies = db.prepare('select * from technologies').all() as Technologies[]

    res.status(200).json({
            succes:true,
            data: technologies
        } as APIReponse<Technologies[]>)
})

technologies_router.get("/:id",(req,res)=>{

    //recupere l'id des params de la requete http
    const id = req.params.id

    //rechercher la technologies qui ce trouve en base de donnees
    const technologies = db.prepare('select * from technologies where id = ?').get(id) as Technologies | undefined

    //verifier si la technologies est trouver
    if(!technologies){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de technologies avec l\'id = '+id
        } as APIReponse<string>)
    }

    res.status(200).json({
            succes:true,
            data: technologies
        } as APIReponse<Technologies>)
})

technologies_router.delete("/:id",(req,res)=>{

    //recupere l'id des params de la requete http
    const id = req.params.id

    //rechercher la technologies qui ce trouve en base de donnees
    const technologies = db.prepare('select * from technologies where id = ?').get(id) as Technologies | undefined

    //verifier si la technologies est trouver
    if(!technologies){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de technologies avec l\'id = '+id
        } as APIReponse<string>)
    }


    //supprimer la categorie 
    db.prepare("delete from technologies where id = ? ").run(id)

    res.status(200).json({
            succes:true,
        } as APIReponse<string>)
})

export default technologies_router
