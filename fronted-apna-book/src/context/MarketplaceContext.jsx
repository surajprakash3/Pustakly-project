import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import marketplaceSeed from '../data/marketplaceSeed.js';

const MarketplaceContext = createContext({
  listings: [],
  addListing: () => {},
  updateListing: () => {},
  removeListing: () => {}
});

const STORAGE_KEY = 'apnabook_marketplace';

const normalizeListing = (listing) => ({
  status: listing.status ?? 'Active',
  approvalStatus: listing.approvalStatus ?? 'Approved',
  ...listing
});

const loadListings = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return marketplaceSeed;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeListing) : marketplaceSeed;
  } catch {
    return marketplaceSeed;
  }
};

export function MarketplaceProvider({ children }) {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    setListings(loadListings().map(normalizeListing));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  }, [listings]);

  const addListing = (listing) => {
    setListings((prev) => [listing, ...prev]);
  };

  const updateListing = (id, updates) => {
    setListings((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const removeListing = (id) => {
    setListings((prev) => prev.filter((item) => item.id !== id));
  };

  const value = useMemo(
    () => ({ listings, addListing, updateListing, removeListing }),
    [listings]
  );

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export const useMarketplace = () => useContext(MarketplaceContext);
