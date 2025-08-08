import { useTranslations } from 'next-intl';

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

// Hook to get translated sidebar label
export function useTranslatedSidebarLabel(originalLabel: string): string {
  const t = useTranslations();
  
  // Get the translation key from the mapping
  const translationKey = SIDEBAR_LABEL_MAP[originalLabel];
  
  if (translationKey) {
    try {
      return t(translationKey);
    } catch (error) {
      console.warn(`Translation not found for key: ${translationKey}`);
      return originalLabel;
    }
  }
  
  // If no mapping found, return original label
  return originalLabel;
}

// Function to translate a sidebar link
export function translateSidebarLink(link: any, t: any) {
  const translationKey = SIDEBAR_LABEL_MAP[link.label];
  
  return {
    ...link,
    label: translationKey ? t(translationKey) : link.label,
  };
}

// Function to translate an array of sidebar links
export function translateSidebarLinks(links: any[], t: any) {
  return links.map(link => translateSidebarLink(link, t));
}
