import { Router } from "express";
import { APIReponse, Projet } from "../type";
import z from "zod";
import db from "../db/database";

const schema_user = z.object({
    title: z.string().min(3),
    slug: z.string(),
    description: z.string().optional(),
    content: z.string().optional(),
    status: z.string(),
    github_url: z.string().optional(),
    demo_url: z.string().optional(),
    cover_image: z.string().optional(),

})


function validate_user(schema){
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

const projects_router =  Router();

projects_router.post("/",validate_user(schema_user),(req,res)=>{
    //extraction des information du body de la requete
    const {title, slug, description, content, status, github_url, demo_url, cover_image}: Projet= req.body as Projet


    //sauvegarde des informations du projet en base de donnees
    const insertProjet = db.prepare(`INSERT INTO projects (
        title,
        slug,
        description,
        content,
        status,
        github_url,
        demo_url,
        cover_image
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?
        );
    `)

    const result = insertProjet.run(title, slug, description, content, status, github_url, demo_url, cover_image);
    const idProjet = result.lastInsertRowid as number

    //selection du nouveau projet en base de donnees
    const newProjet: Projet = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(idProjet) as Projet

    res.status(201).json({
        succes:true,
        data: newProjet
    } as APIReponse<Projet>)


})

projects_router.put("/:id",validate_user(schema_user),(req,res)=>{
    //recuperation de l'id du projet 
    const id = req.params.id

    //recherche le projet en base de donnees
    const projet = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Projet | undefined

    //verifier si le projet existe
    if(!projet){
        return res.status(400).json({
            succes: false,
            error_message: 'Pas de projet avec l\'id '+id
        } as APIReponse<string>)
    }

    //extraction des information du body de la requete
    const {title, slug, description, content, status, github_url, demo_url, cover_image}: Projet= req.body as Projet


    //mettre ajours les informations du projet en base de donnees
    const insertProjet = db.prepare(`UPDATE projects
        SET
            title = ?,
            slug = ?,
            description = ?,
            content = ?,
            status = ?,
            github_url = ?,
            demo_url = ?,
            cover_image = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;`
    )

    const result = insertProjet.run(title, slug, description, content, status, github_url, demo_url, cover_image,id);

    //selection du nouveau projet en base de donnees
    const updated_projet: Projet = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id) as Projet

    res.status(201).json({
        succes:true,
        data: updated_projet
    } as APIReponse<Projet>)


})

projects_router.get("/",(req,res)=>{
    //recuperation de tout les projets qui ce trouve en base 
    const projets: Projet[] = db.prepare('SELECT * FROM projects').all() as Projet[]

    res.status(201).json({
        succes:true,
        data: projets
    } as APIReponse<Projet[]>)
})

projects_router.get("/:id",(req,res)=>{
    
    const projet = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as Projet | undefined

    if(!projet){
        return res.status(400).json({
            succes: false,
            error_message: 'Pas de projet avec l\'id '+req.params.id
        } as APIReponse<string>)
    }

    res.status(201).json({
        succes:true,
        data: projet
    } as APIReponse<Projet>)
})

projects_router.delete("/:id",(req,res)=>{
    
    const projet = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as Projet | undefined

    if(!projet){
        return res.status(400).json({
            succes: false,
            error_message: 'Pas de projet avec l\'id '+req.params.id
        } as APIReponse<string>)
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)

    res.status(201).json({
        succes:true,
        data: "Project supprimer avec succes"
    } as APIReponse<string>)
})

export default projects_router;