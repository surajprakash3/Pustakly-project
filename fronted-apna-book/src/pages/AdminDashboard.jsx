import AdminSidebar from '../components/AdminSidebar';

const stats = [
  { label: 'Revenue', value: '$82.6k', trend: '+14.2%', icon: '💸' },
  { label: 'Orders', value: '2,941', trend: '+9.8%', icon: '🧾' },
  { label: 'Users', value: '18.4k', trend: '+4.1%', icon: '👥' }
];

const salesSeries = [24, 28, 26, 32, 35, 40, 38, 44, 48, 52, 50, 60];
const ordersSeries = [18, 22, 20, 24, 28, 30, 26, 32, 34, 36, 33, 40];

const buildLinePoints = (values, width, height, padding) => {
  const max = Math.max(...values);
  const min = Math.min(...values);
  return values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / (values.length - 1);
      const y =
        height -
        padding -
        ((value - min) / (max - min || 1)) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');
};

export default function AdminDashboard() {
  const chartWidth = 480;
  const chartHeight = 180;
  const chartPadding = 16;
  const linePoints = buildLinePoints(salesSeries, chartWidth, chartHeight, chartPadding);
  const lineArea = `${linePoints} ${chartWidth - chartPadding},${chartHeight - chartPadding} ${chartPadding},${chartHeight - chartPadding}`;

  return (
    <div className="admin-analytics min-h-screen bg-[#f5f2ed] text-[#1d1b19] lg:grid lg:grid-cols-[auto_1fr]">
      <AdminSidebar />

      <div className="flex min-h-screen flex-col">
        <header className="analytics-header sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-[#f5f2ed]/90 px-6 py-4 backdrop-blur">
          <div>
            <h1 className="text-2xl font-semibold">Analytics</h1>
            <p className="analytics-muted text-sm text-[#6f6861]">Track revenue, orders, and users growth.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-full border border-[#d9cfc6] px-4 py-2 text-sm font-semibold" type="button">
              Export
            </button>
            <button className="rounded-full bg-[#1d1b19] px-5 py-2 text-sm font-semibold text-white" type="button">
              New Report
            </button>
            <div className="flex items-center gap-3 rounded-full bg-white px-3 py-2 shadow-sm">
              <span className="text-sm font-semibold">Asha Patel</span>
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1d1b19] text-xs font-semibold text-white">
                AP
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-8 px-6 py-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((card, index) => (
              <article
                key={card.label}
                className={`rounded-2xl p-5 text-white shadow-[0_18px_36px_rgba(0,0,0,0.15)] transition hover:-translate-y-1 ${
                  index === 0
                    ? 'bg-gradient-to-br from-[#f97316] to-[#ef4444]'
                    : index === 1
                    ? 'bg-gradient-to-br from-[#0f766e] to-[#14b8a6]'
                    : 'bg-gradient-to-br from-[#6366f1] to-[#3b82f6]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">{card.label}</p>
                    <h2 className="text-2xl font-semibold">{card.value}</h2>
                    <span className="text-xs font-semibold text-white/90">{card.trend}</span>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-xl">
                    {card.icon}
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <article className="analytics-surface rounded-2xl bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition hover:-translate-y-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Sales</h3>
                  <p className="analytics-muted text-xs text-[#7a726b]">Monthly revenue trend</p>
                </div>
                <span className="rounded-full bg-[#ffedd5] px-3 py-1 text-xs font-semibold text-[#c2410c]">+18%</span>
              </div>
              <div className="mt-6 overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-52 w-full min-w-[420px]"
                  role="img"
                  aria-label="Sales line chart"
                >
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points={lineArea} fill="url(#salesGradient)" />
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {linePoints.split(' ').map((point, index) => {
                    const [x, y] = point.split(',');
                    return <circle key={`point-${index}`} cx={x} cy={y} r="4" fill="#fb7185" />;
                  })}
                </svg>
              </div>
              <div className="mt-3 grid grid-cols-6 text-center text-xs text-[#7a726b]">
                {['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].map((month) => (
                  <span key={month}>{month}</span>
                ))}
              </div>
            </article>

            <div className="flex flex-col gap-6">
              <article className="analytics-surface rounded-2xl bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition hover:-translate-y-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Orders</h3>
                    <p className="analytics-muted text-xs text-[#7a726b]">Monthly volume</p>
                  </div>
                  <span className="rounded-full bg-[#dbeafe] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">+9%</span>
                </div>
                <div className="mt-6 grid h-40 grid-cols-12 items-end gap-2">
                  {ordersSeries.map((value, index) => (
                    <div
                      key={`orders-${index}`}
                      className={`rounded-t-2xl transition ${
                        index === ordersSeries.length - 1
                          ? 'bg-gradient-to-t from-[#3b82f6] to-[#60a5fa]'
                          : 'bg-[#e2e8f0]'
                      }`}
                      style={{ height: `${(value / 40) * 100}%` }}
                    ></div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-12 text-center text-[0.65rem] text-[#7a726b]">
                  {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((month) => (
                    <span key={month}>{month}</span>
                  ))}
                </div>
              </article>

              <article className="analytics-surface rounded-2xl bg-white p-6 shadow-[0_18px_36px_rgba(15,23,42,0.12)] transition hover:-translate-y-1">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">Monthly Summary</h3>
                    <p className="analytics-muted text-xs text-[#7a726b]">February snapshot</p>
                  </div>
                  <span className="rounded-full bg-[#dcfce7] px-3 py-1 text-xs font-semibold text-[#166534]">On track</span>
                </div>
                <ul className="mt-4 space-y-4 text-sm">
                  {[
                    ['Net Revenue', '$48.6k', 78],
                    ['Repeat Customers', '36%', 62],
                    ['Fulfillment Time', '1.9 days', 84]
                  ].map(([label, value, percent]) => (
                    <li key={label}>
                      <div className="flex items-center justify-between">
                        <span className="analytics-muted text-[#64748b]">{label}</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-[#e2e8f0]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a]"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
