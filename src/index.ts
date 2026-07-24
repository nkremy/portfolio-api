import express from "express"
import "dotenv/config"
import "./db/database"
import projects_router from "./routes/projet";
import categories_router from "./routes/categories";
import { APIReponse } from "./type";
import project_categories_router from "./routes/project_categories";
import technologies_router from "./routes/technologies";
import project_technologies_router from "./routes/project_technologies";
import files_router from "./routes/files";
import route_upload from "./routes/upload";
const app = express();

app.use(express.json())

app.use("/projects",projects_router)
app.use("/categories",categories_router)
app.use("/project_categories",project_categories_router)
app.use('/technologies',technologies_router)
app.use('/project_technologies',project_technologies_router)
app.use("/files",files_router)
app.use("/uploads",route_upload)


app.use((error,req,res,next)=>{
  if(error){
    res.status(500).json({
      succes: false,
      error_message: `${error.name}: ${error.message}`
    } as APIReponse<string>)
  }
})

const PORT = process.env.PORT ? process.env.PORT : 3001
app.listen(PORT,()=>{
  console.log(`serveur demarer : http://localhost:${PORT}`)
})