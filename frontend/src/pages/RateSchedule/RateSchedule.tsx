import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Search, Download, Printer, FileText, ChevronDown, ChevronUp, Check, X, Zap, Package, Upload, AlertTriangle, Trash2, Users, UserPlus } from 'lucide-react'
import {
  clients, jobTypes, suburbs, topDestinations,
  zipCodes, topZipDestinations,
  generateMockRates, generateMockRatesForZips, generateRatesForUploadedLocations, generateRegionalRates, generateInternationalRates,
  serviceGroupLabels, locationModeLabels, regionalCities,
  internationalDestinations,
  type Client, type RateItem, type ServiceGroup, type LocationMode, type ZipCode,
} from './mockData'

// ── Helpers ──
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

// ── CSV Parser ──
// Handles quoted fields, commas inside quotes, and \r\n line endings
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++ // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(field.trim())
        field = ''
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        row.push(field.trim())
        if (row.some(f => f.length > 0)) rows.push(row)
        row = []
        field = ''
        if (ch === '\r') i++ // skip \n in \r\n
      } else {
        field += ch
      }
    }
  }
  // Last field/row
  row.push(field.trim())
  if (row.some(f => f.length > 0)) rows.push(row)

  return rows
}

// ── Uploaded Location Type ──
export interface UploadedLocation {
  id: number
  name: string      // display name (suburb, city, or "ZIP — City, ST")
  code?: string     // ZIP/postal code if applicable
  zone: number
  siteId: number
  region?: string   // state, region, area — optional grouping
}

interface UploadParseResult {
  locations: UploadedLocation[]
  errors: string[]
  mode: LocationMode | 'custom'
}

// Detect column mapping from headers
function detectColumns(headers: string[]): { name: number; code: number; zone: number; region: number; site: number } | null {
  const h = headers.map(s => s.toLowerCase().replace(/[^a-z0-9]/g, ''))
  const find = (candidates: string[]) => h.findIndex(col => candidates.some(c => col.includes(c)))

  const name = find(['suburb', 'town', 'city', 'location', 'area', 'destination', 'name'])
  const code = find(['zip', 'zipcode', 'postal', 'postcode', 'code'])
  const zone = find(['zone', 'tier', 'band', 'area'])
  const region = find(['state', 'region', 'province', 'county', 'district'])
  const site = find(['site', 'siteid', 'depot', 'hub', 'branch'])

  // Must have at least name or code
  if (name === -1 && code === -1) return null
  return { name, code, zone: zone !== name ? zone : -1, region: region !== name ? region : -1, site }
}

function parseUploadedFile(text: string): UploadParseResult {
  const rows = parseCSV(text)
  if (rows.length < 2) return { locations: [], errors: ['File is empty or has no data rows'], mode: 'custom' }

  const headers = rows[0]
  const cols = detectColumns(headers)
  if (!cols) return { locations: [], errors: [`Could not detect columns. Need at least one of: Suburb/Town/City/Location, or ZIP/Postal Code. Found headers: ${headers.join(', ')}`], mode: 'custom' }

  const locations: UploadedLocation[] = []
  const errors: string[] = []
  const hasZipCol = cols.code !== -1

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const lineNum = i + 1

    const nameVal = cols.name !== -1 ? (row[cols.name] ?? '').trim() : ''
    const codeVal = cols.code !== -1 ? (row[cols.code] ?? '').trim() : ''
    const zoneVal = cols.zone !== -1 ? (row[cols.zone] ?? '').trim() : ''
    const regionVal = cols.region !== -1 ? (row[cols.region] ?? '').trim() : ''
    const siteVal = cols.site !== -1 ? (row[cols.site] ?? '').trim() : ''

    // Skip empty rows
    if (!nameVal && !codeVal) continue

    // Build display name
    let displayName = ''
    if (hasZipCol && codeVal) {
      displayName = nameVal ? `${codeVal} — ${nameVal}${regionVal ? `, ${regionVal}` : ''}` : codeVal
    } else {
      displayName = nameVal
    }

    if (!displayName) {
      errors.push(`Row ${lineNum}: No name or code found`)
      continue
    }

    const zone = zoneVal ? parseInt(zoneVal, 10) : 1
    if (zoneVal && isNaN(zone)) {
      errors.push(`Row ${lineNum}: Invalid zone "${zoneVal}" — defaulting to 1`)
    }

    locations.push({
      id: 10000 + i,
      name: displayName,
      code: codeVal || undefined,
      zone: isNaN(zone) ? 1 : zone,
      siteId: siteVal ? (parseInt(siteVal, 10) || 1) : 1,
      region: regionVal || undefined,
    })
  }

  const mode: LocationMode | 'custom' = hasZipCol ? 'zipcodes' : 'suburbs'
  return { locations, errors, mode }
}

// ── Upload Panel Component ──
function LocationUpload({ onUpload, onClear, uploadedCount }: {
  onUpload: (locations: UploadedLocation[], mode: LocationMode) => void
  onClear: () => void
  uploadedCount: number
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [showErrors, setShowErrors] = useState(false)

  const processFile = useCallback((file: File) => {
    setErrors([])
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (!text) {
        setErrors(['Could not read file'])
        return
      }
      const result = parseUploadedFile(text)
      if (result.locations.length === 0) {
        setErrors(result.errors.length > 0 ? result.errors : ['No valid locations found in file'])
        return
      }
      if (result.errors.length > 0) {
        setErrors(result.errors)
      }
      const mode: LocationMode = result.mode === 'zipcodes' ? 'zipcodes' : 'suburbs'
      onUpload(result.locations, mode)
    }
    reader.readAsText(file)
  }, [onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    if (fileRef.current) fileRef.current.value = '' // allow re-upload of same file
  }, [processFile])

  return (
    <div className="space-y-2">
      {uploadedCount === 0 ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all',
            dragOver
              ? 'border-[#3bc7f4] bg-[#3bc7f4]/5'
              : 'border-[#cfced5] hover:border-[#9e9da8] hover:bg-[#f8f7f7]'
          )}
        >
          <Upload size={20} className="mx-auto mb-1.5 text-[#9e9da8]" />
          <p className="text-sm font-medium text-[#0d0c2c]">Upload location data</p>
          <p className="text-xs text-[#9e9da8] mt-0.5">CSV or TXT — drag & drop or click to browse</p>
          <p className="text-xs text-[#9e9da8] mt-1">Columns: <span className="font-mono">Suburb/City/Location</span>, <span className="font-mono">ZIP/Postal Code</span>, <span className="font-mono">Zone</span> (optional), <span className="font-mono">State/Region</span> (optional)</p>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#d0f1e0]/50 border border-[#d0f1e0]">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-[#2a9d6a]" />
            <span className="text-sm font-medium text-[#0d0c2c]">{uploadedCount} locations loaded</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-[#3bc7f4] hover:text-[#0d0c2c] font-medium transition-colors"
            >
              Replace
            </button>
            <span className="text-[#cfced5]">|</span>
            <button
              onClick={() => { onClear(); setErrors([]) }}
              className="text-xs text-[#e0475b] hover:text-[#c43a4e] font-medium transition-colors flex items-center gap-1"
            >
              <Trash2 size={10} /> Clear
            </button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFileSelect} />

      {errors.length > 0 && (
        <div>
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="flex items-center gap-1.5 text-xs text-[#d4880f] font-medium"
          >
            <AlertTriangle size={12} />
            {errors.length} warning{errors.length !== 1 ? 's' : ''}
            {showErrors ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showErrors && (
            <div className="mt-1 max-h-32 overflow-y-auto text-xs text-[#6e6d80] space-y-0.5 pl-5">
              {errors.map((err, i) => <div key={i}>• {err}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Client Search ──
function ClientSelector({ selected, onSelect }: { selected: Client | null; onSelect: (c: Client | null) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query) return clients
    const q = query.toLowerCase()
    return clients.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-semibold text-[#0d0c2c] mb-1.5">Client</label>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9da8]" />
        <input
          type="text"
          placeholder="Search by client name…"
          value={selected ? `${selected.name} (${selected.code})` : query}
          onChange={e => { setQuery(e.target.value); onSelect(null); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-[#cfced5] bg-white text-sm text-[#0d0c2c] placeholder:text-[#9e9da8] focus:outline-none focus:border-[#3bc7f4] focus:ring-2 focus:ring-[#3bc7f4]/20 transition-all"
        />
        {selected && (
          <button onClick={() => { onSelect(null); setQuery('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9da8] hover:text-[#0d0c2c]">
            <X size={14} />
          </button>
        )}
      </div>
      {open && !selected && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-[#cfced5] shadow-lg max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[#9e9da8]">No clients found</div>
          ) : filtered.map(c => (
            <button
              key={c.id}
              onClick={() => { onSelect(c); setQuery(''); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 hover:bg-[#f4f2f1] flex items-center justify-between transition-colors"
            >
              <span className="text-sm font-medium text-[#0d0c2c]">{c.name}</span>
              <span className="text-xs text-[#6e6d80] font-mono">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Toggle Pill ──
function TogglePill({ label, sublabel, checked, onChange }: { label: string; sublabel?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all',
        checked
          ? 'bg-[#3bc7f4]/10 border-[#3bc7f4] text-[#0d0c2c]'
          : 'bg-white border-[#cfced5] text-[#6e6d80] hover:border-[#9e9da8]'
      )}
    >
      {checked && <Check size={14} className="text-[#3bc7f4]" />}
      {label}
      {sublabel && <span className="text-xs text-[#9e9da8]">{sublabel}</span>}
    </button>
  )
}

// ── Toggle Switch ──
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'w-10 h-[22px] rounded-full relative transition-colors cursor-pointer',
          checked ? 'bg-[#3bc7f4]' : 'bg-[#cfced5]'
        )}
      >
        <div className={cn(
          'w-[18px] h-[18px] bg-white rounded-full absolute top-[2px] transition-all shadow-sm',
          checked ? 'left-[20px]' : 'left-[2px]'
        )} />
      </div>
      <span className="text-sm text-[#0d0c2c]">{label}</span>
    </label>
  )
}

// ── Select All / Deselect All ──
function BulkButtons({ onSelectAll, onDeselectAll }: { onSelectAll: () => void; onDeselectAll: () => void }) {
  return (
    <div className="flex gap-2">
      <button onClick={onSelectAll} className="text-xs text-[#3bc7f4] hover:text-[#0d0c2c] font-medium transition-colors">Select All</button>
      <span className="text-[#cfced5]">|</span>
      <button onClick={onDeselectAll} className="text-xs text-[#3bc7f4] hover:text-[#0d0c2c] font-medium transition-colors">Deselect All</button>
    </div>
  )
}

// ── Rate Cell ──
function RateCell({ rate, availability }: { rate: number; availability: string }) {
  const bg = availability === 'Available' ? 'bg-[#d0f1e0] text-[#0d0c2c]'
    : availability === 'Possible' ? 'bg-[#ffe6d1] text-[#0d0c2c]'
    : 'bg-[#f8d6da] text-[#6e6d80]'
  return (
    <td className="px-4 py-2.5 text-right">
      <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium', bg)}>
        {availability === 'Unavailable' ? 'N/A' : `$${rate.toFixed(2)}`}
      </span>
    </td>
  )
}

// ── Rate Creation Mode ──
type RateMode = 'existing' | 'prospect'

// ── Main Component ──
export default function RateSchedule() {
  // Mode
  const [rateMode, setRateMode] = useState<RateMode>('existing')

  // Client (existing mode)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Prospect info
  const [prospectName, setProspectName] = useState('')
  const [prospectContact, setProspectContact] = useState('')

  // Services
  const [selectedSpeeds, setSelectedSpeeds] = useState<Set<number>>(() => new Set(jobTypes.map(j => j.id)))
  const [activeGroupFilter, setActiveGroupFilter] = useState<ServiceGroup | 'all'>('all')

  // Location mode (prospect only — existing clients always use their loaded data)
  const [locationMode, setLocationMode] = useState<LocationMode>('suburbs')
  const [uploadedLocations, setUploadedLocations] = useState<UploadedLocation[]>([])

  // Destinations
  const [useTopDestinations, setUseTopDestinations] = useState(true)
  const [topCount, setTopCount] = useState<30 | 40 | 50 | 'all'>(30)
  const [selectedSuburbs, setSelectedSuburbs] = useState<Set<number>>(new Set())
  const [suburbSearch, setSuburbSearch] = useState('')

  // Options
  const [includeGst, setIncludeGst] = useState(true)
  const [includeFuel, setIncludeFuel] = useState(true)
  const [markup, setMarkup] = useState(0)
  const [includePpd, setIncludePpd] = useState(false)
  const [preparedFor, setPreparedFor] = useState('')
  const [fromSuburbOverride, setFromSuburbOverride] = useState<number | null>(null)

  // Package Details (regional/international)
  const [pkgWeight, setPkgWeight] = useState(1)
  const [pkgLength, setPkgLength] = useState(0)
  const [pkgWidth, setPkgWidth] = useState(0)
  const [pkgHeight, setPkgHeight] = useState(0)
  const [pkgItems, setPkgItems] = useState(1)
  const [pkgType, setPkgType] = useState<string>('Box')
  const [pkgPanelOpen, setPkgPanelOpen] = useState(true)

  const cubicWeight = useMemo(() => {
    if (pkgLength > 0 && pkgWidth > 0 && pkgHeight > 0) {
      return (pkgLength * pkgWidth * pkgHeight) / 5000
    }
    return 0
  }, [pkgLength, pkgWidth, pkgHeight])

  const chargeableWeight = useMemo(() => Math.max(pkgWeight, cubicWeight), [pkgWeight, cubicWeight])

  // Results
  const [rateItems, setRateItems] = useState<RateItem[]>([])
  const [regionalItems, setRegionalItems] = useState<ReturnType<typeof generateRegionalRates>>([])
  const [internationalItems, setInternationalItems] = useState<ReturnType<typeof generateInternationalRates>>([])
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState<ServiceGroup | null>(null)

  // Service groups
  const serviceGroups: ServiceGroup[] = ['on-demand', 'scheduled', 'regional', 'international']
  const jobTypesByGroup = useMemo(() => {
    const map = new Map<ServiceGroup, typeof jobTypes>()
    for (const g of serviceGroups) {
      map.set(g, jobTypes.filter(j => j.serviceGroup === g).sort((a, b) => a.sortOrder - b.sortOrder))
    }
    return map
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleGroup = useCallback((group: ServiceGroup) => {
    const groupIds = jobTypes.filter(j => j.serviceGroup === group).map(j => j.id)
    const allSelected = groupIds.every(id => selectedSpeeds.has(id))
    const next = new Set(selectedSpeeds)
    if (allSelected) {
      groupIds.forEach(id => next.delete(id))
    } else {
      groupIds.forEach(id => next.add(id))
    }
    setSelectedSpeeds(next)
  }, [selectedSpeeds])

  const isGroupFullySelected = useCallback((group: ServiceGroup) => {
    return jobTypes.filter(j => j.serviceGroup === group).every(j => selectedSpeeds.has(j.id))
  }, [selectedSpeeds])

  const isGroupPartiallySelected = useCallback((group: ServiceGroup) => {
    const groupJobs = jobTypes.filter(j => j.serviceGroup === group)
    const count = groupJobs.filter(j => selectedSpeeds.has(j.id)).length
    return count > 0 && count < groupJobs.length
  }, [selectedSpeeds])

  // Which groups have selected speeds
  const activeGroups = useMemo(() => {
    return serviceGroups.filter(g => {
      const groupJobs = jobTypes.filter(j => j.serviceGroup === g)
      return groupJobs.some(j => selectedSpeeds.has(j.id))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpeeds])

  // Show package panel when regional or international groups are active
  const showPackagePanel = useMemo(() => {
    return activeGroups.includes('regional') || activeGroups.includes('international')
  }, [activeGroups])

  // Compute available locations based on mode
  const availableLocations = useMemo(() => {
    if (rateMode === 'prospect') {
      // Prospect: uploaded data first, then standard set based on location mode
      if (uploadedLocations.length > 0) return uploadedLocations
      if (locationMode === 'zipcodes') {
        return zipCodes.map(z => ({ id: z.id, name: `${z.code} — ${z.city}, ${z.state}`, siteId: z.siteId, zone: z.zone }))
      }
      return suburbs
    }

    // Existing client: mine from their loaded rates + job patterns
    if (!selectedClient) return suburbs

    if (useTopDestinations && topDestinations[selectedClient.id]) {
      const tops = topDestinations[selectedClient.id]
      const limit = topCount === 'all' ? tops.length : topCount
      const topIds = new Set(tops.slice(0, limit).map(t => t.suburbId))
      return suburbs.filter(s => topIds.has(s.id)).sort((a, b) => {
        const aJob = tops.find(t => t.suburbId === a.id)?.jobCount ?? 0
        const bJob = tops.find(t => t.suburbId === b.id)?.jobCount ?? 0
        return bJob - aJob
      })
    }

    return suburbs.filter(s => s.siteId === selectedClient.siteId)
  }, [selectedClient, useTopDestinations, topCount, locationMode, uploadedLocations, rateMode])

  // Alias for backward compat in the rest of the component
  const availableSuburbs = availableLocations

  // Auto-select suburbs when available list changes
  useEffect(() => {
    setSelectedSuburbs(new Set(availableSuburbs.map(s => s.id)))
  }, [availableSuburbs])

  // Filter suburbs by search
  const filteredSuburbs = useMemo(() => {
    if (!suburbSearch) return availableSuburbs
    const q = suburbSearch.toLowerCase()
    return availableSuburbs.filter(s => s.name.toLowerCase().includes(q))
  }, [availableSuburbs, suburbSearch])

  // Get job counts lookup for display (existing client mode only)
  const jobCountMap = useMemo(() => {
    if (rateMode === 'prospect' || !selectedClient) return new Map<number, number>()
    if (!topDestinations[selectedClient.id]) return new Map<number, number>()
    return new Map(topDestinations[selectedClient.id].map(t => [t.suburbId, t.jobCount]))
  }, [selectedClient, rateMode])

  const hasTopDests = rateMode === 'existing' && selectedClient
    ? !!topDestinations[selectedClient.id]
    : false

  const fromSuburbId = fromSuburbOverride ?? (rateMode === 'prospect'
    ? (uploadedLocations.length > 0 ? uploadedLocations[0]?.id : (locationMode === 'zipcodes' ? (zipCodes[0]?.id ?? 101) : 1))
    : (selectedClient?.homeSuburbId ?? 1))
  const fromSuburbName = (() => {
    // Check uploaded locations first
    if (uploadedLocations.length > 0) {
      const loc = uploadedLocations.find(l => l.id === fromSuburbId)
      if (loc) return loc.name
    }
    if (rateMode === 'prospect' && locationMode === 'zipcodes') {
      const z = zipCodes.find(z => z.id === fromSuburbId)
      return z ? `${z.code} — ${z.city}, ${z.state}` : 'Unknown'
    }
    return suburbs.find(s => s.id === fromSuburbId)?.name ?? 'Auckland Central'
  })()

  // For prospect mode, create a synthetic client from the base rate inputs
  const effectiveClient = useMemo((): Client | null => {
    if (rateMode === 'existing') return selectedClient
    // Prospect: use a default client shell — rates come from options
    return {
      id: 0, code: 'PROSPECT', name: prospectName || 'Prospect',
      siteId: 1, homeSuburbId: fromSuburbId, homeSuburbName: fromSuburbName,
      standardRate: 15.00, vanRate: 22.00, economyActive: true, economyRuns: true, ppdRate: 3.00,
    }
  }, [rateMode, selectedClient, prospectName, fromSuburbId, fromSuburbName])

  const canGenerate = rateMode === 'prospect'
    ? selectedSpeeds.size > 0 && selectedSuburbs.size > 0
    : !!selectedClient && selectedSpeeds.size > 0

  const handleGenerate = useCallback(() => {
    if (!effectiveClient) return
    const speedIds = Array.from(selectedSpeeds)
    const opts = { includeGst, includeFuelSurcharge: includeFuel, markup, includePpd }

    // Prospect or uploaded locations → generic zone-based generator
    // Existing client → mine from loaded rates
    const items = (rateMode === 'prospect' || uploadedLocations.length > 0)
      ? generateRatesForUploadedLocations(effectiveClient, fromSuburbId, Array.from(selectedSuburbs), speedIds, opts, uploadedLocations.length > 0 ? uploadedLocations : undefined)
      : generateMockRates(effectiveClient.id, fromSuburbId, Array.from(selectedSuburbs), speedIds, opts)
    setRateItems(items)

    // Generate regional rates (city-to-city)
    const regional = generateRegionalRates(effectiveClient.id, speedIds, { includeGst, includeFuelSurcharge: includeFuel, markup, chargeableWeight, numberOfItems: pkgItems })
    setRegionalItems(regional)

    // Generate international rates
    const intl = generateInternationalRates(effectiveClient.id, speedIds, { includeGst, includeFuelSurcharge: includeFuel, markup, chargeableWeight, numberOfItems: pkgItems })
    setInternationalItems(intl)

    setShowPreview(true)
    if (activeGroups.length > 0) setActiveTab(activeGroups[0])
  }, [effectiveClient, fromSuburbId, selectedSuburbs, selectedSpeeds, includeGst, includeFuel, markup, includePpd, activeGroups, chargeableWeight, pkgItems, rateMode, uploadedLocations])

  // Build pivot table data for on-demand/scheduled
  type PivotSection = { speeds: string[]; rows: { suburb: string; cells: Map<string, RateItem> }[] }

  const buildPivotForGroup = useCallback((group: ServiceGroup): PivotSection | null => {
    if (group === 'regional' || group === 'international') return null
    const selectedJobTypes = jobTypes.filter(j => j.serviceGroup === group && selectedSpeeds.has(j.id)).sort((a, b) => a.sortOrder - b.sortOrder)
    if (selectedJobTypes.length === 0) return null

    const speedNames = selectedJobTypes.map(j => j.name)
    const speedSet = new Set(speedNames)
    const bySuburb = new Map<string, Map<string, RateItem>>()
    for (const item of rateItems) {
      if (!speedSet.has(item.speedName)) continue
      if (!bySuburb.has(item.toSuburbName)) bySuburb.set(item.toSuburbName, new Map())
      bySuburb.get(item.toSuburbName)!.set(item.speedName, item)
    }
    return { speeds: speedNames, rows: Array.from(bySuburb.entries()).map(([suburb, cells]) => ({ suburb, cells })) }
  }, [rateItems, selectedSpeeds])

  // Regional pivot: from-to matrix grouped by speed
  const regionalPivot = useMemo(() => {
    if (regionalItems.length === 0) return null
    const speeds = [...new Set(regionalItems.map(r => r.speedName))]
    const cityLookup = new Map(regionalCities.map(c => [c.id, c.name]))

    // Build from→to→speed→data
    const matrix = new Map<string, Map<string, Map<string, { rate: number; availability: string }>>>()
    for (const item of regionalItems) {
      const fromName = cityLookup.get(item.from) ?? item.from
      const toName = cityLookup.get(item.to) ?? item.to
      if (!matrix.has(fromName)) matrix.set(fromName, new Map())
      const row = matrix.get(fromName)!
      if (!row.has(toName)) row.set(toName, new Map())
      row.get(toName)!.set(item.speedName, { rate: item.rate, availability: item.availability })
    }

    return { speeds, matrix }
  }, [regionalItems])

  // International pivot
  const internationalPivot = useMemo(() => {
    if (internationalItems.length === 0) return null
    const speeds = [...new Set(internationalItems.map(r => r.speedName))]
    const byDest = new Map<string, { city: string; country: string; cells: Map<string, { rate: number; availability: string }> }>()
    for (const item of internationalItems) {
      const key = item.destinationId
      if (!byDest.has(key)) byDest.set(key, { city: item.city, country: item.country, cells: new Map() })
      byDest.get(key)!.cells.set(item.speedName, { rate: item.rate, availability: item.availability })
    }
    // Sort by region order (matching internationalDestinations order)
    const rows = Array.from(byDest.values())
    return { speeds, rows }
  }, [internationalItems])

  const handleExportCsv = useCallback(() => {
    const lines: string[] = []
    // On-demand / scheduled
    for (const group of ['on-demand', 'scheduled'] as ServiceGroup[]) {
      const pivot = buildPivotForGroup(group)
      if (!pivot || pivot.rows.length === 0) continue
      lines.push(serviceGroupLabels[group], '')
      lines.push(['Destination', ...pivot.speeds].join(','))
      for (const r of pivot.rows) {
        lines.push([r.suburb, ...pivot.speeds.map(s => {
          const cell = r.cells.get(s)
          return cell ? (cell.availability === 'Unavailable' ? 'N/A' : `$${cell.rate.toFixed(2)}`) : ''
        })].join(','))
      }
      lines.push('')
    }
    // Regional
    if (regionalPivot) {
      lines.push('Regional / National', '')
      for (const [fromCity, destinations] of regionalPivot.matrix) {
        lines.push(`From: ${fromCity}`)
        lines.push(['To', ...regionalPivot.speeds].join(','))
        for (const [toCity, cells] of destinations) {
          lines.push([toCity, ...regionalPivot.speeds.map(s => {
            const cell = cells.get(s)
            return cell ? (cell.availability === 'Unavailable' ? 'N/A' : `$${cell.rate.toFixed(2)}`) : ''
          })].join(','))
        }
        lines.push('')
      }
    }
    // International
    if (internationalPivot) {
      lines.push('International', '')
      lines.push(['Destination', ...internationalPivot.speeds].join(','))
      for (const r of internationalPivot.rows) {
        lines.push([`${r.city}, ${r.country}`, ...internationalPivot.speeds.map(s => {
          const cell = r.cells.get(s)
          return cell ? (cell.availability === 'Unavailable' ? 'N/A' : `$${cell.rate.toFixed(2)}`) : ''
        })].join(','))
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rate-schedule-${effectiveClient?.code ?? 'export'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [buildPivotForGroup, regionalPivot, internationalPivot, effectiveClient])

  // Determine which groups have data to show
  const groupsWithData = useMemo(() => {
    const groups: ServiceGroup[] = []
    for (const g of activeGroups) {
      if (g === 'on-demand' || g === 'scheduled') {
        const pivot = buildPivotForGroup(g)
        if (pivot && pivot.rows.length > 0) groups.push(g)
      } else if (g === 'regional' && regionalPivot) {
        groups.push(g)
      } else if (g === 'international' && internationalPivot) {
        groups.push(g)
      }
    }
    return groups
  }, [activeGroups, buildPivotForGroup, regionalPivot, internationalPivot])

  // Render a suburb-based table (on-demand / scheduled)
  const renderSuburbTable = (group: ServiceGroup) => {
    const pivot = buildPivotForGroup(group)
    if (!pivot || pivot.rows.length === 0) return <div className="p-6 text-sm text-[#9e9da8]">No rates to display.</div>
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0d0c2c] text-white">
              <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-[#0d0c2c] z-10">Destination</th>
              {pivot.speeds.map(s => <th key={s} className="text-right px-4 py-3 font-semibold whitespace-nowrap">{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {pivot.rows.map((row, i) => (
              <tr key={row.suburb} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8f7f7]'}>
                <td className={cn('px-4 py-2.5 font-medium text-[#0d0c2c] sticky left-0 z-10', i % 2 === 0 ? 'bg-white' : 'bg-[#f8f7f7]')}>
                  {row.suburb}
                </td>
                {pivot.speeds.map(s => {
                  const cell = row.cells.get(s)
                  if (!cell) return <td key={s} className="px-4 py-2.5 text-right text-[#9e9da8]">—</td>
                  return <RateCell key={s} rate={cell.rate} availability={cell.availability} />
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Render regional from/to matrix
  const renderRegionalTable = () => {
    if (!regionalPivot) return <div className="p-6 text-sm text-[#9e9da8]">No regional rates to display.</div>
    const { speeds, matrix } = regionalPivot

    // Flatten into a single table: Origin → Destination with speed columns
    const allRows: { from: string; to: string; cells: Map<string, { rate: number; availability: string }> }[] = []
    for (const [fromCity, destinations] of matrix) {
      for (const [toCity, cells] of destinations) {
        allRows.push({ from: fromCity, to: toCity, cells })
      }
    }

    // Group by origin
    const origins = [...new Set(allRows.map(r => r.from))]

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0d0c2c] text-white">
              <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-[#0d0c2c] z-10">Origin</th>
              <th className="text-left px-4 py-3 font-semibold">Destination</th>
              {speeds.map(s => <th key={s} className="text-right px-4 py-3 font-semibold whitespace-nowrap">{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {origins.map((origin, oi) => {
              const rows = allRows.filter(r => r.from === origin)
              return rows.map((row, ri) => (
                <tr key={`${origin}-${row.to}`} className={(oi % 2 === 0) ? 'bg-white' : 'bg-[#f8f7f7]'}>
                  {ri === 0 && (
                    <td
                      rowSpan={rows.length}
                      className={cn('px-4 py-2.5 font-semibold text-[#0d0c2c] sticky left-0 z-10 align-top border-b border-[#e6e5ea]', oi % 2 === 0 ? 'bg-white' : 'bg-[#f8f7f7]')}
                    >
                      {origin}
                    </td>
                  )}
                  <td className="px-4 py-2.5 text-[#0d0c2c]">{row.to}</td>
                  {speeds.map(s => {
                    const cell = row.cells.get(s)
                    if (!cell) return <td key={s} className="px-4 py-2.5 text-right text-[#9e9da8]">—</td>
                    return <RateCell key={s} rate={cell.rate} availability={cell.availability} />
                  })}
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Render international table
  const renderInternationalTable = () => {
    if (!internationalPivot) return <div className="p-6 text-sm text-[#9e9da8]">No international rates to display.</div>
    const { speeds, rows } = internationalPivot

    // Group by region
    const destLookup = new Map(internationalDestinations.map(d => [d.city, d]))
    const regionOrder = ['australia', 'asia-pacific', 'americas', 'europe'] as const
    const regionLabels: Record<string, string> = { 'australia': 'Australia', 'asia-pacific': 'Asia-Pacific', 'americas': 'Americas', 'europe': 'Europe' }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0d0c2c] text-white">
              <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-[#0d0c2c] z-10">Destination</th>
              {speeds.map(s => {
                // Shorten header: remove "International " prefix
                const short = s.replace('International ', '')
                return <th key={s} className="text-right px-4 py-3 font-semibold whitespace-nowrap">{short}</th>
              })}
            </tr>
          </thead>
          <tbody>
            {regionOrder.map(region => {
              const regionRows = rows.filter(r => {
                const dest = destLookup.get(r.city)
                return dest?.region === region
              })
              if (regionRows.length === 0) return null
              return (
                <Fragment key={region}>
                  <tr className="bg-[#f4f2f1]">
                    <td colSpan={speeds.length + 1} className="px-4 py-2 text-xs font-bold text-[#6e6d80] uppercase tracking-wide">
                      {regionLabels[region]}
                    </td>
                  </tr>
                  {regionRows.map((row, i) => (
                    <tr key={row.city} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f8f7f7]'}>
                      <td className={cn('px-4 py-2.5 font-medium text-[#0d0c2c] sticky left-0 z-10', i % 2 === 0 ? 'bg-white' : 'bg-[#f8f7f7]')}>
                        {row.city}<span className="text-[#9e9da8] ml-1.5 text-xs">{row.country}</span>
                      </td>
                      {speeds.map(s => {
                        const cell = row.cells.get(s)
                        if (!cell) return <td key={s} className="px-4 py-2.5 text-right text-[#9e9da8]">—</td>
                        return <RateCell key={s} rate={cell.rate} availability={cell.availability} />
                      })}
                    </tr>
                  ))}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // Need Fragment
  const Fragment = ({ children }: { children: React.ReactNode }) => <>{children}</>

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#3bc7f4]/10 flex items-center justify-center">
            <Zap size={20} className="text-[#3bc7f4]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0d0c2c]">Rate Schedule Generator</h1>
            <p className="text-sm text-[#6e6d80]">Generate rate cards for existing clients or prospective customers</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => { setRateMode('existing'); setUploadedLocations([]); setShowPreview(false) }}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-all',
              rateMode === 'existing'
                ? 'bg-[#0d0c2c] border-[#0d0c2c] text-white shadow-md'
                : 'bg-white border-[#cfced5] text-[#6e6d80] hover:border-[#9e9da8]'
            )}
          >
            <Users size={16} />
            Existing Client
          </button>
          <button
            onClick={() => { setRateMode('prospect'); setSelectedClient(null); setShowPreview(false) }}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-all',
              rateMode === 'prospect'
                ? 'bg-[#0d0c2c] border-[#0d0c2c] text-white shadow-md'
                : 'bg-white border-[#cfced5] text-[#6e6d80] hover:border-[#9e9da8]'
            )}
          >
            <UserPlus size={16} />
            Prospect
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Left Column — Main Config */}
        <div className="space-y-6">

          {/* Existing Client: Client Selector */}
          {rateMode === 'existing' && (
            <div className="bg-white rounded-xl border border-[#cfced5] p-6 shadow-sm">
              <ClientSelector selected={selectedClient} onSelect={setSelectedClient} />
              {selectedClient && (
                <div className="mt-4 p-3 rounded-lg bg-[#f4f2f1] flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span><span className="text-[#6e6d80]">Code:</span> <span className="font-mono font-medium">{selectedClient.code}</span></span>
                  <span><span className="text-[#6e6d80]">Home:</span> {selectedClient.homeSuburbName}</span>
                  <span><span className="text-[#6e6d80]">Std Rate:</span> ${selectedClient.standardRate.toFixed(2)}</span>
                  {selectedClient.vanRate > 0 && <span><span className="text-[#6e6d80]">Van:</span> ${selectedClient.vanRate.toFixed(2)}</span>}
                  {selectedClient.ppdRate && <span><span className="text-[#6e6d80]">PPD:</span> ${selectedClient.ppdRate.toFixed(2)}</span>}
                </div>
              )}
              {selectedClient && hasTopDests && (
                <p className="mt-2 text-xs text-[#3bc7f4] font-medium">✦ Job pattern data available — top destinations will be auto-selected</p>
              )}
            </div>
          )}

          {/* Prospect: Company Info */}
          {rateMode === 'prospect' && (
            <div className="bg-white rounded-xl border border-[#cfced5] p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus size={16} className="text-[#3bc7f4]" />
                <h2 className="text-base font-semibold text-[#0d0c2c]">Prospect Details</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0d0c2c] mb-1">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Logistics"
                    value={prospectName}
                    onChange={e => setProspectName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#cfced5] bg-white text-sm placeholder:text-[#9e9da8] focus:outline-none focus:border-[#3bc7f4] focus:ring-2 focus:ring-[#3bc7f4]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0d0c2c] mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. John Smith"
                    value={prospectContact}
                    onChange={e => setProspectContact(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#cfced5] bg-white text-sm placeholder:text-[#9e9da8] focus:outline-none focus:border-[#3bc7f4] focus:ring-2 focus:ring-[#3bc7f4]/20"
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-[#9e9da8]">Upload their delivery locations below, or choose from the standard set to build a rate card.</p>
            </div>
          )}

          {/* Services / Speeds */}
          <div className="bg-white rounded-xl border border-[#cfced5] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#0d0c2c]">Services / Speeds</h2>
              <BulkButtons
                onSelectAll={() => setSelectedSpeeds(new Set(jobTypes.map(j => j.id)))}
                onDeselectAll={() => setSelectedSpeeds(new Set())}
              />
            </div>

            {/* Service Group Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-[#e6e5ea]">
              <button
                onClick={() => setActiveGroupFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  activeGroupFilter === 'all'
                    ? 'bg-[#0d0c2c] border-[#0d0c2c] text-white'
                    : 'bg-white border-[#cfced5] text-[#6e6d80] hover:border-[#9e9da8]'
                )}
              >
                All
              </button>
              {serviceGroups.map(g => (
                <button
                  key={g}
                  onClick={() => setActiveGroupFilter(g)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                    activeGroupFilter === g
                      ? 'bg-[#0d0c2c] border-[#0d0c2c] text-white'
                      : 'bg-white border-[#cfced5] text-[#6e6d80] hover:border-[#9e9da8]'
                  )}
                >
                  {serviceGroupLabels[g]}
                </button>
              ))}
            </div>

            {/* Grouped Job Types */}
            <div className="space-y-4">
              {serviceGroups
                .filter(g => activeGroupFilter === 'all' || activeGroupFilter === g)
                .map(g => {
                  const groupJobs = jobTypesByGroup.get(g) ?? []
                  const full = isGroupFullySelected(g)
                  const partial = isGroupPartiallySelected(g)
                  return (
                    <div key={g}>
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => toggleGroup(g)}
                          className={cn(
                            'flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide transition-colors',
                            full ? 'text-[#3bc7f4]' : partial ? 'text-[#6e6d80]' : 'text-[#9e9da8]'
                          )}
                        >
                          <span className={cn(
                            'w-4 h-4 rounded border flex items-center justify-center transition-all',
                            full ? 'bg-[#3bc7f4] border-[#3bc7f4]' : partial ? 'border-[#3bc7f4] bg-[#3bc7f4]/20' : 'border-[#cfced5]'
                          )}>
                            {full && <Check size={10} className="text-white" />}
                            {partial && <span className="w-2 h-0.5 bg-[#3bc7f4] rounded" />}
                          </span>
                          {serviceGroupLabels[g]}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-6">
                        {groupJobs.map(jt => (
                          <TogglePill
                            key={jt.id}
                            label={jt.name}
                            sublabel={jt.minutes ? `${jt.minutes}m` : undefined}
                            checked={selectedSpeeds.has(jt.id)}
                            onChange={v => {
                              const next = new Set(selectedSpeeds)
                              v ? next.add(jt.id) : next.delete(jt.id)
                              setSelectedSpeeds(next)
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Package Details — Regional/International only */}
          {showPackagePanel && (
            <div className="bg-white rounded-xl border border-[#cfced5] shadow-sm overflow-hidden">
              <button
                onClick={() => setPkgPanelOpen(!pkgPanelOpen)}
                className="w-full flex items-center justify-between p-6 pb-4 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#3bc7f4]/10 flex items-center justify-center">
                    <Package size={16} className="text-[#3bc7f4]" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#0d0c2c]">Package Details</h2>
                    <p className="text-xs text-[#6e6d80]">Weight &amp; dimensions for regional/international pricing</p>
                  </div>
                </div>
                {pkgPanelOpen ? <ChevronUp size={16} className="text-[#9e9da8]" /> : <ChevronDown size={16} className="text-[#9e9da8]" />}
              </button>
              {pkgPanelOpen && (
                <div className="px-6 pb-6 space-y-4">
                  {/* Quick weight presets */}
                  <div>
                    <label className="block text-sm font-medium text-[#0d0c2c] mb-1.5">Quick Weight</label>
                    <div className="flex flex-wrap gap-2">
                      {[0.5, 1, 5, 10, 25].map(w => (
                        <button
                          key={w}
                          onClick={() => setPkgWeight(w)}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                            pkgWeight === w
                              ? 'bg-[#3bc7f4] border-[#3bc7f4] text-white'
                              : 'bg-white border-[#cfced5] text-[#6e6d80] hover:border-[#3bc7f4] hover:text-[#0d0c2c]'
                          )}
                        >
                          {w}kg
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weight + Package Type row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0d0c2c] mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={pkgWeight}
                        onChange={e => setPkgWeight(Math.max(0.1, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-lg border border-[#cfced5] bg-white text-sm focus:outline-none focus:border-[#3bc7f4] focus:ring-2 focus:ring-[#3bc7f4]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d0c2c] mb-1">Package Type</label>
                      <div className="relative">
                        <select
                          value={pkgType}
                          onChange={e => setPkgType(e.target.value)}
                          className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-[#cfced5] bg-white text-sm focus:outline-none focus:border-[#3bc7f4]"
                        >
                          {['Satchel', 'Box', 'Carton', 'Pallet', 'Custom'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9e9da8] pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Dimensions row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0d0c2c] mb-1">Length (cm)</label>
                      <input
                        type="number"
                        min={0}
                        value={pkgLength || ''}
                        placeholder="—"
                        onChange={e => setPkgLength(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-lg border border-[#cfced5] bg-white text-sm placeholder:text-[#9e9da8] focus:outline-none focus:border-[#3bc7f4] focus:ring-2 focus:ring-[#3bc7f4]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d0c2c] mb-1">Width (cm)</label>
                      <input
                        type="number"
                        min={0}
                        value={pkgWidth || ''}
                        placeholder="—"
                        onChange={e => setPkgWidth(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-lg border border-[#cfced5] bg-white text-sm placeholder:text-[#9e9da8] focus:outline-none focus:border-[#3bc7f4] focus:ring-2 focus:ring-[#3bc7f4]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d0c2c] mb-1">Height (cm)</label>
                      <input
                        type="number"
                        min={0}
                        value={pkgHeight || ''}
                        placeholder="—"
                        onChange={e => setPkgHeight(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2 rounded-lg border border-[#cfced5] bg-white text-sm placeholder:text-[#9e9da8] focus:outline-none focus:border-[#3bc7f4] focus:ring-2 focus:ring-[#3bc7f4]/20"
                      />
                    </div>
                  </div>

                  {/* Calculated weights + number of items */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-[#6e6d80] mb-1">Cubic Weight</label>
                      <div className="px-3 py-2 rounded-lg bg-[#f4f2f1] text-sm font-medium text-[#0d0c2c]">
                        {cubicWeight > 0 ? `${cubicWeight.toFixed(2)} kg` : '—'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-[#6e6d80] mb-1">Chargeable Weight</label>
                      <div className={cn(
                        'px-3 py-2 rounded-lg text-sm font-semibold',
                        cubicWeight > pkgWeight ? 'bg-[#ffe6d1] text-[#0d0c2c]' : 'bg-[#f4f2f1] text-[#0d0c2c]'
                      )}>
                        {chargeableWeight.toFixed(2)} kg
                        {cubicWeight > pkgWeight && <span className="text-xs font-normal ml-1 text-[#6e6d80]">(vol)</span>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#0d0c2c] mb-1">No. of Items</label>
                      <input
                        type="number"
                        min={1}
                        value={pkgItems}
                        onChange={e => setPkgItems(Math.max(1, Math.round(Number(e.target.value))))}
                        className="w-full px-3 py-2 rounded-lg border border-[#cfced5] bg-white text-sm focus:outline-none focus:border-[#3bc7f4] focus:ring-2 focus:ring-[#3bc7f4]/20"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Destinations */}
          <div className="bg-white rounded-xl border border-[#cfced5] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#0d0c2c]">
                {rateMode === 'existing' ? 'Destinations' : 'Prospect Destinations'}
              </h2>
              <BulkButtons
                onSelectAll={() => setSelectedSuburbs(new Set(availableSuburbs.map(s => s.id)))}
                onDeselectAll={() => setSelectedSuburbs(new Set())}
              />
            </div>

            {/* Prospect Mode: Location Mode Toggle + Upload */}
            {rateMode === 'prospect' && (
              <>
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#e6e5ea]">
                  {(['suburbs', 'zipcodes'] as LocationMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setLocationMode(mode); setSuburbSearch(''); setFromSuburbOverride(null); setUploadedLocations([]) }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                        locationMode === mode
                          ? 'bg-[#0d0c2c] border-[#0d0c2c] text-white'
                          : 'bg-white border-[#cfced5] text-[#6e6d80] hover:border-[#9e9da8]'
                      )}
                    >
                      {locationModeLabels[mode]}
                    </button>
                  ))}
                  <span className="text-xs text-[#9e9da8] ml-2">
                    {locationMode === 'suburbs' ? 'Suburb/town-based pricing' : 'ZIP code-based pricing'}
                  </span>
                </div>

                <LocationUpload
                  uploadedCount={uploadedLocations.length}
                  onUpload={(locs, mode) => {
                    setUploadedLocations(locs)
                    setLocationMode(mode)
                    setSelectedSuburbs(new Set(locs.map(l => l.id)))
                  }}
                  onClear={() => {
                    setUploadedLocations([])
                    setSelectedSuburbs(new Set(availableSuburbs.map(s => s.id)))
                  }}
                />

                {uploadedLocations.length === 0 && (
                  <p className="text-xs text-[#9e9da8] mb-3 mt-3">Upload the prospect's delivery locations, or select from the standard set below.</p>
                )}
                {uploadedLocations.length > 0 && (
                  <p className="text-xs text-[#9e9da8] mb-3 mt-3">✦ {uploadedLocations.length} locations loaded from file. Select which ones to include in the rate card.</p>
                )}
              </>
            )}

            {/* Existing Client Mode: explain data source */}
            {rateMode === 'existing' && (
              <p className="text-xs text-[#9e9da8] mb-3">Based on loaded rates and job patterns. Regional &amp; International use their own route tables.</p>
            )}

            {/* Top destinations toggle (existing clients only) */}
            {hasTopDests && rateMode === 'existing' && (
              <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-[#e6e5ea]">
                <Toggle checked={useTopDestinations} onChange={setUseTopDestinations} label="Top destinations only" />
                {useTopDestinations && (
                  <div className="relative">
                    <select
                      value={topCount}
                      onChange={e => setTopCount(e.target.value === 'all' ? 'all' : Number(e.target.value) as 30 | 40 | 50)}
                      className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-[#cfced5] text-sm bg-white focus:outline-none focus:border-[#3bc7f4]"
                    >
                      <option value={30}>Top 30</option>
                      <option value={40}>Top 40</option>
                      <option value={50}>Top 50</option>
                      <option value="all">All suburbs</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9e9da8] pointer-events-none" />
                  </div>
                )}
                <span className="text-xs text-[#6e6d80]">{availableSuburbs.length} suburbs • {selectedSuburbs.size} selected</span>
              </div>
            )}

            {/* Suburb search */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9da8]" />
              <input
                type="text"
                placeholder={rateMode === 'prospect' && locationMode === 'zipcodes' ? 'Filter ZIP codes…' : rateMode === 'prospect' ? 'Filter locations…' : 'Filter suburbs…'}
                value={suburbSearch}
                onChange={e => setSuburbSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-[#cfced5] bg-white text-sm placeholder:text-[#9e9da8] focus:outline-none focus:border-[#3bc7f4] focus:ring-2 focus:ring-[#3bc7f4]/20"
              />
            </div>

            {/* Suburb checkboxes */}
            <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1">
              {filteredSuburbs.map(s => {
                const count = jobCountMap.get(s.id)
                return (
                  <label key={s.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-[#f4f2f1] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSuburbs.has(s.id)}
                      onChange={e => {
                        const next = new Set(selectedSuburbs)
                        e.target.checked ? next.add(s.id) : next.delete(s.id)
                        setSelectedSuburbs(next)
                      }}
                      className="rounded border-[#cfced5] text-[#3bc7f4] focus:ring-[#3bc7f4]/20"
                    />
                    <span className="text-sm text-[#0d0c2c] flex-1">{s.name}</span>
                    <span className="text-xs text-[#9e9da8] font-mono">Z{s.zone}</span>
                    {count !== undefined && (
                      <span className="text-xs text-[#6e6d80] bg-[#f4f2f1] px-1.5 py-0.5 rounded-full">{count.toLocaleString()} jobs</span>
                    )}
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column — Options + Actions */}
        <div className="space-y-6">
          {/* Options Panel */}
          <div className="bg-white rounded-xl border border-[#cfced5] p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-[#0d0c2c]">Options</h2>

            <Toggle checked={includeGst} onChange={setIncludeGst} label={rateMode === 'prospect' && locationMode === 'zipcodes' ? 'Include Sales Tax' : 'Include GST (15%)'} />
            <Toggle checked={includeFuel} onChange={setIncludeFuel} label="Include Fuel Surcharge" />
            <Toggle checked={includePpd} onChange={setIncludePpd} label="Include PPD" />

            <div>
              <label className="block text-sm text-[#0d0c2c] mb-1">Markup %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={markup}
                onChange={e => setMarkup(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#cfced5] bg-white text-sm focus:outline-none focus:border-[#3bc7f4] focus:ring-2 focus:ring-[#3bc7f4]/20"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0d0c2c] mb-1">Prepared For</label>
              <input
                type="text"
                placeholder="e.g. John Smith"
                value={preparedFor}
                onChange={e => setPreparedFor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#cfced5] bg-white text-sm placeholder:text-[#9e9da8] focus:outline-none focus:border-[#3bc7f4] focus:ring-2 focus:ring-[#3bc7f4]/20"
              />
            </div>

            <div>
              <label className="block text-sm text-[#0d0c2c] mb-1">
                {rateMode === 'prospect' && locationMode === 'zipcodes' ? 'From ZIP Code' : 'From Location'}
              </label>
              <div className="relative">
                <select
                  value={fromSuburbOverride ?? (uploadedLocations.length > 0 ? (uploadedLocations[0]?.id ?? '') : rateMode === 'prospect' && locationMode === 'zipcodes' ? (zipCodes[0]?.id ?? '') : (selectedClient?.homeSuburbId ?? ''))}
                  onChange={e => setFromSuburbOverride(e.target.value ? Number(e.target.value) : null)}
                  className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-[#cfced5] bg-white text-sm focus:outline-none focus:border-[#3bc7f4]"
                >
                  {uploadedLocations.length > 0 ? (
                    uploadedLocations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))
                  ) : rateMode === 'prospect' && locationMode === 'zipcodes' ? (
                    zipCodes.map(z => (
                      <option key={z.id} value={z.id}>{z.code} — {z.city}, {z.state}</option>
                    ))
                  ) : (
                    <>
                      {selectedClient && <option value={selectedClient.homeSuburbId}>{selectedClient.homeSuburbName} (default)</option>}
                      {suburbs.filter(s => s.id !== selectedClient?.homeSuburbId).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </>
                  )}
                </select>
                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9e9da8] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={cn(
              'w-full py-3 px-6 rounded-full font-semibold text-sm transition-all shadow-md',
              canGenerate
                ? 'bg-[#3bc7f4] text-white hover:bg-[#2ab0dd] active:scale-[0.98] shadow-[0_4px_12px_rgba(59,199,244,0.3)]'
                : 'bg-[#cfced5] text-[#9e9da8] cursor-not-allowed'
            )}
          >
            {rateMode === 'prospect' ? 'Generate Prospect Rate Card' : 'Generate Rate Schedule'}
          </button>

          {canGenerate && (
            <p className="text-xs text-center text-[#6e6d80]">
              {selectedSpeeds.size} speeds selected across {activeGroups.length} service group{activeGroups.length !== 1 ? 's' : ''}
              {rateMode === 'prospect' && ` • ${selectedSuburbs.size} destinations`}
            </p>
          )}
        </div>
      </div>

      {/* Preview with Tabs */}
      {showPreview && groupsWithData.length > 0 && (
        <div className="mt-8 bg-white rounded-xl border border-[#cfced5] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#e6e5ea] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0d0c2c]">
                {rateMode === 'prospect' ? 'Prospect Rate Card' : 'Rate Schedule'} — {effectiveClient?.name ?? 'Unknown'}
              </h2>
              <p className="text-sm text-[#6e6d80] mt-0.5">
                From: {fromSuburbName}
                {(preparedFor || (rateMode === 'prospect' && prospectContact)) && <> • Prepared for: {preparedFor || prospectContact}</>}
                {includeGst && <> • GST incl.</>}
                {includeFuel && <> • Fuel incl.</>}
                {markup > 0 && <> • +{markup}% markup</>}
                {showPackagePanel && <> • {chargeableWeight.toFixed(1)}kg × {pkgItems} {pkgType}</>}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportCsv} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#cfced5] text-sm font-medium text-[#0d0c2c] hover:bg-[#f4f2f1] transition-colors">
                <Download size={14} /> CSV
              </button>
              <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#cfced5] text-sm font-medium text-[#0d0c2c] hover:bg-[#f4f2f1] transition-colors opacity-50 cursor-not-allowed" title="Coming soon">
                <FileText size={14} /> PDF
              </button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#cfced5] text-sm font-medium text-[#0d0c2c] hover:bg-[#f4f2f1] transition-colors">
                <Printer size={14} /> Print
              </button>
            </div>
          </div>

          {/* Tabs — only show if more than one group */}
          {groupsWithData.length > 1 && (
            <div className="flex border-b border-[#e6e5ea] bg-[#f8f7f7]">
              {groupsWithData.map(g => (
                <button
                  key={g}
                  onClick={() => setActiveTab(g)}
                  className={cn(
                    'px-6 py-3 text-sm font-semibold transition-all relative',
                    activeTab === g
                      ? 'text-[#0d0c2c] bg-white'
                      : 'text-[#6e6d80] hover:text-[#0d0c2c] hover:bg-white/50'
                  )}
                >
                  {serviceGroupLabels[g]}
                  {activeTab === g && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3bc7f4]" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Tab Content */}
          {(() => {
            const tab = groupsWithData.length === 1 ? groupsWithData[0] : activeTab
            if (!tab) return null

            if (tab === 'on-demand' || tab === 'scheduled') return renderSuburbTable(tab)
            if (tab === 'regional') return renderRegionalTable()
            if (tab === 'international') return renderInternationalTable()
            return null
          })()}

          {/* Legend */}
          <div className="px-6 py-3 border-t border-[#e6e5ea] flex gap-6 text-xs text-[#6e6d80]">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#d0f1e0]" /> Available</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#ffe6d1]" /> Possible</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#f8d6da]" /> Unavailable</span>
          </div>
        </div>
      )}
    </div>
  )
}
