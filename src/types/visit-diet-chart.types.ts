/**
 * Visit diet chart (Take / Avoid / Occasional) and the diet-chart food master.
 * Mirrors HealthCareBackend `src/libs/dtos/visit-diet-chart.dto.ts`.
 *
 * Item labels are snapshots copied from the food master (or typed as free
 * text) when the chart is saved; the four name columns travel with the item.
 */

export type DietAdviceCategory = "TAKE" | "AVOID" | "OCCASIONAL";

export type DietChartLanguage = "en" | "gu" | "hi" | "mr";

/** The four label columns shared by food-master rows and chart items. */
export interface DietFoodLabels {
  nameEn: string;
  nameGu: string | null;
  nameHi: string | null;
  nameMr: string | null;
}

export interface VisitDietChartItem extends DietFoodLabels {
  id: string;
  visitId: string;
  category: DietAdviceCategory;
  foodId: string | null;
  note: string | null;
  sortOrder: number;
  recordedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VisitDietChart {
  visitId: string;
  printLanguage: DietChartLanguage;
  notes: string | null;
  items: VisitDietChartItem[];
  /** null until the chart has been saved once */
  updatedAt: string | null;
}

export interface DietChartItemInput {
  category: DietAdviceCategory;
  foodId?: string;
  nameEn: string;
  nameGu?: string;
  nameHi?: string;
  nameMr?: string;
  note?: string;
  sortOrder?: number;
}

export interface UpsertVisitDietChartInput {
  printLanguage?: DietChartLanguage;
  notes?: string;
  /** Full replacement list (max 200) */
  items: DietChartItemInput[];
}

export interface DietChartFood extends DietFoodLabels {
  id: string;
  /** null = system seed row (read-only), otherwise the owning clinic */
  clinicId: string | null;
  key: string;
  group: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DietChartFoodSearchParams {
  q?: string;
  group?: string;
  limit?: number;
}

export interface CreateDietChartFoodInput {
  key?: string;
  nameEn: string;
  nameGu?: string;
  nameHi?: string;
  nameMr?: string;
  group?: string;
}

export type UpdateDietChartFoodInput = Partial<CreateDietChartFoodInput> & {
  isActive?: boolean;
};
