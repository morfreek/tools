import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer';
import { openDb } from './db.js';

const app = express();
const port = 3001;

// Configurar middleware globalmente
app.use(cors());
app.use(bodyParser.json());

// Crear router para las APIs
const router = express.Router();

// GET /users - listar todos los usuarios
router.get('/users', async (req, res) => {
    const db = await openDb();
    const users = await db.all('SELECT id, name FROM users ORDER BY name');
    res.json(users);
});

// POST /users - crear usuario
router.post('/users', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const db = await openDb();
    const result = await db.run('INSERT INTO users (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.lastID, name });
});

router.get('/checklist', async (req, res) => {
    const db = await openDb();
    const aspects = await db.all(`SELECT * FROM checklist_aspects`);
    const checklist = [];

    for (const aspect of aspects) {
        const points = await db.all(`SELECT * FROM checklist_points WHERE aspect_id = ?`, [aspect.id]);
        checklist.push({ id: aspect.id, name: aspect.name, points });
    }

    res.json(checklist);
});

// GET /projects - listar proyectos con coordinador y desarrolladores
router.get('/projects', async (req, res) => {
    const db = await openDb();
    // Obtener proyectos con coordinador
    const projects = await db.all(`
        SELECT p.id, p.name, p.code, p.coordinator_id
        FROM projects p
        JOIN users u ON p.coordinator_id = u.id
        ORDER BY p.name
    `);

    // Para cada proyecto obtener desarrolladores
    for (const project of projects) {
        const devs = await db.all(`
            SELECT u.id, u.name
            FROM project_developers pd
            JOIN users u ON pd.user_id = u.id
            WHERE pd.project_id = ?
            `,
            [project.id]
        );
        project.developer_ids = devs.map(d => d.id);
        project.developer_names = devs.map(d => d.name);
    }

    res.json(projects);
});

// GET /projects/:id - Obtener detalle de un proyecto
router.get('/projects/:id', async (req, res) => {
    const db = await openDb();
    const projectId = parseInt(req.params.id, 10);
    const project = await db.get(`
        SELECT p.id, p.name, p.code, p.coordinator_id, null as developers
        FROM projects p
        WHERE p.id = ?`,
        [projectId]
    );

    if (!project) {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    project.developers = await db.all(`
        SELECT u.id, u.name
        FROM project_developers pd
        JOIN users u ON pd.user_id = u.id
        WHERE pd.project_id = ?
        `,
        [project.id]
    );

    res.json(project);
});

// POST /projects - crear proyecto
router.post('/projects', async (req, res) => {
    const { name, code, coordinator_id, developer_ids } = req.body;
    if (!name || !code || !coordinator_id || !Array.isArray(developer_ids)) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const db = await openDb();
    const result = await db.run(
        'INSERT INTO projects (name, code, coordinator_id) VALUES (?, ?, ?)',
        [name, code, coordinator_id]
    );
    const projectId = result.lastID;

    // Insertar desarrolladores
    for (const userId of developer_ids) {
        await db.run(
            'INSERT INTO project_developers (project_id, user_id) VALUES (?, ?)',
            [projectId, userId]
        );
    }

    res.status(201).json({ id: projectId, name, code, coordinator_id, developer_ids });
});

// PUT /projects/:id - actualizar proyecto
router.put('/projects/:id', async (req, res) => {
    const projectId = req.params.id;
    const { name, code, coordinator_id, developer_ids } = req.body;
    if (!name || !code || !coordinator_id || !Array.isArray(developer_ids)) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    const db = await openDb();

    // Actualizar datos proyecto
    await db.run(
        'UPDATE projects SET name = ?, code = ?, coordinator_id = ? WHERE id = ?',
        [name, code, coordinator_id, projectId]
    );

    // Borrar desarrolladores existentes
    await db.run('DELETE FROM project_developers WHERE project_id = ?', [projectId]);

    // Insertar nuevos desarrolladores
    for (const userId of developer_ids) {
        await db.run(
            'INSERT INTO project_developers (project_id, user_id) VALUES (?, ?)',
            [projectId, userId]
        );
    }

    res.json({ id: projectId, name, code, coordinator_id, developer_ids });
});

// DELETE /projects/:id - actualizar proyecto
router.delete('/projects/:id', async (req, res) => {
    const projectId = req.params.id;
    const db = await openDb();

    try {
        await db.exec('BEGIN');

        // Eliminar relaciones
        // Eliminar resultados de puntos por revisión
        await db.run(
            'DELETE FROM review_point_results WHERE review_id IN (SELECT id FROM project_reviews WHERE project_id = ?)',
            [projectId]
        );
        await db.run('DELETE FROM project_reviews WHERE project_id = ?', [projectId]);
        await db.run('DELETE FROM project_notes WHERE project_id = ?', [projectId]);
        await db.run('DELETE FROM project_developers WHERE project_id = ?', [projectId]);

        // Eliminar el proyecto
        const result = await db.run('DELETE FROM projects WHERE id = ?', [projectId]);

        await db.exec('COMMIT');
        res.json({ success: true, deleted: result.changes });
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Error al eliminar proyecto:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar el proyecto' });
    }

});

// GET /projects/:id/reviews - listado de reviews de un proyecto
router.get('/projects/:id/reviews', async (req, res) => {
    const db = await openDb();
    const reviews = await db.all(`
        SELECT *
        FROM project_reviews
        WHERE project_id = ?
        ORDER BY applied_at DESC
    `,
        [req.params.id]);

    for (const review of reviews) {
        const results = await db.all(`
                SELECT rpr.point_id, COALESCE(NULLIF(rpr.status, ''), 'No aplica') AS status, rpr.observation
                FROM review_point_results rpr
                WHERE rpr.review_id = ?
            `, [review.id]);

        review.results = results;
    }

    res.json(reviews);
});

// POST /projects/:id/reviews - crea review de un proyecto
router.post('/projects/:id/reviews', async (req, res) => {
    const db = await openDb();
    const { applied_at, results } = req.body;

    const result = await db.run(
        `INSERT INTO project_reviews (project_id, applied_at) VALUES (?, ?)`,
        [req.params.id, applied_at]
    );

    const reviewId = result.lastID;

    for (const r of results) {
        await db.run(
            `INSERT INTO review_point_results (review_id, point_id, status, observation)
                VALUES (?, ?, ?, ?)`,
            [reviewId, r.point_id, r.status, r.observation]
        );
    }

    res.status(201).json({ success: true });
});

// DELETE /projects/:id/reviews - elimina review de un proyecto
router.delete('/projects/:id/reviews', async (req, res) => {
    const db = await openDb();
    const projectId = req.params.id;
    const { reviewId } = req.body;
    try {
        await db.run('DELETE FROM project_reviews WHERE id = ? and project_id = ?', [reviewId, projectId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error eliminando nota', err });
    }
});

// Obtener notas de un proyecto
router.get('/projects/:id/notes', async (req, res) => {
    const db = await openDb();
    const projectId = req.params.id;
    try {
        const notes = await db.all('SELECT * FROM project_notes WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener notas' });
    }
});

// Crear una nueva nota
router.post('/projects/:id/notes', async (req, res) => {
    const db = await openDb();
    const projectId = req.params.id;
    const { detail, created_at } = req.body;

    if (!detail) {
        return res.status(400).json({ error: 'La nota es requerida' });
    }

    try {
        await db.run(
            'INSERT INTO project_notes (project_id, detail, created_at) VALUES (?, ?, ?)',
            [projectId, detail, created_at || new Date().toISOString()]
        );
        res.status(201).json({ message: 'Nota creada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al guardar la nota' });
    }
});

// Edita una nota
router.put('/projects/:id/notes', async (req, res) => {
    const db = await openDb();
    const projectId = req.params.id;
    const { noteId, detail } = req.body;
    try {
        await db.run(
            'UPDATE project_notes SET detail = ? WHERE id = ? and project_id = ?',
            [detail, noteId, projectId]
        );
        const notes = await db.all('SELECT * FROM project_notes WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error actualizando nota', err, id, noteId });
    }
});

// Elimina una nota
router.delete('/projects/:id/notes', async (req, res) => {
    const db = await openDb();
    const projectId = req.params.id;
    const { noteId } = req.body;
    try {
        await db.run('DELETE FROM project_notes WHERE id = ? and project_id = ?', [noteId, projectId]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error eliminando nota', err });
    }
});

// Configuración de multer para memoria en lugar de disco
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // límite de 10MB por archivo
    }
});

// POST /projects/:id/files - Subir archivos
router.post('/projects/:id/files', upload.array('files[]'), async (req, res) => {
    const db = await openDb();
    const projectId = req.params.id;
    const files = req.files;

    try {
        await db.exec('BEGIN TRANSACTION');

        for (const file of files) {
            await db.run(
                'INSERT INTO project_files (project_id, filename, file_data, mime_type, file_size) VALUES (?, ?, ?, ?, ?)',
                [
                    projectId,
                    file.originalname,
                    file.buffer,
                    file.mimetype,
                    file.size
                ]
            );
        }

        await db.exec('COMMIT');
        res.status(201).json({ message: 'Archivos subidos correctamente' });
    } catch (err) {
        await db.exec('ROLLBACK');
        console.error('Error al guardar archivos:', err);
        res.status(500).json({ error: 'Error al guardar los archivos', err });
    }
});

// GET /projects/:id/files - Listar archivos
router.get('/projects/:id/files', async (req, res) => {
    const db = await openDb();
    const projectId = req.params.id;
    try {
        const files = await db.all(
            'SELECT id, filename, mime_type, file_size, created_at FROM project_files WHERE project_id = ? ORDER BY created_at DESC',
            [projectId]
        );
        res.json(files);
    } catch (err) {
        console.error('Error al obtener archivos:', err);
        res.status(500).json({ error: 'Error al obtener los archivos', err });
    }
});

// GET /projects/:id/files/:fileId/download - Descargar archivo
router.get('/projects/:id/files/:fileId/download', async (req, res) => {
    const db = await openDb();
    const { id: projectId, fileId } = req.params;

    try {
        const file = await db.get(
            'SELECT filename, file_data, mime_type FROM project_files WHERE id = ? AND project_id = ?',
            [fileId, projectId]
        );

        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
        res.send(file.file_data);
    } catch (err) {
        console.error('Error al descargar archivo:', err);
        res.status(500).json({ error: 'Error al descargar el archivo', err });
    }
});

// GET /projects/:id/files/:fileId/preview - Previsualizar imagen
router.get('/projects/:id/files/:fileId/preview', async (req, res) => {
    const db = await openDb();
    const { id: projectId, fileId } = req.params;

    try {
        const file = await db.get(
            'SELECT filename, file_data, mime_type FROM project_files WHERE id = ? AND project_id = ? AND mime_type LIKE "image/%"',
            [fileId, projectId]
        );

        if (!file) {
            return res.status(404).json({ error: 'Imagen no encontrada' });
        }

        res.setHeader('Content-Type', file.mime_type);
        res.send(file.file_data);
    } catch (err) {
        console.error('Error al obtener preview:', err);
        res.status(500).json({ error: 'Error al obtener la preview', err });
    }
});

// DELETE /projects/:id/files/:fileId - Eliminar archivo
router.delete('/projects/:id/files/:fileId', async (req, res) => {
    const db = await openDb();
    const { id: projectId, fileId } = req.params;

    try {
        await db.run(
            'DELETE FROM project_files WHERE id = ? AND project_id = ?',
            [fileId, projectId]
        );
        res.json({ message: 'Archivo eliminado correctamente' });
    } catch (err) {
        console.error('Error al eliminar archivo:', err);
        res.status(500).json({ error: 'Error al eliminar el archivo', err });
    }
});

// Ruta de prueba para redirección
router.get('/test-redirect', (req, res) => {
    console.log('Headers recibidos:', req.headers);
    console.log('URL original:', req.originalUrl);
    res.redirect('/tools/api/test-destination');
});

router.get('/test-destination', (req, res) => {
    res.json({
        message: 'Redirección exitosa',
        originalUrl: req.originalUrl,
        headers: req.headers
    });
});

// Montar el router en el prefijo base
app.use('/tools/api', router);

app.listen(port, '0.0.0.0', () => {
    console.log(`API escuchando en http://localhost:${port}/tools/api`);
});
