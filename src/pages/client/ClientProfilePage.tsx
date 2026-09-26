import React, { useState } from 'react';
import { User, Mail, Phone, Building, ShieldCheck, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SEO } from '../../components/common/SEO';

export const ClientProfilePage: React.FC = () => {
  const { profile, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim(),
        company_name: companyName.trim(),
      });
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <SEO title="Client Profile Settings | VyapaarPro" />

      <div>
        <h1 className="text-2xl font-bold text-white">Client Account Profile</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your contact credentials and organization details.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Read-Only Account Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Account Email (Non-editable)
              </label>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono">
                {profile?.email}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Assigned Role
              </label>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-indigo-400 font-semibold uppercase">
                {profile?.role || 'customer'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Your Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Phone / WhatsApp
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Company / Brand Name
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-indigo-600/20 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">Security Architecture:</p>
          <p>
            Your account role is enforced strictly at the database level using PostgreSQL Row Level Security (RLS). Clients cannot elevate permissions or access other clients' records.
          </p>
        </div>
      </div>
    </div>
  );
};
