import { useContext, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import BookCard from '../components/BookCard.jsx';
import Footer from '../components/Footer.jsx';
import books from '../data/books.js';
import { CartContext } from '../context/CartContext.jsx';
import './BookList.css';

export default function BookList() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const { addItem } = useContext(CartContext);

  // Extract unique categories from books
  const categories = ['All', ...new Set(books.map((book) => book.tag))];

  // Filter books based on selected filters
  const filteredBooks = books.filter((book) => {
    const price = parseFloat(book.price.replace('$', ''));
    const matchesCategory = selectedCategory === 'All' || book.tag === selectedCategory;
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    const matchesRating = book.rating >= minRating;
    return matchesCategory && matchesPrice && matchesRating;
  });

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.price.replace('$', '')) - parseFloat(b.price.replace('$', ''));
      case 'price-high':
        return parseFloat(b.price.replace('$', '')) - parseFloat(a.price.replace('$', ''));
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const resetFilters = () => {
    setSelectedCategory('All');
    setPriceRange([0, 50]);
    setMinRating(0);
    setSortBy('featured');
  };

  return (
    <div className="book-list-page">
      <Navbar />
      
      <main className="book-list-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>Explore Our Collection</h1>
            <p>Discover {sortedBooks.length} amazing books</p>
          </div>
          <button 
            className="mobile-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? '✕ Close Filters' : '⚙ Filters'}
          </button>
        </div>

        <div className="book-list-layout">
          {/* Filters Sidebar */}
          <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="filters-header">
              <h3>Filters</h3>
              <button className="reset-btn" onClick={resetFilters}>
                Reset All
              </button>
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <h4>Category</h4>
              <div className="category-list">
                {categories.map((category) => (
                  <button
                    key={category}
                    className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                    {category === 'All' && <span className="count">({books.length})</span>}
                    {category !== 'All' && (
                      <span className="count">
                        ({books.filter((b) => b.tag === category).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="filter-group">
              <h4>Price Range</h4>
              <div className="price-inputs">
                <div className="price-input-group">
                  <label>Min</label>
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                    min="0"
                    max={priceRange[1]}
                  />
                </div>
                <span className="price-separator">-</span>
                <div className="price-input-group">
                  <label>Max</label>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                    min={priceRange[0]}
                    max="100"
                  />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                className="price-slider"
              />
              <div className="price-display">
                ${priceRange[0]} - ${priceRange[1]}
              </div>
            </div>

            {/* Rating Filter */}
            <div className="filter-group">
              <h4>Minimum Rating</h4>
              <div className="rating-options">
                {[0, 3, 3.5, 4, 4.5].map((rating) => (
                  <button
                    key={rating}
                    className={`rating-btn ${minRating === rating ? 'active' : ''}`}
                    onClick={() => setMinRating(rating)}
                  >
                    {rating === 0 ? 'All Ratings' : (
                      <>
                        {rating}★ & up
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Books Grid */}
          <div className="books-content">
            {/* Sort and View Controls */}
            <div className="controls-bar">
              <div className="result-info">
                Showing <strong>{sortedBooks.length}</strong> of <strong>{books.length}</strong> books
              </div>
              <div className="sort-control">
                <label>Sort by:</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Books Grid */}
            {sortedBooks.length > 0 ? (
              <div className="books-grid">
                {sortedBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    image={book.image}
                    title={book.title}
                    author={book.author}
                    price={book.price}
                    rating={book.rating}
                    tag={book.tag}
                    linkTo={`/books/${book.id}`}
                    onAddToCart={() => addItem({ ...book, quantity: 1 })}
                  />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">📚</div>
                <h3>No books found</h3>
                <p>Try adjusting your filters to see more results</p>
                <button className="reset-filters-btn" onClick={resetFilters}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
