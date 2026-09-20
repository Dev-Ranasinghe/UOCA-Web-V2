import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MembershipForm from "@/components/join/MembershipForm";

export const metadata = {
  title: "Join UOCA — Leo Club of Universities of Ceylon Alumni",
  description:
    "Apply for membership of the Leo Club of UOC Alumni for 2026/2027. Passion meets purpose: service, leadership, friendship and a meaningful difference.",
};

export default function JoinPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#eae7e1] text-[#121212]">
      <Navbar activePage="JOIN" />

      <main className="section-stack page-container max-w-6xl flex-1 pt-[var(--section-gap-half)]">
        <div className="page-header text-center w-full max-w-2xl mx-auto">
          <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#121212] text-balance mb-4">
            Join the Leo Club of UOC Alumni
          </h1>
          <p className="font-sans text-sm sm:text-base leading-relaxed text-[#555]">
            <strong className="font-bold text-[#121212]">Passion Meets Purpose.</strong> Be part of a community of
            young individuals who believe in service, leadership, friendship, and making a meaningful difference.
            Membership applications for 2026/2027 are open.
          </p>
        </div>

        <MembershipForm />
      </main>

      <Footer />
    </div>
  );
}
