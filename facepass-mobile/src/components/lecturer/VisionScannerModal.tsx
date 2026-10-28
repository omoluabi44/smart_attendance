import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Upload,
  Video,
  X,
  ScanFace,
  ShieldAlert,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
} from "lucide-react-native";
import { EphemeralMediaFile, purgeEphemeralFile } from "@/utils/ephemeralMedia";

const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

export interface VisionScannerModalProps {
  visible: boolean;
  session: any;
  onClose: () => void;
  onStartBackgroundScan: (payload: {
    mode: "photo" | "camera" | "video";
    files: EphemeralMediaFile[];
  }) => void;
}

export default function VisionScannerModal({
  visible,
  session,
  onClose,
  onStartBackgroundScan,
}: VisionScannerModalProps) {
  const [mode, setMode] = useState<"photo" | "camera" | "video">("photo");
  const [selectedFile, setSelectedFile] = useState<EphemeralMediaFile | null>(
    null
  );
  const [capturedSnapshots, setCapturedSnapshots] = useState<
    EphemeralMediaFile[]
  >([]);
  const [cameraFacing, setCameraFacing] = useState<"back" | "front">("back");
  const [errorMessage, setErrorMessage] = useState("");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  // Purge any unsubmitted temporary files when closing
  const cleanupUnsubmittedFiles = async () => {
    if (selectedFile) {
      await purgeEphemeralFile(selectedFile.uri);
    }
    for (const snap of capturedSnapshots) {
      await purgeEphemeralFile(snap.uri);
    }
    setSelectedFile(null);
    setCapturedSnapshots([]);
    setErrorMessage("");
  };

  useEffect(() => {
    if (!visible) {
      setErrorMessage("");
    }
  }, [visible]);

  const handleClose = async () => {
    await cleanupUnsubmittedFiles();
    onClose();
  };

  const handlePickPhoto = async (useCamera: boolean) => {
    setErrorMessage("");
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.92,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.92,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (selectedFile) {
          await purgeEphemeralFile(selectedFile.uri);
        }
        setSelectedFile({
          uri: asset.uri,
          fileName: asset.fileName || `group_photo_${Date.now()}.jpg`,
          mimeType: asset.mimeType || "image/jpeg",
          fileSize: asset.fileSize,
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Unable to select classroom photo.");
    }
  };

  const handlePickVideo = async (useCamera: boolean) => {
    setErrorMessage("");
    try {
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ["videos"],
            videoMaxDuration: 120,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["videos"],
            quality: 0.8,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE_BYTES) {
          await purgeEphemeralFile(asset.uri);
          setErrorMessage(
            `Video exceeds maximum allowed size (${MAX_VIDEO_SIZE_MB}MB). Please choose a shorter clip.`
          );
          return;
        }
        if (selectedFile) {
          await purgeEphemeralFile(selectedFile.uri);
        }
        setSelectedFile({
          uri: asset.uri,
          fileName: asset.fileName || `walkthrough_${Date.now()}.mp4`,
          mimeType: asset.mimeType || "video/mp4",
          fileSize: asset.fileSize,
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Unable to select classroom video.");
    }
  };

  const handleTakeLiveSnapshot = async () => {
    setErrorMessage("");
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: false,
      });
      if (photo?.uri) {
        setCapturedSnapshots((prev) => [
          ...prev,
          {
            uri: photo.uri,
            fileName: `snapshot_${Date.now()}_${prev.length + 1}.jpg`,
            mimeType: "image/jpeg",
          },
        ]);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to capture camera frame.");
    }
  };

  const removeSnapshotAt = async (idx: number) => {
    const snap = capturedSnapshots[idx];
    if (snap) {
      await purgeEphemeralFile(snap.uri);
    }
    setCapturedSnapshots((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    const filesToProcess =
      mode === "camera"
        ? capturedSnapshots
        : selectedFile
        ? [selectedFile]
        : [];

    if (filesToProcess.length === 0) {
      Alert.alert(
        "No Media Selected",
        "Please capture or select a classroom image or video first."
      );
      return;
    }

    // Hand off ephemeral files to the background S3 upload & Rekognition pipeline
    setSelectedFile(null);
    setCapturedSnapshots([]);
    onStartBackgroundScan({
      mode,
      files: filesToProcess,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-obsidian-950/85 justify-end">
        <View className="bg-obsidian-900 border-t border-slate-800 rounded-t-3xl h-[90%] overflow-hidden">
          {/* Header */}
          <View className="px-5 py-4 bg-obsidian-950 border-b border-slate-800 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/30 items-center justify-center">
                <ScanFace size={20} color="#3395FF" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    COMPUTER VISION ENGINE
                  </Text>
                  <View className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-400/30">
                    <Text className="text-[10px] font-bold text-blue-300">
                      SCOPE: CV-{session?.courseID || "COURSE"}
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-base font-bold text-white mt-0.5"
                  numberOfLines={1}
                >
                  Classroom Biometric Attendance Scanner
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700"
            >
              <X size={15} color="#CBD5E1" />
              <Text className="text-xs font-semibold text-slate-300">
                Close
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView className="flex-1 px-5 py-5">
            {/* Mode Switcher */}
            <View className="flex-row gap-2 mb-5">
              {[
                { key: "photo", label: "Group Photo", icon: Upload },
                { key: "camera", label: "Live Snapshot", icon: Camera },
                { key: "video", label: "Class Video", icon: Video },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = mode === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={async () => {
                      await cleanupUnsubmittedFiles();
                      setMode(tab.key as any);
                      if (tab.key === "camera" && !permission?.granted) {
                        requestPermission();
                      }
                    }}
                    className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 px-2 rounded-xl border ${
                      active
                        ? "bg-blue-500 border-blue-400"
                        : "bg-slate-900/90 border-slate-800"
                    }`}
                  >
                    <Icon size={15} color={active ? "#FFFFFF" : "#94A3B8"} />
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-white" : "text-slate-400"
                      }`}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {errorMessage ? (
              <View className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 flex-row items-center gap-2.5">
                <ShieldAlert size={18} color="#FB7185" />
                <Text className="text-xs text-rose-200 flex-1">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* MODE 1: GROUP PHOTO */}
            {mode === "photo" && (
              <View className="space-y-4">
                <View className="rounded-2xl border-2 border-dashed border-slate-700 bg-obsidian-950/90 p-6 items-center">
                  {selectedFile ? (
                    <View className="w-full items-center">
                      <Image
                        source={{ uri: selectedFile.uri }}
                        className="w-full h-56 rounded-xl bg-slate-900"
                        resizeMode="cover"
                      />
                      <Text className="text-xs text-blue-300 font-semibold mt-3">
                        {selectedFile.fileName}
                      </Text>
                      <Text className="text-[11px] text-emerald-400 mt-1">
                        Ephemeral cache file — auto-purges after S3 upload
                      </Text>
                    </View>
                  ) : (
                    <View className="py-6 items-center">
                      <Upload size={36} color="#3395FF" />
                      <Text className="text-sm font-semibold text-slate-200 mt-3 text-center">
                        Capture or Select Classroom Group Photo
                      </Text>
                      <Text className="text-xs text-slate-400 mt-1 text-center">
                        Supports high-resolution multi-face detection (up to 60
                        students per frame)
                      </Text>
                    </View>
                  )}

                  <View className="flex-row gap-3 mt-5 w-full">
                    <TouchableOpacity
                      onPress={() => handlePickPhoto(true)}
                      className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-blue-500"
                    >
                      <Camera size={16} color="#FFFFFF" />
                      <Text className="text-xs font-semibold text-white">
                        Take Photo
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handlePickPhoto(false)}
                      className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 border border-slate-700"
                    >
                      <ImageIcon size={16} color="#E2E8F0" />
                      <Text className="text-xs font-semibold text-slate-200">
                        Photo Library
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* MODE 2: LIVE CAMERA SNAPSHOT HUD */}
            {mode === "camera" && (
              <View className="space-y-4">
                {!permission?.granted ? (
                  <View className="p-8 rounded-2xl bg-obsidian-950 border border-slate-800 items-center">
                    <Camera size={36} color="#3395FF" />
                    <Text className="text-sm font-bold text-white mt-3">
                      Camera Permission Required
                    </Text>
                    <Text className="text-xs text-slate-400 text-center mt-1 mb-4">
                      Grant camera access to use the live biometric viewfinder
                      and capture classroom snapshots.
                    </Text>
                    <TouchableOpacity
                      onPress={requestPermission}
                      className="px-5 py-2.5 rounded-xl bg-blue-500"
                    >
                      <Text className="text-xs font-semibold text-white">
                        Enable Camera Access
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="rounded-2xl overflow-hidden border border-slate-700 bg-black h-72 relative">
                    <CameraView
                      ref={cameraRef}
                      style={{ flex: 1 }}
                      facing={cameraFacing}
                    />
                    {/* Reticle & Telemetry HUD Overlay */}
                    <View
                      pointerEvents="none"
                      className="absolute inset-4 border border-blue-400/40 rounded-xl justify-between p-3"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="px-2 py-1 rounded bg-obsidian-950/85 border border-emerald-500/40">
                          <Text className="text-[10px] font-bold text-emerald-400">
                            LIVE BIOMETRIC VIEWFINDER • {">=55x55px"}
                          </Text>
                        </View>
                        <View className="px-2 py-1 rounded bg-obsidian-950/85 border border-slate-700">
                          <Text className="text-[10px] font-bold text-blue-300">
                            {capturedSnapshots.length} QUEUED
                          </Text>
                        </View>
                      </View>
                      <View className="w-full h-0.5 bg-blue-400/50" />
                      <View className="items-center">
                        <Text className="text-[10px] text-slate-300 bg-obsidian-950/80 px-2.5 py-0.5 rounded">
                          Align student faces inside reticle & tap Capture
                          Snapshot
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {permission?.granted && (
                  <View className="flex-row items-center justify-between gap-2 mt-3">
                    <TouchableOpacity
                      onPress={() =>
                        setCameraFacing((prev) =>
                          prev === "back" ? "front" : "back"
                        )
                      }
                      className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700"
                    >
                      <RefreshCw size={14} color="#CBD5E1" />
                      <Text className="text-xs font-semibold text-slate-200">
                        Flip Lens
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleTakeLiveSnapshot}
                      className="flex-1 flex-row items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-500"
                    >
                      <Camera size={16} color="#FFFFFF" />
                      <Text className="text-xs font-semibold text-white">
                        {capturedSnapshots.length > 0
                          ? `Capture Another (${capturedSnapshots.length})`
                          : "Capture Snapshot"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {capturedSnapshots.length > 0 && (
                  <View className="p-3 rounded-xl bg-obsidian-950 border border-slate-800 mt-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-[11px] font-semibold text-blue-300 uppercase">
                        Captured Queue ({capturedSnapshots.length}{" "}
                        {capturedSnapshots.length === 1 ? "Photo" : "Photos"})
                      </Text>
                      <TouchableOpacity
                        onPress={async () => {
                          for (const s of capturedSnapshots) {
                            await purgeEphemeralFile(s.uri);
                          }
                          setCapturedSnapshots([]);
                        }}
                      >
                        <Text className="text-[11px] text-rose-400 font-semibold">
                          Clear All
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row gap-2.5">
                        {capturedSnapshots.map((snap, idx) => (
                          <View
                            key={snap.uri}
                            className="w-20 h-16 rounded-lg overflow-hidden border border-slate-700 relative"
                          >
                            <Image
                              source={{ uri: snap.uri }}
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                            <TouchableOpacity
                              onPress={() => removeSnapshotAt(idx)}
                              className="absolute top-1 right-1 p-1 rounded bg-rose-600"
                            >
                              <Trash2 size={10} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {/* MODE 3: WALKTHROUGH VIDEO */}
            {mode === "video" && (
              <View className="space-y-4">
                <View className="rounded-2xl border-2 border-dashed border-slate-700 bg-obsidian-950/90 p-6 items-center">
                  <Video size={36} color="#3395FF" />
                  <Text className="text-sm font-semibold text-slate-200 mt-3 text-center">
                    {selectedFile
                      ? selectedFile.fileName
                      : "Record or Upload Classroom Walkthrough Video"}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-1 text-center">
                    Asynchronous multi-frame face tracking across lecture rows
                    (Max {MAX_VIDEO_SIZE_MB}MB)
                  </Text>
                  {selectedFile?.fileSize ? (
                    <Text className="text-xs text-emerald-400 font-semibold mt-2">
                      {(selectedFile.fileSize / (1024 * 1024)).toFixed(1)} MB •
                      Ready for S3 Presigned Upload
                    </Text>
                  ) : null}

                  <View className="flex-row gap-3 mt-5 w-full">
                    <TouchableOpacity
                      onPress={() => handlePickVideo(true)}
                      className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-blue-500"
                    >
                      <Video size={16} color="#FFFFFF" />
                      <Text className="text-xs font-semibold text-white">
                        Record Video
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handlePickVideo(false)}
                      className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 border border-slate-700"
                    >
                      <Upload size={16} color="#E2E8F0" />
                      <Text className="text-xs font-semibold text-slate-200">
                        Select Video
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <View className="mt-6 pb-8">
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={
                  mode === "camera"
                    ? capturedSnapshots.length === 0
                    : !selectedFile
                }
                className={`w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 ${
                  (
                    mode === "camera"
                      ? capturedSnapshots.length === 0
                      : !selectedFile
                  )
                    ? "bg-slate-800"
                    : "bg-blue-500"
                }`}
              >
                <ScanFace size={18} color="#FFFFFF" />
                <Text className="text-sm font-bold text-white">
                  {mode === "camera" && capturedSnapshots.length > 1
                    ? `Process ${capturedSnapshots.length} Classroom Snapshots`
                    : "Run Biometric Attendance Scan"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
