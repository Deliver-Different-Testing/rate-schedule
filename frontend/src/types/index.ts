export interface RateScheduleData {
  clientName: string;
  fromSuburb: string;
  siteId: number;
  printDate: string;
  onDemandRates: RateRow[];
  scheduledServices: ScheduledServiceRow[];
  extras: ExtraChargesData;
}

export interface RateRow {
  destination: string;
  eco: number | null;
  threeHour: number | null;
  twoHour: number | null;
  ninetyMin: number | null;
  seventyFiveMin: number | null;
  oneHour: number | null;
  fortyFiveMin: number | null;
  thirtyMin: number | null;
  fifteenMin: number | null;
  direct: number | null;
}

export interface ScheduledServiceRow {
  route: string;
  service: string;
  serviceBadge: string;
  schedule: string;
  baseRate: number;
  estWithMFV: number;
}

export interface ExtraChargesData {
  extraItemCharge: number;
  weightSurcharges: WeightSurcharge[];
  afterHours: AfterHoursCharges;
  vanMultiTripNote: string;
  mfvNote: string;
  ppdNote: string;
}

export interface WeightSurcharge {
  label: string;
  threeHour: number;
  twoHour: number;
  ninetyMin: number;
  seventyFiveMin: number;
  oneHourPlus: number;
}

export interface AfterHoursCharges {
  standard: number;
  overnight: number;
  saturday: number;
}

export type SpeedColumn = 'eco' | 'threeHour' | 'twoHour' | 'ninetyMin' | 'seventyFiveMin' | 'oneHour' | 'fortyFiveMin' | 'thirtyMin' | 'fifteenMin' | 'direct';

export const SPEED_COLUMNS: { key: SpeedColumn; label: string; isAsap: boolean }[] = [
  { key: 'eco', label: 'Eco', isAsap: false },
  { key: 'threeHour', label: '3 Hour', isAsap: false },
  { key: 'twoHour', label: '2 Hour', isAsap: false },
  { key: 'ninetyMin', label: '90 Min', isAsap: false },
  { key: 'seventyFiveMin', label: '75 Min', isAsap: false },
  { key: 'oneHour', label: '1 Hour', isAsap: false },
  { key: 'fortyFiveMin', label: '45 Min', isAsap: true },
  { key: 'thirtyMin', label: '30 Min', isAsap: true },
  { key: 'fifteenMin', label: '15 Min', isAsap: true },
  { key: 'direct', label: 'Direct', isAsap: false },
];
