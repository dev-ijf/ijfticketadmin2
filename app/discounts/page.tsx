"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SimpleTableHeader } from "@/components/table-header"

type Discount = {
  id: number
  code: string
  description: string | null
  discount_type: "percentage" | "fixed_amount"
  value: number
  valid_until: string | null
  minimum_amount: number | null
  max_discount_amount: number | null
  usage_limit: number | null
  usage_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type DiscountInsert = {
  code: string
  description: string
  discount_type: "percentage" | "fixed_amount"
  value: number
  valid_until: string
  minimum_amount: number
  max_discount_amount: number
  usage_limit: number
  usage_count: number
  is_active: boolean
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState<DiscountInsert>({
    code: "",
    description: "",
    discount_type: "percentage",
    value: 0,
    valid_until: "",
    minimum_amount: 0,
    max_discount_amount: 0,
    usage_limit: 0,
    usage_count: 0,
    is_active: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchDiscounts()
  }, [])

  const fetchDiscounts = async () => {
    try {
      const response = await fetch("/api/discounts")
      if (!response.ok) throw new Error("Failed to fetch discounts")
      const data = await response.json()
      setDiscounts(data)
    } catch (error) {
      console.error("Error fetching discounts:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data discounts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingDiscount) {
        const response = await fetch("/api/discounts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingDiscount.id, ...formData }),
        })
        if (!response.ok) throw new Error("Failed to update discount")
        toast({
          title: "Berhasil",
          description: "Discount berhasil diperbarui",
        })
      } else {
        const response = await fetch("/api/discounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!response.ok) throw new Error("Failed to create discount")
        toast({
          title: "Berhasil",
          description: "Discount berhasil ditambahkan",
        })
      }

      setDialogOpen(false)
      setEditingDiscount(null)
      setFormData({
        code: "",
        description: "",
        discount_type: "percentage",
        value: 0,
        valid_until: "",
        minimum_amount: 0,
        max_discount_amount: 0,
        usage_limit: 0,
        usage_count: 0,
        is_active: true,
      })
      fetchDiscounts()
    } catch (error) {
      console.error("Error saving discount:", error)
      toast({
        title: "Error",
        description: "Gagal menyimpan discount",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount)
    setFormData({
      code: discount.code,
      description: discount.description || "",
      discount_type: discount.discount_type,
      value: Number(discount.value),
      valid_until: discount.valid_until ? new Date(discount.valid_until).toISOString().slice(0, 16) : "",
      minimum_amount: Number(discount.minimum_amount) || 0,
      max_discount_amount: Number(discount.max_discount_amount) || 0,
      usage_limit: discount.usage_limit || 0,
      usage_count: discount.usage_count,
      is_active: discount.is_active,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus discount ini?")) return

    try {
      const response = await fetch(`/api/discounts?id=${id}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete discount")
      toast({
        title: "Berhasil",
        description: "Discount berhasil dihapus",
      })
      fetchDiscounts()
    } catch (error) {
      console.error("Error deleting discount:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus discount",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredDiscounts = discounts.filter(
    (discount) =>
      discount.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (discount.description && discount.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Discounts</h1>
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
        <h1 className="text-3xl font-bold text-gray-900">Discounts</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Discount
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingDiscount ? "Edit Discount" : "Tambah Discount Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Kode Discount</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Tipe Discount</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: "percentage" | "fixed_amount") =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Persentase (%)</SelectItem>
                      <SelectItem value="fixed_amount">Nominal Tetap (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Nilai {formData.discount_type === "percentage" ? "(%)" : "(Rp)"}</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Berlaku Sampai</Label>
                  <Input
                    id="valid_until"
                    type="datetime-local"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimum_amount">Minimum Pembelian (Rp)</Label>
                  <Input
                    id="minimum_amount"
                    type="number"
                    value={formData.minimum_amount}
                    onChange={(e) => setFormData({ ...formData, minimum_amount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_discount_amount">Maksimal Discount (Rp)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Batas Penggunaan</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Aktif</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    setEditingDiscount(null)
                    setFormData({
                      code: "",
                      description: "",
                      discount_type: "percentage",
                      value: 0,
                      valid_until: "",
                      minimum_amount: 0,
                      max_discount_amount: 0,
                      usage_limit: 0,
                      usage_count: 0,
                      is_active: true,
                    })
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  {editingDiscount ? "Perbarui" : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cari Discount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari berdasarkan kode atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Discounts ({filteredDiscounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SimpleTableHeader>Kode</SimpleTableHeader>
                <SimpleTableHeader>Tipe & Nilai</SimpleTableHeader>
                <SimpleTableHeader>Syarat</SimpleTableHeader>
                <SimpleTableHeader>Penggunaan</SimpleTableHeader>
                <SimpleTableHeader>Berlaku Sampai</SimpleTableHeader>
                <SimpleTableHeader>Status</SimpleTableHeader>
                <SimpleTableHeader>Aksi</SimpleTableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiscounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell>
                    <div>
                      <div className="font-mono font-medium">{discount.code}</div>
                      {discount.description && <div className="text-sm text-gray-500">{discount.description}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="outline">
                        {discount.discount_type === "percentage" ? "Persentase" : "Nominal"}
                      </Badge>
                      <div className="font-medium mt-1">
                        {discount.discount_type === "percentage"
                          ? `${discount.value}%`
                          : formatCurrency(Number(discount.value))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      {discount.minimum_amount && <div>Min: {formatCurrency(Number(discount.minimum_amount))}</div>}
                      {discount.max_discount_amount && (
                        <div>Max: {formatCurrency(Number(discount.max_discount_amount))}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>
                        {discount.usage_count} / {discount.usage_limit || "∞"}
                      </div>
                      {discount.usage_limit && (
                        <div className="text-xs text-gray-500">Sisa: {discount.usage_limit - discount.usage_count}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {discount.valid_until ? formatDate(discount.valid_until) : "Tidak terbatas"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={discount.is_active ? "default" : "destructive"}>
                      {discount.is_active ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(discount)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(discount.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
