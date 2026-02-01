import React, { useState, useMemo } from "react";
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Search,
  Grid,
  List,
  SortAsc,
  SortDesc,
  FolderOpen,
  Upload,
  Loader2,
} from "lucide-react";
import { Document as DocumentType } from "../../types";
import {
  cn,
  formatFileSize,
  formatRelativeTime,
  getFileExtension,
} from "../../lib/utils";

interface DocumentListProps {
  documents: DocumentType[];
  isLoading?: boolean;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  onDownload?: (document: DocumentType) => void;
  onPreview?: (document: DocumentType) => void;
  onDelete?: (document: DocumentType) => void;
  onUpload?: () => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

// Get icon based on file type
const getFileTypeIcon = (contentType: string, className?: string) => {
  if (contentType.startsWith("image/")) {
    return <ImageIcon className={cn("text-green-500", className)} />;
  }
  if (contentType.startsWith("video/")) {
    return <Video className={cn("text-purple-500", className)} />;
  }
  if (contentType.startsWith("audio/")) {
    return <Music className={cn("text-pink-500", className)} />;
  }
  if (contentType === "application/pdf") {
    return <FileText className={cn("text-red-500", className)} />;
  }
  if (contentType.includes("word") || contentType.includes("document")) {
    return <FileText className={cn("text-blue-500", className)} />;
  }
  if (contentType.includes("sheet") || contentType.includes("excel")) {
    return <FileText className={cn("text-green-600", className)} />;
  }
  return <File className={cn("text-gray-500", className)} />;
};

// Get color for file extension badge
const getExtensionColor = (ext: string): string => {
  const colors: Record<string, string> = {
    pdf: "bg-red-100 text-red-700",
    doc: "bg-blue-100 text-blue-700",
    docx: "bg-blue-100 text-blue-700",
    xls: "bg-green-100 text-green-700",
    xlsx: "bg-green-100 text-green-700",
    ppt: "bg-orange-100 text-orange-700",
    pptx: "bg-orange-100 text-orange-700",
    jpg: "bg-purple-100 text-purple-700",
    jpeg: "bg-purple-100 text-purple-700",
    png: "bg-purple-100 text-purple-700",
    gif: "bg-purple-100 text-purple-700",
    mp4: "bg-pink-100 text-pink-700",
    mp3: "bg-pink-100 text-pink-700",
    zip: "bg-yellow-100 text-yellow-700",
    rar: "bg-yellow-100 text-yellow-700",
    txt: "bg-gray-100 text-gray-700",
  };
  return colors[ext.toLowerCase()] || "bg-gray-100 text-gray-700";
};

interface DocumentItemProps {
  document: DocumentType;
  viewMode: "grid" | "list";
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onDownload?: () => void;
  onPreview?: () => void;
  onDelete?: () => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({
  document,
  viewMode,
  isSelected = false,
  onSelect,
  onDownload,
  onPreview,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    window.document.addEventListener("mousedown", handleClickOutside);
    return () =>
      window.document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ext = getFileExtension(document.fileName);

  if (viewMode === "grid") {
    return (
      <div
        className={cn(
          "group relative bg-white rounded-xl border p-4 transition-all hover:shadow-md",
          isSelected
            ? "border-blue-500 ring-2 ring-blue-100"
            : "border-gray-200 hover:border-gray-300",
        )}
      >
        {/* Selection checkbox */}
        {onSelect && (
          <div className="absolute top-3 left-3 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Menu button */}
        <div ref={menuRef} className="absolute top-3 right-3 z-10">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              "opacity-0 group-hover:opacity-100",
              showMenu && "opacity-100 bg-gray-100",
            )}
          >
            <MoreVertical size={16} className="text-gray-500" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
              {document.isPreviewable && onPreview && (
                <button
                  onClick={() => {
                    onPreview();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Eye size={14} />
                  Preview
                </button>
              )}
              {onDownload && (
                <button
                  onClick={() => {
                    onDownload();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <Download size={14} />
                  Download
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* File preview/icon */}
        <div
          className="aspect-square rounded-lg bg-gray-50 flex items-center justify-center mb-3 overflow-hidden cursor-pointer"
          onClick={() => document.isPreviewable && onPreview?.()}
        >
          {document.isPreviewable &&
          document.contentType.startsWith("image/") ? (
            <img
              src={document.previewUrl || document.downloadUrl}
              alt={document.fileName}
              className="w-full h-full object-cover"
            />
          ) : (
            getFileTypeIcon(document.contentType, "w-12 h-12")
          )}
        </div>

        {/* File info */}
        <div>
          <p
            className="font-medium text-gray-900 truncate text-sm"
            title={document.fileName}
          >
            {document.fileName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-xs font-medium uppercase",
                getExtensionColor(ext),
              )}
            >
              {ext}
            </span>
            <span className="text-xs text-gray-500">
              {document.fileSizeFormatted || formatFileSize(document.fileSize)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {formatRelativeTime(document.createdAt)}
          </p>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-3 bg-white rounded-lg border transition-all hover:shadow-sm",
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300",
      )}
    >
      {/* Checkbox */}
      {onSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      )}

      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        {getFileTypeIcon(document.contentType, "w-5 h-5")}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p
          className="font-medium text-gray-900 truncate"
          title={document.fileName}
        >
          {document.fileName}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
          <span>
            {document.fileSizeFormatted || formatFileSize(document.fileSize)}
          </span>
          <span>•</span>
          <span>{formatRelativeTime(document.createdAt)}</span>
          <span>•</span>
          <span>by {document.uploadedByUserName}</span>
        </div>
      </div>

      {/* Extension badge */}
      <span
        className={cn(
          "px-2 py-1 rounded text-xs font-medium uppercase",
          getExtensionColor(ext),
        )}
      >
        {ext}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {document.isPreviewable && onPreview && (
          <button
            onClick={onPreview}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
            title="Preview"
          >
            <Eye size={18} />
          </button>
        )}
        {onDownload && (
          <button
            onClick={onDownload}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
            title="Download"
          >
            <Download size={18} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-100 rounded-lg text-gray-500 hover:text-red-600"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading = false,
  viewMode = "grid",
  onViewModeChange,
  onDownload,
  onPreview,
  onDelete,
  onUpload,
  selectedIds = [],
  onSelectionChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [sortDesc, setSortDesc] = useState(true);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let result = [...documents];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.fileName.toLowerCase().includes(term) ||
          doc.uploadedByUserName.toLowerCase().includes(term),
      );
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case "size":
          comparison = a.fileSize - b.fileSize;
          break;
        case "date":
        default:
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDesc ? -comparison : comparison;
    });

    return result;
  }, [documents, searchTerm, sortBy, sortDesc]);

  const handleSelectAll = (selected: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(selected ? filteredDocuments.map((d) => d.id) : []);
    }
  };

  const handleSelectDocument = (docId: string, selected: boolean) => {
    if (onSelectionChange) {
      if (selected) {
        onSelectionChange([...selectedIds, docId]);
      } else {
        onSelectionChange(selectedIds.filter((id) => id !== docId));
      }
    }
  };

  const isAllSelected =
    filteredDocuments.length > 0 &&
    filteredDocuments.every((d) => selectedIds.includes(d.id));

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "name" | "date" | "size")
            }
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>

          <button
            onClick={() => setSortDesc(!sortDesc)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            title={sortDesc ? "Descending" : "Ascending"}
          >
            {sortDesc ? <SortDesc size={20} /> : <SortAsc size={20} />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          {onViewModeChange && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange("grid")}
                className={cn(
                  "p-1.5 rounded",
                  viewMode === "grid"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500",
                )}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => onViewModeChange("list")}
                className={cn(
                  "p-1.5 rounded",
                  viewMode === "list"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500",
                )}
              >
                <List size={18} />
              </button>
            </div>
          )}

          {/* Upload button */}
          {onUpload && (
            <button
              onClick={onUpload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload size={18} />
              Upload
            </button>
          )}
        </div>
      </div>

      {/* Selection bar */}
      {onSelectionChange && selectedIds.length > 0 && (
        <div className="flex items-center gap-4 px-4 py-2 bg-blue-50 border-b border-blue-200">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-blue-700">
            {selectedIds.length} selected
          </span>
          <button
            onClick={() => onSelectionChange([])}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
          <div className="flex-1" />
          <button className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
            <Trash2 size={14} />
            Delete selected
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FolderOpen className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {searchTerm ? "No documents found" : "No documents yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Upload documents to get started"}
            </p>
            {!searchTerm && onUpload && (
              <button
                onClick={onUpload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload size={18} />
                Upload your first document
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredDocuments.map((doc) => (
              <DocumentItem
                key={doc.id}
                document={doc}
                viewMode="grid"
                isSelected={selectedIds.includes(doc.id)}
                onSelect={
                  onSelectionChange
                    ? (s) => handleSelectDocument(doc.id, s)
                    : undefined
                }
                onDownload={onDownload ? () => onDownload(doc) : undefined}
                onPreview={onPreview ? () => onPreview(doc) : undefined}
                onDelete={onDelete ? () => onDelete(doc) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Select all header */}
            {onSelectionChange && (
              <div className="flex items-center gap-4 px-3 py-2">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">Select all</span>
              </div>
            )}
            {filteredDocuments.map((doc) => (
              <DocumentItem
                key={doc.id}
                document={doc}
                viewMode="list"
                isSelected={selectedIds.includes(doc.id)}
                onSelect={
                  onSelectionChange
                    ? (s) => handleSelectDocument(doc.id, s)
                    : undefined
                }
                onDownload={onDownload ? () => onDownload(doc) : undefined}
                onPreview={onPreview ? () => onPreview(doc) : undefined}
                onDelete={onDelete ? () => onDelete(doc) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList;
