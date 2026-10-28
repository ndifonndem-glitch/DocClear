"use client";

import React, { useState, useEffect } from "react";
import { Camera, FolderOpen, ShieldCheck, Check, X } from "lucide-react";

export type PermissionType = "camera" | "storage";
export type PermissionStatus = "undecided" | "granted" | "denied";

export interface PermissionDialogProps {
  type?: PermissionType;
  isOpen?: boolean;
  onPermissionChange?: (status: PermissionStatus, type: PermissionType) => void;
  onClose?: () => void;
}

export const PermissionDialog: React.FC<PermissionDialogProps> = ({
  type = "camera",
  isOpen = false,
  onPermissionChange,
  onClose,
}) => {
  const [show, setShow] = useState<boolean>(false);
  const [activeType, setActiveType] = useState<PermissionType>(type);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);

  // Synchronize when parent opens or changes type
  useEffect(() => {
    setShow(isOpen);
    setActiveType(type);
  }, [isOpen, type]);

  // Request native browser camera stream
  const triggerNativeCamera = async (): Promise<boolean> => {
    if (
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    ) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
        // Immediately release stream tracks
        stream.getTracks().forEach((track) => track.stop());
        return true;
      } catch (err) {
        console.warn("Browser camera access denied:", err);
        return false;
      }
    }
    return false;
  };

  const handleAllow = async () => {
    setIsRequesting(true);

    if (activeType === "camera") {
      const granted = await triggerNativeCamera();
      const status: PermissionStatus = granted ? "granted" : "denied";

      try {
        localStorage.setItem("docclear_perm_camera", status);
      } catch {
        // ignore quota errors
      }

      setIsRequesting(false);
      setShow(false);

      window.dispatchEvent(
        new CustomEvent("docclear-permission-updated", { detail: { camera: status } })
      );

      onPermissionChange?.(status, "camera");
      onClose?.();
    } else {
      try {
        localStorage.setItem("docclear_perm_storage", "granted");
      } catch {
        // ignore
      }

      setIsRequesting(false);
      setShow(false);

      window.dispatchEvent(
        new CustomEvent("docclear-permission-updated", { detail: { storage: "granted" } })
      );

      onPermissionChange?.("granted", "storage");
      onClose?.();
    }
  };

  const handleDeny = () => {
    const key = activeType === "camera" ? "docclear_perm_camera" : "docclear_perm_storage";
    try {
      localStorage.setItem(key, "denied");
    } catch {
      // ignore
    }

    setShow(false);

    window.dispatchEvent(
      new CustomEvent("docclear-permission-updated", { detail: { [activeType]: "denied" } })
    );

    onPermissionChange?.("denied", activeType);
    onClose?.();
  };

  if (!show) return null;

  const isCamera = activeType === "camera";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="permission-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-[340px] sm:max-w-[370px] bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden p-6 text-center animate-in zoom-in-95 duration-150 flex flex-col items-center">
        {/* Modern App Icon Header */}
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-2xs">
          {isCamera ? (
            <Camera className="w-7 h-7 stroke-[2]" aria-hidden="true" />
          ) : (
            <FolderOpen className="w-7 h-7 stroke-[2]" aria-hidden="true" />
          )}
        </div>

        {/* Title */}
        <h2 id="permission-dialog-title" className="text-slate-900 text-lg font-bold tracking-tight">
          {isCamera ? "Use your camera?" : "Access your documents?"}
        </h2>

        {/* Clear, relevant description without testing jargon */}
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          {isCamera
            ? "DocClear needs camera access to scan and convert your documents into plain English."
            : "DocClear needs storage access to upload and simplify PDF, Word, or image documents."}
        </p>

        {/* Privacy badge */}
        <div className="mt-3.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Processed on your device</span>
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-6 space-y-2">
          {/* Primary Action: Allow */}
          <button
            type="button"
            disabled={isRequesting}
            onClick={handleAllow}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-2xl shadow-xs transition-all min-h-[46px] flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            {isRequesting ? (
              <span>Connecting...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{isCamera ? "Allow Camera" : "Allow Access"}</span>
              </>
            )}
          </button>

          {/* Secondary Action: Don't Allow */}
          <button
            type="button"
            disabled={isRequesting}
            onClick={handleDeny}
            className="w-full py-2.5 text-center text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-2xl transition-colors min-h-[40px] focus:outline-none"
          >
            Don&apos;t Allow
          </button>
        </div>
      </div>
    </div>
  );
};
