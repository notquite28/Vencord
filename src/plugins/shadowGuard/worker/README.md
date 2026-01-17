# ShadowGuard Cloudflare Worker

Serverless backend for ephemeral encrypted room key storage.

## Features

- **POST /room**: Store encrypted room key blob (60min TTL)
- **GET /room/:roomCode**: Retrieve encrypted blob by room code
- **Rate Limiting**: 10 attempts per IP+roomCode per hour
- **CORS Enabled**: Allows requests from browser plugins

## Setup

### 1. Install Wrangler CLI

```bash
pnpm add -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create KV Namespace

```bash
# Create production namespace
wrangler kv namespace create "ROOMS"

# Create preview namespace (for dev)
wrangler kv namespace create "ROOMS" --preview
```

Copy the `id` and `preview_id` from the output and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "ROOMS"
id = "your-production-id-here"
preview_id = "your-preview-id-here"
```

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Deploy

```bash
# Deploy to production
pnpm deploy

# Or deploy to preview
pnpm deploy:preview
```

### 6. Get Worker URL

After deployment, Wrangler will output your worker URL:
```
https://shadowguard-worker.your-subdomain.workers.dev
```

Copy this URL and configure it in the ShadowGuard plugin settings.

## Development

```bash
# Run local dev server
pnpm dev
```

## API Endpoints

### POST /room

Create a new room and store encrypted blob.

**Request:**
```json
{
  "roomCode": "ABC12345",
  "encryptedBlob": "base64-encoded-encrypted-data"
}
```

**Response:**
```json
{
  "success": true,
  "roomCode": "ABC12345"
}
```

### GET /room/:roomCode

Retrieve encrypted blob by room code.

**Response:**
```json
{
  "encryptedBlob": "base64-encoded-encrypted-data"
}
```

**Errors:**
- `404`: Room not found or expired
- `429`: Rate limit exceeded
- `400`: Invalid room code format

## Security Notes

- Worker never sees plaintext keys or passphrases
- Encrypted blobs automatically expire after 60 minutes
- Rate limiting prevents brute-force attacks
- Room codes must be 8-12 alphanumeric characters

## Rate Limiting

- **Limit**: 10 attempts per IP + roomCode combination
- **Window**: 1 hour
- **Purpose**: Prevent brute-force attacks on room codes

## TTL Behavior

- Rooms expire after 60 minutes (3600 seconds)
- Expired rooms return 404
- KV automatically cleans up expired entries
