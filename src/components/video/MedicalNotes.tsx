"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/auth/useAuth";
import { useVideoAppointmentWebSocket } from "@/hooks/realtime/useVideoAppointmentSocketIO";
import {
  useCreateMedicalNote,
  useDeleteMedicalNote,
  useUpdateMedicalNote,
  useMedicalNotes,
  type MedicalNote,
} from "@/hooks/query";
import { showErrorToast, showInfoToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { format } from "date-fns";

interface MedicalNotesProps {
  appointmentId: string;
  className?: string;
  compact?: boolean;
}

const EMPTY_MEDICAL_NOTES: MedicalNote[] = [];

function notesSignature(notes: MedicalNote[]) {
  return notes
    .map((note) => `${note.id}:${note.updatedAt || note.createdAt}:${note.content}`)
    .join("|");
}

export function MedicalNotes({ appointmentId, className, compact = false }: MedicalNotesProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<MedicalNote[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState({ title: "", content: "" });
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({
    content: "",
    noteType: "GENERAL" as
      | "GENERAL"
      | "SYMPTOM"
      | "DIAGNOSIS"
      | "PRESCRIPTION"
      | "TREATMENT",
    title: "",
  });
  const { subscribeToMedicalNotes, isConnected } =
    useVideoAppointmentWebSocket();
  const { data: fetchedNotes, isPending: isLoading } = useMedicalNotes(appointmentId);
  const createMedicalNoteMutation = useCreateMedicalNote();
  const deleteMedicalNoteMutation = useDeleteMedicalNote();
  const updateMedicalNoteMutation = useUpdateMedicalNote();
  const isSaving = createMedicalNoteMutation.isPending;
  const isUpdating = updateMedicalNoteMutation.isPending;

  const resolvedNotes = fetchedNotes ?? EMPTY_MEDICAL_NOTES;
  const resolvedNotesKey = notesSignature(resolvedNotes);

  useEffect(() => {
    setNotes((prev) => (notesSignature(prev) === resolvedNotesKey ? prev : resolvedNotes));
  }, [resolvedNotes, resolvedNotesKey]);

  // Subscribe to real-time note updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToMedicalNotes((data) => {
      if (data.action === "note_created" || data.action === "note_updated") {
        const note = data.note as unknown as MedicalNote;
        setNotes((prev) => {
          const existing = prev.findIndex((n) => n.id === note.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = note;
            return updated;
          }
          return [...prev, note];
        });
      }
    });

    return unsubscribe;
  }, [isConnected, subscribeToMedicalNotes]);

  const handleCreateNote = async () => {
    if (!newNote.content.trim()) return;

    try {
      const result = await createMedicalNoteMutation.mutateAsync({
        appointmentId,
        data: {
          content: newNote.content,
          noteType: newNote.noteType,
          title: newNote.title,
        },
      });
      if (result) {
        setNewNote({ content: "", noteType: "GENERAL", title: "" });
        setIsCreating(false);
        showSuccessToast("Note created", {
          id: TOAST_IDS.GLOBAL.SUCCESS,
          description: "Medical note has been saved",
        });
      }
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.GLOBAL.ERROR });
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    try {
      const editingNote = notes.find((n) => n.id === noteId);
      if (!editingNote) return;

      const nextTitle = editingDraft.title.trim();
      const nextContent = editingDraft.content.trim();
      if (!nextContent) {
        showInfoToast("Note is empty", {
          id: TOAST_IDS.GLOBAL.INFO,
          description: "Please enter note content before saving.",
        });
        return;
      }

      const result = await updateMedicalNoteMutation.mutateAsync({
        noteId,
        data: {
          userId: user?.id || editingNote.userId,
          title: nextTitle,
          content: nextContent,
        },
      });

      if (result) {
        setNotes((prev) =>
          prev.map((note) => (note.id === noteId ? { ...note, ...result } : note))
        );
        setEditingId(null);
        setEditingDraft({ title: "", content: "" });
        showSuccessToast("Note updated", {
          id: TOAST_IDS.GLOBAL.SUCCESS,
          description: "Medical note has been updated",
        });
      }
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.GLOBAL.ERROR });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId);
    try {
      const result = await deleteMedicalNoteMutation.mutateAsync({
        appointmentId,
        noteId,
      });
      if (result && result.success) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        showSuccessToast("Note deleted", {
          id: TOAST_IDS.GLOBAL.SUCCESS,
          description: "Medical note has been deleted",
        });
      }
    } catch (error) {
      showErrorToast(error, { id: TOAST_IDS.GLOBAL.ERROR });
    } finally {
      setDeletingNoteId(null);
    }
  };

  const getTypeColor = (
    type: "general" | "symptom" | "diagnosis" | "prescription" | "treatment"
  ) => {
    const colors = {
      general: "default",
      symptom: "secondary",
      diagnosis: "destructive",
      prescription: "outline",
      treatment: "default",
    };
    return colors[type] || "default";
  };

  return (
    <Card className={className}>
      <CardHeader className={compact ? "pb-2 px-3 pt-3 bg-gradient-to-r from-white to-slate-50 dark:from-[#202124] dark:to-[#2b2c30]" : "pb-3 bg-gradient-to-r from-white to-slate-50 dark:from-[#202124] dark:to-[#2b2c30]"}>
        <div className="flex items-center justify-between">
          <CardTitle className={compact ? "text-sm" : "text-lg"}>Medical Notes</CardTitle>
          {!isCreating && (
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              variant="outline"
              className={compact ? "h-8 px-2.5 text-xs rounded-full border-blue-200 text-[#1a73e8] hover:bg-blue-500/10 dark:border-white/10 dark:text-[#8ab4f8]" : "rounded-full border-blue-200 text-[#1a73e8] hover:bg-blue-500/10 dark:border-white/10 dark:text-[#8ab4f8]"}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className={compact ? "p-0 flex flex-col h-[280px] sm:h-[320px]" : "p-0 flex flex-col h-[400px]"}>
        <ScrollArea className={compact ? "flex-1 px-3" : "flex-1 px-4"}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className={compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>Loading notes...</p>
            </div>
          ) : (
            <div className={compact ? "space-y-3 py-3" : "space-y-4 py-4"}>
              {/* Create Note Form */}
              {isCreating && (
                <Card className="border-blue-200 shadow-sm dark:border-white/10">
                  <CardContent className={compact ? "pt-3 space-y-2.5" : "pt-4 space-y-3"}>
                    <Input
                      placeholder="Note title (optional)..."
                      value={newNote.title}
                      onChange={(e) =>
                        setNewNote((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />

                    <Select
                      value={newNote.noteType}
                      onValueChange={(value) =>
                        setNewNote((prev) => ({
                          ...prev,
                          noteType: value as typeof newNote.noteType,
                        }))
                      }
                    >
                      <SelectTrigger className={compact ? "h-9 text-xs" : undefined}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">General</SelectItem>
                        <SelectItem value="SYMPTOM">Symptom</SelectItem>
                        <SelectItem value="DIAGNOSIS">Diagnosis</SelectItem>
                        <SelectItem value="PRESCRIPTION">
                          Prescription
                        </SelectItem>
                        <SelectItem value="TREATMENT">Treatment</SelectItem>
                      </SelectContent>
                    </Select>

                    <Textarea
                      placeholder="Enter medical note..."
                      value={newNote.content}
                      onChange={(e) =>
                        setNewNote((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      rows={compact ? 3 : 4}
                    />

                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCreateNote} disabled={isSaving} className={compact ? "h-8 px-2.5 text-xs rounded-full bg-[#1a73e8] text-white hover:bg-[#1558b0]" : "rounded-full bg-[#1a73e8] text-white hover:bg-[#1558b0]"}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSaving}
                        className={compact ? "h-8 px-2.5 text-xs rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/10" : "rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/10"}
                        onClick={() => {
                          setIsCreating(false);
                          setNewNote({
                            content: "",
                            noteType: "GENERAL",
                            title: "",
                          });
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes List */}
              {notes.length === 0 ? (
                <div className={compact ? "text-center py-5 text-muted-foreground" : "text-center py-8 text-muted-foreground"}>
                  <FileText className={compact ? "h-10 w-10 mx-auto mb-2 opacity-50" : "h-12 w-12 mx-auto mb-4 opacity-50"} />
                  <p>No notes yet</p>
                </div>
              ) : (
                notes.map((note) => (
                  <Card key={note.id} className="border-l-4 border-l-[#1a73e8] shadow-sm dark:border-l-[#8ab4f8]">
                    <CardContent className={compact ? "pt-3" : "pt-4"}>
                      <div className={compact ? "flex items-start justify-between mb-1.5 gap-2" : "flex items-start justify-between mb-2"}>
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge
                            variant={
                              getTypeColor(
                                note.noteType.toLowerCase() as
                                  | "general"
                                  | "symptom"
                                  | "diagnosis"
                                  | "prescription"
                                  | "treatment"
                              ) as
                                | "default"
                                | "secondary"
                                | "destructive"
                                | "outline"
                            }
                          >
                            {note.noteType}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">
                            {note.user?.name || "Unknown"} •{" "}
                            {format(new Date(note.createdAt), "MMM dd, HH:mm")}
                          </span>
                        </div>
                        {note.userId === user?.id && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-full hover:bg-blue-500/10 hover:text-[#1a73e8] dark:hover:bg-white/10 dark:hover:text-[#8ab4f8]"
                              onClick={() => {
                                setEditingId(note.id);
                                setEditingDraft({
                                  title: note.title || "",
                                  content: note.content,
                                });
                              }}
                              disabled={deletingNoteId === note.id}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-full hover:bg-red-500/10 hover:text-[#ea4335] dark:hover:bg-red-500/10 dark:hover:text-[#ff8a80]"
                              onClick={() => handleDeleteNote(note.id)}
                              disabled={deletingNoteId === note.id}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {editingId === note.id ? (
                        <div className="space-y-2">
                          <Input
                            value={editingDraft.title}
                            onChange={(e) =>
                              setEditingDraft((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                            placeholder="Note title (optional)..."
                          />
                          <Textarea
                            value={editingDraft.content}
                            onChange={(e) =>
                              setEditingDraft((prev) => ({
                                ...prev,
                                content: e.target.value,
                              }))
                            }
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => void handleUpdateNote(note.id)}
                              disabled={isUpdating}
                              className="rounded-full bg-[#1a73e8] text-white hover:bg-[#1558b0]"
                            >
                              {isUpdating ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                              onClick={() => {
                                setEditingId(null);
                                setEditingDraft({ title: "", content: "" });
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className={compact ? "text-xs sm:text-sm whitespace-pre-wrap" : "text-sm whitespace-pre-wrap"}>
                          {note.content}
                        </p>
                      )}

                      {note.title && (
                        <p className={compact ? "text-[10px] font-medium text-muted-foreground mb-1" : "text-xs font-medium text-muted-foreground mb-1"}>
                          {note.title}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
