import { ClerkProvider } from "@clerk/nextjs";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Segment layout for the main app — adds Clerk, Navbar, and Footer.
// This is intentionally NOT the root layout so that (payload)/admin
// routes use only app/layout.tsx and never inherit ClerkProvider.

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <Navbar />
      {children}
      <Footer />
    </ClerkProvider>
  );
}
