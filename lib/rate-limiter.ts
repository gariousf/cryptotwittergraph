// Simple in-memory rate limit tracker for different endpoints

interface RateLimitStatus {
    limit: number;
    remaining: number;
    resetTimestamp: number; // Unix timestamp (seconds) when the limit resets
}

// Store state in memory { endpointKey => RateLimitStatus }
// NOTE: This resets on server restart. Use Redis/DB for persistence.
const rateLimitState = new Map<string, RateLimitStatus>();

const SAFE_REMAINING_BUFFER = 5; // Start waiting if remaining requests are less than this buffer

/**
 * Normalizes an endpoint path to use as a key (e.g., /2/users/123/tweets -> /2/users/:id/tweets)
 * This needs careful adjustment based on the actual endpoints used.
 */
function getEndpointKey(endpointPath: string): string {
    let key = endpointPath;
    // Replace user IDs
    key = key.replace(/^\/2\/users\/(\d+)\//, '/2/users/:id/');
    key = key.replace(/^\/2\/users\/by\/username\/([^\/]+)$/, '/2/users/by/username/:username');
    // Replace tweet IDs
    key = key.replace(/^\/2\/tweets\/(\d+)\//, '/2/tweets/:id/');
    key = key.replace(/^\/2\/users\/\:id\/likes\/(\d+)$/, '/2/users/:id/likes/:tweet_id');
    key = key.replace(/^\/2\/users\/\:id\/retweets\/(\d+)$/, '/2/users/:id/retweets/:tweet_id');
     // Add more specific replacements as needed for other endpoints used...
     // e.g., lists, DMs etc.
    return key;
}


/**
 * Updates the stored rate limit status for an endpoint based on response headers.
 */
export function updateRateLimitState(endpoint: string, headers: Headers): void {
    const key = getEndpointKey(endpoint);
    const limit = parseInt(headers.get('x-rate-limit-limit') || '-1', 10);
    const remaining = parseInt(headers.get('x-rate-limit-remaining') || '-1', 10);
    const reset = parseInt(headers.get('x-rate-limit-reset') || '-1', 10); // UTC epoch seconds

    if (limit !== -1 && remaining !== -1 && reset !== -1) {
        const newState: RateLimitStatus = {
            limit: limit,
            remaining: remaining,
            resetTimestamp: reset,
        };
        rateLimitState.set(key, newState);
        // console.debug(`Rate limit state updated for ${key}: R=${remaining}, Reset=${new Date(reset * 1000).toLocaleTimeString()}`);
    } else {
         // console.debug(`Rate limit headers not found or invalid for ${key}`);
    }
}

/**
 * Checks if a request can proceed based on the stored rate limit state.
 * Waits if necessary. Returns true if request can proceed, false if endpoint unknown.
 */
export async function checkRateLimit(endpoint: string): Promise<boolean> {
    const key = getEndpointKey(endpoint);
    const status = rateLimitState.get(key);
    const nowSeconds = Math.floor(Date.now() / 1000);

    if (!status) {
        // console.debug(`No rate limit state found for ${key}. Proceeding.`);
        return true; // No state yet, allow the request
    }

    if (nowSeconds >= status.resetTimestamp) {
        // console.debug(`Rate limit window reset for ${key}. Proceeding.`);
        // State will be updated by the response headers of the upcoming request
        return true;
    }

    if (status.remaining <= SAFE_REMAINING_BUFFER) {
        const waitSeconds = status.resetTimestamp - nowSeconds;
        if (waitSeconds > 0) {
            console.warn(`Rate limit for ${key} low (${status.remaining}). Waiting for ${waitSeconds} seconds...`);
            await new Promise(resolve => setTimeout(resolve, (waitSeconds + 1) * 1000)); // Wait 1 extra second buffer
            console.log(`Rate limit wait finished for ${key}. Proceeding.`);
            // After waiting, we assume the limit *might* have reset, but let the API call confirm.
            // We don't reset the state here, rely on the next successful call's headers.
            return true;
        }
    }

    // console.debug(`Rate limit OK for ${key} (${status.remaining} remaining). Proceeding.`);
    return true; // Limit not reached or window reset
}

/**
 * Gets the current known status (for debugging or display).
 */
export function getRateLimitStatus(endpoint: string): RateLimitStatus | undefined {
     const key = getEndpointKey(endpoint);
     return rateLimitState.get(key);
} 