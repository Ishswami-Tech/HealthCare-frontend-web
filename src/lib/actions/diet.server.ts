'use server';

import { authenticatedApi, getServerSession } from './auth.server';
import { API_ENDPOINTS } from '../config/config';
import { revalidatePath } from 'next/cache';

// ===== DIET PLANS =====

export async function getDietPlans(patientId?: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const url = patientId
      ? `${API_ENDPOINTS.DIET.PLANS.LIST}?patientId=${encodeURIComponent(patientId)}`
      : API_ENDPOINTS.DIET.PLANS.LIST;
    const { data } = await authenticatedApi(url);
    return data;
  } catch {
    return [];
  }
}

export async function getDietPlan(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.DIET.PLANS.GET_BY_ID(id));
    return data;
  } catch {
    return null;
  }
}

export async function generateDietPlan(payload: {
  patientId: string;
  goal: string;
  durationDays: number;
  dietaryRestrictions?: string[];
  preferences?: string[];
  caloricTarget?: number;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.DIET.PLANS.GENERATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/diet');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate diet plan' };
  }
}

export async function updateDietPlan(id: string, payload: Record<string, unknown>) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.DIET.PLANS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/diet');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

// ===== FOOD CATALOG =====

export async function getFoodCatalog() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.DIET.FOODS.LIST);
    return data;
  } catch {
    return [];
  }
}

export async function searchFoodCatalog(query: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.DIET.FOODS.SEARCH(query));
    return data;
  } catch {
    return [];
  }
}

export async function createFoodItem(payload: {
  name: string;
  category: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  ayurvedicProperties?: Record<string, string>;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.DIET.FOODS.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    revalidatePath('/dashboard/diet');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}

// ===== FOOD COMPATIBILITY =====

export async function checkFoodCompatibility(payload: {
  foodIds: string[];
  patientConditions?: string[];
  prakritiType?: string;
}) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const { data } = await authenticatedApi(API_ENDPOINTS.DIET.COMPATIBILITY_CHECK, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed' };
  }
}
