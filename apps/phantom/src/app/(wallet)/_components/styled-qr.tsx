"use client";

import React from "react";
import qrcode from "qrcode-generator";

interface StyledQRProps {
  data: string;
  size?: number;
  color?: string;
  /** Fraction of the QR width kept clear in the center for the logo overlay. */
  clearCenterRatio?: number;
}

// Clockwise rounded-rect path; paired with fill-rule="evenodd" to punch the
// finder-ring hole out of the outer shape.
function roundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  return (
    `M${x + r},${y}` +
    `h${w - 2 * r}` +
    `a${r},${r} 0 0 1 ${r},${r}` +
    `v${h - 2 * r}` +
    `a${r},${r} 0 0 1 ${-r},${r}` +
    `h${-(w - 2 * r)}` +
    `a${r},${r} 0 0 1 ${-r},${-r}` +
    `v${-(h - 2 * r)}` +
    `a${r},${r} 0 0 1 ${r},${-r}` +
    `z`
  );
}

// Phantom-style finder: rounded ring + rounded-square center dot.
function Finder({ x, y, cell, color }: { x: number; y: number; cell: number; color: string }) {
  const s = 7 * cell;
  const ring = 1.15 * cell;
  const dot = 2.7 * cell;
  const inset = (s - dot) / 2;
  return (
    <g transform={`translate(${x},${y})`}>
      <path
        fill={color}
        fillRule="evenodd"
        d={
          roundedRectPath(0, 0, s, s, 2.55 * cell) +
          roundedRectPath(ring, ring, s - 2 * ring, s - 2 * ring, 1.6 * cell)
        }
      />
      <rect x={inset} y={inset} width={dot} height={dot} rx={1.05 * cell} fill={color} />
    </g>
  );
}

/**
 * Phantom-style QR: separated round dots, rounded finder markers, and a
 * cleared center zone for a logo overlay. Error correction is "H" (~30%)
 * so the QR stays scannable despite the cleared center.
 */
export default function StyledQR({
  data,
  size = 250,
  color = "#ffffff",
  clearCenterRatio = 0.28,
}: StyledQRProps) {
  const matrix = React.useMemo(() => {
    const qr = qrcode(0, "H");
    qr.addData(data);
    qr.make();
    const count = qr.getModuleCount();
    const rows: boolean[][] = [];
    for (let r = 0; r < count; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < count; c++) row.push(qr.isDark(r, c));
      rows.push(row);
    }
    return rows;
  }, [data]);

  const count = matrix.length;
  const cell = size / count;
  const mid = count / 2;
  const clearHalf = (clearCenterRatio * count) / 2;

  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= count - 7) || (r >= count - 7 && c < 7);
  const inClearZone = (r: number, c: number) =>
    Math.abs(r + 0.5 - mid) < clearHalf && Math.abs(c + 0.5 - mid) < clearHalf;

  const dots: React.ReactNode[] = [];
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (!matrix[r][c] || inFinder(r, c) || inClearZone(r, c)) continue;
      dots.push(
        <circle
          key={`${r}-${c}`}
          cx={(c + 0.5) * cell}
          cy={(r + 0.5) * cell}
          r={cell * 0.41}
          fill={color}
        />
      );
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="QR Code">
      {dots}
      <Finder x={0} y={0} cell={cell} color={color} />
      <Finder x={(count - 7) * cell} y={0} cell={cell} color={color} />
      <Finder x={0} y={(count - 7) * cell} cell={cell} color={color} />
    </svg>
  );
}
