"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RichTextEditor } from "@/components/rich-text-editor"
import { sql } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, Save, X } from "lucide-react"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface PaymentChannel {
  id: number
  pg_name: string
  pg_code: string
}

interface PaymentInstruction {
  id: number
  payment_channel_id: number
  title: string
  description: string
  step_order: number
  created_at: string
  updated_at: string
}

interface SortableItemProps {
  instruction: PaymentInstruction
  onEdit: (instruction: PaymentInstruction) => void
  onDelete: (id: number) => void
}

function SortableItem({ instruction, onEdit, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: instruction.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr ref={setNodeRef} style={style} className={isDragging ? "bg-gray-50" : ""}>
      <td className="w-4 p-2">
        <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-100 rounded">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </td>
      <td className="w-12 p-2">
        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
          {instruction.step_order}
        </Badge>
      </td>
      <td className="p-2 font-medium">{instruction.title}</td>
      <td className="w-40 p-2 text-sm text-gray-500">{new Date(instruction.created_at).toLocaleDateString()}</td>
      <td className="w-32 p-2">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(instruction)} className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(instruction.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

export default function PaymentInstructionsPage() {
  const params = useParams()
  const { toast } = useToast()
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel | null>(null)
  const [instructions, setInstructions] = useState<PaymentInstruction[]>([])
  const [loading, setLoading] = useState(true)
  const [editingInstruction, setEditingInstruction] = useState<PaymentInstruction | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    if (params.id) {
      fetchData()
    }
  }, [params.id])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch payment channel
      const channelData = await sql`
        SELECT * FROM payment_channels WHERE id = ${params.id}
      `

      if (channelData.length === 0) {
        throw new Error("Payment channel not found")
      }
      setPaymentChannel(channelData[0])

      // Fetch instructions
      const instructionsData = await sql`
        SELECT * FROM payment_instructions 
        WHERE payment_channel_id = ${params.id} 
        ORDER BY step_order ASC
      `

      setInstructions(instructionsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch payment instructions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearRedis = async () => {
    try {
      await fetch("/api/clear-redis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "payment_instructions" }),
      })
    } catch (e) {
      // Optional: bisa tambahkan toast error jika perlu
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = instructions.findIndex((item) => item.id === active.id)
    const newIndex = instructions.findIndex((item) => item.id === over.id)

    const newInstructions = arrayMove(instructions, oldIndex, newIndex)
    setInstructions(newInstructions)

    // Update step_order in database
    try {
      const updates = newInstructions.map((instruction, index) => ({
        id: instruction.id,
        step_order: index + 1,
      }))

      for (const update of updates) {
        await sql`
          UPDATE payment_instructions 
          SET step_order = ${update.step_order}, updated_at = NOW() 
          WHERE id = ${update.id}
        `
      }

      await clearRedis()
      toast({
        title: "Success",
        description: "Instructions reordered successfully",
      })
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "Failed to update instruction order",
        variant: "destructive",
      })
      // Revert the change
      fetchData()
    }
  }

  const handleEdit = (instruction: PaymentInstruction) => {
    setEditingInstruction(instruction)
    setFormData({
      title: instruction.title,
      description: instruction.description,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this instruction?")) {
      return
    }

    try {
      // Delete instruction from database
      await sql`DELETE FROM payment_instructions WHERE id = ${id}`

      toast({
        title: "Success",
        description: "Instruction deleted successfully",
      })

      await clearRedis()
      fetchData()
    } catch (error) {
      console.error("Error deleting instruction:", error)
      toast({
        title: "Error",
        description: "Failed to delete instruction",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      if (editingInstruction) {
        // Update existing instruction in database
        await sql`
          UPDATE payment_instructions 
          SET title = ${formData.title}, 
              description = ${formData.description}, 
              updated_at = NOW() 
          WHERE id = ${editingInstruction.id}
        `

        toast({
          title: "Success",
          description: "Instruction updated successfully",
        })
      } else {
        // Create new instruction in database
        const nextStepOrder = Math.max(...instructions.map((i) => i.step_order), 0) + 1

        await sql`
          INSERT INTO payment_instructions (payment_channel_id, title, description, step_order, created_at, updated_at)
          VALUES (${Number(params.id)}, ${formData.title}, ${formData.description}, ${nextStepOrder}, NOW(), NOW())
        `

        toast({
          title: "Success",
          description: "Instruction created successfully",
        })
      }

      await clearRedis()
      setShowForm(false)
      setEditingInstruction(null)
      setFormData({ title: "", description: "" })
      fetchData()
    } catch (error) {
      console.error("Error saving instruction:", error)
      toast({
        title: "Error",
        description: "Failed to save instruction",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingInstruction(null)
    setFormData({ title: "", description: "" })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payment-channels">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Payment Instructions</h1>
            <p className="text-gray-600">
              {paymentChannel?.pg_name} ({paymentChannel?.pg_code})
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Instruksi
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingInstruction ? "Edit Instruksi Pembayaran" : "Tambah Instruksi Pembayaran"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Instruksi</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Pembayaran dengan Livin by Mandiri"
                  required
                />
              </div>

              <div className="space-y-2">
                <RichTextEditor
                  label="Deskripsi Detail"
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Enter detailed payment instructions here..."
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Menyimpan..." : editingInstruction ? "Update" : "Simpan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Instruksi Pembayaran ({instructions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {instructions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Belum ada instruksi pembayaran.</p>
              <p className="text-sm">Klik "Tambah Instruksi" untuk menambahkan instruksi pertama.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="w-4 p-2"></th>
                      <th className="w-12 p-2 text-left">No</th>
                      <th className="p-2 text-left">Judul</th>
                      <th className="w-40 p-2 text-left">Tanggal Dibuat</th>
                      <th className="w-32 p-2 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <SortableContext items={instructions} strategy={verticalListSortingStrategy}>
                      {instructions.map((instruction) => (
                        <SortableItem
                          key={instruction.id}
                          instruction={instruction}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                </table>
              </div>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
