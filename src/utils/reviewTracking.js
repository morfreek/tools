// Cálculos de seguimiento sobre las revisiones técnicas de un proyecto.
// Funciones puras: reciben lo que entregan GET /projects/:id/reviews y GET /checklist.

export const EVALUATED = ['bien', 'regular', 'deficiente'];
const PENDING = ['regular', 'deficiente'];
const RANK = { deficiente: 1, regular: 2, bien: 3 };

const normalize = (status) => (status || '').toLowerCase();

// Más reciente primero; a igual fecha, la de mayor id
export const sortReviews = (reviews = []) => [...reviews].sort((a, b) =>
    b.applied_at.localeCompare(a.applied_at) || b.id - a.id);

const statusOf = (review, pointId) => normalize(review?.results?.find((r) => r.point_id === pointId)?.status);

// Conteo por estado de una revisión; "No aplica" y vacíos no cuentan como evaluados
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

const pointIndex = (checklist = []) => {
    const index = new Map();
    for (const aspect of checklist) {
        for (const point of aspect.points || []) {
            index.set(point.id, { ...point, aspect: aspect.name, aspectId: aspect.id });
        }
    }
    return index;
};

// Puntos en regular o deficiente en la última revisión, agrupados por aspecto.
// `streak` = revisiones consecutivas (desde la última hacia atrás) en que el punto sigue pendiente.
export const pendingPoints = (reviews, checklist) => {
    const ordered = sortReviews(reviews);
    const last = ordered[0];
    if (!last) return [];
    const points = pointIndex(checklist);
    const groups = new Map();

    for (const result of last.results || []) {
        const status = normalize(result.status);
        if (!PENDING.includes(status)) continue;
        let streak = 0;
        let since = last.applied_at;
        for (const review of ordered) {
            if (!PENDING.includes(statusOf(review, result.point_id))) break;
            streak += 1;
            since = review.applied_at;
        }
        const point = points.get(result.point_id) || { name: `Punto ${result.point_id}`, aspect: 'Otros', aspectId: 0 };
        const item = { pointId: result.point_id, name: point.name, status, observation: (result.observation || '').trim(), streak, since };
        if (!groups.has(point.aspectId)) groups.set(point.aspectId, { aspect: point.aspect, items: [] });
        groups.get(point.aspectId).items.push(item);
    }

    // Primero lo deficiente y lo que lleva más tiempo pendiente
    for (const g of groups.values()) {
        g.items.sort((a, b) => RANK[a.status] - RANK[b.status] || b.streak - a.streak);
    }
    return [...groups.values()];
};

const diff = (current, previous, points) => {
    const improved = [];
    const worsened = [];
    for (const result of current.results || []) {
        const now = normalize(result.status);
        const before = statusOf(previous, result.point_id);
        if (!RANK[now] || !RANK[before] || now === before) continue;
        const item = { pointId: result.point_id, name: points.get(result.point_id)?.name || `Punto ${result.point_id}`, before, now };
        (RANK[now] > RANK[before] ? improved : worsened).push(item);
    }
    return { improved, worsened };
};

// Último cambio registrado: el par de revisiones consecutivas más reciente en que
// algún punto evaluado subió o bajó. Cada revisión suele partir copiando la anterior,
// por eso comparar solo las dos últimas casi siempre da "sin cambios".
// null = menos de dos revisiones; changed=false = nunca cambió nada.
export const lastChange = (reviews, checklist) => {
    const ordered = sortReviews(reviews);
    if (ordered.length < 2) return null;
    const points = pointIndex(checklist);
    for (let i = 0; i < ordered.length - 1; i += 1) {
        const { improved, worsened } = diff(ordered[i], ordered[i + 1], points);
        if (improved.length || worsened.length) {
            return { changed: true, current: ordered[i], previous: ordered[i + 1], unchangedSince: i, improved, worsened };
        }
    }
    return { changed: false, current: ordered[0], previous: ordered[ordered.length - 1], unchangedSince: ordered.length - 1, improved: [], worsened: [] };
};

// Serie para el gráfico de evolución: más antigua primero, porcentajes sobre puntos evaluados
export const trendSeries = (reviews, limit = 12) => sortReviews(reviews)
    .slice(0, limit)
    .reverse()
    .map((review) => {
        const counts = countStatuses(review);
        const pct = (n) => (counts.evaluados ? (n / counts.evaluados) * 100 : 0);
        return {
            id: review.id,
            date: review.applied_at,
            ...counts,
            pctBien: pct(counts.bien),
            pctRegular: pct(counts.regular),
            pctDeficiente: pct(counts.deficiente),
        };
    });
