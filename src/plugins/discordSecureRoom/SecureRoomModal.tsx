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
import { hasActiveSession, clearSession } from "./session";
import { cl } from "./utils";

interface SecureRoomModalProps {
    rootProps: ModalProps;
    channelId: string;
}

export function SecureRoomModal({ rootProps, channelId }: SecureRoomModalProps) {
    const [mode, setMode] = useState<"create" | "join">("create");
    const [passphrase, setPassphrase] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [loading, setLoading] = useState(false);
    const hasSession = hasActiveSession(channelId);

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
            console.error("[Discord Secure Room] Create failed:", error);
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
            console.error("[Discord Secure Room] Join failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExit = () => {
        clearSession(channelId);
        rootProps.onClose();
    };

    return (
        <ModalRoot {...rootProps}>
            <ModalHeader className={cl("modal-header")}>
                <Forms.FormTitle tag="h2" className={cl("modal-title")}>
                    Discord Secure Room
                </Forms.FormTitle>
                <ModalCloseButton onClick={rootProps.onClose} />
            </ModalHeader>

            <ModalContent className={cl("modal-content")}>
                <Forms.FormText className={Margins.bottom16}>
                    Create or join an ephemeral, end-to-end encrypted room in this channel.
                    Messages in active rooms are automatically encrypted/decrypted.
                </Forms.FormText>

                {hasSession && (
                    <>
                        <Divider className={Margins.bottom16} />
                        <Forms.FormText className={Margins.bottom16} style={{ color: "var(--green-360)" }}>
                            ✓ You are in an active secure room. Messages will be encrypted automatically.
                        </Forms.FormText>
                        <Button
                            onClick={handleExit}
                            color={Button.Colors.RED}
                            className={Margins.bottom16}
                            style={{ width: "100%" }}
                        >
                            Exit Room (Send Unencrypted)
                        </Button>
                        <Divider className={Margins.bottom16} />
                    </>
                )}

                <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                    <Button
                        color={mode === "create" ? Button.Colors.BRAND : Button.Colors.PRIMARY}
                        onClick={() => {
                            setMode("create");
                            setPassphrase("");
                            setRoomCode("");
                        }}
                        style={{ flex: 1 }}
                        disabled={loading}
                    >
                        Create Room
                    </Button>
                    <Button
                        color={mode === "join" ? Button.Colors.BRAND : Button.Colors.PRIMARY}
                        onClick={() => {
                            setMode("join");
                            setPassphrase("");
                            setRoomCode("");
                        }}
                        style={{ flex: 1 }}
                        disabled={loading}
                    >
                        Join Room
                    </Button>
                </div>

                {mode === "create" ? (
                    <>
                        <Forms.FormTitle tag="h3" style={{ marginBottom: "8px" }}>
                            Create Secure Room
                        </Forms.FormTitle>
                        <Forms.FormText className={Margins.bottom16}>
                            Enter a passphrase to protect your room. Share this passphrase securely with others who want to join.
                        </Forms.FormText>

                        <div className={Margins.bottom16}>
                            <TextInput
                                type="password"
                                placeholder="Enter room passphrase"
                                value={passphrase}
                                onChange={setPassphrase}
                                disabled={loading}
                            />
                        </div>

                        <Button
                            onClick={handleCreate}
                            disabled={loading || !passphrase.trim()}
                            color={Button.Colors.BRAND}
                            style={{ width: "100%" }}
                        >
                            {loading ? "Creating..." : "Create Room"}
                        </Button>
                    </>
                ) : (
                    <>
                        <Forms.FormTitle tag="h3" style={{ marginBottom: "8px" }}>
                            Join Secure Room
                        </Forms.FormTitle>
                        <Forms.FormText className={Margins.bottom16}>
                            Enter the room code and passphrase you received from the room creator.
                        </Forms.FormText>

                        <div style={{ marginBottom: "12px" }}>
                            <TextInput
                                placeholder="Room code (e.g., ABC12345)"
                                value={roomCode}
                                onChange={setRoomCode}
                                disabled={loading}
                                style={{ textTransform: "uppercase" }}
                                maxLength={12}
                            />
                        </div>

                        <div className={Margins.bottom16}>
                            <TextInput
                                type="password"
                                placeholder="Enter room passphrase"
                                value={passphrase}
                                onChange={setPassphrase}
                                disabled={loading}
                            />
                        </div>

                        <Button
                            onClick={handleJoin}
                            disabled={loading || !roomCode.trim() || !passphrase.trim()}
                            color={Button.Colors.BRAND}
                            style={{ width: "100%" }}
                        >
                            {loading ? "Joining..." : "Join Room"}
                        </Button>
                    </>
                )}
            </ModalContent>
        </ModalRoot>
    );
}
