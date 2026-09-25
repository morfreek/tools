import express from 'express';
import cors from 'cors';

import users from './routes/users.routes.js';
import projects from './routes/projects.routes.js';
import reviewsRouter from './routes/reviews.routes.js';
import notesRouter from './routes/notes.routes.js';
import filesRouter from './routes/files.routes.js';
import continuousDeployment from './routes/continuousDeployment.routes.js';
import checklist from './routes/checklist.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

export const API_PREFIX = '/tools/api';

const app = express();

app.use(cors());
app.use(express.json());

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
