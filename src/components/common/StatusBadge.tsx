import React from 'react';
import { InternalPaymentStatus, ProjectStatus, RequestStatus } from '../../types';

interface StatusBadgeProps {
  status: RequestStatus | ProjectStatus | InternalPaymentStatus | string;
  type?: 'request' | 'project' | 'payment' | 'general';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'general' }) => {
  let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';

  // Request statuses
  if (status === 'New') {
    colorClass = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
  } else if (status === 'Contacted') {
    colorClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
  } else if (status === 'Discussing') {
    colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (status === 'Approved') {
    colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (status === 'In Progress' || status === 'Development' || status === 'Design' || status === 'Testing') {
    colorClass = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  } else if (status === 'Completed') {
    colorClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-semibold';
  } else if (status === 'Cancelled' || status === 'On Hold') {
    colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }

  // Payment statuses (Internal admin only)
  if (type === 'payment') {
    if (status === 'Received') {
      colorClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    } else if (status === 'Partially Received') {
      colorClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    } else if (status === 'Pending') {
      colorClass = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    } else {
      colorClass = 'bg-slate-800 text-slate-400 border-slate-700';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}
    >
      {type === 'payment' && (
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      )}
      {status}
    </span>
  );
};
