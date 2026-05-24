import { useEffect, useRef, useReducer, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { showErrorToast } from "@/hooks/utils/use-toast";
import { Camera, Zap, ZapOff, SwitchCamera, Loader2 } from "lucide-react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
  autoStart?: boolean;
}

type QRScannerState = {
  isScanning: boolean;
  isInitializing: boolean;
  cameras: { id: string; label: string }[];
  isFlashOn: boolean;
  hasFlash: boolean;
};

type QRScannerAction =
  | { type: "setIsScanning"; value: boolean }
  | { type: "setIsInitializing"; value: boolean }
  | { type: "setCameras"; value: { id: string; label: string }[] }
  | { type: "setIsFlashOn"; value: boolean }
  | { type: "setHasFlash"; value: boolean };

const initialState: QRScannerState = {
  isScanning: false,
  isInitializing: false,
  cameras: [],
  isFlashOn: false,
  hasFlash: false,
};

function qrScannerReducer(state: QRScannerState, action: QRScannerAction): QRScannerState {
  switch (action.type) {
    case "setIsScanning":
      return { ...state, isScanning: action.value };
    case "setIsInitializing":
      return { ...state, isInitializing: action.value };
    case "setCameras":
      return { ...state, cameras: action.value };
    case "setIsFlashOn":
      return { ...state, isFlashOn: action.value };
    case "setHasFlash":
      return { ...state, hasFlash: action.value };
    default:
      return state;
  }
}

export function QRScanner({
  onScanSuccess,
  onScanFailure,
  autoStart = false,
}: QRScannerProps) {
  const [state, dispatch] = useReducer(qrScannerReducer, initialState);
  const { isScanning, isInitializing, cameras, isFlashOn, hasFlash } = state;

  const setIsScanning = useCallback((value: boolean) => {
    dispatch({ type: "setIsScanning", value });
  }, []);
  const setIsInitializing = useCallback((value: boolean) => {
    dispatch({ type: "setIsInitializing", value });
  }, []);
  const setCameras = useCallback((value: { id: string; label: string }[]) => {
    dispatch({ type: "setCameras", value });
  }, []);
  const setIsFlashOn = useCallback((value: boolean) => {
    dispatch({ type: "setIsFlashOn", value });
  }, []);
  const setHasFlash = useCallback((value: boolean) => {
    dispatch({ type: "setHasFlash", value });
  }, []);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const selectedCameraIdRef = useRef<string | null>(null);
  const regionId = "qr-video-region";
  const autoStarted = useRef(false);
  const flashCheckTimeoutRef = useRef<number | null>(null);

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
    if (flashCheckTimeoutRef.current !== null) {
      window.clearTimeout(flashCheckTimeoutRef.current);
      flashCheckTimeoutRef.current = null;
    }
  }, [setIsFlashOn, setIsScanning]);

  const startScanner = useCallback(
    async (cameraId?: string | { facingMode: string }) => {
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
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
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

        if (flashCheckTimeoutRef.current !== null) {
          window.clearTimeout(flashCheckTimeoutRef.current);
        }

        flashCheckTimeoutRef.current = window.setTimeout(() => {
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
        showErrorToast("Camera access denied or error occurred");
      } finally {
        setIsInitializing(false);
      }
    },
    [onScanFailure, onScanSuccess, setHasFlash, setIsInitializing, setIsScanning, stopScanner]
  );

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
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraIdRef.current);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    if (nextCamera) {
      selectedCameraIdRef.current = nextCamera.id;
      await startScanner(nextCamera.id);
    }
  };

  useEffect(() => {
    const scanner = scannerRef.current;
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
            selectedCameraIdRef.current = defaultCameraId;

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
    const timeoutRef = flashCheckTimeoutRef;
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [autoStart, setCameras, startScanner]);

  return (
    <LazyMotion features={domAnimation}>
      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
        <div className="relative aspect-4/5 w-full max-w-[340px] md:max-w-[400px] rounded-4xl shadow-sm border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden isolate">
          {/* Actual Video Area */}
          <div
            id={regionId}
            className="absolute inset-0 z-0 bg-gray-950"
            style={{
              height: "100%",
              width: "100%",
              overflow: "hidden"
            }}
          />

          <AnimatePresence mode="wait">
            {!isScanning && !isInitializing && (
              <m.div
                key="camera-request"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 z-20 p-6 text-center"
              >
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Camera className="size-8" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Enable Camera</h3>
                <p className="text-zinc-500 text-sm mb-8 max-w-[200px] mx-auto">
                  Scan the clinic QR code to verify your check-in.
                </p>
                <Button
                  onClick={() => startScanner(selectedCameraIdRef.current || undefined)}
                  className="rounded-xl px-8 h-12 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all active:scale-95"
                >
                  Start Scanner
                </Button>
              </m.div>
            )}

            {isInitializing && (
              <m.div
                key="initializing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-md z-30 transition-colors"
              >
                <Loader2 className="size-10 text-primary animate-spin mb-4" />
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Initializing…</p>
              </m.div>
            )}

            {isScanning && (
              <m.div
                key="scanning-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none z-10"
              >
                {/* Dimmed Area */}
                <div
                  className="absolute inset-0 bg-black/40"
                  style={{
                    clipPath: "polygon(0% 0%, 0% 100%, 15% 100%, 15% 15%, 85% 15%, 85% 85%, 15% 85%, 15% 100%, 100% 100%, 100% 0%)"
                  }}
                />

                {/* Sleek Corners */}
                <div className="absolute top-[15%] left-[15%] size-8 border-t-[3px] border-l-[3px] border-primary rounded-tl-lg" />
                <div className="absolute top-[15%] right-[15%] size-8 border-t-[3px] border-r-[3px] border-primary rounded-tr-lg" />
                <div className="absolute bottom-[15%] left-[15%] size-8 border-b-[3px] border-l-[3px] border-primary rounded-bl-lg" />
                <div className="absolute bottom-[15%] right-[15%] size-8 border-b-[3px] border-r-[3px] border-primary rounded-br-lg" />

                {/* Minimal Laser */}
                <m.div
                  initial={{ top: "15%" }}
                  animate={{ top: "85%" }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                  className="absolute left-[20%] right-[20%] h-px bg-primary/50 z-20"
                />
              </m.div>
            )}
          </AnimatePresence>

          {/* HUD Controls */}
          <AnimatePresence>
            {isScanning && (
              <m.div
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
              </m.div>
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
    </LazyMotion>
  );
}
