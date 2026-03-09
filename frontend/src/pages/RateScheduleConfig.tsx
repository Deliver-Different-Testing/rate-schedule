import React from 'react';

export const RateScheduleConfig: React.FC = () => (
  <div className="min-h-screen bg-[#f4f2f1] font-['Inter'] p-8">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-[#0d0c2c] mb-6">Rate Schedule Configuration</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#0d0c2c] mb-4">Client Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#555] mb-1">Client</label>
            <select className="w-full border border-[#e4e4e8] rounded px-3 py-2 text-sm">
              <option>Saatchi & Saatchi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#555] mb-1">Origin Suburb</label>
            <select className="w-full border border-[#e4e4e8] rounded px-3 py-2 text-sm">
              <option>Parnell</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#0d0c2c] mb-4">Speed Columns</h2>
        <p className="text-sm text-[#666] mb-3">Select which speed tiers to include in the rate schedule.</p>
        <div className="grid grid-cols-5 gap-2">
          {['Eco', '3 Hour', '2 Hour', '90 Min', '75 Min', '1 Hour', '45 Min', '30 Min', '15 Min', 'Direct'].map(speed => (
            <label key={speed} className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked className="accent-[#3bc7f4]" />
              {speed}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#0d0c2c] mb-4">Extra Charges</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#555] mb-1">Extra Item Charge ($)</label>
            <input type="number" defaultValue={40.14} step={0.01} className="w-full border border-[#e4e4e8] rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#555] mb-1">After Hours Standard ($)</label>
            <input type="number" defaultValue={42.00} step={0.01} className="w-full border border-[#e4e4e8] rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#555] mb-1">After Hours Overnight ($)</label>
            <input type="number" defaultValue={63.00} step={0.01} className="w-full border border-[#e4e4e8] rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#555] mb-1">After Hours Saturday ($)</label>
            <input type="number" defaultValue={10.00} step={0.01} className="w-full border border-[#e4e4e8] rounded px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="px-6 py-2 bg-[#0d0c2c] text-white rounded font-semibold text-sm hover:opacity-90">
          Generate PDF
        </button>
        <button className="px-6 py-2 bg-[#3bc7f4] text-white rounded font-semibold text-sm hover:opacity-90">
          Preview
        </button>
      </div>
    </div>
  </div>
);
