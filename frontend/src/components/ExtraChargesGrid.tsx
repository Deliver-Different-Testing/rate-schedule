import React from 'react';
import { ExtraChargesData } from '../types';

interface Props {
  extras: ExtraChargesData;
}

const Card: React.FC<{ icon: string; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-[#f8f8fa] border border-[#e4e4e8] rounded p-2 px-2.5">
    <h4 className="text-[8.5px] text-[#0d0c2c] font-bold mb-0.5">{icon} {title}</h4>
    <div className="text-[7.5px] text-[#555] leading-relaxed">{children}</div>
  </div>
);

export const ExtraChargesGrid: React.FC<Props> = ({ extras }) => {
  const ws = extras.weightSurcharges[0];
  return (
    <div>
      <div className="flex justify-between items-baseline mb-0.5">
        <div className="text-sm font-bold text-[#0d0c2c]">Additional Charges &amp; Information</div>
        <div className="text-[9px] text-[#3bc7f4] font-semibold tracking-wider uppercase">Surcharges &amp; policies</div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <Card icon="📦" title="Extra Items">
          <p>Additional items per consignment: <span className="font-semibold text-[#0d0c2c]">${extras.extraItemCharge.toFixed(2)}</span></p>
        </Card>
        <Card icon="⚖️" title="Weight Surcharges">
          <p>Consignments over 30kg up to 50kg incur an additional charge. A further charge applies per 25kg (or part thereof) over 50kg.</p>
          {ws && (
            <p className="mt-1 font-semibold text-[#0d0c2c]">
              3hr ${ws.threeHour.toFixed(2)} &nbsp;|&nbsp; 2hr ${ws.twoHour.toFixed(2)} &nbsp;|&nbsp; 90min ${ws.ninetyMin.toFixed(2)} &nbsp;|&nbsp; 75min ${ws.seventyFiveMin.toFixed(2)} &nbsp;|&nbsp; 1hr+ ${ws.oneHourPlus.toFixed(2)}
            </p>
          )}
        </Card>
        <Card icon="🌙" title="After Hours">
          <p>Outside business hours (7am–7pm Mon–Fri):</p>
          <p className="mt-0.5 font-semibold text-[#0d0c2c]">
            Standard: ${extras.afterHours.standard.toFixed(2)} &nbsp;|&nbsp; Midnight–5am: ${extras.afterHours.overnight.toFixed(2)} &nbsp;|&nbsp; Saturday 8am–1pm: ${extras.afterHours.saturday.toFixed(2)}
          </p>
          <p className="mt-0.5 text-[7px] text-[#888]">Christmas and Easter attract higher after-hours fees — please check with operator when booking.</p>
        </Card>
        <Card icon="🚐" title="Van / Multi-Trip Charge">
          <p>{extras.vanMultiTripNote}</p>
        </Card>
        <Card icon="⛽" title="Monthly Fuel Variation (MFV)">
          <p>{extras.mfvNote}</p>
        </Card>
        <Card icon="🧾" title="Prompt Payment Discount (PPD)">
          <p>{extras.ppdNote}</p>
        </Card>
      </div>

      <div className="mt-4 p-2.5 bg-[#f0f8ff] rounded border-l-[3px] border-[#3bc7f4]">
        <p className="text-[8.5px] font-semibold text-[#0d0c2c] mb-1">Understanding Your Rates</p>
        <p className="text-[7.5px] text-[#555] leading-relaxed">
          <strong>Base Rate</strong> = the rate shown in the schedule, before any surcharges.<br/>
          <strong>Your Invoice</strong> = Base Rate + MFV% + any applicable surcharges + GST − PPD (if eligible).<br/>
          <strong>DIRECT</strong> = courier goes straight from pickup to delivery, no other stops.<br/>
          <strong>ASAP</strong> (shaded columns) = courier delivers as soon as possible after picking up, may combine with nearby deliveries.
        </p>
      </div>
    </div>
  );
};
