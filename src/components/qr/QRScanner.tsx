import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Camera, Zap, ZapOff, SwitchCamera, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
  autoStart?: boolean;
}

export function QRScanner({
  onScanSuccess,
  onScanFailure,
  autoStart = false,
}: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "qr-video-region";
  const autoStarted = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
        setIsFlashOn(false);
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  }, []);

  const startScanner = useCallback(async (cameraId?: string | { facingMode: string }) => {
    setIsInitializing(true);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(regionId);
      }

      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }

      const scanConfig = {
        fps: 25,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.75);
          return { width: size, height:size };
        },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await scannerRef.current.start(
        cameraId || { facingMode: "environment" },
        scanConfig,
        (decodedText) => {
          stopScanner();
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          if (onScanFailure) onScanFailure(errorMessage);
        }
      );

      setTimeout(() => {
        try {
          if (scannerRef.current) {
            const capabilities = (scannerRef.current as any).getRunningTrackCapabilities();
            setHasFlash(!!capabilities?.torch);
          }
        } catch (e) {
          console.warn("Failed to check flash capabilities", e);
        }
      }, 500);
      
      setIsScanning(true);
    } catch (err) {
      console.error("Failed to start scanner", err);
      toast.error("Camera access denied or error occurred");
    } finally {
      setIsInitializing(false);
    }
  }, [onScanSuccess, onScanFailure, stopScanner]);

  const toggleFlash = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        const newState = !isFlashOn;
        await (scannerRef.current as any).applyVideoConstraints({
          advanced: [{ torch: newState }]
        });
        setIsFlashOn(newState);
      } catch (err) {
        console.error("Failed to toggle flash", err);
      }
    }
  };

  const switchCamera = async () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    if (nextCamera) {
      setSelectedCameraId(nextCamera.id);
      await startScanner(nextCamera.id);
    }
  };

  useEffect(() => {
    const detectCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          const mappedDevices = devices.map(d => ({ id: d.id, label: d.label }));
          setCameras(mappedDevices);
          const backCamera = mappedDevices.find(d => {
            const label = d.label?.toLowerCase() || "";
            return label.includes("back") || label.includes("environment") || label.includes("rear");
          });
          const firstDevice = mappedDevices[0];
          if (firstDevice) {
            const defaultCameraId = backCamera ? backCamera.id : firstDevice.id;
            setSelectedCameraId(defaultCameraId);
            
            if (autoStart && !autoStarted.current) {
               autoStarted.current = true;
               startScanner(defaultCameraId);
            }
          }
        }
      } catch (err) {
        console.error("Error getting cameras", err);
      }
    };
    detectCameras();
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [autoStart, startScanner]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <div 
        className="relative aspect-4/5 w-full max-w-[340px] md:max-w-[400px] rounded-4xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden isolate"
      >
        {/* Actual Video Area */}
        <div 
          id={regionId} 
          className="absolute inset-0 z-0 [&>video]:object-cover [&>video]:w-full [&>video]:h-full bg-black" 
        />

        <AnimatePresence mode="wait">
          {!isScanning && !isInitializing && (
            <motion.div 
              key="camera-request"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 z-20 p-6 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Camera className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Enable Camera</h3>
              <p className="text-zinc-500 text-sm mb-8 max-w-[200px] mx-auto">
                Scan the clinic QR code to verify your check-in.
              </p>
              <Button 
                onClick={() => startScanner(selectedCameraId || undefined)} 
                className="rounded-xl px-8 h-12 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all active:scale-95"
              >
                Start Scanner
              </Button>
            </motion.div>
          )}

          {isInitializing && (
            <motion.div 
              key="initializing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md z-30 transition-colors"
            >
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Initializing...</p>
            </motion.div>
          )}

          {isScanning && (
            <motion.div 
              key="scanning-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none z-10"
            >
              {/* Dimmed Area */}
              <div className="absolute inset-0 bg-black/30" style={{ 
                clipPath: 'polygon(0% 0%, 0% 100%, 15% 100%, 15% 15%, 85% 15%, 85% 85%, 15% 85%, 15% 100%, 100% 100%, 100% 0%)' 
              }} />
              
              {/* Sleek Corners */}
              <div className="absolute top-[18%] left-[18%] w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute top-[18%] right-[18%] w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute bottom-[18%] left-[18%] w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute bottom-[18%] right-[18%] w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />

              {/* Minimal Laser */}
              <motion.div 
                initial={{ top: '18%' }}
                animate={{ top: '82%' }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                className="absolute left-[20%] right-[20%] h-px bg-primary/50 z-20"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD Controls */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 inset-x-0 flex justify-center items-center gap-4 z-40"
            >
              {hasFlash && (
                <Button 
                  size="icon" 
                  variant="secondary"
                  className={cn(
                    "rounded-xl size-12 bg-black/40 backdrop-blur-md border border-white/10 text-white transition-all",
                    isFlashOn && "bg-white text-black border-white"
                  )}
                  onClick={(e) => { e.stopPropagation(); toggleFlash(); }}
                >
                  {isFlashOn ? <Zap className="size-5 fill-current" /> : <ZapOff className="size-5" />}
                </Button>
              )}
              <Button 
                variant="destructive" 
                className="rounded-xl px-6 h-12 font-bold shadow-lg"
                onClick={(e) => { e.stopPropagation(); stopScanner(); }}
              >
                Close
              </Button>
              {cameras.length > 1 && (
                <Button 
                  size="icon" 
                  variant="secondary"
                  className="rounded-xl size-12 bg-black/40 backdrop-blur-md border border-white/10 text-white"
                  onClick={(e) => { e.stopPropagation(); switchCamera(); }}
                >
                  <SwitchCamera className="size-5" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-1 text-center mt-2 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className={cn("size-2 rounded-full", isScanning ? "bg-green-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-700")} />
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            {isScanning ? "Scanner Active" : "Scanner Ready"}
          </p>
        </div>
        <p className="text-[11px] text-zinc-400 max-w-[240px]">
          Position the QR code within the frame for automatic detection.
        </p>
      </div>
    </div>
  );
}
