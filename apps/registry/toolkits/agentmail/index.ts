import { Toolkit } from "kernl";

import {
  sendMessage,
  listMessages,
  getMessage,
  replyToMessage,
  updateMessage,
} from "./messages";

import {
  createDraft,
  getDraft,
  listDrafts,
  sendDraft,
  updateDraft,
  deleteDraft,
} from "./drafts";

import { listThreads, getThread } from "./threads";

export const agentmail = new Toolkit({
  id: "agentmail",
  description: "Email API for AI agents - send, receive, and manage emails",
  tools: [
    sendMessage,
    listMessages,
    getMessage,
    replyToMessage,
    updateMessage,
    createDraft,
    getDraft,
    listDrafts,
    sendDraft,
    updateDraft,
    deleteDraft,
    listThreads,
    getThread,
  ],
});
