import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { Camera, Upload, X, QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (certificateId: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('upload');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const extractCertId = (rawText: string): string => {
    const clean = rawText.trim();
    // Check if it's a URL like https://.../verify/CERT-2024-8841
    const urlMatch = clean.match(/\/verify\/([^/?#]+)/i);
    if (urlMatch && urlMatch[1]) {
      return decodeURIComponent(urlMatch[1]);
    }
    // Check if it's already a CERT ID
    const certMatch = clean.match(/(CERT-[A-Z0-9-]+)/i);
    if (certMatch && certMatch[1]) {
      return certMatch[1];
    }
    return clean;
  };

  const handleScanFound = (codeText: string) => {
    const certId = extractCertId(codeText);
    setScanResult(certId);
    stopCamera();
    setTimeout(() => {
      onScanSuccess(certId);
      onClose();
    }, 800);
  };

  // Start Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanVideoFrame();
      }
    } catch (err: unknown) {
      console.warn('Camera stream error:', err);
      setCameraError(
        'Unable to access camera. Please allow camera permissions in your browser or use the "Upload QR Image" option.'
      );
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setScanning(false);
  };

  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleScanFound(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  // Upload and decode QR from image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleScanFound(code.data);
        } else {
          setCameraError('No valid QR code could be detected in this image. Please upload a clear certificate QR.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-inverse-surface text-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline-sm text-sm font-bold text-white">
                Scan Certificate QR Code
              </h3>
              <p className="text-[11px] text-outline-variant">
                Instant cryptographic lookup from diploma QR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-outline-variant hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-surface-container bg-surface-container-low/50 p-1">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'upload'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload QR Image
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-surface-container-lowest text-primary shadow-xs'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Camera Scan
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex flex-col items-center gap-4">
          {scanResult ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 w-full text-center flex flex-col items-center gap-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <span className="text-xs font-semibold">QR Code Recognized!</span>
              <span className="font-code-mono font-bold text-sm bg-white px-3 py-1 rounded-lg border border-emerald-200">
                {scanResult}
              </span>
              <span className="text-[11px] text-emerald-700">Redirecting to verification...</span>
            </div>
          ) : activeTab === 'camera' ? (
            <div className="w-full flex flex-col items-center">
              {cameraError ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center flex flex-col items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                  <p>{cameraError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('upload')}
                    className="mt-2"
                  >
                    Switch to Image Upload
                  </Button>
                </div>
              ) : (
                <div className="relative w-full aspect-square max-w-[280px] rounded-xl overflow-hidden bg-black flex items-center justify-center border-2 border-primary/50 shadow-inner">
                  <video
                    ref={videoRef}
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-8 border-2 border-white/60 border-dashed rounded-lg pointer-events-none animate-pulse" />
                  {scanning && (
                    <span className="absolute bottom-2 text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded-full font-code-mono">
                      Align QR inside frame
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-3">
              <label
                htmlFor="qr-file-input"
                className="w-full aspect-square max-w-[260px] rounded-xl border-2 border-dashed border-surface-container-high hover:border-primary bg-surface-container-low/40 hover:bg-surface-container-low flex flex-col items-center justify-center p-4 cursor-pointer transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-on-surface">
                  Click to select QR image
                </span>
                <span className="text-[10px] text-outline mt-1">
                  Supports PNG, JPG, WEBP certificate QR codes
                </span>
                <input
                  id="qr-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {cameraError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] text-center w-full">
                  {cameraError}
                </div>
              )}

              <div className="w-full p-2.5 rounded-lg bg-surface-container text-[11px] text-secondary flex items-center justify-between">
                <span>Demo QR Shortcut:</span>
                <button
                  type="button"
                  onClick={() => handleScanFound('CERT-2024-8841')}
                  className="text-primary font-semibold hover:underline"
                >
                  Load Elena's QR (CERT-2024-8841)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
