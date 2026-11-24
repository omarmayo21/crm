export type LocaleCode = 'en' | 'ar';

export interface UiDictionary {
  dir: 'ltr' | 'rtl';
  appTitle: string;
  appSubtitle: string;
  auth: {
    signInTitle: string;
    signUpTitle: string;
    emailLabel: string;
    passwordLabel: string;
    signInButton: string;
    signUpButton: string;
    switchToSignUp: string;
    switchToSignIn: string;
    signOutButton: string;
    teamReadyNote: string;
  };
  settings: {
    defaultCountryLabel: string;
    defaultCurrencyNote: string;
  };
  tabs: {
    todaysFollowUps: string;
    allLeads: string;
    addOrEditLead: string;
  };
  lead: {
    name: string;
    primaryPhone: string;
    secondaryPhone: string;
    country: string;
    source: string;
    addSourcePlaceholder: string;
    addSourceButton: string;
    requestType: string;
    propertyType: string;
    area: string;
    budget: string;
    currency: string;
    status: string;
    dateAdded: string;
    nextFollowUp: string;
    saveNewLead: string;
    saveLeadChanges: string;
    cancelEdit: string;
    editLeadButton: string;
    verifiedNoDuplicate: string;
    duplicateWarningTitle: string;
    openExistingLead: string;
  };
  calls: {
    logNewCallTitle: string;
    logCallUnder10s: string;
    outcomeLabel: string;
    feedbackLabel: string;
    nextFollowUpLabel: string;
    statusUpdateLabel: string;
    keepCurrentStatus: string;
    stampCallButton: string;
    savingCall: string;
    timelineTitle: string;
    noCallsYet: string;
    draftRecoveryWarning: string;
    retrySaveDraft: string;
    discardDraft: string;
  };
  notes: {
    generalNotesTitle: string;
    addNotePlaceholder: string;
    addNoteButton: string;
    noNotesYet: string;
  };
  actions: {
    callTel: string;
    whatsApp: string;
    editWhatsAppTitle: string;
    launchWhatsApp: string;
    logCall: string;
  };
  filters: {
    searchPlaceholder: string;
    allStatuses: string;
    allSources: string;
    allAreas: string;
    allPropertyTypes: string;
    allCountries: string;
    lastCallAny: string;
    lastCallToday: string;
    lastCall7Days: string;
    lastCallNever: string;
    clearFilters: string;
  };
}

export const EN_DICTIONARY: UiDictionary = {
  dir: 'ltr',
  appTitle: 'MASTER LEAD COUPON · REAL ESTATE CRM',
  appSubtitle: 'SUPABASE CLOUD DOSSIER · E.164 DUPLICATE GUARD · <10S CALL LOGGER',
  auth: {
    signInTitle: 'AGENT DISPATCH SIGN IN',
    signUpTitle: 'REGISTER NEW SALES AGENT ACCOUNT',
    emailLabel: 'AGENT WORK EMAIL',
    passwordLabel: 'PASSWORD (MIN 6 CHARACTERS)',
    signInButton: 'OPEN AGENT DISPATCH WALLET',
    signUpButton: 'CREATE AGENT ACCOUNT',
    switchToSignUp: 'Need a new agent login? Register an account',
    switchToSignIn: 'Already registered? Sign in to your wallet',
    signOutButton: 'SIGN OUT',
    teamReadyNote:
      'Row-Level Security (RLS) active: each salesperson sees and manages only their own leads, calls, notes, and sources.',
  },
  settings: {
    defaultCountryLabel: 'DEFAULT DIALING COUNTRY',
    defaultCurrencyNote: 'Numbers typed without + or 00 use this country code',
  },
  tabs: {
    todaysFollowUps: "TODAY'S FOLLOW-UPS",
    allLeads: 'ALL LEADS & FILTERS',
    addOrEditLead: '+ ADD / EDIT LEAD',
  },
  lead: {
    name: 'CLIENT FULL NAME',
    primaryPhone: 'PRIMARY PHONE NUMBER',
    secondaryPhone: 'SECONDARY PHONE (OPTIONAL)',
    country: 'COUNTRY',
    source: 'LEAD SOURCE',
    addSourcePlaceholder: 'New source (e.g. Open House)...',
    addSourceButton: '+ ADD SOURCE',
    requestType: 'REQUEST TYPE',
    propertyType: 'PROPERTY TYPE',
    area: 'AREA OR PROJECT OF INTEREST',
    budget: 'BUDGET AMOUNT',
    currency: 'CURRENCY',
    status: 'LEAD STATUS',
    dateAdded: 'ADDED',
    nextFollowUp: 'NEXT FOLLOW-UP',
    saveNewLead: 'ISSUE NEW MASTER LEAD COUPON',
    saveLeadChanges: 'UPDATE MASTER LEAD COUPON',
    cancelEdit: 'CANCEL EDIT',
    editLeadButton: 'EDIT LEAD DATA',
    verifiedNoDuplicate: 'VERIFIED · NO DUPLICATE',
    duplicateWarningTitle: 'DUPLICATE PHONE DETECTED (E.164 MATCH)',
    openExistingLead: 'OPEN EXISTING LEAD',
  },
  calls: {
    logNewCallTitle: 'STAMP NEW CALL LEG (<10S)',
    logCallUnder10s: '+ LOG CALL (<10S)',
    outcomeLabel: '1. CALL OUTCOME (AUTO-TIMESTAMPED NOW)',
    feedbackLabel: '2. CALL FEEDBACK & NOTES',
    nextFollowUpLabel: '3. NEXT FOLLOW-UP DATE & TIME',
    statusUpdateLabel: '4. QUICK STATUS CHANGE (OPTIONAL)',
    keepCurrentStatus: 'Keep current status',
    stampCallButton: 'STAMP CALL LEG & SCHEDULE FOLLOW-UP',
    savingCall: 'SAVING CALL LEG TO SUPABASE...',
    timelineTitle: 'CALL LOG & FEEDBACK TIMELINE (NEWEST FIRST)',
    noCallsYet: 'No calls logged for this lead yet. Tap + LOG CALL (<10S) right after dialing.',
    draftRecoveryWarning:
      'NETWORK INTERRUPTED: Your last call log could not reach Supabase and is safely held in your local recovery queue.',
    retrySaveDraft: 'RETRY SAVING CALL LOG NOW',
    discardDraft: 'DISCARD DRAFT',
  },
  notes: {
    generalNotesTitle: 'GENERAL LEAD NOTES (OUTSIDE CALL LOG)',
    addNotePlaceholder: 'Add general dossier note (financing, unit preferences, family details)...',
    addNoteButton: 'SAVE NOTE',
    noNotesYet: 'No general notes recorded for this lead yet.',
  },
  actions: {
    callTel: 'CALL TEL:',
    whatsApp: 'WHATSAPP (EDIT MSG)',
    editWhatsAppTitle: 'WHATSAPP (WA.ME) DISPATCH TEMPLATE',
    launchWhatsApp: 'SEND ON WHATSAPP (WA.ME)',
    logCall: '+ LOG CALL (<10S)',
  },
  filters: {
    searchPlaceholder: 'Search by name or phone (e.g. 010..., +20..., +971...)...',
    allStatuses: 'ALL STATUSES',
    allSources: 'ALL SOURCES',
    allAreas: 'ALL AREAS / PROJECTS',
    allPropertyTypes: 'ALL PROPERTY TYPES',
    allCountries: 'ALL COUNTRIES',
    lastCallAny: 'LAST CALL: ANY DATE',
    lastCallToday: 'CALLED TODAY',
    lastCall7Days: 'CALLED LAST 7 DAYS',
    lastCallNever: 'NEVER CALLED',
    clearFilters: 'RESET FILTERS',
  },
};

export function getDictionary(_locale: LocaleCode = 'en'): UiDictionary {
  return EN_DICTIONARY;
}
