"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { track } from "@/lib/analytics";

const schema = z.object({
  name: z.string().min(1, "Your name is required"),
  email: z.string().email("A valid email is required"),
  business: z.string().optional(),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const INTERESTS = [
  "Foundations — $299/mo",
  "Growth — $499/mo",
  "Accelerate — $799/mo",
  "Done-for-you support",
  "Community & workshops",
  "Partnership / funding",
  "Not sure yet",
];

export interface ContactProps {
  supportEmail?: string | null;
  phone?: string | null;
  address?: string | null;
}

export default function Contact({ supportEmail, phone, address }: ContactProps = {}) {
  const [ref, setRef] = useState("");
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [focused, setFocused] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    const num = Math.floor(Math.random() * 900) + 100;
    setRef(`GH-${new Date().getFullYear()}-${num}`);
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const nameValue = watch("name") ?? "";

  const toggleInterest = (i: string) => {
    setInterests((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const onSubmit = async (data: FormValues) => {
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, interests: [...interests], ref }),
      });
      if (!res.ok) throw new Error();
      track("contact_form_submit", { interests: [...interests].join(", ") });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  const fieldClass = (k: string) =>
    `cf2-field${focused === k ? " is-focused" : ""}`;

  if (status === "sent") {
    return (
      <section className="contact" id="contact">
        <div className="wrap contact-wrap">
          <div className="contact-head">
            <span className="contact-eyebrow">
              <span className="dot" /> Get in touch
            </span>
            <h2 className="contact-h2">
              Write us a line.<br />
              <em className="contact-h2-em">We'll write one back.</em>
            </h2>
          </div>
          <div className="contact-letter">
            <div className="cf2-success">
              <div className="cf2-success-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3>Your message is on its way.</h3>
              <p>We'll reply to <strong>{watch("email")}</strong> within 48 hours — usually sooner.</p>
            </div>
          </div>
          <ContactStrip email={supportEmail} phone={phone} address={address} />
        </div>
      </section>
    );
  }

  return (
    <section className="contact" id="contact">
      <div className="wrap contact-wrap">
        <div className="contact-head">
          <span className="contact-eyebrow">
            <span className="dot" /> Get in touch
          </span>
          <h2 className="contact-h2">
            Write us a line.<br />
            <em className="contact-h2-em">We'll write one back.</em>
          </h2>
          <p className="contact-lede">
            Not a form funnel. Not a "discovery call". Just a real message to a
            real person in Canberra who'll read it, think about it, and reply.
          </p>
        </div>

        <div className="contact-letter">
          <div className="letter-top">
            <div className="letter-from">
              <span className="letter-lbl">To</span>
              <span className="letter-val">Growth Hub · Canberra</span>
            </div>
            <div className="letter-meta">
              <span className="letter-lbl">Ref</span>
              <span className="letter-val">{ref}</span>
            </div>
          </div>

          <form className="cf2" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="cf2-row cf2-row-2">
              <label className={fieldClass("name")}>
                <span className="cf2-lbl">Your name</span>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  {...register("name")}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <span style={{ color: "#A8423E", fontSize: 13, marginTop: 4, display: "block" }}>
                    {errors.name.message}
                  </span>
                )}
              </label>

              <label className={fieldClass("email")}>
                <span className="cf2-lbl">Email</span>
                <input
                  type="email"
                  placeholder="jane@bakery.com.au"
                  {...register("email")}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <span style={{ color: "#A8423E", fontSize: 13, marginTop: 4, display: "block" }}>
                    {errors.email.message}
                  </span>
                )}
              </label>
            </div>

            <div className="cf2-row">
              <label className={fieldClass("business")}>
                <span className="cf2-lbl">
                  Business <em>(optional)</em>
                </span>
                <input
                  type="text"
                  placeholder="The Local Bakery"
                  {...register("business")}
                  onFocus={() => setFocused("business")}
                  onBlur={() => setFocused(null)}
                />
              </label>
            </div>

            <div className="cf2-row">
              <div className="cf2-interest">
                <span className="cf2-lbl">I'm interested in</span>
                <div className="cf2-chips">
                  {INTERESTS.map((i) => (
                    <button
                      type="button"
                      key={i}
                      className={`cf2-chip ${interests.has(i) ? "is-on" : ""}`}
                      onClick={() => toggleInterest(i)}
                      aria-pressed={interests.has(i)}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="cf2-row">
              <label className={fieldClass("message")}>
                <span className="cf2-lbl">Your message</span>
                <textarea
                  rows={5}
                  placeholder="Tell us about your business — what's working, what isn't, what you'd want from a team in your corner. Even a paragraph is plenty."
                  {...register("message")}
                  onFocus={() => setFocused("message")}
                  onBlur={() => setFocused(null)}
                />
              </label>
            </div>

            <div className="cf2-sign">
              <div className="cf2-sign-line">
                <span className="cf2-sign-lbl">Signed,</span>
                <span className="cf2-sign-name handscript">
                  {nameValue || (
                    <span className="cf2-sign-placeholder">your name here</span>
                  )}
                </span>
              </div>

              <button
                type="submit"
                className="cf2-send"
                disabled={status === "sending"}
              >
                <span>{status === "sending" ? "Sending…" : "Send it"}</span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 9h12M10 4l5 5-5 5" />
                </svg>
              </button>
            </div>

            {status === "error" && (
              <p style={{ color: "#A8423E", fontSize: 14, marginTop: 8 }}>
                Something went wrong. Please email us directly at{" "}
                <a href="mailto:hello@himayat.com.au" style={{ textDecoration: "underline" }}>
                  hello@himayat.com.au
                </a>
              </p>
            )}

            <div className="cf2-fine">
              <span>↳ arrives at <b>hello@himayat.com.au</b></span>
              <span className="cf2-sep">·</span>
              <span>usually a reply within 48 hours</span>
              <span className="cf2-sep">·</span>
              <span>no newsletter, no drip sequence</span>
            </div>
          </form>
        </div>

        <ContactStrip email={supportEmail} phone={phone} address={address} />
      </div>
    </section>
  );
}

function ContactStrip({
  email,
  phone,
  address,
}: {
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}) {
  const resolvedEmail = email ?? "hello@himayat.com.au";
  const resolvedPhone = phone ?? "02 5119 0005";
  const resolvedPhoneHref = resolvedPhone.replace(/\s/g, "");
  const resolvedAddress = address ?? "Level 4, 1 Moore St · Canberra ACT 2601";

  return (
    <div className="contact-strip">
      <div className="cs-item">
        <span className="cs-lbl">Call</span>
        <a className="cs-val" href={`tel:${resolvedPhoneHref}`}>{resolvedPhone}</a>
      </div>
      <div className="cs-item">
        <span className="cs-lbl">Email direct</span>
        <a className="cs-val" href={`mailto:${resolvedEmail}`}>{resolvedEmail}</a>
      </div>
      <div className="cs-item">
        <span className="cs-lbl">Visit</span>
        <span className="cs-val">{resolvedAddress}</span>
      </div>
      <div className="cs-item">
        <span className="cs-lbl">Hours</span>
        <span className="cs-val">Mon–Fri · 9am–5pm AEST</span>
      </div>
    </div>
  );
}
