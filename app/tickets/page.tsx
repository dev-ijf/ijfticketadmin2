"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, CheckCircle, XCircle, Download, Edit } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { SimpleTableHeader } from "@/components/table-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Html5Qrcode } from "html5-qrcode";
import * as XLSX from "xlsx";

type Ticket = {
  id: number;
  ticket_code: string;
  attendee_name: string;
  attendee_email: string | null;
  is_checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  updated_at: string;
  ticket_type_id: number;
  order_id: number;
  ticket_type_name: string | null;
  order_reference: string | null;
  event_id: number | null;
  event_name: string | null;
  custom_data?: Record<string, any>;
};

type ExportData = {
  "Ticket Code": string;
  "Attendee Name": string;
  "Attendee Email": string;
  "Ticket Type": string;
  "Event Name": string;
  "Check-in Status": string;
  "Check-in Date": string;
  "Created Date": string;
  [key: string]: any; // Allow dynamic custom fields
};

function ScannerHtml5Qrcode({
  open,
  onScan,
  onError,
}: {
  open: boolean;
  onScan: (text: string) => void;
  onError: (err: any) => void;
}) {
  const scannerId = "html5qr-code-scanner";
  const html5QrRef = useRef<any | null>(null);
  useEffect(() => {
    if (open) {
      if (!html5QrRef.current) {
        html5QrRef.current = new Html5Qrcode(scannerId);
      }
      html5QrRef.current
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 300, height: 300 },
            aspectRatio: 1.777,
          },
          (decodedText: string) => {
            onScan(decodedText);
            // Jangan stop kamera di sini!
          },
          (err: any) => {
            // error callback, do nothing (to avoid spamming)
          },
        )
        .catch(onError);
    }
    return () => {
      if (html5QrRef.current) {
        try {
          html5QrRef.current.stop();
        } catch {}
        try {
          html5QrRef.current.clear();
        } catch {}
        html5QrRef.current = null;
      }
    };
  }, [open]);
  return <div id={scannerId} className="w-full h-full" />;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [events, setEvents] = useState<{ id: number; name: string }[]>([]);
  const [customHeaders, setCustomHeaders] = useState<string[]>([]);
  const [customFieldsForFilter, setCustomFieldsForFilter] = useState<any[]>([]);
  const [customFieldFilters, setCustomFieldFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    status: "success" | "error" | "duplicate";
    message: string;
  } | null>(null);
  const [bulkCheckoutOpen, setBulkCheckoutOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTickets = useCallback(
    async (currentEventFilter = "all") => {
      setLoading(true);
      try {
        console.log(`=== FETCHING TICKETS (Event: ${currentEventFilter}) ===`);
        const url = new URL("/api/tickets", window.location.origin);
        url.searchParams.set("t", Date.now().toString());
        url.searchParams.set("refresh", refreshKey.toString());

        if (currentEventFilter !== "all") {
          url.searchParams.set("eventId", currentEventFilter);
        }

        const response = await fetch(url.toString(), {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch tickets");
        const data = await response.json();

        if (currentEventFilter !== "all" && data.length > 0) {
          const allHeaders = new Set<string>();
          data.forEach((ticket: Ticket) => {
            if (ticket.custom_data) {
              Object.keys(ticket.custom_data).forEach((key) => {
                allHeaders.add(key);
              });
            }
          });
          setCustomHeaders(Array.from(allHeaders));
        } else {
          setCustomHeaders([]);
        }

        setTickets(data);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data tickets",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [refreshKey, toast],
  );

  const forceRefresh = useCallback(async (delay = 0) => {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    console.log("=== FORCE REFRESH TRIGGERED ===");
    setRefreshKey((prev) => prev + 1);
  }, []);

  const beepSuccess = () => {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.7;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 120);
  };
  const beepError = () => {
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.value = 220;
    g.gain.value = 0.5;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 250);
  };

  const handleError = (err: any) => {
    setCameraError(err?.message || "Gagal mengakses kamera");
    toast({
      title: "Scan Error",
      description: err?.message || "Gagal scan kode",
      variant: "destructive",
    });
  };

  const updateCheckInStatus = async (
    ticketId: number,
    isCheckedIn: boolean,
  ) => {
    try {
      console.log(
        `Updating ticket ${ticketId} to ${isCheckedIn ? "checked-in" : "checked-out"}`,
      );

      const requestBody = { ticketId, isCheckedIn };
      console.log("Sending update request:", requestBody);

      const response = await fetch(`/api/tickets?t=${Date.now()}`, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log("Update response status:", response.status);
      console.log("Update response body:", result);

      if (!response.ok) {
        throw new Error(result.error || "Failed to update ticket");
      }

      toast({
        title: "Berhasil",
        description: `Ticket berhasil ${isCheckedIn ? "check-in" : "check-out"}`,
      });

      console.log("=== AFTER UPDATE - REFRESHING DATA ===");
      // Force refresh with utility function
      await forceRefresh(300);
      console.log("=== DATA REFRESH COMPLETED ===");
    } catch (error: any) {
      console.error("Error updating check-in status:", error);
      toast({
        title: "Error",
        description: error?.message || "Gagal memperbarui status check-in",
        variant: "destructive",
      });
    }
  };

  const handleScan = async (data: string) => {
    if (isProcessingScan) return;
    setIsProcessingScan(true);
    // Kembalikan ke semula: hanya gunakan hasil scan sebagai ticket_code
    const scannedCode = data.trim();
    const ticket = tickets.find((t) => t.ticket_code === scannedCode);
    if (ticket) {
      if (!ticket.is_checked_in) {
        try {
          await updateCheckInStatus(ticket.id, true);
          beepSuccess();

          // Fetch detailed ticket info with custom fields for success message
          const detailResponse = await fetch(
            `/api/tickets/${ticket.id}/details`,
          );
          let detailMessage = `Nama: ${ticket.attendee_name}`;

          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            if (detailData.ticket_type_name) {
              detailMessage += `<br/>Type: ${detailData.ticket_type_name}`;
            }
            if (
              detailData.custom_fields &&
              detailData.custom_fields.length > 0
            ) {
              detailData.custom_fields.forEach((field: any) => {
                detailMessage += `<br/>${field.field_label}: ${field.answer_value}`;
              });
            }
          } else {
            // Fallback to basic info
            if (ticket.ticket_type_name) {
              detailMessage += `<br/>Type: ${ticket.ticket_type_name}`;
            }
          }

          setLastScanResult({
            status: "success",
            message: detailMessage,
          });
          toast({
            title: "Check-in Berhasil",
            description: `Attendee: ${ticket.attendee_name}`,
            variant: "default",
          });
        } catch (error: any) {
          beepError();
          setLastScanResult({
            status: "error",
            message: `Check-in Gagal: ${error?.message || "Unknown error"}`,
          });
        }
      } else {
        beepError();
        setLastScanResult({
          status: "duplicate",
          message: `Sudah check-in: ${ticket.attendee_name}`,
        });
        toast({
          title: "Sudah check-in",
          description: `Ticket ${ticket.ticket_code} (${ticket.attendee_name}) sudah check-in sebelumnya`,
          variant: "default",
        });
      }
    } else {
      beepError();
      setLastScanResult({
        status: "error",
        message: `Check-in Gagal: Ticket code ${scannedCode} tidak ditemukan`,
      });
      toast({
        title: "Check-in Gagal",
        description: `Ticket code ${scannedCode} tidak ditemukan di daftar`,
        variant: "destructive",
      });
    }
    setIsProcessingScan(false);
  };

  const exportToExcel = async () => {
    setExportLoading(true);
    try {
      const exportData: ExportData[] = filteredTickets.map((ticket) => {
        const baseData: ExportData = {
          "Ticket Code": ticket.ticket_code,
          "Attendee Name": ticket.attendee_name,
          "Attendee Email": ticket.attendee_email || "",
          "Ticket Type": ticket.ticket_type_name || "",
          "Event Name": ticket.event_name || "",
          "Check-in Status": ticket.is_checked_in
            ? "Checked In"
            : "Not Checked In",
          "Check-in Date": ticket.checked_in_at
            ? new Date(ticket.checked_in_at).toLocaleString("id-ID")
            : "",
          "Created Date": new Date(ticket.created_at).toLocaleString("id-ID"),
        };
        if (customHeaders.length > 0 && ticket.custom_data) {
          customHeaders.forEach((header) => {
            baseData[header] = ticket.custom_data![header] || "";
          });
        }
        return baseData;
      });

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      const columnWidths = [
        { wch: 15 },
        { wch: 25 },
        { wch: 30 },
        { wch: 20 },
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        ...customHeaders.map(() => ({ wch: 20 })),
      ];
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
      const fileName = `tickets_export_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Export Berhasil",
        description: `Berhasil mengexport ${exportData.length} data tickets`,
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

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Failed to fetch events");
      setEvents((await response.json()) || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchCustomFieldsForFilter = async (eventId: string) => {
    if (eventId === "all") {
      setCustomFieldsForFilter([]);
      setCustomFieldFilters({});
      return;
    }

    try {
      const response = await fetch(`/api/events/custom-fields?event_id=${eventId}`);
      if (!response.ok) throw new Error("Failed to fetch custom fields");
      const data = await response.json();
      setCustomFieldsForFilter(data.custom_fields || []);
      // Reset custom field filters when event changes
      const newFilters: Record<string, string> = {};
      data.custom_fields?.forEach((field: any) => {
        newFilters[field.field_name] = "";
      });
      setCustomFieldFilters(newFilters);
    } catch (error) {
      console.error("Error fetching custom fields:", error);
      setCustomFieldsForFilter([]);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchTickets(eventFilter);
    fetchCustomFieldsForFilter(eventFilter);
  }, [eventFilter, refreshKey, fetchTickets]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredTickets = tickets.filter((ticket) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      ticket.ticket_code.toLowerCase().includes(searchLower) ||
      ticket.attendee_name.toLowerCase().includes(searchLower) ||
      (ticket.attendee_email &&
        ticket.attendee_email.toLowerCase().includes(searchLower)) ||
      (ticket.order_reference &&
        ticket.order_reference.toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "checked_in" && ticket.is_checked_in) ||
      (statusFilter === "not_checked_in" && !ticket.is_checked_in);

    // Filter by custom fields
    const matchesCustomFields = Object.entries(customFieldFilters).every(
      ([fieldName, filterValue]) => {
        if (!filterValue) return true; // No filter set for this field
        const ticketValue = ticket.custom_data?.[fieldName];
        if (!ticketValue) return false;
        return String(ticketValue).toLowerCase().includes(filterValue.toLowerCase());
      }
    );

    return matchesSearch && matchesStatus && matchesCustomFields;
  });

  const totalPages = Math.ceil(filteredTickets.length / pageSize);
  const pagedTickets = filteredTickets.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const checkedInCount = tickets.filter((t) => t.is_checked_in).length;
  const notCheckedInCount = tickets.length - checkedInCount;
  const totalCount = tickets.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchTickets(eventFilter)}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "🔄 Refresh"}
          </Button>
          <Button
            variant="outline"
            onClick={exportToExcel}
            disabled={exportLoading || tickets.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportLoading ? "Exporting..." : "Export Excel"}
          </Button>
          {/* <Dialog
            open={scannerOpen}
            onOpenChange={(open) => {
              setScannerOpen(open);
              if (!open) {
                setLastScanResult(null);
                setCameraError(null);
                setIsProcessingScan(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => {
                  if (!scannerOpen) {
                    setScannerOpen(true);
                    setLastScanResult(null);
                    setCameraError(null);
                    setIsProcessingScan(false);
                  }
                }}
              >
                Scan QR/Barcode
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-3xl h-[75vh] flex flex-col justify-center items-center">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between w-full">
                  <span>Scan QR/Barcode Ticket</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScannerOpen(false)}
                    className="ml-4"
                  >
                    Tutup
                  </Button>
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  Arahkan kamera ke QR code/barcode pada tiket untuk check-in.
                  <br />
                  Scanner akan tetap terbuka untuk scan berkelanjutan.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center w-full h-full justify-center">
                {cameraError && (
                  <div className="mb-4 px-4 py-2 rounded bg-red-100 text-red-700 text-center">
                    {cameraError}
                  </div>
                )}
                {lastScanResult && (
                  <div
                    className={`mb-4 px-4 py-2 rounded text-white font-bold text-center shadow-lg ${
                      lastScanResult.status === "success"
                        ? "bg-green-600"
                        : lastScanResult.status === "duplicate"
                          ? "bg-yellow-500"
                          : "bg-red-600"
                    }`}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: lastScanResult.message,
                      }}
                    />
                    <button
                      onClick={() => setLastScanResult(null)}
                      className="ml-4 text-xs underline text-white/80"
                    >
                      Bersihkan pesan
                    </button>
                  </div>
                )}
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-full h-full rounded-lg border shadow-lg bg-black flex items-center justify-center">
                    <ScannerHtml5Qrcode
                      open={scannerOpen}
                      onScan={handleScan}
                      onError={handleError}
                    />
                  </div>
                </div>
                {cameraError && (
                  <div className="text-red-600 text-sm mt-2">{cameraError}</div>
                )}
              </div>
            </DialogContent>
          </Dialog> */}
          {/* <Button
            variant="destructive"
            onClick={() => setBulkCheckoutOpen(true)}
          >
            Checkout Massal
          </Button> */}
        </div>
      </div>

      {/* Dialog konfirmasi checkout massal */}
      <Dialog open={bulkCheckoutOpen} onOpenChange={setBulkCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Checkout Massal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Apakah Anda yakin ingin melakukan checkout massal?</p>
            <p className="text-sm text-gray-600 mt-2">
              Ini akan checkout semua tiket yang sudah check-in dari hasil
              filter saat ini. Total tiket yang akan di-checkout:{" "}
              {filteredTickets.filter((t) => t.is_checked_in).length}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkCheckoutOpen(false)}
              disabled={bulkLoading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setBulkLoading(true);
                try {
                  const checkedInTickets = filteredTickets.filter(
                    (t) => t.is_checked_in,
                  );
                  const ids = checkedInTickets.map((t) => t.id);

                  if (ids.length === 0) {
                    toast({
                      title:
                        "Tidak ada tiket yang sudah check-in untuk di-checkout",
                      variant: "destructive",
                    });
                    return;
                  }

                  const response = await fetch(`/api/tickets?t=${Date.now()}`, {
                    method: "PUT",
                    cache: "no-store",
                    headers: {
                      "Content-Type": "application/json",
                      "Cache-Control": "no-cache, no-store, must-revalidate",
                    },
                    body: JSON.stringify({ ids, isCheckedIn: false }),
                  });

                  const result = await response.json();
                  if (!response.ok) {
                    throw new Error(result.error || "Failed to update tickets");
                  }

                  toast({
                    title: "Sukses",
                    description: `Berhasil checkout massal ${ids.length} tiket.`,
                  });

                  // Refresh data after bulk operation
                  setTimeout(() => {
                    fetchTickets(eventFilter);
                  }, 500);
                } catch (err: any) {
                  console.error("Bulk checkout error:", err);
                  toast({
                    title: "Gagal",
                    description: err.message || "Gagal checkout massal",
                    variant: "destructive",
                  });
                } finally {
                  setBulkCheckoutOpen(false);
                  setBulkLoading(false);
                }
              }}
              disabled={bulkLoading}
            >
              {bulkLoading ? "Memproses..." : "Ya, Checkout Semua"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary check-in dengan card */}
      <div className="flex flex-wrap gap-2 items-stretch">
        <div
          className="bg-white rounded-lg shadow-sm px-2 py-2 flex-1 min-w-[90px] border border-gray-100"
          style={{ borderLeftWidth: "5px", borderLeftColor: "#8b5cf6" }}
        >
          <div className="text-center text-gray-500 font-semibold text-xs">
            Total
          </div>
          <div className="text-center text-xl font-bold text-gray-900 mt-1">
            {totalCount}
          </div>
        </div>
        <div
          className="bg-white rounded-lg shadow-sm px-2 py-2 flex-1 min-w-[90px] border border-gray-100"
          style={{ borderLeftWidth: "5px", borderLeftColor: "#22c55e" }}
        >
          <div className="text-center text-gray-500 font-semibold text-xs">
            Has Check-in
          </div>
          <div className="text-center text-xl font-bold text-gray-900 mt-1">
            {checkedInCount}
          </div>
        </div>
        <div
          className="bg-white rounded-lg shadow-sm px-2 py-2 flex-1 min-w-[90px] border border-gray-100"
          style={{ borderLeftWidth: "5px", borderLeftColor: "#a3a3a3" }}
        >
          <div className="text-center text-gray-500 font-semibold text-xs">
            Not Check-in
          </div>
          <div className="text-center text-xl font-bold text-gray-900 mt-1">
            {notCheckedInCount}
          </div>
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
                  placeholder="Cari berdasarkan ticket code, nama, email, atau order ref..."
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
              <Select
                value={eventFilter}
                onValueChange={(value) => {
                  setEventFilter(value);
                  setPage(1); // Reset page when filter changes
                }}
              >
                <SelectTrigger className="w-full">
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
            </div>
          </div>
          {customFieldsForFilter.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-semibold mb-3">Filter Custom Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customFieldsForFilter.map((field) => {
                  const filterValue = customFieldFilters[field.field_name] || "";

                  if (["dropdown", "radio"].includes(field.field_type)) {
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label className="text-sm">{field.field_label}</Label>
                        <Select
                          value={filterValue}
                          onValueChange={(value) =>
                            setCustomFieldFilters({
                              ...customFieldFilters,
                              [field.field_name]: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={`Semua ${field.field_label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Semua {field.field_label}</SelectItem>
                            {field.options?.map((option: any) => (
                              <SelectItem key={option.id} value={option.option_value}>
                                {option.option_label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  } else {
                    return (
                      <div key={field.id} className="space-y-2">
                        <Label className="text-sm">{field.field_label}</Label>
                        <Input
                          placeholder={`Cari ${field.field_label}...`}
                          value={filterValue}
                          onChange={(e) =>
                            setCustomFieldFilters({
                              ...customFieldFilters,
                              [field.field_name]: e.target.value,
                            })
                          }
                        />
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}
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
                  <SimpleTableHeader className="w-16">No</SimpleTableHeader>
                  <SimpleTableHeader>Attendee</SimpleTableHeader>
                  <SimpleTableHeader className="hidden md:table-cell">
                    Ticket Type
                  </SimpleTableHeader>
                  <SimpleTableHeader className="hidden md:table-cell">
                    Nama Event
                  </SimpleTableHeader>
                  {customHeaders.map((header) => (
                    <SimpleTableHeader
                      key={header}
                      className="hidden md:table-cell"
                    >
                      {header}
                    </SimpleTableHeader>
                  ))}
                  <SimpleTableHeader>Check-in Status</SimpleTableHeader>
                  <SimpleTableHeader className="hidden md:table-cell">
                    Aksi
                  </SimpleTableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedTickets.map((ticket, index) => (
                  <TableRow
                    key={ticket.id}
                    className={
                      ticket.is_checked_in
                        ? "bg-green-50 border-l-4 border-green-400"
                        : "bg-white border-l-4 border-gray-200"
                    }
                  >
                    <TableCell className="w-16 text-center text-sm text-gray-500 font-medium">
                      {(page - 1) * pageSize + index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{ticket.attendee_name}</div>
                      <div className="text-sm text-gray-500">
                        {ticket.ticket_code}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {ticket.ticket_type_name || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {ticket.event_name || "-"}
                    </TableCell>
                    {customHeaders.map((header) => (
                      <TableCell key={header} className="hidden md:table-cell">
                        {ticket.custom_data?.[header] || "-"}
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant={
                            ticket.is_checked_in ? "default" : "secondary"
                          }
                          className="whitespace-nowrap"
                        >
                          {ticket.is_checked_in
                            ? "Checked In"
                            : "Not Checked In"}
                        </Badge>
                        {ticket.checked_in_at && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(ticket.checked_in_at)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex space-x-2">
                        <Link href={`/tickets/${ticket.id}`}>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination Controls - dropdown rows per page di bawah dekat paging */}
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages} ({filteredTickets.length} total)
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-x-2 flex items-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >
                First
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
