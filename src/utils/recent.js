// Accesos recientes del Inicio: proyectos y herramientas abiertos en este navegador.
// Es una comodidad por navegador (localStorage); si el almacenamiento falla, no hay recientes.
const KEY = 'tools:recientes';
export const MAX_RECENT = 6;

// Pura: pone el elemento al inicio, sin duplicarlo por key, y corta en max
export const addRecent = (list, item, max = MAX_RECENT) =>
    [item, ...list.filter((r) => r.key !== item.key)].slice(0, max);

export const readRecent = () => {
    try {
        const list = JSON.parse(localStorage.getItem(KEY) || '[]');
        return Array.isArray(list) ? list.filter((r) => r?.key && r?.to && r?.label) : [];
    } catch {
        return [];
    }
};

// item: { key, type: 'proyecto' | 'herramienta', to, label, detail? }
export const recordVisit = (item) => {
    try {
        localStorage.setItem(KEY, JSON.stringify(addRecent(readRecent(), { ...item, at: Date.now() })));
    } catch { /* sin almacenamiento */ }
};
