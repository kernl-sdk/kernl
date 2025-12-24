import { Alai } from "../client";

export function getClient() {
  const apiKey = process.env.ALAI_API_KEY;
  if (!apiKey) {
    throw new Error("ALAI_API_KEY is required for integration tests");
  }
  return new Alai({ apiKey });
}

export function skipIfNoCredentials() {
  if (!process.env.ALAI_API_KEY) {
    return true;
  }
  return false;
}
