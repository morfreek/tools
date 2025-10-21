import express from 'express';

const router = express.Router();

// Ruta de prueba para redirección
router.get('/test-redirect', (req, res) => {
    // console.log('Headers recibidos:', req.headers);
    // console.log('URL original:', req.originalUrl);
    res.redirect('/tools/api/test-destination');
});

router.get('/test-destination', (req, res) => {
    res.json({
        message: 'Redirección exitosa',
        originalUrl: req.originalUrl,
        headers: req.headers
    });
});

export default router;
