import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const ticketId = parseInt(params.id)

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'ID de ticket inválido' },
        { status: 400 }
      )
    }

    // Convert date strings to Date objects if they exist
    const updateData: any = { ...body }
    
    if (updateData.fecha_entrada) {
      updateData.fecha_entrada = new Date(updateData.fecha_entrada)
    }
    if (updateData.fecha_inicio_servicio) {
      updateData.fecha_inicio_servicio = new Date(updateData.fecha_inicio_servicio)
    }
    if (updateData.fecha_fin_servicio) {
      updateData.fecha_fin_servicio = new Date(updateData.fecha_fin_servicio)
    }
    
    // Convert numeric fields
    if (updateData.costo_repuestos !== undefined) {
      updateData.costo_repuestos = parseFloat(updateData.costo_repuestos) || 0
    }
    if (updateData.costo_mano_obra !== undefined) {
      updateData.costo_mano_obra = parseFloat(updateData.costo_mano_obra) || 0
    }
    if (updateData.costos_externos_estimados !== undefined) {
      updateData.costos_externos_estimados = parseFloat(updateData.costos_externos_estimados) || 0
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData
    })

    return NextResponse.json({ data: ticket })
  } catch (error: any) {
    console.error('Error al actualizar ticket:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'El número de ticket ya existe' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al actualizar el ticket' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = parseInt(params.id)

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'ID de ticket inválido' },
        { status: 400 }
      )
    }

    await prisma.ticket.delete({
      where: { id: ticketId }
    })

    return NextResponse.json({ 
      data: 'Ticket eliminado exitosamente' 
    })
  } catch (error: any) {
    console.error('Error al eliminar ticket:', error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al eliminar el ticket' },
      { status: 500 }
    )
  }
}
