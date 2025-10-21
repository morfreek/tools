import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import users from './routes/users.routes.js';
import projects from './routes/projects.routes.js';
import reviewsRouter from './routes/reviews.routes.js';
import notesRouter from './routes/notes.routes.js';
import filesRouter from './routes/files.routes.js';
import continuousDeployment from './routes/continuousDeployment.routes.js';
import checklist from './routes/checklist.routes.js';

const app = express();

// Configurar middleware globalmente
app.use(cors());
app.use(bodyParser.json());

// Montar el router de reviews en el prefijo base
app.use('/tools/api', users);
app.use('/tools/api', projects);
app.use('/tools/api', reviewsRouter);
app.use('/tools/api', notesRouter);
app.use('/tools/api', filesRouter);
app.use('/tools/api', continuousDeployment);
app.use('/tools/api', checklist);

// Solo iniciar el servidor si no estamos en modo test
if (process.env.NODE_ENV !== 'test') {
    const port = 3001;
    app.listen(port, '0.0.0.0', () => {
        // console.log(`API escuchando en http://localhost:${port}/tools/api`);
    });
}

export default app;
