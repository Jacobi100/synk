import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

/**
 * BCP-47 language tags for the five supported input languages.
 * Displayed in VoiceInput.tsx as a language selector before recording.
 */
export type SupportedLanguage =
  | "yo-NG"   // Yoruba
  | "ig-NG"   // Igbo
  | "ha-NG"   // Hausa
  | "pcm-NG"  // Nigerian Pidgin
  | "en-NG";  // Nigerian English

/** Human-readable label map - import this in VoiceInput.tsx to build the UI. */
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  "yo-NG":  "Yoruba",
  "ig-NG":  "Igbo",
  "ha-NG":  "Hausa",
  "pcm-NG": "Pidgin",
  "en-NG":  "English",
};

/**
 * MIME types the browser MediaRecorder typically produces.
 * Chrome/Firefox → audio/webm, Safari → audio/mp4.
 */
export type AudioMimeType = "audio/webm" | "audio/mp4" | "audio/ogg" | "audio/wav";

export interface TranscribeAudioParams {
  /** Base64-encoded audio string produced by VoiceInput.tsx. */
  audioBase64: string;
  /**
   * MIME type of the recorded audio.
   * Defaults to "audio/webm" - the most common output from browser MediaRecorder.
   */
  mimeType?: AudioMimeType;
  /**
   * Language the user selected before speaking.
   * When provided, injected into the prompt as an explicit hint for Gemini -
   * improves accuracy on code-switched and low-resource Nigerian languages.
   */
  language?: SupportedLanguage;
}

export interface TranscriptionResult {
  /** Clean English transcript ready for the restructure step. */
  transcript: string;
  /**
   * The language Gemini detected or confirmed.
   * Stored on the listing for analytics, regional tuning, and future personalisation.
   */
  detectedLanguage?: string;
}

// ---------------------------------------------------------------------------
// Internal: build the language-aware system prompt
// ---------------------------------------------------------------------------

function buildPrompt(language?: SupportedLanguage): string {
  const languageHint = language
    ? `The speaker has indicated they are speaking in ${LANGUAGE_LABELS[language]} (${language}). Use this as your primary transcription context.`
    : "Detect the language automatically from the audio.";

  return `You are a transcription assistant specialised in Nigerian languages and dialects.

The speaker may be using any of the following: Yoruba, Igbo, Hausa, Nigerian Pidgin English, or Nigerian English. Speakers frequently code-switch, mixing Pidgin with English or local language words mid-sentence. Transcribe naturally and do not force standard British or American English where Nigerian phrasing is clearer.

${languageHint}

Your task:
1. Transcribe the audio faithfully into English. If the speaker uses a local word with no clean English equivalent, keep the word and add a brief clarification in parentheses.
2. Identify the primary language spoken.

Respond with ONLY a JSON object in this exact shape, no markdown, no preamble:
{
  "transcript": "<full English transcription here>",
  "detectedLanguage": "<primary language name, e.g. Yoruba, Igbo, Hausa, Pidgin, English>"
}`;
}

// ---------------------------------------------------------------------------
// Named export
// ---------------------------------------------------------------------------

/**
 * Sends base64-encoded audio to Gemini 2.5 Flash for transcription.
  * Gemini processes the audio natively. No separate STT service required.
 * Supports Yoruba, Igbo, Hausa, Nigerian Pidgin, and Nigerian English.
 *
 * @param params - `{ audioBase64, mimeType?, language? }`
 * @returns `{ transcript: string, detectedLanguage?: string }`
 * @throws `Error` if the API key is missing, the Gemini call fails, or
 *         the response cannot be parsed as valid JSON.
 */
export async function transcribeAudio(
  params: TranscribeAudioParams
): Promise<TranscriptionResult> {
  const { audioBase64, mimeType = "audio/webm", language } = params;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          // 1. Language-aware system instruction as the first text part
          { text: buildPrompt(language) },
          // 2. The audio itself as inline binary data - no STT service needed
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
        ],
      },
    ],
  });

  const raw = result.response.text();

  // ---------------------------------------------------------------------------
  // Parse & validate - Gemini is instructed to return JSON only, but we guard
  // ---------------------------------------------------------------------------
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `Gemini returned non-JSON from transcribeAudio. Raw response: ${raw}`
    );
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).transcript !== "string"
  ) {
    throw new Error(
      `Gemini response missing required "transcript" field. Raw: ${raw}`
    );
  }

  const { transcript, detectedLanguage } = parsed as {
    transcript: string;
    detectedLanguage?: string;
  };

  return {
    transcript: transcript.trim(),
    ...(detectedLanguage ? { detectedLanguage } : {}),
  };
}
