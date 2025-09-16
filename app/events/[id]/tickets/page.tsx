"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Plus, Edit, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/lib/supabase";
import { SimpleTableHeader } from "@/components/table-header";

type TicketType = Database["public"]["Tables"]["ticket_types"]["Row"];
type TicketTypeInsert = Database["public"]["Tables"]["ticket_types"]["Insert"];
type TicketTypeUpdate = Database["public"]["Tables"]["ticket_types"]["Update"];

export default function EventTicketsPage() {
  const params = useParams();
  const router = useRouter();
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [eventName, setEventName] = useState("");
  const [formData, setFormData] = useState<TicketTypeInsert>({
    event_id: Number(params.id),
    name: "",
    price: 0,
    quantity_total: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (params.id) {
      fetchEventAndTickets();
    }
  }, [params.id]);

  const fetchEventAndTickets = async () => {
    try {
      const response = await fetch(`/api/ticket-types?eventId=${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setEventName(data.eventName);
      setTicketTypes(data.ticketTypes || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editingTicket ? "PUT" : "POST";
      const body = editingTicket
        ? JSON.stringify({ id: editingTicket.id, ...formData })
        : JSON.stringify(formData);

      const response = await fetch("/api/ticket-types", {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (!response.ok) {
        throw new Error(
          editingTicket
            ? "Failed to update ticket type"
            : "Failed to create ticket type",
        );
      }

      toast({
        title: "Berhasil",
        description: `Ticket type berhasil ${editingTicket ? "diperbarui" : "ditambahkan"}`,
      });

      setDialogOpen(false);
      setEditingTicket(null);
      setFormData({
        event_id: Number(params.id),
        name: "",
        price: 0,
        quantity_total: 0,
      });
      fetchEventAndTickets(); // Refresh data
    } catch (error) {
      console.error("Error saving ticket type:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan ticket type",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (ticket: TicketType) => {
    setEditingTicket(ticket);
    setFormData({
      event_id: ticket.event_id,
      name: ticket.name,
      price: Number(ticket.price),
      quantity_total: ticket.quantity_total,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus ticket type ini?")) return;

    try {
      const response = await fetch(`/api/ticket-types?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete ticket type");

      toast({
        title: "Berhasil",
        description: "Ticket type berhasil dihapus",
      });
      fetchEventAndTickets(); // Refresh data
    } catch (error) {
      console.error("Error deleting ticket type:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus ticket type",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Kelola Ticket Types
            </h1>
            <p className="text-gray-500">{eventName}</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Ticket Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTicket ? "Edit Ticket Type" : "Tambah Ticket Type Baru"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Ticket Type</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Harga</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity_total">Kuota Total</Label>
                <Input
                  id="quantity_total"
                  type="number"
                  min="1"
                  value={formData.quantity_total}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quantity_total: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingTicket(null);
                    setFormData({
                      event_id: Number(params.id),
                      name: "",
                      price: 0,
                      quantity_total: 0,
                    });
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {editingTicket ? "Perbarui" : "Simpan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Ticket Types ({ticketTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SimpleTableHeader>Nama Ticket</SimpleTableHeader>
                <SimpleTableHeader>Harga</SimpleTableHeader>
                <SimpleTableHeader>Kuota</SimpleTableHeader>
                <SimpleTableHeader>Terjual</SimpleTableHeader>
                <SimpleTableHeader>Sisa</SimpleTableHeader>
                <SimpleTableHeader>Aksi</SimpleTableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ticketTypes.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div className="font-medium">{ticket.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-purple-600">
                      {formatCurrency(Number(ticket.price))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{ticket.quantity_total}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{ticket.quantity_sold}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${
                        ticket.quantity_total - ticket.quantity_sold <= 10
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {ticket.quantity_total - ticket.quantity_sold}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(ticket)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(ticket.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {ticketTypes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Belum ada ticket type. Klik tombol "Tambah Ticket Type" untuk
              menambahkan.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
