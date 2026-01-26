"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";
import { useEffect, useCallback, useRef } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  label,
}: RichTextEditorProps) {
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      if (isUpdatingRef.current) return;
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4",
      },
    },
  });

  // Handle external value changes (fix jump cursor bug)
  useEffect(() => {
    if (!editor) return;

    const currentContent = editor.getHTML();
    // Only update if the value actually changed from external source
    if (value !== currentContent && value !== undefined && value !== null) {
      // Store cursor position
      const { from, to } = editor.state.selection;
      
      // Set flag to prevent onChange from firing
      isUpdatingRef.current = true;
      
      // Update content without emitting update event
      editor.commands.setContent(value || "", { emitUpdate: false });
      
      // Restore cursor position after content is set
      requestAnimationFrame(() => {
        try {
          // Try to restore cursor position, but clamp it to valid range
          const docSize = editor.state.doc.content.size;
          const safeFrom = Math.min(Math.max(0, from), docSize);
          const safeTo = Math.min(Math.max(0, to), docSize);
          if (safeFrom >= 0 && safeTo >= 0 && safeFrom <= docSize && safeTo <= docSize) {
            editor.commands.setTextSelection({ from: safeFrom, to: safeTo });
          }
        } catch (e) {
          // If cursor position is invalid, just set to end
          const docSize = editor.state.doc.content.size;
          if (docSize > 0) {
            editor.commands.setTextSelection(docSize);
          }
        } finally {
          isUpdatingRef.current = false;
        }
      });
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Masukkan URL:", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt("Masukkan URL gambar:");

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border rounded-t bg-gray-50 dark:bg-gray-800">
        {/* Text Formatting */}
        <Button
          type="button"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleBold().run();
          }}
          className="h-8 w-8 p-0"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleItalic().run();
          }}
          className="h-8 w-8 p-0"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("underline") ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleUnderline().run();
          }}
          className="h-8 w-8 p-0"
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("strike") ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleStrike().run();
          }}
          className="h-8 w-8 p-0"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("code") ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleCode().run();
          }}
          className="h-8 w-8 p-0"
          title="Code"
        >
          <Code className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Headings */}
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 1 }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
          }}
          className="h-8 w-8 p-0"
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 2 }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }}
          className="h-8 w-8 p-0"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive("heading", { level: 3 }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          className="h-8 w-8 p-0"
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleBulletList().run();
          }}
          className="h-8 w-8 p-0"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            editor.chain().focus().toggleOrderedList().run();
          }}
          className="h-8 w-8 p-0"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Text Alignment */}
        <Button
          type="button"
          variant={
            editor.isActive({ textAlign: "left" }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => {
            editor.chain().focus().setTextAlign("left").run();
          }}
          className="h-8 w-8 p-0"
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive({ textAlign: "center" }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => {
            editor.chain().focus().setTextAlign("center").run();
          }}
          className="h-8 w-8 p-0"
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive({ textAlign: "right" }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => {
            editor.chain().focus().setTextAlign("right").run();
          }}
          className="h-8 w-8 p-0"
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={
            editor.isActive({ textAlign: "justify" }) ? "default" : "ghost"
          }
          size="sm"
          onClick={() => {
            editor.chain().focus().setTextAlign("justify").run();
          }}
          className="h-8 w-8 p-0"
          title="Justify"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Link & Image */}
        <Button
          type="button"
          variant={editor.isActive("link") ? "default" : "ghost"}
          size="sm"
          onClick={setLink}
          className="h-8 w-8 p-0"
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          className="h-8 w-8 p-0"
          title="Add Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            editor.chain().focus().undo().run();
          }}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            editor.chain().focus().redo().run();
          }}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="border border-t-0 rounded-b bg-white dark:bg-gray-900 relative">
        <div className="relative">
          <EditorContent
            editor={editor}
            className="min-h-[200px] focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 rounded-b"
          />
          {placeholder && !editor.getText() && (
            <div className="absolute top-4 left-4 pointer-events-none text-gray-400 text-sm">
              {placeholder}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
