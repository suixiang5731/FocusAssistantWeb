import React, { useState } from 'react';
import { Tag, DEFAULT_TAGS } from '../types';
import { Plus, X, Check } from 'lucide-react';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagId: string;
  onSelect: (tagId: string) => void;
  onAddTag: (name: string, color: string) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ tags, selectedTagId, onSelect, onAddTag }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const handleAdd = () => {
    if (newTagName.trim()) {
      // Randomish color generator from a preset palette
      const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      onAddTag(newTagName.trim(), randomColor);
      setNewTagName('');
      setIsAdding(false);
    }
  };

  const selectedTag = tags.find(t => t.id === selectedTagId);

  return (
    <div className="flex flex-col items-center gap-3 z-10 w-full px-8">
        <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">当前标签</div>
        
        <div className="flex flex-wrap justify-center gap-2">
            {tags.map(tag => (
                <button
                    key={tag.id}
                    onClick={() => onSelect(tag.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                        selectedTagId === tag.id 
                        ? 'bg-slate-800 text-white shadow-md scale-105' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                    }`}
                >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }}></span>
                    {tag.name}
                    {selectedTagId === tag.id && <Check size={12} />}
                </button>
            ))}
            
            {/* Add Button */}
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-white text-slate-400 border border-dashed border-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center gap-1"
                >
                    <Plus size={14} />
                </button>
            ) : (
                <div className="flex items-center gap-1 animate-modal-enter">
                    <input 
                        type="text" 
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        placeholder="标签名"
                        autoFocus
                        className="w-20 px-2 py-1 text-sm border border-indigo-300 rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    <button onClick={handleAdd} className="p-1 bg-indigo-600 text-white rounded-full"><Check size={12} /></button>
                    <button onClick={() => setIsAdding(false)} className="p-1 bg-slate-200 text-slate-500 rounded-full"><X size={12} /></button>
                </div>
            )}
        </div>
    </div>
  );
};