import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Users, User, Loader2, Check } from 'lucide-react';
import { userApi, UserSearchResult } from '../../services/api.service';
import { useChat } from '../../contexts/ChatContext';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface CreateConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createConversation, selectConversation } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [conversationType, setConversationType] = useState<'private' | 'group'>('private');
  const [groupName, setGroupName] = useState('');

  // Debounced search
  useEffect(() => {
    const searchUsers = async () => {
      setIsLoading(true);
      try {
        const results = await userApi.searchUsers(searchTerm, 1, 20);
        setUsers(results);
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Load initial users when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedUsers([]);
      setConversationType('private');
      setGroupName('');
    }
  }, [isOpen]);

  const toggleUserSelection = useCallback((user: UserSearchResult) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      }
      // For private chat, only allow one user
      if (conversationType === 'private') {
        return [user];
      }
      return [...prev, user];
    });
  }, [conversationType]);

  const handleTypeChange = (type: 'private' | 'group') => {
    setConversationType(type);
    if (type === 'private' && selectedUsers.length > 1) {
      setSelectedUsers([selectedUsers[0]]);
    }
  };

  const handleCreate = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (conversationType === 'group' && !groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    setIsCreating(true);
    try {
      const name = conversationType === 'group'
        ? groupName.trim()
        : selectedUsers[0].fullName || selectedUsers[0].username;

      const conversation = await createConversation({
        name,
        type: conversationType,
        participantIds: selectedUsers.map((u) => u.id),
      });

      await selectConversation(conversation.id);
      onClose();
      toast.success(
        conversationType === 'group'
          ? 'Group created successfully'
          : 'Conversation started'
      );
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            New Conversation
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Type Selection */}
        <div className="flex gap-2 px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => handleTypeChange('private')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              conversationType === 'private'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <User size={16} />
            Private
          </button>
          <button
            onClick={() => handleTypeChange('group')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              conversationType === 'group'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <Users size={16} />
            Group
          </button>
        </div>

        {/* Group Name Input */}
        {conversationType === 'group' && (
          <div className="px-4 py-3 border-b border-gray-100">
            <input
              type="text"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Search Input */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <span
                  key={user.id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {user.fullName || user.username}
                  <button
                    onClick={() => toggleUserSelection(user)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Users size={40} className="mb-2 text-gray-300" />
              <p>No users found</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {users.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id);
                return (
                  <li
                    key={user.id}
                    onClick={() => toggleUserSelection(user)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                      isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                          {(user.fullName || user.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                      {user.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {user.fullName || user.username}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        @{user.username}
                      </p>
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={selectedUsers.length === 0 || isCreating}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2',
              selectedUsers.length === 0 || isCreating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {isCreating && <Loader2 size={16} className="animate-spin" />}
            {conversationType === 'group' ? 'Create Group' : 'Start Chat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateConversationModal;
