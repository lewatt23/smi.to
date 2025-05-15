/**
 * Defines the alphabet for base62 encoding.
 */
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * The base for encoding (length of the alphabet).
 */
const BASE = ALPHABET.length;

/**
 * Encodes a non-negative integer into a base62 string.
 * @param num The number to encode.
 * @returns The base62 encoded string.
 */
export function encode(num: number): string {
    if (num < 0) {
        throw new Error("Input number must be non-negative for base62 encoding.");
    }
    if (num === 0) {
        return ALPHABET[0];
    }
    let str = "";
    while (num > 0) {
        str = ALPHABET[num % BASE] + str;
        num = Math.floor(num / BASE);
    }
    return str;
}

/**
 * Decodes a base62 string into a number.
 * @param str The base62 string to decode.
 * @returns The decoded number.
 * @throws Error if the string contains invalid characters.
 */
export function decode(str: string): number {
    let num = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const charIndex = ALPHABET.indexOf(char);
        if (charIndex === -1) {
            throw new Error(`Invalid character in base62 string: ${char}`);
        }
        num = num * BASE + charIndex;
    }
    return num;
} 