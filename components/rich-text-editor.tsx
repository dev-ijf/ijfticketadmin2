"use client";

import { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Type,
} from "lucide-react";

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
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const insertText = (before: string, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Restore cursor position
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const formatText = (format: string) => {
    switch (format) {
      case "bold":
        insertText("**", "**");
        break;
      case "italic":
        insertText("*", "*");
        break;
      case "underline":
        insertText("<u>", "</u>");
        break;
      case "list":
        insertText("\n- ", "");
        break;
      case "orderedList":
        insertText("\n1. ", "");
        break;
      case "link":
        insertText("[", "](url)");
        break;
      case "heading":
        insertText("\n## ", "");
        break;
    }
  };

  const convertToHtml = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^- (.*$)/gm, "<li>$1</li>")
      .replace(/^(\d+)\. (.*$)/gm, "<li>$1. $2</li>")
      .replace(/\[([^\]]+)\]$([^)]+)$/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/\n/g, "<br>");
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border rounded-t bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText("bold")}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText("italic")}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText("underline")}
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText("heading")}
          className="h-8 w-8 p-0"
        >
          <Type className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText("list")}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText("orderedList")}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText("link")}
          className="h-8 w-8 p-0"
        >
          <Link className="h-4 w-4" />
        </Button>
        <div className="ml-auto">
          <Button
            type="button"
            variant={isPreview ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? "Edit" : "Preview"}
          </Button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      {isPreview ? (
        <div
          className="min-h-[200px] p-3 border border-t-0 rounded-b bg-white prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: convertToHtml(value) }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[200px] p-3 border border-t-0 rounded-b resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      {/* Help text */}
      <div className="text-xs text-gray-500">
        Use **bold**, *italic*, ## heading, - list, 1. numbered list,
        [link](url)
      </div>
    </div>
  );
}
