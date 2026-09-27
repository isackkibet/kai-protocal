import HomeHeader from "@/components/home/HomeHeader";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <HomeHeader />
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
