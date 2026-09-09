'use server';

import { authenticatedApi, getServerSession } from './auth.server';
import { API_ENDPOINTS } from '../config/config';
import { revalidatePath } from 'next/cache';

// ===== PRAKRITI ASSESSMENT =====

export async function getPrakritiAssessments(patientId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(
      `${API_ENDPOINTS.AYURVEDA.PRAKRITI.ASSESSMENTS}?patientId=${encodeURIComponent(patientId)}`
    );
    return data;
  } catch (error: unknown) {
    console.error('Failed to fetch prakriti assessments:', error);
    return [];
  }
}

export async function createPrakritiAssessment(payload: {
  patientId: string;
  answers: Record<string, number>;
  notes?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.AYURVEDA.PRAKRITI.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/ayurveda');
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create assessment';
    return { success: false, error: message };
  }
}

export async function getPrakritiAssessment(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.AYURVEDA.PRAKRITI.GET_BY_ID(id));
    return data;
  } catch {
    return null;
  }
}

// ===== NADI PARIKSHA =====

export async function getNadiParikshaRecords(patientId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(
      `${API_ENDPOINTS.AYURVEDA.NADI.BASE}?patientId=${encodeURIComponent(patientId)}`
    );
    return data;
  } catch {
    return [];
  }
}

export async function createNadiPariksha(payload: {
  patientId: string;
  pulseReadings: Record<string, string>;
  doshaFindings: string[];
  interpretation: string;
  notes?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.AYURVEDA.NADI.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/ayurveda');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

// ===== AYURVEDIC DIAGNOSIS =====

export async function getAyurvedicDiagnoses(patientId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(
      `${API_ENDPOINTS.AYURVEDA.DIAGNOSIS.BASE}?patientId=${encodeURIComponent(patientId)}`
    );
    return data;
  } catch {
    return [];
  }
}

export async function createAyurvedicDiagnosis(payload: {
  patientId: string;
  diagnosisLabel: string;
  primaryDosha: string;
  secondaryDosha?: string;
  severity: string;
  description: string;
  recommendations: string[];
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.AYURVEDA.DIAGNOSIS.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/ayurveda');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

// ===== SAMPRAPTI (Disease Progression) =====

export async function createSampraptiStage(payload: {
  diagnosisId: string;
  stage: string;
  dosha: string;
  dhatu: string;
  mala: string;
  description: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.AYURVEDA.SAMPRAPTI.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

// ===== DOSHA IMBALANCE =====

export async function getDoshaImbalances(patientId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(
      `${API_ENDPOINTS.AYURVEDA.DOSHA.BASE}?patientId=${encodeURIComponent(patientId)}`
    );
    return data;
  } catch {
    return [];
  }
}

export async function recordDoshaImbalance(payload: {
  patientId: string;
  dominantDosha: string;
  imbalanceLevel: string;
  symptoms: string[];
  recommendations: string[];
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.AYURVEDA.DOSHA.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/ayurveda');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

// ===== AYURVEDA TIMELINE =====

export async function getAyurvedaTimeline(patientId: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(
      `${API_ENDPOINTS.AYURVEDA.TIMELINE}?patientId=${encodeURIComponent(patientId)}`
    );
    return data;
  } catch {
    return [];
  }
}

// ===== AYURVEDIC PRESCRIPTION =====

export async function createAyurvedicPrescription(payload: {
  patientId: string;
  diagnosisId: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  lifestyleRecommendations: string[];
  dietaryRecommendations: string[];
  followUpDate?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.AYURVEDA.PRESCRIPTION.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/ayurveda');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}
