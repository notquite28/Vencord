/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useState, useEffect, useRef } from "@webpack/common";
import { Message } from "@vencord/discord-types";

import { decryptMessage } from "./crypto";
import { getActiveRoomKey, onSessionChange } from "./session";

interface ShadowGuardAccessoryProps {
    message: Message;
}

export function ShadowGuardAccessory({ message }: ShadowGuardAccessoryProps) {
    const [decrypted, setDecrypted] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [forceUpdate, setForceUpdate] = useState(0);
    const channelIdRef = useRef<string>(String(message.channel_id));

    // Update ref when channel changes
    useEffect(() => {
        channelIdRef.current = String(message.channel_id);
    }, [message.channel_id]);

    // Listen for session changes
    useEffect(() => {
        const unsubscribe = onSessionChange((channelId) => {
            // If session was set for this channel, trigger re-decryption
            if (channelId === channelIdRef.current) {
                console.log("[ShadowGuard] Session available for channel, triggering re-decryption");
                setForceUpdate(prev => prev + 1);
            }
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const content = message.content;
        if (!content?.startsWith("[SECURE-MSG]")) {
            setDecrypted(null);
            setError(null);
            return;
        }

        const channelId = channelIdRef.current;
        const roomKey = getActiveRoomKey(channelId);
        
        if (!roomKey) {
            // No room key available yet
            setDecrypted(null);
            setError(null);
            return;
        }

        // Auto-decrypt for members
        const encrypted = content.replace("[SECURE-MSG]", "").trim();
        
        // Reset states before decrypting
        setError(null);
        setDecrypted(null);
        
        decryptMessage(encrypted, roomKey)
            .then(dec => {
                setDecrypted(dec);
                setError(null);
            })
            .catch(err => {
                console.error("[ShadowGuard] Decryption failed:", err);
                setError("Decryption failed");
                setDecrypted(null);
            });
    }, [message.content, message.channel_id, forceUpdate]);

    if (!message.content?.startsWith("[SECURE-MSG]")) return null;
    
    const roomKey = getActiveRoomKey(message.channel_id);
    if (!roomKey) return null; // Non-member

    if (error) {
        return (
            <div className="vc-shadowguard-decrypted vc-shadowguard-error">
                <div className="vc-shadowguard-label">Error:</div>
                <div className="vc-shadowguard-content">{error}</div>
            </div>
        );
    }

    if (!decrypted) {
        return (
            <div className="vc-shadowguard-decrypted">
                <div className="vc-shadowguard-label">Decrypting...</div>
            </div>
        );
    }

    return (
        <div className="vc-shadowguard-decrypted">
            <div className="vc-shadowguard-label">Decrypted:</div>
            <div className="vc-shadowguard-content">{decrypted}</div>
        </div>
    );
}
