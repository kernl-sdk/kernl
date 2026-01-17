import { createHash, randomBytes } from "node:crypto";

/**
 * Generate a random string for PKCE verifier.
 */
function generateVerifier(length = 43): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generate SHA256 hash and base64url encode it.
 */
function sha256Base64Url(data: string): string {
  const hash = createHash("sha256").update(data).digest("base64");
  return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generate PKCE code verifier and challenge.
 */
export function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = generateVerifier();
  const challenge = sha256Base64Url(verifier);
  return { verifier, challenge };
}

/**
 * Generate a random state string.
 */
export function generateState(): string {
  return randomBytes(32).toString("base64url");
}
