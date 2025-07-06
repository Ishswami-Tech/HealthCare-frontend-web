'use server';

// User actions for frontend, matching backend endpoints
import { authenticatedApi } from './auth.server';

export async function getUserProfile() {
  const { data } = await authenticatedApi(`/user/profile`, { method: 'GET' });
  return data;
}

export async function updateUserProfile(profileData: Record<string, unknown>) {
  const { data } = await authenticatedApi(`/user/profile`, { method: 'PATCH', body: JSON.stringify(profileData) });
  return { status: 200, data: data };
}

export async function getUserById(id: string) {
  const { data } = await authenticatedApi(`/user/${id}`, { method: 'GET' });
  return data;
}

export async function updateUser(id: string, data: Record<string, unknown>) {
  const { data: updatedData } = await authenticatedApi(`/user/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  return updatedData;
}

export async function deleteUser(id: string) {
  const { data } = await authenticatedApi(`/user/${id}`, { method: 'DELETE' });
  return data;
}

export async function getAllUsers() {
  const { data } = await authenticatedApi(`/user/all`, { method: 'GET' });
  return data;
}

export async function getPatients() {
  const { data } = await authenticatedApi(`/user/role/patient`, { method: 'GET' });
  return data;
}

export async function getDoctors() {
  const { data } = await authenticatedApi(`/user/role/doctors`, { method: 'GET' });
  return data;
}

export async function getReceptionists() {
  const { data } = await authenticatedApi(`/user/role/receptionists`, { method: 'GET' });
  return data;
}

export async function getClinicAdmins() {
  const { data } = await authenticatedApi(`/user/role/clinic-admins`, { method: 'GET' });
  return data;
} 