/**
 * type projet
 */

export interface Projet {
    id?: number, //identifient du projet
    title: string, // le titre du projet
    slug: string, // url du projet
    description?: string,// description courte
    content?: string,// description complete
    status: string,// le status du projet
    github_url?: string,// Lien GitHub
    demo_url?: string,// Lien vers une démo 
    cover_image?: string,// Image principale
    created_at?: string,// Date de création
    updated_at?: string// Dernière modification
}


export interface Categories {
    id?: number,
    name: string,
    icon?: string
}

export interface Technologies {
    id?: number
    name: string,
    logo?: string,
    color?: string
}

export interface Files {
    id?: number,
    project_id: number,
    filename: string,
    path: string,
    type: "image" | "pdf" | "video",
    size: number,
    created_at?: string
}

//definition des contrats de reponse

export interface APIReponse<T>{
    succes: boolean, //true == succes , false == echec
    data?: T,// reprense la donnees present uniquement en cas de succes
    error_message?: T,// reprense la donnees present uniquement en cas de d'erreur
}