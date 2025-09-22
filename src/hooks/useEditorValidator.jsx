import { useMemo } from 'react';

export function useEditorValidator() {

    const isEditorEmpty = useMemo(() => {
        return (html) => {
            if (!html || typeof html !== 'string') return true;

            // Crear DOM virtual para limpiar HTML
            const div = document.createElement('div');
            div.innerHTML = html;

            // Obtener texto plano
            const text = div.textContent || div.innerText || '';

            // Verificar si hay contenido multimedia
            const hasMedia = div.querySelector('img, video, iframe, audio') !== null;

            // Verificar si hay texto real (sin espacios/saltos)
            const hasText = text.trim().length > 0;

            return !hasText && !hasMedia;
        };
    }, []);

    const validateEditor = useMemo(() => {
        return (html, customMessage = 'Este campo es requerido') => {
            return isEditorEmpty(html) ? customMessage : undefined;
        };
    }, [isEditorEmpty]);

    return {
        isEditorEmpty,
        validateEditor
    };
}