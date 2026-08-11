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
    <div className="flex flex-col items-center gap-2.5 z-10 w-full px-4 sm:px-8">
        <div className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">当前选择标签</div>
        
        <div className="flex flex-wrap justify-center gap-2 transition-all">
            {tags.map(tag => {
                const isSelected = selectedTagId === tag.id;
                const isCustom = !isDefaultTag(tag.id);

                return (
                    <div
                        key={tag.id}
                        onClick={() => onSelect(tag.id)}
                        className={`
                            relative px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer flex items-center gap-2 select-none border
                            ${isSelected 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                                : 'bg-white/80 text-slate-600 border-slate-200/80 hover:border-slate-400 hover:text-slate-900 hover:bg-white'
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
                                    ml-1 p-0.5 rounded-md transition-colors flex items-center justify-center
                                    ${isSelected 
                                        ? 'hover:bg-slate-700 text-slate-400 hover:text-white' 
                                        : 'hover:bg-rose-50 text-slate-300 hover:text-rose-600'
                                    }
                                `}
                                title="删除标签"
                            >
                                <X size={13} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                );
            })}
            
            {/* Add Button */}
            {!isAdding ? (
                <button
                    onClick={() => setIsAdding(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/70 text-slate-400 border border-dashed border-slate-300 hover:text-slate-800 hover:border-slate-400 hover:bg-white transition-all flex items-center gap-1"
                    title="添加新标签"
                >
                    <Plus size={14} />
                    <span>添加</span>
                </button>
            ) : (
                <div className="flex items-center gap-1.5 animate-modal-enter bg-white px-2 py-1 rounded-xl border border-slate-300 shadow-2xs">
                    <input 
                        type="text" 
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        placeholder="标签名称"
                        autoFocus
                        className="w-20 px-2 py-0.5 text-xs bg-transparent outline-none text-slate-800 placeholder:text-slate-300 font-medium"
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                    <button 
                        onClick={handleAdd} 
                        className="w-5 h-5 flex items-center justify-center bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                        title="保存"
                    >
                        <Check size={12} />
                    </button>
                    <button 
                        onClick={() => setIsAdding(false)} 
                        className="w-5 h-5 flex items-center justify-center bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 transition-colors"
                        title="取消"
                    >
                        <X size={12} />
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};