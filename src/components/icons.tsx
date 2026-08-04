/**
 * Hand-rolled line icons. Deliberately not an icon library: eight glyphs at one
 * consistent weight keeps the bundle empty and the visual language calm.
 */
type IconProps = { className?: string };

function Svg({
  children,
  className,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className ?? "size-5"}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
      <path d="M10 20v-5h4v5" />
    </Svg>
  );
}

export function ScrollIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M8 8.5h7M8 12h7M8 15.5h4" />
    </Svg>
  );
}

export function SunClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 9v3.5l2.5 1.5" />
      <path d="M12 2.5v1.2M12 20.3v1.2M2.5 12h1.2M20.3 12h1.2" />
    </Svg>
  );
}

export function NotebookIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 4h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7V4Z" />
      <path d="M7 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h1" />
      <path d="M4 9h3M4 12.5h3M4 16h3" />
      <path d="M11 8.5h4" />
    </Svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 4.5v-2M12 21.5v-2M4.5 12h-2M21.5 12h-2" />
    </Svg>
  );
}

export function MendIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20s-6.5-4.2-6.5-9A3.8 3.8 0 0 1 12 8.4a3.8 3.8 0 0 1 6.5 2.6c0 4.8-6.5 9-6.5 9Z" />
      <path d="M12 8.4v11.4" strokeDasharray="2.2 2.2" />
    </Svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2l-1.6 4.4-4.4 1.6 1.6-4.4 4.4-1.6Z" />
    </Svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 7.8l1.9 1.1M17.2 15.1l1.9 1.1M4.9 16.2l1.9-1.1M17.2 8.9l1.9-1.1" />
    </Svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 4.5l1.6 4.4 4.4 1.6-4.4 1.6L12 16.5l-1.6-4.4L6 10.5l4.4-1.6L12 4.5Z" />
      <path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
    </Svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 5l7 7-7 7" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 13l4 4L19 7" strokeWidth="2" />
    </Svg>
  );
}
