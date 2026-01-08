/**
 * ✅ Consolidated Utilities
 * All utility functions in one place for better organization
 */

import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTranslations } from 'next-intl';

// ============================================================================
// CLASSNAME UTILITIES
// ============================================================================

/**
 * Merge Tailwind CSS classes with clsx
 * Used throughout the application for conditional styling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// DEBOUNCE & THROTTLE
// ============================================================================

/**
 * Generic debounce utility
 * Delays function execution until after wait time has passed
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ============================================================================
// SIDEBAR TRANSLATIONS
// ============================================================================

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: SidebarLink[];
}

type TranslationFunction = (key: string) => string;

// Mapping of route labels to translation keys
export const SIDEBAR_LABEL_MAP: Record<string, string> = {
  // Common labels
  'Dashboard': 'sidebar.dashboard',
  'Appointments': 'sidebar.appointments',
  'Patients': 'sidebar.patients',
  'Doctors': 'sidebar.doctors',
  'Prescriptions': 'sidebar.prescriptions',
  'Pharmacy': 'sidebar.pharmacy',
  'Reports': 'sidebar.reports',
  'Analytics': 'sidebar.analytics',
  'Settings': 'sidebar.settings',
  'Profile': 'sidebar.profile',
  'Logout': 'sidebar.logout',
  
  // Specific labels
  'Manage Clinics': 'sidebar.clinics',
  'User Management': 'sidebar.staff',
  'System Settings': 'sidebar.settings',
  'Queue Management': 'sidebar.queue',
  'Electronic Health Records': 'sidebar.ehr',
  'Medical Records': 'sidebar.ehr',
  'Billing': 'sidebar.billing',
  'Inventory': 'sidebar.inventory',
  'Staff Management': 'sidebar.staff',
  'Clinics': 'sidebar.clinics',
  'Users': 'sidebar.staff',
  
  // Patient specific
  'My Appointments': 'sidebar.appointments',
  'My Prescriptions': 'sidebar.prescriptions',
  'My Profile': 'sidebar.profile',
  
  // Doctor specific
  'My Patients': 'sidebar.patients',
  'Patient Management': 'sidebar.patients',
  
  // Admin specific
  'Staff': 'sidebar.staff',
  'Clinic Management': 'sidebar.clinics',
};

/**
 * Hook to get translated sidebar label
 * 
 * ⚠️ Note: This is a hook and must be used in a React component
 * For non-component usage, use translateSidebarLink or translateSidebarLinks instead
 */
export function useTranslatedSidebarLabel(originalLabel: string): string {
  const t = useTranslations();
  
  const translationKey = SIDEBAR_LABEL_MAP[originalLabel];
  
  if (translationKey) {
    try {
      return t(translationKey);
    } catch {
      // Use logger instead of console.warn in production
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Translation not found for key: ${translationKey}`);
      }
      return originalLabel;
    }
  }
  
  return originalLabel;
}

/**
 * Function to translate a sidebar link
 */
export function translateSidebarLink(link: SidebarLink, t: TranslationFunction): SidebarLink {
  const translationKey = SIDEBAR_LABEL_MAP[link.label];
  
  return {
    ...link,
    label: translationKey ? t(translationKey) : link.label,
  };
}

/**
 * Function to translate an array of sidebar links
 */
export function translateSidebarLinks(links: SidebarLink[], t: TranslationFunction): SidebarLink[] {
  return links.map(link => translateSidebarLink(link, t));
}

// ============================================================================
// RE-EXPORTS FROM UTILS FOLDER
// ============================================================================

export * from './fetch-with-abort';
export * from './token-manager';
export * from './appointmentUtils';

