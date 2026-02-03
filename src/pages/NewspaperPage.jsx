import React, { useState, useEffect } from 'react';
import { FaNewspaper, FaExternalLinkAlt, FaMagic, FaSync } from 'react-icons/fa';

const DATA_URL = '/News-Weather-App/data/epaper_data.json';

const SOURCES = {
  THE_HINDU: { id: 'THE_HINDU', label: 'The Hindu' },
  INDIAN_EXPRESS: { id: 'INDIAN_EXPRESS', label: 'Indian Express' },
  DINAMANI: { id: 'DINAMANI', label: 'Dinamani' },
  DAILY_THANTHI: { id: 'DAILY_THANTHI', label: 'Daily Thanthi' }
};

const NewspaperPage = () => {
  const [activeSource, setActiveSource] = useState(SOURCES.THE_HINDU.id);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Append timestamp to prevent caching
      const response = await fetch(`${DATA_URL}?t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const json = await response.json();
      setData(json.sources);
      setLastUpdated(json.lastUpdated);
    } catch (err) {
      console.error(err);
      setError("Failed to load today's paper. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentSections = data ? data[activeSource] : [];

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="page-container mode-newspaper">
      {/* Header */}
      <div className="header">
        <div className="header__title">
          <FaNewspaper className="header__title-icon" />
          <span>Daily Brief</span>
        </div>
        <div className="header__actions">
           <button onClick={fetchData} className="btn-icon" aria-label="Refresh">
             <FaSync className={loading ? 'spin' : ''} />
           </button>
        </div>
      </div>

      {/* Source Toggles - Scrollable on mobile */}
      <div className="topline" style={{ borderRadius: 0, margin: 0, borderLeft: 'none', borderBottom: '1px solid var(--border-default)', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
          {Object.values(SOURCES).map(source => (
            <button
              key={source.id}
              onClick={() => setActiveSource(source.id)}
              className={`btn ${activeSource === source.id ? 'btn--primary' : 'btn--secondary'}`}
              style={{ padding: '8px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
            >
              {source.label}
            </button>
          ))}
        </div>
        {lastUpdated && (
           <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>
              Last Updated: {formatTime(lastUpdated)}
           </div>
        )}
      </div>

      <div className="main-content">
        {loading && !data ? (
          <div className="loading">
            <div className="loading__spinner"></div>
            <p>Fetching Today's Brief...</p>
          </div>
        ) : error ? (
           <div className="empty-state">
              <div className="empty-state__icon">⚠️</div>
              <p>{error}</p>
              <button onClick={fetchData} className="btn btn--primary mt-md">Retry</button>
           </div>
        ) : (
          <div className="news-list">
            {!currentSections || currentSections.length === 0 ? (
                <div className="empty-state">
                    <p>No content available for this source today.</p>
                </div>
            ) : (
                currentSections.map((section, idx) => (
                  <div key={idx} className="news-section">
                    <h2 className="news-section__title" style={{ fontFamily: 'Playfair Display, serif', borderBottom: '2px solid var(--text-primary)', paddingBottom: '4px', marginBottom: '12px' }}>
                      {section.page}
                    </h2>

                    {/* AI Summary Box */}
                    {section.summary && (
                        <div style={{
                            background: 'var(--bg-secondary)',
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '16px',
                            borderLeft: '4px solid var(--accent-primary)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                                <FaMagic />
                                <span>AI Summary</span>
                            </div>
                            <div style={{ whiteSpace: 'pre-line', fontSize: '0.95rem', lineHeight: '1.6', fontFamily: 'serif' }}>
                                {section.summary}
                            </div>
                        </div>
                    )}

                    <div className="news-list">
                      {section.articles?.map((article, aIdx) => (
                        <div key={aIdx} className="news-item" style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-default)', borderRadius: 0, padding: '12px 0' }}>
                          <h3 className="news-item__headline" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', margin: '0 0 8px 0' }}>
                            <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                               {article.title}
                            </a>
                          </h3>
                          <div className="news-item__meta">
                             <a
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                             >
                                Read Full Story <FaExternalLinkAlt style={{ fontSize: '0.7em' }}/>
                             </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
            )}

            <div className="market-disclaimer" style={{ marginTop: '32px' }}>
                Content aggregated from official sources. Summaries generated by AI.
                Verify important details from original articles.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewspaperPage;
