"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  MessageCircle,
  ShoppingCart,
  CreditCard,
  Eye,
  Search,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";
import { JsonBeautifier } from "@/components/JsonBeautifier";

type NotificationLog = {
  id: number;
  order_reference: string | null;
  recipient_phone: string | null;
  created_at: string;
  request_payload: any | null;
  response_payload: any | null;
  channel: string;
  trigger_on: string;
  customer_name: string | null;
};

export default function NotificationLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [triggerFilter, setTriggerFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pagedLogs = logs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(logs.length / pageSize);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notification-logs");
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching notification logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notification logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.order_id?.toString().includes(searchTerm) ||
      log.recipient?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel =
      channelFilter === "all" || log.channel === channelFilter;
    const matchesTrigger =
      triggerFilter === "all" || log.trigger_on === triggerFilter;

    return matchesSearch && matchesChannel && matchesTrigger;
  });

  const getChannelIcon = (channel: string) => {
    return channel === "email" ? (
      <Mail className="h-4 w-4" />
    ) : (
      <MessageCircle className="h-4 w-4" />
    );
  };

  const getTriggerIcon = (trigger: string) => {
    return trigger === "checkout" ? (
      <ShoppingCart className="h-4 w-4" />
    ) : (
      <CreditCard className="h-4 w-4" />
    );
  };

  const getChannelBadgeColor = (channel: string) => {
    return channel === "email"
      ? "bg-blue-100 text-blue-800"
      : "bg-green-100 text-green-800";
  };

  const getTriggerBadgeColor = (trigger: string) => {
    return trigger === "checkout"
      ? "bg-orange-100 text-orange-800"
      : "bg-green-100 text-green-800";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openDetailDialog = (log: NotificationLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Notification Logs
          </h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Notification Logs</h1>
        <Button onClick={fetchLogs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order id or recipient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
            <Select value={triggerFilter} onValueChange={setTriggerFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Trigger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Triggers</SelectItem>
                <SelectItem value="checkout">Checkout</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Logs ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Reference</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Recipient Phone</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No notification logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.order_reference || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getChannelBadgeColor(log.channel)} flex items-center gap-1 w-fit`}
                        >
                          {getChannelIcon(log.channel)}
                          {log.channel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getTriggerBadgeColor(log.trigger_on)} flex items-center gap-1 w-fit`}
                        >
                          {getTriggerIcon(log.trigger_on)}
                          {log.trigger_on}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.recipient_phone || "-"}</TableCell>
                      <TableCell>{log.customer_name || "-"}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {log.created_at ? formatDate(log.created_at) : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailDialog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination - dropdown rows per page di bawah dekat paging */}
          {logs.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages} ({logs.length} total)
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
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  First
                </Button>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-disabled={page === 1}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={page === i + 1}
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        aria-disabled={page === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
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
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notification Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>ID:</strong> {selectedLog.id}
                    </div>
                    <div>
                      <strong>Order Reference:</strong>{" "}
                      {selectedLog.order_reference || "-"}
                    </div>
                    <div>
                      <strong>Channel:</strong>
                      <Badge
                        className={`${getChannelBadgeColor(selectedLog.channel)} ml-2`}
                      >
                        {getChannelIcon(selectedLog.channel)}
                        {selectedLog.channel}
                      </Badge>
                    </div>
                    <div>
                      <strong>Trigger:</strong>
                      <Badge
                        className={`${getTriggerBadgeColor(selectedLog.trigger_on)} ml-2`}
                      >
                        {getTriggerIcon(selectedLog.trigger_on)}
                        {selectedLog.trigger_on}
                      </Badge>
                    </div>
                    <div>
                      <strong>Created:</strong>{" "}
                      {formatDate(selectedLog.created_at)}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Recipient Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedLog.recipient && (
                      <div className="flex items-center gap-2">
                        {selectedLog.channel === "email" ? (
                          <>
                            <Mail className="h-4 w-4" />
                            {selectedLog.recipient}
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-4 w-4" />
                            {selectedLog.recipient}
                          </>
                        )}
                        {selectedLog.customer_name && (
                          <span className="ml-2 text-gray-500">
                            ({selectedLog.customer_name})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Payload</h4>
                  {selectedLog.request_payload ? (
                    <JsonBeautifier data={selectedLog.request_payload} />
                  ) : (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs text-gray-500">
                      (No Data)
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response Payload</h4>
                  {selectedLog.response_payload ? (
                    <JsonBeautifier data={selectedLog.response_payload} />
                  ) : (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg text-xs text-gray-500">
                      (No Data)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
