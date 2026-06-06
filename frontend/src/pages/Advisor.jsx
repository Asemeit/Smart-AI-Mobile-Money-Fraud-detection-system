import { useState, useRef, useEffect } from 'react';
import { apiPost } from '../api/client';
import { ChatIcon } from '../components/Icons';
import './Advisor.css';

const STARTER_PROMPTS = [
  'How can I save more as a trader?',
  'Help me budget my daily sales',
  'How do I spot a fake M-Pesa message?',
];

export default function Advisor() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! I can help with saving, budgeting, and keeping your mobile money transactions safe. What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = (text ?? input).trim();
    if (!userText) return;

    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const data = await apiPost('/api/advisor/chat', { message: userText });
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'I could not reach the advisor service. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage();
  }

  return (
    <div className="advisor">
      <header className="page-header">
        <h1 className="page-title">Financial advisor</h1>
        <p className="page-subtitle">
          Get practical tips on saving, budgeting, and avoiding risky transactions.
        </p>
      </header>

      <div className="advisor-layout">
        <aside className="advisor-sidebar card">
          <div className="advisor-sidebar-head">
            <div className="advisor-avatar">
              <ChatIcon size={22} />
            </div>
            <div>
              <strong>Money Coach</strong>
              <span className="muted">Always available</span>
            </div>
          </div>
          <p className="advisor-intro">
            Ask about daily budgeting, building savings, or protecting yourself from payment scams.
          </p>
          <div className="prompt-list">
            <span className="prompt-label">Suggested questions</span>
            {STARTER_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" className="prompt-chip" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </aside>

        <div className="card chat-panel">
          <div className="chat-window">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="message-avatar">
                    <ChatIcon size={16} />
                  </div>
                )}
                <div className="message-bubble">{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-avatar">
                  <ChatIcon size={16} />
                </div>
                <div className="message-bubble typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form className="chat-input-row" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
