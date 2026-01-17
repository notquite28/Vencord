/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { IpcMainInvokeEvent } from "electron";

export async function makeWorkerRequest(_: IpcMainInvokeEvent, url: string, method: string, body?: string) {
    try {
        const res = await fetch(url, {
            method,
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body
        });

        const data = await res.text();
        return { status: res.status, data };
    } catch (e) {
        return { status: -1, data: String(e) };
    }
}
