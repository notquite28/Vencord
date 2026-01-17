/**
 * ShadowGuard Cloudflare Worker
 * Handles ephemeral storage of encrypted room keys
 */

interface Env {
    ROOMS: KVNamespace;
}

interface CreateRoomRequest {
    roomCode: string;
    encryptedBlob: string;
}

// Rate limiting: track attempts per IP + roomCode
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Rate limit: max 10 attempts per IP+roomCode per hour
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 3600000; // 1 hour in ms

function getRateLimitKey(ip: string, roomCode: string): string {
    return `${ip}:${roomCode}`;
}

function checkRateLimit(ip: string, roomCode: string): boolean {
    const key = getRateLimitKey(ip, roomCode);
    const now = Date.now();
    const limit = rateLimitMap.get(key);

    if (!limit || now > limit.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (limit.count >= RATE_LIMIT_MAX) {
        return false;
    }

    limit.count++;
    return true;
}

function getClientIP(request: Request): string {
    // Try CF-Connecting-IP header (Cloudflare)
    const cfIp = request.headers.get("CF-Connecting-IP");
    if (cfIp) return cfIp;

    // Fallback to X-Forwarded-For
    const forwarded = request.headers.get("X-Forwarded-For");
    if (forwarded) return forwarded.split(",")[0].trim();

    // Last resort
    return "unknown";
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // CORS headers
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        // Handle OPTIONS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        // POST /room - Create room
        if (request.method === "POST" && url.pathname === "/room") {
            try {
                const body: CreateRoomRequest = await request.json();

                if (!body.roomCode || !body.encryptedBlob) {
                    return new Response(
                        JSON.stringify({ error: "Missing roomCode or encryptedBlob" }),
                        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }

                // Validate room code format (alphanumeric, 8-12 chars)
                if (!/^[A-Z0-9]{8,12}$/i.test(body.roomCode)) {
                    return new Response(
                        JSON.stringify({ error: "Invalid room code format" }),
                        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                    );
                }

                // Store encrypted blob with 60 minute TTL
                await env.ROOMS.put(
                    body.roomCode.toUpperCase(),
                    body.encryptedBlob,
                    { expirationTtl: 3600 } // 60 minutes
                );

                return new Response(
                    JSON.stringify({ success: true, roomCode: body.roomCode.toUpperCase() }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            } catch (error) {
                return new Response(
                    JSON.stringify({ error: "Invalid request" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        // GET /room/:roomCode - Get room
        if (request.method === "GET" && url.pathname.startsWith("/room/")) {
            const roomCode = url.pathname.split("/room/")[1]?.toUpperCase();

            if (!roomCode || !/^[A-Z0-9]{8,12}$/i.test(roomCode)) {
                return new Response(
                    JSON.stringify({ error: "Invalid room code" }),
                    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Rate limiting
            const clientIP = getClientIP(request);
            if (!checkRateLimit(clientIP, roomCode)) {
                return new Response(
                    JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
                    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            // Get encrypted blob from KV
            const encryptedBlob = await env.ROOMS.get(roomCode);

            if (!encryptedBlob) {
                return new Response(
                    JSON.stringify({ error: "Room not found or expired" }),
                    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }

            return new Response(
                JSON.stringify({ encryptedBlob }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // 404 for unknown routes
        return new Response(
            JSON.stringify({ error: "Not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    },
};
