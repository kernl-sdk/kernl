export interface Speaker {
  id: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface Segment {
  index: number;
  text: string;
  raw_text?: string;
  start_sec?: number;
  end_sec?: number;
  speaker_id?: string;
  speaker_name?: string;
  metadata?: Record<string, unknown>;
}

export interface Transcript {
  id: string;
  title?: string;
  speakers?: Speaker[];
  participants?: string[];
  duration?: number; // seconds
  audio_url?: string;
  video_url?: string;
  meeting_link?: string;
  summary?: string;
  analytics?: Record<string, unknown>;
  segments: Segment[];
  timestamp?: string; // epoch ms
  metadata?: unknown;
}
