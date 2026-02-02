import React, { useState, useEffect } from 'react';
import { FaNewspaper, FaRobot, FaExternalLinkAlt } from 'react-icons/fa';
import { fetchTheHinduPaper, fetchIndianExpressPaper, openPerplexitySummary, NEWSPAPER_SOURCES } from '../services/newspaperService';

const NewspaperPage = () => {
  const [activeSource, setActiveSource] = useState(NEWSPAPER_SOURCES.THE_HINDU);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadPaper = async () => {
      setLoading(true);
      setError(null);
      setSections([]);

      try {
        let data = [];
        if (activeSource === NEWSPAPER_SOURCES.THE_HINDU) {
          data = await fetchTheHinduPaper();
        } else {
          data = await fetchIndianExpressPaper();
        }

        if (isMounted) {
          if (!data || data.length === 0) {
              setError("No articles found. The source might be updating or inaccessible.");
          } else {
              setSections(data);
          }
        }
      } catch (err) {
        if (isMounted) setError("Failed to load newspaper.");
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPaper();

    return () => { isMounted = false; };
  }, [activeSource]);

  const handleSummarize = () => {
    if (!sections || sections.length === 0) return;

    // Collect top headlines to summarize
    const summaryText = sections.slice(0, 5).map(sec =>
        (sec.articles || []).slice(0, 5).map(art =>
            `- ${art.title}${art.blurb ? ': ' + art.blurb : ''}`
        ).join('\n')
    ).join('\n\n');

    if (summaryText) {
        openPerplexitySummary(summaryText);
    }
  };

  return (
    <div className="page-container mode-newspaper">
      {/* Header */}
      <div className="header">
        <div className="header__title">
          <FaNewspaper className="header__title-icon" />
          <span>E-Paper Summariser</span>
        </div>
      </div>

      {/* Source Toggles */}
      <div className="topline" style={{ borderRadius: 0, margin: 0, borderLeft: 'none', borderBottom: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {Object.values(NEWSPAPER_SOURCES).map(source => (
            <button
              key={source}
              onClick={() => setActiveSource(source)}
              className={`btn ${activeSource === source ? 'btn--primary' : 'btn--secondary'}`}
              style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
            >
              {source}
            </button>
          ))}
        </div>

        <button
            onClick={handleSummarize}
            className="btn btn--secondary"
            style={{ width: '100%', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent-secondary)', borderColor: 'var(--accent-secondary)' }}
            disabled={loading || sections.length === 0}
        >
            <FaRobot /> Analyze with Perplexity AI
        </button>
      </div>

      <div className="main-content">
        {loading ? (
          <div className="loading">
            <div className="loading__spinner"></div>
            <p>Fetching Today's Paper...</p>
          </div>
        ) : error ? (
           <div className="empty-state">
              <div className="empty-state__icon">⚠️</div>
              <p>{error}</p>
              <button onClick={() => setActiveSource(activeSource)} className="btn btn--primary mt-md">Retry</button>
           </div>
        ) : (
          <div className="news-list">
            {sections.map((section, idx) => (
              <div key={idx} className="news-section">
                <h2 className="news-section__title" style={{ fontFamily: 'Playfair Display, serif', borderBottom: '2px solid var(--text-primary)', paddingBottom: '4px' }}>
                  {section.title}
                </h2>
                <div className="news-list">
                  {section.articles?.map((article, aIdx) => (
                    <div key={aIdx} className="news-item" style={{ background: 'var(--bg-secondary)', border: 'none', borderBottom: '1px solid var(--border-default)', borderRadius: 0 }}>
                      <h3 className="news-item__headline" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem' }}>
                        <a
                            href={article.link?.startsWith('/') ? `https://www.thehindu.com${article.link}` : article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                           {article.title}
                        </a>
                      </h3>
                      {article.blurb && (
                        <p className="news-item__summary" style={{ fontFamily: 'serif', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                          {article.blurb}
                        </p>
                      )}
                      <div className="news-item__meta" style={{ marginTop: '8px' }}>
                         <a
                            href={article.link?.startsWith('/') ? `https://www.thehindu.com${article.link}` : article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                         >
                            Read Original <FaExternalLinkAlt style={{ fontSize: '0.7em' }}/>
                         </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="market-disclaimer">
                Content fetched from {activeSource} Today's Paper edition.
                Summarization powered by Perplexity AI.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewspaperPage;
