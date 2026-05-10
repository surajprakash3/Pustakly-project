import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './ReviewSection.css';

/* ─── Star renderer ─── */
function Stars({ value, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = interactive ? (hovered || value) : value;

  return (
    <div className={`rs-stars ${interactive ? 'interactive' : ''}`}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`rs-star ${n <= display ? 'filled' : ''}`}
          onClick={interactive ? () => onChange(n) : undefined}
          onMouseEnter={interactive ? () => setHovered(n) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          tabIndex={interactive ? 0 : -1}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ─── Rating Distribution Bar ─── */
function RatingBar({ label, count, total, onClick, active }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <button type="button" className={`rs-dist-row ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="rs-dist-label">{label}★</span>
      <div className="rs-dist-track">
        <div className="rs-dist-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="rs-dist-count">{count}</span>
    </button>
  );
}

/* ─── Single Review Card ─── */
function ReviewCard({ review, onHelpful, onReply, onDeleteReply, onDelete, currentUser }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwner    = currentUser && String(currentUser.id) === String(review.user?.id);
  const canReply   = currentUser && (currentUser.role === 'admin' || currentUser.role === 'seller');
  const hasReply   = !!review.sellerReply;

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    await onReply(review.id, replyText.trim());
    setReplyText('');
    setShowReplyBox(false);
    setSubmitting(false);
  };

  const fmt = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <article className="rs-card">
      {/* Header */}
      <div className="rs-card-header">
        <div className="rs-card-avatar">{(review.user?.name || 'A')[0].toUpperCase()}</div>
        <div className="rs-card-meta">
          <div className="rs-card-name-row">
            <span className="rs-card-name">{review.user?.name || 'Anonymous'}</span>
            {review.verifiedPurchase && (
              <span className="rs-verified">✔ Verified Purchase</span>
            )}
          </div>
          <div className="rs-card-date">{fmt(review.createdAt)}</div>
        </div>
        <Stars value={review.rating} />
      </div>

      {/* Title + comment */}
      {review.title && <p className="rs-card-title">"{review.title}"</p>}
      <p className="rs-card-comment">{review.comment}</p>

      {/* Footer actions */}
      <div className="rs-card-footer">
        <button
          type="button"
          className={`rs-helpful-btn ${review.markedHelpful ? 'active' : ''}`}
          onClick={() => onHelpful(review.id)}
        >
          👍 Helpful ({review.helpfulCount})
        </button>
        <div className="rs-card-actions">
          {canReply && !hasReply && (
            <button type="button" className="rs-action-btn" onClick={() => setShowReplyBox(v => !v)}>
              💬 Reply
            </button>
          )}
          {isOwner && (
            <button type="button" className="rs-action-btn danger" onClick={() => onDelete(review.id)}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Reply input box */}
      {showReplyBox && (
        <div className="rs-reply-box">
          <textarea
            className="rs-reply-input"
            placeholder="Write a seller reply…"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            rows={3}
          />
          <div className="rs-reply-actions">
            <button type="button" className="rs-btn-ghost" onClick={() => setShowReplyBox(false)}>Cancel</button>
            <button type="button" className="rs-btn-primary" onClick={submitReply} disabled={submitting}>
              {submitting ? 'Sending…' : 'Post Reply'}
            </button>
          </div>
        </div>
      )}

      {/* Seller reply display */}
      {hasReply && (
        <div className="rs-seller-reply">
          <div className="rs-seller-reply-header">
            <span className="rs-seller-tag">🏷️ Seller Response</span>
            <span className="rs-seller-date">{fmt(review.sellerReply.createdAt)}</span>
            {(currentUser?.role === 'admin' || currentUser?.role === 'seller') && (
              <button type="button" className="rs-action-btn danger small" onClick={() => onDeleteReply(review.id)}>
                Remove
              </button>
            )}
          </div>
          <p className="rs-seller-reply-text">{review.sellerReply.text}</p>
        </div>
      )}
    </article>
  );
}

/* ─── Write Review Form ─── */
function WriteReview({ onSubmit, onCancel }) {
  const [rating,  setRating]  = useState(0);
  const [title,   setTitle]   = useState('');
  const [comment, setComment] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Please select a star rating.');
    if (!comment.trim()) return setError('Please write a comment.');
    setError('');
    setLoading(true);
    const err = await onSubmit({ rating, title, comment });
    setLoading(false);
    if (err) setError(err);
  };

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <form className="rs-write-form" onSubmit={submit}>
      <h3 className="rs-write-title">Write a Review</h3>

      <div className="rs-write-stars-row">
        <Stars value={rating} interactive onChange={setRating} />
        {rating > 0 && <span className="rs-star-label">{labels[rating]}</span>}
      </div>

      <input
        className="rs-write-input"
        placeholder="Review title (optional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        maxLength={120}
      />

      <textarea
        className="rs-write-textarea"
        placeholder="Share your experience with this book…"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={4}
        required
        maxLength={2000}
      />
      <div className="rs-char-count">{comment.length}/2000</div>

      {error && <p className="rs-form-error">⚠️ {error}</p>}

      <div className="rs-write-footer">
        <button type="button" className="rs-btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="rs-btn-primary" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}

/* ─── Main Component ─── */
export default function ReviewSection({ productId, bookId }) {
  const { token, user } = useAuth();
  const [data,       setData]       = useState(null);   // { stats, reviews }
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [filterStar, setFilterStar] = useState(0);
  const [sortBy,     setSortBy]     = useState('newest');
  const [toast,      setToast]      = useState('');

  const showToast = (msg, isErr = false) => {
    setToast(isErr ? `❌ ${msg}` : `✅ ${msg}`);
    setTimeout(() => setToast(''), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = productId ? `product=${productId}` : `bookId=${bookId}`;
      const res = await api.get(`/api/reviews?${query}`, token ? { token } : {});
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [productId, bookId, token]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async ({ rating, title, comment }) => {
    try {
      await api.post('/api/reviews', { productId, bookId, rating, title, comment }, { token });
      setShowForm(false);
      showToast('Review submitted!');
      load();
      return null;
    } catch (err) {
      return err.message || 'Failed to submit review';
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!token) return showToast('Please log in to mark helpful', true);
    try {
      const res = await api.post(`/api/reviews/${reviewId}/helpful`, {}, { token });
      setData(prev => ({
        ...prev,
        reviews: prev.reviews.map(r => r.id === reviewId
          ? { ...r, helpfulCount: res.helpfulCount, markedHelpful: res.markedHelpful }
          : r
        )
      }));
    } catch { /* silent */ }
  };

  const handleReply = async (reviewId, text) => {
    try {
      const res = await api.post(`/api/reviews/${reviewId}/reply`, { text }, { token });
      setData(prev => ({
        ...prev,
        reviews: prev.reviews.map(r => r.id === reviewId ? { ...r, sellerReply: res.sellerReply } : r)
      }));
      showToast('Reply posted!');
    } catch (err) { showToast(err.message, true); }
  };

  const handleDeleteReply = async (reviewId) => {
    if (!window.confirm('Remove this reply?')) return;
    try {
      await api.delete(`/api/reviews/${reviewId}/reply`, { token });
      setData(prev => ({
        ...prev,
        reviews: prev.reviews.map(r => r.id === reviewId ? { ...r, sellerReply: null } : r)
      }));
      showToast('Reply removed');
    } catch (err) { showToast(err.message, true); }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await api.delete(`/api/reviews/${reviewId}`, { token });
      setData(prev => ({
        ...prev,
        reviews: prev.reviews.filter(r => r.id !== reviewId),
        stats: { ...prev.stats, total: prev.stats.total - 1 }
      }));
      showToast('Review deleted');
    } catch (err) { showToast(err.message, true); }
  };

  const displayedReviews = (data?.reviews || [])
    .filter(r => filterStar === 0 || r.rating === filterStar)
    .sort((a, b) => {
      if (sortBy === 'newest')  return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest')  return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'helpful') return b.helpfulCount - a.helpfulCount;
      return 0;
    });

  const stats = data?.stats || { total: 0, avg: 0, distribution: {} };
  const alreadyReviewed = user && data?.reviews?.some(r => String(r.user?.id) === String(user.id));

  return (
    <section className="rs-section">
      {/* Toast */}
      {toast && <div className={`rs-toast ${toast.startsWith('❌') ? 'error' : ''}`}>{toast}</div>}

      <div className="rs-header">
        <h2 className="rs-title">Reviews & Ratings</h2>
        {user && !alreadyReviewed && !showForm && (
          <button type="button" className="rs-btn-primary" onClick={() => setShowForm(true)}>
            ✏️ Write a Review
          </button>
        )}
      </div>

      {/* Summary + Distribution */}
      {stats.total > 0 && (
        <div className="rs-summary">
          <div className="rs-avg-block">
            <div className="rs-avg-number">{stats.avg}</div>
            <Stars value={Math.round(stats.avg)} />
            <div className="rs-avg-total">{stats.total} review{stats.total !== 1 ? 's' : ''}</div>
          </div>
          <div className="rs-distribution">
            {[5, 4, 3, 2, 1].map(n => (
              <RatingBar
                key={n}
                label={n}
                count={stats.distribution[n] || 0}
                total={stats.total}
                active={filterStar === n}
                onClick={() => setFilterStar(prev => prev === n ? 0 : n)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <WriteReview onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
      )}

      {/* Filters + sort */}
      {stats.total > 0 && (
        <div className="rs-controls">
          <div className="rs-filter-chips">
            <button type="button" className={`rs-chip ${filterStar === 0 ? 'active' : ''}`} onClick={() => setFilterStar(0)}>All</button>
            {[5, 4, 3, 2, 1].filter(n => stats.distribution[n] > 0).map(n => (
              <button key={n} type="button" className={`rs-chip ${filterStar === n ? 'active' : ''}`} onClick={() => setFilterStar(prev => prev === n ? 0 : n)}>
                {n}★
              </button>
            ))}
          </div>
          <select className="rs-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest rated</option>
            <option value="helpful">Most helpful</option>
          </select>
        </div>
      )}

      {/* States */}
      {loading && (
        <div className="rs-skeletons">
          {[1, 2, 3].map(i => <div key={i} className="rs-skeleton" />)}
        </div>
      )}
      {error && <div className="rs-error-box">⚠️ {error}</div>}
      {!loading && !error && stats.total === 0 && (
        <div className="rs-empty">
          <span>📖</span>
          <p>No reviews yet. Be the first to share your thoughts!</p>
          {user && !showForm && (
            <button type="button" className="rs-btn-primary" onClick={() => setShowForm(true)}>
              Write the First Review
            </button>
          )}
        </div>
      )}

      {/* Review cards */}
      <div className="rs-list">
        {displayedReviews.map(r => (
          <ReviewCard
            key={r.id}
            review={r}
            onHelpful={handleHelpful}
            onReply={handleReply}
            onDeleteReply={handleDeleteReply}
            onDelete={handleDelete}
            currentUser={user}
          />
        ))}
      </div>

      {filterStar !== 0 && displayedReviews.length === 0 && (
        <div className="rs-empty"><span>🔍</span><p>No {filterStar}-star reviews yet.</p></div>
      )}
    </section>
  );
}
