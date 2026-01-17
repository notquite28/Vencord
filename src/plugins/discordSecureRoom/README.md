# Discord Secure Room

Ephemeral, end-to-end encrypted (E2EE) "sub-rooms" within Discord channels. Privacy is achieved by keeping encryption keys completely out-of-band using a serverless worker for temporary key exchange.

## Features

- **Create Secure Rooms**: Generate encrypted rooms with passphrase-protected keys
- **Join Rooms**: Enter room code and passphrase to join existing secure sessions
- **Auto-Encryption**: Messages in active sessions are automatically encrypted
- **Auto-Decryption**: Members with active sessions see decrypted messages automatically
- **Ephemeral Keys**: Room keys stored only in memory, cleared on page refresh
- **Exit Room**: Leave a room to send unencrypted messages without reloading

## Setup

1. **Install Plugin**: Copy the `discordSecureRoom` folder to your Vencord `userplugins` directory
2. **Deploy Worker**: Follow instructions in `worker/SETUP.md` to deploy the Cloudflare Worker
3. **Configure Worker URL**: 
   - Go to Vencord Settings → Plugins → Discord Secure Room
   - Enter your Cloudflare Worker URL

## How It Works (Step-by-Step)

### Step 1: Room Creation

1. User clicks the secure room icon in the chat bar
2. User selects "Create Room" and enters a passphrase
3. Plugin generates a random 256-bit room key
4. Plugin derives an encryption key from the passphrase using PBKDF2 (100,000 iterations)
5. Plugin encrypts the room key using AES-GCM with the derived key
6. Plugin generates an 8-character room code (e.g., `ABC12345`)
7. Plugin sends the encrypted room key blob to the Cloudflare Worker
8. Worker stores it in KV with a 60-minute TTL
9. Plugin stores the room key in memory (browser only)
10. User receives the room code and shares it with others

### Step 2: Room Joining

1. User clicks the secure room icon
2. User selects "Join Room" and enters the room code and passphrase
3. Plugin fetches the encrypted blob from the Worker using the room code
4. Plugin derives the decryption key from the passphrase (same PBKDF2 process)
5. Plugin decrypts the room key using AES-GCM
6. Plugin stores the room key in memory for this channel
7. User is now in the secure room

### Step 3: Sending Encrypted Messages

1. User types a message in a channel with an active secure room
2. Plugin intercepts the message before sending (`onBeforeMessageSend` hook)
3. Plugin checks if channel has an active session
4. Plugin generates a random 96-bit IV (initialization vector)
5. Plugin encrypts the message using AES-GCM with the room key
6. Plugin prepends `[SECURE-MSG]` header to the encrypted data
7. Message is sent to Discord as `[SECURE-MSG] <base64-encrypted-data>`

### Step 4: Receiving and Decrypting Messages

1. Plugin detects incoming messages with `[SECURE-MSG]` header
2. Plugin checks if message is from the last 60 minutes (room TTL)
3. Plugin checks if current channel has an active session
4. If session exists, plugin extracts the encrypted data
5. Plugin decrypts using the room key stored in memory
6. Plugin displays decrypted text below the encrypted message
7. Non-members (without session) only see the raw encrypted data

### Step 5: Room Expiration

1. Worker automatically deletes room data after 60 minutes (KV TTL)
2. Plugin only attempts to decrypt messages from the last 60 minutes
3. Users must create a new room after expiration
4. Room keys are cleared from memory on page refresh

## Security Architecture

- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations
- **Encryption**: AES-GCM (256-bit keys, 96-bit IVs)
- **Room Key Storage**: Only in browser memory (never persisted)
- **Worker Storage**: Only encrypted blobs (never sees plaintext keys or passphrases)
- **Message Age Filter**: Only processes messages from last 60 minutes

## Requirements

- Cloudflare Worker with KV namespace (see `worker/SETUP.md`)
- All participants must have the plugin installed
- Desktop only (Vencord/BetterDiscord)

## Limitations

- Discord TOS violation risk (using modded clients)
- Desktop-only (no mobile support)
- Requires all participants to install plugin
- Worker KV has ~60s propagation delay
- Rooms expire after 60 minutes
