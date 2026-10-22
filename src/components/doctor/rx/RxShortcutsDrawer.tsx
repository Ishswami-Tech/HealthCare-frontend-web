"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Layers, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, SearchBox, SectionTitle, SideDrawer, SideDrawerActions, SideDrawerBody } from "@/components/tbd";
import type { useMedicineFavourites, useRxKits } from "@/hooks/query/useDoctorFavourites";
import type { Medicine } from "@/types/pharmacy.types";
import {
  DEFAULT_DAYS,
  DEFAULT_FREQUENCY,
  frequencyOptionsFor,
  matchScore,
  medicineTitle,
  searchTerms,
  type MedicationPreset,
} from "./rx-form.logic";
import { presetOf, type DoctorFavourite, type RxKit, type RxKitItem } from "./rx-shortcuts.logic";

function presetSummary(preset: MedicationPreset): string {
  return [preset.dosage, preset.frequency || DEFAULT_FREQUENCY, `${preset.days || DEFAULT_DAYS} days`].filter(Boolean).join(" · ");
}

/** Dose, how often and days of one medicine (a favourite's usual dose, or a kit line). */
function PresetFields({ value, onChange }: { value: MedicationPreset; onChange: (value: MedicationPreset) => void }) {
  const id = useId();
  const frequency = value.frequency || DEFAULT_FREQUENCY;
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1.6fr_0.7fr]">
      <Field label="Dose" htmlFor={`${id}-dose`}>
        <Input id={`${id}-dose`} placeholder="e.g. 1 tablet" value={value.dosage ?? ""} onChange={(event) => onChange({ ...value, dosage: event.target.value })} />
      </Field>
      <Field label="How often" htmlFor={`${id}-frequency`}>
        <Select value={frequency} onValueChange={(next) => onChange({ ...value, frequency: next })}>
          <SelectTrigger id={`${id}-frequency`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {frequencyOptionsFor(frequency).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Days" htmlFor={`${id}-days`}>
        <Input
          id={`${id}-days`}
          type="number"
          min={1}
          inputMode="numeric"
          value={value.days ?? DEFAULT_DAYS}
          onChange={(event) => onChange({ ...value, days: event.target.value })}
        />
      </Field>
    </div>
  );
}

function FavouriteRow({
  favourite,
  medicine,
  onSave,
  onRemove,
  busy,
}: {
  favourite: DoctorFavourite;
  medicine: Medicine | undefined;
  onSave: (preset: MedicationPreset) => Promise<unknown>;
  onRemove: () => void;
  busy: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MedicationPreset>(() => presetOf(favourite));
  const name = medicine ? medicineTitle(medicine) : favourite.label;
  return (
    <li className="flex flex-col gap-2 border-b border-hair py-2.5 last:border-b-0">
      <div className="flex items-center gap-2">
        <Star className="size-4 shrink-0 fill-amber-400 text-amber-500" aria-hidden="true" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-bold text-ink">{name}</span>
          <span className="text-xs text-ink-muted">{presetSummary(presetOf(favourite))}</span>
        </span>
        <Button type="button" size="sm" variant="ghost" aria-label={`Edit the usual dose of ${name}`} onClick={() => setEditing((open) => !open)}>
          <Pencil aria-hidden="true" />
          Edit
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy} aria-label={`Remove ${name} from favourites`} onClick={onRemove}>
          <X aria-hidden="true" />
        </Button>
      </div>
      {editing ? (
        <div className="flex flex-col gap-2 rounded-[12px] bg-well p-3">
          <PresetFields value={draft} onChange={setDraft} />
          <span className="text-xs text-ink-muted">Used whenever you add this medicine from search, a kit or by voice. You can still change it per patient.</span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => void onSave(draft).then(() => setEditing(false))}
            >
              Save dose
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

const emptyKit = (): RxKit => ({ id: "", itemKey: "", name: "", voicePhrase: "", items: [] });

function KitEditor({
  kit,
  medicines,
  busy,
  onSave,
  onDelete,
  onCancel,
}: {
  kit: RxKit;
  medicines: readonly Medicine[];
  busy: boolean;
  onSave: (kit: RxKit) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<RxKit>(kit);
  const [search, setSearch] = useState("");
  const results = useMemo(() => {
    const terms = searchTerms(search);
    if (terms.length === 0) return [];
    const chosen = new Set(draft.items.map((item) => item.medicineId));
    return medicines
      .filter((medicine) => !chosen.has(medicine.id))
      .map((medicine) => ({ medicine, score: matchScore(medicine, terms) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((entry) => entry.medicine);
  }, [draft.items, medicines, search]);

  const setItems = (items: RxKitItem[]) => setDraft((current) => ({ ...current, items }));
  const move = (index: number, step: number) => {
    const items = [...draft.items];
    const target = index + step;
    const item = items[index];
    const other = items[target];
    if (!item || !other) return;
    items[index] = other;
    items[target] = item;
    setItems(items);
  };

  const canSave = draft.name.trim() !== "" && draft.items.length > 0 && !busy;

  return (
    <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-card p-3.5">
      <Field label="Kit name" htmlFor={`${id}-name`} required>
        <Input id={`${id}-name`} maxLength={200} placeholder="Viral fever kit" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </Field>
      <Field label="Voice phrase" htmlFor={`${id}-phrase`} hint="Say this while speaking medicines and the whole kit is offered.">
        <Input
          id={`${id}-phrase`}
          maxLength={80}
          placeholder={draft.name ? draft.name.toLowerCase() : "viral fever kit"}
          value={draft.voicePhrase}
          onChange={(event) => setDraft({ ...draft, voicePhrase: event.target.value })}
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-ink-soft">Medicines in this kit · order is kept on the prescription</span>
        {draft.items.length === 0 ? <span className="text-xs text-ink-muted">Search a medicine below to add it.</span> : null}
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {draft.items.map((item, index) => (
            <li key={item.medicineId} className="flex flex-col gap-2 rounded-[12px] bg-well p-2.5">
              <div className="flex items-center gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d1fae5] text-xs font-extrabold text-[#065f46]">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{item.name}</span>
                <Button type="button" size="sm" variant="ghost" aria-label={`Move ${item.name} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button type="button" size="sm" variant="ghost" aria-label={`Move ${item.name} down`} disabled={index === draft.items.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDown aria-hidden="true" />
                </Button>
                <Button type="button" size="sm" variant="ghost" aria-label={`Remove ${item.name}`} onClick={() => setItems(draft.items.filter((_item, at) => at !== index))}>
                  <X aria-hidden="true" />
                </Button>
              </div>
              <PresetFields
                value={item}
                onChange={(preset) => setItems(draft.items.map((entry, at) => (at === index ? { ...entry, ...preset } : entry)))}
              />
            </li>
          ))}
        </ol>
        <SearchBox value={search} onChange={setSearch} placeholder="Search a medicine to add to this kit" />
        {results.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {results.map((medicine) => (
              <li key={medicine.id} className="flex items-center gap-2 rounded-[10px] border border-hair px-2.5 py-1.5">
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{medicineTitle(medicine)}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setItems([...draft.items, { medicineId: medicine.id, name: medicineTitle(medicine), frequency: DEFAULT_FREQUENCY, days: DEFAULT_DAYS }]);
                    setSearch("");
                  }}
                >
                  <Plus aria-hidden="true" />
                  Add
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={!canSave} onClick={() => onSave(draft)}>
          Save kit
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {onDelete ? (
          <Button type="button" size="sm" variant="ghost" className="ml-auto text-[#be123c]" disabled={busy} onClick={onDelete}>
            <Trash2 aria-hidden="true" />
            Delete kit
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Favourites & kits manager (DocRxFavourites): the usual dose of each favourite medicine and the
 * doctor's kits, all saved to their account on the server.
 */
export function RxShortcutsDrawer({
  open,
  onClose,
  medicines,
  favourites,
  kits,
}: {
  open: boolean;
  onClose: () => void;
  medicines: readonly Medicine[];
  favourites: ReturnType<typeof useMedicineFavourites>;
  kits: ReturnType<typeof useRxKits>;
}) {
  const [editingKit, setEditingKit] = useState<RxKit | null>(null);
  const medicinesById = useMemo(() => new Map(medicines.map((medicine) => [medicine.id, medicine])), [medicines]);

  return (
    <SideDrawer open={open} onClose={onClose} title="Favourites & kits" description="Saved to your account, on every device." width={600}>
      <SideDrawerBody>
        <section className="flex flex-col gap-2">
          <SectionTitle icon={Star} title="Favourite medicines" count={favourites.favourites.length} description="Star a medicine in the stock list to add it here." />
          {favourites.favourites.length === 0 ? (
            <span className="text-[13px] text-ink-muted">No favourite medicines yet.</span>
          ) : (
            <ul className="m-0 list-none p-0">
              {favourites.favourites.map((favourite) => {
                const medicine = medicinesById.get(favourite.itemKey);
                return (
                  <FavouriteRow
                    key={favourite.id}
                    favourite={favourite}
                    medicine={medicine}
                    busy={favourites.isSaving}
                    onSave={(preset) => favourites.setPreset(medicine ?? { id: favourite.itemKey, name: favourite.label, strength: "" }, preset)}
                    onRemove={() => favourites.remove(favourite.id)}
                  />
                );
              })}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-2.5">
          <SectionTitle
            icon={Layers}
            title="Kits"
            count={kits.kits.length}
            description="Several medicines with their doses, added in one tap."
            action={
              editingKit ? null : (
                <Button type="button" size="sm" onClick={() => setEditingKit(emptyKit())}>
                  <Plus aria-hidden="true" />
                  New kit
                </Button>
              )
            }
          />
          {editingKit && !editingKit.id ? (
            <KitEditor
              kit={editingKit}
              medicines={medicines}
              busy={kits.isSaving}
              onCancel={() => setEditingKit(null)}
              onSave={(kit) => void kits.saveKit(kit, kits.kits.length).then(() => setEditingKit(null))}
            />
          ) : null}
          {kits.kits.length === 0 && !editingKit ? <span className="text-[13px] text-ink-muted">No kits yet.</span> : null}
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {kits.kits.map((kit) =>
              editingKit?.id === kit.id ? (
                <li key={kit.id}>
                  <KitEditor
                    kit={kit}
                    medicines={medicines}
                    busy={kits.isSaving}
                    onCancel={() => setEditingKit(null)}
                    onSave={(next) => void kits.saveKit(next).then(() => setEditingKit(null))}
                    onDelete={() => void kits.deleteKit(kit).then(() => setEditingKit(null))}
                  />
                </li>
              ) : (
                <li key={kit.id} className="flex items-start gap-2 rounded-[12px] border border-hair px-3 py-2.5">
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm font-extrabold text-ink">
                      {kit.name} <span className="text-xs font-bold uppercase text-ink-muted">· {kit.items.length} medicines</span>
                    </span>
                    <span className="text-xs text-ink-muted">{kit.items.map((item) => item.name).join(", ")}</span>
                    <span className="text-[11px] text-ink-muted">{kit.voicePhrase ? `Say “${kit.voicePhrase}”` : "No voice phrase yet"}</span>
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingKit(kit)}>
                    <Pencil aria-hidden="true" />
                    Edit
                  </Button>
                </li>
              ),
            )}
          </ul>
        </section>
      </SideDrawerBody>
      <SideDrawerActions>
        <Button type="button" variant="outline" size="md" onClick={onClose}>
          Done
        </Button>
      </SideDrawerActions>
    </SideDrawer>
  );
}
