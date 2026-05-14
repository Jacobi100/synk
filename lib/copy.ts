// ---------------------------------------------------------------------------
// lib/copy.ts — Single source of truth for all user-facing strings
//
// WHY THIS FILE EXISTS:
// The codebase was originally built using developer/technical terminology
// (bounty, provider, escrow, application, payout) so the backend engineer
// could understand the system. The real end users are everyday Nigerians in
// the informal economy — market women, artisans, tradespeople — who do not
// understand those terms.
//
// This file maps every user-facing string to plain, simple language.
// All frontend components must import from here — never hardcode UI strings.
// To change a term globally, change it once in this file.
//
// RULES:
// - Never rename variables, functions, database columns, or API routes
// - Only this file and frontend .tsx files should be touched for copy changes
// - Keys are grouped by feature/page for easy navigation
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Global / shared
// ---------------------------------------------------------------------------

export const COPY = {

  // ── App meta ──────────────────────────────────────────────────────────────
  APP_TITLE:           "Synk — Find Help & Offer Help",
  APP_DESCRIPTION:     "Post jobs, find helpers near you, and get paid safely.",

  // ── Status labels — used across BountyCard, detail page, my-postings ─────
  STATUS: {
    open:        "Open",
    in_progress: "In Progress",
    paid:        "Payment Secured",
    completed:   "Completed",
    cancelled:   "Cancelled",
  },

  // ── Urgency labels ────────────────────────────────────────────────────────
  URGENCY: {
    asap:      "As Soon As Possible",
    scheduled: "Scheduled",
    flexible:  "Flexible",
  },

  // ── Common actions ────────────────────────────────────────────────────────
  BACK_TO_FEED:        "Back to feed",
  BACK_TO_JOB:         "← Back to job",
  BROWSE_JOBS:         "Browse Jobs",
  POST_A_JOB:          "Post a Job",
  FIND_JOBS:           "Find Jobs",
  VIEW_JOB:            "View Job",
  CONFIRM_DONE:        "Confirm Done",
  LOADING:             "Loading…",

  // ── Common field labels ───────────────────────────────────────────────────
  LOCATION:            "Location",
  URGENCY_LABEL:       "Urgency",
  DEADLINE:            "Deadline",
  HELPERS_NEEDED:      "Helpers Needed",
  HELPERS_NEEDED_COUNT: (count: number) =>
    `${count} ${count === 1 ? "helper" : "helpers"} needed`,
  BUDGET:              "Budget",
  PRICE_NEGOTIABLE:    "Price can be negotiated",
  DESCRIPTION:         "Description",
  NO_DESCRIPTION:      "No description provided.",
  CUSTOMER_CONTACT:    "Customer contact (shown after you accept)",
  HELPER_CONTACT:      "Helper contact",

  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------

  DASHBOARD: {
    AVAILABLE_JOBS:       "Available Jobs",
    AVAILABLE_JOBS_SUB:   "Open jobs — offer to help and start earning.",
    POST_JOB:             "Post a Job",
    REFRESH:              "Refresh",
    NO_JOBS:              "No jobs yet",
    NO_JOBS_SUB:          "Be the first to post a job in your area.",
    POST_FIRST:           "Post the first job",
    ACTIVE_JOBS:          "Active Jobs",
    IN_PROGRESS:          "In Progress",
    COMPLETED:            "Completed",
    TOTAL_EARNINGS:       "Total Earnings",
  },

  // -------------------------------------------------------------------------
  // Home / landing page
  // -------------------------------------------------------------------------

  HOME: {
    WELCOME:             (firstName?: string | null) =>
      `Welcome back${firstName ? `, ${firstName}` : ""}`,
    HEADLINE:            "Your jobs, all in one place",
    SUBHEADLINE:         "Post jobs, find helpers near you, and get paid safely.",
    POST_A_JOB:          "Post a Job",
    FIND_JOBS:           "Find Jobs",
    POST_JOB_DESC:       "Post a job or offer your skills to people who need help.",
    FIND_JOBS_DESC:      "Find jobs near you and offer to help.",
  },

  // -------------------------------------------------------------------------
  // My postings page
  // -------------------------------------------------------------------------

  MY_POSTINGS: {
    TITLE:               "My Jobs",
    SUBTITLE:            "See and manage all jobs you have posted.",
    NEW_JOB:             "Post a Job",
    EMPTY_TITLE:         "You have not posted any jobs yet",
    EMPTY_SUB:           "Post your first job to start getting helpers.",
    VIEW_HELPERS:        "See Who Wants to Help",
    PAYMENT:             "Payment",
    CONFIRM_DONE:        "Confirm Done",
  },

  // -------------------------------------------------------------------------
  // Create listing page (bounties/create)
  // -------------------------------------------------------------------------

  CREATE_JOB: {
    TITLE:               "Post a Job",
    SUBTITLE:            "Describe what you need and get help from people near you.",
    RECORD_AGAIN:        "Record Again",
    POST_LISTING:        "Post Job",
    WHAT_WE_HEARD:       "What we heard",
    LOW_CONFIDENCE:      "We were not fully sure about some details — please review carefully before posting.",
    PROCESSING:          "Understanding your listing…",
    POSTING:             "Posting your job…",
    SUCCESS:             "Job posted successfully!",
    TRY_AGAIN:           "Try Again",
    MIC_INSTRUCTION:     "Tap the mic and describe your job in any language.",
    LANGUAGE_SUPPORT:    "Yoruba · Igbo · Hausa · Pidgin · English",
    FIELD_TITLE:         "Job Title",
    FIELD_CATEGORY:      "Category",
    FIELD_DESCRIPTION:   "Description",
    FIELD_MIN_PRICE:     "Min Price (₦)",
    FIELD_MAX_PRICE:     "Max Price (₦)",
  },

  // -------------------------------------------------------------------------
  // Job detail page (bounties/[id])
  // -------------------------------------------------------------------------

  JOB_DETAIL: {
    APPLY_BUTTON:        "Offer to Help",
    APPLYING:            "Sending offer…",
    APPLY_SUCCESS:       "✓ Your offer has been sent!",
    APPLY_ERROR:         "Could not send your offer",
    VIEW_HELPERS:        "See Who Wants to Help",
    MAKE_SAFE_PAYMENT:   "Make Safe Payment",
    CONFIRM_AND_PAY:     "Confirm Job Done & Pay",
    YOU_POSTED:          "You posted this job",
    NOT_TAKING_HELPERS:  "Not taking new helpers",
    SHARE:               "Share",
    PAYMENT_INFO_TITLE:  "Payment",
    PAYMENT_INFO_BODY:   "Your money is held safely until the job is done.",
  },

  // -------------------------------------------------------------------------
  // Applications page (bounties/[id]/applications)
  // -------------------------------------------------------------------------

  APPLICATIONS: {
    TITLE:               "People Who Want to Help",
    SUBTITLE:            "See everyone who offered to help with this job.",
    EMPTY:               "No one has offered to help yet.",
    APPLIED_ON:          (date: string) => `Offered to help ${date}`,
    ACCEPT:              "Accept",
    DECLINE:             "Decline",
    CALL_CUSTOMER:       "Call Customer",
    VIEW_JOB:            "View Job",
    HELPER_LABEL:        "Helper",
    PHONE_HIDDEN:        "Phone shown after you accept",
  },

  // -------------------------------------------------------------------------
  // My applications page (applications)
  // -------------------------------------------------------------------------

  MY_APPLICATIONS: {
    TITLE_RECEIVED:      "Help Requests Received",
    TITLE_SENT:          "My Offers to Help",
    SUBTITLE_RECEIVED:   "See people who want to help.",
    SUBTITLE_SENT:       "Track jobs you have offered to help with.",
    EMPTY:               "No offers yet",
    EMPTY_RECEIVED:      "People who want to help with your jobs will appear here.",
    EMPTY_SENT:          "Browse jobs and offer to help to start earning.",
    BROWSE_JOBS:         "Browse Jobs",
    CALL_CUSTOMER:       "Call Customer",
    VIEW_JOB:            "View Job",
    HELPER_LABEL:        "Helper",
    PHONE_HIDDEN:        "Phone shown after you accept",
  },

  // -------------------------------------------------------------------------
  // Payment page (bounties/[id]/payment)
  // -------------------------------------------------------------------------

  PAYMENT: {
    SAFE_PAYMENT_TITLE:  "Safe Payment",
    TRANSFER_INSTRUCTION: "Use your bank app to pay into this account.",
    NOT_AVAILABLE:       "Safe payment details are not available yet, or you are not the customer for this job.",
    HELD_NOTICE:         "Money is held safely until you confirm the job is done.",
  },

  // -------------------------------------------------------------------------
  // Complete / confirm done page (bounties/[id]/complete)
  // -------------------------------------------------------------------------

  COMPLETE: {
    PAGE_TITLE:          "Pay Helper",
    PAGE_SUBTITLE:       "Confirm the job is done and release the helper's payment.",
    SUCCESS_TITLE:       "Job Done",
    SUCCESS_BODY:        (amount: string) =>
      `Payment of ${amount} has been sent to the helper's bank account.`,
    BACK_TO_FEED:        "Back to feed",
    HOLD_TITLE:          "We Are Checking Your Payment",
    HOLD_BODY:           "We ran a safety check on this payment and it needs a quick review. No money has moved. You will be notified once it is cleared.",
    HOLD_CONTACT:        (id: string) =>
      `If you think this is a mistake, contact support with job ID: ${id}`,
    BLOCK_TITLE:         "Payment Could Not Go Through",
    BLOCK_BODY:          "This payment could not be completed due to a safety check. No money has moved.",
    BLOCK_CONTACT:       (id: string) => `Contact support with job ID: ${id}`,
    BACK_TO_JOB:         "Back to job",
    SECTION_JOB:         "Job",
    SECTION_BREAKDOWN:   "Payment Breakdown",
    TOTAL_AMOUNT:        "Total Amount",
    SERVICE_CHARGE:      "Synk service charge (5%)",
    HELPER_RECEIVES:     "Helper Receives",
    SAFETY_NOTICE:       "We check every payment for safety before sending money to the helper.",
    CANNOT_PAY_YET:      (status: string) =>
      `Payment can only be sent once the customer has made the safe payment. Current status: ${status}`,
    CANCEL:              "Cancel",
    CONFIRM_BUTTON:      "Confirm Job Done & Pay",
    PROCESSING:          "Processing…",
    ERROR_TITLE:         "Something went wrong",
    TRY_AGAIN:           "Try again",
  },

  // -------------------------------------------------------------------------
  // Profile pages
  // -------------------------------------------------------------------------

  PROFILE: {
    TITLE:               "Profile & Payment",
    SUBTITLE:            "Add your bank account so you can receive payment when a job is done.",
    SAVE:                "Save profile",
    SAVING:              "Saving…",
    SUCCESS:             "Profile saved successfully.",
    ERROR:               "Could not save profile. Please try again.",
    FIELD_USERNAME:      "Username",
    FIELD_FULL_NAME:     "Full name",
    FIELD_PHONE:         "Phone number",
    PAYOUT_TITLE:        "Payout account",
    PAYOUT_SUBTITLE:     "Required to receive payments.",
    FIELD_BANK_CODE:     "Bank code",
    FIELD_ACCOUNT:       "Account number",
  },

  // -------------------------------------------------------------------------
  // Provider profile page (profile/[id])
  // -------------------------------------------------------------------------

  PROVIDER_PROFILE: {
    BACK:                "Back to feed",
    BADGE_NEW_LABEL:     "New on Synk",
    BADGE_NEW_DESC:      "This helper is new to Synk. They have not completed enough jobs for a reputation rating yet.",
    BADGE_ACTIVE_LABEL:  "Active Helper",
    BADGE_ACTIVE_DESC:   "This helper has completed several jobs with a good track record.",
    BADGE_TRUSTED_LABEL: "Trusted Helper",
    BADGE_TRUSTED_DESC:  "Synk vouches for this helper. They have a strong record with people who keep coming back.",
    BADGE_TOP_LABEL:     "Top Helper",
    BADGE_TOP_DESC:      "Synk's highest reputation. This helper has an outstanding history and a loyal base of repeat customers.",
    REPUTATION_TITLE:    "Reputation Breakdown",
    REPUTATION_SCORE:    "Reputation score",
    JOBS_COMPLETED:      "Jobs completed",
    UNIQUE_CUSTOMERS:    "Unique customers",
    LAST_UPDATED:        "Last updated",
    NO_HISTORY_TITLE:    "No reputation yet",
    NO_HISTORY_SUB:      "This helper's reputation will show here after their first completed job.",
    NOT_FOUND_TITLE:     "Profile not found",
    NOT_FOUND_SUB:       "This helper profile does not exist.",
    MEMBER_SINCE:        (time: string) => `Member ${time}`,
  },

  // -------------------------------------------------------------------------
  // BountyCard component
  // -------------------------------------------------------------------------

  BOUNTY_CARD: {
    BY:                  (name: string) => `by ${name}`,
    NO_DESCRIPTION:      "No description provided.",
    HELPERS_NEEDED:      (count: number) =>
      `${count} ${count === 1 ? "helper" : "helpers"} needed`,
  },

  // -------------------------------------------------------------------------
  // BountyForm component
  // -------------------------------------------------------------------------

  BOUNTY_FORM: {
    FIELD_TITLE:         "Job title *",
    FIELD_WHAT_NEEDED:   "What do you need done?",
    FIELD_DESCRIPTION:   "Description",
    FIELD_CATEGORY:      "Category *",
    FIELD_LOCATION:      "Location",
    FIELD_PRICE:         "Price range (₦) *",
    FIELD_NEGOTIABLE:    "Negotiable",
    FIELD_DEADLINE:      "Deadline",
    FIELD_URGENCY:       "Urgency *",
    FIELD_SLOTS:         "Helpers needed *",
    FIELD_IMAGES:        "Images (optional)",
    FIELD_IMAGES_HINT:   "Drag & drop or click to upload",
    PRICE_SUGGESTION:    (min: string, max: string) =>
      `Suggested price: ₦${min} – ₦${max}`,
    PRICE_AVERAGE:       (avg: string) => `(average ₦${avg})`,
  },

  // -------------------------------------------------------------------------
  // VoiceInput component
  // -------------------------------------------------------------------------

  VOICE: {
    IDLE:                "Tap mic to speak",
    RECORDING:           "Listening… tap to stop",
    PROCESSING:          "Understanding your message…",
    ERROR:               "Something went wrong. Tap to try again.",
    SILENCE_COUNTDOWN:   (seconds: number) =>
      `Sends in ${seconds}s if silent`,
    MIC_LABEL_IDLE:      "Tap to start speaking",
    MIC_LABEL_RECORDING: "Tap to stop recording",
    MIC_LABEL_PROCESSING: "Processing your voice, please wait",
    MIC_LABEL_ERROR:     "Recording failed. Tap to try again",
  },

  // -------------------------------------------------------------------------
  // Navigation map component
  // -------------------------------------------------------------------------

  NAV_MAP: {
    TITLE:               "Navigate to customer",
    OPEN_IN_MAPS:        "Open in Maps",
    LOADING:             "Loading map…",
    NO_LOCATION:         "Location access denied — showing destination only. Tap \"Open in Maps\" for turn-by-turn directions.",
    ERROR_FALLBACK:      "Open in Google Maps instead",
  },

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------

  NOTIFICATIONS: {
    TITLE:               "Notifications",
    MARK_ALL_READ:       "Mark all read",
    VIEW_FEED:           "View feed →",
  },

} as const;