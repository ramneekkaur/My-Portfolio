"use client";

import { useRef, useState } from "react";
import { acknowledgeSignal, transmitSignal } from "@/components/SignalBeam";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");
  const submitRef = useRef(null);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("Transmitting signal...");

    // A beam of light rises from the Transmit button into the sky
    const button = submitRef.current?.getBoundingClientRect();
    if (button) transmitSignal(button.left + button.width / 2, button.top);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Transmission failed.");
        return;
      }

      setStatus("Signal received. I will respond soon.");
      acknowledgeSignal();
      setForm({
        name: "",
        email: "",
        message: "",
      });
    } catch (error) {
      setStatus("Something interrupted the signal.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel w-full space-y-6 p-6 pt-9 md:p-8 md:pt-10">
      <p className="panel-title">[ Uplink terminal ]</p>

      <label className="block">
        <span className="term-label mb-2 block">Name</span>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your name"
          className="field-terminal"
        />
      </label>

      <label className="block">
        <span className="term-label mb-2 block">Email</span>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className="field-terminal"
        />
      </label>

      <label className="block">
        <span className="term-label mb-2 block">Message</span>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Send a signal..."
          rows="6"
          className="field-terminal"
        />
      </label>

      <button ref={submitRef} type="submit" className="btn-terminal btn-terminal-primary">
        Transmit signal
      </button>

      <p aria-live="polite" className="min-h-[1.25rem] text-xs uppercase tracking-wider text-phosphor">
        {status && (
          <>
            <span aria-hidden="true">&gt; </span>
            {status}
            <span aria-hidden="true" className="cursor-block" />
          </>
        )}
      </p>
    </form>
  );
}
