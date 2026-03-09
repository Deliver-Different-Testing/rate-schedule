import React from 'react';

interface Props {
  clientName: string;
  printDate: string;
}

const DfrntLogo: React.FC = () => (
  <svg viewBox="0 0 40 40" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="20" rx="18" ry="10" stroke="url(#g1)" strokeWidth="2" fill="none" transform="rotate(0 20 20)"/>
    <ellipse cx="20" cy="20" rx="18" ry="10" stroke="url(#g2)" strokeWidth="2" fill="none" transform="rotate(60 20 20)"/>
    <ellipse cx="20" cy="20" rx="18" ry="10" stroke="url(#g3)" strokeWidth="2" fill="none" transform="rotate(120 20 20)"/>
    <circle cx="20" cy="20" r="3" fill="#0d0c2c"/>
    <defs>
      <linearGradient id="g1" x1="0" y1="20" x2="40" y2="20"><stop stopColor="#3bc7f4"/><stop offset="1" stopColor="#7c4dff"/></linearGradient>
      <linearGradient id="g2" x1="0" y1="20" x2="40" y2="20"><stop stopColor="#7c4dff"/><stop offset="1" stopColor="#3bc7f4"/></linearGradient>
      <linearGradient id="g3" x1="0" y1="20" x2="40" y2="20"><stop stopColor="#3bc7f4"/><stop offset="1" stopColor="#9c27b0"/></linearGradient>
    </defs>
  </svg>
);

export const RateScheduleHeader: React.FC<Props> = ({ clientName, printDate }) => (
  <div className="flex justify-between items-start pb-1.5 mb-1.5 border-b-2 border-[#0d0c2c]">
    <div className="flex items-center gap-2.5">
      <DfrntLogo />
      <span className="text-[15px] font-bold text-[#0d0c2c] tracking-[1.5px]">DFRNT</span>
    </div>
    <div className="text-right">
      <div className="text-[8.5px] text-[#888]">Generated {printDate}</div>
      <div className="text-[11px] font-semibold text-[#0d0c2c] mt-0.5">{clientName}</div>
    </div>
  </div>
);
