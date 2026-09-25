import { useState } from 'react';

const THEME_KEY = 'tools:tema';
const ORDER = ['auto', 'light', 'dark'];
export const THEME_LABELS = { auto: 'automático', light: 'claro', dark: 'oscuro' };

const readTheme = () => {
    try {
        const t = localStorage.getItem(THEME_KEY);
        return t === 'light' || t === 'dark' ? t : 'auto';
    } catch {
        return 'auto';
    }
};

// El valor inicial ya lo aplicó el script de index.html; aquí solo se rota y guarda
export const useTheme = () => {
    const [theme, setTheme] = useState(readTheme);
    const cycle = () => {
        const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
        if (next === 'auto') document.documentElement.removeAttribute('data-theme');
        else document.documentElement.setAttribute('data-theme', next);
        try {
            if (next === 'auto') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, next);
        } catch { /* sin almacenamiento: no se recuerda */ }
        setTheme(next);
    };
    return { theme, cycle };
};
