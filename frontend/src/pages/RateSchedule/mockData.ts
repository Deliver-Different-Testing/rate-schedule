// Mock data for Rate Schedule Generator
// TODO: Replace with real API calls when backend is wired up

export type LocationMode = 'suburbs' | 'zipcodes'

export const locationModeLabels: Record<LocationMode, string> = {
  'suburbs': 'Suburbs / Towns',
  'zipcodes': 'ZIP Codes',
}

export interface Client {
  id: number
  code: string
  name: string
  siteId: number
  homeSuburbId: number
  homeSuburbName: string
  homeZipCode?: string
  homeZipName?: string
  standardRate: number
  vanRate: number
  economyActive: boolean
  economyRuns: boolean
  ppdRate: number | null
}

export type ServiceGroup = 'on-demand' | 'scheduled' | 'regional' | 'international'

export const serviceGroupLabels: Record<ServiceGroup, string> = {
  'on-demand': 'On-Demand Deliveries',
  'scheduled': 'Scheduled Services',
  'regional': 'Regional / National',
  'international': 'International',
}

export interface JobType {
  id: number
  name: string
  minutes: number | null
  sortOrder: number
  serviceGroup: ServiceGroup
}

export interface Suburb {
  id: number
  name: string
  siteId: number
  zone: number
}

export interface TopDestination {
  suburbId: number
  suburbName: string
  jobCount: number
}

export interface ZipCode {
  id: number
  code: string
  city: string
  state: string
  siteId: number
  zone: number
}

export interface TopZipDestination {
  zipId: number
  zipCode: string
  city: string
  jobCount: number
}

export interface RateItem {
  toSuburbId: number
  toSuburbName: string
  jobTypeId: number
  speedName: string
  minutes: number | null
  rate: number
  availability: 'Available' | 'Possible' | 'Unavailable'
}

// ── Regional Cities ──
export interface RegionalCity {
  id: string
  name: string
  region: 'north-island' | 'south-island'
}

export const regionalCities: RegionalCity[] = [
  { id: 'akl', name: 'Auckland', region: 'north-island' },
  { id: 'ham', name: 'Hamilton', region: 'north-island' },
  { id: 'tau', name: 'Tauranga', region: 'north-island' },
  { id: 'rot', name: 'Rotorua', region: 'north-island' },
  { id: 'npl', name: 'New Plymouth', region: 'north-island' },
  { id: 'pmn', name: 'Palmerston North', region: 'north-island' },
  { id: 'wlg', name: 'Wellington', region: 'north-island' },
  { id: 'nsn', name: 'Nelson', region: 'south-island' },
  { id: 'chc', name: 'Christchurch', region: 'south-island' },
  { id: 'dud', name: 'Dunedin', region: 'south-island' },
  { id: 'zqn', name: 'Queenstown', region: 'south-island' },
]

export interface RegionalRoute {
  from: string
  to: string
  speeds: Record<string, { rate: number; availability: 'Available' | 'Possible' | 'Unavailable' }>
}

// Mock inter-city rates (base rates before client adjustments)
export const regionalRoutes: RegionalRoute[] = [
  // Auckland routes
  { from: 'akl', to: 'ham', speeds: { 'Regional Same Day': { rate: 65, availability: 'Available' }, 'Regional Overnight': { rate: 35, availability: 'Available' }, 'National Economy': { rate: 22, availability: 'Available' } } },
  { from: 'akl', to: 'tau', speeds: { 'Regional Same Day': { rate: 85, availability: 'Available' }, 'Regional Overnight': { rate: 45, availability: 'Available' }, 'National Economy': { rate: 28, availability: 'Available' } } },
  { from: 'akl', to: 'rot', speeds: { 'Regional Same Day': { rate: 95, availability: 'Possible' }, 'Regional Overnight': { rate: 50, availability: 'Available' }, 'National Economy': { rate: 32, availability: 'Available' } } },
  { from: 'akl', to: 'npl', speeds: { 'Regional Same Day': { rate: 120, availability: 'Possible' }, 'Regional Overnight': { rate: 65, availability: 'Available' }, 'National Economy': { rate: 38, availability: 'Available' } } },
  { from: 'akl', to: 'pmn', speeds: { 'Regional Same Day': { rate: 145, availability: 'Unavailable' }, 'Regional Overnight': { rate: 75, availability: 'Available' }, 'National Economy': { rate: 42, availability: 'Available' } } },
  { from: 'akl', to: 'wlg', speeds: { 'Regional Same Day': { rate: 180, availability: 'Unavailable' }, 'Regional Overnight': { rate: 85, availability: 'Available' }, 'National Economy': { rate: 48, availability: 'Available' } } },
  { from: 'akl', to: 'nsn', speeds: { 'Regional Same Day': { rate: 220, availability: 'Unavailable' }, 'Regional Overnight': { rate: 110, availability: 'Possible' }, 'National Economy': { rate: 58, availability: 'Available' } } },
  { from: 'akl', to: 'chc', speeds: { 'Regional Same Day': { rate: 195, availability: 'Unavailable' }, 'Regional Overnight': { rate: 95, availability: 'Available' }, 'National Economy': { rate: 52, availability: 'Available' } } },
  { from: 'akl', to: 'dud', speeds: { 'Regional Same Day': { rate: 250, availability: 'Unavailable' }, 'Regional Overnight': { rate: 130, availability: 'Possible' }, 'National Economy': { rate: 65, availability: 'Available' } } },
  { from: 'akl', to: 'zqn', speeds: { 'Regional Same Day': { rate: 280, availability: 'Unavailable' }, 'Regional Overnight': { rate: 145, availability: 'Possible' }, 'National Economy': { rate: 72, availability: 'Available' } } },
  // Hamilton routes
  { from: 'ham', to: 'akl', speeds: { 'Regional Same Day': { rate: 65, availability: 'Available' }, 'Regional Overnight': { rate: 35, availability: 'Available' }, 'National Economy': { rate: 22, availability: 'Available' } } },
  { from: 'ham', to: 'tau', speeds: { 'Regional Same Day': { rate: 55, availability: 'Available' }, 'Regional Overnight': { rate: 30, availability: 'Available' }, 'National Economy': { rate: 20, availability: 'Available' } } },
  { from: 'ham', to: 'rot', speeds: { 'Regional Same Day': { rate: 60, availability: 'Available' }, 'Regional Overnight': { rate: 32, availability: 'Available' }, 'National Economy': { rate: 22, availability: 'Available' } } },
  { from: 'ham', to: 'wlg', speeds: { 'Regional Same Day': { rate: 160, availability: 'Unavailable' }, 'Regional Overnight': { rate: 78, availability: 'Available' }, 'National Economy': { rate: 42, availability: 'Available' } } },
  { from: 'ham', to: 'chc', speeds: { 'Regional Same Day': { rate: 210, availability: 'Unavailable' }, 'Regional Overnight': { rate: 105, availability: 'Possible' }, 'National Economy': { rate: 55, availability: 'Available' } } },
  // Wellington routes
  { from: 'wlg', to: 'akl', speeds: { 'Regional Same Day': { rate: 180, availability: 'Unavailable' }, 'Regional Overnight': { rate: 85, availability: 'Available' }, 'National Economy': { rate: 48, availability: 'Available' } } },
  { from: 'wlg', to: 'ham', speeds: { 'Regional Same Day': { rate: 160, availability: 'Unavailable' }, 'Regional Overnight': { rate: 78, availability: 'Available' }, 'National Economy': { rate: 42, availability: 'Available' } } },
  { from: 'wlg', to: 'pmn', speeds: { 'Regional Same Day': { rate: 55, availability: 'Available' }, 'Regional Overnight': { rate: 28, availability: 'Available' }, 'National Economy': { rate: 18, availability: 'Available' } } },
  { from: 'wlg', to: 'nsn', speeds: { 'Regional Same Day': { rate: 95, availability: 'Possible' }, 'Regional Overnight': { rate: 55, availability: 'Available' }, 'National Economy': { rate: 32, availability: 'Available' } } },
  { from: 'wlg', to: 'chc', speeds: { 'Regional Same Day': { rate: 120, availability: 'Possible' }, 'Regional Overnight': { rate: 65, availability: 'Available' }, 'National Economy': { rate: 38, availability: 'Available' } } },
  { from: 'wlg', to: 'dud', speeds: { 'Regional Same Day': { rate: 195, availability: 'Unavailable' }, 'Regional Overnight': { rate: 95, availability: 'Possible' }, 'National Economy': { rate: 52, availability: 'Available' } } },
  // Christchurch routes
  { from: 'chc', to: 'akl', speeds: { 'Regional Same Day': { rate: 195, availability: 'Unavailable' }, 'Regional Overnight': { rate: 95, availability: 'Available' }, 'National Economy': { rate: 52, availability: 'Available' } } },
  { from: 'chc', to: 'wlg', speeds: { 'Regional Same Day': { rate: 120, availability: 'Possible' }, 'Regional Overnight': { rate: 65, availability: 'Available' }, 'National Economy': { rate: 38, availability: 'Available' } } },
  { from: 'chc', to: 'dud', speeds: { 'Regional Same Day': { rate: 85, availability: 'Available' }, 'Regional Overnight': { rate: 45, availability: 'Available' }, 'National Economy': { rate: 28, availability: 'Available' } } },
  { from: 'chc', to: 'zqn', speeds: { 'Regional Same Day': { rate: 110, availability: 'Possible' }, 'Regional Overnight': { rate: 58, availability: 'Available' }, 'National Economy': { rate: 35, availability: 'Available' } } },
  { from: 'chc', to: 'nsn', speeds: { 'Regional Same Day': { rate: 95, availability: 'Possible' }, 'Regional Overnight': { rate: 52, availability: 'Available' }, 'National Economy': { rate: 30, availability: 'Available' } } },
  // Dunedin routes
  { from: 'dud', to: 'chc', speeds: { 'Regional Same Day': { rate: 85, availability: 'Available' }, 'Regional Overnight': { rate: 45, availability: 'Available' }, 'National Economy': { rate: 28, availability: 'Available' } } },
  { from: 'dud', to: 'zqn', speeds: { 'Regional Same Day': { rate: 65, availability: 'Available' }, 'Regional Overnight': { rate: 35, availability: 'Available' }, 'National Economy': { rate: 22, availability: 'Available' } } },
  { from: 'dud', to: 'akl', speeds: { 'Regional Same Day': { rate: 250, availability: 'Unavailable' }, 'Regional Overnight': { rate: 130, availability: 'Possible' }, 'National Economy': { rate: 65, availability: 'Available' } } },
]

// ── International Destinations ──
export interface InternationalDestination {
  id: string
  city: string
  country: string
  region: 'australia' | 'asia-pacific' | 'americas' | 'europe'
}

export const internationalDestinations: InternationalDestination[] = [
  // Australia
  { id: 'syd', city: 'Sydney', country: 'Australia', region: 'australia' },
  { id: 'mel', city: 'Melbourne', country: 'Australia', region: 'australia' },
  { id: 'bne', city: 'Brisbane', country: 'Australia', region: 'australia' },
  { id: 'per', city: 'Perth', country: 'Australia', region: 'australia' },
  // Asia-Pacific
  { id: 'sin', city: 'Singapore', country: 'Singapore', region: 'asia-pacific' },
  { id: 'hkg', city: 'Hong Kong', country: 'Hong Kong', region: 'asia-pacific' },
  { id: 'tyo', city: 'Tokyo', country: 'Japan', region: 'asia-pacific' },
  { id: 'bkk', city: 'Bangkok', country: 'Thailand', region: 'asia-pacific' },
  // Americas
  { id: 'lax', city: 'Los Angeles', country: 'USA', region: 'americas' },
  { id: 'sfo', city: 'San Francisco', country: 'USA', region: 'americas' },
  // Europe
  { id: 'lhr', city: 'London', country: 'UK', region: 'europe' },
  { id: 'fra', city: 'Frankfurt', country: 'Germany', region: 'europe' },
]

export interface InternationalRate {
  destinationId: string
  speeds: Record<string, { rate: number; availability: 'Available' | 'Possible' | 'Unavailable' }>
}

export const internationalRates: InternationalRate[] = [
  { destinationId: 'syd', speeds: { 'International Express': { rate: 85, availability: 'Available' }, 'International Standard': { rate: 45, availability: 'Available' }, 'International Economy': { rate: 28, availability: 'Available' } } },
  { destinationId: 'mel', speeds: { 'International Express': { rate: 92, availability: 'Available' }, 'International Standard': { rate: 48, availability: 'Available' }, 'International Economy': { rate: 30, availability: 'Available' } } },
  { destinationId: 'bne', speeds: { 'International Express': { rate: 88, availability: 'Available' }, 'International Standard': { rate: 46, availability: 'Available' }, 'International Economy': { rate: 29, availability: 'Available' } } },
  { destinationId: 'per', speeds: { 'International Express': { rate: 110, availability: 'Available' }, 'International Standard': { rate: 58, availability: 'Available' }, 'International Economy': { rate: 35, availability: 'Available' } } },
  { destinationId: 'sin', speeds: { 'International Express': { rate: 165, availability: 'Available' }, 'International Standard': { rate: 95, availability: 'Available' }, 'International Economy': { rate: 55, availability: 'Available' } } },
  { destinationId: 'hkg', speeds: { 'International Express': { rate: 175, availability: 'Available' }, 'International Standard': { rate: 98, availability: 'Available' }, 'International Economy': { rate: 58, availability: 'Available' } } },
  { destinationId: 'tyo', speeds: { 'International Express': { rate: 185, availability: 'Available' }, 'International Standard': { rate: 105, availability: 'Available' }, 'International Economy': { rate: 62, availability: 'Available' } } },
  { destinationId: 'bkk', speeds: { 'International Express': { rate: 170, availability: 'Available' }, 'International Standard': { rate: 92, availability: 'Available' }, 'International Economy': { rate: 52, availability: 'Available' } } },
  { destinationId: 'lax', speeds: { 'International Express': { rate: 245, availability: 'Available' }, 'International Standard': { rate: 145, availability: 'Available' }, 'International Economy': { rate: 85, availability: 'Available' } } },
  { destinationId: 'sfo', speeds: { 'International Express': { rate: 255, availability: 'Available' }, 'International Standard': { rate: 150, availability: 'Available' }, 'International Economy': { rate: 88, availability: 'Available' } } },
  { destinationId: 'lhr', speeds: { 'International Express': { rate: 295, availability: 'Available' }, 'International Standard': { rate: 175, availability: 'Available' }, 'International Economy': { rate: 98, availability: 'Available' } } },
  { destinationId: 'fra', speeds: { 'International Express': { rate: 285, availability: 'Available' }, 'International Standard': { rate: 170, availability: 'Available' }, 'International Economy': { rate: 95, availability: 'Available' } } },
]

// ── Clients ──
export const clients: Client[] = [
  { id: 1, code: 'PFNZ', name: 'Pfizer New Zealand', siteId: 1, homeSuburbId: 1, homeSuburbName: 'Auckland Central', standardRate: 15.00, vanRate: 22.00, economyActive: false, economyRuns: false, ppdRate: 3.50 },
  { id: 2, code: 'FISH', name: 'Fisher & Paykel Healthcare', siteId: 1, homeSuburbId: 14, homeSuburbName: 'Ellerslie', standardRate: 14.00, vanRate: 20.00, economyActive: true, economyRuns: true, ppdRate: 3.00 },
  { id: 3, code: 'EBOS', name: 'EBOS Group', siteId: 1, homeSuburbId: 12, homeSuburbName: 'Penrose', standardRate: 13.50, vanRate: 19.50, economyActive: true, economyRuns: true, ppdRate: 2.80 },
  { id: 4, code: 'DGPH', name: 'Douglas Pharmaceuticals', siteId: 1, homeSuburbId: 1, homeSuburbName: 'Auckland Central', standardRate: 14.50, vanRate: 21.00, economyActive: true, economyRuns: false, ppdRate: 3.20 },
  { id: 5, code: 'MEDI', name: 'Medisurg NZ', siteId: 1, homeSuburbId: 5, homeSuburbName: 'Newmarket', standardRate: 13.00, vanRate: 19.00, economyActive: true, economyRuns: true, ppdRate: 2.60 },
  { id: 6, code: 'NZBL', name: 'NZ Blood Service', siteId: 1, homeSuburbId: 3, homeSuburbName: 'Mt Eden', standardRate: 16.00, vanRate: 24.00, economyActive: false, economyRuns: false, ppdRate: null },
  { id: 7, code: 'BXNZ', name: 'Baxter Healthcare NZ', siteId: 1, homeSuburbId: 8, homeSuburbName: 'Parnell', standardRate: 14.00, vanRate: 20.50, economyActive: true, economyRuns: false, ppdRate: 3.00 },
  { id: 8, code: 'SMNZ', name: 'Smith & Nephew NZ', siteId: 1, homeSuburbId: 12, homeSuburbName: 'Penrose', standardRate: 13.50, vanRate: 19.00, economyActive: true, economyRuns: true, ppdRate: 2.80 },
  { id: 9, code: 'ABBV', name: 'AbbVie New Zealand', siteId: 1, homeSuburbId: 1, homeSuburbName: 'Auckland Central', standardRate: 15.50, vanRate: 22.50, economyActive: true, economyRuns: false, ppdRate: 3.40 },
  { id: 10, code: 'AKLH', name: 'Auckland DHB Pharmacy', siteId: 1, homeSuburbId: 9, homeSuburbName: 'Ponsonby', standardRate: 12.50, vanRate: 18.00, economyActive: true, economyRuns: true, ppdRate: 2.40 },
  { id: 11, code: 'GRNX', name: 'Green Cross Health', siteId: 1, homeSuburbId: 5, homeSuburbName: 'Newmarket', standardRate: 11.50, vanRate: 17.00, economyActive: true, economyRuns: true, ppdRate: 2.20 },
  { id: 12, code: 'PROH', name: 'ProHealth Medical Supplies', siteId: 1, homeSuburbId: 15, homeSuburbName: 'Onehunga', standardRate: 12.00, vanRate: 17.50, economyActive: true, economyRuns: false, ppdRate: 2.00 },
  { id: 13, code: 'ROCH', name: 'Roche NZ (Prospect)', siteId: 1, homeSuburbId: 1, homeSuburbName: 'Auckland Central', standardRate: 14.00, vanRate: 20.00, economyActive: true, economyRuns: true, ppdRate: 3.00 },
  { id: 14, code: 'MRKN', name: 'Merck Sharp & Dohme NZ (Prospect)', siteId: 1, homeSuburbId: 3, homeSuburbName: 'Mt Eden', standardRate: 15.00, vanRate: 21.50, economyActive: true, economyRuns: false, ppdRate: 3.20 },
  { id: 15, code: 'NOVN', name: 'Novartis NZ (Prospect)', siteId: 1, homeSuburbId: 8, homeSuburbName: 'Parnell', standardRate: 14.50, vanRate: 21.00, economyActive: true, economyRuns: true, ppdRate: 3.10 },
  { id: 16, code: 'STRY', name: 'Stryker NZ (Prospect)', siteId: 1, homeSuburbId: 12, homeSuburbName: 'Penrose', standardRate: 15.50, vanRate: 23.00, economyActive: false, economyRuns: false, ppdRate: null },
  { id: 17, code: 'MDTK', name: 'Medtronic NZ (Prospect)', siteId: 1, homeSuburbId: 14, homeSuburbName: 'Ellerslie', standardRate: 16.00, vanRate: 24.00, economyActive: true, economyRuns: false, ppdRate: 3.50 },
]

// ── Job Types / Speeds ──
export const jobTypes: JobType[] = [
  // On-Demand
  { id: 1, name: '1 Hour', minutes: 60, sortOrder: 1, serviceGroup: 'on-demand' },
  { id: 2, name: '2 Hour', minutes: 120, sortOrder: 2, serviceGroup: 'on-demand' },
  { id: 3, name: '4 Hour', minutes: 240, sortOrder: 3, serviceGroup: 'on-demand' },
  { id: 4, name: 'Same Day', minutes: 480, sortOrder: 4, serviceGroup: 'on-demand' },
  { id: 8, name: 'Direct', minutes: null, sortOrder: 5, serviceGroup: 'on-demand' },
  // Scheduled
  { id: 5, name: 'Overnight', minutes: null, sortOrder: 10, serviceGroup: 'scheduled' },
  { id: 6, name: 'Economy', minutes: null, sortOrder: 11, serviceGroup: 'scheduled' },
  { id: 7, name: 'Economy Run', minutes: null, sortOrder: 12, serviceGroup: 'scheduled' },
  // Regional / National
  { id: 12, name: 'Regional Same Day', minutes: null, sortOrder: 23, serviceGroup: 'regional' },
  { id: 13, name: 'Regional Overnight', minutes: null, sortOrder: 24, serviceGroup: 'regional' },
  { id: 14, name: 'National Economy', minutes: null, sortOrder: 25, serviceGroup: 'regional' },
  // International
  { id: 15, name: 'International Express', minutes: null, sortOrder: 30, serviceGroup: 'international' },
  { id: 16, name: 'International Standard', minutes: null, sortOrder: 31, serviceGroup: 'international' },
  { id: 17, name: 'International Economy', minutes: null, sortOrder: 32, serviceGroup: 'international' },
]

// ── Suburbs (Auckland) ──
export const suburbs: Suburb[] = [
  { id: 1, name: 'Auckland Central', siteId: 1, zone: 1 },
  { id: 2, name: 'Grafton', siteId: 1, zone: 1 },
  { id: 3, name: 'Mt Eden', siteId: 1, zone: 1 },
  { id: 4, name: 'Epsom', siteId: 1, zone: 1 },
  { id: 5, name: 'Newmarket', siteId: 1, zone: 1 },
  { id: 6, name: 'Remuera', siteId: 1, zone: 1 },
  { id: 7, name: 'Grey Lynn', siteId: 1, zone: 1 },
  { id: 8, name: 'Parnell', siteId: 1, zone: 1 },
  { id: 9, name: 'Ponsonby', siteId: 1, zone: 1 },
  { id: 10, name: 'Mt Albert', siteId: 1, zone: 2 },
  { id: 11, name: 'Sandringham', siteId: 1, zone: 2 },
  { id: 12, name: 'Penrose', siteId: 1, zone: 2 },
  { id: 13, name: 'Mt Wellington', siteId: 1, zone: 2 },
  { id: 14, name: 'Ellerslie', siteId: 1, zone: 2 },
  { id: 15, name: 'Onehunga', siteId: 1, zone: 2 },
  { id: 16, name: 'Royal Oak', siteId: 1, zone: 2 },
  { id: 17, name: 'Three Kings', siteId: 1, zone: 2 },
  { id: 18, name: 'Greenlane', siteId: 1, zone: 2 },
  { id: 19, name: 'Meadowbank', siteId: 1, zone: 2 },
  { id: 20, name: 'St Johns', siteId: 1, zone: 2 },
  { id: 21, name: 'Glen Innes', siteId: 1, zone: 2 },
  { id: 22, name: 'Panmure', siteId: 1, zone: 2 },
  { id: 23, name: 'Otahuhu', siteId: 1, zone: 3 },
  { id: 24, name: 'Mangere', siteId: 1, zone: 3 },
  { id: 25, name: 'Manukau', siteId: 1, zone: 3 },
  { id: 26, name: 'Papatoetoe', siteId: 1, zone: 3 },
  { id: 27, name: 'East Tamaki', siteId: 1, zone: 3 },
  { id: 28, name: 'Botany', siteId: 1, zone: 3 },
  { id: 29, name: 'Pakuranga', siteId: 1, zone: 3 },
  { id: 30, name: 'Howick', siteId: 1, zone: 3 },
  { id: 31, name: 'Henderson', siteId: 1, zone: 3 },
  { id: 32, name: 'New Lynn', siteId: 1, zone: 3 },
  { id: 33, name: 'Avondale', siteId: 1, zone: 2 },
  { id: 34, name: 'Pt Chevalier', siteId: 1, zone: 2 },
  { id: 35, name: 'Westmere', siteId: 1, zone: 1 },
  { id: 36, name: 'Herne Bay', siteId: 1, zone: 1 },
  { id: 37, name: 'Freemans Bay', siteId: 1, zone: 1 },
  { id: 38, name: 'Takapuna', siteId: 1, zone: 3 },
  { id: 39, name: 'Albany', siteId: 1, zone: 4 },
  { id: 40, name: 'North Harbour', siteId: 1, zone: 4 },
  { id: 41, name: 'Devonport', siteId: 1, zone: 3 },
  { id: 42, name: 'Birkenhead', siteId: 1, zone: 3 },
  { id: 43, name: 'Northcote', siteId: 1, zone: 3 },
  { id: 44, name: 'Papakura', siteId: 1, zone: 4 },
  { id: 45, name: 'Pukekohe', siteId: 1, zone: 5 },
  { id: 46, name: 'Wairau Valley', siteId: 1, zone: 3 },
  { id: 47, name: 'Rosedale', siteId: 1, zone: 3 },
  { id: 48, name: 'Mt Roskill', siteId: 1, zone: 2 },
  { id: 49, name: 'Blockhouse Bay', siteId: 1, zone: 2 },
  { id: 50, name: 'Hillsborough', siteId: 1, zone: 2 },
]

// ── ZIP Codes (US — sample for demo) ──
export const zipCodes: ZipCode[] = [
  { id: 101, code: '10001', city: 'New York', state: 'NY', siteId: 2, zone: 1 },
  { id: 102, code: '10002', city: 'New York', state: 'NY', siteId: 2, zone: 1 },
  { id: 103, code: '10003', city: 'New York', state: 'NY', siteId: 2, zone: 1 },
  { id: 104, code: '10004', city: 'New York', state: 'NY', siteId: 2, zone: 1 },
  { id: 105, code: '10005', city: 'New York', state: 'NY', siteId: 2, zone: 1 },
  { id: 106, code: '10010', city: 'New York', state: 'NY', siteId: 2, zone: 1 },
  { id: 107, code: '10016', city: 'New York', state: 'NY', siteId: 2, zone: 1 },
  { id: 108, code: '10019', city: 'New York', state: 'NY', siteId: 2, zone: 1 },
  { id: 109, code: '10022', city: 'New York', state: 'NY', siteId: 2, zone: 1 },
  { id: 110, code: '10036', city: 'New York', state: 'NY', siteId: 2, zone: 1 },
  { id: 111, code: '11201', city: 'Brooklyn', state: 'NY', siteId: 2, zone: 2 },
  { id: 112, code: '11211', city: 'Brooklyn', state: 'NY', siteId: 2, zone: 2 },
  { id: 113, code: '11215', city: 'Brooklyn', state: 'NY', siteId: 2, zone: 2 },
  { id: 114, code: '10301', city: 'Staten Island', state: 'NY', siteId: 2, zone: 3 },
  { id: 115, code: '10451', city: 'Bronx', state: 'NY', siteId: 2, zone: 2 },
  { id: 116, code: '11101', city: 'Long Island City', state: 'NY', siteId: 2, zone: 2 },
  { id: 117, code: '07102', city: 'Newark', state: 'NJ', siteId: 2, zone: 3 },
  { id: 118, code: '07030', city: 'Hoboken', state: 'NJ', siteId: 2, zone: 2 },
  { id: 119, code: '10601', city: 'White Plains', state: 'NY', siteId: 2, zone: 3 },
  { id: 120, code: '11530', city: 'Garden City', state: 'NY', siteId: 2, zone: 3 },
  { id: 121, code: '06901', city: 'Stamford', state: 'CT', siteId: 2, zone: 4 },
  { id: 122, code: '08401', city: 'Atlantic City', state: 'NJ', siteId: 2, zone: 5 },
  { id: 123, code: '19101', city: 'Philadelphia', state: 'PA', siteId: 2, zone: 5 },
  { id: 124, code: '02101', city: 'Boston', state: 'MA', siteId: 2, zone: 6 },
  { id: 125, code: '20001', city: 'Washington', state: 'DC', siteId: 2, zone: 6 },
  { id: 126, code: '90210', city: 'Beverly Hills', state: 'CA', siteId: 3, zone: 1 },
  { id: 127, code: '90001', city: 'Los Angeles', state: 'CA', siteId: 3, zone: 1 },
  { id: 128, code: '90012', city: 'Los Angeles', state: 'CA', siteId: 3, zone: 1 },
  { id: 129, code: '90024', city: 'Los Angeles', state: 'CA', siteId: 3, zone: 1 },
  { id: 130, code: '90028', city: 'Hollywood', state: 'CA', siteId: 3, zone: 1 },
  { id: 131, code: '90045', city: 'Los Angeles', state: 'CA', siteId: 3, zone: 2 },
  { id: 132, code: '90066', city: 'Los Angeles', state: 'CA', siteId: 3, zone: 2 },
  { id: 133, code: '90401', city: 'Santa Monica', state: 'CA', siteId: 3, zone: 2 },
  { id: 134, code: '91101', city: 'Pasadena', state: 'CA', siteId: 3, zone: 2 },
  { id: 135, code: '91301', city: 'Agoura Hills', state: 'CA', siteId: 3, zone: 3 },
  { id: 136, code: '92101', city: 'San Diego', state: 'CA', siteId: 3, zone: 5 },
  { id: 137, code: '94102', city: 'San Francisco', state: 'CA', siteId: 3, zone: 6 },
  { id: 138, code: '60601', city: 'Chicago', state: 'IL', siteId: 4, zone: 1 },
  { id: 139, code: '60602', city: 'Chicago', state: 'IL', siteId: 4, zone: 1 },
  { id: 140, code: '60611', city: 'Chicago', state: 'IL', siteId: 4, zone: 1 },
]

// ── Top ZIP Destinations per Client ──
export const topZipDestinations: Record<number, TopZipDestination[]> = {
  // Example: no client has ZIP-based top destinations yet — wired up per-client when real data is available
}

// ── Top Destinations per Client ──
export const topDestinations: Record<number, TopDestination[]> = {
  1: [
    { suburbId: 2, suburbName: 'Grafton', jobCount: 1890 },
    { suburbId: 1, suburbName: 'Auckland Central', jobCount: 1456 },
    { suburbId: 5, suburbName: 'Newmarket', jobCount: 987 },
    { suburbId: 18, suburbName: 'Greenlane', jobCount: 876 },
    { suburbId: 12, suburbName: 'Penrose', jobCount: 745 },
    { suburbId: 8, suburbName: 'Parnell', jobCount: 623 },
    { suburbId: 3, suburbName: 'Mt Eden', jobCount: 534 },
    { suburbId: 6, suburbName: 'Remuera', jobCount: 489 },
    { suburbId: 14, suburbName: 'Ellerslie', jobCount: 412 },
    { suburbId: 38, suburbName: 'Takapuna', jobCount: 387 },
    { suburbId: 25, suburbName: 'Manukau', jobCount: 356 },
    { suburbId: 9, suburbName: 'Ponsonby', jobCount: 298 },
    { suburbId: 13, suburbName: 'Mt Wellington', jobCount: 267 },
    { suburbId: 27, suburbName: 'East Tamaki', jobCount: 234 },
    { suburbId: 15, suburbName: 'Onehunga', jobCount: 198 },
    { suburbId: 7, suburbName: 'Grey Lynn', jobCount: 176 },
    { suburbId: 28, suburbName: 'Botany', jobCount: 154 },
    { suburbId: 39, suburbName: 'Albany', jobCount: 132 },
    { suburbId: 4, suburbName: 'Epsom', jobCount: 121 },
    { suburbId: 10, suburbName: 'Mt Albert', jobCount: 98 },
  ],
  3: [
    { suburbId: 12, suburbName: 'Penrose', jobCount: 2340 },
    { suburbId: 27, suburbName: 'East Tamaki', jobCount: 1870 },
    { suburbId: 1, suburbName: 'Auckland Central', jobCount: 1560 },
    { suburbId: 25, suburbName: 'Manukau', jobCount: 1230 },
    { suburbId: 13, suburbName: 'Mt Wellington', jobCount: 980 },
    { suburbId: 2, suburbName: 'Grafton', jobCount: 876 },
    { suburbId: 5, suburbName: 'Newmarket', jobCount: 765 },
    { suburbId: 14, suburbName: 'Ellerslie', jobCount: 654 },
    { suburbId: 38, suburbName: 'Takapuna', jobCount: 543 },
    { suburbId: 23, suburbName: 'Otahuhu', jobCount: 432 },
    { suburbId: 15, suburbName: 'Onehunga', jobCount: 398 },
    { suburbId: 28, suburbName: 'Botany', jobCount: 367 },
    { suburbId: 8, suburbName: 'Parnell', jobCount: 345 },
    { suburbId: 18, suburbName: 'Greenlane', jobCount: 312 },
    { suburbId: 3, suburbName: 'Mt Eden', jobCount: 287 },
    { suburbId: 22, suburbName: 'Panmure', jobCount: 265 },
    { suburbId: 29, suburbName: 'Pakuranga', jobCount: 243 },
    { suburbId: 39, suburbName: 'Albany', jobCount: 221 },
    { suburbId: 40, suburbName: 'North Harbour', jobCount: 198 },
    { suburbId: 31, suburbName: 'Henderson', jobCount: 176 },
    { suburbId: 26, suburbName: 'Papatoetoe', jobCount: 154 },
    { suburbId: 24, suburbName: 'Mangere', jobCount: 132 },
    { suburbId: 30, suburbName: 'Howick', jobCount: 110 },
    { suburbId: 44, suburbName: 'Papakura', jobCount: 87 },
    { suburbId: 9, suburbName: 'Ponsonby', jobCount: 65 },
  ],
  2: [
    { suburbId: 14, suburbName: 'Ellerslie', jobCount: 3200 },
    { suburbId: 27, suburbName: 'East Tamaki', jobCount: 1890 },
    { suburbId: 2, suburbName: 'Grafton', jobCount: 1560 },
    { suburbId: 1, suburbName: 'Auckland Central', jobCount: 1230 },
    { suburbId: 12, suburbName: 'Penrose', jobCount: 987 },
    { suburbId: 25, suburbName: 'Manukau', jobCount: 876 },
    { suburbId: 38, suburbName: 'Takapuna', jobCount: 654 },
    { suburbId: 5, suburbName: 'Newmarket', jobCount: 543 },
    { suburbId: 18, suburbName: 'Greenlane', jobCount: 432 },
    { suburbId: 13, suburbName: 'Mt Wellington', jobCount: 321 },
    { suburbId: 8, suburbName: 'Parnell', jobCount: 298 },
    { suburbId: 28, suburbName: 'Botany', jobCount: 265 },
    { suburbId: 39, suburbName: 'Albany', jobCount: 243 },
    { suburbId: 3, suburbName: 'Mt Eden', jobCount: 198 },
    { suburbId: 15, suburbName: 'Onehunga', jobCount: 176 },
  ],
}

// ── Rate Generation (mock) ──
export function generateMockRates(
  clientId: number,
  fromSuburbId: number,
  destinationSuburbIds: number[],
  jobTypeIds: number[],
  options: {
    includeGst: boolean
    includeFuelSurcharge: boolean
    markup: number
    includePpd: boolean
  }
): RateItem[] {
  const client = clients.find(c => c.id === clientId)
  if (!client) return []

  const fromSuburb = suburbs.find(s => s.id === fromSuburbId)
  if (!fromSuburb) return []

  const items: RateItem[] = []

  for (const destId of destinationSuburbIds) {
    const dest = suburbs.find(s => s.id === destId)
    if (!dest) continue

    for (const jtId of jobTypeIds) {
      const jt = jobTypes.find(j => j.id === jtId)
      if (!jt) continue
      // Skip regional/international job types in suburb-based generation
      if (jt.serviceGroup === 'regional' || jt.serviceGroup === 'international') continue

      const zoneDiff = Math.abs(dest.zone - fromSuburb.zone)
      let baseRate = client.standardRate
      if (jt.id === 1) baseRate *= 2.5
      else if (jt.id === 2) baseRate *= 1.8
      else if (jt.id === 3) baseRate *= 1.3
      else if (jt.id === 4) baseRate *= 1.0
      else if (jt.id === 5) baseRate *= 0.7
      else if (jt.id === 6) baseRate *= 0.5
      else if (jt.id === 7) baseRate *= 0.45
      else if (jt.id === 8) baseRate *= 3.0

      baseRate += zoneDiff * 3.5

      let availability: RateItem['availability'] = 'Available'
      if (zoneDiff >= 4 && jt.id === 1) availability = 'Unavailable'
      else if (zoneDiff >= 3 && jt.id === 1) availability = 'Possible'
      else if (zoneDiff >= 4 && jt.id === 2) availability = 'Possible'
      else if (zoneDiff >= 5) availability = 'Unavailable'

      if ((jt.id === 6 && !client.economyActive) || (jt.id === 7 && !client.economyRuns)) {
        availability = 'Unavailable'
      }

      if (options.markup > 0) baseRate *= (1 + options.markup / 100)
      if (options.includeFuelSurcharge) baseRate *= 1.08
      if (options.includePpd && client.ppdRate) baseRate += client.ppdRate
      if (options.includeGst) baseRate *= 1.15

      items.push({
        toSuburbId: destId,
        toSuburbName: dest.name,
        jobTypeId: jt.id,
        speedName: jt.name,
        minutes: jt.minutes,
        rate: Math.round(baseRate * 100) / 100,
        availability,
      })
    }
  }

  return items
}

// ── Regional Rate Generation ──
export function generateRegionalRates(
  _clientId: number,
  jobTypeIds: number[],
  options: { includeGst: boolean; includeFuelSurcharge: boolean; markup: number; chargeableWeight?: number; numberOfItems?: number }
): { from: string; to: string; speedName: string; rate: number; availability: 'Available' | 'Possible' | 'Unavailable' }[] {
  const regionalSpeedIds = new Set(jobTypes.filter(j => j.serviceGroup === 'regional').map(j => j.id))
  const selectedRegional = jobTypeIds.filter(id => regionalSpeedIds.has(id))
  if (selectedRegional.length === 0) return []

  const speedNames = selectedRegional.map(id => jobTypes.find(j => j.id === id)!.name)
  const items: { from: string; to: string; speedName: string; rate: number; availability: 'Available' | 'Possible' | 'Unavailable' }[] = []

  for (const route of regionalRoutes) {
    for (const speedName of speedNames) {
      const data = route.speeds[speedName]
      if (!data) continue
      let rate = data.rate
      // Weight-based pricing: base rate is for 1kg, scale with chargeable weight
      const cw = options.chargeableWeight ?? 1
      const items_count = options.numberOfItems ?? 1
      if (cw > 1) {
        // Diminishing per-kg surcharge: first 5kg at full rate, 5-10kg at 80%, 10-25kg at 60%, 25+kg at 40%
        let weightSurcharge = 0
        const extra = cw - 1
        if (extra <= 4) weightSurcharge = extra * rate * 0.12
        else if (extra <= 9) weightSurcharge = 4 * rate * 0.12 + (extra - 4) * rate * 0.096
        else if (extra <= 24) weightSurcharge = 4 * rate * 0.12 + 5 * rate * 0.096 + (extra - 9) * rate * 0.072
        else weightSurcharge = 4 * rate * 0.12 + 5 * rate * 0.096 + 15 * rate * 0.072 + (extra - 24) * rate * 0.048
        rate += weightSurcharge
      }
      rate *= items_count
      if (options.markup > 0) rate *= (1 + options.markup / 100)
      if (options.includeFuelSurcharge) rate *= 1.08
      if (options.includeGst) rate *= 1.15
      items.push({ from: route.from, to: route.to, speedName, rate: Math.round(rate * 100) / 100, availability: data.availability })
    }
  }

  return items
}

// ── International Rate Generation ──
export function generateInternationalRates(
  _clientId: number,
  jobTypeIds: number[],
  options: { includeGst: boolean; includeFuelSurcharge: boolean; markup: number; chargeableWeight?: number; numberOfItems?: number }
): { destinationId: string; city: string; country: string; speedName: string; rate: number; availability: 'Available' | 'Possible' | 'Unavailable' }[] {
  const intlSpeedIds = new Set(jobTypes.filter(j => j.serviceGroup === 'international').map(j => j.id))
  const selectedIntl = jobTypeIds.filter(id => intlSpeedIds.has(id))
  if (selectedIntl.length === 0) return []

  const speedNames = selectedIntl.map(id => jobTypes.find(j => j.id === id)!.name)
  const items: { destinationId: string; city: string; country: string; speedName: string; rate: number; availability: 'Available' | 'Possible' | 'Unavailable' }[] = []

  for (const ir of internationalRates) {
    const dest = internationalDestinations.find(d => d.id === ir.destinationId)
    if (!dest) continue
    for (const speedName of speedNames) {
      const data = ir.speeds[speedName]
      if (!data) continue
      let rate = data.rate
      const cw = options.chargeableWeight ?? 1
      const items_count = options.numberOfItems ?? 1
      if (cw > 1) {
        let weightSurcharge = 0
        const extra = cw - 1
        if (extra <= 4) weightSurcharge = extra * rate * 0.15
        else if (extra <= 9) weightSurcharge = 4 * rate * 0.15 + (extra - 4) * rate * 0.12
        else if (extra <= 24) weightSurcharge = 4 * rate * 0.15 + 5 * rate * 0.12 + (extra - 9) * rate * 0.09
        else weightSurcharge = 4 * rate * 0.15 + 5 * rate * 0.12 + 15 * rate * 0.09 + (extra - 24) * rate * 0.06
        rate += weightSurcharge
      }
      rate *= items_count
      if (options.markup > 0) rate *= (1 + options.markup / 100)
      if (options.includeFuelSurcharge) rate *= 1.08
      if (options.includeGst) rate *= 1.15
      items.push({ destinationId: ir.destinationId, city: dest.city, country: dest.country, speedName, rate: Math.round(rate * 100) / 100, availability: data.availability })
    }
  }

  return items
}

// ── Generic Rate Generation for uploaded/custom locations ──
export function generateRatesForUploadedLocations(
  client: Client,
  fromLocationId: number,
  destinationIds: number[],
  jobTypeIds: number[],
  options: {
    includeGst: boolean
    includeFuelSurcharge: boolean
    markup: number
    includePpd: boolean
  },
  locations?: { id: number; name: string; zone: number; siteId: number }[]
): RateItem[] {
  // Fall back to zip codes if no uploaded locations provided
  const allLocs = locations ?? zipCodes.map(z => ({ id: z.id, name: `${z.code} — ${z.city}, ${z.state}`, zone: z.zone, siteId: z.siteId }))
  const fromLoc = allLocs.find(l => l.id === fromLocationId)
  const fromZone = fromLoc?.zone ?? 1

  const items: RateItem[] = []

  for (const destId of destinationIds) {
    const dest = allLocs.find(l => l.id === destId)
    if (!dest) continue

    for (const jtId of jobTypeIds) {
      const jt = jobTypes.find(j => j.id === jtId)
      if (!jt) continue
      if (jt.serviceGroup === 'regional' || jt.serviceGroup === 'international') continue

      const zoneDiff = Math.abs(dest.zone - fromZone)
      let baseRate = client.standardRate
      if (jt.id === 1) baseRate *= 2.5
      else if (jt.id === 2) baseRate *= 1.8
      else if (jt.id === 3) baseRate *= 1.3
      else if (jt.id === 4) baseRate *= 1.0
      else if (jt.id === 5) baseRate *= 0.7
      else if (jt.id === 6) baseRate *= 0.5
      else if (jt.id === 7) baseRate *= 0.45
      else if (jt.id === 8) baseRate *= 3.0

      baseRate += zoneDiff * 3.5

      let availability: RateItem['availability'] = 'Available'
      if (zoneDiff >= 4 && jt.id === 1) availability = 'Unavailable'
      else if (zoneDiff >= 3 && jt.id === 1) availability = 'Possible'
      else if (zoneDiff >= 4 && jt.id === 2) availability = 'Possible'
      else if (zoneDiff >= 5) availability = 'Unavailable'

      if ((jt.id === 6 && !client.economyActive) || (jt.id === 7 && !client.economyRuns)) {
        availability = 'Unavailable'
      }

      if (options.markup > 0) baseRate *= (1 + options.markup / 100)
      if (options.includeFuelSurcharge) baseRate *= 1.08
      if (options.includePpd && client.ppdRate) baseRate += client.ppdRate
      if (options.includeGst) baseRate *= 1.15

      items.push({
        toSuburbId: destId,
        toSuburbName: dest.name,
        jobTypeId: jt.id,
        speedName: jt.name,
        minutes: jt.minutes,
        rate: Math.round(baseRate * 100) / 100,
        availability,
      })
    }
  }

  return items
}

// ── ZIP Code Rate Generation (mock — same zone-based logic as suburbs) ──
export function generateMockRatesForZips(
  clientId: number,
  fromZipId: number,
  destinationZipIds: number[],
  jobTypeIds: number[],
  options: {
    includeGst: boolean
    includeFuelSurcharge: boolean
    markup: number
    includePpd: boolean
  }
): RateItem[] {
  const client = clients.find(c => c.id === clientId)
  if (!client) return []

  const fromZip = zipCodes.find(z => z.id === fromZipId)
  if (!fromZip) return []

  const items: RateItem[] = []

  for (const destId of destinationZipIds) {
    const dest = zipCodes.find(z => z.id === destId)
    if (!dest) continue

    for (const jtId of jobTypeIds) {
      const jt = jobTypes.find(j => j.id === jtId)
      if (!jt) continue
      if (jt.serviceGroup === 'regional' || jt.serviceGroup === 'international') continue

      const zoneDiff = Math.abs(dest.zone - fromZip.zone)
      let baseRate = client.standardRate
      if (jt.id === 1) baseRate *= 2.5
      else if (jt.id === 2) baseRate *= 1.8
      else if (jt.id === 3) baseRate *= 1.3
      else if (jt.id === 4) baseRate *= 1.0
      else if (jt.id === 5) baseRate *= 0.7
      else if (jt.id === 6) baseRate *= 0.5
      else if (jt.id === 7) baseRate *= 0.45
      else if (jt.id === 8) baseRate *= 3.0

      baseRate += zoneDiff * 3.5

      let availability: RateItem['availability'] = 'Available'
      if (zoneDiff >= 4 && jt.id === 1) availability = 'Unavailable'
      else if (zoneDiff >= 3 && jt.id === 1) availability = 'Possible'
      else if (zoneDiff >= 4 && jt.id === 2) availability = 'Possible'
      else if (zoneDiff >= 5) availability = 'Unavailable'

      if ((jt.id === 6 && !client.economyActive) || (jt.id === 7 && !client.economyRuns)) {
        availability = 'Unavailable'
      }

      if (options.markup > 0) baseRate *= (1 + options.markup / 100)
      if (options.includeFuelSurcharge) baseRate *= 1.08
      if (options.includePpd && client.ppdRate) baseRate += client.ppdRate
      if (options.includeGst) baseRate *= 1.15

      items.push({
        toSuburbId: destId,
        toSuburbName: `${dest.code} — ${dest.city}, ${dest.state}`,
        jobTypeId: jt.id,
        speedName: jt.name,
        minutes: jt.minutes,
        rate: Math.round(baseRate * 100) / 100,
        availability,
      })
    }
  }

  return items
}
