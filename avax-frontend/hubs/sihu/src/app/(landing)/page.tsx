"use client";

import React from "react";
import HeroSection from "@/components/home/HeroSection";
import IntroSection from "@/components/home/IntroSection";
import PillarsSection from "@/components/home/PillarsSection";
import ObjectivesSection from "@/components/home/ObjectivesSection";
import CtaSection from "@/components/home/CtaSection";
import ContactSection from "@/components/home/ContactSection";
import FloatingBots from "@/components/home/FloatingBots";

export default function Home() {
  return (
    <div className="w-full">
      {/* Floating Chat Bots */}
      <FloatingBots />

      {/* ===== HERO ===== */}
      <HeroSection />

      {/* ===== INTRODUCTION ===== */}
      <IntroSection />

      {/* ===== KEY PILLARS ===== */}
      <PillarsSection />

      {/* ===== OBJECTIVES ===== */}
      <ObjectivesSection />

      {/* ===== CTA TO PORTAL ===== */}
      <CtaSection />

      {/* ===== CONTACT FORM ===== */}
      <ContactSection />
    </div>
  );
}
