import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg-decoration"></div>
      <div className="hero-content">
        <span className="eyebrow">✨ Curated reads for curious minds</span>
        <h1>Discover books that <span className="highlight">inspire</span> your next adventure.</h1>
        <p className="hero-subtitle">
          Explore handpicked titles, smart bundles, and editor picks designed to
          elevate your reading experience and expand your literary horizons.
        </p>
        <div className="hero-actions">
          <button className="primary-btn" type="button">
            Browse Bestsellers <span className="arrow">→</span>
          </button>
          <button className="outline-btn" type="button">
            📚 Join Book Club
          </button>
        </div>
        <div className="hero-stats">
          <div className="stat-box">
            <span className="stat-number">120k+</span>
            <span className="stat-label">Happy readers</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-box">
            <span className="stat-number">8,500+</span>
            <span className="stat-label">Curated titles</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-box">
            <span className="stat-number">4.9★</span>
            <span className="stat-label">Community rating</span>
          </div>
        </div>
      </div>
      <div className="hero-visual">
        <div className="book-stack">
          <div className="book-card card-1">
            <div className="card-shine"></div>
            <span className="book-title">Modern Myth</span>
            <small className="book-genre">Fantasy</small>
            <div className="book-accent"></div>
          </div>
          <div className="book-card card-2 accent">
            <div className="card-shine"></div>
            <span className="book-title">City of Ink</span>
            <small className="book-genre">Thriller</small>
            <div className="book-accent"></div>
          </div>
          <div className="book-card card-3">
            <div className="card-shine"></div>
            <span className="book-title">Moonlit Atlas</span>
            <small className="book-genre">Travel</small>
            <div className="book-accent"></div>
          </div>
        </div>
        <div className="hero-badge">
          <span className="badge-icon">🚚</span>
          Free shipping over $25
        </div>
        <div className="floating-elements">
          <div className="float-circle circle-1"></div>
          <div className="float-circle circle-2"></div>
        </div>
      </div>
    </section>
  );
}
