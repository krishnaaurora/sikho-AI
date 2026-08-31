import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F3F6FF 0%, #FCFDFF 55%, #F9F6FF 100%)",
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        paddingTop: "100px",
        paddingBottom: "80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* ── BACKGROUND DECORATIONS (subtle, behind everything) ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", left: "8%", top: "14%", opacity: 0.15 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div style={{ position: "absolute", right: "6%", top: "12%", opacity: 0.15 }}>
          <svg width="56" height="56" viewBox="0 0 100 100" fill="none" stroke="#6366F1" strokeWidth="2" strokeDasharray="6 6">
            <circle cx="50" cy="50" r="40" />
          </svg>
        </div>
        <div style={{ position: "absolute", right: "4%", top: "45%", opacity: 0.65 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2V22M2 12H22M5 5L19 19M5 19L19 5" />
          </svg>
        </div>
        <div style={{ position: "absolute", right: "12%", top: "62%", opacity: 0.45 }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#F59E0B" strokeWidth="1.8">
            <rect x="3" y="3" width="14" height="14" transform="rotate(45 10 10)" />
          </svg>
        </div>
        <div style={{ position: "absolute", left: "4%", top: "72%", opacity: 0.18 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      </div>

      {/* ── MAIN CONTENT — side-by-side responsive layout ── */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "1280px",
          width: "100%",
          margin: "0 auto",
          padding: "0 24px",
        }}
        className="flex flex-col-reverse md:flex-row items-center justify-between gap-12 md:gap-16"
      >
        {/* ══ FIRST: Boy Illustration (Left side on desktop) ══ */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "visible",
          }}
          className="w-full md:w-1/2"
        >
          {/* Lavender atmospheric glow behind boy */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              maxWidth: "440px",
              height: "440px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(197,185,245,0.45) 0%, rgba(220,214,245,0.20) 55%, transparent 75%)",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />

          {/* Boy illustration */}
          <motion.img
            src="/boy_illustration_transparent.png"
            alt="Student holding phone"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              position: "relative",
              zIndex: 1,
              width: "auto",
              objectFit: "contain",
              userSelect: "none",
              display: "block",
            }}
            className="h-[300px] md:h-[460px]"
            draggable={false}
          />
        </div>

        {/* ══ SECOND: Text block (Right side on desktop) ══ */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.2 }}
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
          }}
          className="w-full md:w-1/2 items-center md:items-start text-center md:text-left"
        >
          {/* Eyebrow */}
          <div 
            style={{ display: "flex", flexDirection: "column", marginBottom: "24px" }}
            className="items-center md:items-start"
          >
            <span
              style={{
                color: "#2563EB",
                fontWeight: 700,
                fontSize: "12px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: "monospace",
              }}
            >
              Smart learning. Fair pay.
            </span>
            <div style={{ width: "38px", height: "3px", background: "#F97316", marginTop: "7px" }} />
          </div>

          {/* Headline */}
          <h1
            style={{
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: "-0.025em",
              color: "#0E172C",
              fontSize: "clamp(36px, 4vw, 56px)",
              margin: "0 0 24px 0",
            }}
          >
            Learn anything.<br />
            Pay <span style={{ color: "#0D7A70" }}>only</span> for{" "}
            <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap" }}>
              what you Learn &amp; Use.
              <svg
                style={{ position: "absolute", bottom: "-10px", left: 0, width: "100%", height: "12px", color: "#F97316" }}
                viewBox="0 0 300 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path d="M 5 7 Q 75 1, 150 7 T 295 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
              </svg>
            </span>
          </h1>

          {/* Description */}
          <p
            style={{
              color: "#475569",
              fontSize: "18px",
              fontWeight: 500,
              lineHeight: 1.65,
              maxWidth: "600px",
              margin: "0 0 32px 0",
            }}
          >
            Get instant access to expert-designed lessons, interactive practice, and real-world skills.
            No subscriptions. No wasted time.
          </p>

          {/* CTA Button */}
          <div>
            <Button
              style={{
                borderRadius: "9999px",
                padding: "14px 36px",
                background: "#004BFF",
                fontWeight: 700,
                color: "#fff",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 8px 28px rgba(0,75,255,0.25)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span>Explore Learning Labs</span>
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
