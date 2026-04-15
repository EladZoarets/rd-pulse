export type ActiveFilter =
  | { type: 'severity'; value: 'high' | 'medium' | 'low' }
  | { type: 'source'; value: 'jira' | 'github' | 'team' }
  | null
