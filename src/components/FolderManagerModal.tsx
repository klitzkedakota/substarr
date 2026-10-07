import React, { useState } from 'react';
import { Folder as FolderType } from '../types';
import { FolderIcon } from './FolderIcon';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  ChevronUp,
  ChevronDown,
  FolderTree,
  CornerDownRight,
} from 'lucide-react';

const COLOR_PALETTE = [
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#EC4899', // Pink
  '#F97316', // Orange
  '#64748B', // Slate
];

const ICON_OPTIONS = [
  'Boxes',
  'FlaskConical',
  'Compass',
  'Gamepad2',
  'Laptop',
  'Cpu',
  'Film',
  'Flame',
  'Music',
  'Code',
  'Wrench',
  'BookOpen',
  'Zap',
  'Layers',
];

interface FolderManagerModalProps {
  folders: FolderType[];
  onClose: () => void;
  onCreateFolder: (folder: Omit<FolderType, 'id'>) => void;
  onUpdateFolder: (id: string, updates: Partial<FolderType>) => void;
  onDeleteFolder: (id: string) => void;
  initialParentId?: string | null;
}

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({
  folders,
  onClose,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  initialParentId = null,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(COLOR_PALETTE[0]);
  const [editIcon, setEditIcon] = useState(ICON_OPTIONS[0]);
  const [editParentId, setEditParentId] = useState<string | null>(null);

  // New folder form
  const [isCreating, setIsCreating] = useState(Boolean(initialParentId));
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);
  const [newIcon, setNewIcon] = useState(ICON_OPTIONS[0]);
  const [newParentId, setNewParentId] = useState<string | null>(initialParentId);

  const handleStartEdit = (f: FolderType) => {
    setEditingId(f.id);
    setEditName(f.name);
    setEditColor(f.color || COLOR_PALETTE[0]);
    setEditIcon(f.icon || ICON_OPTIONS[0]);
    setEditParentId(f.parentId);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      onUpdateFolder(editingId, {
        name: editName.trim(),
        color: editColor,
        icon: editIcon,
        parentId: editParentId === 'none' ? null : editParentId,
      });
      setEditingId(null);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onCreateFolder({
      name: newName.trim(),
      color: newColor,
      icon: newIcon,
      parentId: newParentId === 'none' ? null : newParentId,
      order: folders.length,
    });

    setNewName('');
    setIsCreating(false);
  };

  const handleMoveOrder = (folderId: string, direction: 'up' | 'down') => {
    const currentFolder = folders.find((f) => f.id === folderId);
    if (!currentFolder) return;

    const siblings = folders
      .filter((f) => f.parentId === currentFolder.parentId)
      .sort((a, b) => a.order - b.order);

    const index = siblings.findIndex((f) => f.id === folderId);
    if (direction === 'up' && index > 0) {
      const prev = siblings[index - 1];
      onUpdateFolder(currentFolder.id, { order: prev.order });
      onUpdateFolder(prev.id, { order: currentFolder.order });
    } else if (direction === 'down' && index < siblings.length - 1) {
      const next = siblings[index + 1];
      onUpdateFolder(currentFolder.id, { order: next.order });
      onUpdateFolder(next.id, { order: currentFolder.order });
    }
  };

  // Group into tree
  const rootFolders = folders.filter((f) => !f.parentId).sort((a, b) => a.order - b.order);
  const childFoldersMap = new Map<string, FolderType[]>();
  folders.forEach((f) => {
    if (f.parentId) {
      const list = childFoldersMap.get(f.parentId) || [];
      list.push(f);
      childFoldersMap.set(f.parentId, list.sort((a, b) => a.order - b.order));
    }
  });

  const renderFolderRow = (folder: FolderType, isChild = false) => {
    const isEditingThis = editingId === folder.id;

    if (isEditingThis) {
      return (
        <div
          key={folder.id}
          className={`p-3 rounded-lg bg-neutral-900 border border-neutral-700 space-y-3 ${
            isChild ? 'ml-6' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 bg-white/[0.06] border border-white/[0.1] rounded px-2.5 py-1 text-xs text-white"
              autoFocus
            />
            <button
              onClick={handleSaveEdit}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs flex items-center gap-1 font-medium"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
            <button
              onClick={() => setEditingId(null)}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs"
            >
              Cancel
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Parent Folder */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Parent:</span>
              <select
                value={editParentId || 'none'}
                onChange={(e) => setEditParentId(e.target.value === 'none' ? null : e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white text-xs"
              >
                <option value="none">None (Root Folder)</option>
                {folders
                  .filter((f) => f.id !== folder.id && f.parentId !== folder.id)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Icon picker */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Icon:</span>
              <select
                value={editIcon}
                onChange={(e) => setEditIcon(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white text-xs"
              >
                {ICON_OPTIONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </div>

            {/* Color swatches */}
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400">Color:</span>
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setEditColor(c)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    editColor === c ? 'ring-2 ring-white scale-110' : 'opacity-80'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={folder.id} className="space-y-1">
        <div
          className={`flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-colors ${
            isChild ? 'ml-6 border-l-2 border-l-neutral-700' : ''
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {isChild && <CornerDownRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />}
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: folder.color }}
            />
            <FolderIcon iconName={folder.icon} className="w-4 h-4 text-neutral-300" color={folder.color} />
            <span className="text-xs font-medium text-white truncate">{folder.name}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleMoveOrder(folder.id, 'up')}
              title="Move up"
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/[0.05]"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleMoveOrder(folder.id, 'down')}
              title="Move down"
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/[0.05]"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleStartEdit(folder)}
              title="Edit folder"
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/[0.05]"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${folder.name}"? Channels in this folder will become Uncategorized.`)) {
                  onDeleteFolder(folder.id);
                }
              }}
              title="Delete folder"
              className="p-1 text-neutral-500 hover:text-red-400 rounded hover:bg-white/[0.05]"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Render child folders */}
        {(childFoldersMap.get(folder.id) || []).map((child) => renderFolderRow(child, true))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-[#0f1013] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-14 px-6 border-b border-white/[0.07] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <FolderTree className="w-4 h-4 text-red-500" />
            <span>Folder Organization & Tree</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Create new folder card */}
          {isCreating ? (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">New Folder</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-300"
                >
                  Cancel
                </button>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Folder Name (e.g. Lego Experiments, Chemistry)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400"
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">
                    Nest Under Parent:
                  </label>
                  <select
                    value={newParentId || 'none'}
                    onChange={(e) =>
                      setNewParentId(e.target.value === 'none' ? null : e.target.value)
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1.5 text-white"
                  >
                    <option value="none">None (Top-Level Folder)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">Icon:</label>
                  <select
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1.5 text-white"
                  >
                    {ICON_OPTIONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color swatches */}
              <div>
                <label className="block text-neutral-400 mb-1.5 text-[11px]">Color Tag:</label>
                <div className="flex items-center gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        newColor === c ? 'ring-2 ring-white scale-110' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-semibold shadow-xs"
                >
                  Create Folder
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-2.5 px-3 border border-dashed border-white/[0.15] hover:border-white/[0.3] rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Folder</span>
            </button>
          )}

          {/* Current Folders Tree */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
              Configured Folders ({folders.length})
            </span>
            <div className="space-y-1.5">
              {rootFolders.map((rf) => renderFolderRow(rf))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
