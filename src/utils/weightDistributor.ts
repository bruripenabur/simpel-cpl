import { AssessmentComponent, CPMKItem, UnitClass } from '../types/obe';

/**
 * Intelligent and Mathematically Balanced Weight Matrix Distributor
 * 
 * Takes assessment components (with row target weights) and CPMKs (with column target weights),
 * and distributes integer percentage weights (preferably in multiples of 5%) such that:
 * 1. For every component i: sum_j M[i][j] === component[i].weight
 * 2. For every CPMK j: sum_i M[i][j] === cpmk[j].weight
 * 3. Grand total of the matrix is exactly 100%
 */
export function autoDistributeAssessmentWeights(
  components: AssessmentComponent[],
  cpmks: CPMKItem[],
  randomize: boolean = false
): AssessmentComponent[] {
  if (!components.length || !cpmks.length) return components;

  const rowWeights = components.map((c) => Math.round(c.weight || 0));
  const colWeights = cpmks.map((c) => Math.round(c.weight || 0));

  const totalRow = rowWeights.reduce((a, b) => a + b, 0);
  const totalCol = colWeights.reduce((a, b) => a + b, 0);

  // If totals are invalid, fallback gracefully
  if (totalRow === 0 || totalCol === 0) return components;

  const nRows = rowWeights.length;
  const nCols = colWeights.length;
  const matrix: number[][] = Array.from({ length: nRows }, () => Array(nCols).fill(0));

  // Determine step size: prefer 5% step if all targets are multiples of 5
  const isMultipleOf5 =
    rowWeights.every((w) => w % 5 === 0) && colWeights.every((w) => w % 5 === 0);
  const step = isMultipleOf5 ? 5 : 1;

  const targetRows = rowWeights.map((w) => Math.round(w / step));
  const targetCols = colWeights.map((w) => Math.round(w / step));
  const totalSteps = 100 / step;

  const curRowSums = Array(nRows).fill(0);
  const curColSums = Array(nCols).fill(0);

  // 1. Initial distribution (Proportional with optional random perturbation)
  for (let i = 0; i < nRows; i++) {
    for (let j = 0; j < nCols; j++) {
      let ideal = (targetRows[i] * targetCols[j]) / totalSteps;
      if (randomize) {
        // Add random jitter between -1.2 and +1.2
        ideal += (Math.random() * 2.4 - 1.2);
      }
      const rounded = Math.max(0, Math.round(ideal));
      matrix[i][j] = rounded;
      curRowSums[i] += rounded;
      curColSums[j] += rounded;
    }
  }

  // 2. Adjust row sums to match targetRows
  for (let i = 0; i < nRows; i++) {
    let diff = targetRows[i] - curRowSums[i];
    let safetyCounter = 0;
    while (diff !== 0 && safetyCounter < 100) {
      safetyCounter++;
      if (diff > 0) {
        // Find column with least surplus or highest deficit
        let bestJ = 0;
        let bestVal = Infinity;
        for (let j = 0; j < nCols; j++) {
          const score = curColSums[j] - targetCols[j];
          if (score < bestVal) {
            bestVal = score;
            bestJ = j;
          }
        }
        matrix[i][bestJ]++;
        curRowSums[i]++;
        curColSums[bestJ]++;
        diff--;
      } else {
        // Decrease from a column with positive value
        let bestJ = 0;
        let bestVal = -Infinity;
        for (let j = 0; j < nCols; j++) {
          if (matrix[i][j] > 0) {
            const score = curColSums[j] - targetCols[j];
            if (score > bestVal) {
              bestVal = score;
              bestJ = j;
            }
          }
        }
        matrix[i][bestJ]--;
        curRowSums[i]--;
        curColSums[bestJ]--;
        diff++;
      }
    }
  }

  // 3. Balance column sums while strictly preserving row sums
  let outerSafety = 0;
  for (let j = 0; j < nCols; j++) {
    let colDiff = targetCols[j] - curColSums[j];
    while (colDiff !== 0 && outerSafety < 500) {
      outerSafety++;
      if (colDiff > 0) {
        // Need to add to col j, subtract from some col k (k != j) where curColSums[k] > targetCols[k]
        let found = false;
        for (let k = 0; k < nCols; k++) {
          if (k === j || curColSums[k] <= targetCols[k]) continue;
          for (let i = 0; i < nRows; i++) {
            if (matrix[i][k] > 0) {
              matrix[i][k]--;
              matrix[i][j]++;
              curColSums[k]--;
              curColSums[j]++;
              colDiff--;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (!found) break;
      } else {
        // Need to subtract from col j, add to some col k where curColSums[k] < targetCols[k]
        let found = false;
        for (let k = 0; k < nCols; k++) {
          if (k === j || curColSums[k] >= targetCols[k]) continue;
          for (let i = 0; i < nRows; i++) {
            if (matrix[i][j] > 0) {
              matrix[i][j]--;
              matrix[i][k]++;
              curColSums[j]--;
              curColSums[k]++;
              colDiff++;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (!found) break;
      }
    }
  }

  // 4. If randomize is requested, perform random balanced 2x2 swaps to create natural variation
  if (randomize && nRows > 1 && nCols > 1) {
    const swapIterations = Math.min(25, nRows * nCols * 2);
    for (let it = 0; it < swapIterations; it++) {
      const r1 = Math.floor(Math.random() * nRows);
      const r2 = Math.floor(Math.random() * nRows);
      const c1 = Math.floor(Math.random() * nCols);
      const c2 = Math.floor(Math.random() * nCols);

      if (r1 !== r2 && c1 !== c2) {
        if (matrix[r1][c1] > 0 && matrix[r2][c2] > 0) {
          matrix[r1][c1]--;
          matrix[r2][c2]--;
          matrix[r1][c2]++;
          matrix[r2][c1]++;
        }
      }
    }
  }

  // Map result back to AssessmentComponent[]
  return components.map((comp, compIdx) => {
    const nextCpmkWeights: Record<string, number> = {};
    cpmks.forEach((cpmk, cpmkIdx) => {
      const val = matrix[compIdx][cpmkIdx] * step;
      if (val > 0) {
        nextCpmkWeights[cpmk.code] = val;
      }
    });
    return {
      ...comp,
      cpmkWeights: nextCpmkWeights,
    };
  });
}

/**
 * Generates realistic randomized student component averages for Unit Classes
 * while strictly preserving each unit's studentCount intact.
 */
export function autoGenerateClassAverages(
  components: AssessmentComponent[],
  unitClasses: UnitClass[]
): UnitClass[] {
  // Realistic university academic score base templates (mean ~78 - 83)
  const scorePresets = [
    [78.5, 82.0, 76.4, 80.0, 84.5, 81.2],
    [80.0, 78.5, 82.4, 77.8, 83.0, 79.5],
    [76.8, 81.5, 79.0, 82.5, 78.0, 80.4],
    [82.2, 79.0, 77.5, 81.0, 85.0, 78.8],
  ];

  return unitClasses.map((unit, unitIdx) => {
    const preset = scorePresets[unitIdx % scorePresets.length];
    const newAverages: Record<string, number> = {};

    components.forEach((comp, compIdx) => {
      // Pick score from preset with slight random perturbation (±1.5)
      const base = preset[compIdx % preset.length];
      const delta = (Math.random() * 3 - 1.5);
      const score = Math.max(68, Math.min(94, Number((base + delta).toFixed(1))));
      newAverages[comp.id] = score;
    });

    return {
      ...unit,
      componentAverages: newAverages,
      // studentCount is preserved strictly!
    };
  });
}
