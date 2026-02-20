import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const MarketplaceContext = createContext({
  listings: [],
  loading: false,
  error: '',
  refreshListings: () => {},
  fetchListings: () => {},
  addListing: () => {},
  updateListing: () => {},
  removeListing: () => {}
});

const normalizeListing = (listing) => {
  const sellerEmail = listing?.seller?.email || listing?.sellerEmail || listing?.seller || 'unknown';
  return {
    id: String(listing._id || listing.id),
    status: listing.status ?? 'Active',
    approvalStatus: listing.approvalStatus ?? 'Approved',
    totalSales: Number(listing.totalSales || 0),
    rating: Number(listing.rating || 0),
    ratingCount: Number(listing.ratingCount || 0),
    price: Number(listing.price || 0),
    seller: sellerEmail,
    sellerName: listing?.seller?.name || listing?.sellerName || undefined,
    ...listing
  };
};

const emitMarketplaceUpdated = () => {
  window.dispatchEvent(new CustomEvent('marketplace:updated'));
};

export function MarketplaceProvider({ children }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  const buildQueryString = useCallback((filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'All') {
        params.set(key, String(value));
      }
    });
    return params.toString();
  }, []);

  const fetchListings = useCallback(async (filters = {}) => {
    setLoading(true);
    setError('');
    try {
      const query = buildQueryString(filters);
      const path = query ? `/api/products?${query}` : '/api/products';
      const data = await api.get(path);
      const rows = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      const normalized = rows.map(normalizeListing);
      setListings(normalized);
      return normalized;
    } catch (requestError) {
      setError(requestError.message || 'Failed to load marketplace listings');
      setListings([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  const refreshListings = useCallback((filters = {}) => fetchListings(filters), [fetchListings]);

  useEffect(() => {
    let ignore = false;

    const loadFromApi = async () => {
      const data = await fetchListings();
      if (ignore) return;
      setListings(data);
    };

    loadFromApi();

    const pollId = setInterval(() => {
      if (!ignore) {
        fetchListings();
      }
    }, 15000);

    return () => {
      ignore = true;
      clearInterval(pollId);
    };
  }, [token, fetchListings]);

  const addListing = async (listing) => {
    if (!token) {
      throw new Error('Please sign in to upload a listing');
    }

    const payload = {
      title: listing.title,
      creator: listing.creator,
      description: listing.description,
      price: Number(listing.price || 0),
      category: listing.category,
      type: listing.type,
      fileUrl: listing.fileUrl,
      fileType: listing.fileType,
      previewUrl: listing.previewUrl,
      previewEnabled: listing.previewEnabled,
      status: listing.status ?? 'Active',
      approvalStatus: listing.approvalStatus ?? 'Approved'
    };

    const created = await api.post('/api/products', payload, { token });
    setListings((prev) => [normalizeListing(created), ...prev]);
    emitMarketplaceUpdated();
    return created;
  };

  const updateListing = async (id, updates) => {
    if (!token) {
      setListings((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
      return;
    }

    const shouldUpdateApproval =
      Object.prototype.hasOwnProperty.call(updates, 'approvalStatus') && user?.role === 'admin';
    const endpoint = shouldUpdateApproval ? `/api/products/${id}/approval` : `/api/products/${id}`;
    const payload = shouldUpdateApproval
      ? { approvalStatus: updates.approvalStatus }
      : updates;

    try {
      let updated = await api.patch(endpoint, payload, { token });

      if (!updated?.seller?.email) {
        try {
          updated = await api.get(`/api/products/${id}`);
        } catch {
          // Keep the original response if the detail lookup fails.
        }
      }

      setListings((prev) =>
        prev.map((item) => (item.id === String(id) ? normalizeListing({ ...item, ...updated }) : item))
      );
      emitMarketplaceUpdated();
    } catch (error) {
      setListings((prev) => prev.map((item) => (item.id === String(id) ? { ...item, ...updates } : item)));
    }
  };

  const removeListing = async (id) => {
    if (token) {
      try {
        await api.delete(`/api/products/${id}`, { token });
      } catch (error) {
        return;
      }
    }
    setListings((prev) => prev.filter((item) => item.id !== String(id)));
    emitMarketplaceUpdated();
  };

  const value = useMemo(
    () => ({
      listings,
      loading,
      error,
      refreshListings,
      fetchListings,
      addListing,
      updateListing,
      removeListing
    }),
    [listings, loading, error]
  );

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export const useMarketplace = () => useContext(MarketplaceContext);
