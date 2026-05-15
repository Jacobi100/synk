// ---------------------------------------------------------------------------
// lib/copy.ts - Every word a user sees on this app
//
// LANGUAGE PRINCIPLES:
// ✓ Simple enough for a market woman in Surulere or an Igbo trader in Onitsha
// ✓ Professional enough that users trust the platform with their money
// ✓ Action-first: every label tells you what happens when you tap it
// ✓ No jargon: no "escrow", "bounty", "provider", "application", "payout"
// ✓ Short: if it can be said in 4 words instead of 8, use 4
//
// ENGINEER RULES:
// - Import { COPY } from "@/lib/copy": never hardcode strings in components
// - Never rename keys without updating imports across all files
// - Never touch variable names, functions, or database columns
// - One change here = changes everywhere
// ---------------------------------------------------------------------------

export const COPY = {

  // -- App meta --------------------------------------------------------------
  APP_TITLE:       "Synk: Find help near you",
  APP_DESCRIPTION: "Post a job and get help from people nearby. We keep your money safe until the work is done.",

  // -- Job/bounty status -----------------------------------------------------
  // Keep these short: they appear as chips/badges with limited space
  STATUS: {
    open:        "Open",
    in_progress: "Working",
    paid:        "Money Safe",
    completed:   "Done",
    cancelled:   "Cancelled",
  },

  // -- Offer/application status badges --------------------------------------
  APPLICATION_STATUS: {
    pending:   "Waiting",
    accepted:  "Chosen",
    rejected:  "Not chosen",
    withdrawn: "Pulled back",
  },

  // -- Urgency labels --------------------------------------------------------
  URGENCY: {
    asap:      "Now",
    scheduled: "Later",
    flexible:  "Any time",
  },

  // -- Reusable actions ------------------------------------------------------
  BACK:          "Back",
  BACK_TO_FEED:  "Back to Jobs",
  BACK_TO_JOB:   "Back to Job",
  TRY_AGAIN:     "Try Again",
  LOADING:       "Loading...",
  CANCEL:        "Cancel",
  DONE:          "Done",

  // -- Reusable field labels -------------------------------------------------
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
    SUBHEADLINE:    "Post a job and get help from people near you. We keep your money safe until the work is done.",
    POST_A_JOB:     "Post a job",
    FIND_JOBS:      "Find jobs",
    ACTIVE_JOBS:    "Open jobs",
    IN_PROGRESS:    "Working",
    COMPLETED:      "Done",
    ACCEPTED:       "Paid",
    TOTAL_EARNINGS: "Total earned",
    POST_JOB_DESC:  "Tell us what you need. People near you will offer to help.",
    FIND_JOBS_DESC: "See jobs near you and start earning.",
  },

  // -------------------------------------------------------------------------
  // Dashboard / feed
  // -------------------------------------------------------------------------

  DASHBOARD: {
    AVAILABLE_JOBS:     "Jobs near you",
    AVAILABLE_JOBS_SUB: "People nearby who need help.",
    POST_JOB:           "Post a job",
    REFRESH:            "Refresh",
    NO_JOBS:            "No jobs near you yet",
    NO_JOBS_SUB:        "Be the first to post a job in your area.",
    POST_FIRST:         "Post the first job",
    LOADING:            "Looking for jobs near you...",
  },

  // -------------------------------------------------------------------------
  // Navbar / navigation
  // -------------------------------------------------------------------------

  NAVBAR: {
    FEED:         "Jobs",
    APPLICATIONS: "Offers",
    MY_POSTINGS:  "My jobs",
    POST:         "Post a job",
    PROFILE:      "My profile",
    HOW_IT_WORKS: "How it works",
    SIGN_IN:      "Sign in",
    SIGN_UP:      "Sign up",
    MENU_LABEL:   "Menu",
    MENU_OPEN:    "Open menu",
    MENU_CLOSE:   "Close menu",
  },

  // -------------------------------------------------------------------------
  // My jobs page (my-postings)
  // -------------------------------------------------------------------------

  MY_POSTINGS: {
    TITLE:            "My jobs",
    SUBTITLE:         "All the jobs you posted.",
    NEW_JOB:          "Post a job",
    EMPTY_TITLE:      "You have not posted any jobs yet",
    EMPTY_SUB:        "Post a job and people near you will offer to help.",
    VIEW_DETAILS:     "See details",
    VIEW_HELPERS:     "See offers",
    PAYMENT:          "Pay",
    CONFIRM_DONE:     "Mark done",
    SIGN_IN_REQUIRED: "Sign in to see your jobs.",
    ERROR_LOAD:        "Could not load your jobs. Try again.",
    ASK_FOR_PRICE:     "Ask for price",
  },

  // -------------------------------------------------------------------------
  // Post a job page (bounties/create)
  // -------------------------------------------------------------------------

  CREATE_JOB: {
    TITLE:            "Post a job",
    SUBTITLE:         "Say what you need. Speak or type.",
    RECORD_AGAIN:     "Try again",
    POST_LISTING:     "Post job",
    WHAT_WE_HEARD:    "Here is what we heard",
    LOW_CONFIDENCE:   "We are not sure about some details. Please check before posting.",
    PROCESSING:       "Setting up your job...",
    POSTING:          "Posting your job...",
    SUCCESS:          "Your job has been posted!",
    REDIRECTING:      "Taking you back...",
    TRY_AGAIN:        "Try again",
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
    DESCRIPTION_TITLE:    "What they need",
    APPLY_BUTTON:         "Offer to help",
    APPLYING:             "Sending offer...",
    APPLY_SUCCESS:        "Offer sent",
    APPLY_ERROR_GENERIC:  "Could not send your offer. Try again.",
    SIGN_IN_TO_APPLY:     "Sign in to offer help",
    VIEW_HELPERS:         "See offers",
    MAKE_SAFE_PAYMENT:    "Pay safely",
    CONFIRM_AND_PAY:      "Mark done and pay",
    YOU_POSTED:           "You posted this job",
    NOT_TAKING_HELPERS:   "Not taking offers now",
    NEGOTIATE_PRICE:      "Talk about price",
    NEGOTIATE_DECREASE:   "Decrease price",
    NEGOTIATE_INCREASE:   "Increase price",
    SHARE:                "Share",
    PAYMENT_INFO_TITLE:   "Your money is safe",
    PAYMENT_INFO_BODY:    "We hold your money here until you say the job is done.",
    LOADING:              "Loading...",
    IMAGES_TITLE:         "Photos",
    RADIUS_UP_TO:         (km: number) => `Up to ${km} km`,
    POSTED:               (when: string) => `Posted ${when}`,
    CONTACT_FOR_PRICE:    "Ask for price",
    MARK_DONE:            "Mark done",
    ERROR_TITLE:          "Could not load this job",
    ERROR_MESSAGE:        "Could not load this job. Try again.",
    NOT_FOUND:            "Job not found.",
  },

  // -------------------------------------------------------------------------
  // Offers received / sent (applications page)
  // -------------------------------------------------------------------------

  MY_APPLICATIONS: {
    TITLE_RECEIVED:    "Offers to help",
    TITLE_SENT:        "Jobs I offered for",
    SUBTITLE_RECEIVED: "People who want to help with your jobs.",
    SUBTITLE_SENT:     "Jobs you have offered to help with.",
    EMPTY_TITLE:       "No offers yet",
    EMPTY_RECEIVED:    "When someone offers to help, they will show here.",
    EMPTY_SENT:        "Find jobs near you and offer to help.",
    BROWSE_JOBS:       "Find jobs",
    CALL_CUSTOMER:     "Call customer",
    CALL_HELPER:       "Call helper",
    VIEW_JOB:          "See job",
    HELPER_LABEL:      "Helper",
    PHONE_HIDDEN:      "Phone shows after you accept",
    ACCEPT:            "Accept",
    DECLINE:           "Decline",
    SIGN_IN_REQUIRED:  "Sign in to see your offers.",
    ROLE_CUSTOMER:     "Customer",
    ROLE_HELPER:       "Helper",
    THEIR_PRICE:       "Their price",
    APPLIED_ON:        (date: string) => `Sent ${date}`,
  },

  // -------------------------------------------------------------------------
  // Offers for a specific job (bounties/[id]/applications)
  // -------------------------------------------------------------------------

  APPLICATIONS: {
    TITLE:       "People who offered to help",
    SUBTITLE:    "Pick who will help with this job.",
    EMPTY:       "No offers yet.",
    ACCEPT:      "Accept",
    DECLINE:     "Decline",
    ERROR_TITLE: "Something went wrong",
    APPLIED_ON:  (date: string) => `Sent ${date}`,
    THEIR_PRICE: "Their price",
    ACCEPTING:   "Accepting...",
    DECLINING:   "Declining...",
    ERROR_LOAD:  "Could not load offers. Try again.",
  },

  // -------------------------------------------------------------------------
  // Payment page (bounties/[id]/payment)
  // -------------------------------------------------------------------------

  PAYMENT: {
    TITLE:                "Pay into safe account",
    TRANSFER_INSTRUCTION: (status: string) =>
      `Send money to this account in your bank app. Status: ${status}`,
    NOT_AVAILABLE:        "Payment details are not ready yet, or this is not your job.",
    HELD_NOTICE:          "We hold your money until you say the job is done.",
    DONE_BUTTON:          "Done",
    INTRO:                "Send the agreed amount to the account below. We will tell the helper when it lands.",
    LOAD_ERROR:           "Could not load payment details. Try again.",
    NOT_FOUND:            "Job not found.",
    ACCOUNT_NUMBER:       "Account number",
    PAID_TITLE:           "Money received",
    PAID_BODY:            "This job is paid. The helper has been told to start.",
    PAY_BUTTON:           (amount: string) => `Pay ${amount}`,
    PAYING:               "Processing...",
    SIM_FAIL:             "Could not process payment. Try again.",
    SIM_OK:               "Payment recorded.",
    SAFETY_TITLE:         "Your money is safe",
    UPDATE_TITLE:         "Quick update",
    UPDATE_BODY:          "We tell the helper once your money lands.",
    PROVIDER_PAID_TITLE:  "Money is safe",
    PROVIDER_PAID_BODY:   "The customer has deposited the funds into escrow. You can now safely start the work.",
  },

  COMPLETE_REVIEW: {
    TITLE:       "Rate your experience",
    PLACEHOLDER: "Tell us more...",
    SAVING:      "Saving...",
    SUBMIT:      "Send feedback",
    RECEIVED:    "Feedback received",
  },

  // -------------------------------------------------------------------------
  // Confirm done + pay helper (bounties/[id]/complete)
  // -------------------------------------------------------------------------

  COMPLETE: {
    PAGE_TITLE:    "Mark job done and pay",
    PAGE_SUBTITLE: "Confirm the job is done and pay the helper.",

    SUCCESS_TITLE: "Payment sent",
    SUCCESS_BODY:  (amount: string) =>
      `${amount} has been sent to the helper's bank account.`,
    BACK_TO_FEED:  "Back to jobs",
    BACK_TO_JOB:   "Back to job",

    HOLD_TITLE:    "We are checking this payment",
    HOLD_BODY:     "We saw something unusual and are checking it. No money has moved. We will tell you when it is clear.",
    HOLD_CONTACT:  (id: string) =>
      `If you think this is a mistake, contact support. Reference: ${id}`,

    BLOCK_TITLE:   "Payment did not go through",
    BLOCK_BODY:    "We could not complete this payment due to a safety check. No money has moved.",
    BLOCK_CONTACT: (id: string) => `Contact support. Reference: ${id}`,

    SECTION_JOB:       "Job",
    SECTION_BREAKDOWN: "Payment summary",
    TOTAL_AMOUNT:      "Total",
    SERVICE_CHARGE:    "Synk fee (5%)",
    HELPER_RECEIVES:   "Helper gets",

    SAFETY_NOTICE:  "We do a quick safety check before we send any money.",
    CANNOT_PAY_YET: (status: string) =>
      `Payment can only be sent after the customer pays. Status: ${status}`,

    CANCEL:         "Cancel",
    CONFIRM_BUTTON: "Mark done and pay helper",
    PROCESSING:     "Sending payment...",
    ERROR_TITLE:    "Something went wrong",
    TRY_AGAIN:      "Try again",
    NOT_FOUND:      "Job not found.",
    LOADING:        "Loading...",
  },

  // -------------------------------------------------------------------------
  // Job form (BountyForm component)
  // -------------------------------------------------------------------------

  BOUNTY_FORM: {
    FIELD_TITLE:          "Job title",
    PLACEHOLDER_TITLE:    "e.g. Fix my tap",
    FIELD_DESCRIPTION:    "More details",
    FIELD_CATEGORY:       "Category",
    PLACEHOLDER_CATEGORY: "Select a category",
    FIELD_LOCATION:       "Location",
    PLACEHOLDER_LOCATION: "e.g. Yaba, Lagos",
    FIELD_GPS:            "Use my location",
    FIELD_PRICE:          "Budget (₦)",
    PLACEHOLDER_MIN:      "Min",
    PLACEHOLDER_MAX:      "Max",
    FIELD_NEGOTIABLE:     "Can talk price",
    FIELD_DEADLINE:       "Deadline",
    FIELD_URGENCY:        "How soon?",
    FIELD_SLOTS:          "Helpers needed",
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
      in_progress: "Working",
      paid:        "Money Safe",
      completed:   "Done",
      cancelled:   "Cancelled",
    },
  },

  // -------------------------------------------------------------------------
  // Own profile page
  // -------------------------------------------------------------------------

  PROFILE: {
    TITLE:            "My profile",
    SUBTITLE:         "Add your bank account so you can get paid after a job is done.",
    SAVE:             "Save",
    SAVING:           "Saving...",
    SUCCESS:          "Profile saved.",
    ERROR:            "Could not save. Please try again.",
    FIELD_USERNAME:   "Username",
    FIELD_FULL_NAME:  "Full name",
    FIELD_PHONE:      "Phone number",
    PHONE_HINT:       "We will call you about your jobs",
    PAYOUT_TITLE:     "Bank account for payment",
    PAYOUT_SUBTITLE:  "You need this to get paid.",
    FIELD_BANK_NAME:  "Bank",
    BANK_NAME_HINT:   "Select your bank",
    FIELD_ACCOUNT:    "Account number",
    ACCOUNT_HINT:     "Must be exactly 10 digits",
    VERIFYING:        "Checking account...",
    ACCOUNT_NAME:     "Account name",
    SIGN_IN_REQUIRED: "Sign in to manage your profile.",
  },

  // -------------------------------------------------------------------------
  // Provider/helper public profile page
  // -------------------------------------------------------------------------

  PROVIDER_PROFILE: {
    BACK:            "Back to jobs",
    NOT_FOUND_TITLE: "Profile not found",
    NOT_FOUND_SUB:   "This helper's profile does not exist.",
    LOADING:         "Loading profile...",

    BADGE_NEW_LABEL:     "New on Synk",
    BADGE_NEW_DESC:      "This helper just joined Synk and is building trust.",
    BADGE_ACTIVE_LABEL:  "Active helper",
    BADGE_ACTIVE_DESC:   "This helper has done many jobs with good results.",
    BADGE_TRUSTED_LABEL: "Trusted helper",
    BADGE_TRUSTED_DESC:  "Synk trusts this helper. People come back to them.",
    BADGE_TOP_LABEL:     "Top helper",
    BADGE_TOP_DESC:      "One of Synk's best. Many happy customers.",

    REPUTATION_TITLE: "Trust",
    REPUTATION_SCORE: "Score",
    JOBS_COMPLETED:   "Jobs done",
    UNIQUE_CUSTOMERS: "Customers",
    LAST_UPDATED:     "Updated",

    NO_HISTORY_TITLE: "No trust yet",
    NO_HISTORY_SUB:   "Trust shows after the first completed job.",

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
    BANK_SELECT:       "Select your bank",
    VERIFYING_ACCOUNT: "Checking account...",
  },

  RISK: {
    LOW:        "Low risk",
    MEDIUM:     "Medium risk",
    HIGH:       "High risk",
    RECOMMEND:  "Recommended",
    CAUTION:    "Be careful",
    NOT_RECOMM: "Not recommended",
    SAFETY_SCORE: (score: number) => `Safety score: ${score}/100`,
  },

  // -------------------------------------------------------------------------
  // Voice input component
  // -------------------------------------------------------------------------

  VOICE: {
    IDLE:              "Tap to speak",
    RECORDING:         "Listening... tap to stop",
    PROCESSING:        "Working on it...",
    ERROR:             "Something went wrong. Try again.",
    SILENCE_COUNTDOWN: (seconds: number) =>
      `Sending in ${seconds}s...`,
    MIC_LABEL_IDLE:       "Tap to start speaking",
    MIC_LABEL_RECORDING:  "Tap to stop",
    MIC_LABEL_PROCESSING: "Please wait",
    MIC_LABEL_ERROR:      "Error. Tap to try again.",
  },

  // -------------------------------------------------------------------------
  // Navigation map (provider screen)
  // -------------------------------------------------------------------------

  NAV_MAP: {
    TITLE:          "Get to the customer",
    OPEN_IN_MAPS:   "Open in Maps",
    LOADING:        "Loading map...",
    NO_LOCATION:    "Location not available. Tap Open in Maps for directions.",
    ERROR_FALLBACK: "Open in Google Maps",
  },

  // -------------------------------------------------------------------------
  // Notifications
  // -------------------------------------------------------------------------

  NOTIFICATIONS: {
    TITLE:         "Notifications",
    MARK_ALL_READ: "Mark all read",
    VIEW_FEED:     "See jobs",
    EMPTY:         "No notifications yet",
  },

  // -------------------------------------------------------------------------
  // Wallet
  // -------------------------------------------------------------------------

  WALLET: {
    TITLE:         "My wallet",
    TOTAL_EARNED:  "Total earned",
    TOTAL_SPENT:   "Total spent",
    PENDING:       "Pending pay",
    HISTORY:       "Transactions",
    EMPTY:         "No transactions yet",
    EMPTY_SUB:     "Finish jobs to see your earnings here.",
    TYPE_EARNED:   "Earned",
    TYPE_SPENT:    "Spent",
    STATUS_PAID:   "Paid",
    STATUS_PENDING: "Pending",
  },

} as const;
