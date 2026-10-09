import React, { useState } from 'react';
import { Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { RequestModal } from '../components/common/RequestModal';
import { AISupportWidget } from '../components/support/AISupportWidget';
import { ServiceItem } from '../types';
import { dataService } from '../services/store';
import { MessageSquare, Sparkles, ShieldAlert, Lock } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

export const PublicLayout: React.FC = () => {
  const { profile, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const { settings } = useSettings();

  // Authentication route exemptions (where visitors sign in, sign up, or read legal terms)
  const authPaths = ['/login', '/register', '/forgot-password', '/privacy', '/terms'];
  const isAuthPath = authPaths.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + '/')
  );

  const handleOpenGetStarted = async (service?: ServiceItem) => {
    if (!profile) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    try {
      const list = await dataService.getServices(true);
      setServicesList(list);
    } catch (e) {
      console.error(e);
    }
    setSelectedService(service || null);
    setIsModalOpen(true);
  };

  // 1. Session Loading State: Prevent premature redirect while verifying session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-semibold text-white">VyapaarPro</h2>
        <p className="text-xs text-slate-400 mt-1">Verifying your account session...</p>
      </div>
    );
  }

  // 2. Compulsory Authentication Gate:
  // Visitors must sign in or sign up before they can explore any website content
  if (!profile && !isAuthPath) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar onOpenGetStarted={() => handleOpenGetStarted()} />

      <main className="flex-1">
        <Outlet context={{ onOpenGetStarted: handleOpenGetStarted }} />
      </main>

      <Footer />

      {/* Floating Action Button for Instant WhatsApp consultation (Only when logged in) */}
      {profile && (
        <div className="fixed bottom-20 right-6 z-30 flex flex-col items-end space-y-3">
          <a
            href={`https://wa.me/${(settings.whatsapp || '919876543210').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
              'Hello VyapaarPro, I would like to consult on a new digital project.'
            )}`}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-full shadow-2xl shadow-emerald-950/80 transition-all hover:scale-105"
            title="Direct WhatsApp Consultation"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out px-0 group-hover:px-2 text-xs font-semibold">
              WhatsApp
            </span>
          </a>
        </div>
      )}

      {/* Floating AI Support System Widget (Only when logged in to explore) */}
      {profile && <AISupportWidget />}

      <RequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedService={selectedService}
        servicesList={servicesList}
      />
    </div>
  );
};
