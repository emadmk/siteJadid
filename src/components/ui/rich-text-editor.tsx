'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { useState, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Unlink,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Code,
  Eye,
  Quote,
  Minus,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your content here...',
  className = '',
}: RichTextEditorProps) {
  const [mode, setMode] = useState<'visual' | 'code'>('visual');
  const [codeValue, setCodeValue] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Highlight.configure({
        multicolor: false,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setCodeValue(html);
    },
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
      setCodeValue(value);
    }
  }, [value, editor]);

  // Switch to visual mode and sync content
  const switchToVisual = useCallback(() => {
    if (editor) {
      editor.commands.setContent(codeValue);
      onChange(codeValue);
    }
    setMode('visual');
  }, [editor, codeValue, onChange]);

  // Handle code mode changes
  const handleCodeChange = (newCode: string) => {
    setCodeValue(newCode);
    onChange(newCode);
  };

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  if (!editor) {
    return (
      <div className={`border border-gray-300 rounded-lg ${className}`}>
        <div className="p-4 text-gray-400">Loading editor...</div>
      </div>
    );
  }

  const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gray-200 mx-1" />;

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        {/* Mode Toggle */}
        <div className="flex items-center bg-gray-200 rounded-lg p-0.5 mr-2">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              mode === 'visual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => setMode('code')}
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              mode === 'code'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            HTML
          </button>
        </div>

        {mode === 'visual' && (
          <>
            <Divider />

            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            {/* Headings */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            {/* Text Formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            {/* Alignment */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            {/* Block Elements */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              <Minus className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              isActive={editor.isActive('codeBlock')}
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            {/* Links */}
            <ToolbarButton
              onClick={addLink}
              isActive={editor.isActive('link')}
              title="Add Link"
            >
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={removeLink}
              disabled={!editor.isActive('link')}
              title="Remove Link"
            >
              <Unlink className="w-4 h-4" />
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Editor Content */}
      {mode === 'visual' ? (
        <div className="bg-white rich-text-content">
          <style jsx global>{`
            .rich-text-content .ProseMirror {
              min-height: 200px;
              padding: 1rem;
              outline: none;
            }
            .rich-text-content .ProseMirror h1 {
              font-size: 1.875rem;
              font-weight: 700;
              margin-bottom: 0.5rem;
              margin-top: 1rem;
              line-height: 1.2;
            }
            .rich-text-content .ProseMirror h2 {
              font-size: 1.5rem;
              font-weight: 700;
              margin-bottom: 0.5rem;
              margin-top: 1rem;
              line-height: 1.3;
            }
            .rich-text-content .ProseMirror h3 {
              font-size: 1.25rem;
              font-weight: 600;
              margin-bottom: 0.5rem;
              margin-top: 0.75rem;
              line-height: 1.4;
            }
            .rich-text-content .ProseMirror p {
              margin-bottom: 0.75rem;
            }
            .rich-text-content .ProseMirror ul {
              list-style-type: disc;
              padding-left: 1.5rem;
              margin-bottom: 0.75rem;
            }
            .rich-text-content .ProseMirror ol {
              list-style-type: decimal;
              padding-left: 1.5rem;
              margin-bottom: 0.75rem;
            }
            .rich-text-content .ProseMirror li {
              margin-bottom: 0.25rem;
            }
            .rich-text-content .ProseMirror blockquote {
              border-left: 3px solid #d1d5db;
              padding-left: 1rem;
              margin-left: 0;
              margin-bottom: 0.75rem;
              color: #6b7280;
              font-style: italic;
            }
            .rich-text-content .ProseMirror code {
              background-color: #f3f4f6;
              padding: 0.125rem 0.25rem;
              border-radius: 0.25rem;
              font-family: monospace;
              font-size: 0.875rem;
            }
            .rich-text-content .ProseMirror pre {
              background-color: #1f2937;
              color: #f9fafb;
              padding: 1rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              margin-bottom: 0.75rem;
            }
            .rich-text-content .ProseMirror pre code {
              background: none;
              padding: 0;
              color: inherit;
            }
            .rich-text-content .ProseMirror hr {
              border: none;
              border-top: 1px solid #e5e7eb;
              margin: 1rem 0;
            }
            .rich-text-content .ProseMirror a {
              color: #2563eb;
              text-decoration: underline;
            }
            .rich-text-content .ProseMirror strong {
              font-weight: 700;
            }
            .rich-text-content .ProseMirror em {
              font-style: italic;
            }
            .rich-text-content .ProseMirror u {
              text-decoration: underline;
            }
            .rich-text-content .ProseMirror s {
              text-decoration: line-through;
            }
            .rich-text-content .ProseMirror mark {
              background-color: #fef08a;
              padding: 0.125rem 0;
            }
            .rich-text-content .ProseMirror .is-empty::before {
              content: attr(data-placeholder);
              color: #9ca3af;
              pointer-events: none;
              position: absolute;
            }
          `}</style>
          <EditorContent editor={editor} />
        </div>
      ) : (
        <div className="bg-white">
          <textarea
            value={codeValue}
            onChange={(e) => handleCodeChange(e.target.value)}
            onBlur={switchToVisual}
            className="w-full min-h-[200px] p-4 font-mono text-sm focus:outline-none resize-y"
            placeholder={placeholder}
          />
        </div>
      )}
    </div>
  );
}
