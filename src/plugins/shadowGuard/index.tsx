/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import definePlugin from "@utils/types";
import { Message } from "@vencord/discord-types";
import { NavigationRouter, SelectedChannelStore } from "@webpack/common";

import { settings } from "./settings";
import { ShadowGuardIcon, ShadowGuardChatBarIcon } from "./ShadowGuardIcon";
import { ShadowGuardAccessory } from "./ShadowGuardAccessory";
import { encryptMessage } from "./crypto";
import { getActiveRoomKey, hasActiveSession } from "./session";

export default definePlugin({
    name: "ShadowGuard",
    description: "Ephemeral, end-to-end encrypted sub-rooms within Discord channels",
    authors: [{ name: "quiet", id: 0n }],
    settings,

    chatBarButton: {
        icon: ShadowGuardIcon,
        render: ShadowGuardChatBarIcon
    },

    async onBeforeMessageSend(_, message) {
        if (!message.content) return;
        
        // Get channel ID from multiple sources (same method as button handler)
        let channelId: string | null = null;
        
        // Method 1: SelectedChannelStore
        try {
            channelId = SelectedChannelStore.getChannelId?.();
        } catch (e) {
            // Ignore
        }
        
        // Method 2: NavigationRouter
        if (!channelId) {
            try {
                const path = NavigationRouter.getPath?.();
                const match = path?.match(/channels\/(\d+)\/(\d+)/);
                if (match) {
                    channelId = match[2];
                }
            } catch (e) {
                // Ignore
            }
        }
        
        // Method 3: Window location
        if (!channelId) {
            try {
                const match = window.location.pathname.match(/channels\/(\d+)\/(\d+)/);
                if (match) {
                    channelId = match[2];
                }
            } catch (e) {
                // Ignore
            }
        }
        
        if (!channelId) {
            console.log("[ShadowGuard] Could not get channel ID");
            return;
        }
        
        console.log("[ShadowGuard] onBeforeMessageSend - channelId:", channelId, "hasSession:", hasActiveSession(channelId));
        
        if (!hasActiveSession(channelId)) {
            console.log("[ShadowGuard] No active session for channel:", channelId);
            return;
        }

        const roomKey = getActiveRoomKey(channelId);
        if (!roomKey) {
            console.log("[ShadowGuard] No room key found for channel:", channelId);
            return;
        }

        try {
            console.log("[ShadowGuard] Encrypting message...");
            const encrypted = await encryptMessage(message.content, roomKey);
            message.content = `[SECURE-MSG] ${encrypted}`;
            console.log("[ShadowGuard] Message encrypted successfully");
        } catch (error) {
            console.error("[ShadowGuard] Encryption failed:", error);
        }
    },

    renderMessageAccessory: props => <ShadowGuardAccessory message={props.message} />
});
