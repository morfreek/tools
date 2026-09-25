import express from 'express';
import cors from 'cors';

import users from './routes/users.routes.js';
import projects from './routes/projects.routes.js';
import reviewsRouter from './routes/reviews.routes.js';
import notesRouter from './routes/notes.routes.js';
import filesRouter from './routes/files.routes.js';
import continuousDeployment from './routes/continuousDeployment.routes.js';
import checklist from './routes/checklist.routes.js';
import auth from './routes/auth.routes.js';
import accounts from './routes/accounts.routes.js';
import { authenticate } from './middleware/auth.middleware.js';
import { requireProjectAccess } from './middleware/projects.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

export const API_PREFIX = '/tools/api';

const app = express();

// Detrás de Apache: req.secure y req.ip salen de X-Forwarded-* (cookie Secure en HTTPS)
app.set('trust proxy', 'loopback');

// En producción el frontend y la API comparten origen (proxy de Apache) y CORS no aplica.
// CORS_ORIGIN (lista separada por comas) habilita orígenes de desarrollo, con cookies.
const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

// Login, logout y la cuenta actual; el resto de la API exige sesión
app.use(API_PREFIX, auth);
app.use(API_PREFIX, authenticate);
// Todo lo que cuelga de un proyecto exige que pertenezca a la cuenta de la sesión
app.use(`${API_PREFIX}/projects/:id`, requireProjectAccess);

app.use(API_PREFIX, accounts);
app.use(API_PREFIX, users);
app.use(API_PREFIX, projects);
app.use(API_PREFIX, reviewsRouter);
app.use(API_PREFIX, notesRouter);
app.use(API_PREFIX, filesRouter);
app.use(API_PREFIX, continuousDeployment);
app.use(API_PREFIX, checklist);

app.use(API_PREFIX, (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use(errorHandler);

// Solo iniciar el servidor si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
    const port = Number(process.env.PORT) || 3001;
    app.listen(port, '0.0.0.0', () => {
        console.log(`API escuchando en http://localhost:${port}${API_PREFIX}`);
    });
}

export default app;
