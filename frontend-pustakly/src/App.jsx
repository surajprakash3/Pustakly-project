


import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home.jsx';
import BookList from './pages/BookList.jsx';
import BookDetails from './pages/BookDetails.jsx';
import Marketplace from './pages/Marketplace.jsx';
import MarketplaceDetails from './pages/MarketplaceDetails.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderSuccess from './pages/OrderSuccess.jsx';
import MyOrders from './pages/MyOrders.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminBooks from './pages/AdminBooks.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminCategories from './pages/AdminCategories.jsx';
import AdminReports from './pages/AdminReports.jsx';
import { RoleRedirect, LogoutRoute, RequireAuth, PublicOnly } from './components/RouteGuards.jsx';
import UserLayout from './pages/UserLayout.jsx';
import UserDashboard from './pages/UserDashboard.jsx';
import UserBuy from './pages/UserBuy.jsx';
import UserSell from './pages/UserSell.jsx';
import SellerDashboard from './pages/SellerDashboard.jsx';
import UserProfile from './pages/UserProfile.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/books" element={<BookList />} />
      <Route path="/books/:id" element={<BookDetails />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/marketplace/:id" element={<MarketplaceDetails />} />
      <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
      <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
      <Route path="/order-success/:id" element={<RequireAuth><OrderSuccess /></RequireAuth>} />
      <Route path="/orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <Signup />
          </PublicOnly>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth role="admin">
            <Navigate to="/admin/dashboard" replace />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth role="admin">
            <AdminDashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/books"
        element={
          <RequireAuth role="admin">
            <AdminBooks />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <RequireAuth role="admin">
            <AdminOrders />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth role="admin">
            <AdminUsers />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <RequireAuth role="admin">
            <AdminCategories />
          </RequireAuth>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <RequireAuth role="admin">
            <AdminReports />
          </RequireAuth>
        }
      />
      <Route path="/redirect" element={<RoleRedirect />} />
      <Route path="/logout" element={<LogoutRoute />} />
      <Route
        path="/user"
        element={
          <RequireAuth role="user">
            <UserLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/user/dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="buy" element={<UserBuy />} />
        <Route path="sell" element={<UserSell />} />
        <Route path="seller" element={<SellerDashboard />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>
    </Routes>
  );
}

export default App;
