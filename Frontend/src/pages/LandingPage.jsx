import Footer from "@/components/layouts/Footer";
import Navbar from "@/components/layouts/Navbar";
import AdmissionProcess from "@/components/sections/AdmissionProcess";
import Hero from "@/components/sections/Hero";
import Streams from "@/components/sections/Streams";

const LandingPage = () => {
  return (
    <div className="bg-white">
      <Navbar />

      <main>
        <Hero />
        <Streams />
        <AdmissionProcess />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
