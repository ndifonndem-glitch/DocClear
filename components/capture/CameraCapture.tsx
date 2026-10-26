"use client";

import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, Flashlight, Image as ImageIcon, CheckCircle2, FileType2, FileText, FileCode, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export type SupportedFileType = "image" | "pdf" | "docx" | "text";

export interface CameraCaptureProps {
  onFileSelected: (file: File, dataUrl: string, fileType: SupportedFileType) => void;
  onError?: (errorMessage: string) => void;
  selectedFileName?: string | null;
  selectedFileSize?: number | null;
  selectedFileType?: SupportedFileType | null;
  previewUrl?: string | null;
  onClear?: () => void;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB limit

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onFileSelected,
  onError,
  selectedFileName,
  selectedFileSize,
  selectedFileType,
  previewUrl,
  onClear,
}) => {
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsCameraModalOpen(true);
    setHasCameraAccess(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
      }

      // Try environment/rear camera first, fallback to any video input
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setHasCameraAccess(true);

      // Short delay to allow video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn("Video play error:", e));
        }
      }, 100);
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      setHasCameraAccess(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsCameraModalOpen(false);
  };

  const validateAndProcessFile = (file: File) => {
    if (file.size === 0) {
      onError?.("The selected file is empty (0 bytes). Please choose a valid document.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      onError?.(
        `File too large: ${sizeMB} MB. The maximum supported size is 15 MB. Please select a smaller document.`
      );
      return;
    }

    const name = file.name.toLowerCase();

    if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|bmp|gif|tiff)$/i.test(name)) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onFileSelected(file, reader.result, "image");
        }
      };
      reader.readAsDataURL(file);
    } else if (name.endsWith(".pdf") || file.type === "application/pdf") {
      onFileSelected(file, "", "pdf");
    } else if (
      name.endsWith(".docx") ||
      name.endsWith(".doc") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      onFileSelected(file, "", "docx");
    } else if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
      onFileSelected(file, "", "text");
    } else {
      onError?.("Unsupported file format. Please upload PDF, Word (.docx), text, or image.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleShutterCapture = () => {
    if (videoRef.current && hasCameraAccess && videoRef.current.videoWidth > 0) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], `scan_${Date.now()}.jpg`, { type: "image/jpeg" });
            stopCamera();
            setIsCameraModalOpen(false);
            onFileSelected(capturedFile, dataUrl, "image");
          }
        }, "image/jpeg", 0.95);
        return;
      }
    }

    // Mobile file-picker fallback
    stopCamera();
    setIsCameraModalOpen(false);
    cameraInputRef.current?.click();
  };

  const toggleFlash = async () => {
    const nextState = !isFlashActive;
    setIsFlashActive(nextState);

    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = (track as any).getCapabilities?.();
      if (capabilities?.torch) {
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: nextState }],
          });
        } catch (e) {
          console.warn("Could not toggle hardware torch:", e);
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        id="camera-input"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Capture document with camera"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,.pdf,.docx,.doc,.txt,.md"
        id="upload-input"
        className="sr-only"
        onChange={handleFileChange}
        aria-label="Upload document file"
      />

      {/* Primary Action Buttons (Matching Image 2 and Image 4) */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3.5">
        {/* Solid Blue Button: Use camera */}
        <button
          type="button"
          onClick={startCamera}
          className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl font-bold text-base shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-200 min-h-[56px]"
          aria-label="Use camera to scan document"
        >
          <Camera className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
          <span>Use camera</span>
        </button>

        {/* Dashed Border Button: Upload or drop file */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-white rounded-2xl font-bold text-base transition-all focus:outline-none focus:ring-4 focus:ring-blue-200 min-h-[56px] ${
            isDragOver
              ? "border-2 border-blue-600 bg-blue-50/70 text-blue-700"
              : "border-2 border-dashed border-blue-500 hover:border-blue-700 hover:bg-blue-50/30 text-blue-700"
          }`}
          aria-label="Upload or drop document file"
        >
          <Upload className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
          <span>Upload or drop file</span>
        </button>
      </div>

      <div className="text-xs text-slate-500 font-medium">
        PDF, DOCX, JPG, PNG, TXT. Up to 15 MB.
      </div>

      {/* Selected Document Preview Card */}
      {selectedFileName && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Document Ready for Processing</span>
            </div>
            {selectedFileSize && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {formatFileSize(selectedFileSize)}
              </span>
            )}
          </div>

          {selectedFileType === "image" && previewUrl ? (
            <div className="relative aspect-[4/3] w-full max-w-xs mx-auto overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Document capture preview" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="p-2.5 bg-blue-100 text-blue-800 rounded-lg flex-shrink-0" aria-hidden="true">
                {selectedFileType === "pdf" ? (
                  <FileType2 className="w-6 h-6 text-rose-600" />
                ) : selectedFileType === "docx" ? (
                  <FileText className="w-6 h-6 text-blue-600" />
                ) : (
                  <FileCode className="w-6 h-6 text-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-slate-900 block truncate text-sm">{selectedFileName}</span>
                <span className="text-[11px] text-slate-500 uppercase font-semibold">
                  {selectedFileType === "pdf"
                    ? "PDF Document"
                    : selectedFileType === "docx"
                    ? "Word Document"
                    : "Plain Text Document"}
                </span>
              </div>
            </div>
          )}

          {onClear && (
            <div className="flex justify-end">
              <Button variant="outline" size="small" onClick={onClear} className="min-h-[44px]" aria-label="Clear selected file">
                Remove Document
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Scanner Modal (Matching Image 3) */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0f141c] flex flex-col justify-between text-white p-4 sm:p-6 animate-in fade-in duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between relative h-12">
            <button
              type="button"
              onClick={handleCloseModal}
              className="w-11 h-11 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 min-h-[44px] min-w-[44px]"
              aria-label="Close scanner"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white text-center absolute left-1/2 -translate-x-1/2">
              Scan document
            </h2>
            <div className="w-11" />
          </div>

          {/* Viewfinder Center */}
          <div className="flex-1 flex flex-col items-center justify-center my-4">
            <div className="relative w-full max-w-xs sm:max-w-sm aspect-[3/4] rounded-3xl border-2 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.35)] bg-slate-900/60 p-2 flex flex-col items-center justify-center overflow-hidden">
              {/* Real Video Stream from Camera */}
              {hasCameraAccess ? (
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle scanning laser line */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.9)] animate-pulse" />
                </div>
              ) : hasCameraAccess === false ? (
                /* Fallback if Camera Permission Blocked or Unavailable in Desktop Browser */
                <div className="w-full h-full bg-slate-800/90 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-sm font-semibold text-white">Live Camera Not Accessible</p>
                  <p className="text-xs text-slate-300 max-w-[220px]">
                    Your browser or device blocked camera access or has no webcam connected.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all min-h-[44px] inline-flex items-center justify-center"
                  >
                    Choose Document File
                  </button>
                </div>
              ) : (
                /* Initial Loading State */
                <div className="w-full h-full bg-slate-800/80 rounded-2xl p-4 flex flex-col justify-between relative shadow-inner">
                  <div className="space-y-3 animate-pulse">
                    <div className="h-3.5 bg-slate-600/70 rounded w-2/5" />
                    <div className="h-2.5 bg-slate-600/50 rounded w-full" />
                    <div className="h-2.5 bg-slate-600/50 rounded w-5/6" />
                  </div>
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.9)] animate-pulse" />
                  <div className="space-y-2 opacity-50">
                    <div className="h-2 bg-slate-600/40 rounded w-full" />
                  </div>
                </div>
              )}
            </div>

            {/* "Edges found. Hold steady." Pill */}
            <div className="mt-5 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-teal-950/90 border border-teal-500/50 text-teal-300 text-xs font-bold tracking-wide shadow-md">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>Edges found. Hold steady.</span>
            </div>
          </div>

          {/* Bottom Camera Controls (Matching Image 3) */}
          <div className="flex items-center justify-around pb-6 pt-2 max-w-sm mx-auto w-full">
            {/* Left: Gallery Button */}
            <button
              type="button"
              onClick={() => {
                handleCloseModal();
                fileInputRef.current?.click();
              }}
              className="min-h-[44px] min-w-[48px] p-2 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white text-xs font-medium focus:outline-none"
              aria-label="Open document file gallery"
            >
              <ImageIcon className="w-6 h-6 stroke-[1.8]" />
              <span>Gallery</span>
            </button>

            {/* Center: Large Shutter Button */}
            <button
              type="button"
              onClick={handleShutterCapture}
              className="w-20 h-20 rounded-full border-4 border-slate-700 hover:border-slate-500 p-1 flex items-center justify-center transition-all active:scale-90 focus:outline-none focus:ring-4 focus:ring-blue-400 min-h-[44px] min-w-[44px]"
              aria-label="Capture document photo"
            >
              <div className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/50 flex items-center justify-center" />
            </button>

            {/* Right: Flash Toggle */}
            <button
              type="button"
              onClick={toggleFlash}
              className={`min-h-[44px] min-w-[48px] p-2 flex flex-col items-center justify-center gap-1 text-xs font-medium focus:outline-none ${
                isFlashActive ? "text-amber-400" : "text-slate-300 hover:text-white"
              }`}
              aria-label={isFlashActive ? "Turn flash off" : "Turn flash on"}
            >
              <Flashlight className="w-6 h-6 stroke-[1.8]" />
              <span>Flash</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
