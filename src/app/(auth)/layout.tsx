import Navbar from "@/components/homepage/Navbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen items-center justify-center p-4 pt-20">
        {children}
      </div>
    </>
  );
}
