import Link from "next/link";
import LandingFooter from "@/components/LandingFooter";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,197,94,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMmM1NTciIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di0xMmgtMjR2MjRoMTJWMzR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

      <header className="relative border-b border-slate-800/50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-emerald-400">TrustHive</span>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
              Cybersecurity Portal
            </span>
          </Link>
        </div>
      </header>

      <main className="relative flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Secure Your Digital World
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
              Enterprise-grade fraud protection and personal browsing security.
              Choose your path below.
            </p>
          </div>

          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:gap-12">
            <Link
              href="/shop"
              className="group relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/80 p-8 shadow-xl transition-all duration-300 hover:border-emerald-500/50 hover:shadow-emerald-500/10 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <span className="inline-block rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  B2B
                </span>
                <h2 className="mt-4 text-2xl font-bold text-white">Enterprise Storefront</h2>
                <p className="mt-3 text-slate-400 leading-relaxed">
                  Real-time Transaction Guard & IP Velocity Monitoring. Protect your
                  e-commerce platform with AI-driven fraud detection.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 group-hover:gap-3 transition-all">
                  Enter Shop
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>

            <Link
              href="/extension-info"
              className="group relative overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/80 p-8 shadow-xl transition-all duration-300 hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <span className="inline-block rounded-lg bg-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  B2C
                </span>
                <h2 className="mt-4 text-2xl font-bold text-white">Personal Guardian Extension</h2>
                <p className="mt-3 text-slate-400 leading-relaxed">
                  AI-Powered URL Scanning & Phishing Protection. Scan any site
                  instantly with our Fraud Guard browser extension.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 group-hover:gap-3 transition-all">
                  Get Extension
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
