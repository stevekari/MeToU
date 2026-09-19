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

      if (parsed.type === 'image') {
        return {
          type: 'image',
          mediaUrl: parsed.mediaUrl || parsed.dataUrl || parsed.url,
          fileName: parsed.fileName ?? 'photo',
          fileSize: parsed.fileSize,
        };
      }

      if (parsed.type === 'audio') {
        return {
          type: 'audio',
          mediaUrl: parsed.mediaUrl || parsed.dataUrl || parsed.url,
          durationSec: parsed.durationSec ?? null,
        };
      }

      if (parsed.type === 'document' || parsed.type === 'file') {
        return {
          type: 'file',
          mediaUrl: parsed.mediaUrl || parsed.dataUrl || parsed.url,
          fileName: parsed.fileName ?? 'document',
          fileSize: parsed.fileSize ?? null,
          contentType: parsed.contentType ?? parsed.mimeType ?? 'application/octet-stream',
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
  if (parsed.type === 'image') return '📷 [Photo]';
  if (parsed.type === 'audio') return '🎙️ [Voice message]';
  if (parsed.type === 'file') return `📄 ${parsed.fileName || 'Document'}`;
  if (parsed.type === 'call') return parsed.mediaType === 'video' ? '📹 [Video call]' : '📞 [Voice call]';

  const text = parsed.text?.trim() ?? '';
  return text || null;
}
