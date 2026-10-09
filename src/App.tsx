import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ScrollToTop } from './components/common/ScrollToTop';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { ServicesPage } from './pages/public/ServicesPage';
import { ServiceDetailPage } from './pages/public/ServiceDetailPage';
import { PortfolioPage } from './pages/public/PortfolioPage';
import { PortfolioDetailPage } from './pages/public/PortfolioDetailPage';
import { AboutPage } from './pages/public/AboutPage';
import { ContactPage } from './pages/public/ContactPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { TermsPage } from './pages/public/TermsPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Digital Store & Customer Hub Pages
import { StorePage } from './pages/public/StorePage';
import { StoreDetailPage } from './pages/public/StoreDetailPage';
import { StorePaymentResultPage } from './pages/public/StorePaymentResultPage';
import { CustomerOrdersPage } from './pages/public/CustomerOrdersPage';
import { CustomerOrderDetailPage } from './pages/public/CustomerOrderDetailPage';
import { CustomerDownloadsPage } from './pages/public/CustomerDownloadsPage';
import { CustomerAccountPage } from './pages/public/CustomerAccountPage';

// Admin Operations Portal Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminServicesPage } from './pages/admin/AdminServicesPage';
import { AdminServiceEditPage } from './pages/admin/AdminServiceEditPage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AdminRequestDetailPage } from './pages/admin/AdminRequestDetailPage';
import { AdminClientsPage } from './pages/admin/AdminClientsPage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';
import { AdminProjectDetailPage } from './pages/admin/AdminProjectDetailPage';
import { AdminPortfolioPage } from './pages/admin/AdminPortfolioPage';
import { AdminPortfolioEditPage } from './pages/admin/AdminPortfolioEditPage';
import { AdminMessagesPage } from './pages/admin/AdminMessagesPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Admin Digital Store & Social Media Pages
import { AdminStoreDashboard } from './pages/admin/AdminStoreDashboard';
import { AdminStoreSocialServicesPage } from './pages/admin/AdminStoreSocialServicesPage';
import { AdminStoreProductsPage } from './pages/admin/AdminStoreProductsPage';
import { AdminStoreProductEditPage } from './pages/admin/AdminStoreProductEditPage';
import { AdminStoreCategoriesPage } from './pages/admin/AdminStoreCategoriesPage';
import { AdminStoreOrdersPage } from './pages/admin/AdminStoreOrdersPage';
import { AdminStoreOrderDetailPage } from './pages/admin/AdminStoreOrderDetailPage';

// Redirect helper for old client order links: /app/orders/:id -> /orders/:id
const RedirectOldOrder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/orders/${id}`} replace />;
};

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* 1. Public Agency, Digital Store, and Integrated Customer Hub */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:slug" element={<ServiceDetailPage />} />
              
              {/* Store & Purchases */}
              <Route path="/store" element={<StorePage />} />
              <Route path="/store/payment-result" element={<StorePaymentResultPage />} />
              <Route path="/store/:slug" element={<StoreDetailPage />} />

              {/* Customer Orders, Downloads, and Account (Unified into main site) */}
              <Route path="/orders" element={<CustomerOrdersPage />} />
              <Route path="/orders/:id" element={<CustomerOrderDetailPage />} />
              <Route path="/downloads" element={<CustomerDownloadsPage />} />
              <Route path="/account" element={<CustomerAccountPage />} />
              <Route path="/profile" element={<CustomerAccountPage />} />
              <Route path="/track-order" element={<CustomerOrdersPage />} />

              {/* Agency Pages */}
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/portfolio/:slug" element={<PortfolioDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* 2. Backward Compatibility Redirects (Seamlessly redirect old separate client portal routes) */}
            <Route path="/app" element={<Navigate to="/orders" replace />} />
            <Route path="/app/orders" element={<Navigate to="/orders" replace />} />
            <Route path="/app/orders/:id" element={<RedirectOldOrder />} />
            <Route path="/app/downloads" element={<Navigate to="/downloads" replace />} />
            <Route path="/app/profile" element={<Navigate to="/account" replace />} />
            <Route path="/app/requests" element={<Navigate to="/account" replace />} />
            <Route path="/app/requests/:id" element={<Navigate to="/account" replace />} />
            <Route path="/app/projects" element={<Navigate to="/account" replace />} />
            <Route path="/app/projects/:id" element={<Navigate to="/account" replace />} />
            <Route path="/app/*" element={<Navigate to="/orders" replace />} />

            {/* 3. Agency Admin Operations Routes (Strictly Isolated & Admin Only) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="services" element={<AdminServicesPage />} />
              <Route path="services/new" element={<AdminServiceEditPage />} />
              <Route path="services/:id" element={<AdminServiceEditPage />} />
              <Route path="requests" element={<AdminRequestsPage />} />
              <Route path="requests/:id" element={<AdminRequestDetailPage />} />
              <Route path="clients" element={<AdminClientsPage />} />
              <Route path="projects" element={<AdminProjectsPage />} />
              <Route path="projects/:id" element={<AdminProjectDetailPage />} />
              <Route path="portfolio" element={<AdminPortfolioPage />} />
              <Route path="portfolio/new" element={<AdminPortfolioEditPage />} />
              <Route path="portfolio/:id" element={<AdminPortfolioEditPage />} />
              <Route path="messages" element={<AdminMessagesPage />} />

              {/* Digital Store & Social Media Management */}
              <Route path="store" element={<AdminStoreDashboard />} />
              <Route path="store/social-services" element={<AdminStoreSocialServicesPage />} />
              <Route path="social-services" element={<AdminStoreSocialServicesPage />} />
              <Route path="store/reviews" element={<Navigate to="/admin/store/orders" replace />} />
              <Route path="store/products" element={<AdminStoreProductsPage />} />
              <Route path="store/products/new" element={<AdminStoreProductEditPage />} />
              <Route path="store/products/:id" element={<AdminStoreProductEditPage />} />
              <Route path="store/categories" element={<AdminStoreCategoriesPage />} />
              <Route path="store/orders" element={<AdminStoreOrdersPage />} />
              <Route path="store/orders/:id" element={<AdminStoreOrderDetailPage />} />

              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}
