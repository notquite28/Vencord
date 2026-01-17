# ShadowGuard

Ephemeral, end-to-end encrypted (E2EE) "sub-rooms" within Discord channels. Privacy is achieved by keeping encryption keys completely out-of-band using a serverless worker for temporary key exchange.

## Features

- **Create Secure Rooms**: Generate encrypted rooms with passphrase-protected keys
- **Join Rooms**: Enter room code and passphrase to join existing secure sessions
- **Auto-Encryption**: Messages in active sessions are automatically encrypted
- **Auto-Decryption**: Members with active sessions see decrypted messages automatically
- **Ephemeral Keys**: Room keys stored only in memory, cleared on page refresh

## Setup

1. **Configure Worker URL**: 
   - Go to Vencord Settings → Plugins → ShadowGuard
   - Enter your Cloudflare Worker URL

2. **Create a Room**:
   - Click the ShadowGuard icon in the chat bar
   - Select "Create room (c)"
   - Enter a passphrase
   - Share the generated room code with others

3. **Join a Room**:
   - Click the ShadowGuard icon
   - Select "Join room (j)"
   - Enter the room code and passphrase

## How It Works

1. **Room Creation**: 
   - Generates a 256-bit random room key
   - Encrypts the key with passphrase-derived key (Argon2id + XChaCha20-Poly1305)
   - Stores encrypted blob in Cloudflare Worker KV (60min TTL)
   - Returns 8-character room code

2. **Room Joining**:
   - Fetches encrypted blob from worker using room code
   - Derives decryption key from passphrase
   - Decrypts room key and stores in memory

3. **Message Flow**:
   - Outgoing messages: Encrypted with room key (XChaCha20-Poly1305)
   - Incoming messages: Auto-decrypted if session is active
   - Non-members: See raw `[SECURE-MSG] <base64>` ciphertext

## Security Notes

- Room keys exist only in browser memory (cleared on refresh)
- Worker never sees plaintext keys or passphrases
- Uses Argon2id for key derivation (64MB memory, 3 passes)
- Uses XChaCha20-Poly1305 for encryption (AEAD)
- Room codes expire after 60 minutes

## Requirements

- Cloudflare Worker with KV namespace (see worker implementation)
- All participants must have the plugin installed
- Desktop only (Vencord/BetterDiscord)

## Limitations

- Discord TOS violation risk (using modded clients)
- Desktop-only (no mobile support)
- Requires all participants to install plugin
- Worker KV has ~60s propagation delay
