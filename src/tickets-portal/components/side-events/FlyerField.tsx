'use client';

import { useState } from 'react';

const MAX_BYTES = 5 * 1024 * 1024;

/** Uploads through the existing /api/upload (Cloudinary) route; submits the URL as `name`. */
export function FlyerField({
  name = 'flyerUrl',
  initialUrl,
  onChange,
  onUploadingChange,
}: {
  name?: string;
  initialUrl: string;
  onChange?: () => void;
  /** Lets the form block submit while an upload is in flight. */
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function set(next: string) {
    setUrl(next);
    onChange?.();
  }

  async function upload(file: File) {
    setError('');
    if (!file.type.startsWith('image/')) return setError('Choose an image file.');
    if (file.size > MAX_BYTES) return setError('Image must be 5 MB or smaller.');
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const json: { uploadResult?: { secure_url?: string } } = await res.json().catch(() => ({}));
      const secureUrl = json.uploadResult?.secure_url;
      if (!res.ok || !secureUrl) throw new Error('Upload failed');
      set(secureUrl);
    } catch {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  }

  return (
    <div className="space-y-2">
      {url ? (
        <div className="flex items-start gap-3">
          <img src={url} alt="Flyer preview" className="h-40 w-auto max-w-full rounded-md border border-stone-200 object-contain" />
          <button
            type="button"
            onClick={() => set('')}
            className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-600 hover:bg-stone-100"
          >
            Remove
          </button>
        </div>
      ) : null}
      <label className="inline-flex cursor-pointer items-center rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px] font-medium text-stone-700 hover:bg-stone-50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
        {uploading ? 'Uploading…' : url ? 'Replace image' : 'Upload image'}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void upload(file);
          }}
        />
      </label>
      {error ? <p role="alert" className="text-[12px] text-red-700">{error}</p> : null}
      <input type="hidden" name={name} value={url} readOnly />
    </div>
  );
}
