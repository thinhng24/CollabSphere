import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 * This allows for conditional classes and proper Tailwind CSS class merging
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffWeeks < 4) return `${diffWeeks} tuần trước`;
  if (diffMonths < 12) return `${diffMonths} tháng trước`;
  return past.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

/**
 * Format date for message timestamps (Vietnam timezone)
 */
export function formatMessageTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();

  // Convert to Vietnam timezone for comparison
  const vnOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Ho_Chi_Minh",
  };
  const dVN = new Date(d.toLocaleString("en-US", vnOptions));
  const nowVN = new Date(now.toLocaleString("en-US", vnOptions));

  const isToday = dVN.toDateString() === nowVN.toDateString();
  const yesterday = new Date(nowVN);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = dVN.toDateString() === yesterday.toDateString();

  const time = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });

  if (isToday) return time;
  if (isYesterday) return `Hôm qua ${time}`;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

/**
 * Format date for conversation list (Vietnam timezone)
 */
export function formatConversationDate(
  date: Date | string | undefined,
): string {
  if (!date) return "";

  const d = new Date(date);
  const now = new Date();

  // Convert to Vietnam timezone for comparison
  const vnOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Ho_Chi_Minh",
  };
  const dVN = new Date(d.toLocaleString("en-US", vnOptions));
  const nowVN = new Date(now.toLocaleString("en-US", vnOptions));

  const isToday = dVN.toDateString() === nowVN.toDateString();

  const yesterday = new Date(nowVN);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = dVN.toDateString() === yesterday.toDateString();

  if (isToday) {
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });
  }

  if (isYesterday) {
    return "Hôm qua";
  }

  // Within this week
  const weekAgo = new Date(nowVN);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (dVN > weekAgo) {
    const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return weekdays[dVN.getDay()];
  }

  // Older
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

/**
 * Truncate text to a specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

/**
 * Check if file type is previewable
 */
export function isPreviewable(contentType: string): boolean {
  const previewableTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "text/plain",
    "text/html",
    "text/css",
    "text/javascript",
    "application/json",
    "video/mp4",
    "video/webm",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
  ];
  return previewableTypes.includes(contentType);
}

/**
 * Get icon name based on file type
 */
export function getFileIcon(contentType: string): string {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType === "application/pdf") return "pdf";
  if (contentType.includes("word") || contentType.includes("document"))
    return "doc";
  if (contentType.includes("sheet") || contentType.includes("excel"))
    return "spreadsheet";
  if (
    contentType.includes("presentation") ||
    contentType.includes("powerpoint")
  )
    return "presentation";
  if (contentType.startsWith("text/")) return "text";
  if (contentType.includes("zip") || contentType.includes("archive"))
    return "archive";
  return "file";
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate a random color based on string (for avatars)
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    "#EF4444", // red
    "#F97316", // orange
    "#F59E0B", // amber
    "#84CC16", // lime
    "#22C55E", // green
    "#14B8A6", // teal
    "#06B6D4", // cyan
    "#3B82F6", // blue
    "#6366F1", // indigo
    "#8B5CF6", // violet
    "#A855F7", // purple
    "#EC4899", // pink
  ];

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if running in development mode
 */
export function isDev(): boolean {
  return import.meta.env.DEV;
}
