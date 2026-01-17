/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// In-memory session storage (cleared on page refresh)
// channelId -> roomKey mapping
const activeSessions = new Map<string, Uint8Array>();

// Event system for session changes
const sessionListeners = new Set<(channelId: string) => void>();

/**
 * Subscribe to session changes
 */
export function onSessionChange(callback: (channelId: string) => void): () => void {
    sessionListeners.add(callback);
    return () => sessionListeners.delete(callback);
}

/**
 * Store active room key for a channel
 */
export function setActiveSession(channelId: string, roomKey: Uint8Array): void {
    // Ensure channelId is a string
    const key = String(channelId);
    activeSessions.set(key, roomKey);
    console.log("[ShadowGuard] Session stored for channel:", key, "Total sessions:", activeSessions.size);
    
    // Notify all listeners
    sessionListeners.forEach(listener => listener(key));
}

/**
 * Get active room key for a channel
 */
export function getActiveRoomKey(channelId: string): Uint8Array | undefined {
    // Ensure channelId is a string
    const key = String(channelId);
    const roomKey = activeSessions.get(key);
    console.log("[ShadowGuard] getActiveRoomKey - channelId:", key, "found:", !!roomKey);
    return roomKey;
}

/**
 * Check if channel has active secure session
 */
export function hasActiveSession(channelId: string): boolean {
    // Ensure channelId is a string
    const key = String(channelId);
    return activeSessions.has(key);
}

/**
 * Clear session for a channel
 */
export function clearSession(channelId: string): void {
    activeSessions.delete(channelId);
}

/**
 * Clear all sessions
 */
export function clearAllSessions(): void {
    activeSessions.clear();
}
