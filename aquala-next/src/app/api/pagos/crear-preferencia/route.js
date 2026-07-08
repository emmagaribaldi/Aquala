import { NextResponse } from 'next/server'
import { client, Preference } from '@/lib/mercadopago'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  const { orden_id } = await request.json()

  const { data: orden, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orden_id)
    .single()

  if (error || !orden) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
  }

  if (orden.estado !== 'pendiente') {
    return NextResponse.json({ error: 'La orden ya fue procesada' }, { status: 400 })
  }

  const items = orden.order_items.map((item) => ({
    id: String(item.product_id),
    title: item.nombre,
    quantity: item.cantidad,
    unit_price: item.precio,
    currency_id: 'ARS',
  }))

  const preference = new Preference(client)

  const result = await preference.create({
    body: {
      items,
      payer: {
        name: orden.nombre,
        email: orden.email,
      },
      back_urls: {
        success: 'https://aquala-jade.vercel.app/pago-completado',
        failure: 'https://aquala-jade.vercel.app/pago-fallido',
        pending: 'https://aquala-jade.vercel.app/pago-pendiente',
      },
      auto_return: 'approved',
      external_reference: `orden_${orden.id}`,
      metadata: {
        orden_id: orden.id,
      },
      notification_url: 'https://aquala-jade.vercel.app/api/pagos/webhook',
    }
  })

  return NextResponse.json({ init_point: result.init_point })
}