import Link from "next/link";

export default function ExtensionPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <header className="border-b border-slate-800/50">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/" className="text-emerald-400 hover:text-emerald-300 font-semibold">
            ← Back to Hub
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Fraud Guard Browser Extension
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            AI-powered URL scanning and phishing protection. Scan any site instantly.
          </p>

          <div className="mt-10 space-y-8 rounded-2xl border border-slate-700/80 bg-slate-900/50 p-8">
            <section>
              <h2 className="text-xl font-semibold text-white">Installation (Chrome)</h2>
              <ol className="mt-4 list-decimal space-y-4 pl-6 text-slate-400">
                <li>Ensure the TrustHive Next.js app is running: <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sm text-slate-300">npm run dev</code></li>
                <li>Open Chrome and go to <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sm text-slate-300">chrome://extensions</code></li>
                <li>Enable <strong className="text-slate-300">Developer mode</strong> (top-right toggle)</li>
                <li>Click <strong className="text-slate-300">Load unpacked</strong></li>
                <li>Select the <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sm text-slate-300">fraud-guard-extension</code> folder inside your project</li>
                <li>Pin the extension to your toolbar for quick access</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">How to Use</h2>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-400">
                <li>Navigate to any website you want to scan</li>
                <li>Click the Fraud Guard icon in your toolbar</li>
                <li>Click <strong className="text-slate-300">Scan Site</strong></li>
                <li>View the Safety Score (0–100%) based on AI analysis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white">Requirements</h2>
              <p className="mt-4 text-slate-400">
                The extension requires the TrustHive API to be running locally (default: <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sm text-slate-300">http://localhost:3000</code>).
                Set <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sm text-slate-300">HF_TOKEN</code> in your environment for AI-powered scanning.
              </p>
            </section>

            <div className="pt-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-500"
              >
                Explore Enterprise Security
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
