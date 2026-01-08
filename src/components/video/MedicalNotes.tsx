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
import { useAuth } from "@/hooks/useAuth";
import { useVideoAppointmentWebSocket } from "@/hooks/useVideoAppointmentSocketIO";
import {
  createMedicalNote,
  getMedicalNotes,
  deleteMedicalNote,
  type MedicalNote,
} from "@/lib/actions/video-enhanced.server";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface MedicalNotesProps {
  appointmentId: string;
  className?: string;
}

export function MedicalNotes({ appointmentId, className }: MedicalNotesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<MedicalNote[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Load notes
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const result = await getMedicalNotes(appointmentId);
        if (result && result.notes) {
          setNotes(result.notes);
        }
      } catch (error) {
        console.error("Failed to load medical notes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [appointmentId]);

  // Subscribe to real-time note updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToMedicalNotes((data) => {
      if (data.appointmentId === appointmentId) {
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
      }
    });

    return unsubscribe;
  }, [isConnected, appointmentId, subscribeToMedicalNotes]);

  const handleCreateNote = async () => {
    if (!newNote.content.trim()) return;

    try {
      const result = await createMedicalNote(appointmentId, {
        content: newNote.content,
        noteType: newNote.noteType,
        title: newNote.title,
      });
      if (result) {
        setNewNote({ content: "", noteType: "GENERAL", title: "" });
        setIsCreating(false);
        toast({
          title: "Note Created",
          description: "Medical note has been saved",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create note",
        variant: "destructive",
      });
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    try {
      const editingNote = notes.find((n) => n.id === noteId);
      if (!editingNote) return;

      // Backend doesn't support update, show error message
      setEditingId(null);
      toast({
        title: "Update Not Supported",
        description: "Please delete and create a new note to update.",
        variant: "destructive",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const result = await deleteMedicalNote(appointmentId, noteId);
      if (result && result.success) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        toast({
          title: "Note Deleted",
          description: "Medical note has been deleted",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Medical Notes</CardTitle>
          {!isCreating && (
            <Button
              size="sm"
              onClick={() => setIsCreating(true)}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[400px]">
        <ScrollArea className="flex-1 px-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Loading notes...</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Create Note Form */}
              {isCreating && (
                <Card className="border-primary">
                  <CardContent className="pt-4 space-y-3">
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
                      <SelectTrigger>
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
                      rows={4}
                    />

                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCreateNote}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
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
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notes yet</p>
                </div>
              ) : (
                notes.map((note) => (
                  <Card key={note.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
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
                          <span className="text-xs text-muted-foreground">
                            {note.user?.name || "Unknown"} •{" "}
                            {format(new Date(note.createdAt), "MMM dd, HH:mm")}
                          </span>
                        </div>
                        {note.userId === user?.id && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingId(note.id)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {editingId === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            defaultValue={note.content}
                            rows={3}
                            ref={(el) => {
                              if (el) {
                                el.focus();
                                el.setSelectionRange(
                                  el.value.length,
                                  el.value.length
                                );
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                setEditingId(null);
                              } else if (
                                e.key === "Enter" &&
                                (e.metaKey || e.ctrlKey)
                              ) {
                                handleUpdateNote(note.id);
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateNote(note.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {note.content}
                        </p>
                      )}

                      {note.title && (
                        <p className="text-xs font-medium text-muted-foreground mb-1">
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
