# Quick Setup Guide

## Step-by-Step Deployment

### 1. Install Wrangler

```bash
pnpm add -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

### 3. Create KV Namespaces

Run these commands and **copy the IDs**:

```bash
# Production namespace
wrangler kv namespace create "ROOMS"

# Preview namespace (for testing)
wrangler kv namespace create "ROOMS" --preview
```

### 4. Update wrangler.toml

Open `wrangler.toml` and replace the placeholder IDs:

```toml
[[kv_namespaces]]
binding = "ROOMS"
id = "paste-production-id-here"        # From step 3
preview_id = "paste-preview-id-here"   # From step 3
```

### 5. Install Dependencies

```bash
cd worker
pnpm install
```

### 6. Test Locally (Optional)

```bash
pnpm dev
```

This starts a local dev server. You can test the endpoints at `http://localhost:8787`

### 7. Deploy

```bash
pnpm deploy
```

After deployment, you'll see output like:
```
✨  Deployed to https://discord-secure-room-worker.your-username.workers.dev
```

### 8. Configure Plugin

1. Copy the worker URL from step 7
2. Open Vencord Settings → Plugins → Discord Secure Room
3. Paste the URL in "Worker URL" field
4. Save settings

## Testing the Worker

### Test Create Room

```bash
curl -X POST https://your-worker.workers.dev/room \
  -H "Content-Type: application/json" \
  -d '{"roomCode":"TEST1234","encryptedBlob":"dGVzdA=="}'
```

### Test Get Room

```bash
curl https://your-worker.workers.dev/room/TEST1234
```

## Troubleshooting

**"Namespace not found"**
- Make sure you updated `wrangler.toml` with the correct KV namespace IDs
- Run `wrangler kv:namespace list` to see your namespaces

**"Authentication required"**
- Run `wrangler login` again

**"Rate limit exceeded"**
- Wait 1 hour or use a different IP/roomCode combination
- Rate limit is 10 attempts per IP+roomCode per hour

**CORS errors in browser**
- Make sure the worker URL is correct
- Check browser console for specific error messages
