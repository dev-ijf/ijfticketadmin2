"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { RichTextEditor } from "@/components/rich-text-editor";

type EventUpdate = {
  name: string;
  slug: string;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  description: string | null;
  image_url: string | null;
};

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EventUpdate>({
    name: "",
    slug: "",
    start_date: "",
    end_date: "",
    location: "",
    description: "",
    image_url: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (params.id) {
      fetchEvent();
    }
  }, [params.id]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events?id=${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch event");
      const data = await response.json();

      setFormData({
        name: data.name,
        slug: data.slug,
        start_date: data.start_date
          ? new Date(data.start_date).toISOString().slice(0, 16)
          : "",
        end_date: data.end_date
          ? new Date(data.end_date).toISOString().slice(0, 16)
          : "",
        location: data.location || "",
        description: data.description || "",
        image_url: data.image_url || "",
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);

    try {
      const response = await fetch("/api/events", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: params.id, ...formData }),
      });

      if (!response.ok) throw new Error("Failed to update event");

      toast({
        title: "Berhasil",
        description: "Event berhasil diperbarui",
      });
      await clearRedis();
      router.push(`/events`); // Redirect to events list
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui event",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Informasi Event</CardTitle>
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
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <ImageUpload
                value={formData.image_url}
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
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
