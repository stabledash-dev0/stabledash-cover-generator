import { useState } from 'react'

interface EventData {
  eventName: string
  startDate: string
  endDate: string
  city: string
  country: string
  region: string
  description: string
  coverImageUrl: string
  organizingCompany: string
  organizers: string[]
  sponsors: string[]
  iconUrl: string
  logoUrl: string
  socialLinks: { [key: string]: string }
  officialUrl: string
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showJson, setShowJson] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setEventData(null)

    try {
      const response = await fetch('/api/extract-event-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer stabledash_cover_gen_2025_secure_xyz789'
        },
        body: JSON.stringify({ url: url.trim() })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      setEventData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            Event Data Extractor
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
            Extract structured event information from any event website URL
          </p>
        </div>

        {/* URL Input Form */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', padding: '1.5rem', marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter event website URL (e.g., https://example.com/event)"
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                outline: 'none'
              }}
              required
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Extracting...' : 'Extract Data'}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex' }}>
              <div style={{ flexShrink: 0 }}>
                <svg style={{ height: '1.25rem', width: '1.25rem', color: '#f87171' }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div style={{ marginLeft: '0.75rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #2563eb',
                borderRadius: '50%',
                width: '2rem',
                height: '2rem'
              }} className="spin"></div>
              <span style={{ marginLeft: '0.75rem', color: '#6b7280' }}>Extracting event data...</span>
            </div>
          </div>
        )}

        {/* Results Display */}
        {eventData && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>Event Information</h2>
                <div style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>
                  ✅ Extracted
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  {eventData.socialLinks && Object.keys(eventData.socialLinks).length > 0 && (
                    <span>📱 {Object.keys(eventData.socialLinks).length} social</span>
                  )}
                  {eventData.sponsors && eventData.sponsors.length > 0 && (
                    <span>🏢 {eventData.sponsors.length} sponsors</span>
                  )}
                  {eventData.organizers && eventData.organizers.length > 0 && (
                    <span>👥 {eventData.organizers.length} organizers</span>
                  )}
                </div>
                <button
                  onClick={() => setShowJson(!showJson)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: showJson ? '#dbeafe' : '#f3f4f6',
                    color: showJson ? '#1e40af' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {showJson ? '📊 Hide JSON' : '📊 Show JSON'}
                </button>
              </div>
            </div>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              <style>{`
                @media (min-width: 768px) {
                  .responsive-grid { grid-template-columns: 1fr 1fr !important; }
                }
              `}</style>
              {/* Basic Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Event Name</label>
                  <p style={{ marginTop: '0.25rem', fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>{eventData.eventName || 'Not found'}</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Date</label>
                  <p style={{ marginTop: '0.25rem', color: '#111827' }}>
                    {eventData.startDate && eventData.endDate
                      ? `${eventData.startDate} to ${eventData.endDate}`
                      : eventData.startDate || 'Not specified'}
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Location</label>
                  <p style={{ marginTop: '0.25rem', color: '#111827' }}>
                    {[eventData.city, eventData.country].filter(Boolean).join(', ') || 'Not specified'}
                    {eventData.region && <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>({eventData.region})</span>}
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Organizing Company</label>
                  <p style={{ marginTop: '0.25rem', color: '#111827' }}>{eventData.organizingCompany || 'Not found'}</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Official URL</label>
                  <a
                    href={eventData.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginTop: '0.25rem', color: '#2563eb', textDecoration: 'none', wordBreak: 'break-all' }}
                  >
                    {eventData.officialUrl || 'Not found'}
                  </a>
                </div>
              </div>

              {/* Additional Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {eventData.iconUrl && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Event Icon</label>
                    <div style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center' }}>
                      <img
                        src={eventData.iconUrl}
                        alt="Event Icon"
                        style={{ width: '2rem', height: '2rem', marginRight: '0.75rem', borderRadius: '0.25rem' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <a
                        href={eventData.iconUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem', wordBreak: 'break-all' }}
                      >
                        View Icon
                      </a>
                    </div>
                  </div>
                )}

                {eventData.logoUrl && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Event Logo</label>
                    <div style={{ marginTop: '0.25rem' }}>
                      <img
                        src={eventData.logoUrl}
                        alt="Event Logo"
                        style={{ maxWidth: '100%', height: '4rem', objectFit: 'contain', borderRadius: '0.25rem', border: '1px solid #e5e7eb' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <a
                        href={eventData.logoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}
                      >
                        View Logo
                      </a>
                    </div>
                  </div>
                )}

                {eventData.coverImageUrl && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Cover Image</label>
                    <div style={{ marginTop: '0.25rem' }}>
                      <img
                        src={eventData.coverImageUrl}
                        alt="Event Cover"
                        style={{ maxWidth: '100%', height: '8rem', objectFit: 'cover', borderRadius: '0.25rem', border: '1px solid #e5e7eb' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <a
                        href={eventData.coverImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}
                      >
                        View Full Image
                      </a>
                    </div>
                  </div>
                )}

                {eventData.organizers && eventData.organizers.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>All Organizers</label>
                    <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {eventData.organizers.map((organizer, index) => (
                        <span
                          key={index}
                          style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '0.875rem', borderRadius: '0.25rem' }}
                        >
                          {organizer}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {eventData.sponsors && eventData.sponsors.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Sponsors</label>
                    <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {eventData.sponsors.map((sponsor, index) => (
                        <span
                          key={index}
                          style={{ padding: '0.25rem 0.5rem', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.875rem', borderRadius: '0.25rem' }}
                        >
                          {sponsor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {eventData.socialLinks && Object.keys(eventData.socialLinks).length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Social Media</label>
                    <div style={{ marginTop: '0.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {Object.entries(eventData.socialLinks).map(([platform, url]) => {
                        const getPlatformIcon = (platform: string) => {
                          switch (platform.toLowerCase()) {
                            case 'twitter': return '🐦'
                            case 'youtube': return '📺'
                            case 'discord': return '💬'
                            case 'telegram': return '📱'
                            case 'instagram': return '📸'
                            case 'facebook': return '👥'
                            case 'tiktok': return '🎵'
                            default: return '🔗'
                          }
                        }

                        const getPlatformColor = (platform: string) => {
                          switch (platform.toLowerCase()) {
                            case 'twitter': return '#1da1f2'
                            case 'youtube': return '#ff0000'
                            case 'discord': return '#5865f2'
                            case 'telegram': return '#0088cc'
                            case 'instagram': return '#e1306c'
                            case 'facebook': return '#1877f2'
                            case 'tiktok': return '#000000'
                            default: return '#6b7280'
                          }
                        }

                        return (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#f9fafb',
                              border: `1px solid ${getPlatformColor(platform)}`,
                              color: getPlatformColor(platform),
                              fontSize: '0.875rem',
                              borderRadius: '0.375rem',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.2s',
                              fontWeight: '500'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = getPlatformColor(platform)
                              e.currentTarget.style.color = 'white'
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = '#f9fafb'
                              e.currentTarget.style.color = getPlatformColor(platform)
                            }}
                          >
                            <span>{getPlatformIcon(platform)}</span>
                            <span>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {eventData.description && (
              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>Description</label>
                <p style={{ color: '#111827', lineHeight: '1.625' }}>{eventData.description}</p>
              </div>
            )}

            {/* JSON View */}
            {showJson && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>Raw JSON Data</h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(eventData, null, 2))}
                    style={{
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}
                    title="Copy to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>
                <pre style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                  color: '#1e293b',
                  overflow: 'auto',
                  maxHeight: '400px'
                }}>
                  {JSON.stringify(eventData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Sample URLs */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)', padding: '1.5rem', marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>Sample Event URLs to Try</h3>
          <div className="sample-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', fontSize: '0.875rem' }}>
            <style>{`
              @media (min-width: 640px) {
                .sample-grid { grid-template-columns: 1fr 1fr !important; }
              }
            `}</style>
            <button
              onClick={() => setUrl('https://smartcon.chain.link/')}
              style={{ textAlign: 'left', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              <div style={{ fontWeight: '500' }}>SmartCon</div>
              <div style={{ color: '#6b7280' }}>Blockchain & DeFi event</div>
            </button>
            <button
              onClick={() => setUrl('https://ethcc.io/')}
              style={{ textAlign: 'left', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              <div style={{ fontWeight: '500' }}>ETHCC</div>
              <div style={{ color: '#6b7280' }}>Ethereum Community Conference</div>
            </button>
            <button
              onClick={() => setUrl('https://devcon.org/')}
              style={{ textAlign: 'left', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', cursor: 'pointer' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              <div style={{ fontWeight: '500' }}>DevCon SEA</div>
              <div style={{ color: '#6b7280' }}>Ethereum Developer Conference</div>
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
