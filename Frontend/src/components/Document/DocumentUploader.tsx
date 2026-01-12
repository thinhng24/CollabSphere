import React, { useRef, useState, useCallback } from 'react';
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  Film,
  Music,
  Archive,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn, formatFileSize, getFileExtension } from '../../lib/utils';
import { useDocument } from '../../contexts/DocumentContext';
import { DocumentUploadRequest } from '../../types';

interface DocumentUploaderProps {
  conversationId?: string;
  groupId?: string;
  onUploadComplete?: (documentId: string) => void;
  onClose?: () => void;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  multiple?: boolean;
  className?: string;
}

interface FileWithProgress {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  documentId?: string;
}

const getFileIcon = (contentType: string) => {
  if (contentType.startsWith('image/')) return <Image className="w-8 h-8" />;
  if (contentType.startsWith('video/')) return <Film className="w-8 h-8" />;
  if (contentType.startsWith('audio/')) return <Music className="w-8 h-8" />;
  if (contentType.includes('pdf') || contentType.includes('document'))
    return <FileText className="w-8 h-8" />;
  if (contentType.includes('zip') || contentType.includes('archive'))
    return <Archive className="w-8 h-8" />;
  return <File className="w-8 h-8" />;
};

const getFileTypeColor = (contentType: string): string => {
  if (contentType.startsWith('image/')) return 'text-blue-500 bg-blue-50';
  if (contentType.startsWith('video/')) return 'text-purple-500 bg-purple-50';
  if (contentType.startsWith('audio/')) return 'text-pink-500 bg-pink-50';
  if (contentType.includes('pdf')) return 'text-red-500 bg-red-50';
  if (contentType.includes('zip')) return 'text-yellow-500 bg-yellow-50';
  return 'text-gray-500 bg-gray-50';
};

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  conversationId,
  groupId,
  onUploadComplete,
  onClose,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  allowedTypes = ['*/*'],
  multiple = true,
  className,
}) => {
  const { uploadDocument } = useDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const generateId = () => Math.random().toString(36).substring(7);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`;
    }

    if (allowedTypes[0] !== '*/*') {
      const isAllowed = allowedTypes.some((type) => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });
      if (!isAllowed) {
        return 'File type not allowed';
      }
    }

    return null;
  };

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const filesToAdd: FileWithProgress[] = [];

      for (const file of fileArray) {
        const error = validateFile(file);
        filesToAdd.push({
          id: generateId(),
          file,
          progress: 0,
          status: error ? 'error' : 'pending',
          error: error || undefined,
        });
      }

      setFiles((prev) => (multiple ? [...prev, ...filesToAdd] : filesToAdd));
    },
    [maxFileSize, allowedTypes, multiple]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    for (const fileItem of pendingFiles) {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileItem.id ? { ...f, status: 'uploading' as const } : f
        )
      );

      try {
        const request: DocumentUploadRequest = {
          conversationId,
          groupId,
        };

        const result = await uploadDocument(fileItem.file, request);

        if (result.success && result.document) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? {
                    ...f,
                    status: 'success' as const,
                    progress: 100,
                    documentId: result.document!.id,
                  }
                : f
            )
          );
          onUploadComplete?.(result.document.id);
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? {
                    ...f,
                    status: 'error' as const,
                    error: result.message || 'Upload failed',
                  }
                : f
            )
          );
        }
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: (error as Error).message || 'Upload failed',
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);
  };

  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const successCount = files.filter((f) => f.status === 'success').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Upload Documents</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'mx-4 my-4 border-2 border-dashed rounded-xl p-8 text-center transition-colors',
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center mb-4',
              isDragOver ? 'bg-blue-100' : 'bg-gray-100'
            )}
          >
            <Upload
              size={28}
              className={isDragOver ? 'text-blue-500' : 'text-gray-400'}
            />
          </div>
          <p className="text-gray-700 font-medium mb-1">
            Drop files here or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              browse
            </button>
          </p>
          <p className="text-sm text-gray-500">
            Maximum file size: {formatFileSize(maxFileSize)}
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-sm text-gray-500 mb-2">
            {files.length} file{files.length > 1 ? 's' : ''} selected
            {successCount > 0 && (
              <span className="text-green-600 ml-2">
                ({successCount} uploaded)
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  fileItem.status === 'error'
                    ? 'border-red-200 bg-red-50'
                    : fileItem.status === 'success'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                )}
              >
                {/* File Icon */}
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    getFileTypeColor(fileItem.file.type)
                  )}
                >
                  {getFileIcon(fileItem.file.type)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileItem.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(fileItem.file.size)} •{' '}
                    {getFileExtension(fileItem.file.name).toUpperCase()}
                  </p>
                  {fileItem.error && (
                    <p className="text-xs text-red-600 mt-0.5">
                      {fileItem.error}
                    </p>
                  )}

                  {/* Progress bar */}
                  {fileItem.status === 'uploading' && (
                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${fileItem.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Status / Actions */}
                <div className="flex-shrink-0">
                  {fileItem.status === 'uploading' ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : fileItem.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : fileItem.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                      title="Remove"
                    >
                      <X size={16} className="text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => setFiles([])}
          disabled={files.length === 0 || isUploading}
          className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear all
        </button>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={uploadAllFiles}
            disabled={pendingCount === 0 || isUploading}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2',
              pendingCount > 0 && !isUploading
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload {pendingCount > 0 ? `(${pendingCount})` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploader;
