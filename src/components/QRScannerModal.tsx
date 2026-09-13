import { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { useTheme } from '../context/theme';

export interface ScannedCryptoTarget {
  address: string;
  chain: string;
  amount?: string;
  raw: string;
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: ScannedCryptoTarget) => void;
}

/**
 * Intelligent Crypto URI & QR Payload Parser
 * Parses EIP-681 (ethereum:), BIP-21 (bitcoin:), TRC-20 (tron:), Solana, and raw address strings.
 */
export function parseCryptoQR(rawText: string): ScannedCryptoTarget {
  const text = (rawText || '').trim();

  // 1. Ethereum / EVM URI: ethereum:0x1234...?value=... or 0x...
  if (text.toLowerCase().startsWith('ethereum:')) {
    const withoutPrefix = text.slice(9);
    const [addrPart, queryPart] = withoutPrefix.split('?');
    const cleanAddr = addrPart.replace(/^pay-/, '').trim();
    let amount = undefined;
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      if (params.get('value')) amount = params.get('value')!;
      if (params.get('amount')) amount = params.get('amount')!;
    }
    return {
      address: cleanAddr,
      chain: 'Ethereum (ETH)',
      amount,
      raw: text,
    };
  }

  // 2. Bitcoin BIP-21 URI: bitcoin:1A1zP1e...?amount=...
  if (text.toLowerCase().startsWith('bitcoin:')) {
    const withoutPrefix = text.slice(8);
    const [cleanAddr, queryPart] = withoutPrefix.split('?');
    let amount = undefined;
    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      if (params.get('amount')) amount = params.get('amount')!;
    }
    return {
      address: cleanAddr.trim(),
      chain: 'Bitcoin (BTC)',
      amount,
      raw: text,
    };
  }

  // 3. Tron URI: tron:T... or trc20:T...
  if (text.toLowerCase().startsWith('tron:') || text.toLowerCase().startsWith('trc20:')) {
    const clean = text.replace(/^(tron:|trc20:)/i, '').split('?')[0].trim();
    return {
      address: clean,
      chain: 'Tron (TRX)',
      raw: text,
    };
  }

  // 4. Solana URI: solana:...
  if (text.toLowerCase().startsWith('solana:')) {
    const clean = text.slice(7).split('?')[0].trim();
    return {
      address: clean,
      chain: 'Solana (SOL)',
      raw: text,
    };
  }

  // 5. Binance / BSC URI: bnb:0x... or binance:0x...
  if (text.toLowerCase().startsWith('bnb:') || text.toLowerCase().startsWith('binance:')) {
    const clean = text.replace(/^(bnb:|binance:)/i, '').split('?')[0].trim();
    return {
      address: clean,
      chain: 'BNB Chain',
      raw: text,
    };
  }

  // 6. Polygon URI: polygon:0x...
  if (text.toLowerCase().startsWith('polygon:') || text.toLowerCase().startsWith('matic:')) {
    const clean = text.replace(/^(polygon:|matic:)/i, '').split('?')[0].trim();
    return {
      address: clean,
      chain: 'Polygon',
      raw: text,
    };
  }

  // 7. Raw Address Heuristics
  // EVM 0x address (42 hex chars)
  if (/^0x[a-fA-F0-9]{40}$/.test(text)) {
    return {
      address: text,
      chain: 'Auto Detect',
      raw: text,
    };
  }

  // Tron Base58 (starts with T, 34 chars)
  if (/^T[1-9A-HJ-NP-za-km-z]{33}$/.test(text)) {
    return {
      address: text,
      chain: 'Tron (TRX)',
      raw: text,
    };
  }

  // Bitcoin (Legacy '1', Script '3', or Bech32 'bc1')
  if (/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(text)) {
    return {
      address: text,
      chain: 'Bitcoin (BTC)',
      raw: text,
    };
  }

  // Solana Base58 (32-44 characters)
  if (/^[1-9A-HJ-NP-za-km-z]{32,44}$/.test(text)) {
    return {
      address: text,
      chain: 'Solana (SOL)',
      raw: text,
    };
  }

  // Fallback raw string
  return {
    address: text,
    chain: 'Auto Detect',
    raw: text,
  };
}

// Audio Feedback on Successful Forensic QR Capture
function playSuccessBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);

    // Haptic pulse if supported
    if (navigator.vibrate) {
      navigator.vibrate([40, 40, 60]);
    }
  } catch {}
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const { t } = useTheme();
  const [activeMode, setActiveMode] = useState<'camera' | 'file'>('camera');
  const [cameraError, setCameraError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchSupported, setTorchSupported] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const [detectedData, setDetectedData] = useState<ScannedCryptoTarget | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsTorchOn(false);
  }, []);

  const handleScanSuccess = useCallback((result: ScannedCryptoTarget) => {
    setDetectedData(result);
    playSuccessBeep();
    stopCamera();
    setTimeout(() => {
      onScan(result);
      onClose();
    }, 450);
  }, [onScan, onClose, stopCamera]);

  // Video Frame Scanner Loop
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data && code.data.trim()) {
        const parsed = parseCryptoQR(code.data);
        handleScanSuccess(parsed);
        return;
      }
    }

    animFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [handleScanSuccess]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError('');
    setDetectedData(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser or device environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          setTorchSupported(true);
        } else {
          setTorchSupported(false);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Critical for iOS / mobile WebViews
        await videoRef.current.play();
        animFrameRef.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Camera permission denied. Please enable camera access in your device/browser settings.'
        : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
        ? 'No camera found on this device.'
        : err.message || 'Unable to access camera.';
      setCameraError(msg);
    }
  }, [facingMode, scanVideoFrame, stopCamera]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  // Toggle Front / Rear Camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Process Uploaded Image / Screenshot
  const handleImageUpload = (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);
    setFileError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setFileError('Failed to initialize canvas context');
          setIsProcessingFile(false);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        setIsProcessingFile(false);

        if (code && code.data && code.data.trim()) {
          const parsed = parseCryptoQR(code.data);
          handleScanSuccess(parsed);
        } else {
          setFileError('No valid crypto QR code could be detected in this image. Please ensure the QR is well-lit and unobstructed.');
        }
      };
      img.onerror = () => {
        setIsProcessingFile(false);
        setFileError('Failed to parse uploaded image file.');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setIsProcessingFile(false);
      setFileError('Error reading file.');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      if (activeMode === 'camera') {
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode, facingMode, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(2,6,18,0.92)', backdropFilter: 'blur(14px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col relative"
           style={{ background: t.card, border: `1px solid ${t.borderAccent}`, maxHeight: '90vh' }}>

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b"
             style={{ borderColor: t.border, background: t.nav }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-base">
              📷
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                Forensic QR Code Scanner
              </h3>
              <p className="text-[10px] text-white/40">Multi-Chain EIP-681 / BIP-21 / TRC-20 Auto-Ingestion</p>
            </div>
          </div>
          <button onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white bg-white/5 active:scale-95 transition-all">
            ✕
          </button>
        </div>

        {/* ── Mode Selector (Live Camera vs Image File) ── */}
        <div className="flex p-2 gap-1.5 border-b" style={{ borderColor: t.border, background: t.inputBg }}>
          <button
            onClick={() => { setActiveMode('camera'); setFileError(''); }}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'camera' ? 'bg-[#1e5fff] text-white shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            <span>📹</span> Live Video Scan
          </button>
          <button
            onClick={() => { setActiveMode('file'); stopCamera(); }}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeMode === 'file' ? 'bg-[#1e5fff] text-white shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            <span>🖼️</span> Upload FIR / Image
          </button>
        </div>

        {/* ── Main Scanner View ── */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[340px]">
          {activeMode === 'camera' && (
            <div className="w-full flex flex-col items-center">
              {cameraError ? (
                <div className="w-full py-8 px-4 text-center space-y-3 rounded-2xl bg-red-950/20 border border-red-500/30">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center text-xl">
                    ⚠️
                  </div>
                  <p className="text-[13px] font-bold text-red-300">Camera Access Error</p>
                  <p className="text-[11px] text-white/60 max-w-xs mx-auto leading-relaxed">{cameraError}</p>
                  <div className="flex justify-center gap-2 pt-2">
                    <button onClick={startCamera}
                            className="px-4 py-2 rounded-xl text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Retry Camera
                    </button>
                    <button onClick={() => setActiveMode('file')}
                            className="px-4 py-2 rounded-xl text-[11px] font-bold bg-blue-600 text-white">
                      Upload Image Instead
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/40 shadow-[0_0_25px_rgba(0,242,254,0.15)] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* ── Cyber Reticle & Scanner HUD Overlay ── */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4">
                    {/* Top HUD Telemetry */}
                    <div className="w-full flex items-center justify-between text-[9px] font-mono font-bold text-cyan-400 tracking-wider">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        AUTO-TRACKING
                      </span>
                      <span>1080P · LIVE</span>
                    </div>

                    {/* Viewfinder Target Box */}
                    <div className="relative w-44 h-44 border border-cyan-400/30 rounded-xl flex items-center justify-center">
                      {/* Corner Brackets */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

                      {/* Animated Laser Sweep Beam */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#00f2fe] to-transparent shadow-[0_0_12px_#00f2fe] animate-[bounce_2s_infinite]" />
                    </div>

                    {/* Bottom Scanning Notice */}
                    <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-cyan-300">
                      Align QR inside frame
                    </div>
                  </div>

                  {/* Detected Success Flash Overlay */}
                  {detectedData && (
                    <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-4 text-center animate-fadeIn z-20">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold mb-2">
                        ✓
                      </div>
                      <p className="text-[13px] font-bold text-white">Target QR Verified</p>
                      <p className="text-[10px] font-mono text-emerald-300 truncate max-w-xs mt-0.5">{detectedData.address}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Camera Action Controls (Torch & Switch Camera) */}
              {!cameraError && (
                <div className="flex items-center justify-center gap-3 mt-4">
                  {torchSupported && (
                    <button
                      onClick={toggleTorch}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5 border transition-all ${
                        isTorchOn ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-white/5 text-white/60 border-white/10'
                      }`}
                    >
                      <span>{isTorchOn ? '🔦' : '💡'}</span>
                      {isTorchOn ? 'Flash ON' : 'Flash OFF'}
                    </button>
                  )}
                  <button
                    onClick={toggleFacingMode}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1.5 bg-white/5 text-white/60 border border-white/10 hover:text-white"
                  >
                    <span>🔄</span> Flip Camera
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Mode 2: File Upload / Drag & Drop ── */}
          {activeMode === 'file' && (
            <div className="w-full flex flex-col items-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="w-full aspect-video rounded-2xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/10 hover:bg-cyan-950/20 transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center space-y-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  📂
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white">Click or Drag QR Image / FIR Screenshot</p>
                  <p className="text-[10px] text-white/40 mt-0.5">Supports PNG, JPG, WEBP, WhatsApp screenshots</p>
                </div>
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-xl text-[10px] font-bold bg-[#1e5fff] text-white shadow"
                >
                  Browse Device Files
                </button>
              </div>

              {isProcessingFile && (
                <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  De-rasterizing QR matrix & analyzing checksums...
                </div>
              )}

              {fileError && (
                <div className="w-full p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-[11px] text-red-300 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{fileError}</span>
                </div>
              )}

              {detectedData && (
                <div className="w-full p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono flex items-center gap-2">
                  <span>✓</span>
                  <span className="truncate">Extracted: {detectedData.address} ({detectedData.chain})</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Guidance ── */}
        <div className="px-5 py-3 border-t flex items-center justify-between text-[10px] font-mono text-white/40"
             style={{ borderColor: t.border, background: t.inputBg }}>
          <span>Supports ETH, Tron, BTC, SOL, BNB</span>
          <span className="text-cyan-400">Section 91 CrPC Compliant</span>
        </div>
      </div>
    </div>
  );
}
