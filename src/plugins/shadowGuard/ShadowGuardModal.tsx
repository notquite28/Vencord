/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useState } from "@webpack/common";
import { Divider } from "@components/Divider";
import { Margins } from "@utils/margins";
import { ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot } from "@utils/modal";
import { Button, Forms, TextInput } from "@webpack/common";

import { createRoom, joinRoom } from "./roomManager";
import { cl } from "./utils";

interface ShadowGuardModalProps {
    rootProps: ModalProps;
    channelId: string;
}

export function ShadowGuardModal({ rootProps, channelId }: ShadowGuardModalProps) {
    const [mode, setMode] = useState<"create" | "join">("create");
    const [passphrase, setPassphrase] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!passphrase.trim()) {
            alert("Please enter a passphrase");
            return;
        }

        setLoading(true);
        try {
            await createRoom(channelId, passphrase);
            rootProps.onClose();
        } catch (error) {
            console.error("[ShadowGuard] Create failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!roomCode.trim() || !passphrase.trim()) {
            alert("Please enter both room code and passphrase");
            return;
        }

        setLoading(true);
        try {
            await joinRoom(channelId, roomCode.trim().toUpperCase(), passphrase);
            rootProps.onClose();
        } catch (error) {
            console.error("[ShadowGuard] Join failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalRoot {...rootProps}>
            <ModalHeader className={cl("modal-header")}>
                <Forms.FormTitle tag="h2" className={cl("modal-title")}>
                    ShadowGuard Secure Room
                </Forms.FormTitle>
                <ModalCloseButton onClick={rootProps.onClose} />
            </ModalHeader>

            <ModalContent className={cl("modal-content")}>
                <Forms.FormText className={Margins.bottom16}>
                    Create or join an ephemeral, end-to-end encrypted room in this channel.
                    Messages in active rooms are automatically encrypted/decrypted.
                </Forms.FormText>

                <Divider className={Margins.bottom16} />

                {/* Mode Toggle */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    <Button
                        color={mode === "create" ? Button.Colors.BRAND : Button.Colors.PRIMARY}
                        onClick={() => setMode("create")}
                        style={{ flex: 1 }}
                    >
                        Create Room
                    </Button>
                    <Button
                        color={mode === "join" ? Button.Colors.BRAND : Button.Colors.PRIMARY}
                        onClick={() => setMode("join")}
                        style={{ flex: 1 }}
                    >
                        Join Room
                    </Button>
                </div>

                {mode === "create" ? (
                    <div>
                        <Forms.FormTitle tag="h3" style={{ marginBottom: "8px" }}>
                            Create Secure Room
                        </Forms.FormTitle>
                        <Forms.FormText style={{ marginBottom: "16px" }}>
                            Enter a passphrase to protect your room. Share this passphrase securely with others who want to join.
                        </Forms.FormText>

                        <TextInput
                            type="password"
                            placeholder="Enter room passphrase"
                            value={passphrase}
                            onChange={setPassphrase}
                            disabled={loading}
                            style={{ marginBottom: "16px" }}
                        />

                        <Button
                            onClick={handleCreate}
                            disabled={loading || !passphrase.trim()}
                            color={Button.Colors.BRAND}
                        >
                            {loading ? "Creating..." : "Create Room"}
                        </Button>
                    </div>
                ) : (
                    <div>
                        <Forms.FormTitle tag="h3" style={{ marginBottom: "8px" }}>
                            Join Secure Room
                        </Forms.FormTitle>
                        <Forms.FormText style={{ marginBottom: "16px" }}>
                            Enter the room code and passphrase you received from the room creator.
                        </Forms.FormText>

                        <TextInput
                            placeholder="Room code (e.g., ABC12345)"
                            value={roomCode}
                            onChange={setRoomCode}
                            disabled={loading}
                            style={{ marginBottom: "12px", textTransform: "uppercase" }}
                            maxLength={12}
                        />

                        <TextInput
                            type="password"
                            placeholder="Enter room passphrase"
                            value={passphrase}
                            onChange={setPassphrase}
                            disabled={loading}
                            style={{ marginBottom: "16px" }}
                        />

                        <Button
                            onClick={handleJoin}
                            disabled={loading || !roomCode.trim() || !passphrase.trim()}
                            color={Button.Colors.BRAND}
                        >
                            {loading ? "Joining..." : "Join Room"}
                        </Button>
                    </div>
                )}
            </ModalContent>
        </ModalRoot>
    );
}
