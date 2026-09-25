// Minúsculas y sin tildes, para búsquedas que ignoran acentos
export const normalizeText = (value) =>
    (value ?? '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');

// true si algún valor contiene el término de búsqueda (vacío = coincide todo)
export const matchesSearch = (term, values) => {
    const q = normalizeText(term).trim();
    if (!q) return true;
    return values.some((value) => normalizeText(value).includes(q));
};
