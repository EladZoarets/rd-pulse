import jwt from 'jsonwebtoken'
import { supabase } from '../db/supabase'
import type { WorkspaceCreateResponse, ReportListResponse, ReportListItem } from '../types'

export interface WorkspaceRow {
  id: string
  name: string
  status: string
  license_jwt: string
  created_at: string
  last_heartbeat_at: string | null
}

interface ReportRow {
  id: string
  generated_at: string
  summary: { health: string; headline: string }
  slug: string | null
}

export class WorkspaceService {
  async create(name: string): Promise<WorkspaceCreateResponse> {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, status: 'pending_connection', license_jwt: '' })
      .select('id, name, status')
      .single()

    if (error || !data) {
      throw new Error(`Failed to create workspace: ${error?.message ?? 'unknown error'}`)
    }

    const licenseJwt = jwt.sign(
      { workspaceId: data.id },
      process.env.JWT_SECRET!
    )

    // Update with the actual JWT
    await supabase
      .from('workspaces')
      .update({ license_jwt: licenseJwt })
      .eq('id', data.id)

    return {
      workspaceId: data.id as string,
      name: data.name as string,
      status: 'pending_connection',
      licenseJwt,
    }
  }

  async findById(id: string): Promise<WorkspaceRow | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return data as WorkspaceRow
  }

  async activate(id: string): Promise<void> {
    const { error } = await supabase
      .from('workspaces')
      .update({ status: 'active', last_heartbeat_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to activate workspace: ${error.message}`)
    }
  }

  async getReports(workspaceId: string, cursor?: string): Promise<ReportListResponse> {
    const pageSize = 20

    let query = supabase
      .from('reports')
      .select('id, generated_at, summary, slug')
      .eq('workspace_id', workspaceId)
      .order('generated_at', { ascending: false })
      .limit(pageSize + 1)

    if (cursor) {
      // cursor is the generated_at of the last item from the previous page
      query = query.lt('generated_at', cursor)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`)
    }

    const rows = (data ?? []) as ReportRow[]
    const hasMore = rows.length > pageSize
    const pageRows = hasMore ? rows.slice(0, pageSize) : rows
    const baseUrl = process.env.APP_BASE_URL ?? ''

    const reports: ReportListItem[] = pageRows.map((row) => ({
      id: row.id,
      generatedAt: row.generated_at,
      health: row.summary.health as ReportListItem['health'],
      headline: row.summary.headline,
      url: `${baseUrl}/report/${row.id}`,
      slug: row.slug ?? undefined,
    }))

    return {
      reports,
      nextCursor: hasMore ? pageRows[pageRows.length - 1].generated_at : null,
    }
  }
}
