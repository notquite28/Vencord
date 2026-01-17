/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showToast, Toasts } from "@webpack/common";
import { PluginNative } from "@utils/types";

import { settings } from "./settings";
import { generateRoomKey, encryptRoomKey, decryptRoomKey } from "./crypto";
import { setActiveSession } from "./session";

// Try multiple possible helper names
const getNative = () => {
    const helpers = VencordNative.pluginHelpers;
    // Try different possible names
    return helpers.DiscordSecureRoom || 
           helpers.discordSecureRoom || 
           helpers["Discord Secure Room"] ||
           helpers["discordSecureRoom"];
};

const Native = getNative() as PluginNative<typeof import("./native")>;

if (!Native) {
    console.error("[Discord Secure Room] Native helper not found. Available helpers:", Object.keys(VencordNative.pluginHelpers));
}

/**
 * Generate a random 8-character room code
 */
function generateRoomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Create a new secure room
 */
export async function createRoom(channelId: string, passphrase: string): Promise<void> {
    try {
        const workerUrl = settings.store.workerUrl;
        if (!workerUrl) {
            showToast("Worker URL not configured in settings", Toasts.Type.FAILURE);
            return;
        }

        // Generate room key
        const roomKey = await generateRoomKey();
        
        // Encrypt room key with passphrase
        const encryptedBlob = await encryptRoomKey(roomKey, passphrase);
        
        // Generate room code
        const roomCode = generateRoomCode();
        
        // POST to worker via native IPC (bypasses CSP)
        if (!Native || !Native.makeWorkerRequest) {
            const available = Object.keys(VencordNative.pluginHelpers);
            throw new Error(`Native helper not available. Available helpers: ${available.join(", ")}. Plugin may need to be reloaded.`);
        }
        
        const url = `${workerUrl.replace(/\/$/, "")}/room`; // Remove trailing slash
        const { status, data } = await Native.makeWorkerRequest(
            url,
            "POST",
            JSON.stringify({
                roomCode,
                encryptedBlob
            })
        );

        if (status !== 200) {
            if (status === -1) {
                throw new Error(`Failed to connect to worker: ${data}`);
            }
            throw new Error(`Worker returned ${status}: ${data}`);
        }

        // Store session
        setActiveSession(channelId, roomKey);
        
        // Show room code to user
        showToast(`Room created! Code: ${roomCode} - Share this code and passphrase with others`, Toasts.Type.SUCCESS);
        
        // Copy to clipboard if possible
        if (navigator.clipboard) {
            navigator.clipboard.writeText(roomCode).catch(() => {
                // Ignore clipboard errors
            });
        }
        
    } catch (error) {
            console.error("[Discord Secure Room] Create room failed:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes("libsodium") || errorMessage.includes("sodium")) {
            showToast("Failed to load encryption library. Check console for details.", Toasts.Type.FAILURE);
        } else if (errorMessage.includes("Worker") || errorMessage.includes("fetch")) {
            showToast("Failed to connect to worker. Check your worker URL in settings.", Toasts.Type.FAILURE);
        } else {
            showToast(`Failed to create room: ${errorMessage}`, Toasts.Type.FAILURE);
        }
    }
}

/**
 * Join an existing secure room
 */
export async function joinRoom(channelId: string, roomCode: string, passphrase: string): Promise<void> {
    try {
        const workerUrl = settings.store.workerUrl;
        if (!workerUrl) {
            showToast("Worker URL not configured in settings", Toasts.Type.FAILURE);
            return;
        }

        // GET encrypted blob from worker via native IPC (bypasses CSP)
        if (!Native || !Native.makeWorkerRequest) {
            const available = Object.keys(VencordNative.pluginHelpers);
            throw new Error(`Native helper not available. Available helpers: ${available.join(", ")}. Plugin may need to be reloaded.`);
        }
        
        const url = `${workerUrl.replace(/\/$/, "")}/room/${roomCode}`; // Remove trailing slash
        const { status, data } = await Native.makeWorkerRequest(url, "GET");
        
        if (status !== 200) {
            if (status === 404) {
                showToast("Room not found or expired", Toasts.Type.FAILURE);
            } else if (status === -1) {
                throw new Error(`Failed to connect to worker: ${data}`);
            } else {
                throw new Error(`Worker returned ${status}: ${data}`);
            }
            return;
        }

        const { encryptedBlob } = JSON.parse(data);
        
        // Decrypt room key
        const roomKey = await decryptRoomKey(encryptedBlob, passphrase);
        
        // Store session
        setActiveSession(channelId, roomKey);
        
        showToast("Successfully joined secure room!", Toasts.Type.SUCCESS);
        
    } catch (error) {
            console.error("[Discord Secure Room] Join room failed:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes("libsodium") || errorMessage.includes("sodium")) {
            showToast("Failed to load encryption library. Check console for details.", Toasts.Type.FAILURE);
        } else if (errorMessage.includes("decrypt") || errorMessage.includes("wrong")) {
            showToast("Failed to join room. Wrong passphrase or room expired.", Toasts.Type.FAILURE);
        } else {
            showToast(`Failed to join room: ${errorMessage}`, Toasts.Type.FAILURE);
        }
    }
}
