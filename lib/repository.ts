import { CountryCode } from 'libphonenumber-js';
import {
  formatBudgetWithCurrency,
  parseAndValidatePhone,
  SupportedCurrency,
} from './phone';
import { getSupabaseClient } from './supabase';

export type LeadStatus =
  | 'New'
  | 'No Answer'
  | 'Interested'
  | 'Needs Follow-up'
  | 'Viewing Scheduled'
  | 'Negotiation'
  | 'Closed/Sold'
  | 'Not Interested'
  | 'Wrong Number';

export type RequestType = 'Buy' | 'Rent' | 'Invest';

export type CallOutcome =
  | 'Answered'
  | 'No Answer'
  | 'Busy'
  | 'Switched Off'
  | 'Rejected';

export const ALL_STATUSES: LeadStatus[] = [
  'New',
  'No Answer',
  'Interested',
  'Needs Follow-up',
  'Viewing Scheduled',
  'Negotiation',
  'Closed/Sold',
  'Not Interested',
  'Wrong Number',
];

export const ALL_REQUEST_TYPES: RequestType[] = ['Buy', 'Rent', 'Invest'];

export const DEFAULT_SOURCES: string[] = [
  'Facebook',
  'Ads',
  'Referral',
  'Cold Call',
  'Website',
];

export const DEFAULT_PROPERTY_TYPES: string[] = [
  'Apartment',
  'Villa',
  'Commercial',
  'Land',
  'Townhouse',
  'Penthouse',
];

export const SEEDED_AREAS: string[] = [
  'New Cairo',
  'Sheikh Zayed',
  'New Capital',
  '6th of October',
  'Alexandria',
  'North Coast',
  'Maadi',
  'Dubai Marina',
  'Downtown Dubai',
  'Riyadh',
];

export const CALL_OUTCOMES: CallOutcome[] = [
  'Answered',
  'No Answer',
  'Busy',
  'Switched Off',
  'Rejected',
];

export interface CallRecord {
  id: string;
  user_id: string;
  lead_id: string;
  called_at: string;
  outcome: CallOutcome;
  feedback: string;
  next_follow_up_at: string | null;
  created_at: string;
}

export interface NoteRecord {
  id: string;
  user_id: string;
  lead_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface LeadRecord {
  id: string;
  user_id: string;
  name: string;
  phone: string;                    // Canonical E.164
  secondary_phone: string | null;   // Canonical E.164 or null
  country: string | null;           // ISO alpha-2 country code (e.g. EG, AE, SA)
  source: string;
  request_type: RequestType;
  property_type: string;
  area: string;
  budget: number | null;
  currency: SupportedCurrency;
  status: LeadStatus;
  next_follow_up_at: string | null;
  last_call_at: string | null;
  created_at: string;
  updated_at: string;
  calls?: CallRecord[];
  notes?: NoteRecord[];
}

export interface UpsertLeadInput {
  id?: string;
  name: string;
  phoneE164: string;
  secondaryPhoneE164?: string | null;
  country?: string | null;
  source: string;
  request_type: RequestType;
  property_type: string;
  area: string;
  budget?: number | null;
  currency: SupportedCurrency;
  status: LeadStatus;
  next_follow_up_at?: string | null;
  initialNote?: string;
}

export interface LogCallInput {
  lead_id: string;
  called_at?: string;
  outcome: CallOutcome;
  feedback: string;
  next_follow_up_at?: string | null;
  new_status?: LeadStatus;
}

export interface UnsavedCallDraft extends LogCallInput {
  draft_id: string;
  lead_name: string;
  failed_at: string;
  error_message: string;
}

const CALL_DRAFT_QUEUE_KEY = 'crm_unsaved_call_drafts_v1';
const DEFAULT_COUNTRY_STORAGE_KEY = 'crm_default_country_v1';

/**
 * Only user preference (default country code) and failed network call drafts
 * are kept in localStorage; all CRM records live in Supabase Postgres.
 */
export function getSavedDefaultCountry(): CountryCode {
  if (typeof window === 'undefined') return 'EG';
  const raw = window.localStorage.getItem(DEFAULT_COUNTRY_STORAGE_KEY);
  return (raw as CountryCode) || 'EG';
}

export function setSavedDefaultCountry(country: CountryCode): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEFAULT_COUNTRY_STORAGE_KEY, country);
}

export function loadUnsavedCallDrafts(): UnsavedCallDraft[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CALL_DRAFT_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUnsavedCallDrafts(drafts: UnsavedCallDraft[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CALL_DRAFT_QUEUE_KEY, JSON.stringify(drafts));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Checks in-memory lead list AND queries Supabase to detect if a phone number
 * (in canonical E.164 format) already exists as a primary or secondary phone on any lead.
 */
export function findLocalDuplicateLead(
  leads: LeadRecord[],
  e164Phone: string,
  excludeLeadId?: string
): LeadRecord | null {
  if (!e164Phone) return null;
  for (const lead of leads) {
    if (excludeLeadId && lead.id === excludeLeadId) continue;
    if (lead.phone === e164Phone || lead.secondary_phone === e164Phone) {
      return lead;
    }
  }
  return null;
}

export async function checkRemoteDuplicatePhone(
  e164Phone: string,
  excludeLeadId?: string
): Promise<LeadRecord | null> {
  if (!e164Phone) return null;
  const supabase = getSupabaseClient();
  let query = supabase
    .from('leads')
    .select('*')
    .or(`phone.eq.${e164Phone},secondary_phone.eq.${e164Phone}`)
    .limit(1);

  if (excludeLeadId) {
    query = query.neq('id', excludeLeadId);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;
  return data[0] as LeadRecord;
}

/**
 * Fetches all leads for the authenticated user along with their calls (newest first)
 * and general notes (newest first).
 */
export async function fetchAllLeadsWithHistory(): Promise<LeadRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('leads')
    .select(
      `
      *,
      calls (*),
      notes (*)
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const leads = (data || []) as LeadRecord[];
  for (const lead of leads) {
    if (Array.isArray(lead.calls)) {
      lead.calls.sort(
        (a, b) =>
          new Date(b.called_at).getTime() - new Date(a.called_at).getTime()
      );
    } else {
      lead.calls = [];
    }
    if (Array.isArray(lead.notes)) {
      lead.notes.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      lead.notes = [];
    }
  }

  return leads;
}

/**
 * Fetches custom sources for the authenticated user merged with DEFAULT_SOURCES.
 */
export async function fetchLeadSources(): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sources')
    .select('name')
    .order('name', { ascending: true });

  if (error) {
    return DEFAULT_SOURCES;
  }

  const customNames = (data || []).map((row: { name: string }) => row.name);
  return Array.from(new Set([...DEFAULT_SOURCES, ...customNames]));
}

export async function createCustomSource(name: string): Promise<string> {
  const cleaned = name.trim();
  if (!cleaned) throw new Error('Source name cannot be empty.');
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated.');

  const { error } = await supabase
    .from('sources')
    .upsert({ user_id: user.id, name: cleaned }, { onConflict: 'user_id,name' });

  if (error) throw new Error(error.message);
  return cleaned;
}

/**
 * Creates or updates a lead in Supabase Postgres after verifying E.164 phone uniqueness.
 */
export async function upsertLeadRecord(
  input: UpsertLeadInput
): Promise<LeadRecord> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to save a lead.');

  // Verify duplicate across primary & secondary phone in Supabase
  const primaryDup = await checkRemoteDuplicatePhone(input.phoneE164, input.id);
  if (primaryDup) {
    throw new Error(
      `Duplicate phone: ${input.phoneE164} is already registered under "${primaryDup.name}".`
    );
  }

  if (input.secondaryPhoneE164) {
    if (input.secondaryPhoneE164 === input.phoneE164) {
      throw new Error('Secondary phone cannot be identical to primary phone.');
    }
    const secDup = await checkRemoteDuplicatePhone(
      input.secondaryPhoneE164,
      input.id
    );
    if (secDup) {
      throw new Error(
        `Duplicate secondary phone: ${input.secondaryPhoneE164} is already registered under "${secDup.name}".`
      );
    }
  }

  const payload = {
    user_id: user.id,
    name: input.name.trim(),
    phone: input.phoneE164,
    secondary_phone: input.secondaryPhoneE164 || null,
    country: input.country || null,
    source: input.source,
    request_type: input.request_type,
    property_type: input.property_type,
    area: input.area.trim(),
    budget:
      input.budget !== undefined && input.budget !== null && !Number.isNaN(Number(input.budget))
        ? Number(input.budget)
        : null,
    currency: input.currency,
    status: input.status,
    next_follow_up_at: input.next_follow_up_at || null,
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', input.id)
      .select('*, calls (*), notes (*)')
      .single();

    if (error) throw new Error(error.message);
    return data as LeadRecord;
  } else {
    const { data, error } = await supabase
      .from('leads')
      .insert(payload)
      .select('*, calls (*), notes (*)')
      .single();

    if (error) throw new Error(error.message);
    const created = data as LeadRecord;

    if (input.initialNote && input.initialNote.trim()) {
      const note = await addGeneralLeadNote(
        created.id,
        input.initialNote.trim()
      );
      created.notes = [note];
    } else {
      created.notes = [];
    }
    created.calls = [];
    return created;
  }
}

export async function updateLeadStatusQuick(
  leadId: string,
  status: LeadStatus
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId);

  if (error) throw new Error(error.message);
}

/**
 * Logs a call to the `calls` table and updates `last_call_at`, `next_follow_up_at`,
 * and optionally `status` on the parent `leads` row.
 */
export async function logCallToSupabase(
  input: LogCallInput
): Promise<CallRecord> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to log a call.');

  const calledAtIso = input.called_at || new Date().toISOString();

  const { data: callData, error: callError } = await supabase
    .from('calls')
    .insert({
      user_id: user.id,
      lead_id: input.lead_id,
      called_at: calledAtIso,
      outcome: input.outcome,
      feedback: input.feedback.trim(),
      next_follow_up_at: input.next_follow_up_at || null,
    })
    .select('*')
    .single();

  if (callError) {
    throw new Error(callError.message);
  }

  const leadUpdates: Record<string, unknown> = {
    last_call_at: calledAtIso,
    updated_at: new Date().toISOString(),
  };
  if (input.next_follow_up_at !== undefined) {
    leadUpdates.next_follow_up_at = input.next_follow_up_at;
  }
  if (input.new_status) {
    leadUpdates.status = input.new_status;
  }

  const { error: leadError } = await supabase
    .from('leads')
    .update(leadUpdates)
    .eq('id', input.lead_id);

  if (leadError) {
    throw new Error(leadError.message);
  }

  return callData as CallRecord;
}

export async function addGeneralLeadNote(
  leadId: string,
  content: string
): Promise<NoteRecord> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to add a note.');

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      lead_id: leadId,
      content: content.trim(),
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as NoteRecord;
}

export function buildWhatsAppTemplate(lead: LeadRecord): string {
  const firstName = lead.name.trim().split(/\s+/)[0] || 'there';
  const areaPart = lead.area ? ` in ${lead.area}` : '';
  const budgetPart =
    lead.budget !== null && lead.budget !== undefined
      ? ` (budget: ${formatBudgetWithCurrency(lead.budget, lead.currency)})`
      : '';
  return `Hi ${firstName}, following up regarding your ${lead.property_type.toLowerCase()} ${lead.request_type.toLowerCase()} inquiry${areaPart}${budgetPart}. Let me know a convenient time to speak or schedule a viewing.`;
}

export interface FollowUpUrgency {
  isOverdue: boolean;
  isDueToday: boolean;
  priorityScore: number; // Lower = higher urgency (most overdue first)
  badgeLabel: string;
}

export function evaluateFollowUpUrgency(
  nextFollowUpIso?: string | null
): FollowUpUrgency {
  if (!nextFollowUpIso) {
    return {
      isOverdue: false,
      isDueToday: false,
      priorityScore: Number.MAX_SAFE_INTEGER,
      badgeLabel: 'NO FOLLOW-UP SET',
    };
  }

  const now = new Date();
  const due = new Date(nextFollowUpIso);
  const diffMs = due.getTime() - now.getTime();

  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  if (diffMs < 0) {
    const overdueMins = Math.max(1, Math.round(Math.abs(diffMs) / 60000));
    let ageText = `${overdueMins}M`;
    if (overdueMins >= 1440) {
      ageText = `${Math.round(overdueMins / 1440)}D`;
    } else if (overdueMins >= 60) {
      ageText = `${Math.round(overdueMins / 60)}H`;
    }
    return {
      isOverdue: true,
      isDueToday: true,
      priorityScore: due.getTime(), // Most overdue (smallest timestamp) comes first
      badgeLabel: `OVERDUE · ${ageText}`,
    };
  }

  if (due.getTime() <= endOfToday.getTime()) {
    const hh = String(due.getHours()).padStart(2, '0');
    const mm = String(due.getMinutes()).padStart(2, '0');
    return {
      isOverdue: false,
      isDueToday: true,
      priorityScore: due.getTime(),
      badgeLabel: `DUE TODAY · ${hh}:${mm}`,
    };
  }

  return {
    isOverdue: false,
    isDueToday: false,
    priorityScore: due.getTime(),
    badgeLabel: `DUE ${formatDateTimeShort(nextFollowUpIso)}`,
  };
}

export function formatDateTimeShort(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  const day = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mon} ${hh}:${mm}`;
}

export function formatDateShort(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  const day = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  return `${day} ${mon}`;
}
