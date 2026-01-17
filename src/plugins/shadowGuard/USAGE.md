# ShadowGuard Usage Guide

## Setup

### 1. Install Plugin in Vencord

Copy the `shadowGuard` folder to your Vencord plugins directory:

**For User Plugins (Private):**
```
~/.config/Vencord/userplugins/shadowGuard/
```

**For Official Plugins:**
```
/path/to/vencord/src/userplugins/shadowGuard/
```

### 2. Configure Worker URL

1. Open Discord with Vencord
2. Go to **Settings** → **Vencord** → **Plugins**
3. Find **ShadowGuard** in the plugin list
4. Enable the plugin
5. Click on **ShadowGuard** to open settings
6. Paste your worker URL: `https://shadowguard-worker.arnav-panigrahi.workers.dev`
7. Save settings

### 3. Reload Discord

Press `Ctrl+R` (or `Cmd+R` on Mac) to reload Discord and load the plugin.

## Using ShadowGuard

### Creating a Secure Room

1. Open any Discord channel
2. Look for the **🔒 ShadowGuard icon** in the chat bar (bottom left, near the message input)
3. Click the icon
4. When prompted, type `c` (for Create)
5. Enter a **passphrase** (remember this - you'll need to share it!)
6. A room code will be generated (e.g., `ABC12345`)
7. **Share both the room code AND passphrase** with people you want to join

### Joining a Secure Room

1. Open the Discord channel where the room was created
2. Click the **ShadowGuard icon** in the chat bar
3. When prompted, type `j` (for Join)
4. Enter the **room code** you received
5. Enter the **passphrase** you received
6. You'll see a success message when joined

### Sending Encrypted Messages

Once you're in an active secure room:
- **All messages you send** in that channel are automatically encrypted
- Messages appear as `[SECURE-MSG] <encrypted-data>` to non-members
- Members with the plugin and active session see decrypted messages automatically

### Receiving Encrypted Messages

- If you're in an active secure room, messages are **automatically decrypted** and shown below the encrypted message
- If you're not in the room, you'll only see the encrypted ciphertext
- Non-members (without plugin) see raw encrypted data

## Important Notes

⚠️ **All participants must:**
- Have Vencord/BetterDiscord installed
- Have the ShadowGuard plugin installed and enabled
- Know the room code AND passphrase
- Be in the same Discord channel

⚠️ **Security:**
- Room keys are stored **only in memory** - they're cleared when you refresh Discord
- If you refresh, you'll need to rejoin the room with the code and passphrase
- Rooms expire after 60 minutes
- The worker never sees your passphrase or plaintext keys

⚠️ **Limitations:**
- Desktop only (no mobile support)
- All participants need the plugin
- Using modded Discord clients violates Discord's TOS (use at your own risk)

## Troubleshooting

**"Worker URL not configured"**
- Go to Settings → Plugins → ShadowGuard and add the worker URL

**"Room not found or expired"**
- Room may have expired (60 min TTL)
- Check the room code is correct
- Room may not have propagated yet (wait up to 60 seconds)

**"Failed to join room"**
- Wrong passphrase
- Room expired
- Check browser console (F12) for detailed errors

**Messages not encrypting**
- Make sure you created/joined a room in the current channel
- Check that the session is active (you should have seen a success message)
- Refresh Discord and rejoin if needed

**Messages not decrypting**
- Make sure you joined the room with the correct passphrase
- Check that auto-decrypt is enabled in settings
- Refresh Discord and rejoin if needed
