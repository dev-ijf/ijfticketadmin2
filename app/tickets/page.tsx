"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { Search, Eye, CheckCircle, XCircle, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase"
import { SimpleTableHeader } from "@/components/table-header"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Html5Qrcode } from "html5-qrcode"
import { Html5QrcodeSupportedFormats } from "html5-qrcode/esm/core"
import * as XLSX from 'xlsx'

type Ticket = Database["public"]["Tables"]["tickets"]["Row"] & {
  ticket_types: { name: string } | null
}

type ExportData = {
  'Ticket Code': string
  'Attendee Name': string
  'Attendee Email': string
  'Ticket Type': string
  'Event Name': string
  'Check-in Status': string
  'Check-in Date': string
  'Created Date': string
}

function ScannerHtml5Qrcode({ open, onScan, onError }: { open: boolean, onScan: (text: string) => void, onError: (err: any) => void }) {
  const scannerId = "html5qr-code-scanner"
  const html5QrRef = useRef<Html5Qrcode | null>(null)
  useEffect(() => {
    if (open) {
      if (!html5QrRef.current) {
        html5QrRef.current = new Html5Qrcode(scannerId)
      }
      html5QrRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          aspectRatio: 1.777,
        },
        (decodedText) => {
          onScan(decodedText)
          // Jangan stop kamera di sini!
        },
        (err) => {
          // error callback, do nothing (to avoid spamming)
        }
      ).catch(onError)
    }
    return () => {
      if (html5QrRef.current) {
        try { html5QrRef.current.stop() } catch {}
        try { html5QrRef.current.clear() } catch {}
        html5QrRef.current = null
      }
    }
  }, [open])
  return <div id={scannerId} className="w-full h-full" />
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [events, setEvents] = useState<{ id: number; name: string }[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const { toast } = useToast()
  const [scannerOpen, setScannerOpen] = useState(false)
  const [ticketTypes, setTicketTypes] = useState<{ id: number; name: string }[]>([])
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isProcessingScan, setIsProcessingScan] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<{ status: 'success' | 'error' | 'duplicate', message: string } | null>(null)
  const [bulkCheckoutOpen, setBulkCheckoutOpen] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  // Beep sound for success and error
  const beepSuccess = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.7; // lebih keras
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 120);
  };
  const beepError = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 220;
    g.gain.value = 0.5; // lebih keras
    o.connect(g); g.connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 250);
  };

  // Handler untuk error scanner
  const handleError = (err: any) => {
    setCameraError(err?.message || 'Gagal mengakses kamera')
    toast({
      title: "Scan Error",
      description: err?.message || "Gagal scan kode",
      variant: "destructive",
    })
  }

  // Add handler for QR/barcode scan
  const handleScan = async (data: string) => {
    if (isProcessingScan) return;
    setIsProcessingScan(true);
    // Kembalikan ke semula: hanya gunakan hasil scan sebagai ticket_code
    const scannedCode = data.trim();
    const ticket = tickets.find(t => t.ticket_code === scannedCode);
    if (ticket) {
      if (!ticket.is_checked_in) {
        await updateCheckInStatus(ticket.id, true);
        beepSuccess();
        setLastScanResult({ status: 'success', message: `Check-in Berhasil: ${ticket.attendee_name}` });
        toast({
          title: "Check-in Berhasil",
          description: `Attendee: ${ticket.attendee_name}`,
          variant: "default",
        });
      } else {
        beepError();
        setLastScanResult({ status: 'duplicate', message: `Sudah check-in: ${ticket.attendee_name}` });
        toast({
          title: "Sudah check-in",
          description: `Ticket ${ticket.ticket_code} (${ticket.attendee_name}) sudah check-in sebelumnya`,
          variant: "default",
        });
      }
    } else {
      beepError();
      setLastScanResult({ status: 'error', message: `Check-in Gagal: Ticket code ${scannedCode} tidak ditemukan` });
      toast({
        title: "Check-in Gagal",
        description: `Ticket code ${scannedCode} tidak ditemukan di daftar`,
        variant: "destructive",
      });
    }
    setIsProcessingScan(false);
  }

  // Function to export tickets to Excel
  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      // Prepare data for export
      const exportData: ExportData[] = filteredTickets.map(ticket => ({
        'Ticket Code': ticket.ticket_code,
        'Attendee Name': ticket.attendee_name,
        'Attendee Email': ticket.attendee_email || '',
        'Ticket Type': ticket.ticket_types?.name || '',
        'Event Name': ticket.orders?.events?.name || '',
        'Check-in Status': ticket.is_checked_in ? 'Checked In' : 'Not Checked In',
        'Check-in Date': ticket.checked_in_at ? new Date(ticket.checked_in_at).toLocaleString('id-ID') : '',
        'Created Date': new Date(ticket.created_at).toLocaleString('id-ID'),
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Ticket Code
        { wch: 25 }, // Attendee Name
        { wch: 30 }, // Attendee Email
        { wch: 20 }, // Ticket Type
        { wch: 25 }, // Event Name
        { wch: 15 }, // Check-in Status
        { wch: 20 }, // Check-in Date
        { wch: 20 }, // Created Date
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

      // Generate file and download
      const fileName = `tickets_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Export Berhasil",
        description: `Berhasil mengexport ${exportData.length} data tickets`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting tickets:", error);
      toast({
        title: "Export Gagal",
        description: "Gagal mengexport data tickets",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets()
    fetchTicketTypes()
    fetchEvents()
  }, [])

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`*, ticket_types (name), orders (id, event_id, events (id, name))`)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data tickets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTicketTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("ticket_types")
        .select("id, name")
      if (error) throw error
      setTicketTypes(data || [])
    } catch (error) {
      console.error("Error fetching ticket types:", error)
    }
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase.from("events").select("id, name").order("name")
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  const updateCheckInStatus = async (ticketId: number, isCheckedIn: boolean) => {
    try {
      const updateData: any = {
        is_checked_in: isCheckedIn,
        checked_in_at: isCheckedIn ? new Date().toISOString() : null,
      }

      const { error } = await supabase.from("tickets").update(updateData).eq("id", ticketId)

      if (error) throw error

      toast({
        title: "Berhasil",
        description: `Ticket berhasil ${isCheckedIn ? "check-in" : "check-out"}`,
      })
      fetchTickets()
    } catch (error) {
      console.error("Error updating check-in status:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui status check-in",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticket_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.attendee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.attendee_email && ticket.attendee_email.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "checked_in" && ticket.is_checked_in) ||
      (statusFilter === "not_checked_in" && !ticket.is_checked_in)

    const matchesEvent =
      eventFilter === "all" ||
      (ticket.orders && ticket.orders.events && ticket.orders.events.id.toString() === eventFilter)

    return matchesSearch && matchesStatus && matchesEvent
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredTickets.length / pageSize)
  const pagedTickets = filteredTickets.slice((page - 1) * pageSize, page * pageSize)

  // Hitung summary check-in
  const checkedInCount = filteredTickets.filter(t => t.is_checked_in).length;
  const notCheckedInCount = filteredTickets.filter(t => !t.is_checked_in).length;
  const totalCount = filteredTickets.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
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
        <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            disabled={exportLoading || filteredTickets.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportLoading ? "Exporting..." : "Export Excel"}
          </Button>
          <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setScannerOpen(true)}>
                Scan QR/Barcode
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-3xl h-[75vh] flex flex-col justify-center items-center">
              <DialogHeader>
                <DialogTitle>Scan QR/Barcode Ticket</DialogTitle>
                <DialogDescription>
                  Arahkan kamera ke QR code/barcode pada tiket untuk check-in.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center w-full h-full justify-center">
                {/* Feedback visual hasil scan */}
                {lastScanResult && (
                  <div className={`mb-4 px-4 py-2 rounded text-white font-bold text-center shadow-lg ${
                    lastScanResult.status === 'success' ? 'bg-green-600' :
                    lastScanResult.status === 'duplicate' ? 'bg-yellow-500' : 'bg-red-600'
                  }`}>
                    {lastScanResult.message}
                    <button onClick={() => setLastScanResult(null)} className="ml-4 text-xs underline text-white/80">Bersihkan pesan</button>
                  </div>
                )}
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-full h-full rounded-lg border shadow-lg bg-black flex items-center justify-center">
                    <ScannerHtml5Qrcode open={scannerOpen} onScan={handleScan} onError={handleError} />
                  </div>
                </div>
                {cameraError && (
                  <div className="text-red-600 text-sm mt-2">{cameraError}</div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="destructive" onClick={() => setBulkCheckoutOpen(true)}>
            Checkout Massal
          </Button>
        </div>
      </div>
      {/* Dialog konfirmasi checkout massal */}
      <Dialog open={bulkCheckoutOpen} onOpenChange={setBulkCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Checkout Massal</DialogTitle>
          </DialogHeader>
          <div className="py-4">Apakah Anda yakin ingin melakukan checkout massal untuk semua tiket yang sedang difilter?</div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBulkCheckoutOpen(false)} disabled={bulkLoading}>Batal</Button>
            <Button variant="destructive" onClick={async () => {
              setBulkLoading(true)
              try {
                // Ambil semua id tiket yang sedang difilter dan sudah check-in
                const ids = filteredTickets.filter(t => t.is_checked_in).map(t => t.id)
                if (ids.length === 0) {
                  toast({ title: "Tidak ada tiket yang perlu di-checkout", variant: "default" })
                  setBulkCheckoutOpen(false)
                  setBulkLoading(false)
                  return
                }
                // Update massal ke supabase
                const { error } = await supabase.from("tickets").update({ is_checked_in: false, checked_in_at: null }).in("id", ids)
                if (error) throw error
                toast({ title: "Sukses", description: `Berhasil checkout massal ${ids.length} tiket.`, variant: "default" })
                fetchTickets()
              } catch (err: any) {
                toast({ title: "Gagal", description: err.message || "Gagal checkout massal", variant: "destructive" })
              } finally {
                setBulkCheckoutOpen(false)
                setBulkLoading(false)
              }
            }} disabled={bulkLoading}>
              {bulkLoading ? "Memproses..." : "Ya, Checkout Semua"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Summary check-in dengan card */}
      <div className="flex flex-wrap gap-2 items-stretch">
        <div className="bg-white rounded-lg shadow-sm px-2 py-2 flex-1 min-w-[90px] border border-gray-100" style={{borderLeftWidth: '5px', borderLeftColor: '#8b5cf6'}}>
          <div className="text-center text-gray-500 font-semibold text-xs">Total</div>
          <div className="text-center text-xl font-bold text-gray-900 mt-1">{totalCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm px-2 py-2 flex-1 min-w-[90px] border border-gray-100" style={{borderLeftWidth: '5px', borderLeftColor: '#22c55e'}}>
          <div className="text-center text-gray-500 font-semibold text-xs">Has Check-in</div>
          <div className="text-center text-xl font-bold text-gray-900 mt-1">{checkedInCount}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm px-2 py-2 flex-1 min-w-[90px] border border-gray-100" style={{borderLeftWidth: '5px', borderLeftColor: '#a3a3a3'}}>
          <div className="text-center text-gray-500 font-semibold text-xs">Not Check-in</div>
          <div className="text-center text-xl font-bold text-gray-900 mt-1">{notCheckedInCount}</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan ticket code, nama attendee, atau order reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <div className="w-full md:w-48 mt-2 md:mt-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="checked_in">Sudah Check-in</SelectItem>
                  <SelectItem value="not_checked_in">Belum Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-64 mt-2 md:mt-0">
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Event</SelectItem>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>{event.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <SimpleTableHeader>Ticket Code</SimpleTableHeader>
                  <SimpleTableHeader className="hidden md:table-cell">Attendee</SimpleTableHeader>
                  <SimpleTableHeader className="hidden md:table-cell">Ticket Type</SimpleTableHeader>
                  <SimpleTableHeader className="hidden md:table-cell">Nama Event</SimpleTableHeader>
                  <SimpleTableHeader>Check-in Status</SimpleTableHeader>
                  <SimpleTableHeader className="hidden md:table-cell">Aksi</SimpleTableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className={
                      ticket.is_checked_in
                        ? "bg-green-50 border-l-4 border-green-400"
                        : "bg-white border-l-4 border-gray-200"
                    }
                  >
                    {/* Ticket Code & Attendee cell seperti sebelumnya, attendee hidden di mobile */}
                    <TableCell className="block md:table-cell md:w-auto w-full align-top">
                      <div className="md:hidden">
                        <div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{ticket.attendee_name}</div>
                        <div className="font-mono text-xs text-gray-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{ticket.ticket_code}</div>
                      </div>
                      <div className="hidden md:block">
                        <div className="font-mono text-xs font-medium whitespace-nowrap">{ticket.ticket_code}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <div className="font-medium">{ticket.attendee_name}</div>
                        {ticket.attendee_email && (
                          <div className="text-sm text-gray-500">{ticket.attendee_email}</div>
                        )}
                      </div>
                    </TableCell>
                    {/* Ticket Type */}
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">{
                        ticket.ticket_types?.name || '-'
                      }</div>
                    </TableCell>
                    {/* Nama Event */}
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">{
                        ticket.orders && ticket.orders.events ? ticket.orders.events.name : '-'
                      }</div>
                    </TableCell>
                    {/* Check-in Status & Aksi cell seperti sebelumnya */}
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant={ticket.is_checked_in ? "default" : "secondary"} className="whitespace-nowrap">
                          {ticket.is_checked_in ? "Checked In" : "Not Checked In"}
                        </Badge>
                        {ticket.checked_in_at && (
                          <div className="text-xs text-gray-500">{formatDate(ticket.checked_in_at)}</div>
                        )}
                        {/* Action button di bawah caption untuk mobile */}
                        <div className="flex md:hidden mt-2">
                          <Button
                            size="sm"
                            variant={ticket.is_checked_in ? "outline" : "default"}
                            onClick={() => updateCheckInStatus(ticket.id, !ticket.is_checked_in)}
                          >
                            {ticket.is_checked_in ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant={ticket.is_checked_in ? "outline" : "default"}
                          onClick={() => updateCheckInStatus(ticket.id, !ticket.is_checked_in)}
                        >
                          {ticket.is_checked_in ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </div>
            <div className="space-x-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
