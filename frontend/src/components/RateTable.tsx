import React from 'react';
import { RateRow, SPEED_COLUMNS, SpeedColumn } from '../types';

interface Props {
  rates: RateRow[];
  fromSuburb: string;
}

const fmt = (v: number | null): string => v != null ? `$${v.toFixed(2)}` : '—';

export const RateTable: React.FC<Props> = ({ rates, fromSuburb }) => (
  <div>
    <div className="flex justify-between items-baseline mb-0.5">
      <div className="text-sm font-bold text-[#0d0c2c]">On-Demand Rate Schedule</div>
      <div className="text-[9px] text-[#3bc7f4] font-semibold tracking-wider uppercase">
        Base rates ex. MFV, GST &amp; PPD
      </div>
    </div>
    <div className="text-[7.5px] text-[#666] italic mb-2">
      From: {fromSuburb} &nbsp;|&nbsp; If your delivery suburb is not listed, please contact us for a quote.
    </div>

    <table className="w-full border-collapse text-[9px]">
      <thead>
        <tr>
          <th className="bg-[#0d0c2c] text-white font-semibold py-1 px-1 text-left text-[8.5px] border border-[#1a1940] min-w-[120px]">
            Destination
          </th>
          {SPEED_COLUMNS.map(col => (
            <th
              key={col.key}
              className={`${col.isAsap ? 'bg-[#163550]' : 'bg-[#0d0c2c]'} text-white font-semibold py-1 px-1 text-center text-[8.5px] border border-[#1a1940] whitespace-nowrap`}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rates.map((row, i) => (
          <tr key={row.destination} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f8f8fa]'} hover:bg-[rgba(59,199,244,0.06)]`}>
            <td className="py-0.5 px-1 border border-[#e4e4e8] text-left font-medium text-[#0d0c2c] text-[8.5px]">
              {row.destination}
            </td>
            {SPEED_COLUMNS.map(col => {
              const val = row[col.key as keyof RateRow] as number | null;
              const asapBg = col.isAsap
                ? (i % 2 === 0 ? 'bg-[rgba(59,199,244,0.06)]' : 'bg-[rgba(59,199,244,0.10)]')
                : '';
              return (
                <td
                  key={col.key}
                  className={`py-0.5 px-1 border border-[#e4e4e8] text-right tabular-nums text-[8.5px] ${asapBg} ${val == null ? 'text-[#ccc] text-center text-[7px]' : ''}`}
                >
                  {fmt(val)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>

    <div className="mt-2.5 text-[7px] text-[#666] border-t border-[#e4e4e8] pt-1 flex gap-6">
      <p><strong className="text-[#0d0c2c]">DIRECT:</strong> Courier goes directly from pickup to delivery.</p>
      <p><strong className="text-[#0d0c2c]">ASAP (shaded):</strong> Courier delivers as soon as possible after pickup.</p>
      <p><strong className="text-[#0d0c2c]">*Base rates:</strong> MFV, GST, and PPD are applied at invoicing.</p>
    </div>
  </div>
);
