'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'

interface Session { id: string; title: string | null; updatedAt: string }
interface Message { id: string; role: string; content: string; createdAt: string }

const PROMPTS = [
  'How am I doing on my plan this week?',
  'Is my blood pressure trending better?',
  'What\'s my 3-day weight average?',
  'How much sodium did I have today?',
  'Am I hitting my step goal?',
]

export default function ChatPage() {
  const [sessions,        setSessions]        = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages,        setMessages]        = useState<Message[]>([])
  const [input,           setInput]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [sending,         setSending]         = useState(false)
  const [drawerOpen,      setDrawerOpen]      = useState(false)
  /** Uploaded progress photo IDs (and preview URLs) pending send. */
  const [attachments, setAttachments] = useState<Array<{ id: string; previewUrl: string }>>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  /** Skip one GET /messages when we just created an empty session (avoids clobbering optimistic send). */
  const skipMessagesFetchOnce = useRef<string | null>(null)

  const activeTitle =
    sessions.find(s => s.id === activeSessionId)?.title ?? null

  useEffect(() => {
    api.getChatSessions()
      .then(setSessions)
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([])
      return
    }
    if (skipMessagesFetchOnce.current === activeSessionId) {
      skipMessagesFetchOnce.current = null
      setMessages([])
      setLoading(false)
      return
    }
    setLoading(true)
    api.getChatMessages(activeSessionId)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeSessionId])

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll after new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  useEffect(() => {
    if (!drawerOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  /** Returns the new session id (for callers that need to send immediately before re-render). */
  async function createSession(): Promise<string> {
    const session = await api.createChatSession()
    const newSession: Session = { id: session.id, title: null, updatedAt: new Date().toISOString() }
    setSessions(prev => [newSession, ...prev])
    skipMessagesFetchOnce.current = session.id
    setActiveSessionId(session.id)
    setDrawerOpen(false)
    return session.id
  }

  function selectSession(id: string) {
    setActiveSessionId(id)
    setDrawerOpen(false)
  }

  async function deleteSession(id: string) {
    if (!window.confirm('Delete this conversation?')) return
    try {
      await api.deleteChatSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (activeSessionId === id) {
        setActiveSessionId(null)
        setMessages([])
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function clearAllSessions() {
    if (!window.confirm('Delete all conversations? This cannot be undone.')) return
    try {
      await api.deleteAllChatSessions()
      setSessions([])
      setActiveSessionId(null)
      setMessages([])
      setDrawerOpen(false)
    } catch (e) {
      console.error(e)
    }
  }

  /**
   * @param sessionId - Use right after `createSession()` so the first message runs before state re-render.
   */
  async function send(text?: string, sessionId?: string) {
    const content = (text ?? input).trim()
    const photoIds = attachments.map(a => a.id)
    if ((!content && photoIds.length === 0) || sending) return
    const sid = sessionId ?? activeSessionId
    if (!sid) return

    setInput('')
    setAttachments([])
    setSending(true)

    const displayLine =
      [content, photoIds.length ? `[${photoIds.length} progress photo(s)]` : '']
        .filter(Boolean)
        .join(' · ') || '[Progress photos]'

    const tempUserId = crypto.randomUUID()
    const tempUser: Message = {
      id:        tempUserId,
      role:      'user',
      content:   displayLine,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempUser])

    try {
      const reply = await api.postAiReply(sid, {
        message:  content || undefined,
        photoIds: photoIds.length > 0 ? photoIds : undefined,
      })
      setMessages(prev => [...prev.filter(m => m.id !== tempUserId), tempUser, reply])

      const titleSeed = content || (photoIds.length ? 'Photo check-in' : '')
      if (titleSeed && !sessions.find(s => s.id === sid)?.title) {
        setSessions(prev => prev.map(s =>
          s.id === sid
            ? { ...s, title: titleSeed.slice(0, 40) + (titleSeed.length > 40 ? '…' : '') }
            : s
        ))
      }
    } catch {
      try {
        await api.sendMessage(
          sid,
          content || `[${photoIds.length} progress photo(s)]`
        )
        const placeholder: Message = {
          id:        crypto.randomUUID(),
          role:      'assistant',
          content:   '(AI reply endpoint not yet connected or returned an error — your message was saved.)',
          createdAt: new Date().toISOString(),
        }
        setMessages(prev => [...prev.filter(m => m.id !== tempUserId), placeholder])
      } catch {
        setMessages(prev => prev.filter(m => m.id !== tempUserId))
      }
    } finally {
      setSending(false)
    }
  }

  async function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    e.target.value = ''
    if (!files?.length) return
    setUploadingPhotos(true)
    try {
      for (const file of Array.from(files)) {
        const row = await api.uploadProgressPhoto(file)
        setAttachments(prev => [
          ...prev,
          { id: row.id, previewUrl: row.signedUrl ?? '' },
        ])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploadingPhotos(false)
    }
  }

  return (
    <div style={{
      position:   'relative',
      display:    'flex',
      flexDirection: 'column',
      minHeight:  'calc(100vh - 4rem)',
      width:      '100%',
      maxWidth:   '920px',
      margin:     '0 auto',
    }}>

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <div style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '0.5rem',
        marginBottom: '1rem',
        flexShrink:  0,
        flexWrap:    'wrap',
      }}>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-controls="chat-sessions-drawer"
          style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '0.35rem',
            fontSize:     14,
            padding:      '0.45rem 0.75rem',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }} aria-hidden>☰</span>
          Conversations
          {sessions.length > 0 && (
            <span style={{
              fontSize:       11,
              fontWeight:    600,
              background:     'var(--accent-light)',
              color:          'var(--accent-dark)',
              padding:        '0.1rem 0.45rem',
              borderRadius:   '999px',
              minWidth:       '1.25rem',
              textAlign:      'center',
            }}>
              {sessions.length}
            </span>
          )}
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={() => void createSession().catch(console.error)}
          style={{ fontSize: 14, padding: '0.45rem 1rem' }}
        >
          + New chat
        </button>

        {activeSessionId && (
          <div style={{
            flex:         1,
            minWidth:     0,
            fontSize:     14,
            color:        'var(--text-muted)',
            textAlign:    'right',
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
          }}>
            {activeTitle ?? 'New conversation'}
          </div>
        )}
      </div>

      {/* ── Drawer: session list ────────────────────────────────────── */}
      {drawerOpen && (
        <>
          <button
            type="button"
            aria-label="Close conversation list"
            onClick={() => setDrawerOpen(false)}
            style={{
              position:       'absolute',
              inset:          0,
              zIndex:         30,
              border:         'none',
              padding:        0,
              margin:         0,
              cursor:         'pointer',
              background:     'rgba(26, 46, 26, 0.25)',
            }}
          />
          <aside
            id="chat-sessions-drawer"
            style={{
              position:       'absolute',
              left:           0,
              top:            0,
              bottom:         0,
              width:          'min(100%, 340px)',
              zIndex:         40,
              background:     'var(--bg-card)',
              border:         '1px solid var(--border)',
              borderRadius:   'var(--radius-lg)',
              boxShadow:      '8px 0 32px rgba(0,0,0,0.12)',
              display:        'flex',
              flexDirection:  'column',
              padding:        '1rem',
              maxHeight:      'min(100%, calc(100vh - 6rem))',
            }}
          >
            <div style={{
              display:       'flex',
              alignItems:    'center',
              justifyContent:'space-between',
              marginBottom:  '0.75rem',
            }}>
              <span style={{
                fontFamily:    'var(--font-display)',
                fontSize:      '1.15rem',
                color:         'var(--text-primary)',
              }}>
                Your chats
              </span>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setDrawerOpen(false)}
                style={{ fontSize: 13, padding: '0.25rem 0.5rem' }}
              >
                Close
              </button>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => void createSession().catch(console.error)}
              style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
            >
              + New chat
            </button>

            <div style={{
              flex:           1,
              overflowY:      'auto',
              display:        'flex',
              flexDirection:  'column',
              gap:            '0.25rem',
              minHeight:      0,
            }}>
              {sessions.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                  No chats yet — start one above.
                </div>
              )}
              {sessions.map(s => (
                <div
                  key={s.id}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '2px',
                    borderRadius: 'var(--radius-md)',
                    background:   s.id === activeSessionId ? 'var(--accent-light)' : 'transparent',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => selectSession(s.id)}
                    style={{
                      flex:         1,
                      minWidth:     0,
                      textAlign:    'left',
                      padding:      '0.5rem 0.5rem 0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border:       'none',
                      cursor:       'pointer',
                      background:   'transparent',
                      color:        s.id === activeSessionId ? 'var(--accent-dark)' : 'var(--text-secondary)',
                      fontSize:     13,
                      fontFamily:   'var(--font-body)',
                      whiteSpace:   'nowrap',
                      overflow:     'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.title ?? 'New conversation'}
                  </button>
                  <button
                    type="button"
                    aria-label="Delete conversation"
                    title="Delete"
                    onClick={e => {
                      e.stopPropagation()
                      void deleteSession(s.id)
                    }}
                    style={{
                      flexShrink:   0,
                      width:        '28px',
                      height:       '28px',
                      padding:      0,
                      border:       'none',
                      borderRadius: '6px',
                      cursor:       'pointer',
                      background:   'transparent',
                      color:        'var(--text-muted)',
                      fontSize:     '16px',
                      lineHeight:   1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {sessions.length > 0 && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => void clearAllSessions()}
                style={{ fontSize: 12, justifyContent: 'center', marginTop: '0.75rem' }}
              >
                Clear all chats
              </button>
            )}
          </aside>
        </>
      )}

      {/* ── Main chat column ─────────────────────────────────────────── */}
      <div style={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        minHeight:      0,
        minWidth:       0,
      }}>

        {!activeSessionId && (
          <div style={{
            flex:           1,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '2rem',
            padding:        '1rem 0',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.35rem, 4vw, 1.85rem)', marginBottom: '0.5rem' }}>
                Ask your health coach
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Start a conversation to get insights about your health data
              </div>
            </div>
            <div style={{
              display:        'flex',
              flexWrap:       'wrap',
              gap:            '0.5rem',
              justifyContent: 'center',
              maxWidth:       560,
            }}>
              {PROMPTS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={async () => {
                    try {
                      const id = await createSession()
                      await send(p, id)
                    } catch (e) {
                      console.error(e)
                    }
                  }}
                  className="btn-ghost"
                  style={{ fontSize: 13 }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeSessionId && (
          <>
            <div style={{
              flex:           1,
              overflowY:      'auto',
              padding:        '0.5rem 0',
              display:        'flex',
              flexDirection:  'column',
              gap:            '1rem',
            }}>
              {loading && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
              )}

              {!loading && messages.length === 0 && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Send a message to get started
                </div>
              )}

              {messages.map(m => (
                <div
                  key={m.id}
                  style={{
                    display:        'flex',
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth:     'min(720px, 92%)',
                    padding:      '0.75rem 1rem',
                    borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background:   m.role === 'user' ? 'var(--accent)' : 'var(--bg-subtle)',
                    color:        m.role === 'user' ? '#fff' : 'var(--text-primary)',
                    fontSize:     14,
                    lineHeight:   1.6,
                    border:       m.role === 'user' ? 'none' : '1px solid var(--border)',
                  }}>
                    {m.content}
                  </div>
                </div>
              ))}

              {sending && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding:      '0.75rem 1rem',
                    borderRadius: '16px 16px 16px 4px',
                    background:   'var(--bg-subtle)',
                    border:       '1px solid var(--border)',
                    color:        'var(--text-muted)',
                    fontSize:     14,
                  }}>
                    Thinking…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div style={{
              flexShrink: 0,
              borderTop:  '1px solid var(--border)',
              paddingTop: '1rem',
            }}>
              {attachments.length > 0 && (
                <div style={{
                  display:   'flex',
                  flexWrap:  'wrap',
                  gap:       '0.5rem',
                  marginBottom: '0.5rem',
                }}>
                  {attachments.map(a => (
                    <div
                      key={a.id}
                      style={{
                        position: 'relative',
                        width:    56,
                        height:   56,
                      }}
                    >
                      {a.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.previewUrl}
                          alt=""
                          style={{
                            width:        56,
                            height:       56,
                            objectFit:    'cover',
                            borderRadius: 8,
                            border:       '1px solid var(--border)',
                          }}
                        />
                      ) : (
                        <div style={{
                          width:         56,
                          height:        56,
                          borderRadius:  8,
                          background:    'var(--bg-subtle)',
                          fontSize:      11,
                          display:       'flex',
                          alignItems:    'center',
                          justifyContent:'center',
                          color:         'var(--text-muted)',
                        }}
                        >
                          OK
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label="Remove attachment"
                        onClick={() =>
                          setAttachments(prev => prev.filter(x => x.id !== a.id))
                        }
                        style={{
                          position:     'absolute',
                          top:            -6,
                          right:          -6,
                          width:          22,
                          height:         22,
                          borderRadius:   '50%',
                          border:         'none',
                          background:     'var(--bg-card)',
                          boxShadow:      '0 1px 4px rgba(0,0,0,0.15)',
                          cursor:         'pointer',
                          fontSize:       14,
                          lineHeight:     1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label
                  title="Attach progress photos"
                  style={{
                    display:       'inline-flex',
                    alignItems:    'center',
                    justifyContent:'center',
                    width:         40,
                    height:        40,
                    borderRadius:  'var(--radius-md)',
                    border:        '1px solid var(--border)',
                    cursor:        uploadingPhotos || sending ? 'wait' : 'pointer',
                    flexShrink:    0,
                    fontSize:      18,
                  }}
                >
                  {uploadingPhotos ? '…' : '📷'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={sending || uploadingPhotos}
                    onChange={e => void onPickPhotos(e)}
                    style={{ display: 'none' }}
                  />
                </label>
                <input
                  className="input"
                  placeholder="Message or caption (optional with photos)…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      void send()
                    }
                  }}
                  disabled={sending}
                  style={{ flex: 1, minWidth: 0 }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => void send()}
                  disabled={
                    sending ||
                    (!input.trim() && attachments.length === 0)
                  }
                  style={{
                    flexShrink: 0,
                    opacity:
                      sending || (!input.trim() && attachments.length === 0)
                        ? 0.6
                        : 1,
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
