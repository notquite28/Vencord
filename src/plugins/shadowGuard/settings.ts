/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    workerUrl: {
        type: OptionType.STRING,
        description: "Cloudflare Worker URL for key exchange",
        default: "",
        placeholder: "https://your-worker.workers.dev"
    },
    autoDecrypt: {
        type: OptionType.BOOLEAN,
        description: "Automatically decrypt secure messages in active sessions",
        default: true
    }
});
