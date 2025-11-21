import React, { useState } from 'react';
import { Tag, DEFAULT_TAGS } from '../types';
import { Plus, X, Check, Trash2 } from 'lucide-react';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagId: string;
  onSelect: (tagId: string) => void;
  onAddTag: (name: string, color: string) => void;
  onDeleteTag: (tagId: string) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ tags, selectedTagId, onSelect, onAddTag, onDeleteTag }) => {
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

  const isDefaultTag = (id: string) => {
      return DEFAULT_TAGS.some(dt => dt.id === id);
  };

  return (
    <div className="flex flex-col items-center gap-3 z-10 w-full px-4 sm:px-8">
        <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">当前标签</div>
        
        <div className="flex flex-wrap justify-center gap-2 transition-all">
            {tags.map(tag => {
                const isSelected = selectedTagId === tag.id;
                const isCustom = !isDefaultTag(tag.id);

                return (
                    <div
                        key={tag.id}
                        onClick={() => onSelect(tag.id)}
                        className={`
                            relative px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer flex items-center gap-2 select-none border
                            ${isSelected 
                                ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                            }
                        `}
                    >
                        <span className={`w-2 h-2 rounded-full shrink-0`} style={{ backgroundColor: tag.color }}></span>
                        <span className="truncate max-w-[100px]">{tag.name}</span>
                        
                        {/* Delete Button for Custom Tags */}
                        {isCustom && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTag(tag.id);
                                }}
                                className={`
                                    ml-1 p-0.5 rounded-full transition-colors flex items-center justify-center
                                    ${isSelected 
                                        ? 'hover:bg-slate-600 text-slate-400 hover:text-white' 
                                        : 'hover:bg-slate-100 text-slate-300 hover:text-red-500'
                                    }
                                `}
                                title="删除标签"
                            >
                                <X size={14} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                );
            })}
            
            {/* Add Button */}
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-white text-slate-400 border border-dashed border-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center gap-1"
                >
                    <Plus size={14} />
                </button>
            ) : (
                <div className="flex items-center gap-1 animate-modal-enter bg-white p-0.5 rounded-full border border-indigo-200 shadow-sm">
                    <input 
                        type="text" 
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        placeholder="标签名"
                        autoFocus
                        className="w-20 px-3 py-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-300"
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    <button 
                        onClick={handleAdd} 
                        className="w-6 h-6 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                    >
                        <Check size={14} />
                    </button>
                    <button 
                        onClick={() => setIsAdding(false)} 
                        className="w-6 h-6 flex items-center justify-center bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};