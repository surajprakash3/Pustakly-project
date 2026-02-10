/**
 * BookCard Component - Usage Examples
 * 
 * This file demonstrates various ways to use the reusable BookCard component.
 */

import BookCard from './BookCard';

// Example 1: Basic usage with placeholder image
const BasicExample = () => (
  <BookCard
    title="The Great Gatsby"
    author="F. Scott Fitzgerald"
    price="$12.99"
    rating={4.5}
    tag="Classic"
    onAddToCart={() => alert('Added to cart!')}
  />
);

// Example 2: With custom image
const WithImageExample = () => (
  <BookCard
    image="/path/to/book-cover.jpg"
    title="1984"
    author="George Orwell"
    price="$15.99"
    rating={4.8}
    tag="Dystopian"
    onAddToCart={() => console.log('Book added to cart')}
  />
);

// Example 3: Without tag
const WithoutTagExample = () => (
  <BookCard
    title="Atomic Habits"
    author="James Clear"
    price="$18.00"
    rating={4.9}
    onAddToCart={() => {
      // Custom cart logic here
    }}
  />
);

// Example 4: Low rating (for testing)
const LowRatingExample = () => (
  <BookCard
    title="Test Book"
    author="Test Author"
    price="$9.99"
    rating={2.5}
    tag="Testing"
    onAddToCart={() => console.log('Added')}
  />
);

// Example 5: In a grid layout
const GridExample = () => {
  const books = [
    { id: 1, title: 'Book One', author: 'Author A', price: '$10', rating: 4.0, tag: 'Fiction' },
    { id: 2, title: 'Book Two', author: 'Author B', price: '$15', rating: 4.5, tag: 'Non-Fiction' },
    { id: 3, title: 'Book Three', author: 'Author C', price: '$20', rating: 5.0, tag: 'Sci-Fi' },
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
      gap: '24px' 
    }}>
      {books.map(book => (
        <BookCard
          key={book.id}
          title={book.title}
          author={book.author}
          price={book.price}
          rating={book.rating}
          tag={book.tag}
          onAddToCart={() => console.log(`Added ${book.title}`)}
        />
      ))}
    </div>
  );
};

// Example 6: With state management
import { useState } from 'react';

const WithStateExample = () => {
  const [cart, setCart] = useState([]);

  const handleAddToCart = (bookId, bookTitle) => {
    setCart([...cart, { id: bookId, title: bookTitle }]);
    console.log(`${bookTitle} added. Cart now has ${cart.length + 1} items.`);
  };

  return (
    <BookCard
      title="Clean Code"
      author="Robert C. Martin"
      price="$32.00"
      rating={4.7}
      tag="Programming"
      onAddToCart={() => handleAddToCart(1, 'Clean Code')}
    />
  );
};

export {
  BasicExample,
  WithImageExample,
  WithoutTagExample,
  LowRatingExample,
  GridExample,
  WithStateExample
};
