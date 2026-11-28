"use client";

import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/core/useDebouncedValue";
import { useMedicines, useMedicinesPage } from "@/hooks/query/usePharmacy";
import { toMedicineList } from "./rx-form.logic";

/** The server is asked for matches once this many characters are typed. */
const SERVER_SEARCH_MIN_LENGTH = 2;
const SERVER_SEARCH_LIMIT = 50;
const SERVER_SEARCH_DEBOUNCE_MS = 300;

/**
 * The medicines a prescriber picks from: the clinic's stock list (favourites, recent and kits are
 * looked up in it) plus the server's matches for the typed name, so a medicine beyond the loaded
 * rows is still found. No prices are read or shown.
 */
export function usePrescriptionCatalogue(clinicId: string) {
  const { data, isPending, error } = useMedicines(clinicId || "", { limit: 200 });
  const [searchText, setSearchText] = useState("");
  const debouncedSearch = useDebouncedValue(searchText.trim(), SERVER_SEARCH_DEBOUNCE_MS);
  const serverSearch = debouncedSearch.length >= SERVER_SEARCH_MIN_LENGTH ? debouncedSearch : "";
  const searchQuery = useMedicinesPage(
    clinicId || "",
    { search: serverSearch, page: 1, limit: SERVER_SEARCH_LIMIT },
    { enabled: Boolean(clinicId && serverSearch) },
  );

  const medicines = useMemo(() => {
    const loaded = toMedicineList(data);
    const found = serverSearch ? toMedicineList(searchQuery.data?.data) : [];
    if (found.length === 0) return loaded;
    const known = new Set(loaded.map((medicine) => medicine.id));
    return [...loaded, ...found.filter((medicine) => !known.has(medicine.id))];
  }, [data, searchQuery.data, serverSearch]);

  const stockMessage = !clinicId
    ? "No clinic is selected, so the pharmacy stock cannot be shown."
    : error
      ? "The pharmacy stock could not be loaded: you may not have access to this clinic's pharmacy. Close this and try again."
      : null;

  return {
    medicines,
    isLoading: Boolean(clinicId) && isPending,
    stockMessage,
    setSearchText,
    isSearching: Boolean(serverSearch) && searchQuery.isFetching,
  };
}
