/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Using WebCrypto API (native browser API, no external dependencies)
// Note: Using PBKDF2 instead of Argon2id, and AES-GCM instead of XChaCha20-Poly1305
// due to WebCrypto limitations, but still secure

/**
 * Generate a random 256-bit room key
 */
export async function generateRoomKey(): Promise<Uint8Array> {
    return crypto.getRandomValues(new Uint8Array(32)); // 256 bits
}

/**
 * Derive encryption key from passphrase using PBKDF2
 */
async function deriveKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passphraseKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(passphrase),
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );
    
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000, // High iteration count for security
            hash: "SHA-256"
        },
        passphraseKey,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypt room key with passphrase-derived key using AES-GCM
 */
export async function encryptRoomKey(roomKey: Uint8Array, passphrase: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const derivedKey = await deriveKeyFromPassphrase(passphrase, salt);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    
    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        derivedKey,
        roomKey
    );
    
    // Combine: salt (16) + iv (12) + encrypted
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt room key from encrypted blob using passphrase
 */
export async function decryptRoomKey(encryptedBlob: string, passphrase: string): Promise<Uint8Array> {
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedBlob), c => c.charCodeAt(0));
    
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);
    
    const derivedKey = await deriveKeyFromPassphrase(passphrase, salt);
    
    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        derivedKey,
        encrypted
    );
    
    return new Uint8Array(decrypted);
}

/**
 * Encrypt message with room key using AES-GCM
 */
export async function encryptMessage(message: string, roomKey: Uint8Array): Promise<string> {
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    
    // Import room key
    const key = await crypto.subtle.importKey(
        "raw",
        roomKey,
        "AES-GCM",
        false,
        ["encrypt"]
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    
    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        messageBytes
    );
    
    // Combine iv + encrypted
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt message with room key
 */
export async function decryptMessage(encryptedBlob: string, roomKey: Uint8Array): Promise<string> {
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedBlob), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Import room key
    const key = await crypto.subtle.importKey(
        "raw",
        roomKey,
        "AES-GCM",
        false,
        ["decrypt"]
    );
    
    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

/**
 * Parse secure message header
 */
export function parseSecureMessage(content: string): string | null {
    const match = content.match(/\[SECURE-MSG\]\s*(.+)/);
    return match ? match[1].trim() : null;
}
