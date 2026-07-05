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

export const privacySections = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly to us, such as when you create or modify your account, request appointments, contact support, or otherwise communicate with us. This may include name, email, verified phone number, address, date of birth, gender, medical history information you choose to provide, appointment details, billing records, and payment status.",
  },
  {
    title: "2. How We Use Your Information",
    body: "We use the information we collect to provide, maintain, and improve our services, including facilitating medical appointments and consultations, sending important notices and security alerts, responding to support requests, and monitoring usage and service trends.",
    bullets: [
      "Facilitate medical appointments and consultations.",
      "Send technically important notices, updates, security alerts, and support messages.",
      "Respond to comments, questions, and requests.",
      "Monitor and analyze trends, usage, and activities in connection with our services.",
    ],
  },
  {
    title: "3. Data Security",
    body: "We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. Sensitive health and billing data is handled using appropriate security controls.",
  },
  {
    title: "4. Your Rights",
    body: "You have the right to access, update, or delete your personal information by logging into your account or contacting support. You may also request a copy of your medical data in a portable format where applicable.",
  },
  {
    title: "5. Appointment and Billing Notices",
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
