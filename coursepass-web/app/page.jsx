

import HeroSection from "@/app/ui/LandingPage/landingPgae"
import BentoGrid from "@/app/ui/LandingPage/BentoGrid"
import Navbar from "@/app/ui/LandingPage/NavBar"
import Footer from "@/app/ui/LandingPage/Footer"

export default function Page() {
  return (
  <main className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <HeroSection />
      <BentoGrid />
      <Footer/>
    </main>
  );
}
