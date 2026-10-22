import { CPMKCalculationResult, CPLCalculationResult } from '../types/obe';

/**
 * Deterministic Canvas-based Chart Renderer for Academic Reports
 * Generates crisp, colorful high-resolution PNG data URLs (2x retina scale)
 * that embed reliably into both jsPDF and DOCX without relying on DOM capture.
 */

export function generateCPMKBarChartImage(
  cpmkResults: CPMKCalculationResult[],
  targetBenchmark: number = 75.0
): string {
  const canvas = document.createElement('canvas');
  const width = 1000;
  const height = 480;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Border card
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Header Title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText(
    `Grafik Capaian Tiap CPMK vs Target ${targetBenchmark.toFixed(2)}%`,
    40,
    50
  );

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('Standar Evaluasi OBE', width - 220, 50);

  // Chart plot area
  const plotLeft = 80;
  const plotTop = 90;
  const plotRight = width - 50;
  const plotBottom = height - 90;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  // Grid lines & Y-axis labels (0, 25, 50, 75, 100)
  const yTicks = [0, 25, 50, 75, 100];
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  ctx.font = '14px Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'right';

  yTicks.forEach((tick) => {
    const yPos = plotBottom - (tick / 100) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(plotLeft, yPos);
    ctx.lineTo(plotRight, yPos);
    ctx.stroke();

    ctx.fillText(`${tick}`, plotLeft - 12, yPos + 5);
  });

  // Target Reference Line (Red Dashed)
  const targetY = plotBottom - (targetBenchmark / 100) * plotHeight;
  ctx.save();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(plotLeft, targetY);
  ctx.lineTo(plotRight, targetY);
  ctx.stroke();
  ctx.restore();

  // Target label
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Target: ${targetBenchmark.toFixed(0)}%`, width / 2, targetY - 8);

  // Draw Bars for each CPMK
  const count = Math.max(1, cpmkResults.length);
  const slotWidth = plotWidth / count;
  const barWidth = Math.min(85, slotWidth * 0.52);

  if (cpmkResults.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Belum ada data CPMK untuk ditampilkan', width / 2, height / 2);
  } else {
    cpmkResults.forEach((c, idx) => {
      const xCenter = plotLeft + idx * slotWidth + slotWidth / 2;
      const barLeft = xCenter - barWidth / 2;
      const score = Math.max(0, Math.min(100, c.capaianAkhir));
      const barHeight = (score / 100) * plotHeight;
      const barTop = plotBottom - barHeight;

      const isAchieved = c.capaianAkhir >= targetBenchmark;

      // Bar Color: Emerald Green if achieved, Vibrant Rose if unachieved
      ctx.fillStyle = isAchieved ? '#10b981' : '#f43f5e';
      ctx.beginPath();
      // Rounded top
      const radius = 6;
      ctx.moveTo(barLeft, plotBottom);
      ctx.lineTo(barLeft, barTop + radius);
      ctx.quadraticCurveTo(barLeft, barTop, barLeft + radius, barTop);
      ctx.lineTo(barLeft + barWidth - radius, barTop);
      ctx.quadraticCurveTo(barLeft + barWidth, barTop, barLeft + barWidth, barTop + radius);
      ctx.lineTo(barLeft + barWidth, plotBottom);
      ctx.closePath();
      ctx.fill();

      // Value text on top of bar
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${c.capaianAkhir.toFixed(2)}%`, xCenter, barTop - 8);

    // X-axis label
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillText(c.cpmkCode, xCenter, plotBottom + 26);

    // Status text below X-axis
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillStyle = isAchieved ? '#059669' : '#e11d48';
    ctx.fillText(isAchieved ? 'TERCAPAI' : 'BELUM', xCenter, plotBottom + 45);
  });
  }

  // Base Axis Line
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plotLeft, plotBottom);
  ctx.lineTo(plotRight, plotBottom);
  ctx.stroke();

  // Y-axis line
  ctx.beginPath();
  ctx.moveTo(plotLeft, plotTop);
  ctx.lineTo(plotLeft, plotBottom);
  ctx.stroke();

  // Legend at bottom
  ctx.textAlign = 'left';
  ctx.font = '13px Arial, sans-serif';

  // Green swatch
  ctx.fillStyle = '#10b981';
  ctx.fillRect(plotLeft + 30, height - 32, 16, 16);
  ctx.fillStyle = '#334155';
  ctx.fillText('Memenuhi Target (≥ 75%)', plotLeft + 54, height - 19);

  // Red swatch
  ctx.fillStyle = '#f43f5e';
  ctx.fillRect(plotLeft + 270, height - 32, 16, 16);
  ctx.fillStyle = '#334155';
  ctx.fillText('Belum Memenuhi Target (< 75%)', plotLeft + 294, height - 19);

  // Red dashed swatch
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(plotLeft + 560, height - 24);
  ctx.lineTo(plotLeft + 590, height - 24);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#334155';
  ctx.fillText(`Target Acuan Standar (${targetBenchmark.toFixed(0)}%)`, plotLeft + 600, height - 19);

  return canvas.toDataURL('image/jpeg', 0.82);
}

export function generateCPLBarChartImage(
  cplResults: CPLCalculationResult[],
  targetBenchmark: number = 75.0
): string {
  const canvas = document.createElement('canvas');
  const width = 1000;
  const height = 480;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Border card
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Header Title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText(
    `Grafik Agregasi Capaian CPL vs Target ${targetBenchmark.toFixed(2)}%`,
    40,
    50
  );

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('Standar Kelulusan Prodi', width - 240, 50);

  // Chart plot area
  const plotLeft = 80;
  const plotTop = 90;
  const plotRight = width - 50;
  const plotBottom = height - 90;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;

  // Grid lines & Y-axis labels
  const yTicks = [0, 25, 50, 75, 100];
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;
  ctx.font = '14px Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'right';

  yTicks.forEach((tick) => {
    const yPos = plotBottom - (tick / 100) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(plotLeft, yPos);
    ctx.lineTo(plotRight, yPos);
    ctx.stroke();

    ctx.fillText(`${tick}`, plotLeft - 12, yPos + 5);
  });

  // Target Reference Line (Red Dashed)
  const targetY = plotBottom - (targetBenchmark / 100) * plotHeight;
  ctx.save();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(plotLeft, targetY);
  ctx.lineTo(plotRight, targetY);
  ctx.stroke();
  ctx.restore();

  // Target label
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Target: ${targetBenchmark.toFixed(0)}%`, width / 2, targetY - 8);

  // Draw Bars for each CPL
  const count = Math.max(1, cplResults.length);
  const slotWidth = plotWidth / count;
  const barWidth = Math.min(95, slotWidth * 0.52);

  if (cplResults.length === 0) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 16px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Belum ada data CPL untuk ditampilkan', width / 2, height / 2);
  } else {
    cplResults.forEach((c, idx) => {
      const xCenter = plotLeft + idx * slotWidth + slotWidth / 2;
      const barLeft = xCenter - barWidth / 2;
      const score = Math.max(0, Math.min(100, c.capaianAkhir));
      const barHeight = (score / 100) * plotHeight;
      const barTop = plotBottom - barHeight;

      const isAchieved = c.capaianAkhir >= targetBenchmark;

      // Bar Color: Rich Blue (#3b82f6) if achieved, Amber (#f59e0b) if unachieved
      ctx.fillStyle = isAchieved ? '#3b82f6' : '#f59e0b';
      ctx.beginPath();
      const radius = 6;
      ctx.moveTo(barLeft, plotBottom);
      ctx.lineTo(barLeft, barTop + radius);
      ctx.quadraticCurveTo(barLeft, barTop, barLeft + radius, barTop);
      ctx.lineTo(barLeft + barWidth - radius, barTop);
      ctx.quadraticCurveTo(barLeft + barWidth, barTop, barLeft + barWidth, barTop + radius);
      ctx.lineTo(barLeft + barWidth, plotBottom);
      ctx.closePath();
      ctx.fill();

      // Value text on top of bar
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${c.capaianAkhir.toFixed(2)}%`, xCenter, barTop - 8);

      // X-axis label
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.fillText(c.cplCode, xCenter, plotBottom + 26);

      // Status text below X-axis
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillStyle = isAchieved ? '#2563eb' : '#d97706';
      ctx.fillText(isAchieved ? 'TERCAPAI' : 'PRIORITAS', xCenter, plotBottom + 45);
    });
  }

  // Base Axis Line
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plotLeft, plotBottom);
  ctx.lineTo(plotRight, plotBottom);
  ctx.stroke();

  // Y-axis line
  ctx.beginPath();
  ctx.moveTo(plotLeft, plotTop);
  ctx.lineTo(plotLeft, plotBottom);
  ctx.stroke();

  // Legend at bottom
  ctx.textAlign = 'left';
  ctx.font = '13px Arial, sans-serif';

  // Blue swatch
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(plotLeft + 40, height - 32, 16, 16);
  ctx.fillStyle = '#334155';
  ctx.fillText('Capaian CPL Tercapai (≥ 75%)', plotLeft + 64, height - 19);

  // Amber swatch
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(plotLeft + 310, height - 32, 16, 16);
  ctx.fillStyle = '#334155';
  ctx.fillText('Prioritas Peningkatan (< 75%)', plotLeft + 334, height - 19);

  // Red dashed swatch
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(plotLeft + 590, height - 24);
  ctx.lineTo(plotLeft + 620, height - 24);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#334155';
  ctx.fillText(`Target Standar (${targetBenchmark.toFixed(0)}%)`, plotLeft + 630, height - 19);

  return canvas.toDataURL('image/jpeg', 0.82);
}

export function generateRadarSpiderWebChartImage(
  cpmkResults: CPMKCalculationResult[],
  cplResults: CPLCalculationResult[],
  targetBenchmark: number = 75.0
): string {
  const canvas = document.createElement('canvas');
  const width = 800;
  const height = 540;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Border card
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Header Title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.fillText(
    `Peta Radar Spider Web: Profil Sebaran Kompetensi vs Target Mutu ${targetBenchmark.toFixed(2)}%`,
    35,
    44
  );

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillText('Poligon Keseimbangan Kurikulum OBE', width - 290, 44);

  // Combine points
  const points = [
    ...cpmkResults.map((c) => ({ label: c.cpmkCode, value: c.capaianAkhir })),
    ...cplResults.map((c) => ({ label: c.cplCode, value: c.capaianAkhir })),
  ];

  const totalPoints = points.length;
  if (totalPoints === 0) return canvas.toDataURL('image/jpeg', 0.82);

  const centerX = width / 2;
  const centerY = height / 2 + 15;
  const maxRadius = 175;

  // Concentric polygon grid (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#e2e8f0';

  gridLevels.forEach((level) => {
    ctx.beginPath();
    for (let i = 0; i < totalPoints; i++) {
      const angle = (Math.PI * 2 * i) / totalPoints - Math.PI / 2;
      const r = maxRadius * level;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Level label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${level * 100}%`, centerX, centerY - maxRadius * level + 12);
  });

  // Radial axes
  for (let i = 0; i < totalPoints; i++) {
    const angle = (Math.PI * 2 * i) / totalPoints - Math.PI / 2;
    const x = centerX + maxRadius * Math.cos(angle);
    const y = centerY + maxRadius * Math.sin(angle);

    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Axis label
    const labelDistance = maxRadius + 24;
    const lx = centerX + labelDistance * Math.cos(angle);
    const ly = centerY + labelDistance * Math.sin(angle);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(points[i].label, lx, ly + 4);

    // Score text
    ctx.font = '11px Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`${points[i].value.toFixed(1)}%`, lx, ly + 18);
  }

  // Draw Benchmark Target Polygon (Red Dashed)
  const targetRatio = targetBenchmark / 100;
  ctx.save();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 5]);
  ctx.fillStyle = 'rgba(239, 68, 68, 0.08)';
  ctx.beginPath();
  for (let i = 0; i < totalPoints; i++) {
    const angle = (Math.PI * 2 * i) / totalPoints - Math.PI / 2;
    const r = maxRadius * targetRatio;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.restore();

  // Draw Actual Achievement Polygon (Purple / Indigo)
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(79, 70, 229, 0.35)';
  ctx.beginPath();
  for (let i = 0; i < totalPoints; i++) {
    const angle = (Math.PI * 2 * i) / totalPoints - Math.PI / 2;
    const ratio = Math.max(0, Math.min(100, points[i].value)) / 100;
    const r = maxRadius * ratio;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  // Draw dots on vertices
  for (let i = 0; i < totalPoints; i++) {
    const angle = (Math.PI * 2 * i) / totalPoints - Math.PI / 2;
    const ratio = Math.max(0, Math.min(100, points[i].value)) / 100;
    const r = maxRadius * ratio;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);

    ctx.fillStyle = '#4338ca';
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Legend at bottom
  ctx.textAlign = 'left';
  ctx.font = '13px Arial, sans-serif';

  // Purple swatch
  ctx.fillStyle = '#4f46e5';
  ctx.fillRect(width / 2 - 170, height - 30, 16, 16);
  ctx.fillStyle = '#334155';
  ctx.fillText('Capaian Riil (%)', width / 2 - 146, height - 17);

  // Red dashed swatch
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(width / 2 + 30, height - 22);
  ctx.lineTo(width / 2 + 55, height - 22);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#334155';
  ctx.fillText(`Target Standar (${targetBenchmark.toFixed(0)}%)`, width / 2 + 62, height - 17);

  return canvas.toDataURL('image/jpeg', 0.82);
}
