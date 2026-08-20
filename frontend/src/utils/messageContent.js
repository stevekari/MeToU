export function parseMessageContent(rawContent) {
  if (typeof rawContent !== 'string') {
    return { type: 'text', text: '' };
  }

  try {
    const parsed = JSON.parse(rawContent);

    if (parsed && typeof parsed === 'object') {
      if (parsed.type === 'text') {
        return { type: 'text', text: parsed.text ?? '' };
      }

      if (parsed.type === 'image' && typeof parsed.dataUrl === 'string') {
        return {
          type: 'image',
          dataUrl: parsed.dataUrl,
          fileName: parsed.fileName ?? 'photo',
        };
      }

      if (parsed.type === 'image' && typeof parsed.mediaUrl === 'string') {
        return {
          type: 'image',
          mediaUrl: parsed.mediaUrl,
          fileName: parsed.fileName ?? 'photo',
        };
      }

      if (parsed.type === 'audio' && typeof parsed.dataUrl === 'string') {
        return {
          type: 'audio',
          dataUrl: parsed.dataUrl,
          durationSec: parsed.durationSec ?? null,
        };
      }

      if (parsed.type === 'audio' && typeof parsed.mediaUrl === 'string') {
        return {
          type: 'audio',
          mediaUrl: parsed.mediaUrl,
          durationSec: parsed.durationSec ?? null,
        };
      }

      if (parsed.type === 'call' || parsed.callType === 'call-end') {
        return {
          type: 'call',
          callId: parsed.callId ?? null,
          mediaType: parsed.mediaType === 'video' ? 'video' : 'voice',
          status: parsed.status === 'completed' ? 'completed' : 'missed',
        };
      }
    }
  } catch {
    // Legacy plain-text messages continue rendering as text.
  }

  return { type: 'text', text: rawContent };
}

export function getMessagePreview(rawContent) {
  if (!rawContent) return null;

  const parsed = parseMessageContent(rawContent);
  if (parsed.type === 'image') return '[Photo]';
  if (parsed.type === 'audio') return '[Voice message]';
  if (parsed.type === 'call') return parsed.mediaType === 'video' ? '[Video call]' : '[Voice call]';

  const text = parsed.text?.trim() ?? '';
  return text || null;
}
