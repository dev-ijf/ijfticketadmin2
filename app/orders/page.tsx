"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { Search, Filter, Download, RefreshCw, ExternalLink, Upload, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SimpleTableHeader } from "@/components/table-header"
import type { Database } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import * as XLSX from "xlsx"
import { Loader2 } from "lucide-react"
import { ImageUpload } from "@/components/image-upload"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  customers: Database["public"]["Tables"]["customers"]["Row"] & { phone_number?: string | null }
  events: Database["public"]["Tables"]["events"]["Row"]
  payment_channels?: Database["public"]["Tables"]["payment_channels"]["Row"] & { category?: string | null }
  proof_transfer?: string | null
  status: string
  order_date: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [events, setEvents] = useState<Database["public"]["Tables"]["events"]["Row"][]>([])
  const { toast } = useToast()
  const [proofModalOpen, setProofModalOpen] = useState(false)
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [paymentChannelFilter, setPaymentChannelFilter] = useState<string>("all")
  const [paymentChannels, setPaymentChannels] = useState<Database["public"]["Tables"]["payment_channels"]["Row"][]>([])
  const [rowLoading, setRowLoading] = useState<{ [orderId: number]: boolean }>({})
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; order: Order | null; checked: boolean }>({
    open: false,
    order: null,
    checked: false,
  })
  const [uploading, setUploading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null)
  const [backendRows, setBackendRows] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [backendLoading, setBackendLoading] = useState(false)
  const [importingFinal, setImportingFinal] = useState(false)
  const [importSummary, setImportSummary] = useState<any>(null)
  const inputFileRef = useRef<HTMLInputElement>(null)
  const [waLoading, setWaLoading] = useState<{ [orderId: number]: boolean }>({})
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 })
  const [bulkStatus, setBulkStatus] = useState<string[]>([])
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false)
  const [manualOrderOpen, setManualOrderOpen] = useState(false)
  // State untuk form manual order
  const [manualForm, setManualForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventId: "",
    ticketTypeId: "",
    ticketQty: 1,
    paymentChannelId: "",
    proofTransfer: "",
  })
  const [manualFormErrors, setManualFormErrors] = useState<any>({})
  const [manualTicketTypes, setManualTicketTypes] = useState<any[]>([])
  const [manualLoading, setManualLoading] = useState(false)
  const [manualOrderConfirmOpen, setManualOrderConfirmOpen] = useState(false)

  // Ambil event untuk select
  useEffect(() => {
    if (manualOrderOpen) {
      fetchEvents()
    }
  }, [manualOrderOpen])

  // Ambil ticket types saat event berubah
  useEffect(() => {
    if (manualForm.eventId) {
      fetchTicketTypes(manualForm.eventId)
    } else {
      setManualTicketTypes([])
      setManualForm((f) => ({ ...f, ticketTypeId: "" }))
    }
  }, [manualForm.eventId])

  const fetchTicketTypes = async (eventId: string) => {
    setManualTicketTypes([])
    if (!eventId) return
    const { data, error } = await supabase
      .from("ticket_types")
      .select("id, name, price, tickets_per_purchase")
      .eq("event_id", eventId)
      .order("name")
    if (!error) setManualTicketTypes(data || [])
  }

  // Filter payment channel kategori bank_transfer/qris_statis
  const manualPaymentChannels = paymentChannels.filter(
    (c) => c.category === "bank_transfer" || c.category === "qris_statis",
  )

  // Validasi sederhana
  const validateManualForm = () => {
    const err: any = {}
    if (!manualForm.name) err.name = "Wajib diisi"
    if (!manualForm.email) err.email = "Wajib diisi"
    if (!manualForm.phone) err.phone = "Wajib diisi"
    if (!manualForm.eventId) err.eventId = "Wajib diisi"
    if (!manualForm.ticketTypeId) err.ticketTypeId = "Wajib diisi"
    if (!manualForm.paymentChannelId) err.paymentChannelId = "Wajib diisi"
    if (!manualForm.proofTransfer) err.proofTransfer = "Wajib diupload"
    setManualFormErrors(err)
    return Object.keys(err).length === 0
  }

  useEffect(() => {
    fetchOrders()
    fetchEvents()
    fetchPaymentChannels()
  }, [])

  const fetchPaymentChannels = async () => {
    try {
      const { data, error } = await supabase.from("payment_channels").select("*")
      if (error) throw error
      setPaymentChannels(data || [])
    } catch (error) {
      console.error("Error fetching payment channels:", error)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from("events").select("*").order("name")
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          proof_transfer,
          status,
          order_date,
          customers (
            id,
            name,
            email,
            phone_number
          ),
          events (
            id,
            name,
            start_date,
            location
          ),
          payment_channels (
            id,
            pg_name,
            pg_code,
            category
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data orders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending", className: "text-white bg-yellow-500" },
      paid: { variant: "default" as const, label: "Paid", className: "text-white bg-green-500" },
      cancelled: { variant: "destructive" as const, label: "Cancelled", className: "text-white bg-red-500" },
      expired: { variant: "outline" as const, label: "Expired", className: "text-white bg-gray-500" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Ambil daftar unik payment channel dari orders
  const paymentChannelsFromOrders = Array.from(
    new Map(
      orders.filter((o) => o.payment_channels).map((o) => [o.payment_channels!.pg_code, o.payment_channels]),
    ).values(),
  )

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customers?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.events?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesEvent = eventFilter === "all" || order.event_id.toString() === eventFilter
    const matchesPaymentChannel =
      paymentChannelFilter === "all" ||
      (order.payment_channels && order.payment_channels.pg_code === paymentChannelFilter)

    return matchesSearch && matchesStatus && matchesEvent && matchesPaymentChannel
  })

  const totalPages = Math.ceil(filteredOrders.length / pageSize)
  const pagedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Helper: Delete tickets for an order
  const deleteTicketsForOrder = async (orderId: number) => {
    const { error } = await supabase.from("tickets").delete().eq("order_id", orderId)
    if (error) throw error
  }

  const deleteTickets = async (orderId: number) => {
    const { error } = await supabase.from("tickets").delete().eq("order_id", orderId)
    if (error) throw error
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL

  const sendWhatsAppPaidNotif = async (order: Order) => {
    try {
      const response = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          templateId: 4,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to send WhatsApp")
      }

      toast({
        title: "WA Sukses",
        description: "Notifikasi WhatsApp berhasil dikirim.",
      })
    } catch (err: any) {
      toast({
        title: "WA Error",
        description: err.message || "Gagal kirim WhatsApp",
        variant: "destructive",
      })
    }
  }

  // Toggle handler (called after confirmation)
  const handleToggle = async (order: Order, checked: boolean) => {
    setRowLoading((prev) => ({ ...prev, [order.id]: true }))
    try {
      if (checked) {
        // ON: panggil API backend untuk issue tickets & WhatsApp
        const resp = await fetch("/api/issue-tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: order.id }),
        })
        const result = await resp.json()
        if (!resp.ok) {
          throw new Error(result.error || "Gagal membuat tiket/kirim WhatsApp")
        }
        toast({ title: "Sukses", description: "Order di-mark paid, tiket dibuat & WA dikirim." })
        await fetchOrders()
      } else {
        // OFF: set pending, delete tickets (langsung dari frontend)
        const { error: updateError } = await supabase.from("orders").update({ status: "pending" }).eq("id", order.id)
        if (updateError) throw updateError
        await deleteTicketsForOrder(order.id)
        toast({ title: "Sukses", description: "Order di-mark pending & tiket dihapus." })
        await fetchOrders()
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Gagal update order/ticket", variant: "destructive" })
    } finally {
      setRowLoading((prev) => ({ ...prev, [order.id]: false }))
      setConfirmModal({ open: false, order: null, checked: false })
    }
  }

  // Handler untuk file input
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log("File selected:", file)
    if (file && file.name.endsWith(".xlsx")) {
      setUploadFile(file)
      setUploading(true)
      try {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" })
        // Konversi order_date jika serial Excel
        const mapped = json
          .map((row: any) => {
            let order_date = row.order_date
            if (typeof order_date === "number") {
              order_date = XLSX.SSF.format("yyyy-mm-dd HH:MM:SS", order_date)
            }
            return { ...row, order_date }
          })
          .filter((row: any) => Object.values(row).some((v) => v !== "" && v !== null && v !== undefined))
        // Langsung upload ke backend
        const resp = await fetch("/api/upload/orders-temp-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: mapped }),
        })
        if (!resp.ok) throw new Error("Gagal upload ke backend")
        const dataResp = await resp.json()
        setUploadSessionId(dataResp.upload_session_id)
        // Fetch preview dari backend
        setBackendLoading(true)
        try {
          const previewResp = await fetch(
            `/api/upload/orders-temp-preview?upload_session_id=${dataResp.upload_session_id}`,
          )
          if (!previewResp.ok) throw new Error("Gagal ambil preview dari backend")
          const previewData = await previewResp.json()
          setBackendRows(previewData.rows || [])
        } finally {
          setBackendLoading(false)
        }
        setPreviewOpen(true)
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" })
        setBackendLoading(false)
      } finally {
        setUploading(false)
      }
    } else {
      toast({ title: "Format Salah", description: "Hanya file .xlsx yang diterima", variant: "destructive" })
    }
  }

  // Handler upload (parsing XLSX & tampilkan preview modal)
  const handleUpload = async () => {
    if (!uploadFile) return
    setUploading(true)
    try {
      console.log("Uploading file:", uploadFile)
      const data = await uploadFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" })
      // Filter baris kosong (semua kolom kosong)
      const filtered = json.filter((row: any) =>
        Object.values(row).some((v) => v !== "" && v !== null && v !== undefined),
      )
      console.log("Parsed rows:", filtered)
      setParsedRows(filtered)
      setPreviewOpen(true)
    } catch (err: any) {
      toast({ title: "Gagal parsing file", description: err.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  // Fungsi untuk upload ke backend
  const handleImportToBackend = async () => {
    if (!parsedRows.length) return
    setImporting(true)
    try {
      const resp = await fetch("/api/upload/orders-temp-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows }),
      })
      if (!resp.ok) throw new Error("Gagal upload ke backend")
      const data = await resp.json()
      setUploadSessionId(data.upload_session_id)
      // Fetch preview dari backend
      setBackendLoading(true)
      const previewResp = await fetch(`/api/upload/orders-temp-preview?upload_session_id=${data.upload_session_id}`)
      if (!previewResp.ok) throw new Error("Gagal ambil preview dari backend")
      const previewData = await previewResp.json()
      setBackendRows(previewData.rows || [])
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setImporting(false)
      setBackendLoading(false)
    }
  }

  // Handler proses import ke tabel utama
  const handleFinalImport = async () => {
    if (!uploadSessionId) return
    setImportingFinal(true)
    setImportSummary(null)
    try {
      const resp = await fetch("/api/upload/orders-temp-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upload_session_id: uploadSessionId }),
      })
      const data = await resp.json()
      setImportSummary(data)
      // Refresh backendRows (untuk update status/error)
      const previewResp = await fetch(`/api/upload/orders-temp-preview?upload_session_id=${uploadSessionId}`)
      if (previewResp.ok) {
        const previewData = await previewResp.json()
        setBackendRows(previewData.rows || [])
      }
      // Tambahkan: refresh orders utama setelah import sukses
      if (!data.error) {
        fetchOrders()
      }
    } catch (err: any) {
      setImportSummary({ error: err.message })
    } finally {
      setImportingFinal(false)
    }
  }

  function formatEventDateIndo(start: string, end?: string) {
    if (!start) return "-"
    console.log("formatEventDateIndo input:", { start, end })
    const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    const bulan = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ]
    function parse(str: string) {
      // Handle berbagai format tanggal
      let dateStr = str
      if (str.includes("T")) {
        dateStr = str.split("T")[0] + " " + str.split("T")[1].split(".")[0]
      }
      const [tgl, jam] = dateStr.split(" ")
      const [tahun, bulanIdx, tanggal] = tgl.split("-")
      const dateObj = new Date(`${tgl}T${jam || "00:00:00"}`)
      return `${hari[dateObj.getDay()]}, ${tanggal} ${bulan[Number.parseInt(bulanIdx, 10) - 1]} ${tahun} Pukul ${jam}`
    }
    if (end) return `${parse(start)} - ${parse(end)}`
    return parse(start)
  }

  const handleBulkReminder = async () => {
    const paidOrders = orders.filter((order) => order.status === "paid")
    setBulkProgress({ current: 0, total: paidOrders.length })
    setBulkStatus(Array(paidOrders.length).fill("pending"))
    setBulkModalOpen(true)
    for (let i = 0; i < paidOrders.length; i++) {
      setBulkProgress({ current: i + 1, total: paidOrders.length })
      setBulkStatus((status) => {
        const newStatus = [...status]
        newStatus[i] = "sending"
        return newStatus
      })
      const order = paidOrders[i]
      console.log("Bulk reminder order data:", {
        order_id: order.id,
        name: order.customers?.name,
        start_date: order.events?.start_date,
        end_date: order.events?.end_date,
        event_name: order.events?.name,
      })
      try {
        await fetch("/api/send-wa-reminder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: order.id,
            template_id: 6,
            trigger_on: "reminder",
            name: order.customers?.name,
            event_name: order.events?.name,
            event_location: order.events?.location,
            order_reference: order.order_reference,
            phone_number: order.customers?.phone_number,
          }),
        })
        setBulkStatus((status) => {
          const newStatus = [...status]
          newStatus[i] = "success"
          return newStatus
        })
      } catch {
        setBulkStatus((status) => {
          const newStatus = [...status]
          newStatus[i] = "error"
          return newStatus
        })
      }
    }
    setBulkModalOpen(false)
    toast({ title: "Selesai", description: "Bulk WhatsApp reminder selesai dikirim!", variant: "default" })
  }

  // Submit handler
  const handleManualOrderSubmit = async () => {
    setManualLoading(true)
    try {
      // Kirim data ke endpoint backend
      const resp = await fetch("/api/manual-issue-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualForm.name,
          email: manualForm.email,
          phone: manualForm.phone,
          eventId: manualForm.eventId,
          ticketTypeId: manualForm.ticketTypeId,
          paymentChannelId: manualForm.paymentChannelId,
          proofTransfer: manualForm.proofTransfer,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || "Gagal simpan order manual")
      toast({ title: "Sukses", description: "Order manual berhasil disimpan & tiket dibuat.", variant: "default" })
      setManualOrderOpen(false)
      setManualForm({
        name: "",
        email: "",
        phone: "",
        eventId: "",
        ticketTypeId: "",
        ticketQty: 1,
        paymentChannelId: "",
        proofTransfer: "",
      })
      fetchOrders()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Gagal simpan order manual", variant: "destructive" })
    } finally {
      setManualLoading(false)
      setManualOrderConfirmOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={async () => {
              setLoading(true)
              await fetchOrders()
            }}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Data yang diekspor: filteredOrders, bukan pagedOrders
              const exportData = filteredOrders.map((order, idx) => ({
                No: idx + 1,
                "Order Reference": order.order_reference,
                "Customer Name": order.customers?.name || "",
                "Customer Email": order.customers?.email || "",
                "Customer Phone": order.customers?.phone_number || "",
                "Event Name": order.events?.name || "",
                "Event Date": order.events?.start_date
                  ? new Date(order.events.start_date).toLocaleDateString("id-ID")
                  : "",
                "Event Location": order.events?.location || "",
                "Payment Method": order.payment_channels?.pg_name || "",
                "Payment Code": order.payment_channels?.pg_code || "",
                Amount: order.final_amount,
                Discount: order.discount_amount,
                Status: order.status,
                "Order Date": order.order_date ? new Date(order.order_date).toLocaleDateString("id-ID") : "",
                "Order Time": order.order_date
                  ? new Date(order.order_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                  : "",
              }))
              const ws = XLSX.utils.json_to_sheet(exportData)
              const wb = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(wb, ws, "Orders")
              XLSX.writeFile(wb, `orders-export-${new Date().toISOString().slice(0, 10)}.xlsx`)
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {/* Tombol Download Format */}
          <a href="/format.xlsx" download className="inline-block">
            <Button variant="outline" type="button">
              <Download className="h-4 w-4 mr-2" />
              Download Format
            </Button>
          </a>
          {/* Input file di luar label, trigger dengan ref */}
          <input
            ref={inputFileRef}
            id="upload-xlsx"
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <Button
            variant="outline"
            type="button"
            disabled={uploading}
            onClick={() => {
              console.log("Upload XLSX button clicked")
              inputFileRef.current?.click()
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload XLSX"}
          </Button>
          {/* Tombol konfirmasi upload */}
          {uploadFile && !uploading && (
            <Button variant="default" onClick={handleUpload}>
              Proses Upload
            </Button>
          )}
          <Button onClick={() => setConfirmBulkOpen(true)} className="mb-4">
            Kirim Bulk Reminder
          </Button>
          {/* Tombol Entri Manual Order */}
          <Button variant="default" onClick={() => setManualOrderOpen(true)}>
            Entri Manual Order
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari order, customer, atau event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Event</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentChannelFilter} onValueChange={setPaymentChannelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Payment Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Payment Channel</SelectItem>
                {paymentChannels.map((channel) => (
                  <SelectItem key={channel.pg_code} value={channel.pg_code}>
                    {channel.pg_name} ({channel.pg_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-600 flex items-center">Total: {filteredOrders.length} orders</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SimpleTableHeader>No</SimpleTableHeader>
                    <SimpleTableHeader>Order Reference</SimpleTableHeader>
                    <SimpleTableHeader>Customer</SimpleTableHeader>
                    <SimpleTableHeader>Event</SimpleTableHeader>
                    <SimpleTableHeader>Payment Method</SimpleTableHeader>
                    <SimpleTableHeader>Amount</SimpleTableHeader>
                    <SimpleTableHeader>Status</SimpleTableHeader>
                    <SimpleTableHeader>Order Date</SimpleTableHeader>
                    <SimpleTableHeader>Aksi</SimpleTableHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedOrders.map((order, idx) => {
                    const paymentCategory = order.payment_channels?.category
                    const showProofButton =
                      (paymentCategory === "bank_transfer" || paymentCategory === "qris_statis") && order.proof_transfer
                    const showToggle = paymentCategory === "bank_transfer" || paymentCategory === "qris_statis"
                    // Tambahkan style baris paid
                    const rowClass =
                      order.status === "paid"
                        ? "bg-green-50 border-l-4 border-green-500"
                        : "bg-white border-l-4 border-gray-200"
                    return (
                      <TableRow key={order.id} className={rowClass}>
                        <TableCell className="font-bold">{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-mono text-sm font-medium">{order.order_reference}</div>
                          {order.virtual_account_number && (
                            <div className="text-xs text-gray-500 font-mono">VA: {order.virtual_account_number}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customers?.name}</div>
                            <div className="text-sm text-gray-500">{order.customers?.email}</div>
                            {order.customers?.phone_number && (
                              <div className="text-xs text-gray-400">{order.customers?.phone_number}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.events?.name}</div>
                            {order.events?.start_date && (
                              <div className="text-sm text-gray-500">
                                {new Date(order.events.start_date).toLocaleDateString("id-ID")}
                              </div>
                            )}
                            {order.events?.location && (
                              <div className="text-xs text-gray-400">{order.events.location}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.payment_channels ? (
                            <div>
                              <div className="text-sm font-medium">{order.payment_channels.pg_name}</div>
                              <div className="text-xs text-gray-500 font-mono">{order.payment_channels.pg_code}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(order.final_amount)}</div>
                            {order.discount_amount > 0 && (
                              <div className="text-xs text-green-600">
                                Diskon: -{formatCurrency(order.discount_amount)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(order.order_date).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.order_date).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 items-center">
                            {/* <Button size="sm" variant="outline" asChild>
                              <Link href={`/orders/${order.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button> */}
                            {order.status === "paid" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  setWaLoading((prev) => ({ ...prev, [order.id]: true }))
                                  try {
                                    const res = await fetch("/api/send-wa-reminder", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        order_id: order.id,
                                        template_id: 6,
                                        trigger_on: "reminder",
                                        name: order.customers?.name,
                                        event_name: order.events?.name,
                                        event_location: order.events?.location,
                                        order_reference: order.order_reference,
                                        phone_number: order.customers?.phone_number,
                                      }),
                                    })
                                    if (!res.ok) throw new Error("Gagal mengirim WhatsApp reminder")
                                    toast({
                                      title: "Sukses",
                                      description: "WhatsApp reminder berhasil dikirim!",
                                      variant: "default",
                                    })
                                  } catch (err) {
                                    toast({
                                      title: "Gagal",
                                      description: "Gagal mengirim WhatsApp reminder",
                                      variant: "destructive",
                                    })
                                  } finally {
                                    setTimeout(() => setWaLoading((prev) => ({ ...prev, [order.id]: false })), 500) // pastikan spinner tidak hilang terlalu cepat
                                  }
                                }}
                                title="Kirim WhatsApp Reminder"
                                disabled={waLoading[order.id]}
                              >
                                {waLoading[order.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                            )}
                            {/* Icon open CHILD_URL/payment/ORDER_REF in new tab */}
                            <Button size="sm" variant="outline" asChild>
                              <a
                                href={`${process.env.NEXT_PUBLIC_CHILD_URL || process.env.CHILD_URL || "https://event.kreativaglobal.id"}/payment/${order.order_reference}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Buka halaman pembayaran di tab baru"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            {showProofButton && (
                              <Dialog open={proofModalOpen} onOpenChange={setProofModalOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                      setSelectedProofUrl(order.proof_transfer ?? null)
                                      setProofModalOpen(true)
                                    }}
                                  >
                                    Lihat Bukti
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Bukti Transfer</DialogTitle>
                                  </DialogHeader>
                                  {selectedProofUrl && (
                                    <img
                                      src={selectedProofUrl || "/placeholder.svg"}
                                      alt="Bukti Transfer"
                                      className="w-full max-h-[60vh] object-contain rounded border"
                                    />
                                  )}
                                </DialogContent>
                              </Dialog>
                            )}
                            {showToggle && (
                              <AlertDialog
                                open={confirmModal.open && confirmModal.order?.id === order.id}
                                onOpenChange={(open) => {
                                  if (!open) setConfirmModal({ open: false, order: null, checked: false })
                                }}
                              >
                                <AlertDialogTrigger asChild>
                                  <Switch
                                    checked={order.status === "paid"}
                                    disabled={rowLoading[order.id]}
                                    onCheckedChange={(checked) => setConfirmModal({ open: true, order, checked })}
                                    className="data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:border-gray-300 border shadow-sm"
                                  />
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {confirmModal.checked ? "Konfirmasi Mark as Paid" : "Konfirmasi Mark as Pending"}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {confirmModal.checked
                                        ? "Apakah Anda yakin ingin mengubah status order ini menjadi PAID? Ini akan membuat tiket dan mengirim notifikasi WhatsApp."
                                        : "Apakah Anda yakin ingin mengubah status order ini menjadi PENDING? Ini akan menghapus tiket yang sudah dibuat."}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        if (confirmModal.order)
                                          await handleToggle(confirmModal.order, confirmModal.checked)
                                      }}
                                    >
                                      Ya, Lanjutkan
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                            {rowLoading[order.id] && <span className="text-xs text-gray-400 ml-2">Loading...</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }}
                        aria-disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === i + 1}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(i + 1)
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }}
                        aria-disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Tidak ada orders yang ditemukan</p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Modal di luar agar tidak duplikat per row */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Preview Data Import</DialogTitle>
          </DialogHeader>
          {/* Jika sudah upload ke backend, tampilkan hasil dari backend */}
          {backendLoading ? (
            <div className="text-gray-500">Loading data dari backend...</div>
          ) : Array.isArray(backendRows) && backendRows.length > 0 && backendRows[0] ? (
            <>
              {console.log("backendRows[0]:", backendRows[0])}
              <div className="overflow-auto max-h-[60vh]">
                <table className="min-w-full text-xs border">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 border bg-gray-100 text-left">No</th>
                      {Object.keys(backendRows[0]).map((col) => (
                        <th key={col} className="px-2 py-1 border bg-gray-100 text-left">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {backendRows.map((row, i) => (
                      <tr key={i} className="odd:bg-gray-50">
                        <td className="px-2 py-1 border font-bold">{row.row_number ?? i + 1}</td>
                        {Object.keys(backendRows[0]).map((col, j) => (
                          <td key={j} className="px-2 py-1 border">
                            {String(row[col] ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-gray-500">Tidak ada data untuk di-preview.</div>
          )}
          {/* Tombol Proses Import ke tabel utama */}
          {backendRows.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              <Button variant="default" onClick={handleFinalImport} disabled={importingFinal}>
                {importingFinal ? "Memproses..." : "Proses Import"}
              </Button>
              {importSummary && (
                <div className="text-xs mt-2">
                  {importSummary.error ? (
                    <span className="text-red-500">Error: {importSummary.error}</span>
                  ) : (
                    <>
                      <div className="text-green-600">Sukses: {importSummary.success || 0}</div>
                      <div className="text-red-600">Gagal: {importSummary.failed || 0}</div>
                      {importSummary.errors && importSummary.errors.length > 0 && (
                        <ul className="text-red-500 list-disc ml-4">
                          {importSummary.errors.map((err: any, i: number) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={confirmBulkOpen} onOpenChange={setConfirmBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Bulk Reminder</DialogTitle>
          </DialogHeader>
          <div className="py-4">Apakah Anda yakin ingin mengirim WhatsApp reminder ke semua order yang sudah paid?</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmBulkOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                setConfirmBulkOpen(false)
                handleBulkReminder()
              }}
            >
              Ya, Kirim
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={bulkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk WhatsApp Reminder</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${(bulkProgress.current / (bulkProgress.total || 1)) * 100}%` }}
              />
            </div>
            <p className="mb-4">
              Sending {bulkProgress.current}/{bulkProgress.total} recipient
            </p>
            <ul className="text-left max-h-40 overflow-y-auto">
              {orders
                .filter((order) => order.status === "paid")
                .map((order, idx) => (
                  <li key={order.id} className="flex items-center gap-2">
                    {bulkStatus[idx] === "success" && <span className="text-green-600">✔️</span>}
                    {bulkStatus[idx] === "error" && <span className="text-red-600">❌</span>}
                    {bulkStatus[idx] === "sending" && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                    <span>{order.customers?.name || order.order_reference}</span>
                  </li>
                ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal Entri Manual Order */}
      <Dialog open={manualOrderOpen} onOpenChange={setManualOrderOpen}>
        <DialogContent className="max-w-2xl w-full p-0">
          <div className="max-h-[80vh] overflow-y-auto p-6">
            <DialogHeader>
              <DialogTitle>Entri Manual Order</DialogTitle>
            </DialogHeader>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              onSubmit={(e) => {
                e.preventDefault()
                if (!validateManualForm()) return
                setManualOrderConfirmOpen(true)
              }}
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="manual-name" className="text-sm font-medium">
                  Nama
                </label>
                <Input
                  id="manual-name"
                  value={manualForm.name}
                  onChange={(e) => setManualForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  autoFocus
                  className={manualFormErrors.name ? "border-red-500" : ""}
                />
                {manualFormErrors.name && <div className="text-xs text-red-500">{manualFormErrors.name}</div>}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="manual-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="manual-email"
                  type="email"
                  value={manualForm.email}
                  onChange={(e) => setManualForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className={manualFormErrors.email ? "border-red-500" : ""}
                />
                {manualFormErrors.email && <div className="text-xs text-red-500">{manualFormErrors.email}</div>}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="manual-phone" className="text-sm font-medium">
                  No. HP
                </label>
                <Input
                  id="manual-phone"
                  value={manualForm.phone}
                  onChange={(e) => setManualForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                  className={manualFormErrors.phone ? "border-red-500" : ""}
                />
                {manualFormErrors.phone && <div className="text-xs text-red-500">{manualFormErrors.phone}</div>}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="manual-event" className="text-sm font-medium">
                  Event
                </label>
                <Select
                  value={manualForm.eventId}
                  onValueChange={(val) => setManualForm((f) => ({ ...f, eventId: val }))}
                  required
                >
                  <SelectTrigger id="manual-event" className="min-w-[200px] px-3 py-2">
                    <SelectValue placeholder="Pilih Event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={String(ev.id)}>
                        {ev.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {manualFormErrors.eventId && <div className="text-xs text-red-500">{manualFormErrors.eventId}</div>}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="manual-ticket-type" className="text-sm font-medium">
                  Jenis Tiket
                </label>
                <Select
                  value={manualForm.ticketTypeId}
                  onValueChange={(val) => setManualForm((f) => ({ ...f, ticketTypeId: val }))}
                  required
                  disabled={!manualForm.eventId || manualTicketTypes.length === 0}
                >
                  <SelectTrigger id="manual-ticket-type" className="min-w-[200px] px-3 py-2">
                    <SelectValue placeholder="Pilih Jenis Tiket" />
                  </SelectTrigger>
                  <SelectContent>
                    {manualTicketTypes.map((tt) => (
                      <SelectItem key={tt.id} value={String(tt.id)}>
                        {tt.name} (Rp{tt.price?.toLocaleString("id-ID")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {manualFormErrors.ticketTypeId && (
                  <div className="text-xs text-red-500">{manualFormErrors.ticketTypeId}</div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="manual-payment-channel" className="text-sm font-medium">
                  Payment Channel
                </label>
                <Select
                  value={manualForm.paymentChannelId}
                  onValueChange={(val) => setManualForm((f) => ({ ...f, paymentChannelId: val }))}
                  required
                >
                  <SelectTrigger id="manual-payment-channel" className="min-w-[200px] px-3 py-2">
                    <SelectValue placeholder="Pilih Payment Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {manualPaymentChannels.map((pc) => (
                      <SelectItem key={pc.id} value={String(pc.id)}>
                        {pc.pg_name} ({pc.pg_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {manualFormErrors.paymentChannelId && (
                  <div className="text-xs text-red-500">{manualFormErrors.paymentChannelId}</div>
                )}
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-sm font-medium">Upload Bukti Transfer</label>
                <ImageUpload
                  value={manualForm.proofTransfer}
                  onChange={(url) => setManualForm((f) => ({ ...f, proofTransfer: url }))}
                  bucket="orders"
                  label="Upload Bukti Transfer"
                  accept="image/*"
                />
                {manualFormErrors.proofTransfer && (
                  <div className="text-xs text-red-500">{manualFormErrors.proofTransfer}</div>
                )}
              </div>
              <div className="pt-2 flex justify-end gap-2 md:col-span-2">
                <Button type="button" variant="outline" onClick={() => setManualOrderOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="default" disabled={manualLoading}>
                  {manualLoading ? "Menyimpan..." : "Simpan & Konfirmasi"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
        {/* Konfirmasi sebelum simpan */}
        <AlertDialog open={manualOrderConfirmOpen} onOpenChange={setManualOrderConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Konfirmasi Simpan Order Manual</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menyimpan order ini? Data akan langsung masuk sebagai PAID dan tiket akan
                dibuat.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleManualOrderSubmit} disabled={manualLoading}>
                Ya, Simpan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Dialog>
    </div>
  )
}
