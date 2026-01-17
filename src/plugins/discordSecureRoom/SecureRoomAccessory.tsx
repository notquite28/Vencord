/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useState, useEffect, useRef } from "@webpack/common";
import { Message } from "@vencord/discord-types";

import { decryptMessage } from "./crypto";
import { getActiveRoomKey, onSessionChange } from "./session";

interface SecureRoomAccessoryProps {
    message: Message;
}

export function SecureRoomAccessory({ message }: SecureRoomAccessoryProps) {
    const [decrypted, setDecrypted] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [forceUpdate, setForceUpdate] = useState(0);
    const channelIdRef = useRef<string>(String(message.channel_id));

    // Update ref when channel changes
    useEffect(() => {
        channelIdRef.current = String(message.channel_id);
    }, [message.channel_id]);

    useEffect(() => {
        const unsubscribe = onSessionChange((channelId) => {
            if (channelId === channelIdRef.current) {
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

        const messageTimestamp = message.timestamp ? new Date(message.timestamp).getTime() : Date.now();
        if ((Date.now() - messageTimestamp) / (1000 * 60) > 60) {
            setDecrypted(null);
            setError(null);
            return;
        }

        const roomKey = getActiveRoomKey(channelIdRef.current);
        if (!roomKey) {
            setDecrypted(null);
            setError(null);
            return;
        }

        setError(null);
        setDecrypted(null);
        
        decryptMessage(content.replace("[SECURE-MSG]", "").trim(), roomKey)
            .then(setDecrypted)
            .catch(err => {
                console.error("[Discord Secure Room] Decryption failed:", err);
                setError("Decryption failed");
            });
    }, [message.content, message.channel_id, message.timestamp, forceUpdate]);

    if (!message.content?.startsWith("[SECURE-MSG]")) return null;
    
    const messageTimestamp = message.timestamp ? new Date(message.timestamp).getTime() : Date.now();
    if ((Date.now() - messageTimestamp) / (1000 * 60) > 60) return null;
    
    const roomKey = getActiveRoomKey(message.channel_id);
    if (!roomKey) return null;

    if (error) {
        return (
            <div className="vc-secureroom-decrypted vc-secureroom-error">
                <div className="vc-secureroom-label">Error:</div>
                <div className="vc-secureroom-content">{error}</div>
            </div>
        );
    }

    if (!decrypted) {
        return (
            <div className="vc-secureroom-decrypted">
                <div className="vc-secureroom-label">Decrypting...</div>
            </div>
        );
    }

    return (
        <div className="vc-secureroom-decrypted">
            <div className="vc-secureroom-label">Decrypted:</div>
            <div className="vc-secureroom-content">{decrypted}</div>
        </div>
    );
}
