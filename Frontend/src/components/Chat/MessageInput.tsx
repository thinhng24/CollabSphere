import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, Smile, X, Image, File } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useChat } from '../../contexts/ChatContext';
import { MessageType } from '../../types';

interface MessageInputProps {
  conversationId: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  onAttachmentSelect?: (file: File) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  className,
  placeholder = 'Type a message...',
  disabled = false,
  onAttachmentSelect,
}) => {
  const { sendMessage, startTyping, stopTyping } = useChat();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    startTyping(conversationId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 2000);
  }, [conversationId, startTyping, stopTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;
    if (isSending) return;

    setIsSending(true);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(conversationId);

    try {
      await sendMessage({
        conversationId,
        content: trimmedMessage,
        type: MessageType.Text,
      });

      setMessage('');
      setAttachments([]);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
      files.forEach((file) => {
        onAttachmentSelect?.(file);
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const commonEmojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '👋', '🙏'];

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <div className={cn('border-t bg-white', className)}>
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border-b">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg group"
            >
              {file.type.startsWith('image/') ? (
                <Image className="w-4 h-4 text-blue-500" />
              ) : (
                <File className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-sm text-gray-700 max-w-[150px] truncate">
                {file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2 p-3">
        {/* Attachment Button */}
        <button
          onClick={triggerFileInput}
          disabled={disabled}
          className={cn(
            'p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />

        {/* Emoji Picker */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className={cn(
              'p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-white border rounded-lg shadow-lg z-10">
              <div className="flex gap-1">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="p-1 hover:bg-gray-100 rounded text-xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            className={cn(
              'w-full px-4 py-2 bg-gray-100 border-0 rounded-2xl resize-none',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white',
              'placeholder-gray-500 text-gray-900',
              'max-h-[150px] overflow-y-auto',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || isSending || (!message.trim() && attachments.length === 0)}
          className={cn(
            'p-2 rounded-full transition-all',
            message.trim() || attachments.length > 0
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400',
            (disabled || isSending) && 'opacity-50 cursor-not-allowed'
          )}
          title="Send message"
        >
          <Send className={cn('w-5 h-5', isSending && 'animate-pulse')} />
        </button>
      </div>

      {/* Character count (optional) */}
      {message.length > 500 && (
        <div className="px-4 pb-2 text-right">
          <span
            className={cn(
              'text-xs',
              message.length > 1000 ? 'text-red-500' : 'text-gray-400'
            )}
          >
            {message.length} / 1000
          </span>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
