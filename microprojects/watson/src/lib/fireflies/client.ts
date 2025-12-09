import type { Transcript, Segment, Speaker } from "@/types/transcript";
import type { Codec } from "../codec";

const API_URL = "https://api.fireflies.ai/graphql";

const TRANSCRIPT_GET = `
  query Transcript($transcriptId: String!) {
    transcript(id: $transcriptId) {
      id
      title
      date
      duration
      speakers { id name }
      sentences {
        index
        speaker_name
        speaker_id
        text
        raw_text
        start_time
        end_time
      }
      participants
      audio_url
      video_url
      meeting_link
      summary {
        overview
        action_items
        keywords
      }
    }
  }
`;

// --- Fireflies API Types ---

interface FFSpeaker {
  id: string;
  name: string;
}

interface FFSentence {
  index: number;
  speaker_name: string;
  speaker_id: string;
  text: string;
  raw_text: string;
  start_time: number;
  end_time: number;
}

interface FFTranscript {
  id: string;
  title: string;
  date: string;
  duration: number;
  speakers: FFSpeaker[];
  sentences: FFSentence[];
  participants: string[];
  audio_url?: string;
  video_url?: string;
  meeting_link?: string;
  summary?: {
    overview?: string;
    action_items?: string[];
    keywords?: string[];
  };
}

// --- Client ---

export interface FirefliesConfig {
  apiKey: string;
}

class Transcripts {
  constructor(private client: Fireflies) {}

  async get(id: string): Promise<Transcript> {
    const data = await this.client.query<{ transcript: FFTranscript }>(
      TRANSCRIPT_GET,
      {
        transcriptId: id,
      },
    );

    if (!data.transcript) {
      throw new Error(`Transcript not found: ${id}`);
    }

    return TranscriptCodec.decode(data.transcript);
  }
}

export class Fireflies {
  private apiKey: string;

  transcripts: Transcripts;

  constructor(config: FirefliesConfig) {
    this.apiKey = config.apiKey;
    this.transcripts = new Transcripts(this);
  }

  async query<T>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<T> {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new Error(`Fireflies API error: ${res.status}`);
    }

    const json = (await res.json()) as { data?: T; errors?: unknown[] };

    if (json.errors) {
      throw new Error(
        `Fireflies GraphQL error: ${JSON.stringify(json.errors)}`,
      );
    }

    return json.data as T;
  }
}

// --- Codec: FFTranscript <-> Transcript ---

/**
 * Bidirectional codec for converting between Fireflies API format and our normalized Transcript.
 *
 * - decode: FFTranscript -> Transcript (API response to domain)
 * - encode: Transcript -> FFTranscript (domain to API format, for future write ops)
 */
const TranscriptCodec: Codec<Transcript, FFTranscript> = {
  /**
   * Transcript -> FFTranscript (domain to API format)
   */
  encode(t: Transcript): FFTranscript {
    return {
      id: t.id,
      title: t.title ?? "",
      date: t.timestamp ?? "",
      duration: t.duration ?? 0,
      speakers: (t.speakers ?? []).map((s) => ({
        id: s.id,
        name: s.name ?? "",
      })),
      sentences: t.segments.map((s) => ({
        index: s.index,
        speaker_name: s.speaker_name ?? "",
        speaker_id: s.speaker_id ?? "",
        text: s.text,
        raw_text: s.raw_text ?? s.text,
        start_time: s.start_sec ?? 0,
        end_time: s.end_sec ?? 0,
      })),
      participants: t.participants ?? [],
      audio_url: t.audio_url,
      video_url: t.video_url,
      meeting_link: t.meeting_link,
    };
  },

  /**
   * FFTranscript -> Transcript (API response to domain)
   */
  decode(ff: FFTranscript): Transcript {
    const speakers: Speaker[] = ff.speakers.map((s) => ({
      id: s.id,
      name: s.name,
    }));

    const segments: Segment[] = ff.sentences.map((s) => ({
      index: s.index,
      text: s.text,
      raw_text: s.raw_text,
      start_sec: s.start_time,
      end_sec: s.end_time,
      speaker_id: s.speaker_id,
      speaker_name: s.speaker_name,
    }));

    return {
      id: ff.id,
      title: ff.title,
      speakers,
      participants: ff.participants,
      duration: ff.duration,
      audio_url: ff.audio_url,
      video_url: ff.video_url,
      meeting_link: ff.meeting_link,
      summary: ff.summary?.overview,
      segments,
      timestamp: ff.date,
      metadata: {
        source: "fireflies",
        keywords: ff.summary?.keywords,
        action_items: ff.summary?.action_items,
      },
    };
  },
};
