"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CellTitle,
  EmptyBlock,
  FilterChips,
  GridHead,
  GridRow,
  InitialsAvatar,
  LoadError,
  Pager,
  SearchBox,
  serverPaging,
  SkeletonRows,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { usePatientDirectory } from "@/hooks/query/usePatientDirectory";
import { useDebouncedCallback } from "@/lib/utils/performance";
import { formatDateInIST } from "@/lib/utils/date-time";
import type { PatientDirectoryGender } from "@/types/patient-directory.types";
import { ageGenderLabel, readPatientContact } from "@/components/receptionist/reception.logic";
import { RECEPTION_ROUTES, useReceptionLocation } from "@/components/receptionist/useReceptionDesk";

const PAGE_SIZE = 50;
const COLUMNS = "minmax(0,1.6fr) minmax(0,1fr) minmax(0,0.8fr) minmax(0,1fr) auto";
type GenderFilter = "ALL" | PatientDirectoryGender;

/**
 * RecPatients: find a patient, register a new one, add a walk-in. Contact details only:
 * clinical records stay with the doctors.
 */
export default function ReceptionPatientsPage() {
  const { clinicId } = useReceptionLocation();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState<GenderFilter>("ALL");
  const [page, setPage] = useState(1);
  const applySearch = useDebouncedCallback((value: string) => {
    setSearch(value.trim());
    setPage(1);
  }, 300);

  const directory = usePatientDirectory(clinicId, {
    ...(search ? { search } : {}),
    ...(gender !== "ALL" ? { gender } : {}),
    sort: "lastVisit",
    order: "desc",
    page,
    pageSize: PAGE_SIZE,
  });
  const rows = directory.data?.rows ?? [];
  const paging = serverPaging({
    page,
    pageSize: PAGE_SIZE,
    total: directory.data?.total ?? 0,
    pageCount: directory.data?.totalPages ?? 1,
    rowCount: rows.length,
    onPageChange: setPage,
  });

  return (
    <TbdPage
      title="Patients"
      description="Find a patient, register a new one, or add a walk-in. Clinical records stay with the doctors."
      actions={
        <Button asChild size="md">
          <Link href={RECEPTION_ROUTES.register}>
            <UserPlus aria-hidden="true" /> Register patient
          </Link>
        </Button>
      }
    >
      <Surface flush as="section" aria-label="Patients" className="gap-0">
        <div className="flex flex-col gap-3 px-5 pb-3.5 pt-5 md:flex-row md:items-center">
          <SearchBox
            value={searchInput}
            onChange={(value) => {
              setSearchInput(value);
              applySearch(value);
            }}
            placeholder="Search by name, phone or patient ID"
            className="md:max-w-[420px]"
          />
          <FilterChips
            ariaLabel="Gender"
            value={gender}
            onChange={(value) => {
              setGender(value);
              setPage(1);
            }}
            options={[
              { value: "ALL", label: "All" },
              { value: "FEMALE", label: "Female" },
              { value: "MALE", label: "Male" },
              { value: "OTHER", label: "Other" },
            ]}
          />
        </div>

        {directory.isPending && !directory.data ? (
          <SkeletonRows rows={6} />
        ) : directory.error && rows.length === 0 ? (
          <LoadError
            title="Patients could not be loaded"
            message={directory.error instanceof Error ? directory.error.message : undefined}
            onRetry={() => void directory.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyBlock
            icon={Users}
            title={search ? "No patient matches" : "No patients yet"}
            description={search ? "Check the spelling or search by phone number." : "Registered patients show here."}
            action={
              <Button asChild size="md">
                <Link href={RECEPTION_ROUTES.register}>Register patient</Link>
              </Button>
            }
          />
        ) : (
          <div role="table" aria-label="Patients">
            <GridHead columns={COLUMNS} labels={["Patient", "Phone", "Age / sex", "Last visit", ""]} />
            {rows.map((row) => {
              const contact = readPatientContact(row, row.patientId);
              if (!contact) return null;
              return (
                <GridRow key={row.patientId} columns={COLUMNS}>
                  <CellTitle
                    left={<InitialsAvatar name={contact.name} size={36} />}
                    title={
                      <Link href={RECEPTION_ROUTES.patient(row.userId)} className="hover:text-brand-dark hover:underline">
                        {contact.name}
                      </Link>
                    }
                    description={row.uhid || `${row.totalVisits} visits`}
                  />
                  <span className="text-[13px] text-ink-soft">{contact.phone || "No phone"}</span>
                  <span className="text-[13px] text-ink-soft">{ageGenderLabel(contact)}</span>
                  <span className="text-[13px] text-ink-soft">
                    {row.lastVisit ? formatDateInIST(row.lastVisit) : "No visit yet"}
                  </span>
                  <span className="flex justify-end gap-2">
                    <Button asChild variant="outline" size="md">
                      <Link href={RECEPTION_ROUTES.walkIn(row.userId)}>Walk-in</Link>
                    </Button>
                    <Button asChild variant="ghost" size="md">
                      <Link href={RECEPTION_ROUTES.patient(row.userId)}>View</Link>
                    </Button>
                  </span>
                </GridRow>
              );
            })}
          </div>
        )}
        <Pager paging={paging} noun="patients" busy={directory.isFetching} />
      </Surface>
    </TbdPage>
  );
}
