import { useMemo, useState, useContext } from 'react';
import Toast from '../components/Toast.jsx';
import { Link } from 'react-router-dom';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { CartContext } from '../context/CartContext.jsx';

const typeOptions = ['All', 'Physical Books', 'Digital Notes', 'Website ZIP files', 'Datasets', 'Design Templates'];
const categoryTabs = ['All', 'Book', 'Notes', 'Template', 'Data', 'Project'];
const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function UserBuy() {
  const { listings } = useMarketplace();
  const { addItem } = useContext(CartContext);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const [maxPrice, setMaxPrice] = useState(60);
  const [query, setQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');

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
    <>
      <div className="flex flex-col gap-6">
        <section className="user-portal-card rounded-2xl bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Marketplace</h3>
              <p className="text-sm text-[#7a726b]">Browse and buy resources from community sellers.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search marketplace"
                className="user-portal-input w-full rounded-full border border-[#e0ddd8] px-4 py-2 text-sm sm:w-56"
              />
              <select
                value={activeType}
                onChange={(event) => setActiveType(event.target.value)}
                className="user-portal-input rounded-full border border-[#e0ddd8] px-4 py-2 text-sm"
              >
                {typeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-[#7a726b]">Max</label>
              <input
                type="range"
                min="5"
                max="120"
                value={maxPrice}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="accent-[#b4512d]"
              />
              <span className="text-xs font-semibold">${maxPrice}</span>
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-[#e0ddd8] px-4 py-8 text-center text-sm text-[#7a726b]">
              No listings match your filters yet.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((item) => (
                <article key={item.id} className="user-portal-tile rounded-2xl border border-[#efe5dc] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
                        {item.type}
                      </span>
                      <h4 className="mt-3 text-base font-semibold">{item.title}</h4>
                      <p className="text-sm text-[#7a726b]">by {item.creator}</p>
                    </div>
                    <span className="rounded-full bg-[#e0e7ff] px-2 py-1 text-[10px] font-semibold text-[#4338ca]">
                      Seller
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#6f6861]">{item.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-semibold">{formatPrice(item.price)}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-[#a88874]">{item.category}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      className="rounded-full bg-[#1d1b19] px-3 py-2 text-xs font-semibold text-white"
                      onClick={async () => {
                        try {
                          await addItem({
                            ...item,
                            productId: item._id || item.id || item.productId,
                            price: Number(item.price),
                            quantity: 1
                          });
                          setToastMsg('Added to cart!');
                        } catch (err) {
                          setToastMsg(err?.message || 'Failed to add to cart');
                        }
                      }}
                    >
                      Save to Cart
                    </button>
                    <Link to={`/marketplace/${item.id}`} className="user-portal-link text-xs font-semibold text-[#a05c3b]">
                      View
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <Toast message={toastMsg} onClose={() => setToastMsg('')} />
    </>
  );
}
