import { randomID } from "@kernl-sdk/shared/lib";

/**
 * In-memory session store.
 * Maps OpenCode sessions ↔ kernl threads.
 */

export interface Session {
  id: string;
  projectID: string;
  directory: string;
  parentID?: string;
  title: string;
  version: string;
  time: {
    created: number;
    updated: number;
  };
}

const sessions = new Map<string, Session>();

export function list(): Session[] {
  return Array.from(sessions.values()).sort(
    (a, b) => b.time.updated - a.time.updated,
  );
}

export function get(id: string): Session | undefined {
  return sessions.get(id);
}

export function create(data?: Partial<Session>): Session {
  const now = Date.now();
  const session: Session = {
    id: data?.id ?? randomID(),
    projectID: "default",
    directory: process.cwd(),
    title: "",
    version: "1",
    time: {
      created: now,
      updated: now,
    },
    ...data,
  };
  sessions.set(session.id, session);
  return session;
}

export function update(
  id: string,
  data: Partial<Session>,
): Session | undefined {
  const existing = sessions.get(id);
  if (!existing) return undefined;

  const updated: Session = {
    ...existing,
    ...data,
    id,
    time: {
      ...existing.time,
      updated: Date.now(),
    },
  };
  sessions.set(id, updated);
  return updated;
}

export function remove(id: string): boolean {
  return sessions.delete(id);
}
