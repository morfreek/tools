// Contraseña temporal legible (sin 0/O, 1/l/I) para entregar a mano a una cuenta nueva
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateTemporaryPassword = (length = 12) => {
    const values = crypto.getRandomValues(new Uint32Array(length));
    return Array.from(values, (v) => ALPHABET[v % ALPHABET.length]).join('');
};
