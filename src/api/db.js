import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function openDb() {
    const db = await open({
        filename: './projects.sqlite',
        driver: sqlite3.Database,
    });

    // Crear tablas si no existen
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            coordinator_id INTEGER NOT NULL,
            FOREIGN KEY (coordinator_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS project_developers (
            project_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            PRIMARY KEY (project_id, user_id),
            FOREIGN KEY (project_id) REFERENCES projects(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS checklist_aspects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS checklist_points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            aspect_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            FOREIGN KEY (aspect_id) REFERENCES checklist_aspects(id)
        );

        CREATE TABLE IF NOT EXISTS project_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            applied_at DATE NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        );

        CREATE TABLE IF NOT EXISTS review_point_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            review_id INTEGER NOT NULL,
            point_id INTEGER NOT NULL,
            status TEXT NOT NULL CHECK (status IN ('bien', 'regular', 'deficiente', '')),
            observation TEXT,
            FOREIGN KEY (review_id) REFERENCES project_reviews(id),
            FOREIGN KEY (point_id) REFERENCES checklist_points(id)
        );

        CREATE TABLE IF NOT EXISTS project_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            detail TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id)
        );

    `);

    // Insertar aspectos y puntos solo si no existen
    const existing = await db.get(`SELECT COUNT(*) as count FROM checklist_aspects`);
    if (existing.count === 0) {
        const aspects = [
            {
                name: 'Arquitectura', points: [
                    'Arquitectura referencial',
                    'Division de responsabilidades',
                    'Patrones de diseño',
                    'Escalabilidad',
                ]
            },
            {
                name: 'Código', points: [
                    'Variables autodescriptivas (camelCase)',
                    'Identación 4 espacios',
                    'Maximo lineas por código (120)',
                    'Declaraciones (visibilidad, tipo retorno, tipado de parametros)',
                    'Control excepciones',
                    'Comentarios mínimos (PSR-5 )',
                ]
            },
            {
                name: 'Seguridad', points: [
                    'Valida autenticación',
                    'Valida token jwt',
                    'Se utilizan librerias externas',
                ]
            }
        ];

        for (const aspect of aspects) {
            const result = await db.run(`INSERT INTO checklist_aspects (name) VALUES (?)`, [aspect.name]);
            const aspectId = result.lastID;

            for (const point of aspect.points) {
                await db.run(
                    `INSERT INTO checklist_points (aspect_id, name) VALUES (?, ?)`,
                    [aspectId, point]
                );
            }
        }
    }

    return db;
}