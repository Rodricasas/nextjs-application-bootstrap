'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import TicketForm from '@/components/TicketForm'
import Dashboard from '@/components/Dashboard'

interface Ticket {
  id: number
  numero_ticket: string
  equipo: string
  fecha_entrada: string
  fecha_inicio_servicio: string
  fecha_fin_servicio: string | null
  descripcion: string
  costo_repuestos: number
  costo_mano_obra: number
  costos_externos_estimados: number
  created_at: string
  updated_at: string
}

export default function HomePage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [refreshTrigger])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tickets')
      const result = await response.json()

      if (response.ok) {
        setTickets(result.data || [])
        setError('')
      } else {
        setError(result.error || 'Error al cargar los tickets')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingTicket(null)
    setRefreshTrigger(prev => prev + 1)
  }

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket)
    setShowForm(true)
  }

  const handleDelete = async (ticketId: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este ticket?')) {
      return
    }

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRefreshTrigger(prev => prev + 1)
      } else {
        const result = await response.json()
        alert(result.error || 'Error al eliminar el ticket')
      }
    } catch (error) {
      alert('Error de conexión')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-ES', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2 
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sistema de Gestión de Tickets de Servicio
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestione tickets de servicio técnico con dashboard interactivo
              </p>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Nuevo Ticket
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dashboard Section */}
          <div className="lg:col-span-2">
            <Dashboard refreshTrigger={refreshTrigger} />
          </div>

          {/* Tickets List Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Lista de Tickets</span>
                  <span className="text-sm font-normal text-gray-500">
                    {tickets.length} total
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay tickets registrados</p>
                    <Button 
                      onClick={() => setShowForm(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Crear Primer Ticket
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {ticket.numero_ticket}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {ticket.equipo}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            ticket.fecha_fin_servicio 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ticket.fecha_fin_servicio ? 'Completado' : 'Pendiente'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-3">
                          <p>Entrada: {formatDate(ticket.fecha_entrada)}</p>
                          <p>Inicio: {formatDate(ticket.fecha_inicio_servicio)}</p>
                          {ticket.fecha_fin_servicio && (
                            <p>Fin: {formatDate(ticket.fecha_fin_servicio)}</p>
                          )}
                        </div>

                        <div className="text-xs text-gray-600 mb-3">
                          <p className="truncate" title={ticket.descripcion}>
                            {ticket.descripcion}
                          </p>
                        </div>

                        <div className="text-sm font-medium text-blue-600 mb-3">
                          Total: {formatCurrency(
                            (ticket.costo_repuestos || 0) + 
                            (ticket.costo_mano_obra || 0) + 
                            (ticket.costos_externos_estimados || 0)
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(ticket)}
                            className="text-xs"
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(ticket.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTicket ? 'Editar Ticket' : 'Nuevo Ticket'}
            </DialogTitle>
          </DialogHeader>
          <TicketForm
            ticket={editingTicket || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingTicket(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
