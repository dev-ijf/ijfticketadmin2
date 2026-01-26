"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Copy, ArrowLeft, Save, Eye, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";

const availableVariables = [
  { key: "{{customer.name}}", description: "Nama customer" },
  { key: "{{event.name}}", description: "Nama event" },
  { key: "{{event_name}}", description: "Nama event (baru)" },
  { key: "{{event_location}}", description: "Lokasi event" },
  {
    key: "{{event_start_date}}",
    description:
      "Tanggal & jam event (format: Sabtu, 26 Juli 2025 jam 08:00:00 - Sabtu, 26 Juli 2025 jam 15:00:00)",
  },
  { key: "{{order.order_reference}}", description: "Nomor referensi order" },
  { key: "{{order.final_amount}}", description: "Total pembayaran" },
  { key: "{{payment_deadline}}", description: "Batas waktu pembayaran" },
  { key: "{{payment_channel.pg_name}}", description: "Nama payment gateway" },
  { key: "{{virtual_account_number}}", description: "Nomor virtual account" },
  { key: "{{payment_response_url}}", description: "URL response pembayaran" },
];

export default function EditNotificationTemplate() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRichText, setIsRichText] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    channel: "",
    trigger_on: "",
    subject: "",
    body: "",
    is_active: true,
  });

  useEffect(() => {
    fetchTemplate();
  }, [params.id]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(
        `/api/notification-templates?id=${params.id}`,
      );
      if (!response.ok) throw new Error("Failed to load template");
      const data = await response.json();

      setFormData({
        name: data.name || "",
        channel: data.channel || "",
        trigger_on: data.trigger_on || "",
        subject: data.subject || "",
        body: data.body || "",
        is_active: data.is_active ?? true,
      });
    } catch (error) {
      console.error("Error fetching template:", error);
      toast.error("Failed to load template");
      router.push("/notification-templates");
    } finally {
      setInitialLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Variable copied to clipboard!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `/api/notification-templates?id=${params.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            name: formData.name || "",
            channel: formData.channel || "",
            trigger_on: formData.trigger_on || "",
            subject: formData.subject || "",
            body: formData.body || "",
            is_active: formData.is_active ?? true,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to update template: ${response.statusText}`,
        );
      }

      toast.success("Template updated successfully!");
      router.push("/notification-templates");
    } catch (error) {
      console.error("Error updating template:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update template";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const previewContent = () => {
    let preview = formData.body || "";
    const sampleData: Record<string, string> = {
      "{{customer.name}}": "John Doe",
      "{{event.name}}": "Tech Conference 2024",
      "{{event_name}}": "Tech Conference 2024",
      "{{event_location}}": "Jakarta Convention Center",
      "{{event_start_date}}":
        "Sabtu, 26 Juli 2025 jam 08:00:00 - Sabtu, 26 Juli 2025 jam 15:00:00",
      "{{order.order_reference}}": "ORD-2024-001",
      "{{order.final_amount}}": "Rp 500,000",
      "{{payment_deadline}}": "2024-01-15 23:59",
      "{{payment_channel.pg_name}}": "Bank BCA",
      "{{virtual_account_number}}": "1234567890123456",
      "{{payment_response_url}}": "https://example.com/payment/response",
    };
    availableVariables.forEach((variable) => {
      preview = preview.replace(
        new RegExp(variable.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        sampleData[variable.key] || variable.key,
      );
    });
    return preview;
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Notification Template</h1>
          <p className="text-muted-foreground">
            Update your notification template
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>Update the template information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Payment Confirmation"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="channel">Channel</Label>
                    <Select
                      value={formData.channel}
                      onValueChange={(value) =>
                        setFormData({ ...formData, channel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trigger_on">Trigger On</Label>
                    <Select
                      value={formData.trigger_on}
                      onValueChange={(value) =>
                        setFormData({ ...formData, trigger_on: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkout">Checkout</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="reminder">Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject (for Email)</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({ ...formData, subject: e.target.value })
                      }
                      placeholder="e.g., Payment Confirmation for {{event.name}}"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Content</Label>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">Plain Text</span>
                    <input
                      type="checkbox"
                      checked={isRichText}
                      onChange={() => setIsRichText((v) => !v)}
                      id="toggle-richtext"
                    />
                    <span className="text-sm">Rich Text</span>
                  </div>
                  {isRichText ? (
                    <RichTextEditor
                      value={formData.body}
                      onChange={(value) =>
                        setFormData({ ...formData, body: value })
                      }
                    />
                  ) : (
                    <Textarea
                      id="body"
                      value={formData.body}
                      onChange={(e) =>
                        setFormData({ ...formData, body: e.target.value })
                      }
                      placeholder="Enter plain text content here. Use variables like {{customer.name}} for dynamic content."
                      rows={8}
                    />
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Active Template</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Updating..." : "Update Template"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Variables</CardTitle>
              <CardDescription>
                Click to copy variables to your template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableVariables.map((variable) => (
                  <div
                    key={variable.key}
                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted cursor-pointer"
                    onClick={() => copyToClipboard(variable.key)}
                  >
                    <div className="flex-1 min-w-0">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {variable.key}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {variable.description}
                      </p>
                    </div>
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {formData.body && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send
                    className="h-4 w-4 cursor-pointer text-green-600"
                    title="Kirim WhatsApp Reminder"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/send-wa-reminder", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            template_id: 6,
                            trigger_on: "reminder",
                            ...formData,
                          }),
                        });
                        if (!res.ok)
                          throw new Error("Gagal mengirim WhatsApp reminder");
                        toast.success("WhatsApp reminder berhasil dikirim!");
                      } catch (err) {
                        toast.error("Gagal mengirim WhatsApp reminder");
                      }
                    }}
                  />
                  Preview
                </CardTitle>
                <CardDescription>
                  Kirim WhatsApp reminder ke customer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: isRichText
                        ? previewContent()
                        : `<pre>${previewContent()}</pre>`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
