import AdminSidebar from '../components/AdminSidebar';

const categories = [
  { id: 1, name: 'Fantasy', books: 128, status: 'Active' },
  { id: 2, name: 'Romance', books: 84, status: 'Active' },
  { id: 3, name: 'Mystery', books: 62, status: 'Active' },
  { id: 4, name: 'Sci-Fi', books: 49, status: 'Draft' }
];

export default function AdminCategories() {
  return (
    <div className="admin-shell min-h-screen bg-[#f6f3ee] text-[#1d1b19] lg:grid lg:grid-cols-[auto_1fr]">
      <AdminSidebar />

      <div className="admin-content px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a88874]">Categories</p>
              <h1 className="text-3xl font-semibold">Manage Categories</h1>
              <p className="text-sm text-[#6f6861]">{categories.length} categories</p>
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
                Add Category
              </button>
            </div>
          </header>

          <section className="admin-card rounded-2xl bg-white px-6 py-5 shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Category List</h2>
              <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
                Active {categories.filter((item) => item.status === 'Active').length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-[#7a726b]">
                  <tr className="border-b border-[#efe5dc]">
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Books</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[#3c3631]">
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-[#f3e8de] last:border-b-0">
                      <td className="py-4 pr-4 font-semibold">{category.name}</td>
                      <td className="py-4 pr-4">{category.books}</td>
                      <td className="py-4 pr-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            category.status === 'Active'
                              ? 'bg-[#d1fae5] text-[#107a4b]'
                              : 'bg-[#fef3c7] text-[#b45309]'
                          }`}
                        >
                          {category.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-full border border-[#d9cfc6] px-3 py-1 text-xs font-semibold"
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-full border border-[#f4b4ad] px-3 py-1 text-xs font-semibold text-[#b91c1c]"
                            type="button"
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
    </div>
  );
}
