"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Edit, Calendar, MapPin, Users, Ticket } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Database } from "@/lib/supabase"
import Link from "next/link"
import Image from "next/image"

type Event = Database["public"]["Tables"]["events"]["Row"] & {
  ticket_types: Database["public"]["Tables"]["ticket_types"]["Row"][]
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (params.id) {
      fetchEvent()
    }
  }, [params.id])

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          ticket_types (*)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error
      setEvent(data as Event)
    } catch (error) {
      console.error("Error fetching event:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data event",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p>Event tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Detail Event</h1>
        </div>
        <div className="flex space-x-2">
          <Link href={`/events/${event.id}/edit`}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
          </Link>
          <Link href={`/events/${event.id}/tickets`}>
            <Button variant="outline">
              <Ticket className="h-4 w-4 mr-2" />
              Kelola Tiket
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{event.name}</h3>
                <p className="text-gray-500">/{event.slug}</p>
              </div>

              {event.image_url && (
                <div className="w-full bg-gray-50 rounded-lg overflow-hidden">
                  <Image
                    src={event.image_url || "/placeholder.svg"}
                    alt={event.name}
                    width={800}
                    height={400}
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: "400px" }}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Tanggal Mulai</p>
                    <p className="text-sm text-gray-500">{formatDate(event.start_date)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Tanggal Selesai</p>
                    <p className="text-sm text-gray-500">{formatDate(event.end_date)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Lokasi</p>
                  <p className="text-sm text-gray-500">{event.location || "-"}</p>
                </div>
              </div>

              {event.description && (
                <div>
                  <p className="font-medium mb-2">Deskripsi</p>
                  <div
                    className="text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status Event</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={
                  event.start_date && new Date(event.start_date) > new Date()
                    ? "default"
                    : event.end_date && new Date(event.end_date) < new Date()
                      ? "secondary"
                      : "destructive"
                }
                className="text-lg px-4 py-2"
              >
                {event.start_date && new Date(event.start_date) > new Date()
                  ? "Upcoming"
                  : event.end_date && new Date(event.end_date) < new Date()
                    ? "Finished"
                    : "Active"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ticket Types ({event.ticket_types.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {event.ticket_types.length > 0 ? (
                <div className="space-y-4">
                  {event.ticket_types.map((ticketType) => (
                    <div key={ticketType.id} className="border rounded-lg p-4">
                      <h4 className="font-medium">{ticketType.name}</h4>
                      <p className="text-lg font-bold text-purple-600">{formatCurrency(Number(ticketType.price))}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>
                          {ticketType.quantity_sold}/{ticketType.quantity_total} terjual
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Belum ada ticket type</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
