import type { Metadata } from "next";
import Link from "next/link";
import { Old_Standard_TT, Source_Serif_4, Courier_Prime } from "next/font/google";
import { getSessionUser } from "@/lib/auth";
import { AppearanceControl } from "@/components/appearance-control";
import "./globals.css";

const display = Old_Standard_TT({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-old-standard",
  display: "swap",
});

const body = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const mono = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-courier",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pettifog — the trivial debate court",
  description:
    "Court is in session for the world's dumbest questions. Score a hot take, enter your evidence, and let the community render a verdict.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();

  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="bg-manila border-b-4 border-double border-ink/70">
          <div className="mx-auto w-full max-w-5xl px-5 sm:px-8 pt-6 pb-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <Link href="/" className="group">
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-[0.22em] leading-none">
                PETTIFOG
              </h1>
              <p className="case-label mt-2 max-w-md normal-case tracking-[0.14em]">
                Court is in session for the world&rsquo;s dumbest questions.
              </p>
            </Link>
            <AppearanceControl
              key={user?.displayName ?? "anonymous"}
              user={user ? { displayName: user.displayName } : null}
            />
          </div>
          <nav className="border-t border-ink/20">
            <div className="mx-auto w-full max-w-5xl px-5 sm:px-8 flex items-center gap-6">
              <Link href="/" className="case-label py-2 hover:text-ink">
                The Docket
              </Link>
              <Link href="/new" className="case-label py-2 hover:text-ink">
                File a Case
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1 mx-auto w-full max-w-5xl px-5 sm:px-8 py-10">{children}</main>

        <footer className="border-t border-rule">
          <div className="mx-auto w-full max-w-5xl px-5 sm:px-8 py-6 case-label flex flex-wrap gap-x-6 gap-y-1">
            <span>Pettifog Tribunal</span>
            <span aria-hidden>·</span>
            <span>No real disputes were harmed</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
