const API_BASE = process.env.NEXT_PUBLIC_TSPOONBASE_URL || 'http://localhost:8090'

export async function fetchNodeTypes(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/agents/nodes`)
  const json = await res.json()
  return json.data || []
}

export async function exportWorkflow(definition: any): Promise<any> {
  const res = await fetch(`${API_BASE}/api/agents/workflows/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(definition),
  })
  return res.json()
}

export async function executeWorkflow(workflowId: string, input?: any): Promise<any> {
  const res = await fetch(`${API_BASE}/api/agents/workflows/${workflowId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  })
  return res.json()
}

export function getExportJson(definition: any): string {
  return JSON.stringify(definition, null, 2)
}
