import {
  CompassIcon,
  HomeIcon,
  MendIcon,
  NotebookIcon,
  ScrollIcon,
  SettingsIcon,
  SunClockIcon,
  TargetIcon,
} from "@/components/icons";
import { copy } from "@/lib/copy";

export type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
};

export const primaryNav: NavItem[] = [
  { href: "/", label: copy.nav.dashboard, icon: HomeIcon },
  { href: "/constitution", label: copy.nav.constitution, icon: ScrollIcon },
  { href: "/rhythm", label: copy.nav.rhythm, icon: SunClockIcon },
  { href: "/reflection", label: copy.nav.reflection, icon: NotebookIcon },
  { href: "/goals", label: copy.nav.goals, icon: TargetIcon },
  { href: "/conflicts", label: copy.nav.conflicts, icon: MendIcon },
  { href: "/future", label: copy.nav.future, icon: CompassIcon },
];

export const secondaryNav: NavItem[] = [
  { href: "/settings", label: copy.nav.settings, icon: SettingsIcon },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
