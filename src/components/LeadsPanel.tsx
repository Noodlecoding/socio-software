import React, { useEffect, useMemo, useState } from 'react';
import { Search, Mail, Phone, Globe, Copy } from 'lucide-react';
import { LeadStatus, ScrapedLead } from '../types';
import { supabase } from '../lib/supabaseClient';

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  replied: 'Replied',
  won: 'Won',
  not_interested: 'Not interested'
};

type LeadFilter = 'all' | 'can_email' | 'phone_or_letter' | LeadStatus;

const FILTERS: { id: LeadFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'can_email', label: 'OK to email' },
  { id: 'phone_or_letter', label: 'Phone / letter only' },
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'replied', label: 'Replied' },
  { id: 'won', label: 'Won' }
];

function rowToLead(row: any): ScrapedLead {
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    phone: row.phone,
    email: row.email,
    address: row.address,
    postcode: row.postcode,
    ownerName: row.owner_name,
    companyType: row.company_type,
    canColdEmail: row.can_cold_email,
    teamSize: row.team_size,
    sitesCount: row.sites_count,
    signals: row.signals ?? [],
    score: row.score ?? 0,
    opener: row.opener,
    notes: row.notes,
    status: row.status,
    scrapedAt: row.scraped_at
  };
}

const COMPANY_LABELS: Record<ScrapedLead['companyType'], string> = {
  ltd: 'Ltd',
  partnership_or_sole_trader: 'Partnership / sole trader',
  unknown: 'Unknown'
};

export const LeadsPanel: React.FC = () => {
  const [leads, setLeads] = useState<ScrapedLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LeadFilter>('all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('scraped_leads')
        .select('*')
        .order('score', { ascending: false })
        .limit(2000);
      if (error) setLoadError(error.message);
      else setLeads((data ?? []).map(rowToLead));
      setIsLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (filter === 'can_email' && !(lead.canColdEmail && lead.email)) return false;
      if (filter === 'phone_or_letter' && lead.canColdEmail) return false;
      if (['new', 'contacted', 'replied', 'won'].includes(filter) && lead.status !== filter) return false;
      if (!q) return true;
      return [lead.name, lead.email, lead.postcode, lead.ownerName]
        .some((v) => v?.toLowerCase().includes(q));
    });
  }, [leads, filter, query]);

  const updateLead = async (id: string, patch: { status?: LeadStatus; notes?: string }) => {
    const previous = leads;
    setLeads((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    const { error } = await supabase.from('scraped_leads').update(patch).eq('id', id);
    if (error) {
      setLeads(previous);
      setLoadError(error.message);
    }
  };

  const copy = (text: string) => {
    void navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <div className="bg-white border border-[#e5e9f5] rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#e5e9f5]">
        <h2 className="font-display text-lg font-bold text-slate-900">Leads</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {filtered.length} of {leads.length} prospects collected by the scraper
        </p>
        <div className="relative mt-3 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by practice, email, postcode..."
            className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-blue-600"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {FILTERS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {loadError && <p className="text-xs text-red-600 mt-3">{loadError}</p>}
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-4 text-xs text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-xs text-slate-400">
            {leads.length === 0 ? 'No leads yet. Run the scraper (see scraper/README.md).' : 'No leads match this filter.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Practice</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Dentists / sites</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <React.Fragment key={lead.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer align-top"
                  >
                    <td className="px-4 py-3 font-bold text-slate-900">{lead.score}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{lead.name}</div>
                      <div className="text-xs text-slate-500">{lead.postcode}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 space-y-0.5">
                      {lead.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</div>}
                      {lead.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</div>}
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-blue-600 hover:underline">
                          <Globe className="w-3 h-3" />Website
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {lead.teamSize ?? "?"} dentist{lead.teamSize === 1 ? "" : "s"} / {lead.sitesCount ?? '?'} site{lead.sitesCount === 1 ? '' : 's'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div className="text-slate-700">{COMPANY_LABELS[lead.companyType]}</div>
                      <div className={lead.canColdEmail ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {lead.canColdEmail ? 'OK to email' : 'Phone / letter'}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        onChange={(e) => void updateLead(lead.id, { status: e.target.value as LeadStatus })}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                      >
                        {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {expandedId === lead.id && (
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <td colSpan={6} className="px-4 py-3 text-xs text-slate-700 space-y-2">
                        {lead.signals.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {lead.signals.map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{s}</span>
                            ))}
                          </div>
                        )}
                        {lead.address && <div>{lead.address}</div>}
                        {lead.ownerName && <div>Owner: {lead.ownerName}</div>}
                        {lead.opener && (
                          <div className="flex items-start gap-2">
                            <p className="flex-1 italic">"{lead.opener}"</p>
                            <button onClick={() => copy(lead.opener!)} className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer" title="Copy opener">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <textarea
                          defaultValue={lead.notes ?? ''}
                          onBlur={(e) => {
                            if (e.target.value !== (lead.notes ?? '')) void updateLead(lead.id, { notes: e.target.value });
                          }}
                          placeholder="Notes..."
                          rows={2}
                          className="w-full border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:border-blue-600"
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
