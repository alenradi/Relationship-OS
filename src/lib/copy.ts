/**
 * Every user-facing string in the app lives in this file.
 *
 * To translate the app (e.g. to Slovenian), copy this file, translate the
 * values, and swap the export at the bottom. Nothing outside this file needs to
 * change — components only ever read from `copy`.
 *
 * Tone guide: warm, calm, plain-spoken. Talk to the two of you, never at you.
 * Never comparative, never scolding, never a leaderboard.
 */

const en = {
  app: {
    name: "Ilaria & Alen",
    shortName: "Us",
    tagline: "A private space for the two of you",
    description:
      "Agreements, rhythms, reflections and plans — for exactly one couple.",
    loading: "One moment…",
    saving: "Saving…",
    saved: "Saved",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    remove: "Remove",
    add: "Add",
    close: "Close",
    back: "Back",
    next: "Next",
    done: "Done",
    optional: "optional",
    confirmDelete: "Are you sure? This can't be undone.",
    somethingWentWrong: "Something went wrong. Please try again.",
    notSetYet: "Not set yet",
    you: "You",
    today: "Today",
    yesterday: "Yesterday",
    tomorrow: "Tomorrow",
  },

  nav: {
    dashboard: "Home",
    constitution: "Constitution",
    rhythm: "Daily rhythm",
    reflection: "Weekly reflection",
    goals: "Goals",
    conflicts: "Conflict archive",
    future: "Future & adventures",
    settings: "Settings",
    signOut: "Sign out",
    menu: "Menu",
  },

  auth: {
    signInTitle: "Welcome back",
    signInSubtitle: "Sign in to your shared space.",
    signUpTitle: "Start your space",
    signUpSubtitle: "Two people, one private place to be intentional together.",
    email: "Email",
    password: "Password",
    displayName: "Your name",
    displayNamePlaceholder: "How your partner sees you",
    signIn: "Sign in",
    signUp: "Create account",
    signingIn: "Signing in…",
    signingUp: "Creating your account…",
    noAccount: "Don't have an account yet?",
    haveAccount: "Already have an account?",
    passwordHint: "At least 8 characters.",
    checkEmail:
      "Check your inbox to confirm your email address, then sign in below.",
    invalidCredentials: "That email and password don't match. Please try again.",
    signOutConfirm: "Sign out?",
  },

  pairing: {
    title: "Two of you, one space",
    subtitle:
      "A space holds exactly two people. Create one and invite your partner, or join the one they already made.",
    createTitle: "Create our space",
    createBody:
      "You'll get an invite code to share with your partner. Only they will need it.",
    createCta: "Create our space",
    joinTitle: "Join their space",
    joinBody: "Enter the 8-character code your partner sent you.",
    joinCta: "Join",
    codeLabel: "Invite code",
    codePlaceholder: "ABCD2345",
    inviteHeading: "Your invite code",
    inviteBody:
      "Send this to your partner. Once they join, your space is complete and the code stops working.",
    copyCode: "Copy code",
    copied: "Copied",
    waitingTitle: "Waiting for your partner",
    waitingBody:
      "Share the code below. You can start setting things up on your own — they'll see everything when they join.",
    continueAlone: "Continue for now",
    continueAloneHelp:
      "You can finish the constitution and use the app alone. When they join, you're already set up.",
    refresh: "Check again",
    full: "That space is already full. A space holds exactly two people.",
    notFound: "That code doesn't match any space. Check it and try again.",
    alreadyPaired: "You're already part of a space.",
    waitingBannerTitle: "Your partner hasn't joined yet",
    waitingBannerBody: (code: string) =>
      `Invite code ${code} is still open. Share it when you're ready.`,
  },

  onboarding: {
    welcomeTitle: "Welcome",
    welcomeBody:
      "This is a shared operating system for your relationship: what you've agreed on, how your days actually look, and how you check in with each other. Let's start with the part that matters most — your agreements.",
    welcomeCta: "Let's begin",
    profileTitle: "First, about you",
    profileBody: "Your partner will see this name.",
    constitutionIntroTitle: "Your constitution",
    constitutionIntroBody:
      "These are the agreements you're choosing on purpose, instead of the ones you drift into. Pick the ones that fit, edit the wording, skip the rest. You'll review them together about once a month — and every change is kept in history.",
    pickSuggestions: "Pick the agreements that fit you",
    suggestionsHelp:
      "Tap to include. You can edit the wording before saving, and add your own.",
    addYourOwn: "Write your own agreement",
    finishTitle: "That's your starting point",
    finishBody:
      "Your constitution is live. From here you can log your daily rhythm, and each week you'll both reflect and compare notes.",
    finishCta: "Go to our home",
    partnerWillSee: (name: string) =>
      `${name} will see all of this on their home screen too.`,
    soloFinishBody:
      "Your constitution is live. When your partner joins, they'll see it too. Until then, you can use everything on your own.",
    skipForNow: "Skip for now",
    stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
    selectedCount: (n: number) =>
      n === 1 ? "1 agreement selected" : `${n} agreements selected`,
    needAtLeastOne: "Pick or write at least one agreement to continue.",
  },

  dashboard: {
    greetingMorning: (name: string) => `Good morning, ${name}`,
    greetingAfternoon: (name: string) => `Good afternoon, ${name}`,
    greetingEvening: (name: string) => `Good evening, ${name}`,
    subtitle: "Here's where the two of you are today.",
    todaysRhythm: "Today's rhythm",
    rhythmEmpty: "Nobody has logged their day yet.",
    logMyDay: "Log my day",
    updateMyDay: "Update my day",
    viewFullRhythm: "See the week",
    reflectionNudgeTitle: "This week's reflection",
    reflectionOpen: "Open the reflection",
    upcomingTitle: "Coming up",
    upcomingEmpty: "Nothing on the horizon yet. Add a milestone or a trip.",
    celebrationTitle: "Worth noticing",
    celebrationEmpty:
      "Your celebrations will show up here as you use Us together.",
    constitutionReviewTitle: "Time to revisit your constitution",
    constitutionReviewBody: (months: number) =>
      months <= 1
        ? "It's been about a month since you last looked at your agreements together. Still true?"
        : `It's been ${months} months since you last reviewed your agreements. Worth 10 minutes together?`,
    constitutionReviewCta: "Review together",
    constitutionReviewDone: "We reviewed it",
    constitutionReviewDismissed: "Marked as reviewed. See you next month.",
    quickLinks: "Jump to",
  },

  constitution: {
    title: "Our constitution",
    subtitle:
      "The agreements you chose on purpose. You revisit them together about once a month — nothing here is set in stone, it's just written down.",
    lockedSubtitle:
      "Agreements are locked between reviews. When it's been about 30 days, you'll get a nudge to reopen them together.",
    lockedNotice:
      "Editing unlocks during your monthly review. Mark the review when you're done so the next one starts counting.",
    empty: "You haven't written any agreements yet.",
    emptyCta: "Write your first agreement",
    addRule: "Add an agreement",
    editRule: "Edit agreement",
    newRule: "New agreement",
    reviewOpenTitle: "Review window open",
    reviewOpenBody:
      "You can edit, renegotiate, or retire agreements until you mark this review done.",
    fieldTitle: "The agreement",
    fieldTitlePlaceholder: "We don't go to bed in the middle of a fight",
    fieldDescription: "What it means in practice",
    fieldDescriptionPlaceholder:
      "If it's late and we're stuck, we name it, pause, and pick it up the next evening.",
    fieldWhy: "Why we agreed to this",
    fieldWhyPlaceholder:
      "Because going silent overnight makes both of us spiral, and mornings are harder than they need to be.",
    fieldCategory: "Area",
    fieldStatus: "Status",
    fieldChangeNote: "What changed, and why",
    fieldChangeNotePlaceholder:
      "We softened this after realising the old version wasn't realistic on work nights.",
    changeNoteHelp: "This gets saved to the history so future-you remembers.",
    categories: {
      communication: "Communication",
      alone_time: "Alone time",
      boundaries: "Boundaries",
      fighting_fair: "Fighting fair",
      other: "Other",
    },
    statuses: {
      active: "Active",
      renegotiated: "Renegotiated",
      retired: "Retired",
    },
    statusHelp: {
      active: "We're living by this right now.",
      renegotiated: "We've reworked this one — the current wording is above.",
      retired: "We don't need this anymore. Kept for the record.",
    },
    versionLabel: (v: number) => (v === 1 ? "Original" : `Version ${v}`),
    historyTitle: "How our agreements evolved",
    historySubtitle:
      "Every version of every agreement, newest first. Nothing is ever deleted from here.",
    historyLink: "View full history",
    historyEmpty: "No history yet — it starts building as soon as you edit.",
    ruleHistoryTitle: "History of this agreement",
    addedBy: (name: string) => `Added by ${name}`,
    changedBy: (name: string) => `Changed by ${name}`,
    whyWeAgreed: "Why we agreed",
    inPractice: "In practice",
    activeCount: (n: number) =>
      n === 1 ? "1 active agreement" : `${n} active agreements`,
    lastReviewed: (when: string) => `Last reviewed ${when}`,
    neverReviewed: "Never reviewed together",
    markReviewed: "We reviewed this together",
  },

  rhythm: {
    title: "Daily rhythm",
    subtitle:
      "A quick, honest picture of each day — so neither of you has to guess why the other is quiet.",
    myDayTitle: "My day",
    logTitle: (date: string) => `How does ${date} look?`,
    busyScore: "How full is your day?",
    busyScoreHelp: "1 is wide open, 10 is back-to-back.",
    busyScoreLabels: {
      1: "Wide open",
      2: "Very light",
      3: "Light",
      4: "Manageable",
      5: "Normal",
      6: "Busy",
      7: "Full",
      8: "Very full",
      9: "Slammed",
      10: "Underwater",
    },
    blocks: "What's in the day",
    blocksHelp:
      "Free text is fine — e.g. “work 8-16” or “gym 17-18”. You can only edit today's day.",
    blockLabel: "Block",
    blockLabelPlaceholder: "work 8-16",
    addBlock: "Add a block",
    noBlocks: "No blocks yet.",
    note: "Anything they should know?",
    notePlaceholder: "Big review at 15:00 — I'll be useless until it's done.",
    saveDay: "Save my day",
    onlyToday: "You can only log or edit today — past days stay as they were.",
    notLoggedYet: (name: string) => `${name} hasn't logged today yet.`,
    nudgePartner: "They'll see your day as soon as you save it.",
    freeAllDay: "Free all day",
    weekTitle: "This week",
    weekSubtitle: "Both of your days, side by side.",
    noDataForDay: "Nothing logged",
    summaryHeading: "In plain words",
    scoreOutOf: (score: number) => `${score}/10`,
  },

  reflection: {
    title: "Weekly reflection",
    subtitle:
      "You each answer on your own. Nothing is revealed until you've both submitted — then you see everything at once.",
    weekOf: (range: string) => `Week of ${range}`,
    ratingsHeading: "How was the week?",
    promptsHeading: "In your words",
    journalLabel: "Anything else on your mind?",
    journalHelp: "Optional. This is yours to ramble in.",
    journalPlaceholder: "No structure needed…",
    submit: "Submit my reflection",
    submitting: "Submitting…",
    saveDraft: "Save draft",
    draftSaved: "Draft saved — only you can see this.",
    editMine: "Edit my answers",
    yourAnswers: "Your answers",
    partnerAnswers: (name: string) => `${name}'s answers`,
    sealedTitle: "Sealed until you both submit",
    sealedBody: (name: string) =>
      `${name}'s answers are locked away. They'll appear the moment you submit yours — and yours appear to them at the same time.`,
    waitingTitle: "Submitted — now we wait",
    waitingBody: (name: string) =>
      `Your answers are in. As soon as ${name} submits, you'll both see everything together.`,
    waitingBodyNudge: (name: string) =>
      `Your answers are in and ${name} hasn't submitted yet. No rush — the week is still open.`,
    partnerSubmitted: (name: string, when: string) =>
      `${name} submitted ${when}.`,
    partnerNotSubmitted: (name: string) => `${name} hasn't submitted yet.`,
    partnerDraft: (name: string) => `${name} has started theirs.`,
    youNotSubmitted: "You haven't submitted yet.",
    youSubmitted: (when: string) => `You submitted ${when}.`,
    revealedTitle: "Revealed",
    revealedBody: (when: string) => `You both submitted. Opened ${when}.`,
    lockedNote: "Submitted reflections are read-only — this is the record.",
    editableNote: "You can still change your answers until you've both submitted.",
    notSubmittedYet: "Not answered",
    noAnswer: "— left blank —",

    agendaTitle: "Your discussion agenda",
    agendaSubtitle:
      "Generated from where your answers pulled apart. Not a verdict — just the things most worth 10 minutes of talking.",
    agendaEmpty:
      "You two read this week almost identically. Nothing obvious to unpack — enjoy that.",
    agendaGapBig: "Worth talking about first",
    agendaGapSmall: "Small difference",
    agendaRatingGap: (label: string, myScore: string, partnerName: string, theirScore: string) =>
      `${label}: you said ${myScore}, ${partnerName} said ${theirScore}.`,
    agendaBothLow: (label: string) =>
      `${label} felt low to both of you this week.`,
    agendaBothHigh: (label: string) => `You both felt good about ${label}.`,
    agendaTalkAbout: "Read both answers, then talk it through.",
    agendaSupportHeading: "How to support each other this week",

    streakTitle: "Shared streak",
    streakWeeks: (n: number) =>
      n === 1 ? "1 week in a row" : `${n} weeks in a row`,
    streakNone: "No streak yet — this week can start it.",
    streakBest: (n: number) => `Your best run: ${n} weeks`,
    streakBoth: "Both of you completed it",
    streakEncouragement: (n: number) =>
      n >= 4
        ? "You've made this a habit. That's rare."
        : "Keep it going — it compounds.",
    historyTitle: "Past reflections",
    historyEmpty: "Your first reflection is still ahead of you.",
    historyOpen: "Open",
    historyIncomplete: "Only one of you submitted",
    historyWaiting: "Waiting on both of you",
    onlyOneSubmitted:
      "Only one of you submitted this week, so it never opened. The answers stay private.",
    closedWeekNotice:
      "This week has closed. You can read it, but not change it.",
    lateWindowNotice:
      "This week's reflection is still open for a day or two — submit when you can. You still won't see each other's answers until both of you have.",
    sundayTitle: "Sunday check-in",
    sundayBody:
      "It's reflection day. Answer on your own — nothing opens until you've both submitted.",
  },

  goals: {
    title: "Goals",
    subtitle:
      "Three lanes: what you're building, what they're building, and what you're building together.",
    laneMine: "Mine",
    laneTheirs: (name: string) => `${name}'s`,
    laneOurs: "Ours",
    laneMineEmpty: "Nothing here yet. What are you working towards?",
    laneTheirsEmpty: (name: string) =>
      `${name} hasn't added any goals yet. No nudging.`,
    laneOursEmpty: "Nothing shared yet. What do you want to build together?",
    addGoal: "Add a goal",
    newPersonal: "New goal for me",
    newShared: "New shared goal",
    editGoal: "Edit goal",
    fieldTitle: "The goal",
    fieldTitlePlaceholder: "Run a half marathon",
    fieldWhy: "Why it matters",
    fieldWhyPlaceholder:
      "I want to prove to myself I can commit to something slow and boring and still finish it.",
    fieldTargetDate: "Target date",
    fieldStatus: "Status",
    fieldType: "Whose goal is this?",
    typePersonal: "Mine",
    typeShared: "Ours",
    statuses: {
      active: "In progress",
      achieved: "Achieved",
      paused: "Paused",
      archived: "Archived",
    },
    milestonesTitle: "Milestones",
    milestonesHelp: "Break it into pieces you can actually finish.",
    addMilestone: "Add a milestone",
    milestonePlaceholder: "Run 10k without stopping",
    milestoneProgress: (done: number, total: number) =>
      `${done} of ${total} done`,
    noMilestones: "No milestones yet.",
    progressTitle: "Progress log",
    progressPlaceholder: "Where are you with this?",
    addProgress: "Add an update",
    fieldProgressPercent: "Roughly how far along? (0–100)",
    progressEmpty: "No updates yet.",
    progressBy: (name: string, when: string) => `${name} · ${when}`,
    cheerCta: "Cheer this on",
    cheerPlaceholder: "Say something encouraging…",
    cheerSend: "Send",
    cheersTitle: "Cheers",
    cheersEmpty: "No cheers yet.",
    cheeredBy: (name: string) => `${name} cheered`,
    cheerCount: (n: number) => (n === 1 ? "1 cheer" : `${n} cheers`),
    cheerOwnGoalNote: "This one's yours — cheering is for their goals.",
    achievedBanner: "Achieved 🎉",
    markAchieved: "Mark as achieved",
    targetLabel: (when: string) => `Target: ${when}`,
    overdueLabel: (when: string) => `Target was ${when}`,
  },

  conflicts: {
    title: "Conflict archive",
    subtitle:
      "A record of things you already worked through, and whether the fix actually held.",
    afterTheFactNotice:
      "Write these down after you've talked it through in person — not during, and not instead. This is a record of a repair, not a place to argue.",
    empty: "Nothing archived yet. That's allowed.",
    emptyCta: "Add a resolved conflict",
    addConflict: "Add a resolved conflict",
    editConflict: "Edit entry",
    fieldTitle: "In a few words, what was it about?",
    fieldTitlePlaceholder: "Planning the weekend at the last minute",
    fieldHappenedOn: "When was it?",
    fieldAbout: "What it was about",
    fieldAboutPlaceholder:
      "Neutral version, the one you'd both sign off on.",
    fieldPerspectiveA: "How it felt to me",
    fieldPerspectiveB: (name: string) => `How it felt to ${name}`,
    perspectiveHelp: "Write your own. Don't write theirs.",
    perspectivePlaceholder: "I felt…",
    partnerWritesTheirs: (name: string) =>
      `${name} fills this in from their own account.`,
    fieldTrigger: "What set it off",
    fieldTriggerPlaceholder:
      "Being asked to decide something while I was still in work mode.",
    fieldResolution: "How we got past it",
    fieldResolutionPlaceholder: "We…",
    fieldAgreedAction: "What we'll do differently",
    fieldAgreedActionPlaceholder:
      "Sunday evening, 10 minutes, rough plan for the week.",
    fieldFollowUpDate: "Check back on",
    followUpHelp: "Two to four weeks out is usually about right.",
    followUpTitle: "Did the fix work?",
    followUpDue: "Follow-up due",
    followUpDueOn: (when: string) => `Follow-up due ${when}`,
    followUpOverdue: (when: string) => `Follow-up was due ${when}`,
    followUpPrompt: (title: string) =>
      `You agreed to try something after “${title}”. Did it hold?`,
    followUpNote: "Anything to add?",
    followUpStatuses: {
      pending: "Not checked yet",
      worked: "It worked",
      partly: "Partly worked",
      didnt_work: "Didn't work",
    },
    followUpSave: "Save follow-up",
    reopenSuggestion:
      "If it didn't work, it might belong in your constitution instead of on a list.",
    perspectivesTitle: "Both sides",
    yourSide: "Your side",
    theirSide: (name: string) => `${name}'s side`,
    notWrittenYet: "Not written yet",
    pendingFollowUpsTitle: "Follow-ups waiting on you",
    noPendingFollowUps: "No follow-ups due.",
  },

  future: {
    title: "Future & adventures",
    subtitle: "The good stuff you're both looking forward to.",

    dateJarTitle: "Date idea jar",
    dateJarSubtitle:
      "Drop ideas in whenever they occur to you. When you can't decide, let the jar decide.",
    dateJarEmpty: "The jar is empty. Add the first idea.",
    addDateIdea: "Add an idea",
    dateIdeaTitle: "The idea",
    dateIdeaTitlePlaceholder: "Cook something neither of us has made before",
    dateIdeaDescription: "Details",
    dateIdeaDescriptionPlaceholder: "Pick a recipe blind, no takeaway backup.",
    dateIdeaCategory: "Kind of thing",
    dateIdeaCost: "Rough cost",
    costLevels: {
      1: "Free or close to it",
      2: "A normal night out",
      3: "A proper splurge",
    },
    dateCategories: {
      at_home: "At home",
      out: "Out",
      active: "Active",
      culture: "Culture",
      food: "Food",
      travel: "Travel",
      other: "Other",
    },
    pickForUs: "Pick for us",
    picking: "Reaching into the jar…",
    pickedTitle: "The jar says:",
    pickedBy: "Picked",
    putBack: "Put it back",
    markDateDone: "We did this",
    dateDone: "Done",
    openIdeas: (n: number) => (n === 1 ? "1 idea waiting" : `${n} ideas waiting`),
    doneIdeas: "Already done",
    addedBy: (name: string) => `from ${name}`,

    tripsTitle: "Trips",
    tripsSubtitle: "Somewhere to look forward to.",
    tripsEmpty: "No trips yet. Where should you go?",
    addTrip: "Add a trip",
    editTrip: "Edit trip",
    tripDestination: "Where",
    tripDestinationPlaceholder: "Lisbon",
    tripNotes: "Notes",
    tripNotesPlaceholder: "Late September, before it gets cold.",
    tripBudget: "Budget",
    tripCurrency: "Currency",
    tripStart: "From",
    tripEnd: "To",
    tripStatus: "Status",
    tripStatuses: {
      idea: "Just an idea",
      planning: "Planning",
      booked: "Booked",
      done: "Been there",
    },
    tripTasksTitle: "Who's doing what",
    tripTasksHelp: "Split it so neither of you carries the whole thing.",
    addTripTask: "Add a task",
    tripTaskPlaceholder: "Book the flights",
    tripTaskAssignee: "Who",
    tripTaskUnassigned: "Either of us",
    tripTasksEmpty: "No tasks yet.",
    tripTasksProgress: (done: number, total: number) =>
      `${done}/${total} done`,
    tripActivitiesTitle: "Things we want to do",
    tripActivitiesHelp: "Not chores — the experiences. Pasteis, tram 28, a viewpoint at dusk.",
    addTripActivity: "Add an activity",
    tripActivityPlaceholder: "Sunset at Miradouro da Senhora do Monte",
    tripActivitiesEmpty: "No activities yet.",
    tripDates: (range: string) => range,
    tripNoDates: "No dates yet",
    tripCountdown: (days: number) =>
      days === 0
        ? "Today!"
        : days === 1
          ? "Tomorrow"
          : days > 0
            ? `In ${days} days`
            : "Already happened",

    milestonesTitle: "Milestones",
    milestonesSubtitle: "Where you've been, and what's coming.",
    milestonesEmpty: "No milestones yet. Start with the day you met.",
    addMilestone: "Add a milestone",
    editMilestone: "Edit milestone",
    milestoneTitle: "What happened",
    milestoneTitlePlaceholder: "The day we met",
    milestoneDescription: "Details",
    milestoneDate: "Date",
    milestoneKind: "Kind",
    milestoneKinds: {
      anniversary: "Anniversary",
      first: "A first",
      event: "Event",
      other: "Other",
    },
    milestoneRecurs: "This comes around every year",
    upcomingHeading: "Coming up",
    pastHeading: "Behind you",
    inDays: (days: number) =>
      days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`,
    yearsAgo: (years: number) =>
      years === 1 ? "1 year ago" : `${years} years ago`,
    anniversaryYears: (years: number) =>
      years === 1 ? "1 year" : `${years} years`,
    suggestHeading: "Suggestions",
    suggestHelp: "One tap to add — skip anything that doesn't fit.",
    suggestStartedUs: "We started Us",
    suggestStartedUsBody: "The day this shared space was created.",
    suggestAnniversary: "Our anniversary",
    suggestAdd: "Add this",
    suggestAlreadyAdded: "Already on the timeline",
  },

  celebrations: {
    // Positive-only by design. Never compares the two of you.
    reflectionStreak: (weeks: number) =>
      `You've both shown up for your reflection ${weeks} weeks running 🎉`,
    firstReflection: "You completed your first reflection together 🎉",
    cheersThisMonth: (n: number) =>
      `You've cheered each other on ${n} times this month 🎉`,
    goalsAchieved: (n: number) =>
      n === 1
        ? "You finished a goal this month 🎉"
        : `You finished ${n} goals this month 🎉`,
    datesDone: (n: number) =>
      n === 1
        ? "You pulled one idea out of the jar and actually did it 🎉"
        : `You've done ${n} of your date ideas 🎉`,
    conflictsRepaired: (n: number) =>
      n === 1
        ? "You worked through something and wrote down the fix 🎉"
        : `You've worked through ${n} things and followed up on each one 🎉`,
    followUpsWorked: (n: number) =>
      n === 1
        ? "One of your agreed fixes actually held 🎉"
        : `${n} of your agreed fixes actually held 🎉`,
    rhythmLogged: (n: number) =>
      `You've both kept each other in the loop ${n} days this month 🎉`,
    constitutionGrown: (n: number) =>
      `Your constitution has grown to ${n} agreements 🎉`,
    milestoneReached: (title: string) => `${title} — that happened 🎉`,
  },

  settings: {
    title: "Settings",
    subtitle: "Your name, your space, your data.",
    profileHeading: "You",
    spaceHeading: "Your space",
    partnerHeading: "Your partner",
    inviteCodeLabel: "Invite code",
    inviteCodeSpent: "Your space is complete — this code is no longer needed.",
    createdAt: (when: string) => `Together in Us since ${when}`,
    signOutHeading: "Session",
    dangerHeading: "Careful",
    timezoneNote: (tz: string) =>
      `Dates and weeks follow ${tz.replace("_", " ")}. Weeks run Monday to Sunday.`,
  },

  errors: {
    notFound: "We couldn't find that.",
    notFoundBody: "The page you're after doesn't exist.",
    goHome: "Back to home",
    unauthorized: "You need to sign in first.",
    noCouple: "You're not part of a space yet.",
    generic: "Something went wrong.",
    tryAgain: "Try again",
    required: "This one's needed.",
    invalidEmail: "That doesn't look like an email address.",
    passwordTooShort: "Passwords need at least 8 characters.",
    invalidTimeRange: "The end time needs to be after the start time.",
    invalidCode: "Invite codes are 8 characters.",
  },

  time: {
    justNow: "just now",
    minutesAgo: (n: number) => (n === 1 ? "a minute ago" : `${n} minutes ago`),
    hoursAgo: (n: number) => (n === 1 ? "an hour ago" : `${n} hours ago`),
    daysAgo: (n: number) => (n === 1 ? "yesterday" : `${n} days ago`),
    weeksAgo: (n: number) => (n === 1 ? "last week" : `${n} weeks ago`),
    monthsAgo: (n: number) => (n === 1 ? "last month" : `${n} months ago`),
  },

  /**
   * Plain-language day summary using display names, e.g.
   * "Alen is an 8/10 today — expect slow replies. Alen is free after 19:00."
   */
  rhythmSummary: {
    score: (name: string, is: string, article: string, score: number) =>
      `${name} ${is} ${article} ${score}/10 today`,
    qualifierUnderwater: "expect very slow replies",
    qualifierBusy: "expect slow replies",
    qualifierSteady: null,
    qualifierOpen: "plenty of room today",
    freeAfter: (name: string, is: string, time: string) =>
      `${name} ${is} free after ${time}`,
    freeUntil: (name: string, is: string, time: string) =>
      `${name} ${is} free until ${time}`,
    freeBetween: (name: string, is: string, from: string, to: string) =>
      `${name} ${is} free between ${from} and ${to}`,
    freeAllDay: (name: string, is: string) => `${name} ${is} free all day`,
    bookedSolid: (name: string, is: string) => `${name} ${is} booked solid`,
    busyWith: (name: string, is: string, blocks: string) =>
      `${name} ${is} busy with: ${blocks}`,
    notLogged: (name: string) =>
      name === "You"
        ? "You haven't logged this day yet"
        : `${name} hasn't logged this day yet`,
    bothFree: "You've both got a light day — use it.",
    bothSlammed: "You're both underwater today. Go gently on each other.",
    oneHeavy: (name: string) =>
      `${name} is carrying a much heavier day than you today.`,
  },

  /**
   * The weekly reflection questionnaire.
   *
   * Answers are stored in a jsonb column keyed by these ids, so you can add,
   * reword, or reorder questions here without touching the database. Removing an
   * id simply stops it being asked; past answers keep it on record.
   */
  reflectionRatings: [
    {
      id: "week_rating",
      label: "Our week overall",
      question: "How was our week, all in?",
      low: "Rough",
      high: "Wonderful",
    },
    {
      id: "communication_rating",
      label: "Communication",
      question: "How well did we actually talk to each other?",
      low: "We missed each other",
      high: "Really heard",
    },
    {
      id: "quality_time_rating",
      label: "Quality time",
      question: "How was the time we spent together?",
      low: "Barely any",
      high: "Plenty, and good",
    },
    {
      id: "support_rating",
      label: "Feeling supported",
      question: "How supported did you feel by me this week?",
      low: "On my own",
      high: "Fully backed",
    },
  ],

  reflectionPrompts: [
    {
      id: "best_moment",
      label: "Best moment this week",
      placeholder: "The bit you'd keep if you could only keep one.",
    },
    {
      id: "bothered_me",
      label: "Something that bothered me",
      placeholder:
        "Say it plainly. It's easier to read than to say out loud, and that's the point.",
    },
    {
      id: "appreciated",
      label: "One thing I appreciated about you",
      placeholder: "Something specific they did, not a general compliment.",
    },
    {
      id: "need_more_less",
      label: "One thing I need more of — or less of",
      placeholder: "More of… / Less of…",
    },
    {
      id: "support_next_week",
      label: "How you could support me next week",
      placeholder: "One concrete thing that would genuinely help.",
    },
  ],

  /**
   * Starter agreements offered by the first-run wizard. Edit freely — these are
   * only suggestions, and the wizard lets you reword any of them before saving.
   */
  suggestedRules: [
    {
      category: "communication",
      title: "We say the thing while it's still small",
      description:
        "If something stings, we mention it within a day or two instead of filing it away.",
      why_agreed:
        "Because saved-up resentment always comes out sideways, and about something unrelated.",
    },
    {
      category: "communication",
      title: "“I need a minute” is a complete sentence",
      description:
        "Either of us can pause a conversation, as long as we name when we're coming back to it.",
      why_agreed:
        "Because being pushed to talk before we're ready makes both of us say things we don't mean.",
    },
    {
      category: "communication",
      title: "Big things aren't decided over text",
      description:
        "Anything with real feelings in it waits for a call or for being in the same room.",
      why_agreed:
        "Because tone doesn't survive typing, and we both fill in the worst version.",
    },
    {
      category: "alone_time",
      title: "Alone time isn't a rejection",
      description:
        "We each get evenings to ourselves without needing a reason or an apology.",
      why_agreed:
        "Because we both come back nicer, and needing space isn't the same as needing less of each other.",
    },
    {
      category: "alone_time",
      title: "Busy days get announced, not discovered",
      description:
        "If a day is going to be brutal, we say so in the morning rather than going quiet.",
      why_agreed:
        "Because silence gets read as distance when it's really just a full calendar.",
    },
    {
      category: "boundaries",
      title: "Our arguments stay ours",
      description:
        "We don't take a live disagreement to friends or family before we've talked it through together.",
      why_agreed:
        "Because once other people hold a version of it, we're managing them instead of us.",
    },
    {
      category: "boundaries",
      title: "Phones down when we're actually together",
      description:
        "Meals and the last hour of the evening are screen-free unless something's genuinely on fire.",
      why_agreed:
        "Because being half-present feels worse than being away.",
    },
    {
      category: "fighting_fair",
      title: "No “always” and no “never”",
      description:
        "We talk about the specific thing that happened, not a pattern we're accusing the other of.",
      why_agreed:
        "Because absolutes turn a fixable moment into a character verdict.",
    },
    {
      category: "fighting_fair",
      title: "We don't go to bed mid-fight",
      description:
        "If it's late and we're stuck, we agree to pause and name a time tomorrow to finish it.",
      why_agreed:
        "Because unfinished nights ruin the next morning for both of us.",
    },
    {
      category: "fighting_fair",
      title: "Repair beats winning",
      description:
        "Once we both feel heard, we stop — we don't keep going for the last word.",
      why_agreed:
        "Because winning an argument against each other isn't winning anything.",
    },
  ],
} as const;

export const copy = en;
export type Copy = typeof en;
