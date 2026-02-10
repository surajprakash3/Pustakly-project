import { useMemo, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import './AdminUsers.css';

const initialUsers = [
  {
    id: 1,
    name: 'Asha Patel',
    email: 'asha.patel@email.com',
    role: 'Admin',
    status: 'Active',
    joined: 'Jan 18, 2026'
  },
  {
    id: 2,
    name: 'Miguel Santos',
    email: 'miguel.s@email.com',
    role: 'User',
    status: 'Active',
    joined: 'Jan 06, 2026'
  },
  {
    id: 3,
    name: 'Harper Blake',
    email: 'harper.blake@email.com',
    role: 'User',
    status: 'Blocked',
    joined: 'Dec 21, 2025'
  }
];

const statusStyles = {
  Active: 'bg-[#d1fae5] text-[#107a4b]',
  Blocked: 'bg-[#fee2e2] text-[#b91c1c]'
};

const roleStyles = {
  Admin: 'bg-[#e0e7ff] text-[#3730a3]',
  User: 'bg-[#f1f5f9] text-[#334155]'
};

export default function AdminUsers() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !query ||
        [user.name, user.email, user.role].some((field) =>
          field.toLowerCase().includes(query)
        );
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const toggleBlock = (id) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? { ...user, status: user.status === 'Active' ? 'Blocked' : 'Active' }
          : user
      )
    );
  };

  const deleteUser = (id) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const openProfile = (user) => {
    setSelectedUser(user);
  };

  const closeProfile = () => {
    setSelectedUser(null);
  };

  return (
    <div className="admin-shell admin-users-page min-h-screen bg-[#f6f3ee] text-[#1d1b19] lg:grid lg:grid-cols-[auto_1fr]">
      <AdminSidebar />

      <div className="admin-content px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a88874]">
              Users
            </p>
            <h1 className="text-3xl font-semibold">Manage Users</h1>
            <p className="text-sm text-[#6f6861]">{users.length} total profiles</p>
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
              Invite User
            </button>
          </div>
          </header>

          <section className="admin-card rounded-2xl bg-white px-6 py-5 shadow-[0_16px_32px_rgba(0,0,0,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">User List</h2>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#d1fae5] px-3 py-1 text-xs font-semibold text-[#107a4b]">
                  Active {users.filter((user) => user.status === 'Active').length}
                </span>
                <span className="rounded-full bg-[#fee2e2] px-3 py-1 text-xs font-semibold text-[#b91c1c]">
                  Blocked {users.filter((user) => user.status === 'Blocked').length}
                </span>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[#e6e9ef] bg-white px-4 py-2 shadow-sm">
                <span className="text-sm text-[#94a3b8]">🔎</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search users, email, or role"
                  className="w-full bg-transparent text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-2xl border border-[#e6e9ef] bg-white px-4 py-2 text-xs font-semibold text-[#64748b]"
              >
                <option value="All">All roles</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-[#e6e9ef] bg-white px-4 py-2 text-xs font-semibold text-[#64748b]"
              >
                <option value="All">All status</option>
                <option value="Active">Active</option>
                <option value="Blocked">Blocked</option>
              </select>
              <span className="rounded-full border border-[#e6e9ef] px-3 py-2 text-xs font-semibold text-[#64748b]">
                {filteredUsers.length} results
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="admin-table w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-[#7a726b]">
                  <tr className="border-b border-[#efe5dc]">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Joined</th>
                    <th className="py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[#3c3631]">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[#f3e8de] last:border-b-0">
                      <td className="py-4 pr-4 font-semibold">{user.name}</td>
                      <td className="py-4 pr-4 text-[#6f6861]">{user.email}</td>
                      <td className="py-4 pr-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleStyles[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[user.status]}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-[#6f6861]">{user.joined}</td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="rounded-full border border-[#d9cfc6] px-3 py-1 text-xs font-semibold"
                            type="button"
                            onClick={() => openProfile(user)}
                          >
                            View
                          </button>
                          <button
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              user.status === 'Blocked'
                                ? 'border-[#d1fae5] text-[#107a4b]'
                                : 'border-[#f4b4ad] text-[#b91c1c]'
                            }`}
                            type="button"
                            onClick={() => toggleBlock(user.id)}
                          >
                            {user.status === 'Blocked' ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            className="rounded-full border border-[#f4b4ad] px-3 py-1 text-xs font-semibold text-[#b91c1c]"
                            type="button"
                            onClick={() => deleteUser(user.id)}
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

      {selectedUser && (
        <div className="admin-modal fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8">
          <div className="admin-books-modal w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a88874]">User Profile</p>
                <h2 className="text-2xl font-semibold">{selectedUser.name}</h2>
              </div>
              <button className="text-xl" type="button" onClick={closeProfile}>
                ✕
              </button>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="rounded-xl border border-[#efe5dc] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Email</p>
                <p className="text-sm font-semibold">{selectedUser.email}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#efe5dc] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Role</p>
                  <p className="text-sm font-semibold">{selectedUser.role}</p>
                </div>
                <div className="rounded-xl border border-[#efe5dc] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Status</p>
                  <p className="text-sm font-semibold">{selectedUser.status}</p>
                </div>
              </div>
              <div className="rounded-xl border border-[#efe5dc] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[#a88874]">Joined</p>
                <p className="text-sm font-semibold">{selectedUser.joined}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeProfile}
                className="rounded-full border border-[#d9cfc6] px-5 py-2 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
