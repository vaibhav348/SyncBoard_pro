import { useEffect, useMemo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  Quote, Heading1, Heading2, Code, FileCode, Minus,
  AlertCircle,
} from 'lucide-react';

interface EditorProps {
  initialDescription: string;
  canEditAll: boolean;
  onSave: (newContent: string) => void;
  onCancel: () => void;
}

const DESCRIPTION_MAX = 5000;
const DESCRIPTION_MIN = 5;

export const IssueDescriptionEditor = ({ initialDescription, canEditAll, onSave, onCancel }: EditorProps) => {
  // Dummy state jo har click/type par toolbar ke buttons ko force-refresh karega
  const [, setUpdateTick] = useState(0);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialDescription || '<p></p>',
    editable: canEditAll,
    editorProps: {
      attributes: {
        class: 'w-full text-sm leading-relaxed rounded-b-xl p-4 min-h-[150px] bg-white text-slate-800 focus:outline-none focus:ring-0 resize-none min-w-0 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-2 [&_li]:pl-1 [&_li]:mb-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-slate-900 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:text-slate-900 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500 [&_blockquote]:my-2 [&_pre]:bg-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:font-mono [&_pre]:text-xs [&_pre]:my-2 [&_pre]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:text-indigo-600 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:font-mono [&_code]:text-xs [&_hr]:border-slate-200 [&_hr]:my-4 [&_p]:mb-2',
      },
    },
  });

  // Crucial Fix: TipTap ke har ek action (click, selection, typing) ko track karke UI update karega
  useEffect(() => {
    if (!editor) return;

    const handleTransaction = () => {
      setUpdateTick((tick) => tick + 1);
    };

    editor.on('transaction', handleTransaction);
    editor.on('update', handleTransaction);
    return () => {
      editor.off('transaction', handleTransaction);
      editor.off('update', handleTransaction);
    };
  }, [editor]);

  // Safety Fix: Content tabhi update hoga jab user edit NA kar raha ho (prevent state loss)
  useEffect(() => {
    if (editor && !editor.isFocused && initialDescription !== editor.getHTML()) {
      editor.commands.setContent(initialDescription);
    }
  }, [initialDescription, editor]);

  // ── Validation ───────────────────────────────────────────────────────────
  const charCount = editor ? editor.getText().length : 0;
  const isEmpty = editor ? editor.isEmpty || editor.getText().trim().length === 0 : true;
  const isTooShort = !isEmpty && charCount < DESCRIPTION_MIN;
  const isTooLong = charCount > DESCRIPTION_MAX;
  const hasError = isTooShort || isTooLong;
  const canSubmit = editor && !isEmpty && !hasError;

  const errorMessage = useMemo(() => {
    if (isTooLong) return `Description is too long (${charCount}/${DESCRIPTION_MAX} characters).`;
    if (isTooShort) return `Description must be at least ${DESCRIPTION_MIN} characters.`;
    return null;
  }, [isTooLong, isTooShort, charCount]);

  if (!editor) return null;

  // Dynamic Style Helper: Active hone par slate background and darker text dikhayega
  const getBtnClass = (isActive: boolean) => {
    return isActive
      ? "p-1.5 rounded bg-slate-200 text-slate-900 font-semibold shadow-sm transition-all border border-slate-300" // Active State
      : "p-1.5 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-transparent transition-all disabled:opacity-40"; // Inactive State
  };

  return (
    <div className={`w-full border rounded-xl overflow-hidden focus-within:border-indigo-300 transition-colors bg-white shadow-sm ${
        hasError ? 'border-red-300' : 'border-slate-200'
      }`}>

      {/* Modern Live Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-slate-50 border-b border-slate-200 select-none">

        {/* Text Formatting */}
        <button
          type="button"
          disabled={!canEditAll}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={getBtnClass(editor.isActive('bold'))}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          disabled={!canEditAll}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={getBtnClass(editor.isActive('italic'))}
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          disabled={!canEditAll}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={getBtnClass(editor.isActive('strike'))}
        >
          <Strikethrough size={16} />
        </button>

        <span className="h-5 w-[1px] bg-slate-200 mx-1" />

        {/* Headings */}
        <button
          type="button"
          disabled={!canEditAll}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={getBtnClass(editor.isActive('heading', { level: 1 }))}
        >
          <Heading1 size={16} />
        </button>
        <button
          type="button"
          disabled={!canEditAll}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={getBtnClass(editor.isActive('heading', { level: 2 }))}
        >
          <Heading2 size={16} />
        </button>

        <span className="h-5 w-[1px] bg-slate-200 mx-1" />

        {/* Lists & Quotes */}
        <button
          type="button"
          disabled={!canEditAll}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={getBtnClass(editor.isActive('bulletList'))}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          disabled={!canEditAll}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={getBtnClass(editor.isActive('orderedList'))}
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          disabled={!canEditAll}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={getBtnClass(editor.isActive('blockquote'))}
        >
          <Quote size={16} />
        </button>

        <span className="h-5 w-[1px] bg-slate-200 mx-1" />

        {/* Code & Extras */}
        <button
          type="button"
          disabled={!canEditAll}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline Code"
          className={getBtnClass(editor.isActive('code'))}
        >
          <Code size={16} />
        </button>
        <button
          type="button"
          disabled={!canEditAll}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
          className={getBtnClass(editor.isActive('codeBlock'))}
        >
          <FileCode size={16} />
        </button>
        <button
          type="button"
          disabled={!canEditAll}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Divider"
          className="p-1.5 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 transition-all"
        >
          <Minus size={16} />
        </button>

      </div>

      {/* Editor Surface */}
      <EditorContent editor={editor} />

     
      {/* Actions */}
      <div className="flex justify-between gap-2 p-2 bg-slate-50 border-t border-slate-200">
      <div className="flex  flex-col items-start justify-between px-3 py-1.5 bg-slate-50 border-t border-slate-100">
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
          {charCount}/{DESCRIPTION_MAX}
        </span>
      </div>
      <div className='flex items-center justify-end gap-2'>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 bg-white hover:text-slate-900 hover:border-slate-300 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => canSubmit && onSave(editor.getHTML())}
          disabled={!canSubmit}
          className="text-xs font-semibold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
          Save Details
        </button>
          </div>
      </div>
    </div>
  );
};