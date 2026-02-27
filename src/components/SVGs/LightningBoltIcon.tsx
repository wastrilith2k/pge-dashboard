/**
 * @fileoverview Lightning bolt SVG icon.
 *
 * Used in the Header component to represent power/energy.
 * A simple static icon with customizable size and color.
 */

/**
 * Props for the LightningBoltIcon component.
 * @interface LightningBoltIconProps
 */
interface LightningBoltIconProps {
  /** Width and height of the icon in pixels (default: 18) */
  size?: number;
  /** Stroke color for the icon (default: #3b82f6 blue) */
  color?: string;
}

/**
 * Lightning bolt icon representing electrical power.
 *
 * @param {LightningBoltIconProps} props - Component props
 * @returns {JSX.Element} The rendered SVG icon
 */
export const LightningBoltIcon = ({
  size = 18,
  color = '#3b82f6'
}: LightningBoltIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
