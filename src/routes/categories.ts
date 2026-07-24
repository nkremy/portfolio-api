import z from "zod";
import db from "../db/database";
import { Router } from "express";
import { APIReponse, Categories } from "../type";

//definition du schema de validation des donnees

const categories_schema = z.object({
    name: z.string().min(4),
    icon: z.string().optional()
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

const categories_router = Router();

categories_router.post("/",validate_categories(categories_schema),(req,res)=>{

    //extraire les informations du corps de la requete http 
    const {name, icon} = req.body as Categories

    //sauvegarde de donne en base de donnees
    const result = db.prepare(`INSERT INTO categories (
            name,
            icon
        ) VALUES (
            ?, ?
        );`).run(name, icon)
    
    //recuparation de l'id de la categories qui vien d'etre creer
    const id_categories = result.lastInsertRowid;

    //selection de la categorie depuis la base de donnees
    const new_categories = db.prepare('select * from categories where id = ?').get(id_categories) as Categories

    res.status(201).json({
            succes:true,
            data: new_categories
        } as APIReponse<Categories>)
})

categories_router.put("/:id",validate_categories(categories_schema),(req,res)=>{
    
    //recupere l'id des params de la requete http
    const id = req.params.id

    //recherche la categories en base de donnees
    const categories = db.prepare('select * from categories where id = ?').get(id) as Categories | undefined

    //verifier si la categories est trouver
    if(!categories){
        return res.status(400).json({
            succes: false,
            error_message: 'Pas de categorie avec l\'id '+id
        } as APIReponse<string>)
    }


    //extraire les informations du corps de la requete http 
    const {name, icon} = req.body as Categories

    //sauvegarde de donne en base de donnees
    const result = db.prepare(`UPDATE categories
        SET
            name = ?,
            icon = ?
        WHERE id = ?;`).run(name, icon, id)


    //selection de la categorie depuis la base de donnees
    const updated_categories = db.prepare('select * from categories where id = ?').get(id) as Categories

    res.status(201).json({
            succes:true,
            data: updated_categories
        } as APIReponse<Categories>)
})

categories_router.get("/",(req,res)=>{
    //recuperer tout les categorie qui ce trouve en base de donnees
    const categories = db.prepare('select * from categories').all() 

    res.status(200).json({
            succes:true,
            data: categories
        } as APIReponse<Categories[]>)
})

categories_router.get("/:id",(req,res)=>{
    //recupere l'id des params de la requete http
    const id = req.params.id
    console.log({id})
    //recuperer tout les categorie qui ce trouve en base de donnees
    const categories = db.prepare('select * from categories where id = ?').get(id) as Categories | undefined

    //verifier si la categories est trouver
    if(!categories){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de categorie avec l\'id '+id
        } as APIReponse<string>)
    }

    res.status(200).json({
            succes:true,
            data: categories
        } as APIReponse<Categories>)
})

categories_router.delete("/:id",(req,res)=>{
    //recupere l'id des params de la requete http
    const id = req.params.id
    //recuperer tout les categorie qui ce trouve en base de donnees
    const categories = db.prepare('select * from categories where id = ?').get(id) as Categories | undefined

    //verifier si la categories est trouver
    if(!categories){
        return res.status(404).json({
            succes: false,
            error_message: 'Pas de categorie avec l\'id '+id
        } as APIReponse<string>)
    }


    //supprimer la categorie 
    db.prepare("delete from categories where id = ? ").run(id)

    res.status(200).json({
            succes:true,
        } as APIReponse<string>)
})

export default categories_router