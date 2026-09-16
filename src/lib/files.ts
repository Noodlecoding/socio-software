import { supabase } from './supabaseClient';

// Kept in sync with the 'spec-files' storage bucket's allowed_mime_types —
// the bucket is the real, server-side enforcement; this is what lets us
// reject obviously-bad files before spending an upload round trip, and lets
// us send a MIME type Supabase Storage will actually accept (browsers often
// report an empty or wrong file.type for things like .yaml, so we don't
// trust it — we derive the type we send from the extension ourselves).
const ALLOWED_EXTENSIONS: Record<string, { mime: string; label: string }> = {
  pdf: { mime: 'application/pdf', label: 'Document' },
  csv: { mime: 'text/csv', label: 'Spreadsheet' },
  xls: { mime: 'application/vnd.ms-excel', label: 'Spreadsheet' },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Spreadsheet' },
  json: { mime: 'application/json', label: 'Data File' },
  yaml: { mime: 'text/yaml', label: 'Data File' },
  yml: { mime: 'text/yaml', label: 'Data File' },
  png: { mime: 'image/png', label: 'Image' },
  jpg: { mime: 'image/jpeg', label: 'Image' },
  jpeg: { mime: 'image/jpeg', label: 'Image' }
};

export const ACCEPTED_FILE_EXTENSIONS = Object.keys(ALLOWED_EXTENSIONS)
  .map((ext) => `.${ext}`)
  .join(',');

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

function getExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

export function validateFile(file: File): string | null {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS[ext]) {
    return `.${ext || '?'} isn't a supported file type`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File is larger than 20MB';
  }
  return null;
}

export interface UploadedSpecFile {
  path: string;
  type: string;
}

export async function uploadSpecFile(userId: string, id: string, file: File): Promise<UploadedSpecFile | { error: string }> {
  const ext = getExtension(file.name);
  const meta = ALLOWED_EXTENSIONS[ext];
  if (!meta) {
    return { error: `.${ext || '?'} isn't a supported file type` };
  }

  const path = `${userId}/${id}.${ext}`;
  const { error } = await supabase.storage.from('spec-files').upload(path, file, {
    contentType: meta.mime,
    upsert: false
  });

  if (error) {
    return { error: error.message };
  }

  return { path, type: meta.label };
}

export async function downloadSpecFile(path: string, fileName: string) {
  const { data, error } = await supabase.storage.from('spec-files').createSignedUrl(path, 60, { download: fileName });
  if (error || !data) {
    console.error('Failed to create download link:', error?.message);
    return;
  }
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}

export async function removeSpecFile(path: string) {
  const { error } = await supabase.storage.from('spec-files').remove([path]);
  if (error) console.error('Failed to delete stored file:', error.message);
}
