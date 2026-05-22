import type { TherapyType } from '@/types/therapy.types';

export function getTherapyDuration(type: TherapyType): string {
  const durations: Record<TherapyType, string> = {
    GENERAL_CONSULTATION: "therapies.durations.consultation",
    NADI_PARIKSHA: "therapies.durations.nadiPariksha",
    AGNIKARMA: "therapies.durations.agnikarma",
    VIDDHAKARMA: "therapies.durations.viddhakarma",
    PANCHAKARMA: "therapies.durations.panchakarma",
    SHIRODHARA: "therapies.durations.shirodhara",
    ABHYANGA: "therapies.durations.abhyanga",
    SWEDANA: "therapies.durations.swedana",
    VIRECHANA: "therapies.durations.virechana",
    BASTI: "therapies.durations.basti",
  };

  return durations[type] || "therapies.durations.default";
}

export function getTherapyCategory(type: TherapyType): string {
  const categories: Record<TherapyType, string> = {
    GENERAL_CONSULTATION: "therapies.categories.diagnosis",
    NADI_PARIKSHA: "therapies.categories.diagnosis",
    AGNIKARMA: "therapies.categories.surgical",
    VIDDHAKARMA: "therapies.categories.surgical",
    PANCHAKARMA: "therapies.categories.detox",
    SHIRODHARA: "therapies.categories.relaxation",
    ABHYANGA: "therapies.categories.massage",
    SWEDANA: "therapies.categories.steam",
    VIRECHANA: "therapies.categories.detox",
    BASTI: "therapies.categories.detox",
  };

  return categories[type] || "therapies.categories.general";
}
