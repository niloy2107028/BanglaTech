const HF_AUDIO_MODEL_URL =
  process.env.HF_AUDIO_MODEL_URL ||
  "https://api-inference.huggingface.co/models/openai/whisper-large-v3";

function getHuggingFaceApiKey() {
  const key =
    process.env.HUGGINGFACE_API_KEY ||
    process.env.HF_API_KEY ||
    process.env.HF_TOKEN ||
    "";

  if (!key) {
    const error = new Error(
      "HUGGINGFACE_API_KEY (or HF_API_KEY / HF_TOKEN) is not configured",
    );
    error.status = 503;
    throw error;
  }

  return key;
}

async function transcribeAudioToText(file) {
  if (!file || !file.buffer) {
    throw new Error("Audio file is required");
  }

  const apiKey = getHuggingFaceApiKey();

  const response = await fetch(HF_AUDIO_MODEL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": file.mimetype || "application/octet-stream",
    },
    body: file.buffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(
      `HF Whisper failed (${response.status}): ${errorText}`,
    );
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const text = String(data?.text || "").trim();

  if (!text) {
    throw new Error("No transcription returned from Whisper model");
  }

  return text;
}

module.exports = {
  transcribeAudioToText,
};
