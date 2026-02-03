import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Code,
  File,
} from "lucide-react";

export function getFileIcon(fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
    case "doc":
    case "docx":
    case "txt":
      return {
        icon: FileText,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-950/30",
      };
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
      return {
        icon: ImageIcon,
        color: "text-purple-600 dark:text-purple-400",
        bg: "bg-purple-50 dark:bg-purple-950/30",
      };
    case "mp4":
    case "mov":
    case "avi":
      return {
        icon: Video,
        color: "text-pink-600 dark:text-pink-400",
        bg: "bg-pink-50 dark:bg-pink-950/30",
      };
    case "mp3":
    case "wav":
      return {
        icon: Music,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-50 dark:bg-green-950/30",
      };
    case "zip":
    case "rar":
    case "7z":
      return {
        icon: Archive,
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-50 dark:bg-orange-950/30",
      };
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
    case "html":
    case "css":
      return {
        icon: Code,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950/30",
      };
    default:
      return {
        icon: File,
        color: "text-gray-600 dark:text-gray-400",
        bg: "bg-gray-50 dark:bg-gray-900/30",
      };
  }
}
