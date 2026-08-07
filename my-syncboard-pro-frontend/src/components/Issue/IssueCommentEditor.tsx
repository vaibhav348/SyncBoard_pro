import { useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  Quote, Heading1, Heading2, Code, FileCode, Minus,
  Send,
  X,
  AlertCircle,
} from 'lucide-react';

interface CommentEditorProps {
  onSave: (content: string) => void;
  onCancel: () => void;
}

const MAX_CHARS = 2000;
const MIN_CHARS = 2;


export const IssueCommentEditor = ({ onSave, onCancel }: CommentEditorProps) => {
  const [, setUpdateTick] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'w-full text-sm leading-relaxed p-4 min-h-[120px] max-h-[320px] overflow-y-auto bg-white text-slate-800 focus:outline-none focus:ring-0 resize-none min-w-0 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-2 [&_li]:pl-1 [&_li]:mb-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-slate-900 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:text-slate-900 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500 [&_blockquote]:my-2 [&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2 [&_pre]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:text-indigo-600 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-xs [&_hr]:border-slate-200 [&_hr]:my-4 [&_p]:mb-2',
      },
    },
  });

  // Track editor states for active buttons + live char count
  useEffect(() => {
    if (!editor) return;
    const handleTransaction = () => setUpdateTick((tick) => tick + 1);
    editor.on('transaction', handleTransaction);
    editor.on('update', handleTransaction);
    return () => {
      editor.off('transaction', handleTransaction);
      editor.off('update', handleTransaction);
    };
  }, [editor]);

  // Auto-focus jab editor open ho
  useEffect(() => {
    if (editor) {
      editor.commands.focus();
    }
  }, [editor]);

  const charCount = editor ? editor.getText().length : 0;
  const isEmpty = editor ? editor.isEmpty || editor.getText().trim().length === 0 : true;
  const isTooShort = !isEmpty && charCount < MIN_CHARS;
  const isTooLong = charCount > MAX_CHARS;
  const hasError = isTooShort || isTooLong;
  const canSubmit = editor && !isEmpty && !hasError;

  const errorMessage = useMemo(() => {
    if (isTooLong) return `Comment is too long (${charCount}/${MAX_CHARS} characters).`;
    if (isTooShort) return `Comment must be at least ${MIN_CHARS} characters.`;
    return null;
  }, [isTooLong, isTooShort, charCount]);

  if (!editor) return null;

  const getBtnClass = (isActive: boolean) => {
    return isActive
      ? "p-1.5 rounded bg-slate-200 text-slate-900 font-semibold shadow-sm transition-all border border-slate-300"
      : "p-1.5 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent transition-all";
  };

  const handleSaveClick = () => {
    if (!canSubmit) return;
    onSave(editor.getHTML());
    editor.commands.clearContent();
  };

  return (
    <div className={`w-full border overflow-hidden focus-within:border-gray-300 transition-colors bg-white shadow-sm ${hasError ? 'border-red-300' : 'border-slate-200'
      }`}>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-50 border-b border-slate-200 select-none relative">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={getBtnClass(editor.isActive('bold'))}>
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={getBtnClass(editor.isActive('italic'))}>
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={getBtnClass(editor.isActive('strike'))}>
          <Strikethrough size={16} />
        </button>

        <span className="h-5 w-[1px] bg-slate-200 mx-1" />

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={getBtnClass(editor.isActive('heading', { level: 1 }))}>
          <Heading1 size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={getBtnClass(editor.isActive('heading', { level: 2 }))}>
          <Heading2 size={16} />
        </button>

        <span className="h-5 w-[1px] bg-slate-200 mx-1" />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={getBtnClass(editor.isActive('bulletList'))}>
          <List size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={getBtnClass(editor.isActive('orderedList'))}>
          <ListOrdered size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={getBtnClass(editor.isActive('blockquote'))}>
          <Quote size={16} />
        </button>

        <span className="h-5 w-[1px] bg-slate-200 mx-1" />

        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} className={getBtnClass(editor.isActive('code'))}>
          <Code size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={getBtnClass(editor.isActive('codeBlock'))}>
          <FileCode size={16} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-1.5 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all">
          <Minus size={16} />
        </button>
      </div>

      {/* Editor Surface with Native Placeholder — scrollable when long */}
      <div className="relative">
        {editor.isEmpty && (
          <div className="absolute top-4 left-4 text-slate-400 pointer-events-none select-none text-sm">
            Type a new comment here...
          </div>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* Validation row: error message + live char counter */}
      {/* <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center gap-1.5 min-h-[16px]">
          {errorMessage && (
            <>
              <AlertCircle size={12} className="text-red-500 shrink-0" />
              <span className="text-[11px] text-red-500">{errorMessage}</span>
            </>
          )}
        </div>
        <span className={`text-[11px] font-mono shrink-0 ${
            isTooLong ? 'text-red-500 font-semibold' : 'text-slate-400'
          }`}>
          {charCount}/{MAX_CHARS}
        </span>
      </div> */}

      <div className="flex justify-between gap-2 p-2 bg-slate-50 border-t border-slate-200">
        <div className="flex flex-col items-start justify-between px-1 py-1 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-1.5 min-h-[16px]">
            {errorMessage && (
              <>
                <AlertCircle size={12} className="text-red-500 shrink-0" />
                <span className="text-[11px] text-red-500">{errorMessage}</span>
              </>
            )}
          </div>
          <span className={`text-[11px] font-mono shrink-0 ${isTooLong ? 'text-red-500 font-semibold' : 'text-slate-400'
            }`}>
            {charCount}/{MAX_CHARS}
          </span>
        </div>
        <div className="flex items-center justify-end gap-2">

        <button
          type="button"
          onClick={onCancel}
          className="w-9 h-9 flex items-center cursor-pointer justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
          <X size={14} />
        </button>
        <button
          type="button"
          onClick={handleSaveClick}
          disabled={!canSubmit}
          className="w-9 h-9 flex items-center cursor-pointer justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
          <Send size={14} />
        </button>
          </div>
      </div>
    </div>
  );
};