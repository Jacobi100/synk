// ---------------------------------------------------------------------------
// lib/copy.ts — Every word a user sees on this app
//
// LANGUAGE PRINCIPLES:
// ✓ Simple enough for a market woman in Surulere or an Igbo trader in Onitsha
// ✓ Professional enough that users trust the platform with their money
// ✓ Action-first — every label tells you exactly what happens when you tap it
// ✓ No jargon — no "escrow", "bounty", "provider", "application", "payout"
// ✓ Short — if it can be said in 4 words instead of 8, use 4
//
// ENGINEER RULES:
// - Import { COPY } from "@/lib/copy" — never hardcode strings in components
// - Never rename keys without updating imports across all files
// - Never touch variable names, functions, or database columns
// - One change here = changes everywhere
// ---------------------------------------------------------------------------

export const COPY = {

  // ── App meta ──────────────────────────────────────────────────────────────
  APP_TITLE:       "Synk — Find Help Near You",
  APP_DESCRIPTION: "Post a job and get help from skilled people nearby. Your money stays safe until the work is done.",

  // ── Job/bounty status ─────────────────────────────────────────────────────
  // Keep these short — they appear as chips/badges with limited space
  STATUS: {
    open:        "Open",
    in_progress: "In Progress",
    paid:        "Money Safe",
    completed:   "Done",
    cancelled:   "Cancelled",
  },

  // ── Offer/application status badges ──────────────────────────────────────
  APPLICATION_STATUS: {
    pending:   "Waiting",
    accepted:  "Accepted",
    rejected:  "Not Chosen",
    withdrawn: "Withdrawn",
  },

  // ── Urgency labels ────────────────────────────────────────────────────────
  URGENCY: {
    asap:      "Right Now",
    scheduled: "Planned",
    flexible:  "No Rush",
  },

  // ── Reusable actions ─────────────────────────────────────────────────────
  BACK:          "Back",
  BACK_TO_FEED:  "Back to Jobs",
  BACK_TO_JOB:   "← Back to Job",
  TRY_AGAIN:     "Try Again",
  LOADING:       "Loading…",
  CANCEL:        "Cancel",
  DONE:          "Done",

  // ── Reusable field labels ─────────────────────────────────────────────────
  LOCATION:         "Location",
  URGENCY_LABEL:    "How Soon",
  DEADLINE:         "Deadline",
  BUDGET:           "Budget",
  DESCRIPTION:      "Details",
  NO_DESCRIPTION:   "No details given.",
  PRICE_NEGOTIABLE: "Price is negotiable",
  HELPERS_NEEDED:   "Helpers Needed",
  HELPERS_NEEDED_COUNT: (count: number) =>
    `${count} ${count === 1 ? "helper" : "helpers"} needed`,
  CUSTOMER_CONTACT: "Customer's phone (shown after you accept)",
  HELPER_CONTACT:   "Helper's phone number",
  POSTED_BY:        (name: string) => `by ${name}`,

  // -------------------------------------------------------------------------
  // Home / landing page
  // -------------------------------------------------------------------------

  HOME: {
    WELCOME:        (firstName?: string | null) =>
      `Welcome back${firstName ? `, ${firstName}` : ""}`,
    HEADLINE:       "Find help or offer help",
    SUBHEADLINE:    "Post a job and get help from skilled people near you. Your money stays safe until the work is done.",
    POST_A_JOB:     "Post a Job",
    FIND_JOBS:      "Find Jobs",
    ACTIVE_JOBS:    "Active Jobs",
    IN_PROGRESS:    "In Progress",
    COMPLETED:      "Completed",
    TOTAL_EARNINGS: "Total Earned",
    POST_JOB_DESC:  "Tell us what you need. People near you will offer to help.",
    FIND_JOBS_DESC: "See jobs near you and start earning.",
  },

  // -------------------------------------------------------------------------
  // Dashboard / feed
  // -------------------------------------------------------------------------

  DASHBOARD: {
    AVAILABLE_JOBS:     "Jobs Near You",
    AVAILABLE_JOBS_SUB: "People nearby who need help.",
    POST_JOB:           "Post a Job",
    REFRESH:            "Refresh",
    NO_JOBS:            "No jobs near you yet",
    NO_JOBS_SUB:        "Be the first to post a job in your area.",
    POST_FIRST:         "Post the first job",
    LOADING:            "Looking for jobs near you…",
  },

  // -------------------------------------------------------------------------
  // Navbar / navigation
  // -------------------------------------------------------------------------

  NAVBAR: {
    FEED:         "Jobs",
    APPLICATIONS: "My Offers",
    MY_POSTINGS:  "My Jobs",
    POST:         "Post a Job",
    PROFILE:      "My Profile",
    HOW_IT_WORKS: "How it works",
    SIGN_IN:      "Sign in",
    SIGN_UP:      "Join Synk",
    MENU_LABEL:   "Open menu",
  },

  // -------------------------------------------------------------------------
  // My jobs page (my-postings)
  // -------------------------------------------------------------------------

  MY_POSTINGS: {
    TITLE:            "My Jobs",
    SUBTITLE:         "All the jobs you have posted.",
    NEW_JOB:          "Post a Job",
    EMPTY_TITLE:      "You have not posted any jobs yet",
    EMPTY_SUB:        "Post a job and people near you will offer to help.",
    VIEW_DETAILS:     "See Details",
    VIEW_HELPERS:     "See Offers",
    PAYMENT:          "Pay",
    CONFIRM_DONE:     "Mark Done",
    SIGN_IN_REQUIRED: "Please sign in to see your jobs.",
  },

  // -------------------------------------------------------------------------
  // Post a job page (bounties/create)
  // -------------------------------------------------------------------------

  CREATE_JOB: {
    TITLE:            "Post a Job",
    SUBTITLE:         "Say what you need in your own words — speak or type.",
    RECORD_AGAIN:     "Try Again",
    POST_LISTING:     "Post Job",
    WHAT_WE_HEARD:    "Here is what we heard",
    LOW_CONFIDENCE:   "⚠️ We were not sure about some details — please check before posting.",
    PROCESSING:       "Setting up your job…",
    POSTING:          "Posting your job…",
    SUCCESS:          "Your job has been posted!",
    REDIRECTING:      "Taking you back…",
    TRY_AGAIN:        "Try Again",
    MIC_INSTRUCTION:  "Tap the mic and say what you need.",
    LANGUAGE_SUPPORT: "Yoruba · Igbo · Hausa · Pidgin · English",
    FIELD_TITLE:      "What do you need?",
    FIELD_CATEGORY:   "Type of job",
    FIELD_DESCRIPTION: "More details (optional)",
    FIELD_MIN_PRICE:  "Min price (₦)",
    FIELD_MAX_PRICE:  "Max price (₦)",
    ERROR_GENERIC:    "Something went wrong. Please try again.",
  },

  // -------------------------------------------------------------------------
  // Job detail page (bounties/[id])
  // -------------------------------------------------------------------------

  JOB_DETAIL: {
    DESCRIPTION_TITLE:    "What They Need",
    APPLY_BUTTON:         "Offer to Help",
    APPLYING:             "Sending offer…",
    APPLY_SUCCESS:        "✓ Offer sent!",
    APPLY_ERROR_GENERIC:  "Could not send your offer. Try again.",
    SIGN_IN_TO_APPLY:     "Sign in to offer help",
    VIEW_HELPERS:         "See Offers",
    MAKE_SAFE_PAYMENT:    "Pay Safely",
    CONFIRM_AND_PAY:      "Confirm Done & Pay",
    YOU_POSTED:           "You posted this job",
    NOT_TAKING_HELPERS:   "No longer accepting offers",
    NEGOTIATE_PRICE:      "Negotiate Price",
    SHARE:                "Share",
    PAYMENT_INFO_TITLE:   "Your Money is Safe",
    PAYMENT_INFO_BODY:    "Your money is held here until you confirm the job is done.",
    LOADING:              "Loading…",
    ERROR_TITLE:          "Could not load this job",
  },

  // -------------------------------------------------------------------------
  // Offers received / sent (applications page)
  // -------------------------------------------------------------------------

  MY_APPLICATIONS: {
    TITLE_RECEIVED:    "Offers to Help",
    TITLE_SENT:        "Jobs I Applied For",
    SUBTITLE_RECEIVED: "People who want to help with your jobs.",
    SUBTITLE_SENT:     "Jobs you have offered to help with.",
    EMPTY_TITLE:       "No offers yet",
    EMPTY_RECEIVED:    "When someone offers to help, they will appear here.",
    EMPTY_SENT:        "Find jobs near you and offer to help.",
    BROWSE_JOBS:       "Find Jobs",
    CALL_CUSTOMER:     "Call Customer",
    CALL_HELPER:       "Call Helper",
    VIEW_JOB:          "See Job",
    HELPER_LABEL:      "Helper",
    PHONE_HIDDEN:      "Phone shown after you accept",
    ACCEPT:            "Accept",
    DECLINE:           "Decline",
    APPLIED_ON:        (date: string) => `Applied ${date}`,
  },

  // -------------------------------------------------------------------------
  // Offers for a specific job (bounties/[id]/applications)
  // -------------------------------------------------------------------------

  APPLICATIONS: {
    TITLE:       "People Who Offered to Help",
    SUBTITLE:    "Review everyone who offered to help with this job.",
    EMPTY:       "No offers yet.",
    ACCEPT:      "Accept",
    DECLINE:     "Decline",
    ERROR_TITLE: "Something went wrong",
    APPLIED_ON:  (date: string) => `Applied ${date}`,
  },

  // -------------------------------------------------------------------------
  // Payment page (bounties/[id]/payment)
  // -------------------------------------------------------------------------

  PAYMENT: {
    TITLE:                "Pay Into Safe Account",
    TRANSFER_INSTRUCTION: (status: string) =>
      `Send money to this account using your bank app. Status: ${status}`,
    NOT_AVAILABLE:        "Payment details not available yet, or this is not your job.",
    HELD_NOTICE:          "Your money is held safely until you confirm the job is done.",
    DONE_BUTTON:          "Done",
  },

  // -------------------------------------------------------------------------
  // Confirm done + pay helper (bounties/[id]/complete)
  // -------------------------------------------------------------------------

  COMPLETE: {
    PAGE_TITLE:    "Confirm Job Done & Pay",
    PAGE_SUBTITLE: "Confirm the job is finished and release the helper's payment.",

    SUCCESS_TITLE: "Payment Sent!",
    SUCCESS_BODY:  (amount: string) =>
      `${amount} has been sent to the helper's bank account.`,
    BACK_TO_FEED:  "Back to Jobs",
    BACK_TO_JOB:   "Back to Job",

    HOLD_TITLE:    "We Are Checking This Payment",
    HOLD_BODY:     "We noticed something unusual and are reviewing it. No money has moved. We will notify you once it is cleared.",
    HOLD_CONTACT:  (id: string) =>
      `If you think this is a mistake, contact support. Reference: ${id}`,

    BLOCK_TITLE:   "Payment Could Not Be Sent",
    BLOCK_BODY:    "We could not complete this payment due to a security check. No money has moved.",
    BLOCK_CONTACT: (id: string) => `Contact support. Reference: ${id}`,

    SECTION_JOB:       "Job",
    SECTION_BREAKDOWN: "Payment Summary",
    TOTAL_AMOUNT:      "Total",
    SERVICE_CHARGE:    "Synk fee (5%)",
    HELPER_RECEIVES:   "Helper receives",

    SAFETY_NOTICE:  "We run a quick safety check before sending any money.",
    CANNOT_PAY_YET: (status: string) =>
      `Payment can only be sent after the customer pays. Current status: ${status}`,

    CANCEL:         "Cancel",
    CONFIRM_BUTTON: "Confirm Done & Pay Helper",
    PROCESSING:     "Sending payment…",
    ERROR_TITLE:    "Something went wrong",
    TRY_AGAIN:      "Try again",
    NOT_FOUND:      "Job not found.",
    LOADING:        "Loading…",
  },

  // -------------------------------------------------------------------------
  // Job form (BountyForm component)
  // -------------------------------------------------------------------------

  BOUNTY_FORM: {
    FIELD_TITLE:          "Job title *",
    PLACEHOLDER_TITLE:    "e.g. I need a plumber to fix my pipe",
    FIELD_DESCRIPTION:    "More details",
    FIELD_CATEGORY:       "Category *",
    PLACEHOLDER_CATEGORY: "Select a category",
    FIELD_LOCATION:       "Location",
    PLACEHOLDER_LOCATION: "e.g. Yaba, Lagos",
    FIELD_GPS:            "Use my location",
    FIELD_PRICE:          "Budget (₦) *",
    PLACEHOLDER_MIN:      "Min",
    PLACEHOLDER_MAX:      "Max",
    FIELD_NEGOTIABLE:     "Negotiable",
    FIELD_DEADLINE:       "Deadline",
    FIELD_URGENCY:        "How soon? *",
    FIELD_SLOTS:          "Helpers needed *",
    FIELD_IMAGES:         "Photos (optional)",
    IMAGES_HINT:          "Tap to add photos",
    PRICE_SUGGESTION:     (min: string, max: string) =>
      `Suggested: ₦${min} – ₦${max}`,
    PRICE_AVERAGE:        (avg: string) => `avg ₦${avg}`,
  },

  // -------------------------------------------------------------------------
  // Job card (BountyCard component)
  // -------------------------------------------------------------------------

  BOUNTY_CARD: {
    POSTED_BY:      (name: string) => `by ${name}`,
    NO_DESCRIPTION: "No details given.",
    HELPERS_NEEDED: (count: number) =>
      `${count} ${count === 1 ? "helper" : "helpers"} needed`,
    STATUS: {
      open:        "Open",
      in_progress: "In Progress",
      paid:        "Money Safe",
      completed:   "Done",
      cancelled:   "Cancelled",
    },
  },

  // -------------------------------------------------------------------------
  // Own profile page
  // -------------------------------------------------------------------------

  PROFILE: {
    TITLE:            "My Profile",
    SUBTITLE:         "Add your bank account so you can receive payment when a job is done.",
    SAVE:             "Save",
    SAVING:           "Saving…",
    SUCCESS:          "Profile saved.",
    ERROR:            "Could not save. Please try again.",
    FIELD_USERNAME:   "Username",
    FIELD_FULL_NAME:  "Full name",
    FIELD_PHONE:      "Phone number",
    PHONE_HINT:       "We will call you about your jobs",
    PAYOUT_TITLE:     "Bank account for payment",
    PAYOUT_SUBTITLE:  "Required to receive money for completed jobs.",
    FIELD_BANK_CODE:  "Bank code",
    BANK_CODE_HINT:   "e.g. 058 for GTBank, 044 for Access Bank",
    FIELD_ACCOUNT:    "Account number",
    ACCOUNT_HINT:     "Must be exactly 10 digits",
    SIGN_IN_REQUIRED: "Please sign in to manage your profile.",
  },

  // -------------------------------------------------------------------------
  // Provider/helper public profile page
  // -------------------------------------------------------------------------

  PROVIDER_PROFILE: {
    BACK:            "Back to Jobs",
    NOT_FOUND_TITLE: "Profile not found",
    NOT_FOUND_SUB:   "This helper's profile does not exist.",
    LOADING:         "Loading profile…",

    BADGE_NEW_LABEL:     "New on Synk",
    BADGE_NEW_DESC:      "This helper just joined Synk and is building their reputation.",
    BADGE_ACTIVE_LABEL:  "Active Helper",
    BADGE_ACTIVE_DESC:   "This helper has completed several jobs with good results.",
    BADGE_TRUSTED_LABEL: "Trusted Helper",
    BADGE_TRUSTED_DESC:  "Synk trusts this helper. Customers keep coming back to them.",
    BADGE_TOP_LABEL:     "Top Helper",
    BADGE_TOP_DESC:      "One of Synk's best. Outstanding record with many loyal customers.",

    REPUTATION_TITLE: "Reputation",
    REPUTATION_SCORE: "Score",
    JOBS_COMPLETED:   "Jobs Done",
    UNIQUE_CUSTOMERS: "Customers",
    LAST_UPDATED:     "Updated",

    NO_HISTORY_TITLE: "No reputation yet",
    NO_HISTORY_SUB:   "Reputation appears after the first completed job.",

    MEMBER_SINCE:     (time: string) => `Member ${time}`,
  },

  // -------------------------------------------------------------------------
  // Onboarding
  // -------------------------------------------------------------------------

  ONBOARDING: {
    STEP_ACCOUNT:      "Account",
    STEP_PROFILE:      "Profile",
    STEP_DONE:         "Done",
    TITLE:             "Set up your account",
    SUBTITLE:          "A few quick details and you are ready to go.",
    BRAND:             "Synk",
    FIELD_USERNAME:    "Username",
    FIELD_PHONE:       "Phone number",
    PHONE_HINT:        "We will use this for job updates",
    PHONE_PLACEHOLDER: "+234 801 234 5678",
    FIELD_DOB:         "Date of birth",
    DOB_HINT:          "You must be 18 or older",
    CONTINUE:          "Continue",
    STEP_OF:           (current: number, total: number) =>
      `Step ${current} of ${total}`,
    ERROR:             "Something went wrong. Please try again.",
  },

  // -------------------------------------------------------------------------
  // Voice input component
  // -------------------------------------------------------------------------

  VOICE: {
    IDLE:              "Tap to speak",
    RECORDING:         "Listening… tap to stop",
    PROCESSING:        "Working on it…",
    ERROR:             "Something went wrong. Try again.",
    SILENCE_COUNTDOWN: (seconds: number) =>
      `Sending in ${seconds}s…`,
    MIC_LABEL_IDLE:       "Tap to start speaking",
    MIC_LABEL_RECORDING:  "Tap to stop",
    MIC_LABEL_PROCESSING: "Please wait",
    MIC_LABEL_ERROR:      "Error. Tap to try again.",
  },

  // -------------------------------------------------------------------------
  // Navigation map (provider screen)
  // -------------------------------------------------------------------------

  NAV_MAP: {
    TITLE:          "Get to the Customer",
    OPEN_IN_MAPS:   "Open in Maps",
    LOADING:        "Loading map…",
    NO_LOCATION:    "Location not available. Tap \"Open in Maps\" for directions.",
    ERROR_FALLBACK: "Open in Google Maps",
  },

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------

  NOTIFICATIONS: {
    TITLE:         "Notifications",
    MARK_ALL_READ: "Mark all read",
    VIEW_FEED:     "See jobs →",
    EMPTY:         "No notifications yet",
  },

} as const;