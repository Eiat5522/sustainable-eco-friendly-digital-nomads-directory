'use client';

import { useCallback, useState } from 'react';

type SelectedFilesState = {
  readonly names: readonly string[];
};

export default function FileUploadClient() {
  const [files, setFiles] = useState<SelectedFilesState>({ names: [] });

  const updateFiles = useCallback((nextFiles: readonly File[]) => {
    setFiles({ names: nextFiles.map(file => file.name) });
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      updateFiles(Array.from(event.target.files ?? []));
    },
    [updateFiles]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      updateFiles(Array.from(event.dataTransfer.files ?? []));
    },
    [updateFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Test File Upload</h1>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Choose a file</span>
        <input
          aria-label="Choose file"
          className="rounded border border-neutral-300 p-3"
          onChange={handleInputChange}
          type="file"
        />
      </label>

      <section
        className="flex min-h-24 items-center justify-center rounded border-2 border-dashed border-neutral-400 bg-neutral-50 p-6 text-sm text-neutral-700"
        data-testid="file-drop-zone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="region"
        aria-label="File drop zone"
      >
        Drag & drop a file here
      </section>

      {files.names.length > 0 ? (
        <section className="rounded border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Selected files</h2>
          <ul className="mt-2 list-disc pl-6 text-sm text-neutral-800">
            {files.names.map(name => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-neutral-600">No files selected yet.</p>
      )}
    </main>
  );
}
