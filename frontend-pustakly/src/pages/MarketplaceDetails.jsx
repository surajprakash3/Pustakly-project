import { useContext } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import { CartContext } from '../context/CartContext.jsx';

const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function MarketplaceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { listings } = useMarketplace();
  const { addItem } = useContext(CartContext);

  const listing = listings.find((item) => String(item.id) === String(id));

  if (!listing) {
    return (
      <div className="page">
        <Navbar />
        <main className="section">
          <h2>Listing not available</h2>
          <p className="text-sm text-[#7a726b]">This item is no longer available.</p>
          <Link to="/marketplace" className="primary-btn">
            Back to Marketplace
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({ ...listing, price: formatPrice(listing.price), quantity: 1 });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  return (
    <div className="page">
      <Navbar />
      <main className="section">
        <div className="mb-6 text-sm text-[#7a726b]">
          <Link to="/">Home</Link> / <Link to="/marketplace">Marketplace</Link> / {listing.title}
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-[#efe5dc] bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">{listing.type}</p>
                <h2 className="text-2xl font-semibold">{listing.title}</h2>
                <p className="text-sm text-[#7a726b]">by {listing.creator}</p>
              </div>
              <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold text-[#4338ca]">
                Seller Verified
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="rounded-xl bg-[#f3ece6] p-6 text-sm text-[#6f6861]">
                {listing.previewUrl && listing.previewEnabled !== false ? (
                  <img src={listing.previewUrl} alt={listing.title} className="w-full rounded-xl object-cover" />
                ) : (
                  <div className="flex h-48 items-center justify-center text-4xl">📦</div>
                )}
              </div>
              <p className="text-sm text-[#6f6861]">{listing.description}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#efe5dc] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Category</p>
                  <p className="text-sm font-semibold">{listing.category}</p>
                </div>
                <div className="rounded-xl border border-[#efe5dc] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">File Type</p>
                  <p className="text-sm font-semibold">{listing.fileType || 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-[#efe5dc] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Seller</p>
                  <p className="text-sm font-semibold">{listing.sellerName || listing.seller || 'Unknown seller'}</p>
                </div>
                <div className="rounded-xl border border-[#efe5dc] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Status</p>
                  <p className="text-sm font-semibold">{listing.status}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-[#efe5dc] bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
            <h3 className="text-lg font-semibold">Buy This Resource</h3>
            <p className="mt-2 text-sm text-[#7a726b]">Secure instant access after purchase.</p>
            <div className="mt-6 rounded-xl bg-[#f5eee7] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Price</p>
              <p className="text-2xl font-semibold">{formatPrice(listing.price)}</p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="rounded-full bg-[#1d1b19] px-4 py-2 text-sm font-semibold text-white"
                onClick={handleBuyNow}
              >
                Buy Now
              </button>
              <button
                type="button"
                className="rounded-full border border-[#d9cfc6] px-4 py-2 text-sm font-semibold"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
              <Link to="/marketplace" className="text-center text-xs font-semibold text-[#a05c3b]">
                Back to Marketplace
              </Link>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
