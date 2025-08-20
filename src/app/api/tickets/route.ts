import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { created_at: 'desc' }
    })
    return NextResponse.json({ data: tickets })
  } catch (error) {
    console.error('Error al obtener tickets:', error)
    return NextResponse.json(
      { error: 'Error al obtener tickets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'numero_ticket',
      'equipo',
      'fecha_entrada',
      'fecha_inicio_servicio',
      'descripcion'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Campo requerido: ${field}` },
          { status: 400 }
        )
      }
    }

    // Convert date strings to Date objects
    const ticketData = {
      ...body,
      fecha_entrada: new Date(body.fecha_entrada),
      fecha_inicio_servicio: new Date(body.fecha_inicio_servicio),
      fecha_fin_servicio: body.fecha_fin_servicio ? new Date(body.fecha_fin_servicio) : null,
      costo_repuestos: body.costo_repuestos ? parseFloat(body.costo_repuestos) : 0,
      costo_mano_obra: body.costo_mano_obra ? parseFloat(body.costo_mano_obra) : 0,
      costos_externos_estimados: body.costos_externos_estimados ? parseFloat(body.costos_externos_estimados) : 0,
    }

    const ticket = await prisma.ticket.create({
      data: ticketData
    })

    return NextResponse.json({ data: ticket }, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear ticket:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El número de ticket ya existe' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al crear ticket' },
      { status: 500 }
    )
  }
}
