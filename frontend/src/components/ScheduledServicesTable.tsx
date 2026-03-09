import React from 'react';
import { ScheduledServiceRow } from '../types';

interface Props {
  services: ScheduledServiceRow[];
}

const badgeClass: Record<string, string> = {
  'Next Day': 'bg-[#e8f5e9] text-[#2e7d32]',
  'Same Day': 'bg-[#fce4ec] text-[#c62828]',
  'Morning': 'bg-[#e3f2fd] text-[#1565c0]',
  'Afternoon': 'bg-[#fff3e0] text-[#e65100]',
};

export const ScheduledServicesTable: React.FC<Props> = ({ services }) => (
  <div>
    <div className="flex justify-between items-baseline mb-0.5">
      <div className="text-sm font-bold text-[#0d0c2c]">Scheduled Service Rates</div>
      <div className="text-[9px] text-[#3bc7f4] font-semibold tracking-wider uppercase">
        Pre-agreed contracted rates
      </div>
    </div>
    <div className="text-[7.5px] text-[#666] italic mb-2">
      These rates apply to pre-agreed scheduled services only. On-demand rates are shown on the preceding page.
    </div>

    <table className="w-full border-collapse text-[9px] mt-2">
      <thead>
        <tr>
          {['Route', 'Service', 'Schedule', 'Base Rate', 'Est. with MFV'].map(h => (
            <th key={h} className={`bg-[#0d0c2c] text-white font-semibold py-1.5 px-2 text-[8.5px] border border-[#1a1940] ${h.includes('Rate') || h.includes('MFV') ? 'text-right' : 'text-left'}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {services.map((svc, i) => (
          <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f8f8fa]'} hover:bg-[rgba(59,199,244,0.06)]`}>
            <td className="py-1 px-2 border border-[#e4e4e8] text-[9px] text-[#333]">{svc.route}</td>
            <td className="py-1 px-2 border border-[#e4e4e8] text-[9px] text-[#333]">
              <span className={`inline-block px-1.5 py-px rounded text-[7px] font-semibold uppercase tracking-wide mr-1.5 ${badgeClass[svc.serviceBadge] || 'bg-[#e8e8ec] text-[#555]'}`}>
                {svc.serviceBadge}
              </span>
              {svc.service}
            </td>
            <td className="py-1 px-2 border border-[#e4e4e8] text-[9px] text-[#333]">{svc.schedule}</td>
            <td className="py-1 px-2 border border-[#e4e4e8] text-[9px] text-[#333] text-right tabular-nums">${svc.baseRate.toFixed(2)}</td>
            <td className="py-1 px-2 border border-[#e4e4e8] text-[9px] text-[#333] text-right tabular-nums">${svc.estWithMFV.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="mt-2 text-[7.5px] text-[#666] italic py-1.5 px-2 bg-[#f8f8fa] rounded border-l-[3px] border-[#3bc7f4]">
      💡 Scheduled service rates are contracted and reviewed quarterly. To add, remove, or modify scheduled services, contact your account manager. MFV estimates are based on current month's fuel variation and may change.
    </div>
  </div>
);
