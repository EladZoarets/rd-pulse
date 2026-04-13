CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  report_type TEXT NOT NULL DEFAULT 'sprint',
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  summary JSONB NOT NULL,
  risks JSONB NOT NULL DEFAULT '[]',
  insights JSONB NOT NULL DEFAULT '[]',
  slug TEXT,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  run_count INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT reports_composite_key UNIQUE (workspace_id, report_type, window_start, window_end)
);
