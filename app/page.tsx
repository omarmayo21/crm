'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CountryCode } from 'libphonenumber-js';
import { User } from '@supabase/supabase-js';
import { getDictionary } from '../lib/i18n';
import {
  ALL_CURRENCIES,
  buildTelLink,
  buildWhatsAppLink,
  countryCodeToFlag,
  CURRENCY_SYMBOLS,
  formatBudgetWithCurrency,
  formatPhoneWithFlag,
  getDefaultCurrencyForCountry,
  parseAndValidatePhone,
  SUPPORTED_COUNTRIES,
  SupportedCurrency,
} from '../lib/phone';
import {
  addGeneralLeadNote,
  ALL_REQUEST_TYPES,
  ALL_STATUSES,
  buildWhatsAppTemplate,
  CallOutcome,
  createCustomSource,
  DEFAULT_PROPERTY_TYPES,
  DEFAULT_SOURCES,
  evaluateFollowUpUrgency,
  fetchAllLeadsWithHistory,
  fetchLeadSources,
  findLocalDuplicateLead,
  formatDateShort,
  formatDateTimeShort,
  getSavedDefaultCountry,
  LeadRecord,
  LeadStatus,
  loadUnsavedCallDrafts,
  logCallToSupabase,
  RequestType,
  saveUnsavedCallDrafts,
  SEEDED_AREAS,
  setSavedDefaultCountry,
  UnsavedCallDraft,
  updateLeadStatusQuick,
  upsertLeadRecord,
} from '../lib/repository';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

type ActiveTab = 'TODAY_OVERDUE' | 'ALL_LEADS' | 'ADD_CHECK_PHONE';
type DockMode = 'LOG_CALL' | 'WHATSAPP' | 'NOTES';

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function RealEstateComp2CrmPage() {
  const dict = getDictionary('en');
  const configured = isSupabaseConfigured();

  // Supabase Auth states
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string>('');
  const [authNotice, setAuthNotice] = useState<string>('');
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);

  // Default Country setting (Default: Egypt 'EG' +20)
  const [defaultCountry, setDefaultCountry] = useState<CountryCode>('EG');

  // CRM Data from Supabase
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [sources, setSources] = useState<string[]>(DEFAULT_SOURCES);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string>('');
  const [operationNotice, setOperationNotice] = useState<string>('');

  // Poor-connection Call Log Draft Recovery Queue
  const [unsavedDrafts, setUnsavedDrafts] = useState<UnsavedCallDraft[]>([]);
  const [retryingDraftId, setRetryingDraftId] = useState<string | null>(null);

  // Comp 2 Navigation & Selection States
  const [activeTab, setActiveTab] = useState<ActiveTab>('TODAY_OVERDUE');
  const [activeLeadId, setActiveLeadId] = useState<string>('');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [dockMode, setDockMode] = useState<DockMode>('LOG_CALL');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Search & 6-Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [filterPropertyType, setFilterPropertyType] = useState<string>('ALL');
  const [filterArea, setFilterArea] = useState<string>('ALL');
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [filterLastCall, setFilterLastCall] = useState<string>('ALL');

  // Anchored 10-Second Call Logger States
  const [callOutcome, setCallOutcome] = useState<CallOutcome>('Answered');
  const [callFeedback, setCallFeedback] = useState<string>('');
  const [followUpPreset, setFollowUpPreset] = useState<string>('PLUS_2H');
  const [nextFollowUpLocal, setNextFollowUpLocal] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return toLocalDateTimeInputValue(d);
  });
  const [statusAfterCall, setStatusAfterCall] = useState<LeadStatus | 'KEEP'>(
    'KEEP'
  );
  const [savingCall, setSavingCall] = useState<boolean>(false);
  const [callSaveError, setCallSaveError] = useState<string>('');

  // Editable WhatsApp template state
  const [whatsAppText, setWhatsAppText] = useState<string>('');

  // General Notes (outside call log) state
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [savingNote, setSavingNote] = useState<boolean>(false);

  // Add / Edit Lead Form states
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadName, setLeadName] = useState('');
  const [leadPrimaryPhone, setLeadPrimaryPhone] = useState('');
  const [leadSecondaryPhone, setLeadSecondaryPhone] = useState('');
  const [leadCountry, setLeadCountry] = useState<string>('EG');
  const [leadSource, setLeadSource] = useState('Facebook');
  const [customSourceInput, setCustomSourceInput] = useState('');
  const [leadRequestType, setLeadRequestType] = useState<RequestType>('Buy');
  const [leadPropertyType, setLeadPropertyType] = useState('Apartment');
  const [leadArea, setLeadArea] = useState('');
  const [leadBudget, setLeadBudget] = useState('');
  const [leadCurrency, setLeadCurrency] = useState<SupportedCurrency>('EGP');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('New');
  const [leadFollowUpLocal, setLeadFollowUpLocal] = useState<string>('');
  const [leadInitialNote, setLeadInitialNote] = useState('');
  const [savingLead, setSavingLead] = useState<boolean>(false);
  const [leadFormError, setLeadFormError] = useState<string>('');

  // Register Service Worker & restore Default Country + Unsaved Call Drafts
  useEffect(() => {
    const savedCountry = getSavedDefaultCountry();
    setDefaultCountry(savedCountry);
    setLeadCountry(savedCountry);
    setLeadCurrency(getDefaultCurrencyForCountry(savedCountry));
    setUnsavedDrafts(loadUnsavedCallDrafts());

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const refreshCrmData = useCallback(async () => {
    if (!configured) return;
    setDataLoading(true);
    setDataError('');
    try {
      const [fetchedLeads, fetchedSources] = await Promise.all([
        fetchAllLeadsWithHistory(),
        fetchLeadSources(),
      ]);
      setLeads(fetchedLeads);
      setSources(fetchedSources);
      if (fetchedLeads.length > 0) {
        setActiveLeadId((prev) =>
          prev && fetchedLeads.some((l) => l.id === prev)
            ? prev
            : fetchedLeads[0].id
        );
      }
    } catch (err: unknown) {
      setDataError(
        err instanceof Error
          ? err.message
          : 'Could not reach Supabase. Please check your connection.'
      );
    } finally {
      setDataLoading(false);
    }
  }, [configured]);

  // Listen to Supabase Auth state
  useEffect(() => {
    if (!configured) {
      setAuthLoading(false);
      return;
    }
    const supabase = getSupabaseClient();
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
        if (session?.user) {
          refreshCrmData();
        }
      })
      .catch(() => {
        setAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshCrmData();
      } else {
        setLeads([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured, refreshCrmData]);

  // Priority-sorted Today & Overdue Follow-ups
  const todaysFollowUpItems = useMemo(() => {
    return leads
      .map((lead) => ({
        lead,
        urgency: evaluateFollowUpUrgency(lead.next_follow_up_at),
      }))
      .filter((item) => item.urgency.isOverdue || item.urgency.isDueToday)
      .sort((a, b) => a.urgency.priorityScore - b.urgency.priorityScore);
  }, [leads]);

  // Autocomplete areas: SEEDED_AREAS + any previously used areas
  const autocompleteAreas = useMemo(() => {
    const used = leads.map((l) => l.area).filter(Boolean);
    return Array.from(new Set([...SEEDED_AREAS, ...used]));
  }, [leads]);

  const usedCountries = useMemo(() => {
    const codes = leads.map((l) => l.country).filter(Boolean) as string[];
    return Array.from(new Set(codes));
  }, [leads]);

  // Live duplicate check when typing a phone number in the top Search / Duplicate bar
  const searchBarParsedPhone = useMemo(() => {
    const digits = searchQuery.replace(/[^\d]/g, '');
    if (digits.length < 7) return null;
    const res = parseAndValidatePhone(searchQuery, defaultCountry);
    return res.isValid ? res : null;
  }, [searchQuery, defaultCountry]);

  const searchBarDuplicateMatch = useMemo(() => {
    if (!searchBarParsedPhone?.e164) return null;
    return findLocalDuplicateLead(leads, searchBarParsedPhone.e164);
  }, [leads, searchBarParsedPhone]);

  // Filtered leads for Both Today's Follow-ups and All Leads tabs
  const filteredLeads = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    const searchE164 = searchBarParsedPhone?.e164 || '';
    const searchDigits = searchQuery.replace(/[^\d]/g, '');

    return leads.filter((lead) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = lead.name.toLowerCase().includes(q);
        const exactE164Match =
          Boolean(searchE164) &&
          (lead.phone === searchE164 || lead.secondary_phone === searchE164);
        const rawPhoneMatch =
          lead.phone.toLowerCase().includes(q) ||
          (lead.secondary_phone &&
            lead.secondary_phone.toLowerCase().includes(q)) ||
          (searchDigits.length >= 3 &&
            (lead.phone.replace(/[^\d]/g, '').includes(searchDigits) ||
              (lead.secondary_phone &&
                lead.secondary_phone
                  .replace(/[^\d]/g, '')
                  .includes(searchDigits))));

        if (!nameMatch && !exactE164Match && !rawPhoneMatch) return false;
      }
      if (filterStatus !== 'ALL' && lead.status !== filterStatus) return false;
      if (filterSource !== 'ALL' && lead.source !== filterSource) return false;
      if (
        filterPropertyType !== 'ALL' &&
        lead.property_type.toLowerCase() !== filterPropertyType.toLowerCase()
      )
        return false;
      if (
        filterArea !== 'ALL' &&
        lead.area.toLowerCase() !== filterArea.toLowerCase()
      )
        return false;
      if (
        filterCountry !== 'ALL' &&
        (lead.country || '').toUpperCase() !== filterCountry.toUpperCase()
      )
        return false;

      if (filterLastCall !== 'ALL') {
        const lastCallTime = lead.last_call_at
          ? new Date(lead.last_call_at).getTime()
          : null;
        if (filterLastCall === 'NEVER' && lastCallTime !== null) return false;
        if (
          filterLastCall === 'TODAY' &&
          (!lastCallTime || lastCallTime < startOfToday)
        )
          return false;
        if (
          filterLastCall === 'LAST_7_DAYS' &&
          (!lastCallTime || lastCallTime < sevenDaysAgo)
        )
          return false;
      }
      return true;
    });
  }, [
    leads,
    searchQuery,
    searchBarParsedPhone,
    filterStatus,
    filterSource,
    filterPropertyType,
    filterArea,
    filterCountry,
    filterLastCall,
  ]);

  // Displayed list in the active queue tab
  const displayedCouponItems = useMemo(() => {
    if (activeTab === 'TODAY_OVERDUE') {
      const allowedIds = new Set(filteredLeads.map((l) => l.id));
      return todaysFollowUpItems.filter((item) =>
        allowedIds.has(item.lead.id)
      );
    }
    return filteredLeads.map((lead) => ({
      lead,
      urgency: evaluateFollowUpUrgency(lead.next_follow_up_at),
    }));
  }, [activeTab, filteredLeads, todaysFollowUpItems]);

  const activeLead: LeadRecord | null = useMemo(() => {
    if (leads.length === 0) return null;
    return leads.find((l) => l.id === activeLeadId) || leads[0];
  }, [leads, activeLeadId]);

  useEffect(() => {
    if (activeLead) {
      setWhatsAppText(buildWhatsAppTemplate(activeLead));
    }
  }, [activeLead]);

  // Live libphonenumber-js validation for Add/Edit Lead form
  const parsedPrimaryPhone = useMemo(() => {
    if (!leadPrimaryPhone.trim()) return null;
    return parseAndValidatePhone(leadPrimaryPhone, defaultCountry);
  }, [leadPrimaryPhone, defaultCountry]);

  const parsedSecondaryPhone = useMemo(() => {
    if (!leadSecondaryPhone.trim()) return null;
    return parseAndValidatePhone(leadSecondaryPhone, defaultCountry);
  }, [leadSecondaryPhone, defaultCountry]);

  useEffect(() => {
    if (parsedPrimaryPhone?.isValid && parsedPrimaryPhone.country) {
      setLeadCountry(parsedPrimaryPhone.country);
      if (!editingLeadId) {
        setLeadCurrency(
          getDefaultCurrencyForCountry(parsedPrimaryPhone.country)
        );
      }
    }
  }, [parsedPrimaryPhone, editingLeadId]);

  const primaryDuplicateLead = useMemo(() => {
    if (!parsedPrimaryPhone?.isValid || !parsedPrimaryPhone.e164) return null;
    return findLocalDuplicateLead(
      leads,
      parsedPrimaryPhone.e164,
      editingLeadId || undefined
    );
  }, [leads, parsedPrimaryPhone, editingLeadId]);

  const secondaryDuplicateLead = useMemo(() => {
    if (!parsedSecondaryPhone?.isValid || !parsedSecondaryPhone.e164)
      return null;
    return findLocalDuplicateLead(
      leads,
      parsedSecondaryPhone.e164,
      editingLeadId || undefined
    );
  }, [leads, parsedSecondaryPhone, editingLeadId]);

  function handleDefaultCountryChange(newCountry: CountryCode) {
    setDefaultCountry(newCountry);
    setSavedDefaultCountry(newCountry);
    if (!editingLeadId) {
      setLeadCountry(newCountry);
      setLeadCurrency(getDefaultCurrencyForCountry(newCountry));
    }
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');
    setAuthSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      if (authMode === 'SIGN_IN') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setAuthNotice(
            'Account registered! Check your email inbox to confirm your address, or disable "Confirm email" in Supabase Auth settings for instant login.'
          );
        }
      }
    } catch (err: unknown) {
      setAuthError(
        err instanceof Error ? err.message : 'Authentication failed.'
      );
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setLeads([]);
  }

  function startAddNewLead(prefillPhone = '') {
    setEditingLeadId(null);
    setLeadName('');
    setLeadPrimaryPhone(prefillPhone);
    setLeadSecondaryPhone('');
    setLeadCountry(defaultCountry);
    setLeadSource(sources[0] || 'Facebook');
    setLeadRequestType('Buy');
    setLeadPropertyType('Apartment');
    setLeadArea('');
    setLeadBudget('');
    setLeadCurrency(getDefaultCurrencyForCountry(defaultCountry));
    setLeadStatus('New');
    setLeadFollowUpLocal('');
    setLeadInitialNote('');
    setLeadFormError('');
    setActiveTab('ADD_CHECK_PHONE');
  }

  function startEditLead(lead: LeadRecord) {
    setEditingLeadId(lead.id);
    setLeadName(lead.name);
    setLeadPrimaryPhone(lead.phone);
    setLeadSecondaryPhone(lead.secondary_phone || '');
    setLeadCountry(lead.country || defaultCountry);
    setLeadSource(lead.source);
    setLeadRequestType(lead.request_type);
    setLeadPropertyType(lead.property_type);
    setLeadArea(lead.area);
    setLeadBudget(lead.budget !== null ? String(lead.budget) : '');
    setLeadCurrency(lead.currency || 'EGP');
    setLeadStatus(lead.status);
    setLeadFollowUpLocal(
      lead.next_follow_up_at
        ? toLocalDateTimeInputValue(new Date(lead.next_follow_up_at))
        : ''
    );
    setLeadInitialNote('');
    setLeadFormError('');
    setActiveTab('ADD_CHECK_PHONE');
  }

  async function handleQuickStatusChange(
    lead: LeadRecord,
    newStatus: LeadStatus
  ) {
    const previousLeads = leads;
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
    );
    try {
      await updateLeadStatusQuick(lead.id, newStatus);
      setOperationNotice(`Status updated to "${newStatus}" for ${lead.name}.`);
    } catch (err: unknown) {
      setLeads(previousLeads);
      setDataError(
        err instanceof Error
          ? err.message
          : 'Failed to update status in Supabase.'
      );
    }
  }

  function handlePresetFollowUp(preset: string) {
    setFollowUpPreset(preset);
    const d = new Date();
    if (preset === 'PLUS_2H') {
      d.setHours(d.getHours() + 2);
    } else if (preset === 'TOMORROW_10') {
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);
    } else if (preset === 'THU_16') {
      d.setDate(d.getDate() + 3);
      d.setHours(16, 0, 0, 0);
    }
    setNextFollowUpLocal(toLocalDateTimeInputValue(d));
  }

  async function handleSaveCallLog(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLead) {
      setCallSaveError('Add or select a lead first before logging a call.');
      return;
    }

    setSavingCall(true);
    setCallSaveError('');
    const calledAtIso = new Date().toISOString();
    const followUpIso = nextFollowUpLocal
      ? new Date(nextFollowUpLocal).toISOString()
      : null;

    const nextStatus: LeadStatus | undefined =
      statusAfterCall !== 'KEEP'
        ? statusAfterCall
        : callOutcome === 'No Answer' && activeLead.status === 'New'
          ? 'No Answer'
          : undefined;

    const payload = {
      lead_id: activeLead.id,
      called_at: calledAtIso,
      outcome: callOutcome,
      feedback: callFeedback.trim(),
      next_follow_up_at: followUpIso,
      new_status: nextStatus,
    };

    try {
      await logCallToSupabase(payload);
      setCallFeedback('');
      setOperationNotice(
        `Stamped call (${callOutcome}) for ${activeLead.name}.`
      );

      // Advance to the next lead in the displayed queue automatically ("STAMP & NEXT LEAD")
      const currentIdx = displayedCouponItems.findIndex(
        (item) => item.lead.id === activeLead.id
      );
      if (
        currentIdx >= 0 &&
        currentIdx + 1 < displayedCouponItems.length
      ) {
        setActiveLeadId(displayedCouponItems[currentIdx + 1].lead.id);
      }

      await refreshCrmData();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Network error while saving call log to Supabase.';
      // Never lose a call log: preserve draft in recovery queue and keep form inputs
      const draft: UnsavedCallDraft = {
        ...payload,
        draft_id: `draft-${Date.now()}`,
        lead_name: activeLead.name,
        failed_at: calledAtIso,
        error_message: errorMsg,
      };
      const updatedDrafts = [draft, ...unsavedDrafts];
      setUnsavedDrafts(updatedDrafts);
      saveUnsavedCallDrafts(updatedDrafts);
      setCallSaveError(
        `${errorMsg} — Draft saved locally! Your call notes were NOT lost. Tap Retry above when your connection returns.`
      );
    } finally {
      setSavingCall(false);
    }
  }

  async function handleRetryUnsavedDraft(draft: UnsavedCallDraft) {
    setRetryingDraftId(draft.draft_id);
    setDataError('');
    try {
      await logCallToSupabase({
        lead_id: draft.lead_id,
        called_at: draft.called_at,
        outcome: draft.outcome,
        feedback: draft.feedback,
        next_follow_up_at: draft.next_follow_up_at,
        new_status: draft.new_status,
      });
      const remaining = unsavedDrafts.filter(
        (d) => d.draft_id !== draft.draft_id
      );
      setUnsavedDrafts(remaining);
      saveUnsavedCallDrafts(remaining);
      setOperationNotice(
        `Recovered and saved call log for ${draft.lead_name}!`
      );
      await refreshCrmData();
    } catch (err: unknown) {
      setDataError(
        err instanceof Error
          ? `Retry failed: ${err.message}. Draft remains safely saved.`
          : 'Retry failed. Draft remains safely saved.'
      );
    } finally {
      setRetryingDraftId(null);
    }
  }

  function handleDiscardDraft(draftId: string) {
    const remaining = unsavedDrafts.filter((d) => d.draft_id !== draftId);
    setUnsavedDrafts(remaining);
    saveUnsavedCallDrafts(remaining);
  }

  async function handleAddNoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeLead || !newNoteText.trim()) return;
    setSavingNote(true);
    setDataError('');
    try {
      await addGeneralLeadNote(activeLead.id, newNoteText.trim());
      setNewNoteText('');
      setOperationNotice(`General note added for ${activeLead.name}.`);
      await refreshCrmData();
    } catch (err: unknown) {
      setDataError(
        err instanceof Error ? err.message : 'Failed to save general note.'
      );
    } finally {
      setSavingNote(false);
    }
  }

  async function handleAddCustomSource() {
    if (!customSourceInput.trim()) return;
    try {
      const created = await createCustomSource(customSourceInput.trim());
      if (!sources.includes(created)) {
        setSources((prev) => [...prev, created]);
      }
      setLeadSource(created);
      setCustomSourceInput('');
    } catch (err: unknown) {
      setLeadFormError(
        err instanceof Error ? err.message : 'Failed to save custom source.'
      );
    }
  }

  async function handleSaveLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLeadFormError('');

    if (!leadName.trim()) {
      setLeadFormError('Lead name is required.');
      return;
    }
    if (!parsedPrimaryPhone || !parsedPrimaryPhone.isValid) {
      setLeadFormError(
        parsedPrimaryPhone?.error || 'Please enter a valid primary phone number.'
      );
      return;
    }
    if (
      leadSecondaryPhone.trim() &&
      (!parsedSecondaryPhone || !parsedSecondaryPhone.isValid)
    ) {
      setLeadFormError(
        parsedSecondaryPhone?.error ||
          'Secondary phone number is invalid for its country.'
      );
      return;
    }
    if (primaryDuplicateLead) {
      setLeadFormError(
        `Duplicate primary phone: ${parsedPrimaryPhone.e164} already belongs to "${primaryDuplicateLead.name}".`
      );
      return;
    }
    if (secondaryDuplicateLead) {
      setLeadFormError(
        `Duplicate secondary phone: ${parsedSecondaryPhone?.e164} already belongs to "${secondaryDuplicateLead.name}".`
      );
      return;
    }

    setSavingLead(true);
    try {
      const saved = await upsertLeadRecord({
        id: editingLeadId || undefined,
        name: leadName.trim(),
        phoneE164: parsedPrimaryPhone.e164,
        secondaryPhoneE164: parsedSecondaryPhone?.isValid
          ? parsedSecondaryPhone.e164
          : null,
        country:
          leadCountry || parsedPrimaryPhone.country || defaultCountry,
        source: leadSource,
        request_type: leadRequestType,
        property_type: leadPropertyType,
        area: leadArea.trim(),
        budget: leadBudget.trim() ? Number(leadBudget) : null,
        currency: leadCurrency,
        status: leadStatus,
        next_follow_up_at: leadFollowUpLocal
          ? new Date(leadFollowUpLocal).toISOString()
          : null,
        initialNote: editingLeadId ? undefined : leadInitialNote.trim(),
      });

      await refreshCrmData();
      setActiveLeadId(saved.id);
      setEditingLeadId(null);
      setOperationNotice(
        editingLeadId
          ? `Updated lead "${saved.name}".`
          : `Added new lead "${saved.name}" (${saved.phone}).`
      );
      setActiveTab('ALL_LEADS');
    } catch (err: unknown) {
      setLeadFormError(
        err instanceof Error ? err.message : 'Failed to save lead to Supabase.'
      );
    } finally {
      setSavingLead(false);
    }
  }

  return (
    <div className="comp2-app-shell" dir={dict.dir}>
      {/* ====================================================================
          TOP CARRIER NAVY MASTHEAD & COMP 2 TABBED FOLDER HEADS
          ==================================================================== */}
      <header className="comp2-navy-masthead">
        <div className="comp2-masthead-inner">
          <div className="comp2-utility-strip">
            <div className="comp2-brand-group">
              <h1 className="comp2-brand-title">REAL ESTATE CALL CRM</h1>
            </div>

            <div className="comp2-utility-controls">
              <label
                htmlFor="default-country-select"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                }}
              >
                DEFAULT:
              </label>
              <select
                id="default-country-select"
                className="comp2-country-select"
                value={defaultCountry}
                onChange={(e) =>
                  handleDefaultCountryChange(e.target.value as CountryCode)
                }
                title="Numbers typed without + or 00 use this default country"
              >
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.dialCode}) · {c.defaultCurrency}
                  </option>
                ))}
              </select>

              {user && (
                <>
                  <button
                    type="button"
                    className="mini-action-link"
                    onClick={refreshCrmData}
                    disabled={dataLoading}
                  >
                    {dataLoading ? 'SYNCING...' : '↻ SYNC'}
                  </button>
                  <button
                    type="button"
                    className="mini-action-link red"
                    onClick={handleSignOut}
                  >
                    {dict.auth.signOutButton}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Comp 2 Three Folder Tabs */}
          <nav className="comp2-folder-tabs" aria-label="CRM Primary Views">
            <button
              type="button"
              onClick={() => setActiveTab('TODAY_OVERDUE')}
              className={`comp2-folder-tab ${
                activeTab === 'TODAY_OVERDUE' ? 'active' : ''
              }`}
            >
              TODAY &amp; OVERDUE [{todaysFollowUpItems.length}]
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ALL_LEADS')}
              className={`comp2-folder-tab ${
                activeTab === 'ALL_LEADS' ? 'active' : ''
              }`}
            >
              ALL LEADS [{leads.length}]
            </button>
            <button
              type="button"
              onClick={() => startAddNewLead()}
              className={`comp2-folder-tab ${
                activeTab === 'ADD_CHECK_PHONE' ? 'active' : ''
              }`}
            >
              {editingLeadId ? '✎ EDIT LEAD' : '+ ADD / CHECK PHONE'}
            </button>
          </nav>
        </div>
      </header>

      {/* ====================================================================
          POOR-CONNECTION CALL DRAFT RECOVERY QUEUE (Never lose a call log)
          ==================================================================== */}
      {unsavedDrafts.length > 0 && (
        <div className="network-draft-alert" role="alert">
          <strong
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.35rem',
              display: 'block',
            }}
          >
            {dict.calls.draftRecoveryWarning} ({unsavedDrafts.length} UNSAVED)
          </strong>
          {unsavedDrafts.map((draft) => (
            <div
              key={draft.draft_id}
              style={{
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px dashed var(--jet-red)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
              }}
            >
              <span>
                <strong>{draft.lead_name}</strong> · Outcome:{' '}
                <strong>{draft.outcome}</strong> · Notes: &ldquo;
                {draft.feedback || '—'}&rdquo; ·{' '}
                {formatDateTimeShort(draft.failed_at)}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="mini-action-link red"
                  disabled={retryingDraftId === draft.draft_id}
                  onClick={() => handleRetryUnsavedDraft(draft)}
                >
                  {retryingDraftId === draft.draft_id
                    ? 'RETRYING...'
                    : dict.calls.retrySaveDraft}
                </button>
                <button
                  type="button"
                  className="mini-action-link"
                  onClick={() => handleDiscardDraft(draft.draft_id)}
                >
                  {dict.calls.discardDraft}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================================================================
          SUPABASE SETUP / AUTHENTICATION GATE
          ==================================================================== */}
      {!configured && (
        <div className="comp2-search-section">
          <div className="duplicate-warning-banner" role="alert">
            <strong>SUPABASE CONFIGURATION REQUIRED:</strong> Copy{' '}
            <code>.env.example</code> to <code>.env.local</code>, set{' '}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and run{' '}
            <code>supabase/schema.sql</code> in your Supabase SQL Editor.
          </div>
        </div>
      )}

      {configured && !authLoading && !user && (
        <div className="comp2-search-section">
          <div className="auth-card-shell">
            <div className="wallet-panel-header">
              <h2 className="wallet-panel-title">
                {authMode === 'SIGN_IN'
                  ? dict.auth.signInTitle
                  : dict.auth.signUpTitle}
              </h2>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                }}
              >
                SUPABASE AUTH
              </span>
            </div>
            <form className="drawer-body" onSubmit={handleAuthSubmit}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  color: 'var(--carbon-rule)',
                }}
              >
                {dict.auth.teamReadyNote}
              </div>

              {authError && (
                <div className="duplicate-warning-banner" role="alert">
                  {authError}
                </div>
              )}
              {authNotice && (
                <div
                  style={{
                    padding: 12,
                    border: '1px solid var(--verified-emerald)',
                    background: 'var(--cell-cream)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {authNotice}
                </div>
              )}

              <div>
                <label className="coupon-label" htmlFor="auth-email">
                  {dict.auth.emailLabel}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  className="coupon-input"
                  required
                  placeholder="agent@realestate.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="coupon-label" htmlFor="auth-password">
                  {dict.auth.passwordLabel}
                </label>
                <input
                  id="auth-password"
                  type="password"
                  className="coupon-input"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="comp2-stamp-submit-btn"
                disabled={authSubmitting}
              >
                {authSubmitting
                  ? 'AUTHENTICATING...'
                  : authMode === 'SIGN_IN'
                    ? dict.auth.signInButton
                    : dict.auth.signUpButton}
              </button>

              <button
                type="button"
                className="quick-chip-btn"
                style={{ textAlign: 'center', width: '100%' }}
                onClick={() => {
                  setAuthError('');
                  setAuthNotice('');
                  setAuthMode((m) => (m === 'SIGN_IN' ? 'SIGN_UP' : 'SIGN_IN'));
                }}
              >
                {authMode === 'SIGN_IN'
                  ? dict.auth.switchToSignUp
                  : dict.auth.switchToSignIn}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          COMP 2 SEARCH & LIVE E.164 DUPLICATE CHECK BAR + 6 FILTERS
          ==================================================================== */}
      {user && (
        <>
          <section
            className="comp2-search-section"
            aria-label="Search and Filters"
          >
            <div className="comp2-search-box">
              <svg
                className="comp2-search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="comp2-search-input"
                placeholder={`Search name or enter ${defaultCountry} / +international phone to check duplicates...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="mini-action-link"
                  onClick={() => setSearchQuery('')}
                >
                  CLEAR
                </button>
              )}
              <button
                type="button"
                className={`comp2-filter-toggle-btn ${
                  showFilters ? 'active' : ''
                }`}
                onClick={() => setShowFilters((v) => !v)}
              >
                FILTERS {showFilters ? '▲' : '▼'}
              </button>
            </div>

            {/* Instant E.164 Phone Check feedback right under the search bar */}
            {searchBarParsedPhone && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: searchBarDuplicateMatch
                    ? '1.5px solid var(--jet-red)'
                    : '1.5px solid var(--verified-emerald)',
                  background: 'var(--coupon-white)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                }}
              >
                {searchBarDuplicateMatch ? (
                  <>
                    <span style={{ color: 'var(--jet-red-dark)' }}>
                      <strong>DUPLICATE EXISTS:</strong>{' '}
                      {searchBarParsedPhone.flag}{' '}
                      {searchBarParsedPhone.international} (
                      <code>{searchBarParsedPhone.e164}</code>) belongs to{' '}
                      <strong>{searchBarDuplicateMatch.name}</strong> (Status:{' '}
                      {searchBarDuplicateMatch.status})
                    </span>
                    <button
                      type="button"
                      className="mini-action-link red"
                      onClick={() => {
                        setActiveLeadId(searchBarDuplicateMatch.id);
                        setExpandedLeadId(searchBarDuplicateMatch.id);
                      }}
                    >
                      SELECT LEAD
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ color: 'var(--verified-emerald)' }}>
                      <strong>✓ AVAILABLE (NO DUPLICATE):</strong>{' '}
                      {searchBarParsedPhone.flag}{' '}
                      {searchBarParsedPhone.international} (E.164:{' '}
                      <code>{searchBarParsedPhone.e164}</code>)
                    </span>
                    <button
                      type="button"
                      className="mini-action-link"
                      onClick={() => startAddNewLead(searchQuery)}
                    >
                      + ADD AS NEW LEAD
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Expandable 6-Filter Bar (Status, Source, Property Type, Area, Country, Last Call Date) */}
            {showFilters && (
              <div className="comp2-filters-drawer">
                <div>
                  <span className="coupon-label">STATUS</span>
                  <select
                    className="coupon-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">{dict.filters.allStatuses}</option>
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="coupon-label">SOURCE</span>
                  <select
                    className="coupon-select"
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                  >
                    <option value="ALL">{dict.filters.allSources}</option>
                    {sources.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="coupon-label">PROPERTY TYPE</span>
                  <select
                    className="coupon-select"
                    value={filterPropertyType}
                    onChange={(e) => setFilterPropertyType(e.target.value)}
                  >
                    <option value="ALL">{dict.filters.allPropertyTypes}</option>
                    {DEFAULT_PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="coupon-label">AREA / PROJECT</span>
                  <select
                    className="coupon-select"
                    value={filterArea}
                    onChange={(e) => setFilterArea(e.target.value)}
                  >
                    <option value="ALL">{dict.filters.allAreas}</option>
                    {autocompleteAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="coupon-label">COUNTRY</span>
                  <select
                    className="coupon-select"
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                  >
                    <option value="ALL">{dict.filters.allCountries}</option>
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.code})
                      </option>
                    ))}
                    {usedCountries
                      .filter(
                        (code) =>
                          !SUPPORTED_COUNTRIES.some((c) => c.code === code)
                      )
                      .map((code) => (
                        <option key={code} value={code}>
                          {countryCodeToFlag(code)} {code}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <span className="coupon-label">LAST CALL DATE</span>
                  <select
                    className="coupon-select"
                    value={filterLastCall}
                    onChange={(e) => setFilterLastCall(e.target.value)}
                  >
                    <option value="ALL">{dict.filters.lastCallAny}</option>
                    <option value="TODAY">{dict.filters.lastCallToday}</option>
                    <option value="LAST_7_DAYS">
                      {dict.filters.lastCall7Days}
                    </option>
                    <option value="NEVER">{dict.filters.lastCallNever}</option>
                  </select>
                </div>
              </div>
            )}

            {dataError && (
              <div
                className="duplicate-warning-banner"
                style={{ marginTop: 8 }}
                role="alert"
              >
                <span>{dataError}</span>{' '}
                <button
                  type="button"
                  className="mini-action-link red"
                  style={{ marginLeft: 8 }}
                  onClick={refreshCrmData}
                >
                  RETRY
                </button>
              </div>
            )}

            {operationNotice && (
              <div
                style={{
                  marginTop: 8,
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: '1px solid var(--verified-emerald)',
                  background: 'var(--cell-cream)',
                  color: 'var(--carrier-navy)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>✓ {operationNotice}</span>
                <button
                  type="button"
                  className="mini-action-link"
                  onClick={() => setOperationNotice('')}
                >
                  OK
                </button>
              </div>
            )}
          </section>

          {/* ================================================================
              COMP 2 WORKSPACE: PRIORITY COUPON QUEUE + ANCHORED 10S THUMB LOGGER
              ================================================================ */}
          <main className="comp2-workspace">
            {/* LEFT / TOP: TABBED COUPON QUEUE OR ADD/EDIT LEAD FORM */}
            <section aria-label="Lead Coupons Queue">
              {dataLoading && (
                <div className="comp2-coupon-stack">
                  <div className="skeleton-block" />
                  <div className="skeleton-block" />
                  <div className="skeleton-block" />
                </div>
              )}

              {/* VIEW A: TODAY & OVERDUE OR ALL LEADS COUPON STACK */}
              {!dataLoading &&
                (activeTab === 'TODAY_OVERDUE' ||
                  activeTab === 'ALL_LEADS') && (
                  <>
                    {displayedCouponItems.length === 0 ? (
                      <div
                        className="comp2-coupon-stack"
                        style={{
                          padding: 24,
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.9rem',
                        }}
                      >
                        <strong
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.35rem',
                            display: 'block',
                            marginBottom: 6,
                          }}
                        >
                          {activeTab === 'TODAY_OVERDUE'
                            ? 'NO FOLLOW-UPS DUE TODAY OR OVERDUE'
                            : 'NO LEADS FOUND'}
                        </strong>
                        <p style={{ margin: '0 0 12px' }}>
                          {leads.length === 0
                            ? 'Your Supabase database is clean (no fake leads inserted). Tap below to add your first real lead.'
                            : 'Try switching to ALL LEADS or clearing your active search/filters.'}
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="button"
                            className="mini-action-link red"
                            onClick={() => startAddNewLead()}
                          >
                            + ADD NEW LEAD
                          </button>
                          {activeTab === 'TODAY_OVERDUE' &&
                            leads.length > 0 && (
                              <button
                                type="button"
                                className="mini-action-link"
                                onClick={() => setActiveTab('ALL_LEADS')}
                              >
                                VIEW ALL LEADS ({leads.length})
                              </button>
                            )}
                        </div>
                      </div>
                    ) : (
                      <div className="comp2-coupon-stack">
                        {displayedCouponItems.map(
                          ({ lead, urgency }, index) => {
                            const isSelected = activeLead?.id === lead.id;
                            const isExpanded = expandedLeadId === lead.id;
                            const phoneDisplay = formatPhoneWithFlag(
                              lead.phone,
                              defaultCountry
                            );
                            const secDisplay = lead.secondary_phone
                              ? formatPhoneWithFlag(
                                  lead.secondary_phone,
                                  defaultCountry
                                )
                              : null;
                            const calls = lead.calls || [];
                            const notes = lead.notes || [];

                            // Format compact 2-line stamp text like Comp 2 ("OVERDUE / 3H" or "DUE / 16:00")
                            const stampParts = urgency.badgeLabel.split(' · ');
                            const stampTop = stampParts[0] || lead.status;
                            const stampBottom =
                              stampParts[1] ||
                              formatDateShort(lead.created_at);

                            return (
                              <article
                                key={lead.id}
                                className={`comp2-lead-coupon ${
                                  isSelected ? 'selected' : ''
                                }`}
                              >
                                {/* Left Priority Number Stub (Red for Overdue, Navy otherwise) */}
                                <div
                                  className={`comp2-priority-stub ${
                                    urgency.isOverdue ? 'overdue' : ''
                                  }`}
                                  onClick={() => setActiveLeadId(lead.id)}
                                  title="Tap to select lead in the 10-second call logger"
                                >
                                  {String(index + 1).padStart(2, '0')}
                                </div>

                                {/* Angled Rubber Urgency Stamp */}
                                <div
                                  className="comp2-stamp-cell"
                                  onClick={() => setActiveLeadId(lead.id)}
                                >
                                  <div
                                    className={`comp2-rubber-stamp ${
                                      urgency.isOverdue ? 'overdue' : ''
                                    }`}
                                  >
                                    <div>{stampTop}</div>
                                    <div>{stampBottom}</div>
                                  </div>
                                </div>

                                {/* Main Lead Coupon Content & Oval Pill Actions */}
                                <div className="comp2-coupon-body">
                                  <div
                                    className="comp2-lead-title-row"
                                    onClick={() => setActiveLeadId(lead.id)}
                                  >
                                    <h2 className="comp2-lead-name">
                                      {lead.name}
                                    </h2>
                                    <span
                                      style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        color: 'var(--carbon-purple)',
                                      }}
                                    >
                                      {lead.country
                                        ? `${countryCodeToFlag(lead.country)} ${lead.country} · `
                                        : ''}
                                      {lead.source}
                                    </span>
                                  </div>

                                  <div className="comp2-lead-meta-line">
                                    {phoneDisplay.flag} {phoneDisplay.formatted}{' '}
                                    · {lead.request_type.toUpperCase()} ·{' '}
                                    {lead.property_type.toUpperCase()}
                                    {lead.area
                                      ? ` · ${lead.area.toUpperCase()}`
                                      : ''}
                                    {lead.budget !== null
                                      ? ` · ${formatBudgetWithCurrency(
                                          lead.budget,
                                          lead.currency
                                        )}`
                                      : ''}
                                  </div>

                                  {/* Comp 2 Oval Pill Action Row */}
                                  <div className="comp2-pill-actions">
                                    <a
                                      href={buildTelLink(lead.phone)}
                                      className="comp2-oval-pill"
                                      onClick={() => setActiveLeadId(lead.id)}
                                    >
                                      TEL:
                                    </a>

                                    <a
                                      href={buildWhatsAppLink(
                                        lead.phone,
                                        buildWhatsAppTemplate(lead)
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="comp2-oval-pill"
                                      onClick={() => setActiveLeadId(lead.id)}
                                    >
                                      WA.ME
                                    </a>

                                    <button
                                      type="button"
                                      className="comp2-oval-pill active-purple"
                                      onClick={() => {
                                        setActiveLeadId(lead.id);
                                        setDockMode('WHATSAPP');
                                      }}
                                    >
                                      EDIT WA MSG
                                    </button>

                                    <select
                                      aria-label={`Change status for ${lead.name}`}
                                      className="comp2-status-inline-select"
                                      value={lead.status}
                                      onChange={(e) =>
                                        handleQuickStatusChange(
                                          lead,
                                          e.target.value as LeadStatus
                                        )
                                      }
                                    >
                                      {ALL_STATUSES.map((st) => (
                                        <option key={st} value={st}>
                                          {st}
                                        </option>
                                      ))}
                                    </select>

                                    <button
                                      type="button"
                                      className={`comp2-oval-pill ${
                                        isExpanded ? 'active-navy' : ''
                                      }`}
                                      onClick={() => {
                                        setActiveLeadId(lead.id);
                                        setExpandedLeadId(
                                          isExpanded ? null : lead.id
                                        );
                                      }}
                                    >
                                      HISTORY ({calls.length}) &amp; NOTES (
                                      {notes.length}) {isExpanded ? '▲' : '▼'}
                                    </button>

                                    <button
                                      type="button"
                                      className="comp2-oval-pill"
                                      onClick={() => startEditLead(lead)}
                                    >
                                      EDIT
                                    </button>
                                  </div>
                                </div>

                                {/* Expandable Call History Timeline (Newest First) & General Notes */}
                                {isExpanded && (
                                  <div className="comp2-expanded-dossier">
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-between',
                                        gap: 8,
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.85rem',
                                      }}
                                    >
                                      <span>
                                        <strong>E.164:</strong> {lead.phone}
                                        {secDisplay
                                          ? ` · SECONDARY: ${secDisplay.flag} ${secDisplay.formatted}`
                                          : ''}
                                      </span>
                                      <span>
                                        <strong>ADDED:</strong>{' '}
                                        {formatDateTimeShort(lead.created_at)} ·{' '}
                                        <strong>NEXT FOLLOW-UP:</strong>{' '}
                                        {formatDateTimeShort(
                                          lead.next_follow_up_at
                                        )}
                                      </span>
                                    </div>

                                    {/* Newest-First Call Log Timeline */}
                                    <div>
                                      <span className="coupon-label">
                                        {dict.calls.timelineTitle} (
                                        {calls.length})
                                      </span>
                                      {calls.length === 0 ? (
                                        <div
                                          style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.85rem',
                                            color: 'var(--carbon-rule)',
                                          }}
                                        >
                                          {dict.calls.noCallsYet}
                                        </div>
                                      ) : (
                                        <div
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 8,
                                          }}
                                        >
                                          {calls.map((call, cIdx) => (
                                            <div
                                              key={call.id}
                                              style={{
                                                padding: '8px 12px',
                                                background:
                                                  'var(--coupon-white)',
                                                border:
                                                  '1px solid var(--carbon-rule)',
                                                borderRadius: 6,
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.85rem',
                                              }}
                                            >
                                              <div
                                                style={{
                                                  fontWeight: 700,
                                                  color: 'var(--carrier-navy)',
                                                }}
                                              >
                                                CALL #
                                                {String(
                                                  calls.length - cIdx
                                                ).padStart(2, '0')}{' '}
                                                ·{' '}
                                                {formatDateTimeShort(
                                                  call.called_at
                                                )}{' '}
                                                ·{' '}
                                                <span
                                                  style={{
                                                    color:
                                                      call.outcome ===
                                                      'Answered'
                                                        ? 'var(--verified-emerald)'
                                                        : 'var(--jet-red)',
                                                  }}
                                                >
                                                  {call.outcome.toUpperCase()}
                                                </span>
                                              </div>
                                              {call.feedback && (
                                                <div style={{ marginTop: 4 }}>
                                                  {call.feedback}
                                                </div>
                                              )}
                                              {call.next_follow_up_at && (
                                                <div
                                                  style={{
                                                    marginTop: 4,
                                                    fontWeight: 700,
                                                    color:
                                                      'var(--carbon-purple)',
                                                  }}
                                                >
                                                  NEXT FOLLOW-UP:{' '}
                                                  {formatDateTimeShort(
                                                    call.next_follow_up_at
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    {/* General Lead Notes Outside Call Log */}
                                    <div>
                                      <span className="coupon-label">
                                        {dict.notes.generalNotesTitle} (
                                        {notes.length})
                                      </span>
                                      {notes.length === 0 ? (
                                        <div
                                          style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: '0.85rem',
                                            color: 'var(--carbon-rule)',
                                          }}
                                        >
                                          {dict.notes.noNotesYet}
                                        </div>
                                      ) : (
                                        <div
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 6,
                                          }}
                                        >
                                          {notes.map((note) => (
                                            <div
                                              key={note.id}
                                              style={{
                                                padding: '8px 12px',
                                                background: 'var(--cell-cream)',
                                                border:
                                                  '1px solid var(--carbon-rule)',
                                                borderRadius: 6,
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.85rem',
                                              }}
                                            >
                                              <strong>
                                                {formatDateTimeShort(
                                                  note.created_at
                                                )}
                                                :
                                              </strong>{' '}
                                              {note.content}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </article>
                            );
                          }
                        )}
                      </div>
                    )}
                  </>
                )}

              {/* VIEW B: + ADD / EDIT LEAD FORM WITH LIBPHONENUMBER-JS E.164 DUPLICATE GUARD */}
              {!dataLoading && activeTab === 'ADD_CHECK_PHONE' && (
                <div
                  className="comp2-coupon-stack"
                  style={{ padding: 18 }}
                >
                  <form
                    onSubmit={handleSaveLeadSubmit}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.35rem',
                        }}
                      >
                        {editingLeadId
                          ? `EDIT LEAD: ${leadName}`
                          : 'ADD NEW LEAD (E.164 DUPLICATE GUARD)'}
                      </h2>
                      {editingLeadId && (
                        <button
                          type="button"
                          className="mini-action-link"
                          onClick={() => startAddNewLead()}
                        >
                          {dict.lead.cancelEdit}
                        </button>
                      )}
                    </div>

                    {leadFormError && (
                      <div className="duplicate-warning-banner" role="alert">
                        {leadFormError}
                      </div>
                    )}

                    <div>
                      <label
                        className="coupon-label"
                        htmlFor="lead-phone-input"
                      >
                        {dict.lead.primaryPhone} (DEFAULT: {defaultCountry}) *
                      </label>
                      <input
                        id="lead-phone-input"
                        type="tel"
                        className="coupon-input"
                        placeholder="e.g. 01012345678, +201012345678, 00971501234567"
                        value={leadPrimaryPhone}
                        onChange={(e) => setLeadPrimaryPhone(e.target.value)}
                        required
                      />
                      {parsedPrimaryPhone && parsedPrimaryPhone.isValid && (
                        <div className="phone-preview-hint">
                          ✓ {parsedPrimaryPhone.flag}{' '}
                          {parsedPrimaryPhone.international} · Canonical E.164:{' '}
                          <strong>{parsedPrimaryPhone.e164}</strong>
                        </div>
                      )}
                      {parsedPrimaryPhone && !parsedPrimaryPhone.isValid && (
                        <div className="phone-preview-error">
                          ✕ {parsedPrimaryPhone.error}
                        </div>
                      )}
                      {primaryDuplicateLead && (
                        <div
                          className="duplicate-warning-banner"
                          style={{ marginTop: 8 }}
                          role="alert"
                        >
                          <strong>{dict.lead.duplicateWarningTitle}:</strong>{' '}
                          <code>{parsedPrimaryPhone?.e164}</code> is already
                          registered under{' '}
                          <strong>{primaryDuplicateLead.name}</strong> (Status:{' '}
                          {primaryDuplicateLead.status}).{' '}
                          <button
                            type="button"
                            className="mini-action-link red"
                            style={{ marginLeft: 8 }}
                            onClick={() => {
                              setActiveLeadId(primaryDuplicateLead.id);
                              setExpandedLeadId(primaryDuplicateLead.id);
                              setActiveTab('ALL_LEADS');
                            }}
                          >
                            {dict.lead.openExistingLead}
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 10,
                      }}
                    >
                      <div>
                        <label
                          className="coupon-label"
                          htmlFor="lead-name-input"
                        >
                          {dict.lead.name} *
                        </label>
                        <input
                          id="lead-name-input"
                          type="text"
                          className="coupon-input"
                          placeholder="e.g. Tarek El-Masry"
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label
                          className="coupon-label"
                          htmlFor="lead-sec-phone-input"
                        >
                          {dict.lead.secondaryPhone}
                        </label>
                        <input
                          id="lead-sec-phone-input"
                          type="tel"
                          className="coupon-input"
                          placeholder="Optional secondary phone"
                          value={leadSecondaryPhone}
                          onChange={(e) =>
                            setLeadSecondaryPhone(e.target.value)
                          }
                        />
                        {parsedSecondaryPhone &&
                          parsedSecondaryPhone.isValid && (
                            <div className="phone-preview-hint">
                              ✓ {parsedSecondaryPhone.flag}{' '}
                              {parsedSecondaryPhone.international} (
                              {parsedSecondaryPhone.e164})
                            </div>
                          )}
                        {parsedSecondaryPhone &&
                          !parsedSecondaryPhone.isValid && (
                            <div className="phone-preview-error">
                              ✕ {parsedSecondaryPhone.error}
                            </div>
                          )}
                      </div>
                    </div>

                    {secondaryDuplicateLead && (
                      <div className="duplicate-warning-banner" role="alert">
                        <strong>{dict.lead.duplicateWarningTitle}:</strong>{' '}
                        Secondary number{' '}
                        <code>{parsedSecondaryPhone?.e164}</code> already exists
                        on <strong>{secondaryDuplicateLead.name}</strong>.
                      </div>
                    )}

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 10,
                      }}
                    >
                      <div>
                        <label className="coupon-label">
                          {dict.lead.source}
                        </label>
                        <select
                          className="coupon-select"
                          value={leadSource}
                          onChange={(e) => setLeadSource(e.target.value)}
                        >
                          {sources.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="coupon-label">
                          ADD NEW SOURCE TO SUPABASE
                        </label>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            type="text"
                            className="coupon-input"
                            placeholder={dict.lead.addSourcePlaceholder}
                            value={customSourceInput}
                            onChange={(e) =>
                              setCustomSourceInput(e.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="mini-action-link"
                            onClick={handleAddCustomSource}
                          >
                            + ADD
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: 10,
                      }}
                    >
                      <div>
                        <label className="coupon-label">
                          {dict.lead.requestType}
                        </label>
                        <select
                          className="coupon-select"
                          value={leadRequestType}
                          onChange={(e) =>
                            setLeadRequestType(e.target.value as RequestType)
                          }
                        >
                          {ALL_REQUEST_TYPES.map((rt) => (
                            <option key={rt} value={rt}>
                              {rt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="coupon-label">
                          {dict.lead.propertyType}
                        </label>
                        <select
                          className="coupon-select"
                          value={leadPropertyType}
                          onChange={(e) => setLeadPropertyType(e.target.value)}
                        >
                          {DEFAULT_PROPERTY_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="coupon-label">
                          {dict.lead.country} (OPTIONAL)
                        </label>
                        <select
                          className="coupon-select"
                          value={leadCountry}
                          onChange={(e) => setLeadCountry(e.target.value)}
                        >
                          <option value="">— Any / Unspecified —</option>
                          {SUPPORTED_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.name} ({c.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.1fr 0.55fr 0.95fr',
                        gap: 10,
                      }}
                    >
                      <div>
                        <label
                          className="coupon-label"
                          htmlFor="lead-area-input"
                        >
                          {dict.lead.area} (AUTOCOMPLETE)
                        </label>
                        <input
                          id="lead-area-input"
                          type="text"
                          list="crm-areas-datalist"
                          className="coupon-input"
                          placeholder="New Cairo, Sheikh Zayed, Dubai Marina..."
                          value={leadArea}
                          onChange={(e) => setLeadArea(e.target.value)}
                        />
                        <datalist id="crm-areas-datalist">
                          {autocompleteAreas.map((area) => (
                            <option key={area} value={area} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="coupon-label">
                          {dict.lead.currency}
                        </label>
                        <select
                          className="coupon-select"
                          value={leadCurrency}
                          onChange={(e) =>
                            setLeadCurrency(e.target.value as SupportedCurrency)
                          }
                        >
                          {ALL_CURRENCIES.map((curr) => (
                            <option key={curr} value={curr}>
                              {curr} ({CURRENCY_SYMBOLS[curr]})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="coupon-label">
                          {dict.lead.budget} ({CURRENCY_SYMBOLS[leadCurrency]})
                        </label>
                        <input
                          type="number"
                          step="any"
                          className="coupon-input"
                          placeholder={`Amount in ${leadCurrency}`}
                          value={leadBudget}
                          onChange={(e) => setLeadBudget(e.target.value)}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 10,
                      }}
                    >
                      <div>
                        <label className="coupon-label">
                          {dict.lead.status}
                        </label>
                        <select
                          className="coupon-select"
                          value={leadStatus}
                          onChange={(e) =>
                            setLeadStatus(e.target.value as LeadStatus)
                          }
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="coupon-label">
                          {dict.lead.nextFollowUp} (OPTIONAL)
                        </label>
                        <input
                          type="datetime-local"
                          className="coupon-input"
                          value={leadFollowUpLocal}
                          onChange={(e) => setLeadFollowUpLocal(e.target.value)}
                        />
                      </div>
                    </div>

                    {!editingLeadId && (
                      <div>
                        <label className="coupon-label">
                          INITIAL GENERAL NOTE (OPTIONAL)
                        </label>
                        <textarea
                          rows={2}
                          className="coupon-textarea"
                          placeholder="Client requirements, payment preferences, unit size..."
                          value={leadInitialNote}
                          onChange={(e) => setLeadInitialNote(e.target.value)}
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="comp2-stamp-submit-btn"
                      disabled={
                        savingLead ||
                        Boolean(primaryDuplicateLead) ||
                        Boolean(secondaryDuplicateLead)
                      }
                      style={{
                        opacity:
                          savingLead ||
                          primaryDuplicateLead ||
                          secondaryDuplicateLead
                            ? 0.45
                            : 1,
                      }}
                    >
                      {savingLead
                        ? 'SAVING TO SUPABASE...'
                        : editingLeadId
                          ? dict.lead.saveLeadChanges
                          : dict.lead.saveNewLead}
                    </button>
                  </form>
                </div>
              )}
            </section>

            {/* ==============================================================
                COMP 2 ANCHORED 10-SECOND CARBON-COPY THUMB LOGGER DOCK
                ============================================================== */}
            <aside
              className="comp2-thumb-logger-dock"
              aria-label="Anchored 10-Second Call Logger"
            >
              <div className="comp2-dock-header-banner">
                LOG NEW CALL (&lt;10s) —{' '}
                {activeLead ? activeLead.name.toUpperCase() : 'NO LEAD SELECTED'}
              </div>

              {/* Mode Switcher: Log Call (<10s) | Editable WhatsApp | General Notes */}
              <div className="comp2-dock-mode-strip">
                <button
                  type="button"
                  onClick={() => setDockMode('LOG_CALL')}
                  className={`comp2-dock-mode-btn ${
                    dockMode === 'LOG_CALL' ? 'active' : ''
                  }`}
                >
                  LOG CALL (&lt;10S)
                </button>
                <button
                  type="button"
                  onClick={() => setDockMode('WHATSAPP')}
                  className={`comp2-dock-mode-btn ${
                    dockMode === 'WHATSAPP' ? 'active' : ''
                  }`}
                >
                  WHATSAPP MSG
                </button>
                <button
                  type="button"
                  onClick={() => setDockMode('NOTES')}
                  className={`comp2-dock-mode-btn ${
                    dockMode === 'NOTES' ? 'active' : ''
                  }`}
                >
                  GENERAL NOTES
                </button>
              </div>

              {/* DOCK MODE 1: COMP 2 10-SECOND THUMB CALL LOGGER */}
              {dockMode === 'LOG_CALL' && (
                <form onSubmit={handleSaveCallLog}>
                  {callSaveError && (
                    <div
                      className="duplicate-warning-banner"
                      style={{ marginBottom: 10 }}
                      role="alert"
                    >
                      {callSaveError}
                    </div>
                  )}

                  {/* Row 1: ANSWERED | NO ANSWER */}
                  <div className="comp2-outcome-row-top">
                    {(['Answered', 'No Answer'] as CallOutcome[]).map(
                      (outcome) => {
                        const isSelected = callOutcome === outcome;
                        const isRed = outcome === 'No Answer';
                        return (
                          <button
                            key={outcome}
                            type="button"
                            onClick={() => setCallOutcome(outcome)}
                            className={`comp2-outcome-key ${
                              isSelected
                                ? isRed
                                  ? 'selected-red'
                                  : 'selected'
                                : ''
                            }`}
                          >
                            {outcome.toUpperCase()}
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* Row 2: BUSY | SWITCHED OFF | REJECTED */}
                  <div className="comp2-outcome-row-bottom">
                    {(['Busy', 'Switched Off', 'Rejected'] as CallOutcome[]).map(
                      (outcome) => {
                        const isSelected = callOutcome === outcome;
                        return (
                          <button
                            key={outcome}
                            type="button"
                            onClick={() => setCallOutcome(outcome)}
                            className={`comp2-outcome-key ${
                              isSelected ? 'selected-red' : ''
                            }`}
                          >
                            {outcome.toUpperCase()}
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* Row 3: Quick Call Note Input */}
                  <input
                    type="text"
                    className="comp2-quick-note-input"
                    placeholder="Quick call note..."
                    value={callFeedback}
                    onChange={(e) => setCallFeedback(e.target.value)}
                  />

                  {/* Row 4: Comp 2 Follow-up Pill Presets (+2 HRS | TOMORROW 10:00 | THU 16:00) */}
                  <div className="comp2-followup-pills-row">
                    {[
                      { id: 'PLUS_2H', label: '+2 HRS' },
                      { id: 'TOMORROW_10', label: 'TOMORROW 10:00' },
                      { id: 'THU_16', label: 'IN 3 DAYS 16:00' },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handlePresetFollowUp(preset.id)}
                        className={`comp2-followup-pill ${
                          followUpPreset === preset.id ? 'active' : ''
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Follow-up Date/Time & Optional Status Change */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <input
                      type="datetime-local"
                      aria-label="Next follow-up date and time"
                      className="coupon-input"
                      value={nextFollowUpLocal}
                      onChange={(e) => {
                        setFollowUpPreset('CUSTOM');
                        setNextFollowUpLocal(e.target.value);
                      }}
                    />
                    <select
                      aria-label="Update lead status after call"
                      className="coupon-select"
                      value={statusAfterCall}
                      onChange={(e) =>
                        setStatusAfterCall(
                          e.target.value as LeadStatus | 'KEEP'
                        )
                      }
                    >
                      <option value="KEEP">
                        Keep Status ({activeLead?.status || 'New'})
                      </option>
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          Status → {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 5: STAMP & NEXT LEAD Primary Jet Red Action */}
                  <button
                    type="submit"
                    className="comp2-stamp-submit-btn"
                    disabled={savingCall || !activeLead}
                  >
                    {savingCall
                      ? dict.calls.savingCall
                      : 'STAMP & NEXT LEAD'}
                  </button>
                </form>
              )}

              {/* DOCK MODE 2: EDITABLE WHATSAPP MESSAGE TEMPLATE */}
              {dockMode === 'WHATSAPP' && (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <span className="coupon-label">
                    {dict.actions.editWhatsAppTitle}
                  </span>
                  <textarea
                    rows={4}
                    className="coupon-textarea"
                    value={whatsAppText}
                    onChange={(e) => setWhatsAppText(e.target.value)}
                  />
                  {activeLead && (
                    <a
                      href={buildWhatsAppLink(activeLead.phone, whatsAppText)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="comp2-stamp-submit-btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        background: 'var(--carbon-purple)',
                      }}
                    >
                      {dict.actions.launchWhatsApp}
                    </a>
                  )}
                </div>
              )}

              {/* DOCK MODE 3: GENERAL LEAD NOTES OUTSIDE CALL LOG */}
              {dockMode === 'NOTES' && (
                <form
                  onSubmit={handleAddNoteSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <span className="coupon-label">
                    {dict.notes.generalNotesTitle}
                  </span>
                  <textarea
                    rows={3}
                    className="coupon-textarea"
                    placeholder={dict.notes.addNotePlaceholder}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="comp2-stamp-submit-btn"
                    disabled={savingNote || !activeLead}
                  >
                    {savingNote ? 'SAVING NOTE...' : dict.notes.addNoteButton}
                  </button>
                </form>
              )}
            </aside>
          </main>
        </>
      )}
    </div>
  );
}
