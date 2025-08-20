'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Ticket {
  id?: number
  numero_ticket: string
  equipo: string
  fecha_entrada: string
  fecha_inicio_servicio: string
  fecha_fin_servicio: string | null
  descripcion: string
  costo_repuestos: number
  costo_mano_obra: number
  costos_externos_estimados: number
}

interface TicketFormProps {
  ticket?: Ticket
  onSuccess: () => void
  onCancel?: () => void
}

export default function TicketForm({ ticket, onSuccess, onCancel }: TicketFormProps) {
  const [formData, setFormData] = useState({
    numero_ticket: '',
    equipo: '',
    fecha_entrada: '',
    fecha_inicio_servicio: '',
    fecha_fin_servicio: '',
    descripcion: '',
    costo_repuestos: 0,
    costo_mano_obra: 0,
    costos_externos_estimados: 0,
  })

  const [equipmentList, setEquipmentList] = useState<string[]>([])
  const [customEquipment, setCustomEquipment] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Load equipment list on component mount
  useEffect(() => {
    fetchEquipmentList()
  }, [])

  // Populate form if editing existing ticket
  useEffect(() => {
    if (ticket) {
      setFormData({
        ...ticket,
        fecha_entrada: ticket.fecha_entrada ? new Date(ticket.fecha_entrada).toISOString().split('T')[0] : '',
        fecha_inicio_servicio: ticket.fecha_inicio_servicio ? new Date(ticket.fecha_inicio_servicio).toISOString().split('T')[0] : '',
        fecha_fin_servicio: ticket.fecha_fin_servicio ? new Date(ticket.fecha_fin_servicio).toISOString().split('T')[0] : '',
      })
    }
  }, [ticket])

  const fetchEquipmentList = async () => {
    try {
      const response = await fetch('/api/equipment')
      const result = await response.json()
      if (response.ok) {
        setEquipmentList(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching equipment list:', error)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEquipmentChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomInput(true)
      setFormData(prev => ({ ...prev, equipo: '' }))
    } else {
      setShowCustomInput(false)
      setCustomEquipment('')
      setFormData(prev => ({ ...prev, equipo: value }))
    }
  }

  const handleCustomEquipmentChange = (value: string) => {
    setCustomEquipment(value)
    setFormData(prev => ({ ...prev, equipo: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = ticket ? `/api/tickets/${ticket.id}` : '/api/tickets'
      const method = ticket ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        onSuccess()
        if (!ticket) {
          // Reset form for new tickets
          setFormData({
            numero_ticket: '',
            equipo: '',
            fecha_entrada: '',
            fecha_inicio_servicio: '',
            fecha_fin_servicio: '',
            descripcion: '',
            costo_repuestos: 0,
            costo_mano_obra: 0,
            costos_externos_estimados: 0,
          })
          setShowCustomInput(false)
          setCustomEquipment('')
          // Refresh equipment list
          fetchEquipmentList()
        }
      } else {
        setError(result.error || 'Error al procesar el ticket')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">
          {ticket ? 'Editar Ticket' : 'Nuevo Ticket de Servicio'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero_ticket" className="text-sm font-medium text-gray-700">
                Número de Ticket *
              </Label>
              <Input
                id="numero_ticket"
                type="text"
                value={formData.numero_ticket}
                onChange={(e) => handleInputChange('numero_ticket', e.target.value)}
                required
                className="mt-1"
                placeholder="Ej: TCKT-2024-001"
              />
            </div>

            <div>
              <Label htmlFor="equipo" className="text-sm font-medium text-gray-700">
                Equipo *
              </Label>
              {!showCustomInput ? (
                <Select value={formData.equipo} onValueChange={handleEquipmentChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Seleccionar equipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentList.map((equipment) => (
                      <SelectItem key={equipment} value={equipment}>
                        {equipment}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">+ Agregar nuevo equipo</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1 space-y-2">
                  <Input
                    type="text"
                    value={customEquipment}
                    onChange={(e) => handleCustomEquipmentChange(e.target.value)}
                    placeholder="Ingrese marca y modelo del equipo"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomInput(false)
                      setCustomEquipment('')
                      setFormData(prev => ({ ...prev, equipo: '' }))
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fecha_entrada" className="text-sm font-medium text-gray-700">
                Fecha de Entrada *
              </Label>
              <Input
                id="fecha_entrada"
                type="date"
                value={formData.fecha_entrada}
                onChange={(e) => handleInputChange('fecha_entrada', e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="fecha_inicio_servicio" className="text-sm font-medium text-gray-700">
                Fecha de Inicio del Servicio *
              </Label>
              <Input
                id="fecha_inicio_servicio"
                type="date"
                value={formData.fecha_inicio_servicio}
                onChange={(e) => handleInputChange('fecha_inicio_servicio', e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="fecha_fin_servicio" className="text-sm font-medium text-gray-700">
                Fecha de Finalización del Servicio
              </Label>
              <Input
                id="fecha_fin_servicio"
                type="date"
                value={formData.fecha_fin_servicio}
                onChange={(e) => handleInputChange('fecha_fin_servicio', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
              Descripción del Trabajo Realizado *
            </Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              required
              className="mt-1"
              rows={3}
              placeholder="Describa el trabajo realizado..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="costo_repuestos" className="text-sm font-medium text-gray-700">
                Costo de Repuestos ($)
              </Label>
              <Input
                id="costo_repuestos"
                type="number"
                step="0.01"
                min="0"
                value={formData.costo_repuestos}
                onChange={(e) => handleInputChange('costo_repuestos', parseFloat(e.target.value) || 0)}
                className="mt-1"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="costo_mano_obra" className="text-sm font-medium text-gray-700">
                Costo de Mano de Obra ($)
              </Label>
              <Input
                id="costo_mano_obra"
                type="number"
                step="0.01"
                min="0"
                value={formData.costo_mano_obra}
                onChange={(e) => handleInputChange('costo_mano_obra', parseFloat(e.target.value) || 0)}
                className="mt-1"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="costos_externos_estimados" className="text-sm font-medium text-gray-700">
                Costos Externos Estimados ($)
              </Label>
              <Input
                id="costos_externos_estimados"
                type="number"
                step="0.01"
                min="0"
                value={formData.costos_externos_estimados}
                onChange={(e) => handleInputChange('costos_externos_estimados', parseFloat(e.target.value) || 0)}
                className="mt-1"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Procesando...' : (ticket ? 'Actualizar Ticket' : 'Crear Ticket')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
