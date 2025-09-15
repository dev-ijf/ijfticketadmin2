"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, ImageIcon, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  bucket: string
  folder?: string
  label?: string
  accept?: string
}

export function ImageUpload({
  value,
  onChange,
  bucket,
  folder = "",
  label = "Upload Image",
  accept = "image/*",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string>(value || "")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    setPreview(value || "")
  }, [value])

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Ukuran file maksimal 5MB",
          variant: "destructive",
        })
        return
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "File harus berupa gambar",
          variant: "destructive",
        })
        return
      }

      const fileExt = file.name.split(".").pop()?.toLowerCase()
      const fileName = `${bucket}/${folder ? folder + "/" : ""}${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      console.log("Uploading to Vercel Blob:", fileName)

      // Upload to Vercel Blob
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(fileName)}`, {
        method: "POST",
        body: file,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const blob = await response.json()
      console.log("Upload successful:", blob)

      const imageUrl = blob.url
      setPreview(imageUrl)
      onChange(imageUrl)

      toast({
        title: "Berhasil",
        description: "Gambar berhasil diupload",
      })
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({
        title: "Error",
        description: error.message || "Gagal mengupload gambar",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
    // Reset input value so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const removeImage = () => {
    setPreview("")
    onChange("")
  }

  const handleDropZoneClick = () => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith("image/")) {
        uploadImage(file)
      } else {
        toast({
          title: "Error",
          description: "File harus berupa gambar",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {preview ? (
        <div className="relative">
          <div className="relative w-full min-h-48 max-h-96 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <Image
              src={preview || "/placeholder.svg"}
              alt="Preview"
              width={800}
              height={400}
              className="w-full h-auto object-contain"
              style={{ maxHeight: "384px" }}
              onError={() => {
                console.error("Image failed to load:", preview)
                setPreview("")
              }}
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeImage}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center space-y-2 cursor-pointer hover:border-gray-400 transition-colors"
          onClick={handleDropZoneClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <ImageIcon className="h-12 w-12 text-gray-400" />
          <p className="text-sm text-gray-500">Klik atau drag & drop gambar</p>
          <p className="text-xs text-gray-400">Maksimal 5MB</p>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        <Button type="button" variant="outline" disabled={uploading} onClick={handleBrowseClick}>
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {uploading ? "Uploading..." : "Browse File"}
        </Button>
      </div>
    </div>
  )
}
