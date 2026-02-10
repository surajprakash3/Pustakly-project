import { useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { useMarketplace } from '../context/MarketplaceContext.jsx';
import './AdminBooks.css';

const approvalStyles = {
  Pending: 'bg-[#fef3c7] text-[#b45309]',
  Approved: 'bg-[#d1fae5] text-[#107a4b]',
  Rejected: 'bg-[#fee2e2] text-[#b91c1c]'
};

const statusStyles = {
  Active: 'bg-[#e0e7ff] text-[#3730a3]',
  Paused: 'bg-[#fef3c7] text-[#b45309]',
  Sold: 'bg-[#dcfce7] text-[#166534]'
};

const emptyForm = {
  title: '',
  creator: '',
  description: '',
  price: '',
  category: '',
  type: '',
  approvalStatus: 'Pending',
  status: 'Active'
};

export default function AdminBooks() {
  const { listings, updateListing, removeListing } = useMarketplace();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return listings.filter((item) => {
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.creator.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.seller.toLowerCase().includes(query);
      const matchesFilter = filter === 'All' ? true : item.approvalStatus === filter;
      return matchesQuery && matchesFilter;
    });
  }, [listings, search, filter]);

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      creator: item.creator,
      description: item.description,
      price: String(item.price ?? ''),
      category: item.category,
      type: item.type,
      approvalStatus: item.approvalStatus ?? 'Pending',
      status: item.status ?? 'Active'
    });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!editingId) return;

    updateListing(editingId, {
      title: form.title.trim(),
      creator: form.creator.trim(),
      description: form.description.trim(),
      price: Number(form.price || 0),
      category: form.category.trim(),
      type: form.type.trim(),
      approvalStatus: form.approvalStatus,
      status: form.status
    });

    closeModal();
  };

  const updateApproval = (id, status) => {
    updateListing(id, { approvalStatus: status });
  };

  return (
    <div className="admin-shell admin-books-page min-h-screen bg-[#f6f3ee] text-[#1d1b19] lg:grid lg:grid-cols-[auto_1fr]">
      <AdminSidebar />

      <div className="admin-content px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a88874]">Uploads</p>
              <h1 className="text-3xl font-semibold">Manage Marketplace Items</h1>
              <p className="text-sm text-[#6f6861]">{listings.length} total listings</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full border border-[#d9cfc6] px-4 py-2 text-sm font-semibold"
                type="button"
              >
                Export
              </button>
              <button
                className="rounded-full bg-[#1d1b19] px-5 py-2 text-sm font-semibold text-white"
                type="button"
              >
                Bulk Actions
              </button>
            </div>
          </header>

          <section className="admin-card rounded-2xl bg-white px-6 py-5 shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Pending & Approved Items</h2>
              <div className="flex flex-wrap items-center gap-2">
                {['Pending', 'Approved', 'Rejected'].map((status) => (
                  <span
                    key={status}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${approvalStyles[status]}`}
                  >
                    {status} {listings.filter((item) => (item.approvalStatus ?? 'Pending') === status).length}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[#eee4dc] bg-white px-4 py-2 shadow-sm">
                <span className="text-sm text-[#a88874]">🔎</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title, creator, category, or seller"
                  className="w-full bg-transparent text-sm text-[#1d1b19] placeholder:text-[#a79d95] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[#eee4dc] bg-white px-4 py-2 shadow-sm">
                <span className="text-sm text-[#a88874]">Approval</span>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="bg-transparent text-sm font-semibold text-[#1d1b19] focus:outline-none"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-[#7a726b]">
                  <tr className="border-b border-[#efe5dc]">
                    <th className="py-3 pr-4">Title</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Seller</th>
                    <th className="py-3 pr-4">Price</th>
                    <th className="py-3 pr-4">Approval</th>
                    <th className="py-3 pr-4">Sales</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[#3c3631]">
                  {filteredListings.map((item) => (
                    <tr key={item.id} className="border-b border-[#f3e8de] last:border-b-0">
                      <td className="py-4 pr-4 font-semibold">{item.title}</td>
                      <td className="py-4 pr-4 text-[#6f6861]">{item.type}</td>
                      <td className="py-4 pr-4">
                        <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-[#6f6861]">{item.seller}</td>
                      <td className="py-4 pr-4 font-semibold">${Number(item.price || 0).toFixed(2)}</td>
                      <td className="py-4 pr-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            approvalStyles[item.approvalStatus ?? 'Pending']
                          }`}
                        >
                          {item.approvalStatus ?? 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status ?? 'Active']}`}>
                          {item.status ?? 'Active'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-full border border-[#d9cfc6] px-3 py-1 text-xs font-semibold"
                            type="button"
                            onClick={() => openEdit(item)}
                          >
                            View/Edit
                          </button>
                          <button
                            className="rounded-full border border-[#d1fae5] px-3 py-1 text-xs font-semibold text-[#107a4b]"
                            type="button"
                            onClick={() => updateApproval(item.id, 'Approved')}
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-full border border-[#fef3c7] px-3 py-1 text-xs font-semibold text-[#b45309]"
                            type="button"
                            onClick={() => updateApproval(item.id, 'Rejected')}
                          >
                            Reject
                          </button>
                          <button
                            className="rounded-full border border-[#f4b4ad] px-3 py-1 text-xs font-semibold text-[#b91c1c]"
                            type="button"
                            onClick={() => removeListing(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {isOpen && (
        <div className="admin-modal fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8">
          <div className="admin-books-modal w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a88874]">Edit Listing</p>
                <h2 className="text-2xl font-semibold">Update listing details</h2>
              </div>
              <button className="text-xl" type="button" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Title</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Listing title"
                    className="rounded-xl border border-[#eee4dc] px-4 py-3 text-sm"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Creator</label>
                  <input
                    name="creator"
                    value={form.creator}
                    onChange={handleChange}
                    placeholder="Creator name"
                    className="rounded-xl border border-[#eee4dc] px-4 py-3 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Category</label>
                  <input
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    placeholder="Category"
                    className="rounded-xl border border-[#eee4dc] px-4 py-3 text-sm"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Type</label>
                  <input
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    placeholder="Type"
                    className="rounded-xl border border-[#eee4dc] px-4 py-3 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Price</label>
                  <input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    type="number"
                    step="0.01"
                    className="rounded-xl border border-[#eee4dc] px-4 py-3 text-sm"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Approval</label>
                  <select
                    name="approvalStatus"
                    value={form.approvalStatus}
                    onChange={handleChange}
                    className="rounded-xl border border-[#eee4dc] px-4 py-3 text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold">Sales Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="rounded-xl border border-[#eee4dc] px-4 py-3 text-sm"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Sold">Sold</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  className="rounded-xl border border-[#eee4dc] px-4 py-3 text-sm"
                />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-[#d9cfc6] px-5 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#1d1b19] px-6 py-2 text-sm font-semibold text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
