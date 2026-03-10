import Footer from "@/components/layouts/Footer";
import Navbar from "@/components/layouts/Navbar";
import AdmissionProcess from "@/components/sections/AdmissionProcess";
import Hero from "@/components/sections/Hero";
import Streams from "@/components/sections/Streams";
import Testimonials from "@/components/sections/Testimonials";

const LandingPage = () => {
  return (
    <div className="bg-gradient-to-br from-[#e6fbff] via-[#b8eef3] to-[#7fdde6]">
      <Navbar />

      <main>
        <Hero />
        <Streams />
        <AdmissionProcess />
        <Testimonials />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
