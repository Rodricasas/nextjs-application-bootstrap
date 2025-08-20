'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

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

interface DashboardProps {
  refreshTrigger: number
}

export default function Dashboard({ refreshTrigger }: DashboardProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
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
        setError(result.error || 'Error al cargar los datos')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Calculate tickets over time (by month)
  const getTicketsOverTime = () => {
    const monthlyData: { [key: string]: number } = {}
    
    tickets.forEach(ticket => {
      const date = new Date(ticket.fecha_entrada)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1
    })

    return Object.entries(monthlyData)
      .map(([month, count]) => ({
        mes: month,
        tickets: count
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes))
  }

  // Calculate cost breakdown
  const getCostBreakdown = () => {
    const totalRepuestos = tickets.reduce((sum, ticket) => sum + (ticket.costo_repuestos || 0), 0)
    const totalManoObra = tickets.reduce((sum, ticket) => sum + (ticket.costo_mano_obra || 0), 0)
    const totalExternos = tickets.reduce((sum, ticket) => sum + (ticket.costos_externos_estimados || 0), 0)

    return [
      { name: 'Repuestos', value: totalRepuestos, color: '#8884d8' },
      { name: 'Mano de Obra', value: totalManoObra, color: '#82ca9d' },
      { name: 'Costos Externos', value: totalExternos, color: '#ffc658' }
    ].filter(item => item.value > 0)
  }

  // Calculate service durations
  const getServiceDurations = () => {
    const completedTickets = tickets.filter(ticket => ticket.fecha_fin_servicio)
    
    const durationData = completedTickets.map(ticket => {
      const startDate = new Date(ticket.fecha_inicio_servicio)
      const endDate = new Date(ticket.fecha_fin_servicio!)
      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        ticket: ticket.numero_ticket,
        duracion: Math.max(durationDays, 0) // Ensure non-negative duration
      }
    })

    return durationData.slice(0, 10) // Show last 10 completed tickets
  }

  // Calculate summary statistics
  const getSummaryStats = () => {
    const totalTickets = tickets.length
    const completedTickets = tickets.filter(ticket => ticket.fecha_fin_servicio).length
    const pendingTickets = totalTickets - completedTickets
    const totalCosts = tickets.reduce((sum, ticket) => 
      sum + (ticket.costo_repuestos || 0) + (ticket.costo_mano_obra || 0) + (ticket.costos_externos_estimados || 0), 0
    )

    return {
      totalTickets,
      completedTickets,
      pendingTickets,
      totalCosts
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">{error}</AlertDescription>
      </Alert>
    )
  }

  const summaryStats = getSummaryStats()
  const ticketsOverTime = getTicketsOverTime()
  const costBreakdown = getCostBreakdown()
  const serviceDurations = getServiceDurations()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Tickets</h2>
        <div className="text-sm text-gray-500">
          Última actualización: {new Date().toLocaleString('es-ES')}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-green-600">{summaryStats.completedTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{summaryStats.pendingTickets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Costos Totales</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${summaryStats.totalCosts.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ticketsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="tickets" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Número de Tickets"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Costos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Durations */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Duración de Servicios (Últimos 10 Completados)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceDurations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ticket" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value} días`, 'Duración']} />
                <Legend />
                <Bar dataKey="duracion" fill="#82ca9d" name="Días de Servicio" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Número</th>
                  <th className="text-left p-2">Equipo</th>
                  <th className="text-left p-2">Fecha Entrada</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-left p-2">Costo Total</th>
                </tr>
              </thead>
              <tbody>
                {tickets.slice(0, 5).map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{ticket.numero_ticket}</td>
                    <td className="p-2">{ticket.equipo}</td>
                    <td className="p-2">
                      {new Date(ticket.fecha_entrada).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        ticket.fecha_fin_servicio 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ticket.fecha_fin_servicio ? 'Completado' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="p-2">
                      ${((ticket.costo_repuestos || 0) + (ticket.costo_mano_obra || 0) + (ticket.costos_externos_estimados || 0))
                        .toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
