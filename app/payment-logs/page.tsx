"use client";

import type React from "react";

import { useEffect, useState } from "react";
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
import { Search, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SimpleTableHeader } from "@/components/table-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { JsonBeautifier } from "@/components/JsonBeautifier";

interface PaymentLog {
  id: number;
  order_reference: string | null;
  log_type: string;
  virtual_account_number: string | null;
  payment_response_url: string | null;
  request_payload: any | null;
  response_payload: any | null;
  created_at: string;
  updated_at: string;
}

export default function PaymentLogsPage() {
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentLogs();
  }, []);

  const fetchPaymentLogs = async () => {
    try {
      const response = await fetch("/api/payment-logs");
      if (!response.ok) throw new Error("Failed to fetch payment logs");
      const data = await response.json();
      setPaymentLogs(data || []);
    } catch (error) {
      console.error("Error fetching payment logs:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data payment logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLogTypeBadge = (logType: string) => {
    switch (logType) {
      case "checkout":
        return <Badge variant="default">Checkout</Badge>;
      case "callback":
        return <Badge variant="secondary">Callback</Badge>;
      case "status_check":
        return <Badge variant="outline">Status Check</Badge>;
      default:
        return <Badge variant="outline">{logType}</Badge>;
    }
  };

  const filteredLogs = paymentLogs.filter((log) => {
    const matchesSearch =
      (log.order_reference &&
        log.order_reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.virtual_account_number &&
        log.virtual_account_number
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesType =
      logTypeFilter === "all" || log.log_type === logTypeFilter;

    return matchesSearch && matchesType;
  });

  const handleViewDetails = (log: PaymentLog) => {
    setSelectedLog(log);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Payment Logs</h1>
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
        <h1 className="text-3xl font-bold text-gray-900">Payment Logs</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Payment Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari berdasarkan order reference atau VA number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter berdasarkan tipe log" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="checkout">Checkout</SelectItem>
                <SelectItem value="callback">Callback</SelectItem>
                <SelectItem value="status_check">Status Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Payment Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SimpleTableHeader>Tanggal</SimpleTableHeader>
                <SimpleTableHeader>Order Reference</SimpleTableHeader>
                <SimpleTableHeader>VA Number</SimpleTableHeader>
                <SimpleTableHeader>Log Type</SimpleTableHeader>
                <SimpleTableHeader>Aksi</SimpleTableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">{formatDate(log.created_at)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">
                      {log.order_reference || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">
                      {log.virtual_account_number || "-"}
                    </div>
                  </TableCell>
                  <TableCell>{getLogTypeBadge(log.log_type)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || logTypeFilter !== "all"
                ? "Tidak ada payment logs yang sesuai dengan filter"
                : "Belum ada payment logs"}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Payment Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Order Reference</Label>
                  <p className="font-mono text-sm">
                    {selectedLog.order_reference || "-"}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">VA Number</Label>
                  <p className="font-mono text-sm">
                    {selectedLog.virtual_account_number || "-"}
                  </p>
                </div>
                <div>
                  <Label className="font-medium">Log Type</Label>
                  <div className="mt-1">
                    {getLogTypeBadge(selectedLog.log_type)}
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Tanggal</Label>
                  <p className="text-sm">
                    {formatDate(selectedLog.created_at)}
                  </p>
                </div>
              </div>

              <div>
                <Label className="font-medium">Request Payload</Label>
                {selectedLog.request_payload ? (
                  <JsonBeautifier data={selectedLog.request_payload} />
                ) : (
                  <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs text-gray-500">
                    (No Data)
                  </div>
                )}
              </div>

              <div>
                <Label className="font-medium">Response Payload</Label>
                {selectedLog.response_payload ? (
                  <JsonBeautifier data={selectedLog.response_payload} />
                ) : (
                  <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs text-gray-500">
                    (No Data)
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-sm font-medium text-gray-700 ${className}`}>
      {children}
    </div>
  );
}
