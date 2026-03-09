import React, { useState } from 'react';
import { RateScheduleHeader } from '../components/RateScheduleHeader';
import { RateTable } from '../components/RateTable';
import { ScheduledServicesTable } from '../components/ScheduledServicesTable';
import { ExtraChargesGrid } from '../components/ExtraChargesGrid';
import { mockData } from '../data/mockRates';

type Tab = 'rates' | 'scheduled' | 'extras';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'rates', label: 'On-Demand Rates', icon: '📊' },
  { id: 'scheduled', label: 'Scheduled Services', icon: '📅' },
  { id: 'extras', label: 'Extra Charges', icon: '💰' },
];

export const RateSchedulePreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('rates');
  const data = mockData;
  const printDate = new Date(data.printDate).toLocaleDateString('en-NZ', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#e8e8ec] flex flex-col items-center py-8 px-2 gap-10 font-['Inter']">
      {/* Tab navigation */}
      <div className="w-[1120px] flex gap-1 -mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 text-[10px] font-semibold rounded-t border-none cursor-pointer transition-all
              ${activeTab === tab.id
                ? 'bg-white text-[#0d0c2c] shadow-[0_-2px_8px_rgba(0,0,0,0.06)]'
                : 'bg-[#e4e4e8] text-[#555] hover:bg-[#d8d8dc]'
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Page */}
      <div className="w-[1120px] min-h-[792px] bg-white shadow-[0_2px_20px_rgba(0,0,0,0.12)] py-7 px-8 relative rounded-sm">
        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] text-[120px] font-black text-[#0d0c2c] pointer-events-none tracking-[8px]">
          DFRNT
        </div>

        <RateScheduleHeader clientName={data.clientName} printDate={printDate} />

        {activeTab === 'rates' && (
          <>
            <RateTable rates={data.onDemandRates} fromSuburb={data.fromSuburb} />
            <div className="text-right text-[7px] text-[#aaa] mt-2 pt-1 border-t border-[#f0f0f0]">
              Page 1 of 3
            </div>
          </>
        )}

        {activeTab === 'scheduled' && (
          <>
            <ScheduledServicesTable services={data.scheduledServices} />
            <div className="text-right text-[7px] text-[#aaa] mt-auto pt-1 border-t border-[#f0f0f0]">
              Page 2 of 3
            </div>
          </>
        )}

        {activeTab === 'extras' && (
          <>
            <ExtraChargesGrid extras={data.extras} />
            <div className="text-right text-[7px] text-[#aaa] mt-2 pt-1 border-t border-[#f0f0f0]">
              Page 3 of 3
            </div>
          </>
        )}
      </div>
    </div>
  );
};
