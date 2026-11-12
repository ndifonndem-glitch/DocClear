"use client";

import React, { useState, useEffect } from "react";
import {
  Camera,
  Volume2,
  Smartphone,
  Vibrate,
  Wifi,
  SunMedium,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Compass,
} from "lucide-react";

type SensorStatus = "available" | "unavailable" | "needs_permission";

interface SensorCard {
  id: string;
  name: string;
  category: string;
  status: SensorStatus;
  statusLabel?: string;
  details: string;
  api: string;
  icon: any;
  testAction?: {
    label: string;
    onClick: () => void;
  };
}

export const SensorDiagnostics: React.FC = () => {
  const [sensors, setSensors] = useState<SensorCard[]>([]);
  const [isSecure, setIsSecure] = useState<boolean>(true);
  const [orientationData, setOrientationData] = useState<{ beta: number; gamma: number } | null>(null);
  const [iosPermissionNeeded, setIosPermissionNeeded] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Auto-detected device details
  const [deviceInfo, setDeviceInfo] = useState({
    device: "Detecting...",
    os: "Detecting...",
    browser: "Detecting...",
  });

  // Device environment detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSecure(window.isSecureContext ?? false);

      const ua = navigator.userAgent;
      let dev = "Desktop PC";
      let os = "Desktop OS";
      let browser = "Web Browser";

      // Device & OS
      if (/iPhone/i.test(ua)) {
        dev = "Apple iPhone";
        const m = ua.match(/OS (\d+[_\d]*)/);
        os = m ? `iOS ${m[1].replace(/_/g, ".")}` : "iOS";
      } else if (/iPad/i.test(ua)) {
        dev = "Apple iPad";
        const m = ua.match(/OS (\d+[_\d]*)/);
        os = m ? `iPadOS ${m[1].replace(/_/g, ".")}` : "iPadOS";
      } else if (/Android/i.test(ua)) {
        const mOs = ua.match(/Android\s([0-9\.]+)/i);
        os = mOs ? `Android ${mOs[1]}` : "Android";
        const mModel = ua.match(/\((.*?)\)/);
        if (mModel && mModel[1]) {
          const parts = mModel[1].split(";");
          const candidate = parts[parts.length - 1].trim();
          // Chrome User-Agent Reduction replaces device models with the letter "K"
          if (candidate === "K" || candidate.length <= 1) {
            dev = "Android Phone";
          } else {
            dev = candidate.replace("Build", "").trim() || "Android Phone";
          }
        } else {
          dev = "Android Phone";
        }
      } else if (/Windows NT/i.test(ua)) {
        const m = ua.match(/Windows NT\s([0-9\.]+)/i);
        os = m ? `Windows NT ${m[1]}` : "Windows";
        dev = "Windows PC";
      } else if (/Macintosh/i.test(ua)) {
        os = "macOS";
        dev = "Mac";
      }

      // Browser
      if (/Edg\/([0-9\.]+)/i.test(ua)) {
        browser = `Edge ${RegExp.$1.split(".")[0]}`;
      } else if (/Chrome\/([0-9\.]+)/i.test(ua)) {
        browser = `Chrome ${RegExp.$1.split(".")[0]}`;
      } else if (/Version\/([0-9\.]+).*Safari/i.test(ua)) {
        browser = `Safari ${RegExp.$1.split(".")[0]}`;
      } else if (/Firefox\/([0-9\.]+)/i.test(ua)) {
        browser = `Firefox ${RegExp.$1.split(".")[0]}`;
      }

      setDeviceInfo({ device: dev, os, browser });

      // Request High-Entropy Client Hints to bypass Chrome's User-Agent Reduction
      // (Chrome freezes User-Agent to "Android 10; K" for anti-fingerprinting privacy)
      const nav = navigator as any;
      if (nav.userAgentData && typeof nav.userAgentData.getHighEntropyValues === "function") {
        nav.userAgentData
          .getHighEntropyValues(["model", "platformVersion", "platform"])
          .then((hints: { model?: string; platformVersion?: string; platform?: string }) => {
            setDeviceInfo((prev) => {
              let trueOs = prev.os;
              let trueDev = prev.device;

              const platformName = hints.platform || nav.userAgentData.platform || "";
              const isAndroid = /Android/i.test(platformName) || /Android/i.test(prev.os);
              const isWindows = /Windows/i.test(platformName) || /Windows/i.test(prev.os);

              if (hints.platformVersion) {
                const major = hints.platformVersion.split(".")[0];
                const majorNum = Number(major);
                if (isAndroid && !isNaN(majorNum) && majorNum > 0) {
                  trueOs = `Android ${major}`;
                } else if (isWindows && !isNaN(majorNum)) {
                  trueOs = majorNum >= 13 ? "Windows 11" : "Windows 10";
                }
              }

              if (isAndroid && hints.model && hints.model !== "K" && hints.model.trim().length > 0) {
                trueDev = hints.model.trim();
              }

              return {
                ...prev,
                os: trueOs,
                device: trueDev,
              };
            });
          })
          .catch(() => {
            // Silently retain fallback device and OS
          });
      }
    }
  }, []);

  // Motion Sensor (DeviceOrientation) listener
  const startMotion = () => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        setOrientationData({
          beta: Math.round(e.beta),
          gamma: Math.round(e.gamma),
        });
      }
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  };

  const requestIosMotion = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm === "granted") {
          setIosPermissionNeeded(false);
          startMotion();
        } else {
          setFeedbackMessage("Motion permission was denied in Safari settings.");
          setTimeout(() => setFeedbackMessage(null), 3000);
        }
      } catch (e) {
        console.warn("Motion permission request error:", e);
      }
    } else {
      startMotion();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        setIosPermissionNeeded(true);
      } else {
        const cleanup = startMotion();
        return () => cleanup?.();
      }
    }
  }, []);

  // Scan hardware sensors and capabilities
  const scanSensors = async () => {
    if (typeof window === "undefined") return;

    const list: SensorCard[] = [];

    // 1. Camera Sensor
    let camStatus: SensorStatus = "unavailable";
    let camDetails = "Camera API not supported in this browser.";
    try {
      if (typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function") {
        if (!window.isSecureContext) {
          camStatus = "needs_permission";
          camDetails = "Requires secure HTTPS context.";
        } else {
          try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter((d) => d.kind === "videoinput");
            camStatus = "available";
            camDetails =
              videoInputs.length > 0
                ? `${videoInputs.length} physical camera(s) ready.`
                : "Camera API ready for scanning.";
          } catch {
            camStatus = "available";
            camDetails = "Camera API ready for scanning.";
          }
        }
      }
    } catch {
      camStatus = "unavailable";
    }
    list.push({
      id: "camera",
      name: "Camera Optical Sensor",
      category: "Vision",
      status: camStatus,
      details: camDetails,
      api: "getUserMedia()",
      icon: Camera,
    });

    // 2. Gyroscope / Motion Sensor
    let motionStatus: SensorStatus = "unavailable";
    let motionDetails = "Device orientation not supported on this device.";
    if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        motionStatus = "needs_permission";
        motionDetails = "Requires Safari permission tap.";
      } else {
        motionStatus = "available";
        motionDetails = "Active tilt detection.";
      }
    }
    list.push({
      id: "motion",
      name: "Orientation (Tilt & Pitch)",
      category: "Motion",
      status: motionStatus,
      statusLabel: orientationData ? "Live Readings" : undefined,
      details: motionDetails,
      api: "DeviceOrientationEvent",
      icon: Compass,
    });

    // 3. Ambient Light (Image-Based Darkness Assessment)
    list.push({
      id: "ambient",
      name: "Ambient Light (Darkness)",
      category: "Environment",
      status: "available",
      details: "Perceptual pixel luminance analysis active.",
      api: "Canvas Luminance (Y < 55)",
      icon: SunMedium,
    });

    // 4. Speech Synthesis Engine
    let speechStatus: SensorStatus = "unavailable";
    let speechDetails = "Speech synthesis not available.";
    if ("speechSynthesis" in window) {
      const voices = window.speechSynthesis.getVoices();
      speechStatus = "available";
      speechDetails = voices.length > 0 ? `${voices.length} voice(s) available on-device.` : "Speech engine active.";
    }
    list.push({
      id: "speech",
      name: "Speech Audio Playback",
      category: "Audio",
      status: speechStatus,
      details: speechDetails,
      api: "speechSynthesis",
      icon: Volume2,
      testAction: {
        label: "Test Voice",
        onClick: () => {
          if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance("DocClear audio playback verified.");
            u.rate = 1.0;
            window.speechSynthesis.speak(u);
            setFeedbackMessage("Playing test voice sample...");
            setTimeout(() => setFeedbackMessage(null), 3000);
          }
        },
      },
    });

    // 5. Network Connectivity
    list.push({
      id: "network",
      name: "Network Connectivity",
      category: "Network",
      status: navigator.onLine ? "available" : "unavailable",
      details: navigator.onLine ? "Online (Connected)" : "Offline (Disconnected)",
      api: "navigator.onLine",
      icon: Wifi,
    });

    // 6. Haptic Vibration Motor
    const hasVibrate = "vibrate" in navigator;
    list.push({
      id: "vibrate",
      name: "Haptic Feedback",
      category: "Tactile",
      status: hasVibrate ? "available" : "unavailable",
      details: hasVibrate ? "Haptic motor supported." : "Not supported on this browser.",
      api: "navigator.vibrate()",
      icon: Vibrate,
      testAction: hasVibrate
        ? {
            label: "Test Pulse",
            onClick: () => {
              try {
                navigator.vibrate([60, 40, 60]);
                setFeedbackMessage("Haptic pulse triggered.");
                setTimeout(() => setFeedbackMessage(null), 2500);
              } catch {
                // ignore
              }
            },
          }
        : undefined,
    });

    setSensors(list);
  };

  useEffect(() => {
    scanSensors();
  }, [orientationData]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header & Re-scan Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <span>Device Sensors & Capabilities</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status of device hardware and browser capabilities.
          </p>
        </div>

        <button
          type="button"
          onClick={scanSensors}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors self-start sm:self-auto min-h-[44px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-scan</span>
        </button>
      </div>

      {/* Device Info Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 font-medium block">Device</span>
          <span className="font-bold text-slate-900 truncate block mt-0.5" title={deviceInfo.device}>
            {deviceInfo.device}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 font-medium block">OS</span>
          <span className="font-bold text-slate-900 truncate block mt-0.5" title={deviceInfo.os}>
            {deviceInfo.os}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 font-medium block">Browser</span>
          <span className="font-bold text-slate-900 truncate block mt-0.5" title={deviceInfo.browser}>
            {deviceInfo.browser}
          </span>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-500 font-medium block">Context</span>
          <span
            className={`font-bold inline-flex items-center gap-1 mt-0.5 ${
              isSecure ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {isSecure ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>HTTPS (Secure)</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>HTTP</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Live Orientation (Tilt) Bar (when available) */}
      {iosPermissionNeeded ? (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
          <span className="text-blue-900 font-medium">Safari requires a tap to activate motion sensors:</span>
          <button
            type="button"
            onClick={requestIosMotion}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors min-h-[44px]"
          >
            Enable Motion
          </button>
        </div>
      ) : orientationData ? (
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <span className="font-semibold flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-600" />
            <span>Live Device Tilt:</span>
          </span>
          <div className="font-mono flex items-center gap-4">
            <span>
              Pitch: <strong>{orientationData.beta}°</strong>
            </span>
            <span>
              Roll: <strong>{orientationData.gamma}°</strong>
            </span>
          </div>
        </div>
      ) : null}

      {/* Clean Grid of Sensor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {sensors.map((sensor) => {
          const Icon = sensor.icon;
          return (
            <div
              key={sensor.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-2.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 text-blue-600 shrink-0 shadow-2xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{sensor.name}</h3>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">{sensor.category}</span>
                  </div>
                </div>

                {sensor.status === "available" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{sensor.statusLabel || "Available"}</span>
                  </span>
                ) : sensor.status === "needs_permission" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Permission Needed</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" />
                    <span>Not Supported</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-normal break-words">{sensor.details}</p>

              <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] min-w-0">
                <code className="text-slate-500 font-mono break-all">{sensor.api}</code>

                {sensor.testAction && (
                  <button
                    type="button"
                    onClick={sensor.testAction.onClick}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline ml-2 min-h-[44px] inline-flex items-center px-1"
                  >
                    {sensor.testAction.label}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time feedback toast */}
      {feedbackMessage && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold text-center animate-in fade-in">
          {feedbackMessage}
        </div>
      )}
    </div>
  );
};
