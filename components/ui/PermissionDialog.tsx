"use client";

import React, { useState, useEffect } from "react";

export type PermissionStatus = "undecided" | "granted" | "denied";

interface PermissionDialogProps {
  onPermissionChange?: (status: PermissionStatus) => void;
  forceOpen?: boolean;
  onClose?: () => void;
}

export const PermissionDialog: React.FC<PermissionDialogProps> = ({
  onPermissionChange,
  forceOpen = false,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("undecided");

  useEffect(() => {
    // Check if user already granted or denied permission
    const saved = localStorage.getItem("docclear_device_permission") as PermissionStatus | null;
    if (saved) {
      setPermissionStatus(saved);
      if (onPermissionChange) onPermissionChange(saved);
    }

    // Open if forceOpen is true, or if no decision has been saved yet
    if (forceOpen) {
      setIsOpen(true);
    } else if (!saved) {
      // Short delay on initial mount for natural mobile app launch feel
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const handleAllow = () => {
    localStorage.setItem("docclear_device_permission", "granted");
    setPermissionStatus("granted");
    setIsOpen(false);
    if (onPermissionChange) onPermissionChange("granted");
    if (onClose) onClose();
  };

  const handleDeny = () => {
    localStorage.setItem("docclear_device_permission", "denied");
    setPermissionStatus("denied");
    setIsOpen(false);
    if (onPermissionChange) onPermissionChange("denied");
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="permission-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] animate-in fade-in duration-200"
    >
      <div className="w-[310px] sm:w-[340px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all scale-100">
        {/* Content Header */}
        <div className="pt-7 pb-6 px-6 flex flex-col items-center text-center">
          {/* Blue folder icon matching Android/Mobile OS design */}
          <div className="mb-4 text-blue-600 dark:text-blue-500" aria-hidden="true">
            <svg
              className="w-10 h-10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            </svg>
          </div>

          <h2
            id="permission-dialog-title"
            className="text-slate-900 dark:text-slate-100 text-[17px] sm:text-[18px] font-medium leading-snug tracking-tight"
          >
            Allow <span className="font-bold">DocClear</span> to access photos, media, and files on your device?
          </h2>
        </div>

        {/* Action: Allow */}
        <div className="border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleAllow}
            className="w-full py-3.5 text-center text-[16px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-slate-800/80 active:bg-blue-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            Allow
          </button>
        </div>

        {/* Action: Deny */}
        <div className="border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDeny}
            className="w-full py-3.5 text-center text-[16px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-slate-800/80 active:bg-blue-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  );
};
