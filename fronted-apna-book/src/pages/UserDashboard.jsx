import { useMemo } from 'react';

const orders = [
  { id: 'ORD-4021', title: 'The Midnight Garden', status: 'Delivered', total: '$28.40' },
  { id: 'ORD-4019', title: 'Atlas of Light', status: 'Shipped', total: '$18.90' },
  { id: 'ORD-4012', title: 'Velocity & Velvet', status: 'Processing', total: '$22.00' }
];

const uploads = [
  { id: 'UP-88', title: 'Sunset Letters', status: 'Pending', price: '$12.00' },
  { id: 'UP-82', title: 'Quiet City', status: 'Approved', price: '$18.50' },
  { id: 'UP-79', title: 'Stone & Sky', status: 'Sold', price: '$21.00' }
];

export default function UserDashboard() {
  const stats = useMemo(
    () => [
      { label: 'Total Orders', value: orders.length },
      { label: 'Active Uploads', value: uploads.filter((item) => item.status !== 'Sold').length },
      { label: 'Earnings', value: '$146.50' }
    ],
    []
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="user-portal-card rounded-2xl bg-white p-5 shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
          >
            <p className="text-sm text-[#7a726b]">{stat.label}</p>
            <h2 className="text-2xl font-semibold">{stat.value}</h2>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="user-portal-card rounded-2xl bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
          <h3 className="text-lg font-semibold">My Orders</h3>
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="user-portal-row flex items-center justify-between rounded-xl border border-[#efe5dc] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{order.title}</p>
                  <p className="text-xs text-[#7a726b]">{order.id}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-[#f5eee7] px-3 py-1 text-xs font-semibold text-[#a05c3b]">
                    {order.status}
                  </span>
                  <p className="text-sm font-semibold mt-1">{order.total}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="user-portal-card rounded-2xl bg-white p-6 shadow-[0_12px_24px_rgba(0,0,0,0.08)]">
          <h3 className="text-lg font-semibold">My Uploads</h3>
          <div className="mt-4 space-y-3">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="user-portal-row flex items-center justify-between rounded-xl border border-[#efe5dc] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{upload.title}</p>
                  <p className="text-xs text-[#7a726b]">{upload.id}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-[#e0e7ff] px-3 py-1 text-xs font-semibold text-[#4338ca]">
                    {upload.status}
                  </span>
                  <p className="text-sm font-semibold mt-1">{upload.price}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
