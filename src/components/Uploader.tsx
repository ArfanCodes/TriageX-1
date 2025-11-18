import { useState, useRef } from 'react';

interface UploaderProps {
  onFilesAdded: (files: File[]) => void;
}

function Uploader({ onFilesAdded }: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file: File) =>
      file.type.match(/image\/(png|jpeg|jpg)/)
    );

    if (files.length > 0) {
      onFilesAdded(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file: File) =>
      file.type.match(/image\/(png|jpeg|jpg)/)
    );

    if (files.length > 0) {
      onFilesAdded(files);
    }

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Upload Scans</h2>
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? 'border-primary bg-primary/5 scale-[1.02]'
              : 'border-border hover:border-primary hover:bg-primary/5'
          }
        `}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload medical scan images"
      >
        <svg
          className="w-12 h-12 mx-auto mb-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        
        <p className="text-sm font-semibold text-foreground mb-1">
          Drop images here or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          PNG or JPG • Multiple files supported
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="File input for medical scans"
      />

      <div className="mt-4 text-xs text-muted-foreground">
        <p>💡 Tip: Try sample images from the queue or upload your own X-rays/CT scans</p>
      </div>
    </div>
  );
}

export default Uploader;
