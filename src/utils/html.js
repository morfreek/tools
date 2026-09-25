import DOMPurify from 'dompurify';

// El HTML de notas y observaciones viene del editor enriquecido y lo escriben
// usuarios: siempre se sanitiza antes de insertarlo en la página.
export const sanitizeHtml = (html) => DOMPurify.sanitize(html || '', { USE_PROFILES: { html: true } });

// DOMParser no ejecuta scripts ni atributos como onerror (a diferencia de
// asignar innerHTML a un elemento, aunque no esté en el documento)
export const parseHtml = (html) => new DOMParser().parseFromString(html || '', 'text/html').body;

const NBSP = new RegExp(String.fromCharCode(160), 'g'); // espacio duro

// Texto visible de un HTML. Fuera del navegador (pruebas, render en servidor)
// no hay DOMParser: se quitan las etiquetas y entidades comunes.
export const htmlToText = (html) => {
    if (typeof DOMParser === 'undefined') {
        return (html || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;|&#160;/gi, ' ')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();
    }
    return parseHtml(html).textContent.replace(NBSP, ' ').trim();
};

// ¿El HTML tiene texto visible? (el editor deja "<br>" o "&nbsp;" al borrar)
export const hasText = (html) => htmlToText(html).length > 0;
