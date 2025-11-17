import { getSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    // Get all active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('is_active', true)

    if (alertsError) throw alertsError

    // Check each alert against current data
    for (const alert of alerts || []) {
      const { data: caseData } = await supabase
        .from('dengue_cases')
        .select('*')
        .eq('state', alert.state)
        .eq('city', alert.city || '')
        .order('date', { ascending: false })
        .limit(1)
        .single()

      if (caseData && caseData.cases >= alert.threshold) {
        // Alert should be triggered
        const { error: triggerError } = await supabase
          .from('user_alerts')
          .update({ last_triggered: new Date().toISOString() })
          .eq('id', alert.id)

        if (triggerError) throw triggerError

        // Log to alert history
        await supabase
          .from('alert_history')
          .insert({
            alert_id: alert.id,
            cases_count: caseData.cases,
          })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Alertas verificados',
    })
  } catch (error) {
    console.error('Error checking alerts:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar alertas' },
      { status: 500 }
    )
  }
}
