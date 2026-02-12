import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
  fps?: number;
  qrbox?: number | { width: number; height: number };
  aspectRatio?: number;
  verbose?: boolean;
}

export function QRScanner({
  onScanSuccess,
  onScanFailure,
  fps = 10,
  qrbox = 250,
  aspectRatio = 1.0,
  verbose = false,
}: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const regionId = "html5qr-code-full-region";

  useEffect(() => {
    // Clean up any existing scanner instance
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch(console.error);
        } catch (e) {
          console.error("Failed to clear scanner", e);
        }
      }
    };
  }, []);

  const startScanner = () => {
    setError(null);
    setIsScanning(true);

    try {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }

      const scanner = new Html5QrcodeScanner(
        regionId,
        {
          fps,
          qrbox,
          aspectRatio,
          disableFlip: false,
        },
        verbose
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText: string) => {
          // Success callback
          // console.log("Scan success:", decodedText);
          onScanSuccess(decodedText);
          
          // Optional: Stop scanning after success
          // scanner.clear();
          // setIsScanning(false);
        },
        (errorMessage: any) => {
          // Error callback
          if (onScanFailure) {
            onScanFailure(errorMessage);
          }
        }
      );
    } catch (err: any) {
      console.error("Scanner initialization error:", err);
      setError(err.message || "Failed to initialize camera");
      setIsScanning(false);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .clear()
        .then(() => {
          setIsScanning(false);
        })
        .catch((err) => {
          console.error("Failed to clear scanner", err);
        });
    } else {
      setIsScanning(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Scan QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {error ? (
          <div className="text-destructive text-center p-4 bg-destructive/10 rounded-md">
            <p className="font-medium">Camera Error</p>
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={startScanner}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : (
          <div id={regionId} className="w-full overflow-hidden rounded-md bg-muted" />
        )}
        
        {!isScanning && !error && (
          <Button onClick={startScanner} className="w-full">
            Start Scanner
          </Button>
        )}
        
        {isScanning && (
          <Button onClick={stopScanner} variant="destructive" className="w-full">
            Stop Scanner
          </Button>
        )}
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          Point your camera at the clinic's QR code to check in.
        </p>
      </CardContent>
    </Card>
  );
}
