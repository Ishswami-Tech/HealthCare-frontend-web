/** Values `POST /pharmacy/inventory` accepts for the medicine type (dosage form), A to Z with Other last. */
export const DOSAGE_FORMS = [
  { value: "ARISHTA", label: "Arishta" },
  { value: "ASAVA", label: "Asava" },
  { value: "AVALEHA", label: "Avaleha" },
  { value: "BHASMA", label: "Bhasma" },
  { value: "CAPSULE", label: "Capsule" },
  { value: "CHURNA", label: "Churna" },
  { value: "CREAM", label: "Cream" },
  { value: "DRINK", label: "Drink" },
  { value: "DROPS", label: "Drops" },
  { value: "GEL", label: "Gel" },
  { value: "GHRITA", label: "Ghrita" },
  { value: "GRANULE", label: "Granule" },
  { value: "GUTIKA", label: "Gutika" },
  { value: "INJECTION", label: "Injection" },
  { value: "KASHAYAM", label: "Kashayam" },
  { value: "LEPA", label: "Lepa" },
  { value: "LOTION", label: "Lotion" },
  { value: "OIL", label: "Oil" },
  { value: "OINTMENT", label: "Ointment" },
  { value: "PARPATI", label: "Parpati" },
  { value: "PISHTEE", label: "Pishtee" },
  { value: "SHAMPOO", label: "Shampoo" },
  { value: "SOAP", label: "Soap" },
  { value: "SWARASA", label: "Swarasa" },
  { value: "SYRUP", label: "Syrup" },
  { value: "TABLET", label: "Tablet" },
  { value: "TOOTHPASTE", label: "Toothpaste" },
  { value: "VATI", label: "Vati" },
  { value: "YAVKUT_KWATH", label: "Yavkut Kwath" },
  { value: "OTHER", label: "Other" },
] as const;

export type DosageFormValue = (typeof DOSAGE_FORMS)[number]["value"];

/**
 * The `type` value `POST /pharmacy/inventory` accepts for a dosage form (backend `MedicineType`).
 * Returns `null` for a value that is not one of the forms, so the caller can say so instead of
 * silently filing the medicine under OTHER.
 */
export function parseDosageForm(value: unknown): DosageFormValue | null {
  const upper = String(value ?? "").trim().toUpperCase().replace(/\s+/g, "_");
  return DOSAGE_FORMS.find((form) => form.value === upper)?.value ?? null;
}
