// Manejador central: Express 5 envía aquí los errores de handlers async.
// Nunca expone detalles internos al cliente.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'El cuerpo de la solicitud no es JSON válido' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'El archivo supera el tamaño máximo de 10 MB' });
    }

    if (process.env.NODE_ENV !== 'test') {
        console.error(`[${req.method} ${req.originalUrl}]`, err);
    }
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ error: status < 500 ? 'Solicitud inválida' : 'Error interno del servidor' });
};
