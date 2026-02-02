import React, { useState, useEffect } from "react";
import { useDocument } from "../../contexts/DocumentContext";
import DocumentList from "./DocumentList";
import DocumentUploader from "./DocumentUploader";
import DocumentPreview from "./DocumentPreview";
import { Document as DocumentType, DocumentStatus } from "../../types";
import { cn } from "../../lib/utils";
import {
  FolderOpen,
  HardDrive,
  Clock,
  Star,
  Trash2,
  Upload,
  X,
  ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";

interface DocumentManagerProps {
  conversationId?: string;
  groupId?: string;
  className?: string;
  embedded?: boolean;
  onClose?: () => void;
}

type ViewType = "all" | "recent" | "starred" | "trash";

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  conversationId,
  groupId,
  className,
  embedded = false,
  onClose,
}) => {
  const {
    documents,
    isLoading,
    loadDocuments,
    downloadDocument,
    deleteDocument,
  } = useDocument();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentView, setCurrentView] = useState<ViewType>("all");
  const [showUploader, setShowUploader] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentType | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Load documents on mount and when filters change
  useEffect(() => {
    loadDocuments({
      conversationId,
      groupId,
    });
  }, [loadDocuments, conversationId, groupId]);

  const handleDownload = async (doc: DocumentType) => {
    await downloadDocument(doc.id);
  };

  const handlePreview = (doc: DocumentType) => {
    if (doc.isPreviewable) {
      setPreviewDocument(doc);
    } else {
      toast.error("This file type cannot be previewed");
    }
  };

  const handleDelete = async (doc: DocumentType) => {
    if (window.confirm(`Are you sure you want to delete "${doc.fileName}"?`)) {
      await deleteDocument(doc.id);
    }
  };

  const handleUploadComplete = (documentId: string) => {
    // Reload documents after upload
    loadDocuments({
      conversationId,
      groupId,
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedIds.length} document(s)?`;
    if (window.confirm(confirmMessage)) {
      for (const id of selectedIds) {
        await deleteDocument(id);
      }
      setSelectedIds([]);
    }
  };

  const sidebarItems: {
    id: ViewType;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      id: "all",
      label: "All Documents",
      icon: <FolderOpen size={18} />,
      count: documents?.length || 0,
    },
    { id: "recent", label: "Recent", icon: <Clock size={18} /> },
    { id: "starred", label: "Starred", icon: <Star size={18} /> },
    { id: "trash", label: "Trash", icon: <Trash2 size={18} /> },
  ];

  // Filter documents based on current view
  const filteredDocuments = React.useMemo(() => {
    if (!documents || !Array.isArray(documents)) return [];

    switch (currentView) {
      case "recent":
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return documents.filter((d) => new Date(d.createdAt) >= oneWeekAgo);
      case "starred":
        // Assuming we have a starred property (would need to be added to the type)
        return [];
      case "trash":
        return documents.filter((d) => d.status === DocumentStatus.Deleted);
      case "all":
      default:
        return documents.filter((d) => d.status !== DocumentStatus.Deleted);
    }
  }, [documents, currentView]);

  return (
    <div className={cn("flex h-full bg-gray-50", className)}>
      {/* Sidebar - Hidden in embedded mode */}
      {!embedded && (
        <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HardDrive size={20} />
              Documents
            </h2>
          </div>

          {/* Upload Button */}
          <div className="p-3">
            <button
              onClick={() => setShowUploader(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Upload size={18} />
              Upload
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2">
            <ul className="space-y-1">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentView(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                      currentView === item.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100",
                    )}
                  >
                    <span
                      className={
                        currentView === item.id
                          ? "text-blue-600"
                          : "text-gray-500"
                      }
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.count !== undefined && (
                      <span className="text-xs text-gray-400">
                        {item.count}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Storage Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">Storage used</div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-1/3" />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              3.2 GB of 10 GB used
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Embedded Header */}
        {embedded && (
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <h2 className="font-semibold text-gray-900">Documents</h2>
            </div>
            <button
              onClick={() => setShowUploader(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload size={16} />
              Upload
            </button>
          </div>
        )}

        {/* Document List */}
        <DocumentList
          documents={filteredDocuments}
          isLoading={isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onDownload={handleDownload}
          onPreview={handlePreview}
          onDelete={handleDelete}
          onUpload={() => setShowUploader(true)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowUploader(false)}
          />
          <div className="relative z-10 w-full max-w-xl mx-4">
            <DocumentUploader
              conversationId={conversationId}
              groupId={groupId}
              onUploadComplete={handleUploadComplete}
              onClose={() => setShowUploader(false)}
            />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDocument && (
        <DocumentPreview
          document={previewDocument}
          isOpen={true}
          onClose={() => setPreviewDocument(null)}
          onDownload={(docId) => downloadDocument(docId)}
        />
      )}
    </div>
  );
};

export default DocumentManager;
