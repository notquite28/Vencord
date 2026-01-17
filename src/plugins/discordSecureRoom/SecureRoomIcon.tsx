/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { classes } from "@utils/misc";
import { openModal } from "@utils/modal";
import { IconComponent } from "@utils/types";
import { NavigationRouter, SelectedChannelStore } from "@webpack/common";

import { SecureRoomModal } from "./SecureRoomModal";
import { cl } from "./utils";

export const SecureRoomIcon: IconComponent = ({ height = 20, width = 20, className }) => {
    return (
        <svg
            viewBox="0 0 24 24"
            height={height}
            width={width}
            className={classes(cl("icon"), className)}
            fill="currentColor"
        >
            <path
                d="M12 2L4 7V11C4 15.55 6.84 19.74 12 21C17.16 19.74 20 15.55 20 11V7L12 2ZM12 4.11L18 8.11V11C18 14.52 15.64 17.88 12 19C8.36 17.88 6 14.52 6 11V8.11L12 4.11ZM12 7C10.9 7 10 7.9 10 9C10 10.1 10.9 11 12 11C13.1 11 14 10.1 14 9C14 7.9 13.1 7 12 7Z"
            />
        </svg>
    );
};

export const SecureRoomChatBarIcon: ChatBarButtonFactory = ({ isMainChat }) => {
    if (!isMainChat) return null;

    const handleClick = (e: any) => {
        // Try multiple methods to get channel ID
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
                    channelId = match[2]; // Second group is channel ID
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
        
        if (!channelId) return;
        
        openModal(props => (
            <SecureRoomModal rootProps={props} channelId={channelId!} />
        ));
    };

    return (
        <ChatBarButton
            tooltip="Discord Secure Room"
            onClick={handleClick}
        >
            <SecureRoomIcon className={cl("chat-button")} />
        </ChatBarButton>
    );
};
