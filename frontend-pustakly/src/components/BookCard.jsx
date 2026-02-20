/**
 * BookCard - Reusable book display component
 * 
 * @param {string} image - URL of the book cover image (optional, shows placeholder if null)
 * @param {string} title - Book title
 * @param {string} author - Author name
 * @param {string} price - Formatted price string (e.g., "$18.00")
 * @param {number} rating - Book rating out of 5 (supports decimals for half stars)
 * @param {string} tag - Category tag displayed on cover (optional)
 * @param {function} onAddToCart - Callback function when "Add to Cart" is clicked
 */

import { Link } from 'react-router-dom';
import './BookCard.css';

export default function BookCard({ 
  image, 
  title, 
  author, 
  price, 
  rating = 0, 
  tag,
  linkTo,
  onAddToCart 
}) {
  // Render star rating
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star filled">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star half">★</span>);
      } else {
        stars.push(<span key={i} className="star empty">★</span>);
      }
    }
    return stars;
  };

  const coverMarkup = (
    <div className="book-cover">
      {image ? (
        <img src={image} alt={title} className="book-image" />
      ) : (
        <>
          <div className="cover-overlay"></div>
          <div className="book-icon">📖</div>
        </>
      )}
      {tag && <span className="book-tag-overlay">{tag}</span>}
    </div>
  );

  return (
    <article className="book-card-item">
      {linkTo ? (
        <Link to={linkTo} className="book-card-link" aria-label={`View details for ${title}`}>
          {coverMarkup}
        </Link>
      ) : (
        coverMarkup
      )}
      <div className="book-details">
        {linkTo ? (
          <Link to={linkTo} className="book-title-link">
            <h3 className="book-title">{title}</h3>
          </Link>
        ) : (
          <h3 className="book-title">{title}</h3>
        )}
        <p className="author-name">by {author}</p>
        
        <div className="rating-wrapper">
          <div className="stars">{renderStars()}</div>
          <span className="rating-value">{rating.toFixed(1)}</span>
        </div>

        <div className="book-meta">
          <div className="price-wrapper">
            <span className="book-price">{price}</span>
          </div>
          <button 
            className="book-btn" 
            type="button"
            onClick={onAddToCart}
            aria-label={`Add ${title} to cart`}
          >
            <span className="cart-icon">🛒</span>
            Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}
