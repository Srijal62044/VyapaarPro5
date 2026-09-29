import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { RequestModal } from '../components/common/RequestModal';
import { AISupportWidget } from '../components/support/AISupportWidget';
import { ServiceItem } from '../types';
import { dataService } from '../services/store';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export const PublicLayout: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const { settings } = useSettings();

  const handleOpenGetStarted = async (service?: ServiceItem) => {
    try {
      const list = await dataService.getServices(true);
      setServicesList(list);
    } catch (e) {
      console.error(e);
    }
    setSelectedService(service || null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <Navbar onOpenGetStarted={() => handleOpenGetStarted()} />

      <main className="flex-1">
        <Outlet context={{ onOpenGetStarted: handleOpenGetStarted }} />
      </main>

      <Footer />

      {/* Floating Action Button for Instant WhatsApp consultation */}
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

      {/* Floating AI Support System Widget */}
      <AISupportWidget />

      <RequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedService={selectedService}
        servicesList={servicesList}
      />
    </div>
  );
};
