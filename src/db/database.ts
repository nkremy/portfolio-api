import Database from 'better-sqlite3'
import path from 'path'

// Le fichier auth.db sera créé à la racine du projet
const dbPath = path.join(process.cwd(), 'project_store.db')

const db = new Database(dbPath)

// Activation des foreign keys (désactivées par défaut dans SQLite)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Création des tables si elles n'existent pas encore
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      content TEXT,
      status TEXT NOT NULL DEFAULT 'En développement',
      github_url TEXT,
      demo_url TEXT,
      cover_image TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT
  );

   CREATE TABLE IF NOT EXISTS project_categories (
      project_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,

      PRIMARY KEY (project_id, category_id),

      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS technologies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      logo TEXT,
      color TEXT
  );

  CREATE TABLE IF NOT EXISTS project_technologies (
      project_id INTEGER NOT NULL,
      technology_id INTEGER NOT NULL,

      PRIMARY KEY (project_id, technology_id),

      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
      FOREIGN KEY (technology_id) REFERENCES technologies(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      path TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (project_id)
          REFERENCES projects(id)
          ON DELETE RESTRICT
  );
`)

console.log('Base de données SQLite initialisée')

export default db