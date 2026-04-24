import { useState, useRef, useEffect } from 'react'
import { api } from '../api/client'
import { Send, Bot, User, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am your TspoonBase AI assistant. I can help you generate collections, write access rules, create seed data, and answer questions about your database.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const data = await api.post('/api/ai/chat', { message: userMessage })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'No response' }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  function quickAction(text: string) {
    setInput(text)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <h2 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sparkles size={20} /> AI Assistant
      </h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['Generate a blog collection', 'Write owner-only update rule', 'Seed 10 test users'].map(text => (
          <button key={text} className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => quickAction(text)}>
            {text}
          </button>
        ))}
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        padding: 20,
        marginBottom: 12,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: 12,
            marginBottom: 16,
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: msg.role === 'user' ? '#0066cc' : '#e8f5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="#2e7d32" />}
            </div>
            <div style={{
              maxWidth: '70%',
              padding: 12,
              borderRadius: 12,
              background: msg.role === 'user' ? '#0066cc' : '#f5f5f5',
              color: msg.role === 'user' ? 'white' : '#333',
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666', fontSize: 14 }}>
            <div className="spinner" /> Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask me anything..."
          style={{ flex: 1, padding: '12px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14 }}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
