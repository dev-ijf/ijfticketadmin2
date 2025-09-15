"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Copy, ArrowLeft, Save, Eye } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import dynamic from "next/dynamic"
import { Textarea } from "@/components/ui/textarea"

const RichTextEditor = dynamic(() => import("@/components/rich-text-editor").then((mod) => mod.RichTextEditor), {
  ssr: false,
})

const availableVariables = [
  { key: "{{customer.name}}", description: "Nama customer" },
  { key: "{{event.name}}", description: "Nama event" },
  { key: "{{event_name}}", description: "Nama event (baru)" },
  { key: "{{event_location}}", description: "Lokasi event" },
  { key: "{{event_start_date}}", description: "Tanggal & jam event (format: Sabtu, 26 Juli 2025 jam 08:00:00 - Sabtu, 26 Juli 2025 jam 15:00:00)" },
  { key: "{{order.order_reference}}", description: "Nomor referensi order" },
  { key: "{{order.final_amount}}", description: "Total pembayaran" },
  { key: "{{payment_deadline}}", description: "Batas waktu pembayaran" },
  { key: "{{payment_channel.pg_name}}", description: "Nama payment gateway" },
  { key: "{{virtual_account_number}}", description: "Nomor virtual account" },
  { key: "{{payment_response_url}}", description: "URL response pembayaran" },
]

export default function CreateNotificationTemplate() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isRichText, setIsRichText] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    channel: "",
    trigger_on: "",
    subject: "",
    body: "",
    is_active: true,
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Variable copied to clipboard!")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (formData.trigger_on !== 'checkout' && formData.trigger_on !== 'paid' && formData.trigger_on !== 'reminder') {
        toast.error('Trigger On harus checkout, paid, atau reminder!')
        setLoading(false)
        return
      }
      const { error } = await supabase.from("notification_templates").insert([{ ...formData }])
      if (error) throw error
      toast.success("Template created successfully!")
      router.push("/notification-templates")
    } catch (error) {
      console.error("Error creating template:", error, JSON.stringify(error))
      toast.error("Failed to create template")
    } finally {
      setLoading(false)
    }
  }

  const previewContent = () => {
    let preview = formData.body
    const sampleData: Record<string, string> = {
      "{{customer.name}}": "John Doe",
      "{{event.name}}": "Tech Conference 2024",
      "{{event_name}}": "Tech Conference 2024",
      "{{event_location}}": "Jakarta Convention Center",
      "{{event_start_date}}": "Sabtu, 26 Juli 2025 jam 08:00:00 - Sabtu, 26 Juli 2025 jam 15:00:00",
      "{{order.order_reference}}": "ORD-2024-001",
      "{{order.final_amount}}": "Rp 500,000",
      "{{payment_deadline}}": "2024-01-15 23:59",
      "{{payment_channel.pg_name}}": "Bank BCA",
      "{{virtual_account_number}}": "1234567890123456",
      "{{payment_response_url}}": "https://example.com/payment/response",
    }
    availableVariables.forEach((variable) => {
      preview = preview.replace(
        new RegExp(variable.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        sampleData[variable.key] || variable.key,
      )
    })
    return preview
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Notification Template</h1>
          <p className="text-muted-foreground">Create a new notification template for your events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
              <CardDescription>Fill in the template information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Payment Confirmation"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="channel">Channel</Label>
                    <Select
                      value={formData.channel}
                      onValueChange={(value) => setFormData({ ...formData, channel: value })}
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
                  <div className="space-y-2">
                    <Label htmlFor="trigger_on">Trigger On</Label>
                    <Select
                      value={formData.trigger_on}
                      onValueChange={(value) => setFormData({ ...formData, trigger_on: value })}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject (for Email)</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., Payment Confirmation for {{event.name}}"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Content</Label>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">Plain Text</span>
                    <input type="checkbox" checked={isRichText} onChange={() => setIsRichText(v => !v)} id="toggle-richtext" title="Toggle rich text editor" placeholder="Toggle rich text editor" />
                    <span className="text-sm">Rich Text</span>
                  </div>
                  {isRichText ? (
                    <RichTextEditor
                      value={formData.body}
                      onChange={(value) => setFormData({ ...formData, body: value })}
                      placeholder="Enter your template content here. Use variables like {{customer.name}} for dynamic content."
                    />
                  ) : (
                    <Textarea
                      id="body"
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      placeholder="Enter plain text content here. Use variables like {{customer.name}} for dynamic content."
                      rows={8}
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Creating..." : "Create Template"}
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
              <CardDescription>Click to copy variables to your template</CardDescription>
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
                      <p className="text-xs text-muted-foreground mt-1">{variable.description}</p>
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
                  <Eye className="h-4 w-4" />
                  Preview
                </CardTitle>
                <CardDescription>Preview with sample data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <div dangerouslySetInnerHTML={{ __html: isRichText ? previewContent() : `<pre>${previewContent()}</pre>` }} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
