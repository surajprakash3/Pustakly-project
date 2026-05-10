import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Reader.css';

export default function Reader() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Please log in to access your digital library.');
      setLoading(false);
      return;
    }

    const fetchBook = async () => {
      try {
        const res = await api.get('/api/user/library', { token });
        const items = res.items || [];
        const found = items.find(b => b.id === id);
        if (found) {
          setBook(found);
        } else {
          setError('Book not found in your library.');
        }
      } catch (err) {
        setError('Failed to load book.');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id, token]);

  if (loading) return <div className="reader-msg">Loading Reader...</div>;
  if (error) return (
    <div className="reader-msg error">
      <h3>Oops!</h3>
      <p>{error}</p>
      <button onClick={() => navigate('/user/dashboard')}>Back to Library</button>
    </div>
  );

  return (
    <div className="reader-container">
      <header className="reader-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Exit Reader</button>
        <div className="book-meta">
          <span className="title">{book.title}</span>
          <span className="author">{book.creator}</span>
        </div>
        <div className="controls">
          <button onClick={() => window.print()}>Print / Save</button>
        </div>
      </header>
      
      <main className="reader-viewport">
        {book.fileUrl ? (
          <iframe 
            src={`${book.fileUrl}#toolbar=0`} 
            title={book.title}
            className="pdf-viewer"
          />
        ) : (
          <div className="no-file">
            <p>Digital file content is not available for this book.</p>
          </div>
        )}
      </main>
    </div>
  );
}
