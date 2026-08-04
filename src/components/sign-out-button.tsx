import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";

export function SignOutButton({
  variant = "ghost",
  size = "sm",
  className,
}: {
  variant?: "ghost" | "secondary" | "soft";
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant={variant} size={size} className={className}>
        {copy.nav.signOut}
      </Button>
    </form>
  );
}
