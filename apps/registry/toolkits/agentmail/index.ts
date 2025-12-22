import { Toolkit } from "kernl";
import { AgentMailClient } from "agentmail";

import { sendMessage } from "./messages/send";
import { listMessages } from "./messages/list";
import { getMessage } from "./messages/get";
import { replyToMessage } from "./messages/reply";

import { createDraft } from "./drafts/create";
import { getDraft } from "./drafts/get";
import { sendDraft } from "./drafts/send";
import { listDrafts } from "./drafts/list";
import { updateDraft } from "./drafts/update";
import { deleteDraft } from "./drafts/delete";

import { updateMessage } from "./messages/update";

import { listThreads } from "./threads/list";
import { getThread } from "./threads/get";

export const am = new AgentMailClient({
  apiKey: process.env.AGENTMAIL_API_KEY,
});

export const agentmail = new Toolkit({
  id: "agentmail",
  description: "Email API for AI agents - send, receive, and manage emails",
  tools: [
    sendMessage,
    listMessages,
    getMessage,
    replyToMessage,
    createDraft,
    getDraft,
    sendDraft,
    listDrafts,
    updateDraft,
    deleteDraft,
    updateMessage,
    listThreads,
    getThread,
  ],
});
