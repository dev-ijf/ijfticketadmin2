"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import dynamic from "next/dynamic";
import {
  CustomFieldsManager,
  type CustomField,
} from "@/components/custom-fields-manager";

const RichTextEditor = dynamic(
  () =>
    import("@/components/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
  },
);

type EventInsert = {
  name: string;
  slug: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  description: string | null;
  image_url: string | null;
  custom_fields?: CustomField[];
};

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EventInsert>({
    name: "",
    slug: "",
    start_date: "",
    end_date: "",
    location: "",
    description: "",
    image_url: "",
    custom_fields: [],
  });
  const { toast } = useToast();
  const [customFieldsValid, setCustomFieldsValid] = useState(true);
  const [customFieldsErrors, setCustomFieldsErrors] = useState<string[]>([]);

  const clearRedis = async () => {
    try {
      await fetch("/api/clear-redis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "events" }),
      });
    } catch (e) {
      // Optional: bisa tambahkan toast error jika perlu
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validasi custom fields dulu
    if (!customFieldsValid) {
      toast({
        title: "Error Validasi",
        description:
          "Terdapat error pada custom fields. Silakan perbaiki terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          name: formData.name || "",
          slug: formData.slug || "",
          description: formData.description || null,
          location: formData.location || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          image_url: formData.image_url || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to create event: ${response.statusText}`,
        );
      }

      const data = await response.json();

      toast({
        title: "Berhasil",
        description: "Event berhasil dibuat",
      });
      await clearRedis();

      router.push(`/events/${data.id}`);
    } catch (error) {
      console.error("Error creating event:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Gagal membuat event";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Buat Event Baru</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Event</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      slug: generateSlug(name),
                    });
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Tanggal Mulai</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Tanggal Selesai</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                value={formData.location || ""}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <ImageUpload
                value={formData.image_url || ""}
                onChange={(url) => setFormData({ ...formData, image_url: url })}
                bucket="events"
                folder="images"
                label="Gambar Event"
              />
            </div>

            <RichTextEditor
              value={formData.description || ""}
              onChange={(value) =>
                setFormData({ ...formData, description: value })
              }
              label="Deskripsi Event"
              placeholder="Masukkan deskripsi event..."
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Menyimpan..." : "Simpan Event"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <CustomFieldsManager
            fields={formData.custom_fields || []}
            onChange={(fields) =>
              setFormData({ ...formData, custom_fields: fields })
            }
            onValidationChange={(isValid, errors) => {
              setCustomFieldsValid(isValid);
              setCustomFieldsErrors(errors);
            }}
          />

          {!customFieldsValid && customFieldsErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Error Validasi Custom Fields:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {customFieldsErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
