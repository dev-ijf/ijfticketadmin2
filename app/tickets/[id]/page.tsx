"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type CustomField = {
  id: number;
  field_name: string;
  field_label: string;
  field_type: "text" | "textarea" | "date" | "datetime" | "dropdown" | "radio" | "checkbox";
  is_required: boolean;
  sort_order: number;
  options?: Array<{
    id: number;
    option_value: string;
    option_label: string;
    sort_order: number;
  }>;
  current_value: string;
};

type TicketData = {
  id: number;
  ticket_code: string;
  attendee_name: string;
  attendee_email: string | null;
  attendee_phone_number: string | null;
  is_checked_in: boolean;
  checked_in_at: string | null;
  ticket_type_name: string;
  ticket_type_id: number;
  event_id: number;
  event_name: string;
  custom_fields: CustomField[];
};

export default function EditTicketPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [formData, setFormData] = useState({
    attendee_name: "",
    attendee_email: "",
    attendee_phone_number: "",
    custom_fields: {} as Record<string, string>,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (params.id) {
      fetchTicket();
    }
  }, [params.id]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${params.id}/edit?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch ticket");
      const data = await response.json();

      setTicketData(data);

      // Initialize form data
      const customFieldsMap: Record<string, string> = {};
      data.custom_fields.forEach((field: CustomField) => {
        customFieldsMap[field.field_name] = field.current_value || "";
      });

      setFormData({
        attendee_name: data.attendee_name || "",
        attendee_email: data.attendee_email || "",
        attendee_phone_number: data.attendee_phone_number || "",
        custom_fields: customFieldsMap,
      });
    } catch (error) {
      console.error("Error fetching ticket:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data tiket",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/tickets/${params.id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update ticket");
      }

      toast({
        title: "Berhasil",
        description: "Tiket berhasil diperbarui",
      });
      router.push("/tickets");
    } catch (error: any) {
      console.error("Error updating ticket:", error);
      toast({
        title: "Error",
        description: error?.message || "Gagal memperbarui tiket",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderCustomField = (field: CustomField) => {
    const value = formData.custom_fields[field.field_name] || "";

    switch (field.field_type) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) =>
              setFormData({
                ...formData,
                custom_fields: {
                  ...formData.custom_fields,
                  [field.field_name]: e.target.value,
                },
              })
            }
            required={field.is_required}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) =>
              setFormData({
                ...formData,
                custom_fields: {
                  ...formData.custom_fields,
                  [field.field_name]: e.target.value,
                },
              })
            }
            required={field.is_required}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) =>
              setFormData({
                ...formData,
                custom_fields: {
                  ...formData.custom_fields,
                  [field.field_name]: e.target.value,
                },
              })
            }
            required={field.is_required}
          />
        );

      case "datetime":
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) =>
              setFormData({
                ...formData,
                custom_fields: {
                  ...formData.custom_fields,
                  [field.field_name]: e.target.value,
                },
              })
            }
            required={field.is_required}
          />
        );

      case "dropdown":
        return (
          <Select
            value={value}
            onValueChange={(val) =>
              setFormData({
                ...formData,
                custom_fields: {
                  ...formData.custom_fields,
                  [field.field_name]: val,
                },
              })
            }
            required={field.is_required}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih opsi" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.id} value={option.option_value}>
                  {option.option_label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.field_name}_${option.id}`}
                  name={field.field_name}
                  value={option.option_value}
                  checked={value === option.option_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      custom_fields: {
                        ...formData.custom_fields,
                        [field.field_name]: e.target.value,
                      },
                    })
                  }
                  required={field.is_required}
                  className="h-4 w-4"
                />
                <Label htmlFor={`${field.field_name}_${option.id}`}>
                  {option.option_label}
                </Label>
              </div>
            ))}
          </div>
        );

      case "checkbox":
        // For checkbox, we'll treat it as a single checkbox (checked/unchecked)
        // If you need multiple checkboxes, you'd need to store as JSON array
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.field_name}
              checked={value === "true" || value === "1"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  custom_fields: {
                    ...formData.custom_fields,
                    [field.field_name]: e.target.checked ? "1" : "0",
                  },
                })
              }
              className="h-4 w-4"
            />
            <Label htmlFor={field.field_name}>Ya</Label>
          </div>
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) =>
              setFormData({
                ...formData,
                custom_fields: {
                  ...formData.custom_fields,
                  [field.field_name]: e.target.value,
                },
              })
            }
            required={field.is_required}
          />
        );
    }
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

  if (!ticketData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p>Tiket tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Sort custom fields by sort_order
  const sortedCustomFields = [...(ticketData.custom_fields || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Tiket</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Tiket</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">Ticket Code</Label>
                <p className="font-medium">{ticketData.ticket_code}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Event</Label>
                <p className="font-medium">{ticketData.event_name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Ticket Type</Label>
                <p className="font-medium">{ticketData.ticket_type_name}</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Status Check-in</Label>
                <div className="mt-1">
                  <Badge
                    variant={ticketData.is_checked_in ? "default" : "secondary"}
                  >
                    {ticketData.is_checked_in ? "Checked In" : "Not Checked In"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Peserta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="attendee_name">
                Nama Peserta <span className="text-red-500">*</span>
              </Label>
              <Input
                id="attendee_name"
                value={formData.attendee_name}
                onChange={(e) =>
                  setFormData({ ...formData, attendee_name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendee_email">Email Peserta</Label>
              <Input
                id="attendee_email"
                type="email"
                value={formData.attendee_email}
                onChange={(e) =>
                  setFormData({ ...formData, attendee_email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="attendee_phone_number">Nomor Telepon</Label>
              <Input
                id="attendee_phone_number"
                value={formData.attendee_phone_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attendee_phone_number: e.target.value,
                  })
                }
              />
            </div>

            {sortedCustomFields.length > 0 && (
              <div className="space-y-6 pt-4 border-t">
                <h3 className="text-lg font-semibold">Field Pendaftaran Kustom</h3>
                {sortedCustomFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.field_name}>
                      {field.field_label}
                      {field.is_required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    {renderCustomField(field)}
                  </div>
                ))}
              </div>
            )}

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
