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

// Vigencia de la última revisión de un proyecto, para el panel de trabajo del Inicio.
// Umbrales en días: hasta alDia está al día, hasta atencion requiere atención, después está atrasado.
export const FRESHNESS_DAYS = { alDia: 14, atencion: 30 };

export const FRESHNESS = {
    'sin-revisiones': { label: 'Sin revisiones', bg: 'danger', order: 0 },
    atrasado: { label: 'Atrasado', bg: 'danger', order: 1 },
    atencion: { label: 'Atención', bg: 'warning', order: 2 },
    'al-dia': { label: 'Al día', bg: 'success', order: 3 },
};

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const daysSince = (isoDate, today = new Date()) =>
    Math.max(0, Math.round((startOfDay(today) - toDate(isoDate)) / DAY));

export const reviewFreshness = (lastReviewAt, today = new Date()) => {
    if (!lastReviewAt) return { estado: 'sin-revisiones', days: null };
    const days = daysSince(lastReviewAt, today);
    const estado = days <= FRESHNESS_DAYS.alDia ? 'al-dia' : days <= FRESHNESS_DAYS.atencion ? 'atencion' : 'atrasado';
    return { estado, days };
};

// Proyectos del más urgente al más reciente: sin revisiones primero, luego la revisión más antigua
export const sortByFreshness = (projects = []) => [...projects].sort((a, b) => {
    if (!a.last_review_at || !b.last_review_at) return (a.last_review_at ? 1 : 0) - (b.last_review_at ? 1 : 0);
    return a.last_review_at.localeCompare(b.last_review_at) || a.name.localeCompare(b.name);
});

// Frecuencia de revisión: días desde la última y promedio entre revisiones consecutivas
export const reviewCadence = (reviews, today = new Date()) => {
    const ordered = sortReviews(reviews);
    if (!ordered.length) return null;
    const dates = ordered.map((r) => toDate(r.applied_at));
    const daysSinceLast = daysSince(ordered[0].applied_at, today);
    const gaps = dates.slice(0, -1).map((d, i) => Math.round((d - dates[i + 1]) / DAY));
    const averageDays = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;
    return { daysSinceLast, averageDays };
};
