"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Eye, Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const availableVariables = [
  { key: "{{customer.name}}", description: "Nama customer" },
  { key: "{{event.name}}", description: "Nama event" },
  { key: "{{order.order_reference}}", description: "Nomor referensi order" },
  { key: "{{order.final_amount}}", description: "Total pembayaran" },
  { key: "{{payment_deadline}}", description: "Batas waktu pembayaran" },
  { key: "{{payment_channel.pg_name}}", description: "Nama payment gateway" },
  { key: "{{virtual_account_number}}", description: "Nomor virtual account" },
  { key: "{{payment_response_url}}", description: "URL response pembayaran" },
]

interface Template {
  id: string
  name: string
  type: string
  channel: string
  subject: string
  body: string // ganti dari content ke body
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function NotificationTemplateDetail() {
  const router = useRouter()
  const params = useParams()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchTemplate()
  }, [params.id])

  const fetchTemplate = async () => {
    try {
      const { data, error } = await supabase.from("notification_templates").select("*").eq("id", params.id).single()

      if (error) throw error
      setTemplate(data)
    } catch (error) {
      console.error("Error fetching template:", error)
      toast.error("Failed to load template")
      router.push("/notification-templates")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      const { error } = await supabase.from("notification_templates").delete().eq("id", params.id)

      if (error) throw error

      toast.success("Template deleted successfully!")
      router.push("/notification-templates")
    } catch (error) {
      console.error("Error deleting template:", error)
      toast.error("Failed to delete template")
    } finally {
      setDeleteLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Variable copied to clipboard!")
  }

  const previewContent = () => {
    if (!template) return ""

    let preview = template.body || ""
    availableVariables.forEach((variable) => {
      const sampleData: Record<string, string> = {
        "{{customer.name}}": "John Doe",
        "{{event.name}}": "Tech Conference 2024",
        "{{order.order_reference}}": "ORD-2024-001",
        "{{order.final_amount}}": "Rp 500,000",
        "{{payment_deadline}}": "2024-01-15 23:59",
        "{{payment_channel.pg_name}}": "Bank BCA",
        "{{virtual_account_number}}": "1234567890123456",
        "{{payment_response_url}}": "https://example.com/payment/response",
      }
      preview = preview.replace(
        new RegExp(variable.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        sampleData[variable.key] || variable.key,
      )
    })
    return preview
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      payment_confirmation: "Payment Confirmation",
      payment_reminder: "Payment Reminder",
      ticket_delivery: "Ticket Delivery",
      event_reminder: "Event Reminder",
      cancellation: "Cancellation",
    }
    return types[type] || type
  }

  const getChannelColor = (channel: string) => {
    const colors: Record<string, string> = {
      email: "bg-blue-100 text-blue-800",
      whatsapp: "bg-green-100 text-green-800",
      sms: "bg-yellow-100 text-yellow-800",
    }
    return colors[channel] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Template not found</h1>
          <Button onClick={() => router.push("/notification-templates")} className="mt-4">
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <p className="text-muted-foreground">Notification template details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push(`/notification-templates/${template.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the template.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleteLoading}>
                  {deleteLoading ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="text-sm">{getTypeLabel(template.type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Channel</label>
                  <div className="mt-1">
                    <Badge className={getChannelColor(template.channel)}>{template.channel.toUpperCase()}</Badge>
                  </div>
                </div>
              </div>

              {template.subject && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <p className="text-sm">{template.subject}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={template.is_active ? "default" : "secondary"}>
                    {template.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(template.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated</label>
                  <p className="text-sm">{new Date(template.updated_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <div dangerouslySetInnerHTML={{ __html: template.body }} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview with Sample Data
              </CardTitle>
              <CardDescription>How the template will look with actual data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <div dangerouslySetInnerHTML={{ __html: previewContent() }} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Available Variables</CardTitle>
              <CardDescription>Variables used in this template</CardDescription>
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
        </div>
      </div>
    </div>
  )
}
