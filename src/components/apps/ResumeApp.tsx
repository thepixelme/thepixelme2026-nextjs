"use client";

import { Download } from "lucide-react";
import { ABOUT, RESUME } from "@/lib/portfolio-data";

export default function ResumeApp() {
  const jobs = RESUME.filter((r) => r.kind === "job");
  const education = RESUME.filter((r) => r.kind === "education");

  return (
    <div className="mx-auto max-w-2xl px-12 py-10">
      <header className="border-b border-separator pb-6">
        <h1 className="text-2xl font-semibold">{ABOUT.name}</h1>
        <p className="text-sm text-foreground/70">{ABOUT.title}</p>
        <p className="mt-1 text-xs text-foreground/60">
          {ABOUT.location} · {ABOUT.email}
        </p>
        <a
          href="/resume.pdf"
          download
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          <Download size={12} /> Download PDF
        </a>
      </header>

      <Section title="Experience">
        {jobs.map((j) => (
          <Entry key={j.org + j.role} entry={j} />
        ))}
      </Section>

      <Section title="Education">
        {education.map((e) => (
          <Entry key={e.org + e.role} entry={e} />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground/60">
        {title}
      </h2>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

function Entry({ entry }: { entry: (typeof RESUME)[number] }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">{entry.role}</h3>
          <p className="text-sm text-foreground/70">{entry.org}</p>
        </div>
        <p className="shrink-0 text-xs tabular-nums text-foreground/60">
          {entry.start} — {entry.end}
        </p>
      </div>
      <ul className="mt-2 list-disc pl-5 text-sm text-foreground/80">
        {entry.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </div>
  );
}
