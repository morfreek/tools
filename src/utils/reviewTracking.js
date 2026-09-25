// Cálculos sobre las revisiones técnicas de un proyecto.
// Funciones puras: reciben lo que entrega GET /projects/:id/reviews.

export const EVALUATED = ['bien', 'regular', 'deficiente'];

const normalize = (status) => (status || '').toLowerCase();
const DAY = 24 * 60 * 60 * 1000;
const toDate = (isoDate) => new Date(`${isoDate}T00:00:00`);

// Más reciente primero; a igual fecha, la de mayor id
export const sortReviews = (reviews = []) => [...reviews].sort((a, b) =>
    b.applied_at.localeCompare(a.applied_at) || b.id - a.id);

// Conteo por estado de una revisión; "No aplica" y vacíos no cuentan como evaluados.
// El checklist es opcional: evaluados = 0 significa que la revisión no lo usó.
export const countStatuses = (review) => {
    const counts = { bien: 0, regular: 0, deficiente: 0, noAplica: 0 };
    for (const r of review?.results || []) {
        const s = normalize(r.status);
        if (EVALUATED.includes(s)) counts[s] += 1;
        else counts.noAplica += 1;
    }
    counts.evaluados = counts.bien + counts.regular + counts.deficiente;
    return counts;
};

// Frecuencia de revisión: días desde la última y promedio entre revisiones consecutivas
export const reviewCadence = (reviews, today = new Date()) => {
    const ordered = sortReviews(reviews);
    if (!ordered.length) return null;
    const dates = ordered.map((r) => toDate(r.applied_at));
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const daysSinceLast = Math.max(0, Math.round((start - dates[0]) / DAY));
    const gaps = dates.slice(0, -1).map((d, i) => Math.round((d - dates[i + 1]) / DAY));
    const averageDays = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;
    return { daysSinceLast, averageDays };
};
