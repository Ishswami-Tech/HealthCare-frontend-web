import {
  healthcareProvider,
  paymentCollectionDisclosure,
  paymentPartner,
  patientDataDisclosure,
  videoAppointmentNoRefundDisclosure,
} from "@/lib/legal/payment-disclosure";

export const legalBrand = {
  displayName: "Dr Chandrakumar Deshmukh",
  platformName: "Viddhakarma",
  domain: "viddhakarma.com",
} as const;

export const legalDates = {
  updated: "February 2026",
} as const;

export const termsSections = [
  {
    title: "1. Acceptance of Terms",
    body: `By creating an account or using any part of the ${legalBrand.displayName} platform, you acknowledge that you have read, understood, and agree to be bound by these terms. If you do not agree, you may not use the services.`,
  },
  {
    title: "2. No Medical Advice",
    body: `The content provided through ${legalBrand.displayName} is for informational purposes only and is not intended to replace professional medical advice, diagnosis, or treatment. Always seek advice from a qualified healthcare professional for medical concerns.`,
  },
  {
    title: "3. User Responsibilities",
    body: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration and keep it updated.",
  },
  {
    title: "4. Video Appointments and Payments",
    body: `${paymentCollectionDisclosure} ${videoAppointmentNoRefundDisclosure} In-person appointment fees are governed by the clinic's refund and cancellation policy.`,
    bullets: [
      "Payment confirms the selected video or in-person appointment slot for the scheduled time.",
      "Missed appointments are not carried forward automatically.",
      "Any rebooking is subject to live clinic availability.",
      `Payment and refund support can be coordinated by ${paymentPartner.name}; healthcare service questions are handled by ${healthcareProvider.name}.`,
    ],
  },
  {
    title: "5. Limitation of Liability",
    body: `To the maximum extent permitted by law, ${legalBrand.displayName} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenues, data, use, goodwill, or other intangible losses.`,
  },
] as const;

/**
 * Placeholders the owner must fill before publishing. Shown verbatim on the
 * page so a missing decision is visible instead of silently invented.
 */
export const legalPlaceholders = {
  grievanceOfficerName: "[Grievance Officer name - to be confirmed by the owner]",
  grievanceOfficerContact:
    "[Grievance Officer email / postal address - to be confirmed by the owner]",
  deactivatedAccountPurgePeriod: "[period - to be decided by the owner]",
  clinicalRecordRetentionPeriod:
    "[period required by applicable medical-records rules - to be confirmed by the owner/legal]",
  billingRecordRetentionPeriod:
    "[period required by tax/accounting law - to be confirmed by the owner/legal]",
  logRetentionPeriod: "[period - to be decided by the owner]",
} as const;

/*
 * DRAFT - FOR OWNER / LEGAL REVIEW BEFORE PUBLISHING (REL-03).
 * The data categories and processors below describe what the web portal and the
 * mobile app actually collect and which third-party services the code uses
 * (Firebase, Daily.co, Cashfree, PhonePe, Razorpay/Zoho where a clinic enables
 * them, Sentry when a DSN is configured, email/WhatsApp delivery providers).
 * Retention periods, the grievance officer and the rights wording are drafts or
 * placeholders (legalPlaceholders) and must be confirmed by the owner/legal
 * counsel under India's Digital Personal Data Protection Act, 2023 (DPDP Act).
 */
export const privacySections = [
  {
    title: "1. Information We Collect",
    body: "We collect the information you give us when you create or update your account, book or attend appointments, upload documents, pay, or contact support, plus a limited set of device data needed to run the service.",
    bullets: [
      "Account and profile: name, verified phone number and/or email, date of birth, gender, address, city/state, and family members you add.",
      "Health information you or your clinic record: medical history, symptoms, case sheets, prescriptions, reports and documents you upload, and appointment and visit details.",
      "Billing: invoices, payment status, refund records and transaction references. Card, UPI and bank details are entered in the payment provider's own checkout; the app and website never see or store card numbers.",
      "Location: only when you check in for an in-clinic appointment, your device location is read once to confirm you are at the clinic. Location is not tracked in the background.",
      "Camera: used to scan the clinic's check-in QR code, and to take photos of documents you choose to upload.",
      "Camera and microphone: used during video consultations, only while a call is active and after you grant permission.",
      "Device identifiers: a push-notification token and Firebase installation ID, stored against your account so we can send appointment and queue notifications.",
      "Crash and diagnostic data: error reports and basic performance data (device model, OS and app version, the error) used to fix problems. These reports are configured to leave out health details.",
      "Support and messages: messages you send to the clinic or support team.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: "We use your information only to provide and secure the clinic service you asked for.",
    bullets: [
      "Book, manage and remind you about appointments, queues and video consultations.",
      "Let your doctor and authorised clinic staff see the records they need to treat you.",
      "Process payments, invoices and refunds.",
      "Send service messages (OTP, booking confirmations, reminders, security alerts) by SMS, WhatsApp, email or push notification.",
      "Detect fraud and abuse, keep the service secure, and fix errors.",
    ],
  },
  {
    title: "3. Service Providers We Share Data With",
    body: "We do not sell your personal data and do not use it for advertising. Each provider receives only the data it needs to perform its service for us:",
    bullets: [
      "Google Firebase: push notifications (device token, installation ID).",
      "Daily.co: real-time audio and video for video consultations (your display name and the call media while the call is live).",
      "Cashfree Payments and PhonePe, and Razorpay or Zoho Payments where your clinic has enabled them: payment processing (amount, order reference, and the name and phone/email needed for the transaction).",
      "Sentry: crash and error diagnostics, when enabled.",
      "Email, SMS and WhatsApp delivery providers configured for the clinic: delivery of OTPs and service messages.",
      "Cloud hosting and storage providers that run our servers, database and uploaded files.",
      "Government or law-enforcement authorities, where disclosure is required by law.",
    ],
  },
  {
    title: "4. Data Retention",
    body: "We keep personal data only as long as needed for the purposes above or as required by law.",
    bullets: [
      "Active accounts: for as long as the account is in use.",
      `Deactivated accounts: sign-in is disabled immediately; remaining eligible account data is deleted or anonymised after ${legalPlaceholders.deactivatedAccountPurgePeriod}.`,
      `Clinical records (case sheets, prescriptions, reports): ${legalPlaceholders.clinicalRecordRetentionPeriod}.`,
      `Invoices and payment records: ${legalPlaceholders.billingRecordRetentionPeriod}.`,
      `Security and diagnostic logs: ${legalPlaceholders.logRetentionPeriod}.`,
    ],
  },
  {
    title: "5. Data Security",
    body: "Data is encrypted in transit (HTTPS/TLS), access to health records is limited to your treating doctor and authorised clinic staff, and sign-in sessions can be revoked. No method of storage or transmission is completely secure, but we take reasonable measures to protect your information.",
  },
  {
    title: "6. Your Rights",
    body: "Subject to the Digital Personal Data Protection Act, 2023 and other applicable law, you may:",
    bullets: [
      "Ask for a summary of the personal data we hold about you and how it is processed.",
      "Correct or update inaccurate or incomplete data (most profile fields can be edited in the app or website).",
      "Withdraw consent and ask for erasure of your data, including by deactivating your account (see the Data Deletion page). Records we must keep by law are retained for the required period.",
      "Nominate another person to exercise these rights on your behalf in case of death or incapacity.",
      "Raise a grievance with our Grievance Officer and, if it is not resolved, with the Data Protection Board of India.",
      "Turn off location, camera, microphone or notification permissions at any time in your device settings; the related feature will then not work.",
    ],
  },
  {
    title: "7. Grievance Officer",
    body: `${legalPlaceholders.grievanceOfficerName}. Contact: ${legalPlaceholders.grievanceOfficerContact}.`,
  },
  {
    title: "8. Appointment and Billing Notices",
    body: `${patientDataDisclosure} ${paymentCollectionDisclosure} Payment processors receive only the information required to create, process, verify, refund, or reconcile the transaction.`,
  },
] as const;

export const refundSections = [
  {
    title: "1. Video appointments",
    body: "Video appointment payments are non-refundable once payment is completed because the selected doctor slot is reserved for the patient. Missed video appointments require a fresh booking unless the clinic separately approves rescheduling.",
  },
  {
    title: "2. In-person appointments",
    body: "In-person appointment cancellation, rescheduling, and refund eligibility depend on the clinic's live availability, service type, and the timing of the cancellation request.",
  },
  {
    title: "3. Approved refunds",
    body: "If a refund is approved by the clinic or platform support team, it will be initiated to the original payment method where possible. Bank, UPI, card, and gateway settlement timelines may take several business days after initiation.",
  },
  {
    title: "4. Gateway charges",
    body: "Payment gateway, bank, or platform processing charges may be non-refundable where they have already been charged by the payment processor or bank.",
  },
] as const;

export const shippingSections = [
  {
    title: "1. No physical shipping",
    body: "The platform provides clinic booking, video consultation, in-person appointment, billing, and patient support services. No physical goods are shipped for standard appointment bookings or video consultations.",
  },
  {
    title: "2. Digital delivery",
    body: "Appointment confirmations, video consultation access, invoices, receipts, and payment status updates are delivered through the website, app, SMS, WhatsApp, email, or other configured communication channels.",
  },
  {
    title: "3. Healthcare service delivery",
    body: "Video consultations are delivered online at the scheduled time. In-person appointments are delivered at the clinic location and time selected during booking, subject to clinic availability and operational conditions.",
  },
  {
    title: "4. Delivery timelines",
    body: "Booking confirmations are normally generated after successful appointment creation and payment confirmation. Payment gateway, network, or clinic-system delays may occasionally affect confirmation timing.",
  },
] as const;

export const disclaimerSections = [
  {
    title: "1. Medical Information Disclaimer",
    body: `The content provided on ${legalBrand.displayName}, including text, graphics, images, and other material, is for informational purposes only. It is not intended to substitute for professional medical advice, diagnosis, or treatment.`,
  },
  {
    title: "2. No Emergency Services",
    body: `${legalBrand.displayName} is not intended for use in medical emergencies. If you are experiencing a medical emergency, call your local emergency services immediately.`,
  },
  {
    title: "3. Accuracy of Information",
    body: `While we strive to provide accurate and up-to-date information, medical knowledge is constantly evolving. ${legalBrand.displayName} makes no representations or warranties, express or implied, about the completeness, accuracy, reliability, or suitability of the information contained on the platform.`,
  },
  {
    title: "4. Limitation of Liability",
    body: `In no event will ${legalBrand.displayName}, its directors, employees, or partners be liable for any loss or damage including indirect or consequential loss or damage, or any loss or damage arising from loss of data or profits arising out of, or in connection with, the use of this platform.`,
  },
] as const;

export const legalContacts = {
  healthcare: healthcareProvider.email,
  payment: paymentPartner.email,
} as const;
