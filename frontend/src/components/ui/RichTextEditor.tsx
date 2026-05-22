import React, { useRef, useState, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Code } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className = '' }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isSourceMode && editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isSourceMode]);

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    handleChange();
  };

  const handleChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const ToolbarButton = ({ icon: Icon, action, title }: { icon: React.ElementType; action: () => void; title: string }) => (
    <button
      type="button"
      onClick={action}
      title={title}
      className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0"
    >
      <Icon size={16} strokeWidth={2.5} />
    </button>
  );

  return (
    <div className={`border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50 flex-wrap">
        <ToolbarButton icon={Bold} title="Bold" action={() => exec('bold')} />
        <ToolbarButton icon={Italic} title="Italic" action={() => exec('italic')} />
        <ToolbarButton icon={Underline} title="Underline" action={() => exec('underline')} />
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <ToolbarButton icon={List} title="Bullet List" action={() => exec('insertUnorderedList')} />
        <ToolbarButton icon={ListOrdered} title="Numbered List" action={() => exec('insertOrderedList')} />
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <ToolbarButton icon={LinkIcon} title="Insert Link" action={() => {
          const url = prompt('Enter URL:');
          if (url) exec('createLink', url);
        }} />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setIsSourceMode(!isSourceMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${
            isSourceMode ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
          }`}
        >
          <Code size={14} />
          {isSourceMode ? 'Đóng HTML' : 'Mã HTML'}
        </button>
      </div>

      {/* Editor Area */}
      {isSourceMode ? (
        <textarea
          value={value}
          onChange={handleSourceChange}
          className="w-full h-full min-h-[250px] p-5 font-mono text-sm outline-none resize-y bg-slate-900 text-emerald-400"
          placeholder="<h1>Mã HTML</h1>..."
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleChange}
          onBlur={handleChange}
          className="w-full min-h-[250px] max-h-[500px] overflow-y-auto p-5 outline-none prose prose-sm max-w-none prose-slate focus:outline-none"
          data-placeholder={placeholder}
        />
      )}
    </div>
  );
};
