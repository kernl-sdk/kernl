/**
 * Base OAuth credentials.
 */
export interface OAuthCredentials {
  /** Current access token */
  accessToken: string;
  /** Refresh token for obtaining new access tokens */
  refreshToken: string;
  /** Expiration timestamp in milliseconds */
  expiresAt: number;
  /** Called when tokens are refreshed - use to persist new tokens */
  onRefresh?: (tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }) => void;
}

/**
 * OpenAI OAuth credentials (ChatGPT Plus/Pro via Codex).
 */
export interface OpenAIOAuthCredentials extends OAuthCredentials {
  /** Account ID for org/team subscriptions */
  accountId?: string;
}
