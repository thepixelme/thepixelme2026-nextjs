"use client";

import { Button, Input, TextArea } from "@heroui/react";
import { Send } from "lucide-react";
import { useState } from "react";
import { ABOUT } from "@/lib/portfolio-data";

export default function ContactApp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(
      `Hello from ${name || "your portfolio"}`,
    );
    const body = encodeURIComponent(
      `${message}\n\n— ${name}${email ? ` (${email})` : ""}`,
    );
    window.location.href = `mailto:${ABOUT.email}?subject=${subject}&body=${body}`;
  };

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col gap-4 p-8">
      <div>
        <h1 className="text-xl font-semibold">Send me a note</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Direct line to {ABOUT.email}.
        </p>
      </div>

      <Field label="Name" id="contact-name">
        <Input
          id="contact-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
        />
      </Field>
      <Field label="Email" id="contact-email">
        <Input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
      </Field>
      <Field label="Message" id="contact-message">
        <TextArea
          id="contact-message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          fullWidth
        />
      </Field>

      <div className="mt-auto flex justify-end">
        <Button type="submit">
          <Send size={14} className="mr-1" /> Send
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label htmlFor={id} className="text-xs font-medium text-foreground/70">
        {label}
      </label>
      {children}
    </div>
  );
}
