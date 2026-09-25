import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
export const MIN_PASSWORD_LENGTH = 8;

// Formato guardado: scrypt$<sal hex>$<hash hex>
export const hashPassword = async (password) => {
    const salt = randomBytes(16);
    const hash = await scryptAsync(password, salt, KEY_LENGTH);
    return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
};

export const verifyPassword = async (password, stored) => {
    const [scheme, saltHex, hashHex] = String(stored || '').split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = await scryptAsync(String(password), Buffer.from(saltHex, 'hex'), expected.length);
    return timingSafeEqual(actual, expected);
};

export const isValidPassword = (password) =>
    typeof password === 'string' && password.length >= MIN_PASSWORD_LENGTH;
