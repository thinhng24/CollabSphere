import React, { useState, useEffect } from "react";
import { Document as DocumentType } from "../../types";
import { cn, formatFileSize } from "../../lib/utils";
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  AlertCircle,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface DocumentPreviewProps {
  document: DocumentType;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (documentId: string) => void;
}

type PreviewType = "image" | "pdf" | "video" | "audio" | "text" | "unsupported";

const getPreviewType = (contentType: string): PreviewType => {
  if (contentType.startsWith("image/")) return "image";
  if (contentType === "application/pdf") return "pdf";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  if (
    contentType.startsWith("text/") ||
    contentType === "application/json" ||
    contentType === "application/javascript"
  )
    return "text";
  return "unsupported";
};

const PreviewIcon: React.FC<{ type: PreviewType; size?: number }> = ({
  type,
  size = 48,
}) => {
  const iconProps = { size, className: "text-gray-400" };

  switch (type) {
    case "image":
      return <ImageIcon {...iconProps} />;
    case "video":
      return <Video {...iconProps} />;
    case "audio":
      return <Music {...iconProps} />;
    case "pdf":
    case "text":
      return <FileText {...iconProps} />;
    default:
      return <File {...iconProps} />;
  }
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);

  const previewType = getPreviewType(document.contentType);
  const previewUrl = document.previewUrl || document.downloadUrl;

  // Reset state when document changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setZoom(100);
    setRotation(0);
    setTextContent(null);
  }, [document.id]);

  // Load text content for text files
  useEffect(() => {
    if (previewType === "text" && isOpen) {
      fetch(previewUrl)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text);
          setIsLoading(false);
        })
        .catch(() => {
          setError("Failed to load text content");
          setIsLoading(false);
        });
    }
  }, [previewType, previewUrl, isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.document.addEventListener("keydown", handleKeyDown);
      // Prevent scrolling when modal is open
      window.document.body.style.overflow = "hidden";
    }

    return () => {
      window.document.removeEventListener("keydown", handleKeyDown);
      window.document.body.style.overflow = "";
    };
  }, [isOpen, isFullscreen, onClose]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleImageLoad = () => setIsLoading(false);
  const handleImageError = () => {
    setIsLoading(false);
    setError("Failed to load image");
  };

  const handleDownload = () => {
    onDownload?.(document.id);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isOpen) return null;

  const renderPreview = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <AlertCircle size={48} className="mb-4 text-red-400" />
          <p className="text-lg font-medium">Preview unavailable</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={handleDownload}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Download instead
          </button>
        </div>
      );
    }

    switch (previewType) {
      case "image":
        return (
          <div className="relative w-full h-full flex items-center justify-center overflow-auto">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}
            <img
              src={previewUrl}
              alt={document.fileName}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        );

      case "pdf":
        return (
          <iframe
            src={`${previewUrl}#view=FitH`}
            title={document.fileName}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError("Failed to load PDF");
            }}
          />
        );

      case "video":
        return (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video
              src={previewUrl}
              controls
              autoPlay={false}
              className="max-w-full max-h-full"
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError("Failed to load video");
              }}
            >
              Your browser does not support video playback.
            </video>
          </div>
        );

      case "audio":
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Music size={48} className="text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-4">
              {document.fileName}
            </p>
            <audio
              src={previewUrl}
              controls
              className="w-full max-w-md"
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError("Failed to load audio");
              }}
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        );

      case "text":
        return (
          <div className="w-full h-full overflow-auto p-4 bg-gray-50">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <pre className="text-sm font-mono whitespace-pre-wrap break-words text-gray-800">
                {textContent}
              </pre>
            )}
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <PreviewIcon type={previewType} size={64} />
            <p className="text-lg font-medium mt-4">Preview not available</p>
            <p className="text-sm mt-1 text-gray-400">{document.contentType}</p>
            <button
              onClick={handleDownload}
              className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Download size={18} />
              Download file
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200",
          isFullscreen
            ? "w-screen h-screen rounded-none"
            : "w-[90vw] max-w-5xl h-[85vh]",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            <PreviewIcon type={previewType} size={24} />
            <div className="min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {document.fileName}
              </h3>
              <p className="text-xs text-gray-500">
                {document.fileExtension.toUpperCase()} •{" "}
                {formatFileSize(document.fileSize)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Zoom controls for images */}
            {previewType === "image" && !error && (
              <>
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 25}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    zoom <= 25
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-200",
                  )}
                  title="Zoom out"
                >
                  <ZoomOut size={18} />
                </button>
                <span className="text-sm text-gray-600 min-w-[50px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    zoom >= 200
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-600 hover:bg-gray-200",
                  )}
                  title="Zoom in"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
                  title="Rotate"
                >
                  <RotateCw size={18} />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
              </>
            )}

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Open in new tab */}
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={18} />
            </a>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"
              title="Download"
            >
              <Download size={18} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors ml-1"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {renderPreview()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <span>
            Uploaded by {document.uploadedByUserName} •{" "}
            {new Date(document.createdAt).toLocaleDateString()}
          </span>
          <span>
            Downloaded {document.downloadCount} time
            {document.downloadCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
