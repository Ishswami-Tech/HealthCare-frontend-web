const CONTACT_RECIPIENT = "info@viddhakarma.com";

function openMailDraft(subject: string, body: string) {
  if (typeof window === "undefined") {
    throw new Error("Contact actions are only available in the browser.");
  }

  const url = `mailto:${encodeURIComponent(CONTACT_RECIPIENT)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
  return { success: true, recipient: CONTACT_RECIPIENT, url };
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  phone: string;
  condition?: string;
  message: string;
  type?: "contact" | "consultation";
}) {
  const subject = `Contact Form Submission - ${data.type === "consultation" ? "Consultation Request" : "General Inquiry"}`;
  const body = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    data.condition ? `Health Condition: ${data.condition}` : null,
    "",
    "Message:",
    data.message,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return openMailDraft(subject, body);
}

export async function submitConsultationBooking(data: {
  name: string;
  phone: string;
  preferredDate?: string;
  preferredTime?: string;
  reason?: string;
}) {
  const subject = "Consultation Booking Request";
  const body = [
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    data.preferredDate ? `Preferred Date: ${data.preferredDate}` : null,
    data.preferredTime ? `Preferred Time: ${data.preferredTime}` : null,
    data.reason ? `Reason: ${data.reason}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  return openMailDraft(subject, body);
}

export async function scheduleMessage(_messageData: {
  type: "sms" | "email" | "whatsapp";
  to: string | string[];
  content: string;
  subject?: string;
  scheduledFor: string;
  templateId?: string;
  variables?: Record<string, string>;
}) {
  return null;
}

export async function cancelScheduledMessage(_messageId: string) {
  return null;
}

export async function getScheduledMessages(_filters?: {
  type?: "sms" | "email" | "whatsapp";
  status?: "pending" | "sent" | "cancelled";
}) {
  return null;
}
