import AdminSidebar from '../components/AdminSidebar';

const reports = [
  { id: 'RPT-104', title: 'Monthly Sales', owner: 'Finance', updated: 'Feb 09, 2026' },
  { id: 'RPT-103', title: 'Inventory Health', owner: 'Ops', updated: 'Feb 07, 2026' },
  { id: 'RPT-102', title: 'Customer Retention', owner: 'Marketing', updated: 'Feb 05, 2026' },
  { id: 'RPT-101', title: 'Shipping Performance', owner: 'Logistics', updated: 'Feb 02, 2026' }
];

export default function AdminReports() {
  return (
    <div className="admin-shell min-h-screen bg-[#f6f3ee] text-[#1d1b19] lg:grid lg:grid-cols-[auto_1fr]">
      <AdminSidebar />

      <div className="admin-content px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a88874]">Reports</p>
              <h1 className="text-3xl font-semibold">Analytics Reports</h1>
              <p className="text-sm text-[#6f6861]">{reports.length} active reports</p>
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
                New Report
              </button>
            </div>
          </header>

          <section className="admin-card rounded-2xl bg-white px-6 py-5 shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Recent Reports</h2>
              <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">Q1 2026</span>
            </div>

            <div className="grid gap-4">
              {reports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-2xl border border-[#f3e8de] bg-[#fffaf6] px-5 py-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a88874]">
                        {report.id}
                      </p>
                      <h3 className="text-lg font-semibold">{report.title}</h3>
                      <p className="text-sm text-[#6f6861]">Owner: {report.owner}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.15em] text-[#a88874]">Updated</p>
                      <p className="text-sm font-semibold">{report.updated}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-[#d9cfc6] px-4 py-2 text-xs font-semibold"
                      type="button"
                    >
                      View
                    </button>
                    <button
                      className="rounded-full border border-[#d9cfc6] px-4 py-2 text-xs font-semibold"
                      type="button"
                    >
                      Download
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
