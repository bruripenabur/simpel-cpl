/**
 * Utility to enforce single primary lecturer naming across all courses and reports.
 * Per user instruction:
 * "Dr. R. A. Far-far, S. P., M. Si. diganti dengan Dr. Bruri Melky Laimeheriwa, S.Pi., M.Si."
 */

export const DEFAULT_LECTURER_NAME = 'Dr. Bruri Melky Laimeheriwa, S.Pi., M.Si.';
export const DEFAULT_LECTURER_NIP = '19880412 201504 1 002';

export function getSingleLecturerName(rawName?: string): string {
  if (!rawName || !rawName.trim()) {
    return DEFAULT_LECTURER_NAME;
  }

  const trimmed = rawName.trim();

  // If already contains Dr. Bruri or Far-far
  if (
    trimmed.toLowerCase().includes('laimeheriwa') ||
    trimmed.toLowerCase().includes('bruri') ||
    trimmed.toLowerCase().includes('far-far') ||
    trimmed.toLowerCase().includes('far far')
  ) {
    return DEFAULT_LECTURER_NAME;
  }

  // If multiple lecturers separated by comma between degrees (e.g., "Dr. A, M.Si., Dr. B, M.T.")
  // Look for secondary title indicators like ", Dr.", ", Prof.", ", Ir.", " dan ", "\n", " / ", " & "
  const splitPatterns = [
    /,\s*(?=Dr\.)/i,
    /,\s*(?=Prof\.)/i,
    /,\s*(?=Ir\.)/i,
    /\s+dan\s+/i,
    /\n+/,
    /\s*\/\s*/,
    /\s*&\s*/,
  ];

  for (const pattern of splitPatterns) {
    if (pattern.test(trimmed)) {
      const parts = trimmed.split(pattern);
      if (parts[0] && parts[0].trim().length > 3) {
        return parts[0].trim();
      }
    }
  }

  return trimmed;
}

export function getSingleLecturerNip(rawNip?: string): string {
  if (!rawNip || !rawNip.trim() || rawNip === '-') {
    return DEFAULT_LECTURER_NIP;
  }
  return rawNip.trim();
}
