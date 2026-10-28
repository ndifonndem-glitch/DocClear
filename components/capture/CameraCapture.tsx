"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  X,
  Flashlight,
  Image as ImageIcon,
  CheckCircle2,
  FileType2,
  FileText,
  FileCode,
  AlertCircle,
  RotateCw,
  Trash2,
  Plus,
  Eye,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScannedPage } from "@/types/document";
import { PermissionDialog, PermissionStatus, PermissionType } from "@/components/ui/PermissionDialog";

export type SupportedFileType = "image" | "pdf" | "docx" | "text";

export interface CameraCaptureProps {
  onFileSelected: (file: File, dataUrl: string, fileType: SupportedFileType) => void;
  onMultiPagesSelected?: (pages: ScannedPage[]) => void;
  onError?: (errorMessage: string) => void;
  selectedFileName?: string | null;
  selectedFileSize?: number | null;
  selectedFileType?: SupportedFileType | null;
  previewUrl?: string | null;
  scannedPages?: ScannedPage[];
  onUpdateScannedPages?: (pages: ScannedPage[]) => void;
  onClear?: () => void;
}

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB limit
const MAX_PAGES_LIMIT = 5; // Strict maximum 5 photos

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onFileSelected,
  onMultiPagesSelected,
  onError,
  selectedFileName,
  selectedFileSize,
  selectedFileType,
  previewUrl,
  scannedPages = [],
  onUpdateScannedPages,
  onClear,
}) => {
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [inspectingPage, setInspectingPage] = useState<ScannedPage | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [lightWarning, setLightWarning] = useState<string | null>(null);

  // Granular, separate permissions (Camera & File Storage requested one-by-one)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [activePermissionType, setActivePermissionType] = useState<PermissionType>("camera");
  const [cameraPermission, setCameraPermission] = useState<PermissionStatus>("undecided");
  const [storagePermission, setStoragePermission] = useState<PermissionStatus>("undecided");

  // Local pages inside the camera viewfinder session
  const [localPages, setLocalPages] = useState<ScannedPage[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Synchronize localPages when modal opens or scannedPages change
  useEffect(() => {
    if (scannedPages.length > 0) {
      setLocalPages(scannedPages);
    }
  }, [scannedPages]);

  // Read saved granular permissions on mount & listen to global updates
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCam = localStorage.getItem("docclear_perm_camera") as PermissionStatus | null;
      if (savedCam) setCameraPermission(savedCam);

      const savedStore = localStorage.getItem("docclear_perm_storage") as PermissionStatus | null;
      if (savedStore) setStoragePermission(savedStore);

      const handlePermUpdate = () => {
        const c = localStorage.getItem("docclear_perm_camera") as PermissionStatus | null;
        if (c) setCameraPermission(c);
        const s = localStorage.getItem("docclear_perm_storage") as PermissionStatus | null;
        if (s) setStoragePermission(s);
      };

      window.addEventListener("docclear-permission-updated", handlePermUpdate);
      return () => {
        window.removeEventListener("docclear-permission-updated", handlePermUpdate);
      };
    }
  }, []);

  // Camera trigger:
  // When allowed one time, the permission box is not shown repeatedly; camera opens directly.
  // If user previously denied or hasn't decided, clicking "Use camera" displays the permission box.
  const handleCameraButtonClick = () => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("docclear_perm_camera") : null;
    if (saved === "granted") {
      startCamera();
      return;
    }
    setActivePermissionType("camera");
    setIsPermissionDialogOpen(true);
  };

  // File upload trigger:
  // If previously denied, show the permission box to allow re-enabling.
  // Otherwise open native device file picker directly.
  const handleUploadButtonClick = () => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("docclear_perm_storage") : null;
    if (saved === "denied") {
      setActivePermissionType("storage");
      setIsPermissionDialogOpen(true);
      return;
    }
    fileInputRef.current?.click();
  };

  // Callback when user grants or denies a specific permission
  const handlePermissionDecision = (status: PermissionStatus, type: PermissionType) => {
    setIsPermissionDialogOpen(false);
    if (type === "camera") {
      setCameraPermission(status);
      if (status === "granted") {
        startCamera();
      }
    } else if (type === "storage") {
      setStoragePermission(status);
      if (status === "granted") {
        fileInputRef.current?.click();
      }
    }
  };

  // Stop camera stream on unmount or when app goes to background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopCamera();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopCamera();
    };
  }, []);

  // Ensure video element receives stream as soon as it mounts in the DOM
  useEffect(() => {
    if (isCameraModalOpen && hasCameraAccess && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.onloadedmetadata = () => {
        video.play().catch((e) => console.warn("Video play error:", e));
      };
      video.play().catch((e) => console.warn("Video play error:", e));
    }
  }, [isCameraModalOpen, hasCameraAccess]);

  // Spacebar to capture photo on desktop webcam, Escape to close
  useEffect(() => {
    if (!isCameraModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.code === "Space" || e.code === "Enter") &&
        !e.repeat &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        handleShutterCapture();
      } else if (e.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCameraModalOpen, localPages]);

  const startCamera = async () => {
    setLocalPages(scannedPages || []);
    setIsCameraModalOpen(true);
    setHasCameraAccess(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
      }

      stopCamera();

      // Multi-tier webcam constraints: compatible with mobile rear cams, USB webcams & laptop webcams
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch (err1) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });
        } catch (err2) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      streamRef.current = stream;
      setHasCameraAccess(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => console.warn("Video play error:", e));
        };
        videoRef.current.play().catch((e) => console.warn("Video play error:", e));
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      setHasCameraAccess(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleCloseModal = () => {
    stopCamera();
    setIsCameraModalOpen(false);
    setInspectingPage(null);
  };

  const handleDoneCapturing = () => {
    stopCamera();
    setIsCameraModalOpen(false);
    setInspectingPage(null);

    if (localPages.length > 0) {
      if (onMultiPagesSelected) {
        onMultiPagesSelected(localPages);
      } else if (localPages.length === 1) {
        // Fallback for single page handler
        fetch(localPages[0].dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], `scan_page_1.jpg`, { type: "image/jpeg" });
            onFileSelected(file, localPages[0].dataUrl, "image");
          });
      }
    }
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
          // If already in multi-page mode and under limit, add as a page
          if (localPages.length > 0 && localPages.length < MAX_PAGES_LIMIT) {
            const newPage: ScannedPage = {
              id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              dataUrl: reader.result,
              rotation: 0,
              timestamp: Date.now(),
            };
            const updated = [...localPages, newPage];
            setLocalPages(updated);
            onUpdateScannedPages?.(updated);
          } else {
            onFileSelected(file, reader.result, "image");
          }
        }
      };
      reader.readAsDataURL(file);
    } else if (name.endsWith(".pdf") || file.type === "application/pdf") {
      onFileSelected(file, "", "pdf");
    } else if (
      name.endsWith(".docx") ||
      name.endsWith(".doc") ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword"
    ) {
      onFileSelected(file, "", "docx");
    } else if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
      onFileSelected(file, "", "text");
    } else {
      onError?.("Unsupported file format. Please upload PDF, Word (.docx), TXT, or image files.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Capture current video frame and add to multi-page tray
  const handleShutterCapture = () => {
    if (localPages.length >= MAX_PAGES_LIMIT) {
      onError?.(`Limit reached: Maximum ${MAX_PAGES_LIMIT} photos per document.`);
      return;
    }

    if (videoRef.current && streamRef.current) {
      const video = videoRef.current;
      const w = video.videoWidth || video.clientWidth || 1280;
      const h = video.videoHeight || video.clientHeight || 720;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

        // Ambient-Light assessment from captured image (Supervisor Checklist Item 3)
        try {
          const sampleW = Math.min(canvas.width, 160);
          const sampleH = Math.min(canvas.height, 160);
          const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
          const px = imgData.data;
          let sumLuma = 0;
          for (let i = 0; i < px.length; i += 4) {
            // Perceptual luminance: 0.299R + 0.587G + 0.114B
            sumLuma += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          }
          const avgLuma = Math.round(sumLuma / (px.length / 4));
          if (avgLuma < 55) {
            setLightWarning(
              `Low lighting detected (${avgLuma}/255). Consider turning on the flashlight or moving to better light for higher OCR accuracy.`
            );
            setTimeout(() => setLightWarning(null), 5000);
          } else {
            setLightWarning(null);
          }
        } catch {
          // ignore
        }

        // Flash visual feedback
        setShutterFlash(true);
        setTimeout(() => setShutterFlash(false), 200);

        const newPage: ScannedPage = {
          id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          dataUrl,
          rotation: 0,
          timestamp: Date.now(),
        };

        const updated = [...localPages, newPage];
        setLocalPages(updated);
        onUpdateScannedPages?.(updated);
        return;
      }
    }

    // Fallback file picker if video stream is not active
    cameraInputRef.current?.click();
  };

  // Rotate a page 90 degrees clockwise (0 -> 90 -> 180 -> 270 -> 0)
  const handleRotatePage = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = localPages.map((page) => {
      if (page.id === id) {
        const nextRotation = (page.rotation + 90) % 360;
        return { ...page, rotation: nextRotation };
      }
      return page;
    });
    setLocalPages(updated);
    onUpdateScannedPages?.(updated);

    if (inspectingPage && inspectingPage.id === id) {
      setInspectingPage({
        ...inspectingPage,
        rotation: (inspectingPage.rotation + 90) % 360,
      });
    }
  };

  // Delete a specific page
  const handleDeletePage = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = localPages.filter((p) => p.id !== id);
    setLocalPages(updated);
    onUpdateScannedPages?.(updated);

    if (inspectingPage && inspectingPage.id === id) {
      setInspectingPage(null);
    }
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
    <div className="space-y-4 w-full">
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

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3.5">
        {/* Solid Blue Button: Use camera */}
        <button
          type="button"
          onClick={handleCameraButtonClick}
          className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl font-bold text-base shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-200 min-h-[56px]"
          aria-label="Use camera to scan document (up to 5 pages)"
        >
          <Camera className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
          <span>Use camera</span>
          {scannedPages.length > 0 && (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-800 text-white font-extrabold">
              {scannedPages.length} / {MAX_PAGES_LIMIT}
            </span>
          )}
        </button>

        {/* Dashed Border Button: Upload or drop file */}
        <button
          type="button"
          onClick={handleUploadButtonClick}
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

      {/* Granular Permission Denied Recovery Notices */}
      {cameraPermission === "denied" && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Camera access is currently denied. You can still upload files directly.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActivePermissionType("camera");
              setIsPermissionDialogOpen(true);
            }}
            className="font-bold text-blue-700 hover:text-blue-800 underline min-h-[36px] px-2"
          >
            Allow Camera
          </button>
        </div>
      )}

      {storagePermission === "denied" && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Device file access is currently denied.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActivePermissionType("storage");
              setIsPermissionDialogOpen(true);
            }}
            className="font-bold text-blue-700 hover:text-blue-800 underline min-h-[36px] px-2"
          >
            Allow Files
          </button>
        </div>
      )}

      <div className="text-xs text-slate-500 font-medium">
        Camera: scan 1 to 5 pages • Files: PDF, DOCX, JPG, PNG, TXT up to 15 MB.
      </div>

      {/* MULTI-PAGE SCANNED DOCUMENTS GALLERY CARD (When camera captured 1 to 5 pages) */}
      {scannedPages.length > 0 && (
        <div className="bg-white border-2 border-blue-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm sm:text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />
              <span>
                Scanned Document ({scannedPages.length} of {MAX_PAGES_LIMIT} Pages Ready)
              </span>
            </div>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline min-h-[36px] px-2"
                aria-label="Clear all scanned pages"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Grid of Scanned Page Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {scannedPages.map((page, idx) => (
              <div
                key={page.id}
                className="group relative bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-col items-center justify-between shadow-2xs hover:border-blue-400 transition-all"
              >
                {/* Header Tag */}
                <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5 px-0.5">
                  <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-blue-700">
                    Page {idx + 1}
                  </span>
                  {page.rotation > 0 && (
                    <span className="text-[10px] text-amber-600 font-semibold">{page.rotation}°</span>
                  )}
                </div>

                {/* Thumbnail Preview with Dynamic Rotation */}
                <div
                  onClick={() => setInspectingPage(page)}
                  className="w-full aspect-[3/4] bg-black rounded-lg overflow-hidden cursor-pointer relative flex items-center justify-center"
                  title="Click to zoom / inspect"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={page.dataUrl}
                    alt={`Scanned page ${idx + 1}`}
                    className="w-full h-full object-contain transition-transform duration-200"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                </div>

                {/* Quick Action Toolbar on Each Page */}
                <div className="w-full grid grid-cols-2 gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={(e) => handleRotatePage(page.id, e)}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 rounded-lg text-slate-600 flex items-center justify-center text-xs font-semibold transition-colors min-h-[36px]"
                    aria-label={`Rotate Page ${idx + 1} 90 degrees`}
                    title="Rotate 90° clockwise"
                  >
                    <RotateCw className="w-3.5 h-3.5 mr-1" />
                    <span>Rotate</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeletePage(page.id, e)}
                    className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 rounded-lg text-slate-600 flex items-center justify-center text-xs font-semibold transition-colors min-h-[36px]"
                    aria-label={`Delete Page ${idx + 1}`}
                    title="Delete page"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              </div>
            ))}

            {/* "+ Add Page" Card if under 5 */}
            {scannedPages.length < MAX_PAGES_LIMIT && (
              <button
                type="button"
                onClick={handleCameraButtonClick}
                className="aspect-[3/4] rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/40 hover:bg-blue-50/80 text-blue-700 flex flex-col items-center justify-center gap-2 transition-all p-3 group min-h-[44px]"
                aria-label={`Add page ${scannedPages.length + 1} of ${MAX_PAGES_LIMIT}`}
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-center leading-tight">
                  Add Page
                  <span className="block text-[10px] text-blue-600 font-semibold">
                    ({scannedPages.length + 1}/{MAX_PAGES_LIMIT})
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SINGLE FILE PREVIEW CARD (When uploaded via File Picker / Dropzone) */}
      {selectedFileName && scannedPages.length === 0 && (
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

      {/* FULLSCREEN MULTI-PAGE SCANNER MODAL */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0f141c] flex flex-col justify-between text-white p-2 sm:p-4 overflow-y-auto min-h-[100dvh] animate-in fade-in duration-150">
          {/* Shutter White Flash Feedback */}
          {shutterFlash && (
            <div className="absolute inset-0 z-50 bg-white/60 pointer-events-none transition-opacity duration-150" />
          )}

          {/* Modal Header */}
          <div className="shrink-0 flex items-center justify-between relative h-12 w-full max-w-lg mx-auto">
            <button
              type="button"
              onClick={handleCloseModal}
              className="w-11 h-11 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 min-h-[44px] min-w-[44px]"
              aria-label="Close scanner"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h2 className="text-sm sm:text-base font-bold text-white">Scan Document</h2>
              <span className="text-[11px] font-semibold text-cyan-400">
                {localPages.length} of {MAX_PAGES_LIMIT} pages captured
              </span>
            </div>

            {/* Done / Confirm Button */}
            {localPages.length > 0 ? (
              <button
                type="button"
                onClick={handleDoneCapturing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-full shadow-md transition-all flex items-center gap-1.5 min-h-[44px]"
                aria-label={`Done scanning ${localPages.length} pages`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Done ({localPages.length})</span>
              </button>
            ) : (
              <div className="w-11" />
            )}
          </div>

          {/* Viewfinder Center */}
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center my-1 relative w-full max-w-lg mx-auto">
            {/* Ambient Darkness / Low-Light Warning Pill */}
            {lightWarning && (
              <div
                role="alert"
                className="absolute top-2 z-40 max-w-xs sm:max-w-sm px-3.5 py-1.5 bg-amber-950/95 border border-amber-500 text-amber-200 text-xs rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                <span className="font-medium">{lightWarning}</span>
              </div>
            )}

            {/* Viewfinder Frame (Clicking screen also snaps photo) */}
            <div
              onClick={hasCameraAccess ? handleShutterCapture : undefined}
              className="relative w-full max-w-[340px] sm:max-w-md h-[40vh] sm:h-[48vh] max-h-[380px] rounded-3xl border-2 border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.35)] bg-slate-900/90 p-2 flex flex-col items-center justify-center overflow-hidden cursor-pointer group shrink"
              title={hasCameraAccess ? "Click anywhere on screen to snap photo" : undefined}
            >
              {hasCameraAccess ? (
                <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain sm:object-cover bg-black"
                  />
                  {/* Subtle scanning laser line */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.9)] animate-pulse pointer-events-none" />
                  <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/70 text-cyan-300 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                      Click screen or tap button to snap
                    </span>
                  </div>
                </div>
              ) : hasCameraAccess === false ? (
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

            {/* Instruction pill */}
            <div className="mt-2 shrink-0 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-950/90 border border-teal-500/50 text-teal-300 text-xs font-bold tracking-wide shadow-md">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>
                {localPages.length >= MAX_PAGES_LIMIT
                  ? "Maximum 5 pages reached. Tap Done to proceed."
                  : `Hold steady. Snap Page ${localPages.length + 1} of ${MAX_PAGES_LIMIT} (or press Space).`}
              </span>
            </div>
          </div>

          {/* IN-CAMERA MULTI-PAGE THUMBNAIL TRAY */}
          {localPages.length > 0 && (
            <div className="shrink-0 max-w-md mx-auto w-full my-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 shadow-xl">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5 px-1">
                <span>Captured Pages ({localPages.length}/{MAX_PAGES_LIMIT})</span>
                <span className="text-cyan-400">Tap to inspect & rotate</span>
              </div>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                {localPages.map((page, idx) => (
                  <div
                    key={page.id}
                    className="relative flex-shrink-0 w-14 h-18 bg-black rounded-lg overflow-hidden border border-slate-600 shadow-sm group cursor-pointer"
                    onClick={() => setInspectingPage(page)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={page.dataUrl}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-contain"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                    <div className="absolute top-1 left-1 bg-black/80 px-1 py-0.5 rounded text-[9px] font-extrabold text-white">
                      P{idx + 1}
                    </div>
                    {/* Quick Delete overlay */}
                    <button
                      type="button"
                      onClick={(e) => handleDeletePage(page.id, e)}
                      className="absolute top-1 right-1 w-5 h-5 bg-rose-600 hover:bg-rose-700 rounded-full flex items-center justify-center text-white"
                      aria-label={`Delete Page ${idx + 1}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Shutter & Controls — Sticky and Guaranteed Visible */}
          <div className="shrink-0 sticky bottom-0 z-30 flex items-center justify-around py-3 px-4 max-w-md mx-auto w-full bg-[#0f141c]/95 backdrop-blur-sm border-t border-slate-800/80 mt-auto">
            {/* Left: Gallery File Picker */}
            <button
              type="button"
              onClick={() => {
                handleCloseModal();
                fileInputRef.current?.click();
              }}
              className="min-h-[44px] min-w-[56px] p-2 flex flex-col items-center justify-center gap-1 text-slate-300 hover:text-white text-xs font-medium focus:outline-none"
              aria-label="Open document file gallery"
            >
              <ImageIcon className="w-5 h-5 stroke-[1.8]" />
              <span>Gallery</span>
            </button>

            {/* Center: Large High-Visibility Shutter Capture Button */}
            <button
              type="button"
              disabled={localPages.length >= MAX_PAGES_LIMIT}
              onClick={handleShutterCapture}
              className={`w-20 h-20 rounded-full border-4 p-1 flex items-center justify-center transition-all active:scale-95 focus:outline-none focus:ring-4 shadow-2xl min-h-[50px] min-w-[50px] ${
                localPages.length >= MAX_PAGES_LIMIT
                  ? "border-slate-700 opacity-50 cursor-not-allowed bg-slate-800"
                  : "border-white hover:border-cyan-400 bg-slate-800 focus:ring-cyan-400 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
              }`}
              aria-label={
                localPages.length >= MAX_PAGES_LIMIT
                  ? "Page limit reached"
                  : `Capture Page ${localPages.length + 1} of ${MAX_PAGES_LIMIT}`
              }
              title="Snap photo (or press Spacebar)"
            >
              <div
                className={`w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-lg transition-colors ${
                  localPages.length >= MAX_PAGES_LIMIT
                    ? "bg-slate-700 text-slate-400 text-[10px] font-bold"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                <Camera className="w-6 h-6 stroke-[2.2]" />
                <span className="text-[10px] font-extrabold uppercase tracking-tight mt-0.5">
                  {localPages.length >= MAX_PAGES_LIMIT ? "Full" : `Snap ${localPages.length + 1}`}
                </span>
              </div>
            </button>

            {/* Right: Flash Toggle */}
            <button
              type="button"
              onClick={toggleFlash}
              className={`min-h-[44px] min-w-[56px] p-2 flex flex-col items-center justify-center gap-1 text-xs font-medium focus:outline-none ${
                isFlashActive ? "text-amber-400 font-bold" : "text-slate-300 hover:text-white"
              }`}
              aria-label={isFlashActive ? "Turn flash off" : "Turn flash on"}
            >
              <Flashlight className="w-5 h-5 stroke-[1.8]" />
              <span>{isFlashActive ? "Flash On" : "Flash"}</span>
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN PAGE INSPECTOR & ROTATION MODAL */}
      {inspectingPage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-150"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white">
            <span className="text-sm font-bold">
              Inspecting Page ({localPages.findIndex((p) => p.id === inspectingPage.id) + 1} of {localPages.length})
            </span>
            <button
              type="button"
              onClick={() => setInspectingPage(null)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close page preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Image with Applied Rotation */}
          <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={inspectingPage.dataUrl}
              alt="Inspecting scanned page"
              className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl transition-transform duration-200"
              style={{ transform: `rotate(${inspectingPage.rotation}deg)` }}
            />
          </div>

          {/* Bottom Toolbar: Rotate 90° & Delete */}
          <div className="flex items-center justify-center gap-4 max-w-sm mx-auto w-full pt-2">
            <button
              type="button"
              onClick={() => handleRotatePage(inspectingPage.id)}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 border border-slate-600 transition-colors min-h-[44px]"
              aria-label="Rotate image 90 degrees clockwise"
            >
              <RotateCw className="w-4 h-4 text-cyan-400" />
              <span>Rotate 90° ({inspectingPage.rotation}°)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDeletePage(inspectingPage.id)}
              className="py-3 px-4 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-colors min-h-[44px]"
              aria-label="Delete this page"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* GRANULAR PERMISSION CONSENT MODAL (Contextual: Camera vs Files) */}
      <PermissionDialog
        type={activePermissionType}
        isOpen={isPermissionDialogOpen}
        onPermissionChange={handlePermissionDecision}
        onClose={() => setIsPermissionDialogOpen(false)}
      />
    </div>
  );
};
