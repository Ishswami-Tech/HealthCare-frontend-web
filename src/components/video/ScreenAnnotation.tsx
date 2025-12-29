"use client";

import React, { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pen,
  Type,
  ArrowRight,
  Highlighter,
  Square,
  Circle,
  Trash2,
  Save,
  X,
  Undo,
  Redo,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useVideoAppointmentWebSocket } from "@/hooks/useVideoAppointmentSocketIO";
import {
  createAnnotation,
  updateAnnotation,
  getAnnotations,
  deleteAnnotation,
  type Annotation,
} from "@/lib/actions/video-enhanced.server";
import { useToast } from "@/hooks/use-toast";

interface ScreenAnnotationProps {
  appointmentId: string;
  className?: string;
  onAnnotationChange?: (annotations: Annotation[]) => void;
}

type AnnotationTool = "drawing" | "text" | "arrow" | "highlight" | "shape";
type ShapeType = "rectangle" | "circle" | "line";

export function ScreenAnnotation({
  appointmentId,
  className,
  onAnnotationChange,
}: ScreenAnnotationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<AnnotationTool>("drawing");
  const [currentShape, setCurrentShape] = useState<ShapeType>("rectangle");
  const [currentColor, setCurrentColor] = useState("#3b82f6");
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [history, setHistory] = useState<Annotation[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const { subscribeToAnnotations, isConnected } = useVideoAppointmentWebSocket();

  // Load annotations
  useEffect(() => {
    const loadAnnotations = async () => {
      try {
        const result = await getAnnotations(appointmentId);
        if (result && result.annotations) {
          setAnnotations(result.annotations);
          drawAnnotations(result.annotations);
        }
      } catch (error) {
        console.error("Failed to load annotations:", error);
      }
    };

    loadAnnotations();
  }, [appointmentId]);

  // Subscribe to real-time annotation updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribeToAnnotations((data) => {
      if (data.appointmentId === appointmentId) {
        if (data.action === "annotation_created") {
          const annotation = data.annotation as unknown as Annotation;
          setAnnotations((prev) => [...prev, annotation]);
          drawAnnotation(annotation);
        } else if (data.action === "annotation_updated") {
          const annotation = data.annotation as unknown as Annotation;
          setAnnotations((prev) =>
            prev.map((a) => (a.id === annotation.id ? annotation : a))
          );
          redrawAll();
        } else if (data.action === "annotation_deleted") {
          const annotationId = data.annotationId as string;
          setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
          redrawAll();
        }
      }
    });

    return unsubscribe;
  }, [isConnected, appointmentId, subscribeToAnnotations]);

  // Notify parent of changes
  useEffect(() => {
    if (onAnnotationChange) {
      onAnnotationChange(annotations);
    }
  }, [annotations, onAnnotationChange]);

  const canvas = canvasRef.current;
  const ctx = canvas?.getContext("2d");

  const drawAnnotation = (annotation: Annotation) => {
    if (!ctx || !canvas) return;

    ctx.strokeStyle = annotation.data.color || currentColor;
    ctx.fillStyle = annotation.data.color || currentColor;
    ctx.lineWidth = 2;

    switch (annotation.type) {
      case "drawing":
        if (annotation.data.points && annotation.data.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(annotation.data.points[0].x, annotation.data.points[0].y);
          annotation.data.points.forEach((point) => {
            ctx.lineTo(point.x, point.y);
          });
          ctx.stroke();
        }
        break;
      case "text":
        if (annotation.data.text) {
          ctx.font = "16px Arial";
          ctx.fillText(
            annotation.data.text,
            annotation.data.x,
            annotation.data.y
          );
        }
        break;
      case "shape":
        if (annotation.data.shape === "rectangle" && annotation.data.width && annotation.data.height) {
          ctx.strokeRect(
            annotation.data.x,
            annotation.data.y,
            annotation.data.width,
            annotation.data.height
          );
        } else if (annotation.data.shape === "circle" && annotation.data.width) {
          ctx.beginPath();
          ctx.arc(
            annotation.data.x + annotation.data.width / 2,
            annotation.data.y + annotation.data.width / 2,
            annotation.data.width / 2,
            0,
            2 * Math.PI
          );
          ctx.stroke();
        } else if (annotation.data.shape === "line" && annotation.data.points) {
          ctx.beginPath();
          ctx.moveTo(annotation.data.points[0].x, annotation.data.points[0].y);
          ctx.lineTo(
            annotation.data.points[1]?.x || annotation.data.x,
            annotation.data.points[1]?.y || annotation.data.y
          );
          ctx.stroke();
        }
        break;
    }
  };

  const drawAnnotations = (anns: Annotation[]) => {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    anns.forEach(drawAnnotation);
  };

  const redrawAll = () => {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    annotations.forEach(drawAnnotation);
  };

  const saveToHistory = () => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), annotations]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setStartPoint({ x, y });
    setIsDrawing(true);

    if (currentTool === "text") {
      const text = prompt("Enter text:");
      if (text) {
        handleCreateAnnotation({
          type: "text",
          data: { x, y, text, color: currentColor },
        });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || !canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === "drawing") {
      // Draw preview
      redrawAll();
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === "drawing") {
      handleCreateAnnotation({
        type: "drawing",
        data: {
          x: startPoint.x,
          y: startPoint.y,
          points: [startPoint, { x, y }],
          color: currentColor,
        },
      });
    } else if (currentTool === "shape") {
      const width = Math.abs(x - startPoint.x);
      const height = Math.abs(y - startPoint.y);
      handleCreateAnnotation({
        type: "shape",
        data: {
          x: Math.min(startPoint.x, x),
          y: Math.min(startPoint.y, y),
          width,
          height,
          shape: currentShape,
          color: currentColor,
        },
      });
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  const handleCreateAnnotation = async (data: {
    type: AnnotationTool;
    data: Annotation["data"];
  }) => {
    try {
      const result = await createAnnotation(appointmentId, {
        annotationType: data.type.toUpperCase() as 'DRAWING' | 'TEXT' | 'ARROW' | 'HIGHLIGHT' | 'SHAPE',
        data: data.data as Record<string, unknown>,
        color: data.data.color,
        thickness: 2,
      });
      if (result) {
        saveToHistory();
        toast({
          title: "Annotation Created",
          description: "Annotation has been saved",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create annotation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      const result = await deleteAnnotation(appointmentId, annotationId);
      if (result && result.success) {
        saveToHistory();
        toast({
          title: "Annotation Deleted",
          description: "Annotation has been deleted",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete annotation",
        variant: "destructive",
      });
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setAnnotations(history[historyIndex - 1]);
      redrawAll();
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setAnnotations(history[historyIndex + 1]);
      redrawAll();
    }
  };

  const colors = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // yellow
    "#8b5cf6", // purple
    "#000000", // black
  ];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Screen Annotation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant={currentTool === "drawing" ? "default" : "outline"}
            onClick={() => setCurrentTool("drawing")}
          >
            <Pen className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === "text" ? "default" : "outline"}
            onClick={() => setCurrentTool("text")}
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === "shape" ? "default" : "outline"}
            onClick={() => setCurrentTool("shape")}
          >
            <Square className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === "highlight" ? "default" : "outline"}
            onClick={() => setCurrentTool("highlight")}
          >
            <Highlighter className="h-4 w-4" />
          </Button>

          {currentTool === "shape" && (
            <Select value={currentShape} onValueChange={(v) => setCurrentShape(v as ShapeType)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">Rectangle</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="line">Line</SelectItem>
              </SelectContent>
            </Select>
          )}

          <div className="flex gap-1">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded border-2 ${
                  currentColor === color ? "border-primary" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
          </div>

          <div className="flex gap-1 ml-auto">
            <Button size="sm" variant="outline" onClick={handleUndo} disabled={historyIndex <= 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="border rounded-lg relative bg-white">
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            className="w-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDrawing(false)}
          />
        </div>

        {/* Annotations List */}
        {annotations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Annotations ({annotations.length})</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className="flex items-center justify-between p-2 border rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{annotation.annotationType}</Badge>
                    <span className="text-muted-foreground">
                      {new Date(annotation.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {annotation.userId === user?.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteAnnotation(annotation.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

