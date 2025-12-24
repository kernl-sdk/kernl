export function skipIfNoCredentials() {
  if (!process.env.AGENTMAIL_API_KEY || !process.env.AGENTMAIL_INBOX_ID) {
    return true;
  }
  return false;
}

export function trackThread(_id: string) {
  // Threads are auto-created when sending messages
  // and typically don't need cleanup
}

export async function cleanup() {
  // Drafts are cleaned up inline in tests via deleteDraft tool
  // This is a no-op for now but kept for consistency
  createdDrafts.length = 0;
}
