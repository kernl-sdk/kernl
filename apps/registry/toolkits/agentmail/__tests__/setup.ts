export const TEST_INBOX_ID = process.env.AGENTMAIL_TEST_INBOX_ID;

export function skipIfNoCredentials() {
  if (!process.env.AGENTMAIL_API_KEY || !process.env.AGENTMAIL_TEST_INBOX_ID) {
    return true;
  }
  return false;
}

// Track resources created during tests for cleanup
const createdDrafts: Array<{ inboxId: string; draftId: string }> = [];

export function trackDraft(inboxId: string, draftId: string) {
  createdDrafts.push({ inboxId, draftId });
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
