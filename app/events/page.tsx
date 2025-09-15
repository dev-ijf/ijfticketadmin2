"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Eye, Calendar, MapPin, Search, Ticket } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SimpleTableHeader } from "@/components/table-header"
import Link from "next/link"

type TicketType = {
  id: number
  name: string
  price: number
  quantity_total: number
  quantity_sold: number
}

type Event = {
  id: number
  name: string
  slug: string
  start_date: string | null
  end_date: string | null
  location: string | null
  ticket_types: TicketType[]
}

async function fetchEvents(): Promise<Event[]> {
  try {
    const response = await fetch("/api/events")
    if (!response.ok) {
      throw new Error("Failed to fetch events")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const loadEvents = async () => {
      const eventsData = await fetchEvents()
      if (eventsData.length === 0) {
        toast({
          title: "Error",
          description: "Gagal memuat data events",
          variant: "destructive",
        })
      }
      setEvents(eventsData)
      setLoading(false)
    }
    loadEvents()
  }, [toast])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return `${date.getUTCDate()} ${date.toLocaleString("id-ID", { month: "long", timeZone: "UTC" })} ${date.getUTCFullYear()} pukul ${date.getUTCHours().toString().padStart(2, "0")}.${date.getUTCMinutes().toString().padStart(2, "0")}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount)
  }

  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Events & Tickets</h1>
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
        <h1 className="text-3xl font-bold text-gray-900">Events & Tickets</h1>
        <Link href="/events/create">
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Event
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cari Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari berdasarkan nama event, slug, atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Events ({filteredEvents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <SimpleTableHeader>Nama Event</SimpleTableHeader>
                <SimpleTableHeader>Tanggal</SimpleTableHeader>
                <SimpleTableHeader>Lokasi</SimpleTableHeader>
                <SimpleTableHeader>Ticket Types</SimpleTableHeader>
                <SimpleTableHeader>Status</SimpleTableHeader>
                <SimpleTableHeader>Aksi</SimpleTableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{event.name}</div>
                      <div className="text-sm text-gray-500">{event.slug}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">
                        <div>{formatDate(event.start_date)}</div>
                        {event.end_date && <div className="text-gray-500">s/d {formatDate(event.end_date)}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{event.location || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {event.ticket_types.length > 0 ? (
                        event.ticket_types.map((ticketType) => (
                          <div key={ticketType.id} className="text-sm">
                            <div className="font-medium">{ticketType.name}</div>
                            <div className="text-gray-500">
                              {formatCurrency(Number(ticketType.price))} • {ticketType.quantity_sold}/
                              {ticketType.quantity_total}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">Belum ada ticket type</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        event.start_date && new Date(event.start_date) > new Date()
                          ? "default"
                          : event.end_date && new Date(event.end_date) < new Date()
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {event.start_date && new Date(event.start_date) > new Date()
                        ? "Upcoming"
                        : event.end_date && new Date(event.end_date) < new Date()
                          ? "Finished"
                          : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/events/${event.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/events/${event.id}/edit`}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/events/${event.id}/tickets`}>
                        <Button size="sm" variant="outline">
                          <Ticket className="h-4 w-4" />
                        </Button>
                      </Link>
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
