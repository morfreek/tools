import express from 'express';
import multer from 'multer';
import { openDb } from '../db.js';
import { validateActiveProject } from '../middleware/projects.middleware.js';

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
        // console.error('Error al guardar archivos:', err);
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
        // console.error('Error al obtener archivos:', err);
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
        // console.error('Error al descargar archivo:', err);
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
        // console.error('Error al obtener preview:', err);
        res.status(500).json({ error: 'Error al obtener la preview', err });
    }
});

// DELETE /projects/:id/files/:fileId - Eliminar archivo
router.delete('/projects/:id/files/:fileId', validateActiveProject, async (req, res) => {
    const db = await openDb();
    const { id: projectId, fileId } = req.params;

    try {
        await db.run(
            'DELETE FROM project_files WHERE id = ? AND project_id = ?',
            [fileId, projectId]
        );
        res.json({ message: 'Archivo eliminado correctamente' });
    } catch (err) {
        // console.error('Error al eliminar archivo:', err);
        res.status(500).json({ error: 'Error al eliminar el archivo', err });
    }
});

export default router;
