import DocSection from '../../components/DocSection'
import CodeBlock from '../../components/CodeBlock'
import { Info } from 'lucide-react'

export default function TorquePage() {
  return (
    <article>
      <h1 className="mb-8 font-heading text-4xl font-bold text-theme">Torque</h1>

      <DocSection id="overview" title="Overview">
        <p className="mb-4 text-theme-secondary">
          Torque is a visual canvas for building AI agent workflows. Drag nodes, connect them,
          and export the pipeline directly into your TspoonBase backend — where it becomes a
          runnable service with API endpoints, execution history, and full observability.
        </p>

        <div className="mb-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-sm text-theme-secondary">
            <strong className="text-theme">Separation of concerns:</strong> Torque handles
            the visual editor and exports pipeline JSON. TspoonBase handles storage,
            execution, auth, scheduling, and observability. They communicate through
            the <code className="rounded bg-theme-muted px-1 py-0.5 text-xs">WorkflowDefinition</code> schema.
          </div>
        </div>

        <h3 className="mb-3 mt-6 font-heading text-lg font-bold text-theme">Quick Start</h3>

        <div className="overflow-hidden rounded-xl border border-theme bg-theme-surface">
          <div className="flex items-center justify-between border-b border-theme px-4 py-2">
            <span className="text-xs font-medium text-theme-tertiary">TERMINAL</span>
          </div>
          <CodeBlock
            code={`cd torque
npm install
npm run dev  # → http://localhost:3000`}
            lang="bash"
            filename="terminal"
          />
        </div>

        <p className="mt-4 text-theme-secondary">
          Set <code className="rounded bg-theme-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_TSPOONBASE_URL</code> in <code className="rounded bg-theme-muted px-1 py-0.5 text-xs">.env</code> to point to your running TspoonBase instance.
        </p>
      </DocSection>

      <DocSection id="node-types" title="Node Types">
        <p className="mb-4 text-theme-secondary">
          Torque ships with 11 built-in node types across 6 categories. Each node has a
          config schema that the canvas renders as a form panel.
        </p>

        <div className="overflow-hidden rounded-xl border border-theme">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-theme bg-theme-surface">
                <th className="px-4 py-2.5 font-heading font-semibold text-theme-tertiary">Category</th>
                <th className="px-4 py-2.5 font-heading font-semibold text-theme-tertiary">Node</th>
                <th className="px-4 py-2.5 font-heading font-semibold text-theme-tertiary">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Trigger', 'Webhook', 'Start workflow via HTTP request'],
                ['Trigger', 'Schedule', 'Start workflow on a cron schedule'],
                ['Trigger', 'Event', 'Start workflow on a TspoonBase record event'],
                ['AI', 'LLM Call', 'Call OpenAI or Anthropic with system prompt + user message'],
                ['Data', 'Create Record', 'Create a record in a TspoonBase collection'],
                ['Data', 'Query Records', 'Query records from a TspoonBase collection'],
                ['Action', 'HTTP Request', 'Make an HTTP request to any URL'],
                ['Action', 'Execute Code', 'Run a JavaScript snippet'],
                ['Action', 'Delay', 'Wait for a specified duration'],
                ['Logic', 'Condition', 'Route execution based on a JavaScript expression'],
                ['Output', 'Output', 'Return data as workflow result'],
              ].map(([cat, name, desc], i) => (
                <tr key={i} className="border-b border-theme last:border-0">
                  <td className="px-4 py-2 text-xs font-medium text-theme-tertiary">{cat}</td>
                  <td className="px-4 py-2 font-medium text-theme">{name}</td>
                  <td className="px-4 py-2 text-xs text-theme-secondary">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection id="exporting" title="Exporting Workflows">
        <p className="mb-4 text-theme-secondary">
          Click the <strong className="text-theme">Export</strong> button in the Torque top bar
          to register the workflow with your TspoonBase instance. If TspoonBase is not reachable,
          the workflow is downloaded as a JSON file instead.
        </p>

        <p className="mb-4 text-theme-secondary">
          The exported JSON follows the <code className="rounded bg-theme-muted px-1 py-0.5 text-xs">WorkflowDefinition</code> schema:
        </p>

        <div className="overflow-hidden rounded-xl border border-theme bg-theme-surface">
          <div className="flex items-center justify-between border-b border-theme px-4 py-2">
            <span className="text-xs font-medium text-theme-tertiary">JSON</span>
          </div>
          <CodeBlock
            code={`{
  "workflowId": "my-agent",
  "name": "My Agent",
  "nodes": [
    { "id": "1", "type": "trigger_webhook", "config": {} },
    { "id": "2", "type": "llm", "config": { "provider": "openai", "systemPrompt": "You are..." } }
  ],
  "edges": [
    { "id": "e1", "from": "1", "to": "2" }
  ]
}`}
            lang="json"
            filename="workflow.json"
          />
        </div>
      </DocSection>

      <DocSection id="api-endpoints" title="API Endpoints">
        <p className="mb-4 text-theme-secondary">
          Once registered, workflows are available through the TspoonBase agent API:
        </p>

        <div className="overflow-hidden rounded-xl border border-theme">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-theme bg-theme-surface">
                <th className="px-4 py-2.5 font-heading font-semibold text-theme-tertiary">Method</th>
                <th className="px-4 py-2.5 font-heading font-semibold text-theme-tertiary">Endpoint</th>
                <th className="px-4 py-2.5 font-heading font-semibold text-theme-tertiary">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['GET', '/api/agents/nodes', 'List all node types'],
                ['POST', '/api/agents/workflows/register', 'Register a workflow'],
                ['GET', '/api/agents/workflows', 'List registered workflows'],
                ['GET', '/api/agents/workflows/:id', 'Get workflow definition'],
                ['POST', '/api/agents/workflows/:id/execute', 'Execute a workflow'],
                ['GET', '/api/agents/workflows/:id/execute/stream', 'SSE-streamed execution'],
                ['GET', '/api/agents/workflows/:id/executions', 'Execution history'],
                ['DELETE', '/api/agents/workflows/:id', 'Delete a workflow'],
              ].map(([method, path, desc], i) => (
                <tr key={i} className="border-b border-theme last:border-0">
                  <td className="px-4 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      method === 'GET' ? 'bg-green-500/10 text-green-400' :
                      method === 'POST' ? 'bg-blue-500/10 text-blue-400' :
                      method === 'DELETE' ? 'bg-red-500/10 text-red-400' : ''
                    }`}>{method}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-theme">{path}</td>
                  <td className="px-4 py-2 text-xs text-theme-secondary">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>
    </article>
  )
}
