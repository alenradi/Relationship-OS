export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl -mt-2 sm:-mt-4">{children}</div>
  );
}
