import { useContext, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import books from '../data/books.js';
import { CartContext } from '../context/CartContext.jsx';
import './BookDetails.css';

export default function BookDetails() {
  const [quantity, setQuantity] = useState(1);
  const { id } = useParams();
  const { addItem } = useContext(CartContext);
  const bookId = Number(id);
  const baseBook = books.find((item) => item.id === bookId);
  const book = baseBook
    ? {
        ...baseBook,
        category: baseBook.tag || 'General',
        pages: baseBook.pages || 320,
        published: baseBook.published || '2024',
        reviewsCount: baseBook.reviewsCount || 84,
        description:
          baseBook.description ||
          'A beautifully crafted story filled with memorable characters, immersive settings, and a journey that lingers long after the final page.'
      }
    : null;

  const reviews = [
    {
      id: 1,
      name: 'Asha Patel',
      rating: 5,
      date: 'Jan 12, 2026',
      text: 'Enchanting, atmospheric, and beautifully paced. The imagery stays with you.'
    },
    {
      id: 2,
      name: 'Miguel Santos',
      rating: 4.5,
      date: 'Dec 28, 2025',
      text: 'A rich world with tender character work. The last chapter is unforgettable.'
    },
    {
      id: 3,
      name: 'Harper Blake',
      rating: 4,
      date: 'Dec 10, 2025',
      text: 'Slow burn in the best way. A great read for cozy fantasy fans.'
    }
  ];

  const renderStars = (value) => {
    const stars = [];
    const fullStars = Math.floor(value);
    const hasHalfStar = value - fullStars >= 0.5;

    for (let i = 0; i < 5; i += 1) {
      if (i < fullStars) {
        stars.push('★');
      } else if (i === fullStars && hasHalfStar) {
        stars.push('☆');
      } else {
        stars.push('✩');
      }
    }

    return stars.join(' ');
  };

  const decrementQty = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const incrementQty = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = () => {
    addItem({ ...book, quantity });
  };

  if (!book) {
    return (
      <div className="book-details-page">
        <Navbar />
        <main className="book-details-container">
          <div className="breadcrumb">
            <Link to="/">Home</Link> / <Link to="/books">Books</Link> / Not Found
          </div>
          <section className="book-hero">
            <div className="book-info">
              <h1>Book not found</h1>
              <p className="book-description">
                We could not find that book. Browse the catalog to discover more titles.
              </p>
              <Link to="/books" className="add-to-cart">
                Back to Catalog
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="book-details-page">
      <Navbar />
      <main className="book-details-container">
        <div className="breadcrumb">
          <Link to="/">Home</Link> / <Link to="/books">Books</Link> / {book.title}
        </div>

        <section className="book-hero">
          <div className="book-cover">
            {book.image ? (
              <img src={book.image} alt={book.title} />
            ) : (
              <div className="cover-placeholder">
                <span className="cover-tag">{book.category}</span>
                <div className="cover-title">{book.title}</div>
                <div className="cover-author">by {book.author}</div>
              </div>
            )}
          </div>

          <div className="book-info">
            <h1>{book.title}</h1>
            <p className="book-author">By {book.author}</p>

            <div className="book-rating">
              <span className="stars">{renderStars(book.rating)}</span>
              <span className="rating-value">{book.rating}</span>
              <span className="rating-count">({book.reviewsCount} reviews)</span>
            </div>

            <div className="book-meta">
              <span>Category: {book.category}</span>
              <span>Pages: {book.pages}</span>
              <span>Published: {book.published}</span>
            </div>

            <p className="book-description">{book.description}</p>

            <div className="purchase-bar">
              <div className="price-block">
                <span className="price-label">Price</span>
                <span className="price-value">{book.price}</span>
              </div>

              <div className="quantity-selector">
                <button type="button" onClick={decrementQty} aria-label="Decrease quantity">
                  -
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={incrementQty} aria-label="Increase quantity">
                  +
                </button>
              </div>

              <button
                className="add-to-cart"
                type="button"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
            </div>

            <div className="book-highlights">
              <div className="highlight-item">
                <span className="highlight-title">Instant Delivery</span>
                <span className="highlight-sub">Download in seconds</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-title">Free Returns</span>
                <span className="highlight-sub">30-day guarantee</span>
              </div>
              <div className="highlight-item">
                <span className="highlight-title">Member Perks</span>
                <span className="highlight-sub">Earn 3x points</span>
              </div>
            </div>
          </div>
        </section>

        <section className="book-reviews">
          <div className="reviews-header">
            <h2>Reader Reviews</h2>
            <button className="write-review" type="button">
              Write a Review
            </button>
          </div>

          <div className="reviews-grid">
            {reviews.map((review) => (
              <article key={review.id} className="review-card">
                <div className="review-top">
                  <div>
                    <h3>{review.name}</h3>
                    <span className="review-date">{review.date}</span>
                  </div>
                  <span className="review-stars">{renderStars(review.rating)}</span>
                </div>
                <p>{review.text}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
