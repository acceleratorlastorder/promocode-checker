import { createHash, timingSafeEqual } from "crypto";

/**
 * Use this to compare strings in a way that is safe from timing attacks
 * @param a
 * @param b
 * @returns
 */
export const safeCompare = (a: string, b: string): boolean => {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);

    if (aBuf.length !== bBuf.length) {
        return false;
    }

    return timingSafeEqual(aBuf, bBuf);
};

/**
 * Use this to hash a string
 * @param value
 * @returns
 */
export const hash = (value: string): string => createHash("sha256").update(value).digest("hex");

/**
 * Use this to compare two hashed strings
 * @param a
 * @param b
 * @returns
 */
export const hashCompare = (a: string, b: string): boolean => hash(a) === hash(b);
