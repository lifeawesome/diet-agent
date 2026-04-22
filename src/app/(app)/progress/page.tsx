'use client'

import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { api, type ProgressPhotoRow } from '@/lib/api'

const POSES = ['front', 'side', 'unknown'] as const

function groupByPose(rows: ProgressPhotoRow[]) {
  const out: Record<string, ProgressPhotoRow[]> = {}
  for (const p of POSES) out[p] = []
  for (const r of rows) {
    const k = POSES.includes(r.pose as (typeof POSES)[number]) ? r.pose : 'unknown'
    if (!out[k]) out[k] = []
    out[k].push(r)
  }
  return out
}

export default function ProgressPage() {
  const [rows, setRows]       = useState<ProgressPhotoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(() => {
    setError(null)
    return api
      .getProgressPhotos({ limit: 80 })
      .then(setRows)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load photos'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await api.uploadProgressPhoto(file)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function setPose(id: string, pose: 'front' | 'side') {
    try {
      await api.patchProgressPhotoPose(id, pose)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this photo?')) return
    try {
      await api.deleteProgressPhoto(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const grouped = groupByPose(rows)

  return (
    <div style={{ maxWidth: 960 }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Body progress</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: '1.5rem' }}>
        Front and side photos are catalogued by date. Upload here or attach in chat (coach can reference your history).
      </p>

      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
        <label className="btn-primary" style={{ cursor: uploading ? 'wait' : 'pointer', margin: 0 }}>
          {uploading ? 'Uploading…' : 'Upload photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={onFile}
            style={{ display: 'none' }}
          />
        </label>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          JPEG, PNG, or WebP · stored securely
        </span>
      </div>

      {error && (
        <div className="card" style={{ color: 'var(--down)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      )}

      {!loading && rows.length === 0 && !error && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          No photos yet. Upload one to start a visual timeline.
        </p>
      )}

      {!loading &&
        POSES.map(pose => {
          const list = grouped[pose] ?? []
          if (list.length === 0) return null
          return (
            <section key={pose} style={{ marginBottom: '2rem' }}>
              <div className="label" style={{ marginBottom: '0.75rem' }}>
                {pose === 'unknown' ? 'Pose unknown' : `${pose.charAt(0).toUpperCase() + pose.slice(1)} view`}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
              }}>
                {list.map(photo => (
                  <div
                    key={photo.id}
                    className="card"
                    style={{ padding: '0.75rem' }}
                  >
                    {photo.signedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.signedUrl}
                        alt=""
                        style={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-subtle)',
                        }}
                      />
                    ) : (
                      <div style={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                      }}>
                        Preview unavailable
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                      {format(new Date(photo.capturedAt), 'MMM d, yyyy h:mm a')}
                    </div>
                    {photo.poseConfidence != null && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Confidence {Math.round(photo.poseConfidence * 100)}%
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 8 }}>
                      <select
                        className="input"
                        style={{ fontSize: 12, padding: '0.25rem 0.35rem', flex: '1 1 100px' }}
                        value={photo.pose === 'front' || photo.pose === 'side' ? photo.pose : ''}
                        onChange={e => {
                          const v = e.target.value
                          if (v === 'front' || v === 'side') void setPose(photo.id, v)
                        }}
                      >
                        <option value="" disabled>Set pose…</option>
                        <option value="front">Front</option>
                        <option value="side">Side</option>
                      </select>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: '0.25rem 0.5rem' }}
                        onClick={() => void remove(photo.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
    </div>
  )
}
