"use client";

import { nanoid } from "nanoid";

import { Chat } from "@/components/chat/chat";

export default function Home() {
  const id = `sess_${nanoid()}`;

  return <Chat id={id} key={id} initialAgent="jarvis" />;
}
