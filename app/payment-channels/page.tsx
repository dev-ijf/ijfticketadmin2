"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Plus, Edit, Trash2, Search, CreditCard, FileText, GripVertical } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { SimpleTableHeader } from "@/components/table-header"
import type { Database } from "@/lib/supabase"
import Image from "next/image"
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
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type PaymentChannel = Database["public"]["Tables"]["payment_channels"]["Row"] & { image_qris?: string }
type PaymentChannelInsert = Database["public"]["Tables"]["payment_channels"]["Insert"] & { image_qris?: string }
type PaymentChannelUpdate = Database["public"]["Tables"]["payment_channels"]["Update"] & { image_qris?: string }

export default function PaymentChannelsPage() {
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<PaymentChannel | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState<PaymentChannelInsert>({
    pg_code: "",
    pg_name: "",
    pg_type: "",
    image_url: "",
    is_active: true,
    is_redirect: false,
    vendor: "",
    category: "",
    image_qris: "",
  })
  const { toast } = useToast()
  const [savingOrder, setSavingOrder] = useState(false)

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
    fetchPaymentChannels()
  }, [])

  const fetchPaymentChannels = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_channels")
        .select("*")
        .order("sort_order", { ascending: true })

      if (error) throw error
      setPaymentChannels(data || [])
    } catch (error) {
      console.error("Error fetching payment channels:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data payment channels",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearRedis = async () => {
    try {
      await fetch('/api/clear-redis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'payment_channels' }),
      })
    } catch (e) {
      // Optional: bisa tambahkan toast error jika perlu
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.pg_code || !formData.pg_name) {
      toast({
        title: "Error",
        description: "Payment code dan payment name harus diisi",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingChannel) {
        const { error } = await supabase
          .from("payment_channels")
          .update(formData as PaymentChannelUpdate)
          .eq("id", editingChannel.id)

        if (error) throw error
        toast({
          title: "Berhasil",
          description: "Payment channel berhasil diperbarui",
        })
      } else {
        const { error } = await supabase.from("payment_channels").insert([formData])

        if (error) throw error
        toast({
          title: "Berhasil",
          description: "Payment channel berhasil ditambahkan",
        })
      }
      await clearRedis()
      setDialogOpen(false)
      setEditingChannel(null)
      resetForm()
      fetchPaymentChannels()
    } catch (error) {
      console.error("Error saving payment channel:", error)
      toast({
        title: "Error",
        description: "Gagal menyimpan payment channel",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      pg_code: "",
      pg_name: "",
      pg_type: "",
      image_url: "",
      is_active: true,
      is_redirect: false,
      vendor: "",
      category: "",
      image_qris: "",
    })
  }

  const handleEdit = (channel: PaymentChannel) => {
    setEditingChannel(channel)
    setFormData({
      pg_code: channel.pg_code,
      pg_name: channel.pg_name,
      pg_type: channel.pg_type,
      image_url: channel.image_url || "",
      is_active: channel.is_active,
      is_redirect: channel.is_redirect,
      vendor: channel.vendor || "",
      category: channel.category || "",
      image_qris: channel.image_qris || "",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus payment channel ini?")) return

    try {
      const { error } = await supabase.from("payment_channels").delete().eq("id", id)

      if (error) throw error
      toast({
        title: "Berhasil",
        description: "Payment channel berhasil dihapus",
      })
      await clearRedis()
      fetchPaymentChannels()
    } catch (error) {
      console.error("Error deleting payment channel:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus payment channel",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingChannel(null)
    resetForm()
  }

  const filteredChannels = paymentChannels.filter(
    (channel) =>
      channel.pg_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      channel.pg_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (channel.vendor && channel.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (channel.category && channel.category.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Komponen SortableItem untuk drag-and-drop
  function SortableItem({ channel, onEdit, onDelete }: { channel: PaymentChannel, onEdit: (c: PaymentChannel) => void, onDelete: (id: number) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: channel.id })
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }
    return (
      <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-gray-50" : ""}>
        <TableCell className="w-4 p-2 align-middle">
          <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-100 rounded">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <div className="w-16 h-10 relative">
              {channel.image_url ? (
                <Image
                  src={channel.image_url || "/placeholder.svg"}
                  alt={channel.pg_name}
                  fill
                  className="object-contain rounded"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
            {channel.image_qris && (
              <div className="w-16 h-10 relative">
                <Image
                  src={channel.image_qris}
                  alt="QRIS"
                  fill
                  className="object-contain rounded"
                />
              </div>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div>
            <div className="font-medium">{channel.pg_name}</div>
            <div className="text-sm text-gray-500 font-mono">{channel.pg_code}</div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="outline" className="capitalize">
            {channel.vendor || "-"}
          </Badge>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="capitalize">
            {channel.category || "-"}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="space-y-1">
            <Badge variant={channel.is_active ? "default" : "destructive"} className="text-white">
              {channel.is_active ? "Active" : "Inactive"}
            </Badge>
            {channel.is_redirect && (
              <Badge variant="outline" className="block w-fit">
                Redirect
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(channel)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Link href={`/payment-channels/${channel.id}/instructions`}>
              <Button size="sm" variant="outline">
                <FileText className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={() => onDelete(channel.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  // Handler drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = paymentChannels.findIndex((item) => item.id === active.id)
    const newIndex = paymentChannels.findIndex((item) => item.id === over.id)
    const newChannels = arrayMove(paymentChannels, oldIndex, newIndex)
    setPaymentChannels(newChannels)
    setSavingOrder(true)
    try {
      const updates = newChannels.map((channel, index) => ({
        id: channel.id,
        sort_order: index + 1,
      }))
      for (const update of updates) {
        const { error } = await supabase
          .from("payment_channels")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id)
        if (error) throw error
      }
      await clearRedis()
      toast({
        title: "Berhasil",
        description: "Urutan payment channel berhasil diperbarui",
      })
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui urutan payment channel",
        variant: "destructive",
      })
      fetchPaymentChannels()
    } finally {
      setSavingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Payment Channels</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Payment Channels</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Payment Channel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingChannel ? "Edit Payment Channel" : "Tambah Payment Channel Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pg_code">Payment Code *</Label>
                  <Input
                    id="pg_code"
                    value={formData.pg_code}
                    onChange={(e) => setFormData({ ...formData, pg_code: e.target.value })}
                    placeholder="Contoh: BNI_VA"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pg_name">Payment Name *</Label>
                  <Input
                    id="pg_name"
                    value={formData.pg_name}
                    onChange={(e) => setFormData({ ...formData, pg_name: e.target.value })}
                    placeholder="Contoh: BNI Virtual Account"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Select
                    value={formData.vendor || ""}
                    onValueChange={(value) => setFormData({ ...formData, vendor: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faspay">Faspay</SelectItem>
                      <SelectItem value="midtrans">Midtrans</SelectItem>
                      <SelectItem value="xendit">Xendit</SelectItem>
                      <SelectItem value="duitku">Duitku</SelectItem>
                      <SelectItem value="moota">Moota</SelectItem>
                      <SelectItem value="tripay">Tripay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category || ""}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="va">Virtual Account</SelectItem>
                      <SelectItem value="ewallet">E-Wallet</SelectItem>
                      <SelectItem value="store">Convenience Store</SelectItem>
                      <SelectItem value="installment">Installment</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="qris_statis">QRIS Statis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo Payment Channel</Label>
                <ImageUpload
                  value={formData.image_url || ""}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  bucket="payment-channels"
                  folder="logos"
                  label="Upload Logo"
                />
              </div>

              {formData.category === "qris_statis" && (
                <div className="space-y-2">
                  <Label>Gambar QRIS</Label>
                  <ImageUpload
                    value={formData.image_qris || ""}
                    onChange={(url) => setFormData({ ...formData, image_qris: url })}
                    bucket="payment-channels"
                    folder="qris"
                    label="Upload Gambar QRIS"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_redirect"
                    checked={formData.is_redirect}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_redirect: checked })}
                  />
                  <Label htmlFor="is_redirect">Redirect</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Batal
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingChannel ? "Perbarui" : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cari Payment Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari berdasarkan nama, code, vendor, atau category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Payment Channels ({filteredChannels.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {savingOrder && <div className="text-sm text-gray-500 mb-2">Menyimpan urutan...</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <SimpleTableHeader>{/* leave empty for handle */}</SimpleTableHeader>
                <SimpleTableHeader>Logo</SimpleTableHeader>
                <SimpleTableHeader>Payment Info</SimpleTableHeader>
                <SimpleTableHeader>Vendor</SimpleTableHeader>
                <SimpleTableHeader>Category</SimpleTableHeader>
                <SimpleTableHeader>Status</SimpleTableHeader>
                <SimpleTableHeader>Aksi</SimpleTableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredChannels.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {filteredChannels.map((channel) => (
                    <SortableItem
                      key={channel.id}
                      channel={channel}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
