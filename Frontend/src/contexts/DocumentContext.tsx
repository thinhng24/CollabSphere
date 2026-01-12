import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  Document,
  DocumentSearchRequest,
  DocumentUploadRequest,
  DocumentUploadResponse,
  DocumentUpdateRequest,
  DocumentContextType,
} from "../types";
import { documentApi } from "../services/api.service";
import toast from "react-hot-toast";

const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined,
);

interface DocumentProviderProps {
  children: ReactNode;
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({
  children,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load documents with optional search/filter
  const loadDocuments = useCallback(
    async (request?: DocumentSearchRequest): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await documentApi.search(request || {});
        setDocuments(response.documents || []);
      } catch (error) {
        console.error("Failed to load documents:", error);
        toast.error("Failed to load documents");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Upload a document
  const uploadDocument = useCallback(
    async (
      file: File,
      request?: DocumentUploadRequest,
    ): Promise<DocumentUploadResponse> => {
      setUploadProgress(0);
      try {
        const response = await documentApi.upload(file, request, (progress) => {
          setUploadProgress(progress);
        });

        if (response.success && response.document) {
          setDocuments((prev) => [response.document!, ...prev]);
          toast.success(`${file.name} uploaded successfully`);
        } else {
          toast.error(response.message || "Upload failed");
        }

        return response;
      } catch (error) {
        console.error("Upload failed:", error);
        const errorResponse: DocumentUploadResponse = {
          success: false,
          message: "Upload failed",
          errors: [(error as Error).message],
        };
        toast.error("Upload failed");
        return errorResponse;
      } finally {
        setUploadProgress(0);
      }
    },
    [],
  );

  // Download a document
  const downloadDocument = useCallback(
    async (documentId: string): Promise<void> => {
      try {
        const blob = await documentApi.download(documentId);
        const doc = documents.find((d) => d.id === documentId);
        const fileName = doc?.fileName || "download";

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Update download count locally
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === documentId
              ? {
                  ...d,
                  downloadCount: d.downloadCount + 1,
                  lastDownloadedAt: new Date(),
                }
              : d,
          ),
        );

        toast.success("Download started");
      } catch (error) {
        console.error("Download failed:", error);
        toast.error("Failed to download file");
      }
    },
    [documents],
  );

  // Delete a document
  const deleteDocument = useCallback(
    async (documentId: string): Promise<void> => {
      try {
        await documentApi.delete(documentId);
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(null);
        }
        toast.success("Document deleted");
      } catch (error) {
        console.error("Delete failed:", error);
        toast.error("Failed to delete document");
      }
    },
    [selectedDocument],
  );

  // Update document metadata
  const updateDocument = useCallback(
    async (
      documentId: string,
      request: DocumentUpdateRequest,
    ): Promise<void> => {
      try {
        const updatedDoc = await documentApi.update(documentId, request);
        setDocuments((prev) =>
          prev.map((d) => (d.id === documentId ? updatedDoc : d)),
        );
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(updatedDoc);
        }
        toast.success("Document updated");
      } catch (error) {
        console.error("Update failed:", error);
        toast.error("Failed to update document");
      }
    },
    [selectedDocument],
  );

  // Get preview URL for a document
  const previewDocument = useCallback(
    async (documentId: string): Promise<string | null> => {
      try {
        const response = await documentApi.getPreviewUrl(documentId);
        return response.previewUrl;
      } catch (error) {
        console.error("Preview failed:", error);
        toast.error("Failed to load preview");
        return null;
      }
    },
    [],
  );

  const value: DocumentContextType = {
    documents,
    selectedDocument,
    isLoading,
    uploadProgress,
    loadDocuments,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    updateDocument,
    previewDocument,
  };

  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocument = (): DocumentContextType => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return context;
};

export default DocumentContext;
