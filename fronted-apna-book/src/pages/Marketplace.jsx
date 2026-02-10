import { useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { CartContext } from '../context/CartContext.jsx';

const typeOptions = ['All', 'Physical Books', 'Digital Notes', 'Website ZIP files', 'Datasets', 'Design Templates'];
const categoryTabs = ['All', 'Book', 'Notes', 'Template', 'Data', 'Project'];

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function Marketplace() {
  const { listings } = useMarketplace();
  const { addItem } = useContext(CartContext);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [maxPrice, setMaxPrice] = useState(50);
  const [query, setQuery] = useState('');

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return listings.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesType = activeType === 'All' || item.type === activeType;
      const matchesPrice = Number(item.price || 0) <= maxPrice;
      const matchesQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.creator.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesType && matchesPrice && matchesQuery;
    });
  }, [listings, activeCategory, activeType, maxPrice, query]);

  return (
    <div className="page">
      <Navbar />
      <main className="section">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Marketplace</p>
            <h2 className="text-3xl font-semibold">Buy & Sell Digital Resources</h2>
            <p className="text-sm text-[#7a726b]">Browse community uploads across books, notes, templates, and datasets.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or creator"
              className="w-full rounded-full border border-[#e0ddd8] bg-white px-4 py-2 text-sm md:w-64"
            />
            <select
              value={activeType}
              onChange={(event) => setActiveType(event.target.value)}
              className="rounded-full border border-[#e0ddd8] bg-white px-4 py-2 text-sm"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          {categoryTabs.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeCategory === category
                  ? 'bg-[#1d1b19] text-white'
                  : 'border border-[#e0ddd8] text-[#6f6861] hover:bg-[#efe7e1]'
              }`}
            >
              {category}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-3">
            <label className="text-sm text-[#7a726b]">Max price</label>
            <input
              type="range"
              min="5"
              max="100"
              value={maxPrice}
              onChange={(event) => setMaxPrice(Number(event.target.value))}
              className="accent-[#b4512d]"
            />
            <span className="text-sm font-semibold">${maxPrice}</span>
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e0ddd8] bg-white p-8 text-center text-sm text-[#7a726b]">
            No listings match your filters yet. Try adjusting the category or price.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredListings.map((item) => (
              <article key={item.id} className="rounded-2xl border border-[#efe5dc] bg-white p-5 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
                      {item.type}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-[#7a726b]">by {item.creator}</p>
                  </div>
                  <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold text-[#4338ca]">
                    Seller
                  </span>
                </div>
                <p className="mt-3 text-sm text-[#6f6861]">{item.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-semibold">{formatPrice(item.price)}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-[#a88874]">{item.category}</span>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-full bg-[#1d1b19] px-4 py-2 text-xs font-semibold text-white"
                    onClick={() => addItem({ ...item, price: formatPrice(item.price), quantity: 1 })}
                  >
                    Add to Cart
                  </button>
                  <Link
                    to={`/marketplace/${item.id}`}
                    className="rounded-full border border-[#d9cfc6] px-4 py-2 text-xs font-semibold"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
