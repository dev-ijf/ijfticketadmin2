"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  RefreshCw,
  Upload,
  Download,
  FileSpreadsheet,
  Send,
} from "lucide-react";
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
import * as XLSX from "xlsx";

type Order = {
  id: number;
  customer_id: number;
  event_id: number;
  payment_channel_id: number | null;
  total_amount: number;
  discount_amount: number | null;
  final_amount: number;
  status: string;
  order_date: string;
  proof_transfer: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  event_name: string;
  event_slug: string;
  payment_channel_name: string | null;
  payment_channel_type: string | null;
};

type Event = {
  id: number;
  name: string;
};

type PaymentChannel = {
  id: number;
  name: string;
  type: string;
};

type UploadRow = {
  customer_name: string;
  customer_email: string;
  customer_phone_number: string;
  event_id: number;
  ticket_type_id: number;
  quantity: number;
  final_amount: number;
  order_date: string;
  payment_channel_id: number;
  barcode_id?: string;
  custom_answers?: { [key: string]: string };
};

type TempOrder = {
  id: number;
  upload_session_id: string;
  row_number: number;
  customer_name: string;
  customer_email: string;
  customer_phone_number: string;
  event_id: number;
  ticket_type_id: number;
  quantity: number;
  final_amount: number;
  order_date: string;
  payment_channel_id: number;
  barcode_id: string | null;
  import_status: "pending" | "success" | "error";
  error_message: string | null;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const { toast } = useToast();

  // Upload states
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadData, setUploadData] = useState<UploadRow[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Auto-refresh every 10 seconds for realtime updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data.orders || []);
      setEvents(data.events || []);
      setPaymentChannels(data.paymentChannels || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update order status");
      toast({
        title: "Berhasil",
        description: "Status order berhasil diperbarui",
      });
      await fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui status order",
        variant: "destructive",
      });
    }
  };

  // Export orders to Excel
  const exportOrders = async () => {
    try {
      const exportData = filteredOrders.map((order) => ({
        "Order ID": order.id,
        "Customer Name": order.customer_name,
        "Customer Email": order.customer_email,
        "Customer Phone": order.customer_phone || "",
        "Event Name": order.event_name,
        "Final Amount": order.final_amount,
        "Payment Method": order.payment_channel_name || "",
        Status: order.status,
        "Order Date": new Date(order.order_date).toLocaleDateString("id-ID"),
        "Created At": new Date(order.created_at).toLocaleDateString("id-ID"),
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = [
        { wch: 10 }, // Order ID
        { wch: 25 }, // Customer Name
        { wch: 30 }, // Customer Email
        { wch: 15 }, // Customer Phone
        { wch: 30 }, // Event Name
        { wch: 15 }, // Final Amount
        { wch: 20 }, // Payment Method
        { wch: 12 }, // Status
        { wch: 15 }, // Order Date
        { wch: 15 }, // Created At
      ];
      worksheet["!cols"] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
      const fileName = `orders_export_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Export Berhasil",
        description: `Berhasil mengexport ${exportData.length} data orders`,
      });
    } catch (error) {
      console.error("Error exporting orders:", error);
      toast({
        title: "Export Gagal",
        description: "Gagal mengexport data orders",
        variant: "destructive",
      });
    }
  };

  // Fetch custom fields for selected event
  const fetchCustomFields = async (eventId: number) => {
    try {
      const response = await fetch(
        `/api/events/custom-fields?event_id=${eventId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch custom fields");
      const data = await response.json();
      setCustomFields(data.custom_fields || []);
    } catch (error: any) {
      console.error("Error fetching custom fields:", error);
      setCustomFields([]);
    }
  };

  // Download template Excel
  const downloadTemplate = async () => {
    if (!selectedEventId) {
      toast({
        title: "Error",
        description:
          "Pilih event terlebih dahulu untuk generate template dengan custom fields",
        variant: "destructive",
      });
      return;
    }

    // Fetch custom fields for selected event
    let eventCustomFields: any[] = [];
    try {
      const response = await fetch(
        `/api/events/custom-fields?event_id=${selectedEventId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch custom fields");
      const data = await response.json();
      eventCustomFields = data.custom_fields || [];
    } catch (error: any) {
      console.error("Error fetching custom fields:", error);
      toast({
        title: "Warning",
        description:
          "Gagal mengambil custom fields, template akan dibuat tanpa custom fields",
        variant: "destructive",
      });
      eventCustomFields = [];
    }

    // Create manual data structure to ensure proper column separation
    const baseHeaders = [
      "customer_name",
      "customer_email",
      "customer_phone_number",
      "event_id",
      "ticket_type_id",
      "quantity",
      "final_amount",
      "order_date",
      "payment_channel_id",
      "barcode_id",
    ];

    // Add custom fields headers
    const customFieldHeaders = eventCustomFields.map(
      (field) => field.field_name,
    );
    const headers = [...baseHeaders, ...customFieldHeaders];

    const baseSampleData = [
      "John Doe",
      "john@example.com",
      "081234567890",
      selectedEventId,
      1,
      2,
      150000,
      "2024-01-15",
      1,
      "SAMPLE123",
    ];

    // Add custom fields sample data
    const customFieldSampleData = eventCustomFields.map((field) => {
      if (field.options && field.options.length > 0) {
        return field.options[0].option_value; // First option as sample
      }
      return `Sample ${field.field_label}`;
    });

    const sampleData = [...baseSampleData, ...customFieldSampleData];

    const baseInstructions = [
      "Tips:",
      "- customer_name: Nama lengkap",
      "- customer_email: Email valid",
      "- customer_phone_number: 08xxx atau +62xxx",
      "- event_id: ID Event (cek di sistem)",
      "- ticket_type_id: ID Tipe Tiket (cek di sistem)",
      "- quantity: Jumlah pembelian",
      "- final_amount: Total bayar (tanpa separator)",
      "- order_date: Format YYYY-MM-DD",
      "- payment_channel_id: ID Payment Channel",
      "- barcode_id: Kode barcode (opsional)",
    ];

    // Add custom fields instructions
    const customFieldInstructions = eventCustomFields.map((field) => {
      let instruction = `- ${field.field_name}: ${field.field_label}`;
      if (field.is_required) instruction += " (WAJIB)";
      if (field.options && field.options.length > 0) {
        const options = field.options
          .map((opt: any) => opt.option_value)
          .join(", ");
        instruction += ` (Pilihan: ${options})`;
      }
      return instruction;
    });

    const instructionsData = [
      ...baseInstructions,
      ...customFieldInstructions,
      "Flow: Order → Order Items → Attendees → Tickets (trigger)",
    ];

    const workbook = XLSX.utils.book_new();

    // Create main worksheet
    const ws_data = [headers, sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(ws_data);

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // customer_name
      { wch: 25 }, // customer_email
      { wch: 18 }, // customer_phone_number
      { wch: 10 }, // event_id
      { wch: 15 }, // ticket_type_id
      { wch: 10 }, // quantity
      { wch: 15 }, // final_amount
      { wch: 12 }, // order_date
      { wch: 20 }, // payment_channel_id
      { wch: 15 }, // barcode_id
    ];
    worksheet["!cols"] = columnWidths;

    // Add instructions sheet
    const instructionsWs = XLSX.utils.aoa_to_sheet([instructionsData]);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.utils.book_append_sheet(workbook, instructionsWs, "Instructions");

    XLSX.writeFile(workbook, "orders_upload_template.xlsx");

    toast({
      title: "Template Downloaded",
      description: `Template Excel dengan ${eventCustomFields.length} custom fields berhasil didownload.`,
    });
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Parse manual untuk menghindari masalah dengan merged cells
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        // Get unique event IDs from the data to fetch their custom fields
        const eventIds = [
          ...new Set(
            rows
              .map((row) => parseInt(String(row[3] || "0")))
              .filter((id) => id > 0),
          ),
        ];
        const eventCustomFieldsMap: { [eventId: number]: any[] } = {};

        // Fetch custom fields for all events in the Excel
        for (const eventId of eventIds) {
          try {
            const response = await fetch(
              `/api/events/custom-fields?event_id=${eventId}`,
            );
            if (response.ok) {
              const data = await response.json();
              eventCustomFieldsMap[eventId] = data.custom_fields || [];
            } else {
              eventCustomFieldsMap[eventId] = [];
            }
          } catch (err) {
            console.error(
              `Error fetching custom fields for event ${eventId}:`,
              err,
            );
            eventCustomFieldsMap[eventId] = [];
          }
        }

        const parsedData: UploadRow[] = rows
          .filter((row) =>
            row.some(
              (cell) => cell !== null && cell !== undefined && cell !== "",
            ),
          )
          .map((row, index) => {
            try {
              // Mapping manual untuk menghindari masalah format
              const rowData: UploadRow = {
                customer_name: String(row[0] || "").trim(),
                customer_email: String(row[1] || "").trim(),
                customer_phone_number: String(row[2] || "").trim(),
                event_id: parseInt(String(row[3] || "1")),
                ticket_type_id: parseInt(String(row[4] || "1")),
                quantity: parseInt(String(row[5] || "1")),
                final_amount: parseFloat(String(row[6] || "0")),
                order_date: String(
                  row[7] || new Date().toISOString().split("T")[0],
                ),
                payment_channel_id: parseInt(String(row[8] || "1")),
                barcode_id: row[9] ? String(row[9]).trim() : undefined,
              };

              // Parse custom fields (starting from column K = index 10)
              const customAnswers: { [key: string]: string } = {};
              const eventCustomFields =
                eventCustomFieldsMap[rowData.event_id] || [];

              // Parse custom fields based on the event's custom fields
              eventCustomFields.forEach((field, fieldIndex) => {
                const columnIndex = 10 + fieldIndex; // Starting from column K
                const value = row[columnIndex];
                if (value !== null && value !== undefined && value !== "") {
                  customAnswers[field.field_name] = String(value).trim();
                }
              });

              if (Object.keys(customAnswers).length > 0) {
                rowData.custom_answers = customAnswers;
              }

              // Validasi data
              if (!rowData.customer_name || !rowData.customer_email) {
                throw new Error(
                  `Row ${index + 2}: Customer name dan email harus diisi`,
                );
              }

              // Validasi custom fields yang required
              eventCustomFields.forEach((field) => {
                if (field.is_required) {
                  const value = customAnswers[field.field_name];
                  if (!value || value.trim() === "") {
                    throw new Error(
                      `Row ${index + 2}: ${field.field_label} (${field.field_name}) wajib diisi`,
                    );
                  }

                  // Validasi untuk dropdown - pastikan value ada dalam options
                  if (
                    field.field_type === "dropdown" &&
                    field.options &&
                    field.options.length > 0
                  ) {
                    const validOptions = field.options.map(
                      (opt: any) => opt.option_value,
                    );
                    if (!validOptions.includes(value.trim())) {
                      throw new Error(
                        `Row ${index + 2}: ${field.field_label} harus salah satu dari: ${validOptions.join(", ")}`,
                      );
                    }
                  }
                }
              });

              return rowData;
            } catch (error: any) {
              console.error(`Error parsing row ${index + 2}:`, error, row);
              throw error;
            }
          });

        console.log("Parsed Excel data:", parsedData);
        setUploadData(parsedData);
        setUploadOpen(true);
      } catch (error: any) {
        console.error("Error parsing Excel file:", error);
        toast({
          title: "Error",
          description: `Gagal membaca file Excel: ${error?.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Process direct import using temp upload flow
  const processDirectImport = async () => {
    if (uploadData.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diimport",
        variant: "destructive",
      });
      return;
    }

    setImportLoading(true);
    try {
      // First upload to temp table
      const uploadResponse = await fetch("/api/upload/orders-temp-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: uploadData,
        }),
      });

      if (!uploadResponse.ok) {
        const uploadError = await uploadResponse.json();
        throw new Error(uploadError.error || "Upload failed");
      }

      const uploadResult = await uploadResponse.json();
      console.log("Upload session created:", uploadResult.upload_session_id);

      // Then process the import
      const importResponse = await fetch("/api/upload/orders-temp-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          upload_session_id: uploadResult.upload_session_id,
        }),
      });

      if (!importResponse.ok) {
        const importError = await importResponse.json();
        throw new Error(importError.error || "Import failed");
      }

      const importResult = await importResponse.json();
      console.log("Import result:", importResult);

      toast({
        title: "Import Completed",
        description: `Success: ${importResult.success}, Failed: ${importResult.failed}`,
        variant: importResult.failed > 0 ? "destructive" : "default",
      });

      if (importResult.errors && importResult.errors.length > 0) {
        console.error("Import errors:", importResult.errors);
        // Show first few errors in toast
        const firstErrors = importResult.errors.slice(0, 3).join("; ");
        toast({
          title: "Import Errors",
          description:
            firstErrors + (importResult.errors.length > 3 ? "..." : ""),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Import process error:", error);
      toast({
        title: "Import Failed",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }

    setUploadOpen(false);
    // Refresh orders data
    await fetchOrders();
  };

  // Legacy direct import method (kept for reference)
  const legacyDirectImport = async () => {
    if (uploadData.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada data untuk diimport",
        variant: "destructive",
      });
      return;
    }

    setImportLoading(true);
    try {
      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const row of uploadData) {
        try {
          // Create order directly
          const response = await fetch("/api/orders/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              customer_name: row.customer_name,
              customer_email: row.customer_email,
              customer_phone: row.customer_phone_number,
              event_id: row.event_id,
              ticket_type_id: row.ticket_type_id,
              quantity: row.quantity,
              final_amount: row.final_amount,
              order_date: row.order_date,
              payment_channel_id: row.payment_channel_id,
              barcode_id: row.barcode_id,
              custom_answers: row.custom_answers,
            }),
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || "Failed to create order");
          }

          console.log(`Order created for ${row.customer_name}:`, result);
          success++;
        } catch (error: any) {
          failed++;
          errors.push(
            `${row.customer_name}: ${error?.message || "Unknown error"}`,
          );
        }
      }

      toast({
        title: "Import Selesai",
        description: `Berhasil: ${success} orders (attendees → tickets via trigger), Gagal: ${failed}`,
        variant: failed > 0 ? "destructive" : "default",
      });

      if (errors.length > 0) {
        console.error("Import errors:", errors);
      }

      setUploadOpen(false);
      // Refresh orders data
      await fetchOrders();
    } catch (error: any) {
      console.error("Error processing direct import:", error);
      toast({
        title: "Import Gagal",
        description: error?.message || "Gagal memproses import",
        variant: "destructive",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "cancelled":
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesEvent =
      eventFilter === "all" || order.event_id.toString() === eventFilter;
    const matchesPayment =
      paymentFilter === "all" ||
      order.payment_channel_id?.toString() === paymentFilter;

    return matchesSearch && matchesStatus && matchesEvent && matchesPayment;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <div className="flex space-x-2 items-center">
          <Button onClick={fetchOrders} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportOrders} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <select
            value={selectedEventId || ""}
            onChange={(e) =>
              setSelectedEventId(
                e.target.value ? parseInt(e.target.value) : null,
              )
            }
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Pilih Event untuk Template</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <Button
            onClick={downloadTemplate}
            variant="outline"
            disabled={!selectedEventId}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Format
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload XLSX
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Upload Dialog - Direct Import */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview & Import Data</DialogTitle>
            <DialogDescription>
              Periksa data sebelum import. Orders, order_items, attendees akan
              dibuat, lalu tickets otomatis via trigger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Total rows: {uploadData.length}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SimpleTableHeader>No</SimpleTableHeader>
                    <SimpleTableHeader>Customer Name</SimpleTableHeader>
                    <SimpleTableHeader>Email</SimpleTableHeader>
                    <SimpleTableHeader>Phone</SimpleTableHeader>
                    <SimpleTableHeader>Event ID</SimpleTableHeader>
                    <SimpleTableHeader>Ticket Type ID</SimpleTableHeader>
                    <SimpleTableHeader>Quantity</SimpleTableHeader>
                    <SimpleTableHeader>Amount</SimpleTableHeader>
                    <SimpleTableHeader>Order Date</SimpleTableHeader>
                    <SimpleTableHeader>Custom Fields</SimpleTableHeader>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadData.slice(0, 20).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {row.customer_name}
                      </TableCell>
                      <TableCell>{row.customer_email}</TableCell>
                      <TableCell>{row.customer_phone_number}</TableCell>
                      <TableCell>{row.event_id}</TableCell>
                      <TableCell>{row.ticket_type_id}</TableCell>
                      <TableCell>{row.quantity}</TableCell>
                      <TableCell>{formatCurrency(row.final_amount)}</TableCell>
                      <TableCell>{row.order_date}</TableCell>
                      <TableCell>
                        {row.custom_answers ? (
                          <div className="text-xs">
                            {Object.entries(row.custom_answers).map(
                              ([key, value]) => (
                                <div key={key} className="mb-1">
                                  <span className="font-medium">{key}:</span>{" "}
                                  {value}
                                </div>
                              ),
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">
                            No custom fields
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {uploadData.length > 20 && (
                <div className="text-sm text-gray-500 mt-2">
                  Menampilkan 20 dari {uploadData.length} rows. Flow: Orders →
                  Order Items → Attendees → Tickets (trigger).
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setUploadOpen(false)}
                variant="outline"
                disabled={importLoading}
              >
                Batal
              </Button>
              <Button
                onClick={processDirectImport}
                disabled={importLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {importLoading ? "Importing..." : "Import ke Database"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Event" />
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

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Payment</SelectItem>
                {paymentChannels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id.toString()}>
                    {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-right">
              <span className="text-sm font-medium text-gray-700">
                Total: {filteredOrders.length} orders
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SimpleTableHeader>Order ID</SimpleTableHeader>
                  <SimpleTableHeader>Customer</SimpleTableHeader>
                  <SimpleTableHeader>Event</SimpleTableHeader>
                  <SimpleTableHeader>Amount</SimpleTableHeader>
                  <SimpleTableHeader>Payment Method</SimpleTableHeader>
                  <SimpleTableHeader>Status</SimpleTableHeader>
                  <SimpleTableHeader>Order Date</SimpleTableHeader>
                  <SimpleTableHeader>Aksi</SimpleTableHeader>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-mono font-medium">#{order.id}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-gray-500">
                          {order.customer_email}
                        </div>
                        {order.customer_phone && (
                          <div className="text-sm text-gray-500">
                            {order.customer_phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.event_name}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {formatCurrency(order.final_amount)}
                        </div>
                        {order.discount_amount && order.discount_amount > 0 && (
                          <div className="text-sm text-gray-500">
                            Diskon: {formatCurrency(order.discount_amount)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.payment_channel_name || "-"}
                        {order.payment_channel_type && (
                          <div className="text-xs text-gray-500">
                            {order.payment_channel_type}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(order.order_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            updateOrderStatus(order.id, value)
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
