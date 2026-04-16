import { supabase } from '../db/supabase'
import type { IngestPayload, ReportDetail } from '../types'

interface ReportRow {
  id: string
  workspace_id: string
  report_type: string
  window_start: string
  window_end: string
  generated_at: string
  summary: { health: string; headline: string }
  risks: IngestPayload['risks']
  insights: IngestPayload['insights']
  sprint_data: IngestPayload['sprintData'] | null
  slug: string | null
  last_synced_at: string
  run_count: number
}

export class ReportService {
  async upsert(
    payload: IngestPayload,
    workspaceId: string
  ): Promise<{ reportId: string; url: string }> {
    const now = new Date().toISOString()

    // Attempt to update an existing record matching the composite key.
    // This lets the DB atomically increment run_count rather than
    // overwriting it with a client-computed value.
    const { data: updated, error: updateError } = await supabase
      .from('reports')
      .update({
        generated_at: payload.generatedAt,
        summary: payload.summary,
        risks: payload.risks,
        insights: payload.insights,
        sprint_data: payload.sprintData ?? null,
        last_synced_at: now,
      })
      .eq('workspace_id', workspaceId)
      .eq('report_type', payload.reportType)
      .eq('window_start', payload.windowStart)
      .eq('window_end', payload.windowEnd)
      .select('id, run_count')
      .single()

    // If a row already existed, increment run_count with a second update.
    if (!updateError && updated) {
      const { error: incError } = await supabase
        .from('reports')
        .update({ run_count: (updated.run_count as number) + 1 })
        .eq('id', updated.id)

      if (incError) {
        throw new Error(`Failed to increment run_count: ${incError.message}`)
      }

      const reportId = updated.id as string
      const url = `${process.env.APP_BASE_URL ?? ''}/report/${reportId}`
      return { reportId, url }
    }

    // No existing row — insert fresh.
    const { data: inserted, error: insertError } = await supabase
      .from('reports')
      .insert({
        workspace_id: workspaceId,
        report_type: payload.reportType,
        window_start: payload.windowStart,
        window_end: payload.windowEnd,
        generated_at: payload.generatedAt,
        summary: payload.summary,
        risks: payload.risks,
        insights: payload.insights,
        sprint_data: payload.sprintData ?? null,
        last_synced_at: now,
        run_count: 1,
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      throw new Error(`Failed to insert report: ${insertError?.message ?? 'unknown error'}`)
    }

    const reportId = inserted.id as string
    const url = `${process.env.APP_BASE_URL ?? ''}/report/${reportId}`
    return { reportId, url }
  }

  async findById(id: string): Promise<ReportDetail | null> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    const row = data as ReportRow
    const baseUrl = process.env.APP_BASE_URL ?? ''

    const report: ReportDetail = {
      id: row.id,
      workspaceId: row.workspace_id,
      reportType: row.report_type,
      windowStart: row.window_start,
      windowEnd: row.window_end,
      generatedAt: row.generated_at,
      summary: row.summary as ReportDetail['summary'],
      risks: row.risks,
      insights: row.insights,
      sprintData: row.sprint_data ?? undefined,
      slug: row.slug ?? undefined,
      url: `${baseUrl}/report/${row.id}`,
      lastSyncedAt: row.last_synced_at,
      runCount: row.run_count,
    }

    return report
  }
}
