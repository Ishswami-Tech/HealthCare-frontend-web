import { API_ENDPOINTS, APP_CONFIG } from "@/lib/config/config";
import { fetchWithAbort } from "@/lib/utils/fetch-with-abort";

export async function submitContactForm(data: {
  name: string;
  email: string;
  phone: string;
  condition?: string;
  message: string;
  type?: "contact" | "consultation";
}) {
  const API_URL = APP_CONFIG.API.BASE_URL;
  const CLINIC_ID = APP_CONFIG.CLINIC.ID;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (CLINIC_ID) {
    headers["X-Clinic-ID"] = CLINIC_ID;
  }

  const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.COMMUNICATION.SEND}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "email",
      title: `Contact Form Submission - ${data.type === "consultation" ? "Consultation Request" : "General Inquiry"}`,
      message: `
        Name: ${data.name}
        Email: ${data.email}
        Phone: ${data.phone}
        ${data.condition ? `Health Condition: ${data.condition}` : ""}
        
        Message:
        ${data.message}
      `,
      category: data.type === "consultation" ? "consultation_request" : "contact_form",
      priority: "normal",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit form: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || result;
}

export async function submitConsultationBooking(data: {
  name: string;
  phone: string;
  preferredDate?: string;
  preferredTime?: string;
  reason?: string;
}) {
  const API_URL = APP_CONFIG.API.BASE_URL;
  const CLINIC_ID = APP_CONFIG.CLINIC.ID;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (CLINIC_ID) {
    headers["X-Clinic-ID"] = CLINIC_ID;
  }

  const response = await fetchWithAbort(`${API_URL}${API_ENDPOINTS.COMMUNICATION.SEND}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "email",
      title: "Consultation Booking Request",
      message: `
        Name: ${data.name}
        Phone: ${data.phone}
        ${data.preferredDate ? `Preferred Date: ${data.preferredDate}` : ""}
        ${data.preferredTime ? `Preferred Time: ${data.preferredTime}` : ""}
        ${data.reason ? `Reason: ${data.reason}` : ""}
      `,
      category: "consultation_booking",
      priority: "high",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit booking: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data || result;
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
