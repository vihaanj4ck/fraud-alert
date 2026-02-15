import Link from "next/link";
import { getFeaturedProducts } from "@/lib/data/products";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import HeroSection from "@/components/HeroSection";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedSection from "@/components/FeaturedSection";

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <CategoryGrid />
        <FeaturedSection products={featured} />
      </main>
      <Footer />
    </div>
  );
}
