/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import definePlugin from "@utils/types";
import { Message } from "@vencord/discord-types";
import { NavigationRouter, SelectedChannelStore } from "@webpack/common";
import { Devs } from "@utils/constants";

import { settings } from "./settings";
import { SecureRoomIcon, SecureRoomChatBarIcon } from "./SecureRoomIcon";
import { SecureRoomAccessory } from "./SecureRoomAccessory";
import { encryptMessage } from "./crypto";
import { getActiveRoomKey, hasActiveSession } from "./session";

export default definePlugin({
    name: "Discord Secure Room",
    description: "Ephemeral, end-to-end encrypted sub-rooms within Discord channels",
    authors: [Devs.quiet],
    settings,

    chatBarButton: {
        icon: SecureRoomIcon,
        render: SecureRoomChatBarIcon
    },

    async onBeforeMessageSend(_, message) {
        if (!message.content || message.content.startsWith("[SECURE-MSG]")) return;
        
        let channelId: string | null = null;
        try {
            channelId = SelectedChannelStore.getChannelId?.();
        } catch {}
        
        if (!channelId) {
            try {
                const path = NavigationRouter.getPath?.();
                const match = path?.match(/channels\/(\d+)\/(\d+)/);
                if (match) channelId = match[2];
            } catch {}
        }
        
        if (!channelId) {
            try {
                const match = window.location.pathname.match(/channels\/(\d+)\/(\d+)/);
                if (match) channelId = match[2];
            } catch {}
        }
        
        if (!channelId || !hasActiveSession(channelId)) return;

        const roomKey = getActiveRoomKey(channelId);
        if (!roomKey) return;

        try {
            const encrypted = await encryptMessage(message.content, roomKey);
            message.content = `[SECURE-MSG] ${encrypted}`;
        } catch (error) {
            console.error("[Discord Secure Room] Encryption failed:", error);
        }
    },

    renderMessageAccessory: props => <SecureRoomAccessory message={props.message} />
});
