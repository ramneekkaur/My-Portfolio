"use client";

import { useState } from "react";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [status, setStatus] = useState("");

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("Transmitting signal...");

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
    <form
      onSubmit={handleSubmit}
      className="w-full space-y-5"
    >
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Your name"
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white placeholder:text-gray-500 outline-none focus:border-electric/50"
      />

      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Your email"
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white placeholder:text-gray-500 outline-none focus:border-electric/50"
      />

      <textarea
        name="message"
        value={form.message}
        onChange={handleChange}
        placeholder="Send a signal..."
        rows="6"
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white placeholder:text-gray-500 outline-none focus:border-electric/50"
      />

      <button
        type="submit"
        className="rounded-full bg-white px-8 py-4 font-medium text-black transition hover:bg-electric"
      >
        Transmit Signal
      </button>

      {status && (
        <p className="text-sm text-gray-400">
          {status}
        </p>
      )}
    </form>
  );
}