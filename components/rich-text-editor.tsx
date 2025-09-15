"use client"

import { Editor } from "react-draft-wysiwyg"
import { EditorState, ContentState, convertToRaw } from "draft-js"
import draftToHtml from "draftjs-to-html"
import htmlToDraft from "html-to-draftjs"
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css"
import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

export function RichTextEditor({ value, onChange, placeholder, label }: RichTextEditorProps) {
  const [editorState, setEditorState] = useState(() => {
    if (value) {
      const contentBlock = htmlToDraft(value)
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
      return EditorState.createWithContent(contentState)
    }
    return EditorState.createEmpty()
  })

  useEffect(() => {
    if (value) {
      const contentBlock = htmlToDraft(value)
      const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks)
      setEditorState(EditorState.createWithContent(contentState))
    } else {
      setEditorState(EditorState.createEmpty())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleEditorStateChange = (state: EditorState) => {
    setEditorState(state)
    const rawContent = convertToRaw(state.getCurrentContent())
    const html = draftToHtml(rawContent)
    onChange(html)
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Editor
        editorState={editorState}
        onEditorStateChange={handleEditorStateChange}
        wrapperClassName="border rounded min-h-[200px]"
        editorClassName="p-2 min-h-[200px] bg-white"
        toolbarClassName="border-b"
        placeholder={placeholder}
        toolbar={{
          options: [
            'inline', 'blockType', 'fontSize', 'list', 'textAlign', 'link', 'history', 'remove', 'emoji'
          ],
          inline: { inDropdown: false },
          list: { inDropdown: false },
          textAlign: { inDropdown: false },
          link: { inDropdown: false },
          history: { inDropdown: false },
        }}
      />
    </div>
  )
}
