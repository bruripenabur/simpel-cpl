import { OBEAssessmentData } from '../types/obe';

// DISABLED: Built-in Firebase/Firestore database is turned off per user request.
// All database persistence is routed to Supabase.

export async function saveAssessmentToFirestore(_assessmentId: string, _data: OBEAssessmentData, _prodiId: string): Promise<boolean> {
  console.warn('Built-in Firebase database is disabled on frontend. Use Supabase.');
  return false;
}

export async function saveAssessmentOnStage8(_data: OBEAssessmentData, _prodiId: string): Promise<boolean> {
  return false;
}

export async function loadAssessmentFromFirestore(_assessmentId: string): Promise<OBEAssessmentData | null> {
  return null;
}

export async function loadAssessmentsByProdi(_prodiId: string): Promise<OBEAssessmentData[]> {
  return [];
}
