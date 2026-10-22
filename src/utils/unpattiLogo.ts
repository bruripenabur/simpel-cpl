import { UNPATTI_OFFICIAL_LOGO_BASE64 } from './unpattiLogoBase64';

/**
 * Returns the official high-resolution PNG Data URL for Universitas Pattimura (UNPATTI)
 * for seamless embedding into jsPDF and DOCX exports without external network calls.
 */
export function getUnpattiLogoDataUrl(width: number = 300, height: number = 330): string {
  if (UNPATTI_OFFICIAL_LOGO_BASE64) {
    return UNPATTI_OFFICIAL_LOGO_BASE64;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Scaling factors based on 200x220 viewbox
    const sx = width / 200;
    const sy = height / 220;

    ctx.save();
    ctx.scale(sx, sy);

    // 1. Outer Pentagon Gold Shield
    ctx.beginPath();
    ctx.moveTo(100, 6);
    ctx.lineTo(190, 70);
    ctx.lineTo(156, 182);
    ctx.lineTo(44, 182);
    ctx.lineTo(10, 70);
    ctx.closePath();
    ctx.fillStyle = '#EAB308';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#B45309';
    ctx.stroke();

    // 2. White Border
    ctx.beginPath();
    ctx.moveTo(100, 12);
    ctx.lineTo(184, 72);
    ctx.lineTo(152, 176);
    ctx.lineTo(48, 176);
    ctx.lineTo(16, 72);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // 3. Inner Royal Blue Field
    ctx.beginPath();
    ctx.moveTo(100, 16);
    ctx.lineTo(180, 74);
    ctx.lineTo(149, 172);
    ctx.lineTo(51, 172);
    ctx.lineTo(20, 74);
    ctx.closePath();
    ctx.fillStyle = '#1E3A8A';
    ctx.fill();

    // 4. Star at Top
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    const starPoints = [
      [100, 22], [104, 33], [116, 33], [106, 40], [110, 51],
      [100, 44], [90, 51], [94, 40], [84, 33], [96, 33]
    ];
    ctx.moveTo(starPoints[0][0], starPoints[0][1]);
    for (let i = 1; i < starPoints.length; i++) {
      ctx.lineTo(starPoints[i][0], starPoints[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    // 5. Parang & Salawaku
    // Parang Blade
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.moveTo(60, 140);
    ctx.quadraticCurveTo(85, 100, 135, 68);
    ctx.quadraticCurveTo(140, 65, 142, 67);
    ctx.quadraticCurveTo(140, 73, 130, 82);
    ctx.quadraticCurveTo(85, 115, 68, 144);
    ctx.closePath();
    ctx.fill();

    // Salawaku (Traditional Shield)
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(135, 138);
    ctx.bezierCurveTo(144, 115, 130, 95, 125, 78);
    ctx.bezierCurveTo(120, 95, 106, 115, 115, 138);
    ctx.bezierCurveTo(120, 132, 130, 132, 135, 138);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Salawaku Inlays
    ctx.fillStyle = '#FDE047';
    [98, 112, 124].forEach((y) => {
      ctx.beginPath();
      ctx.arc(125, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Central Flaming Torch (Obor)
    // Handle
    ctx.fillStyle = '#CA8A04';
    ctx.fillRect(97, 112, 6, 33);
    // Torch Bowl
    ctx.fillStyle = '#EAB308';
    ctx.fillRect(94, 108, 12, 4);

    // Flames (Red & Yellow)
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(100, 56);
    ctx.bezierCurveTo(106, 70, 114, 80, 110, 95);
    ctx.bezierCurveTo(107, 104, 100, 108, 97, 108);
    ctx.bezierCurveTo(93, 108, 88, 103, 89, 94);
    ctx.bezierCurveTo(90, 83, 96, 72, 100, 56);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(100, 68);
    ctx.bezierCurveTo(103, 77, 107, 85, 104, 95);
    ctx.bezierCurveTo(102, 101, 98, 104, 97, 104);
    ctx.bezierCurveTo(95, 104, 92, 100, 93, 94);
    ctx.bezierCurveTo(94, 86, 98, 78, 100, 68);
    ctx.closePath();
    ctx.fill();

    // 7. Golden Pearl Strands
    ctx.fillStyle = '#FDE047';
    const leftCircles = [[48, 88], [44, 102], [43, 118], [46, 134], [53, 148]];
    const rightCircles = [[152, 88], [156, 102], [157, 118], [154, 134], [147, 148]];
    [...leftCircles, ...rightCircles].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 8. Ribbon at Bottom
    ctx.fillStyle = '#EAB308';
    ctx.strokeStyle = '#854D0E';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(26, 182);
    ctx.lineTo(50, 172);
    ctx.lineTo(150, 172);
    ctx.lineTo(174, 182);
    ctx.lineTo(158, 198);
    ctx.lineTo(100, 192);
    ctx.lineTo(42, 198);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ribbon Text
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 9px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('UNIVERSITAS PATTIMURA', 100, 186);

    ctx.restore();

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to generate Unpatti logo data URL:', err);
    return '';
  }
}
