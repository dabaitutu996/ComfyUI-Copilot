// Copyright (C) 2025 AIDC-AI
// Licensed under the MIT License.

/** Verify an OpenAI-compatible API by calling the local ComfyUI route. */
export async function verifyOpenAiApiKey(apiKey: string, baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch('/verify_openai_key', {
      method: 'GET',
      headers: {
        'Openai-Api-Key': apiKey,
        'Openai-Base-Url': baseUrl,
      },
    });

    const result = await response.json();
    return result.success && result.data === true;
  } catch (error) {
    console.error('Error verifying OpenAI-compatible API:', error);
    return false;
  }
}
