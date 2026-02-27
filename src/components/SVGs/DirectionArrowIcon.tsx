/**
 * @fileoverview Direction arrow SVG icon.
 *
 * Used in the InterchangePanel to indicate power flow direction.
 * Points right for exports (green) and left for imports (red).
 */

/**
 * Props for the DirectionArrowIcon component.
 * @interface DirectionArrowIconProps
 */
interface DirectionArrowIconProps {
  /** Whether power is being exported (true) or imported (false) */
  isExporting: boolean;
}

/**
 * Direction arrow icon indicating power flow direction.
 *
 * - Right-pointing green arrow for exports
 * - Left-pointing red arrow for imports
 *
 * @param {DirectionArrowIconProps} props - Component props
 * @returns {JSX.Element} The rendered SVG icon
 */
export const DirectionArrowIcon = ({ isExporting }: DirectionArrowIconProps) => {
  /** Color based on flow direction */
  const color = isExporting ? '#10b981' : '#ef4444';

  /** Path differs based on direction: right arrow for export, left for import */
  const path = isExporting
    ? 'M2 6 L14 6 M10 2 L14 6 L10 10'   // Right arrow
    : 'M14 6 L2 6 M6 2 L2 6 L6 10';      // Left arrow

  return (
    <svg
      width="16"
      height="12"
      viewBox="0 0 16 12"
      style={{ marginLeft: '0.25rem' }}
    >
      <path
        d={path}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};
