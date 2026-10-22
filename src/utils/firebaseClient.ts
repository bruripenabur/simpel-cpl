import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { OBEAssessmentData } from '../types/obe';

import config from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(config) : getApps()[0];

// Initialize Firestore using the specific database ID from firebase-applet-config.json
export const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

export async function saveAssessmentToFirestore(assessmentId: string, data: OBEAssessmentData, prodiId: string): Promise<boolean> {
  try {
    const docId = assessmentId || data.courseCode || 'default_assessment';
    const docRef = doc(db, 'assessments', docId);
    await setDoc(docRef, {
      ...data,
      prodiId: prodiId || data.prodiId || '86004',
      projectId: config.projectId,
      firestoreDatabaseId: config.firestoreDatabaseId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`Successfully saved assessment ${docId} to Firestore database: ${config.firestoreDatabaseId}`);
    return true;
  } catch (err) {
    console.error('Error saving assessment to Firestore:', err);
    return false;
  }
}

export async function saveAssessmentOnStage8(data: OBEAssessmentData, prodiId: string): Promise<boolean> {
  const assessmentId = data.courseCode ? `${data.prodiId || prodiId || 'prodi'}_${data.courseCode}` : 'stage8_assessment';
  return await saveAssessmentToFirestore(assessmentId, data, prodiId);
}

export async function loadAssessmentFromFirestore(assessmentId: string): Promise<OBEAssessmentData | null> {
  try {
    const docRef = doc(db, 'assessments', assessmentId || 'default_assessment');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as OBEAssessmentData;
    }
    return null;
  } catch (err) {
    console.error('Error loading from Firestore:', err);
    return null;
  }
}

export async function loadAssessmentsByProdi(prodiId: string): Promise<OBEAssessmentData[]> {
  try {
    const q = query(collection(db, 'assessments'), where('prodiId', '==', prodiId));
    const querySnapshot = await getDocs(q);
    const results: OBEAssessmentData[] = [];
    querySnapshot.forEach((doc) => {
      results.push(doc.data() as OBEAssessmentData);
    });
    return results;
  } catch (err) {
    console.error('Error querying assessments by prodi:', err);
    return [];
  }
}
