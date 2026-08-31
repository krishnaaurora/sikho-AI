import React from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    color: "#7C3AED",
    title: "Ask Anything",
    desc: "You ask a question or choose any learning service.",
    tags: ["/explain", "/course", "/code-review", "/quiz", "/research", "/career"],
    emoji: null,
    illustration: "ask",
  },
  {
    number: "02",
    color: "#3B82F6",
    title: "AI Understands & Prepares",
    desc: "SikhoAI understands your intent and prepares the best learning resource for you.",
    tags: null,
    progress: 75,
    illustration: "ai",
  },
  {
    number: "03",
    color: "#F97316",
    title: "402 Payment Required",
    desc: "SikhoAI returns the exact price and payment requirements via x402.",
    illustration: "payment",
  },
  {
    number: "04",
    color: "#14B8A6",
    title: "Pay & Sign",
    desc: "You approve the payment securely using your wallet on Algorand.",
    illustration: "pay",
  },
  {
    number: "05",
    color: "#22C55E",
    title: "Learning Unlocked",
    desc: "Payment is verified and your learning resource is delivered instantly.",
    illustration: "unlock",
  },
];

const AskIllustration = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
    {/* Speech bubble */}
    <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: "12px", padding: "8px 12px", fontSize: "11px", color: "#374151", fontWeight: 500, maxWidth: "130px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      Explain WebSockets<br />with diagrams
    </div>
    {/* Boy with phone */}
    <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>
      🧑‍💻
    </div>
    {/* Tags */}
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center", marginTop: "4px" }}>
      {["/explain", "/course", "/code-review", "/quiz", "/research", "/career"].map(t => (
        <span key={t} style={{ background: "#F3F4F6", borderRadius: "20px", padding: "2px 7px", fontSize: "9px", color: "#6B7280", fontWeight: 600 }}>{t}</span>
      ))}
    </div>
  </div>
);

const AIIllustration = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
    <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "linear-gradient(135deg, #DBEAFE, #BFDBFE)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px" }}>
      🤖
    </div>
    <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
      {["📚", "</>", "📊", "🎓"].map((icon, i) => (
        <div key={i} style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>{icon}</div>
      ))}
    </div>
    <div style={{ width: "100%", marginTop: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#6B7280", marginBottom: "3px" }}>
        <span>Analyzing...</span><span>75%</span>
      </div>
      <div style={{ width: "100%", height: "6px", background: "#E5E7EB", borderRadius: "99px", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "75%" }}
          transition={{ duration: 1.2, ease: "easeOut", repeat: Infinity, repeatDelay: 1.5 }}
          style={{ height: "100%", background: "linear-gradient(90deg, #3B82F6, #6366F1)", borderRadius: "99px" }}
        />
      </div>
    </div>
  </div>
);

const PaymentIllustration = () => (
  <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: "14px", padding: "14px 16px", textAlign: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", minWidth: "130px" }}>
    <div style={{ fontSize: "28px", fontWeight: 900, color: "#F97316", lineHeight: 1 }}>402</div>
    <div style={{ fontSize: "9px", fontWeight: 700, color: "#6B7280", letterSpacing: "0.1em", margin: "2px 0 8px" }}>PAYMENT REQUIRED</div>
    <div style={{ width: "100%", height: "1px", background: "#F3F4F6", marginBottom: "8px" }} />
    <div style={{ fontSize: "10px", color: "#9CA3AF" }}>Price</div>
    <div style={{ fontSize: "22px", fontWeight: 900, color: "#111827" }}>$0.002</div>
    <div style={{ fontSize: "10px", color: "#9CA3AF" }}>via x402</div>
    <div style={{ fontSize: "20px", marginTop: "6px" }}>🔒</div>
  </div>
);

const AlgorandIllustration = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
    <div style={{ fontSize: "52px" }}>👛</div>
    <div style={{ background: "#fff", border: "1.5px solid #E5E7EB", borderRadius: "10px", padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#111827", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
      <span style={{ fontSize: "14px" }}>⬛</span> Algorand <span style={{ color: "#22C55E", fontSize: "14px" }}>✓</span>
    </div>
    <div style={{ background: "#F0FDF4", border: "1.5px solid #BBF7D0", borderRadius: "10px", padding: "5px 12px", fontSize: "10px", fontWeight: 700, color: "#16A34A", display: "flex", alignItems: "center", gap: "5px" }}>
      🔒 Payment Signed & Sent
    </div>
  </div>
);

const UnlockIllustration = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
    <div style={{ position: "relative" }}>
      <div style={{ fontSize: "52px" }}>📖</div>
      <div style={{ position: "absolute", top: "-8px", right: "-8px", width: "24px", height: "24px", borderRadius: "50%", background: "#22C55E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "white", fontWeight: 900 }}>✓</div>
    </div>
    {[{ label: "Payment Verified", color: "#7C3AED" }, { label: "Resource Unlocked", color: "#7C3AED" }].map(item => (
      <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: 600, color: item.color }}>
        <span style={{ color: "#22C55E" }}>✓</span> {item.label}
      </div>
    ))}
  </div>
);

const illustrations = [AskIllustration, AIIllustration, PaymentIllustration, AlgorandIllustration, UnlockIllustration];

const Arrow = ({ color }: { color: string }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "60px", flexShrink: 0 }}>
    <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
      <path d="M0 10 H28 M22 3 L35 10 L22 17" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const StepCard = ({ step, index }: { step: typeof steps[0]; index: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const Illustration = illustrations[index];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.12, ease: "easeOut" }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Step number badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ duration: 0.4, delay: index * 0.12 + 0.1, type: "spring", stiffness: 200 }}
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: step.color,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: "15px",
          marginBottom: "16px",
          boxShadow: `0 4px 16px ${step.color}55`,
        }}
      >
        {step.number}
      </motion.div>

      {/* Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "20px 16px 18px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "0 4px 24px rgba(99,102,241,0.10)",
          minHeight: "220px",
          gap: "0",
        }}
      >
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "140px" }}>
          <Illustration />
        </div>
      </div>

      {/* Step title */}
      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <h3 style={{ fontWeight: 800, fontSize: "14px", color: step.color, margin: 0 }}>{step.title}</h3>
        <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "5px", lineHeight: 1.5, maxWidth: "160px", textAlign: "center" }}>{step.desc}</p>
      </div>
    </motion.div>
  );
};

const HowItWorksSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      style={{
        background: "#EEEDF8",
        padding: "80px 32px 64px",
        width: "100%",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>

        {/* Heading */}
        <div ref={ref} style={{ textAlign: "center", marginBottom: "56px" }}>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            style={{ fontWeight: 900, fontSize: "clamp(28px, 3.5vw, 44px)", color: "#0F172A", margin: 0 }}
          >
            How <span style={{ color: "#0F172A" }}>SikhoAI</span>{" "}
            <span style={{ color: "#6366F1" }}>Works</span>
          </motion.h2>

          {/* Dotted line decoration */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={inView ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "12px" }}
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: i === 2 || i === 3 ? "#6366F1" : "#C7D2FE" }} />
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            style={{ color: "#6366F1", fontWeight: 600, fontSize: "15px", marginTop: "10px" }}
          >
            Pay-per-use learning powered by x402
          </motion.p>
        </div>

        {/* Steps row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0" }}>
          {steps.map((step, i) => (
            <React.Fragment key={step.number}>
              <StepCard step={step} index={i} />
              {i < steps.length - 1 && (
                <Arrow color={steps[i + 1].color} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0",
            marginTop: "48px",
            background: "#fff",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(99,102,241,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "20px 40px", flex: 1, borderRight: "1px solid #F3F4F6" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "22px" }}>⚡</span>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: "14px", color: "#0F172A", margin: 0 }}>Pay only for what you use.</p>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: 0, marginTop: "2px" }}>No subscriptions. No hidden fees.</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "20px 40px", flex: 1 }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "22px" }}>🛡️</span>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: "14px", color: "#0F172A", margin: 0 }}>Secure. Transparent. Instant.</p>
              <p style={{ fontSize: "13px", color: "#6B7280", margin: 0, marginTop: "2px" }}>Powered by x402 on Algorand.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default HowItWorksSection;
