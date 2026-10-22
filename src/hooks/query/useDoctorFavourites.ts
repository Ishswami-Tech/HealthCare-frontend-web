"use client";

/**
 * Per-account prescription shortcuts (API_CONTRACT section 14, DOCTOR and ASSISTANT_DOCTOR):
 * favourite medicines with their usual dose, kits, frequent diagnoses and favourite tests.
 * `useMedicineFavourites` also moves the old browser-only list (localStorage) to the server once.
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useMutationOperation } from "../core/useMutationOperation";
import { useQueryData } from "../core/useQueryData";
import { tbdKeys, TBD_CACHE } from "./tbdQueryKeys";
import { useCurrentClinicId } from "./useClinics";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";
import type { Medicine } from "@/types/pharmacy.types";
import { medicineTitle } from "@/components/doctor/rx/rx-form.logic";
import {
  kitFromFavourite,
  kitToFavourite,
  LEGACY_FAVOURITES_KEY,
  LEGACY_RECENT_KEY,
  presetOf,
  readLegacyIds,
  toFavourites,
  type DoctorFavourite,
  type FavouriteInput,
  type FavouriteKind,
  type RxKit,
} from "@/components/doctor/rx/rx-shortcuts.logic";
import type { MedicationPreset } from "@/components/doctor/rx/rx-form.logic";

/** Invalidation prefix (every clinic); reads are keyed clinic first: ["rx-favourites", clinicId, kind]. */
const FAVOURITES_ROOT = tbdKeys.rxAuthoring.favouritesAll();
const favouritesKey = (clinicId: string, kind: FavouriteKind) => [...tbdKeys.rxAuthoring.favourites(clinicId), kind] as const;

export function useDoctorFavourites(kind: FavouriteKind, options?: { enabled?: boolean }) {
  const clinicId = useCurrentClinicId();
  return useQueryData<DoctorFavourite[]>(
    favouritesKey(clinicId, kind),
    async () => {
      const response = await clinicApiClient.get<unknown>(API_ENDPOINTS.DOCTOR_FAVOURITES.LIST, { kind });
      return toFavourites(response.data);
    },
    { enabled: options?.enabled ?? true, ...TBD_CACHE.settings },
  );
}

/** Add or update one favourite (idempotent on kind + itemKey). Quiet: stars and chips toggle without a toast. */
export function useSaveFavourite(options?: { successMessage?: string }) {
  return useMutationOperation(
    async (input: FavouriteInput) => (await clinicApiClient.put<unknown>(API_ENDPOINTS.DOCTOR_FAVOURITES.UPSERT, input)).data,
    {
      toastId: "doctor-favourite-save",
      loadingMessage: "Saving...",
      successMessage: options?.successMessage ?? "Saved",
      showToast: Boolean(options?.successMessage),
      showLoading: Boolean(options?.successMessage),
      invalidateQueries: [[...FAVOURITES_ROOT]],
    },
  );
}

export function useRemoveFavourite(options?: { successMessage?: string }) {
  return useMutationOperation(
    async (id: string) => (await clinicApiClient.delete<unknown>(API_ENDPOINTS.DOCTOR_FAVOURITES.DELETE(id))).data,
    {
      toastId: "doctor-favourite-remove",
      loadingMessage: "Removing...",
      successMessage: options?.successMessage ?? "Removed",
      showToast: Boolean(options?.successMessage),
      showLoading: Boolean(options?.successMessage),
      invalidateQueries: [[...FAVOURITES_ROOT]],
    },
  );
}

/** Adds or updates several favourites in one request (PUT /bulk); returns the full list. */
export function useSaveFavouritesBulk(messages: { loading: string; success: string; toastId: string }) {
  return useMutationOperation(
    async (items: FavouriteInput[]) =>
      toFavourites((await clinicApiClient.put<unknown>(API_ENDPOINTS.DOCTOR_FAVOURITES.BULK, { items })).data),
    {
      toastId: messages.toastId,
      loadingMessage: messages.loading,
      successMessage: messages.success,
      invalidateQueries: [[...FAVOURITES_ROOT]],
    },
  );
}

const IMPORT_MESSAGES = {
  toastId: "doctor-favourite-import",
  loading: "Moving your favourites to your account...",
  success: "Your favourite medicines now follow you on every device",
};

function readLegacy(key: string): string[] {
  try {
    return readLegacyIds(window.localStorage.getItem(key));
  } catch {
    return [];
  }
}

function clearLegacy(): void {
  try {
    window.localStorage.removeItem(LEGACY_FAVOURITES_KEY);
    window.localStorage.removeItem(LEGACY_RECENT_KEY);
  } catch {
    // Blocked storage: nothing to clear.
  }
}

/**
 * Favourite medicines of the signed-in doctor (or assistant): ids, the usual dose of each, and a
 * star toggle. On first use it imports the list this browser kept before (one PUT /bulk), then
 * removes it from the browser so the server is the only copy.
 */
export function useMedicineFavourites(medicines: readonly Medicine[], options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const query = useDoctorFavourites("MEDICINE", { enabled });
  const save = useSaveFavourite();
  const remove = useRemoveFavourite();
  const importer = useSaveFavouritesBulk(IMPORT_MESSAGES);
  const imported = useRef(false);

  const favourites = useMemo(() => query.data ?? [], [query.data]);
  const byKey = useMemo(() => new Map(favourites.map((favourite) => [favourite.itemKey, favourite])), [favourites]);
  const ids = useMemo(() => new Set(byKey.keys()), [byKey]);

  const importMutate = importer.mutate;
  useEffect(() => {
    if (!enabled || imported.current || !query.isFetched || query.error || medicines.length === 0) return;
    imported.current = true;
    const legacy = readLegacy(LEGACY_FAVOURITES_KEY).filter((id) => !byKey.has(id));
    if (legacy.length === 0) {
      clearLegacy();
      return;
    }
    const known = new Map(medicines.map((medicine) => [medicine.id, medicine]));
    const items: FavouriteInput[] = legacy.slice(0, 200).map((id, index) => {
      const medicine = known.get(id);
      return { kind: "MEDICINE", itemKey: id, label: medicine ? medicineTitle(medicine) : "Medicine", sortOrder: index };
    });
    importMutate(items, { onSuccess: clearLegacy });
  }, [byKey, enabled, importMutate, medicines, query.error, query.isFetched]);

  const saveMutate = save.mutate;
  const removeMutate = remove.mutate;
  const toggle = useCallback(
    (medicine: Medicine) => {
      const existing = byKey.get(medicine.id);
      if (existing) removeMutate(existing.id);
      else saveMutate({ kind: "MEDICINE", itemKey: medicine.id, label: medicineTitle(medicine) });
    },
    [byKey, removeMutate, saveMutate],
  );

  const setPreset = useCallback(
    (medicine: Pick<Medicine, "id" | "name" | "strength">, preset: MedicationPreset) =>
      save.mutateAsync({ kind: "MEDICINE", itemKey: medicine.id, label: medicineTitle(medicine), payload: { ...preset } }),
    [save],
  );

  const presetFor = useCallback((medicineId: string): MedicationPreset => {
    const favourite = byKey.get(medicineId);
    return favourite ? presetOf(favourite) : {};
  }, [byKey]);

  return {
    favourites,
    ids,
    toggle,
    /** Removes a favourite by its row id (also for a medicine no longer in the stock list). */
    remove: removeMutate,
    setPreset,
    presetFor,
    isLoading: enabled && query.isPending,
    error: query.error,
    isSaving: save.isPending || remove.isPending,
  };
}

/** Kits (several medicines added at once) of the signed-in doctor. */
export function useRxKits(options?: { enabled?: boolean }) {
  const query = useDoctorFavourites("RX_TEMPLATE", options);
  const save = useSaveFavourite({ successMessage: "Kit saved" });
  const remove = useRemoveFavourite({ successMessage: "Kit deleted" });
  const kits = useMemo(() => (query.data ?? []).map(kitFromFavourite), [query.data]);
  return {
    kits,
    isLoading: (options?.enabled ?? true) && query.isPending,
    error: query.error,
    saveKit: (kit: RxKit, sortOrder?: number) => save.mutateAsync(kitToFavourite(kit, sortOrder)),
    deleteKit: (kit: RxKit) => remove.mutateAsync(kit.id),
    isSaving: save.isPending || remove.isPending,
  };
}
