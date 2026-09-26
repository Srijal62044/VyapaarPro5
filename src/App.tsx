import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { ClientLayout } from './layouts/ClientLayout';
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

// Client Portal Pages
import { ClientDashboard } from './pages/client/ClientDashboard';
import { ClientRequestsPage } from './pages/client/ClientRequestsPage';
import { ClientRequestDetailPage } from './pages/client/ClientRequestDetailPage';
import { ClientProjectsPage } from './pages/client/ClientProjectsPage';
import { ClientProjectDetailPage } from './pages/client/ClientProjectDetailPage';
import { ClientProfilePage } from './pages/client/ClientProfilePage';

// Admin Portal Pages
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

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. Public Agency Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:slug" element={<ServiceDetailPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/portfolio/:slug" element={<PortfolioDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Route>

            {/* 2. Client Workspace Routes */}
            <Route path="/app" element={<ClientLayout />}>
              <Route index element={<ClientDashboard />} />
              <Route path="requests" element={<ClientRequestsPage />} />
              <Route path="requests/:id" element={<ClientRequestDetailPage />} />
              <Route path="projects" element={<ClientProjectsPage />} />
              <Route path="projects/:id" element={<ClientProjectDetailPage />} />
              <Route path="profile" element={<ClientProfilePage />} />
            </Route>

            {/* 3. Agency Admin Operations Routes */}
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
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}
