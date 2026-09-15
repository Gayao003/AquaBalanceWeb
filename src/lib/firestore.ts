"use client";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signInAdmin(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  // Verify the user is actually an admin
  const profile = await getUserProfile(credential.user.uid);
  if (!profile || profile.role !== "admin") {
    await firebaseSignOut(auth);
    throw new Error("Access denied. This portal is for administrators only.");
  }

  return credential.user;
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function sendUserPasswordReset(email: string) {
  return sendPasswordResetEmail(auth, email);
}

// ─── User Management ─────────────────────────────────────────────────────────

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  role: "patient" | "nurse" | "admin";
  volumeUnit?: string;
  enableNotifications?: boolean;
  isArchived?: boolean;
  assignedNurseIds?: string[];
  assignedPatientIds?: string[];
  isScheduleLocked?: boolean;
  dailyGoalMl?: number;
  age?: number;
  createdAt?: string;
  lastUpdated?: string;
}

export interface HealthProfile {
  id: string;
  userId: string;
  conditions: string[];
  prescribedDailyFluidLimitMl?: number;
  isEnabled: boolean;
  messageTone?: string;
  updatedAt?: string;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;
  return { userId: snap.id, ...snap.data() } as UserProfile;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ userId: d.id, ...d.data() } as UserProfile));
}

export async function updateUserRole(
  userId: string,
  role: "patient" | "nurse" | "admin"
) {
  await updateDoc(doc(db, "users", userId), {
    role,
    lastUpdated: new Date().toISOString(),
  });
}

export async function toggleArchiveUser(userId: string, isArchived: boolean) {
  await updateDoc(doc(db, "users", userId), {
    isArchived,
    lastUpdated: new Date().toISOString(),
  });
}

export async function assignNursesToPatient(
  patientId: string,
  nurseIds: string[],
  allNurses: UserProfile[]
) {
  // 1. Update the patient document with assigned nurse IDs
  await updateDoc(doc(db, "users", patientId), {
    assignedNurseIds: nurseIds,
    lastUpdated: new Date().toISOString(),
  });

  // 2. Synchronize assignedPatientIds on each nurse document
  for (const nurse of allNurses) {
    const isAssigned = nurseIds.includes(nurse.userId);
    const currentPatients = Array.isArray(nurse.assignedPatientIds)
      ? nurse.assignedPatientIds
      : [];
    const alreadyHas = currentPatients.includes(patientId);

    if (isAssigned && !alreadyHas) {
      await updateDoc(doc(db, "users", nurse.userId), {
        assignedPatientIds: [...currentPatients, patientId],
        lastUpdated: new Date().toISOString(),
      });
    } else if (!isAssigned && alreadyHas) {
      await updateDoc(doc(db, "users", nurse.userId), {
        assignedPatientIds: currentPatients.filter((id) => id !== patientId),
        lastUpdated: new Date().toISOString(),
      });
    }
  }
}

export async function getHealthProfilesForUser(
  userId: string
): Promise<HealthProfile[]> {
  const q = query(
    collection(db, "health_profiles"),
    orderBy("updatedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs
    .filter((d) => d.data().userId === userId)
    .map((d) => ({ id: d.id, ...d.data() } as HealthProfile));
}

export async function updatePrescribedLimit(
  healthProfileId: string,
  limitMl: number | null
) {
  await updateDoc(doc(db, "health_profiles", healthProfileId), {
    prescribedDailyFluidLimitMl: limitMl,
    updatedAt: new Date().toISOString(),
  });
}

// ─── Intake & Output Logs (Client-side sorted, NO composite index required) ────

export interface IntakeRecord {
  id: string;
  userId: string;
  volume: number;
  fluidType: string;
  timestamp: string;
  shift?: string;
  notes?: string;
}

export interface OutputRecord {
  id: string;
  userId: string;
  volume: number;
  outputType: string;
  timestamp: string;
  shift?: string;
  notes?: string;
}

export async function getUserIntakeEntries(userId: string): Promise<IntakeRecord[]> {
  try {
    const q = query(
      collection(db, "intake_entries"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as IntakeRecord));
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items.slice(0, 50);
  } catch (e) {
    console.error("Error fetching intake entries:", e);
    return [];
  }
}

export async function getUserOutputEntries(userId: string): Promise<OutputRecord[]> {
  try {
    const q = query(
      collection(db, "output_entries"),
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as OutputRecord));
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items.slice(0, 50);
  } catch (e) {
    console.error("Error fetching output entries:", e);
    return [];
  }
}

// ─── System Settings ─────────────────────────────────────────────────────────

export interface SystemSettings {
  defaultFluidLimitMl: number;
  warningThresholdPercent: number;
  maintenanceMode: boolean;
  systemAnnouncement: string;
  updatedAt?: string;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const snap = await getDoc(doc(db, "system_settings", "global"));
    if (!snap.exists()) {
      return {
        defaultFluidLimitMl: 2000,
        warningThresholdPercent: 80,
        maintenanceMode: false,
        systemAnnouncement: "",
      };
    }
    return snap.data() as SystemSettings;
  } catch (e) {
    console.error("Error reading system settings:", e);
    return {
      defaultFluidLimitMl: 2000,
      warningThresholdPercent: 80,
      maintenanceMode: false,
      systemAnnouncement: "",
    };
  }
}

export async function updateSystemSettings(settings: Partial<SystemSettings>) {
  await setDoc(
    doc(db, "system_settings", "global"),
    {
      ...settings,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
