import express from 'express';
import multer from 'multer';
import { openDb } from '../db.js';
import { validateActiveProject } from '../middleware/projects.middleware.js';
import { withTransaction } from '../lib/withTransaction.js';

const router = express.Router();

// Configuración de multer para memoria en lugar de disco
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // límite de 10MB por archivo
    }
});

// POST /projects/:id/files - Subir archivos
router.post('/projects/:id/files', validateActiveProject, upload.array('files[]'), async (req, res) => {
    const projectId = req.params.id;
    const files = req.files;

    if (!files?.length) {
        return res.status(400).json({ error: 'No se recibieron archivos' });
    }

    try {
        const db = await openDb();
        await withTransaction(db, async () => {
            for (const file of files) {
                await db.run(
                    'INSERT INTO project_files (project_id, filename, file_data, mime_type, file_size) VALUES (?, ?, ?, ?, ?)',
                    [projectId, file.originalname, file.buffer, file.mimetype, file.size]
                );
            }
        });
        res.status(201).json({ message: 'Archivos subidos correctamente' });
    } catch {
        res.status(500).json({ error: 'Error al guardar los archivos' });
    }
});

// GET /projects/:id/files - Listar archivos
router.get('/projects/:id/files', async (req, res) => {
    const projectId = req.params.id;

    try {
        const db = await openDb();
        const files = await db.all(
            'SELECT id, filename, mime_type, file_size, created_at FROM project_files WHERE project_id = ? ORDER BY created_at DESC',
            [projectId]
        );
        res.json(files);
    } catch {
        res.status(500).json({ error: 'Error al obtener los archivos' });
    }
});

// GET /projects/:id/files/:fileId/download - Descargar archivo
router.get('/projects/:id/files/:fileId/download', async (req, res) => {
    const { id: projectId, fileId } = req.params;

    try {
        const db = await openDb();
        const file = await db.get(
            'SELECT filename, file_data, mime_type FROM project_files WHERE id = ? AND project_id = ?',
            [fileId, projectId]
        );

        if (!file) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }

        res.attachment(file.filename); // Content-Disposition codificado de forma segura
        res.setHeader('Content-Type', file.mime_type);
        res.send(file.file_data);
    } catch {
        res.status(500).json({ error: 'Error al descargar el archivo' });
    }
});

// GET /projects/:id/files/:fileId/preview - Previsualizar imagen
router.get('/projects/:id/files/:fileId/preview', async (req, res) => {
    const { id: projectId, fileId } = req.params;

    try {
        const db = await openDb();
        const file = await db.get(
            "SELECT filename, file_data, mime_type FROM project_files WHERE id = ? AND project_id = ? AND mime_type LIKE 'image/%'",
            [fileId, projectId]
        );

        if (!file) {
            return res.status(404).json({ error: 'Imagen no encontrada' });
        }

        res.setHeader('Content-Type', file.mime_type);
        res.send(file.file_data);
    } catch {
        res.status(500).json({ error: 'Error al obtener la preview' });
    }
});

// DELETE /projects/:id/files/:fileId - Eliminar archivo
router.delete('/projects/:id/files/:fileId', validateActiveProject, async (req, res) => {
    const { id: projectId, fileId } = req.params;

    try {
        const db = await openDb();
        await db.run(
            'DELETE FROM project_files WHERE id = ? AND project_id = ?',
            [fileId, projectId]
        );
        res.json({ message: 'Archivo eliminado correctamente' });
    } catch {
        res.status(500).json({ error: 'Error al eliminar el archivo' });
    }
});

export default router;
