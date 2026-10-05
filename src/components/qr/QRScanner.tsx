"use client";

import { useEffect, useRef, useReducer, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ScannerFrame, type ScannerStatus } from "./ScannerFrame";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: unknown) => void;
  autoStart?: boolean;
  /** Opens the "type the code" path. Offered when the camera is blocked or missing. */
  onEnterCode?: () => void;
  className?: string;
}

/** Why the camera cannot be used: the browser blocked it, or there is none to open. */
type CameraProblem = "denied" | "unavailable";

type QRScannerState = {
  isScanning: boolean;
  isInitializing: boolean;
  cameras: { id: string; label: string }[];
  isFlashOn: boolean;
  hasFlash: boolean;
  cameraProblem: CameraProblem | null;
};

type QRScannerAction =
  | { type: "setIsScanning"; value: boolean }
  | { type: "setIsInitializing"; value: boolean }
  | { type: "setCameras"; value: { id: string; label: string }[] }
  | { type: "setIsFlashOn"; value: boolean }
  | { type: "setHasFlash"; value: boolean }
  | { type: "setCameraProblem"; value: CameraProblem | null };

const initialState: QRScannerState = {
  isScanning: false,
  isInitializing: false,
  cameras: [],
  isFlashOn: false,
  hasFlash: false,
  cameraProblem: null,
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
    case "setCameraProblem":
      return { ...state, cameraProblem: action.value };
    default:
      return state;
  }
}

/** A blocked permission reads "NotAllowedError" / "Permission denied"; anything else is "no usable camera". */
function classifyCameraError(error: unknown): CameraProblem {
  const name =
    typeof error === "object" && error !== null && "name" in error ? String((error as { name?: unknown }).name) : "";
  const message = typeof error === "string" ? error : error instanceof Error ? error.message : String(error ?? "");
  return /NotAllowedError|PermissionDeniedError|SecurityError|permission/i.test(`${name} ${message}`)
    ? "denied"
    : "unavailable";
}

type TorchCapabilities = MediaTrackCapabilities & { torch?: boolean };
type TorchConstraint = MediaTrackConstraintSet & { torch?: boolean };

export function QRScanner({
  onScanSuccess,
  onScanFailure,
  autoStart = false,
  onEnterCode,
  className,
}: QRScannerProps) {
  const [state, dispatch] = useReducer(qrScannerReducer, initialState);
  const { isScanning, isInitializing, cameras, isFlashOn, hasFlash, cameraProblem } = state;

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
  const setCameraProblem = useCallback((value: CameraProblem | null) => {
    dispatch({ type: "setCameraProblem", value });
  }, []);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const selectedCameraIdRef = useRef<string | null>(null);
  const regionId = "qr-video-region";
  const autoStarted = useRef(false);
  const flashCheckTimeoutRef = useRef<number | null>(null);

  // The latest callbacks, so a re-render of the page never restarts (or stops) the camera.
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanFailureRef = useRef(onScanFailure);
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onScanFailureRef.current = onScanFailure;
  }, [onScanSuccess, onScanFailure]);

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
      setCameraProblem(null);
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
            onScanSuccessRef.current(decodedText);
          },
          (errorMessage) => {
            onScanFailureRef.current?.(errorMessage);
          }
        );

        if (flashCheckTimeoutRef.current !== null) {
          window.clearTimeout(flashCheckTimeoutRef.current);
        }

        flashCheckTimeoutRef.current = window.setTimeout(() => {
          try {
            if (scannerRef.current) {
              const capabilities = scannerRef.current.getRunningTrackCapabilities() as TorchCapabilities;
              setHasFlash(!!capabilities?.torch);
            }
          } catch (e) {
            console.warn("Failed to check flash capabilities", e);
          }
        }, 500);

        setIsScanning(true);
      } catch (err) {
        console.error("Failed to start scanner", err);
        // Shown in the panel itself, with the way to type the code instead.
        setCameraProblem(classifyCameraError(err));
      } finally {
        setIsInitializing(false);
      }
    },
    [setCameraProblem, setHasFlash, setIsInitializing, setIsScanning, stopScanner]
  );

  const toggleFlash = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        const newState = !isFlashOn;
        const torch: TorchConstraint = { torch: newState };
        await scannerRef.current.applyVideoConstraints({ advanced: [torch] });
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

  /** Finds the cameras (this is where the browser asks for permission) and picks the back one. */
  const detectCameras = useCallback(async (): Promise<string | null> => {
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
          setCameraProblem(null);
          return defaultCameraId;
        }
      }
      setCameraProblem("unavailable");
    } catch (err) {
      console.error("Error getting cameras", err);
      setCameraProblem(classifyCameraError(err));
    }
    return null;
  }, [setCameraProblem, setCameras]);

  /** "Start camera" and "Try again": look for a camera again when none is known yet. */
  const startOrRetry = async () => {
    const cameraId = selectedCameraIdRef.current ?? (await detectCameras());
    if (cameraId) {
      await startScanner(cameraId);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void detectCameras().then((defaultCameraId) => {
      if (cancelled || !defaultCameraId) return;
      if (autoStart && !autoStarted.current) {
        autoStarted.current = true;
        void startScanner(defaultCameraId);
      }
    });
    const timeoutRef = flashCheckTimeoutRef;
    return () => {
      cancelled = true;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      const scanner = scannerRef.current;
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [autoStart, detectCameras, startScanner]);

  const status: ScannerStatus = isInitializing
    ? "starting"
    : isScanning
      ? "scanning"
      : cameraProblem
        ? cameraProblem
        : "idle";

  return (
    <ScannerFrame
      status={status}
      className={className}
      torch={hasFlash ? { on: isFlashOn, onToggle: () => void toggleFlash() } : null}
      onSwitchCamera={cameras.length > 1 ? () => void switchCamera() : null}
      onStart={() => void startOrRetry()}
      onStop={() => void stopScanner()}
      onEnterCode={onEnterCode}
    >
      {/* The library puts the camera picture in here. */}
      <div
        id={regionId}
        className="size-full overflow-hidden bg-[#111827] [&_video]:size-full! [&_video]:object-cover!"
      />
    </ScannerFrame>
  );
}
