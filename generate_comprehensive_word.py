import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def add_callout(doc, text, title="NOTE", fill_hex="F0F4F8", border_hex="3182CE"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, fill_hex)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_hex}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    r_title = p.add_run(f"[{title}] ")
    r_title.bold = True
    r_title.font.name = "Arial"
    r_title.font.size = Pt(10)
    r_title.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)
    
    r_text = p.add_run(text)
    r_text.font.name = "Arial"
    r_text.font.size = Pt(10)
    r_text.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
    
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_after = Pt(4)

def style_table(tbl, col_widths, headers, data, header_bg="1E3A8A", alt_bg="F8FAFC"):
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr_cells = tbl.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.bold = True
            run.font.name = "Arial"
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
            
    for r_idx, row_data in enumerate(data):
        row = tbl.add_row()
        fill_color = alt_bg if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.text = str(val)
            set_cell_background(cell, fill_color)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = "Arial"
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    for row in tbl.rows:
        for c_idx, width in enumerate(col_widths):
            row.cells[c_idx].width = Inches(width)

def generate_comprehensive_docx(file_paths):
    doc = docx.Document()
    
    # Page setup
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    normal_style = doc.styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'Arial'
    normal_font.size = Pt(10.5)
    normal_font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    
    # ── Header / Title ───────────────────────────────────────────────────────────
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    r_title = title_p.add_run("🎓 Sikho-AI — Complete System Specification & Feature Guide")
    r_title.font.name = 'Arial'
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(12)
    r_sub = sub_p.add_run("All-Inclusive Functional, Architectural, and API Reference Manual for the Sikho-AI Ecosystem")
    r_sub.font.name = 'Arial'
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)
    
    add_callout(doc, "Platform: Sikho-AI | Protocol: x402 HTTP Payment Standard | Blockchain: Algorand TestNet (USDC Asset ID: 10458941) | AI Cluster: Groq Cloud (openai/gpt-oss-120b & LLaMA 3.3) with 8x Key Rotation | Web App: React 18, Vite, TypeScript, TailwindCSS | Gateways: Node.js Express & Python FastAPI", "PROJECT SPECIFICATION", "F0FDF4", "16A34A")

    # ── Section 1: Executive Summary ─────────────────────────────────────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. Executive Summary & Product Vision")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    p = doc.add_paragraph()
    p.add_run(
        "Sikho-AI (\"Sikho\" means 'learn' in Hindi) is a full-stack career acceleration, AI mentoring, "
        "and decentralized micropayment ecosystem. It transforms tech career preparation from expensive, "
        "subscription-locked models ($30-$100/mo) into an open, high-precision, pay-per-use marketplace.\n\n"
        "By integrating Groq's high-speed LLM inference clusters with the x402 HTTP micropayment protocol "
        "on Algorand TestNet, Sikho-AI allows developers to pay pennies ($0.05 - $0.50 USDC) directly from "
        "their non-custodial Web3 wallets (Pera, Defly, Lute, Exodus) for instant, tailored resume analysis, "
        "adaptive mock interviews, interactive code reviews, and visual technical breakdowns."
    )

    # ── Section 2: Technical Architecture & Core Stack ──────────────────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("2. Technical Architecture & Technology Stack")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    p = doc.add_paragraph("The Sikho-AI platform comprises four primary interconnected tiers:")
    
    stack_table = doc.add_table(rows=1, cols=3)
    style_table(
        stack_table,
        [1.8, 2.2, 2.8],
        ["Architecture Layer", "Technologies / Libraries", "Detailed Technical Function"],
        [
            ["Frontend Single Page App", "React 18, TypeScript, Vite, TailwindCSS, Lucide Icons, Notistack", "Responsive user interface, real-time feedback, wallet connection hooks, code editors, interactive mind maps, visualizer canvas."],
            ["Web3 Wallet Integration", "@txnlab/use-wallet-react (Pera, Defly, Lute, Exodus, KMD)", "Connects non-custodial Algorand wallets, manages account balances, signs on-chain USDC transactions for x402 challenges."],
            ["API Gateway & Services", "Node.js, Express.js, TypeScript, Mongoose, JWT, bcrypt, Nodemailer", "User authentication, course catalog, purchase ledger, analytics tracking, x402 verification middleware, proxy routes."],
            ["AI & Parsing Microservice", "Python 3.11, FastAPI, Groq SDK, pypdf, python-docx, uvicorn", "Multi-format document parsing (PDF, DOCX, TXT), prompt orchestration, gap matrix computation, engineering scenario evaluation."],
            ["High-Throughput LLM Pool", "Groq Cloud (openai/gpt-oss-120b, LLaMA-3.3-70B)", "Dedicated 8-key rotating pool (GROQ_API_KEY_20 to GROQ_API_KEY_27) ensuring zero downtime, 100+ tokens/sec, and rate-limit immunity."],
            ["Payment & Settlement", "x402 HTTP Standard, GoPlausible Facilitator, Algorand TestNet", "HTTP 402 challenge header generation, on-chain signature verification, sub-second USDC settlement, replay attack prevention."],
            ["Database Tier", "MongoDB Atlas / Local MongoDB", "Stores user profiles, course data, lesson progress, review reports, transactions, and API registries."]
        ]
    )
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ── Section 3: Exhaustive Feature Breakdown ──────────────────────────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("3. Exhaustive Feature-by-Feature Breakdown")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    features = [
        ("3.1 🎤 AI Interview Prep Studio & Adaptive Mock Interviews", [
            ("Multi-Tier Role & Seniority Customization", "Candidates select target roles (Frontend, Backend, Fullstack, DevOps, ML/AI, System Architect) and target seniority (Beginner, Intermediate, Senior, Staff/Principal) with custom prep timeframes (e.g. 7-day sprint)."),
            ("9-Step Progressive Learning Path", "Transforms identified resume/JD gaps into a deep 9-stage engineering curriculum: WHY (Real-World Problem) → WHAT (Core Theory) → HOW (Internals & Mechanics) → REAL WORLD (Production Architecture) → SCENARIO CHALLENGE → PROGRESSIVE HINTS → FOLLOW-UPS → STAR INTERVIEW CONNECTION."),
            ("Interactive Engineering Scenario Sandbox", "Presents real production architectural incidents (e.g., distributed cache stampedes, database replication lag, race conditions). Candidates write or speak their proposed solution and trade-offs."),
            ("Principal Engineer Rubric Evaluation", "Grades candidate responses across 5 axes (Overall Score, Concept Understanding, Real-World Mechanics, Engineering Reasoning, Interview Readiness). Identifies candidate strengths, highlights missed edge cases, and provides a model Staff Engineer solution."),
            ("Targeted Question Bank & STAR Method Answers", "Generates 6-10 high-yield interview questions targeting candidate gaps with full STAR-format (Situation, Task, Action, Result) answers and trade-off explanations."),
            ("Speech-to-Text & Audio Simulation", "Simulated voice-driven mock interviews with browser speech recognition and speech synthesis.")
        ]),
        ("3.2 📄 Resume Intelligence & AI Skill Gap Engine", [
            ("Universal Document Parsing", "Automatically extracts, sanitizes, and normalizes candidate resumes from PDF (pypdf), DOCX (python-docx), and plain text formats."),
            ("4-Factor Semantic Match Scoring", "Calculates Overall Match %, Skills Match %, Experience Match %, and Domain Fit %."),
            ("Prioritized Missing Skills Matrix", "Categorizes missing skills into High, Medium, and Low priorities, detailing why the skill is critical for the target JD and exact recommendations to learn it."),
            ("Skills to Strengthen", "Detects technologies listed on the resume that lack demonstrable depth, providing proof-of-work project suggestions."),
            ("Experience Gap Bridges", "Flags missing production competencies (e.g., zero-downtime database migrations, distributed tracing) and provides concrete bridging strategies."),
            ("24-48 Hour Quick Wins & 3-Phase Action Plan", "Gives immediate high-yield preparation items alongside short-term (Week 1), medium-term (Week 2-3), and long-term roadmaps."),
            ("Live Job Matching (Apify Integration)", "Queries live job openings matching the candidate's refined skill profile across major job platforms."),
            ("Resume Bullet-Point Optimizer", "Refactors raw resume bullet points to adhere to Google's XYZ formula (Accomplished [X], as measured by [Y], by doing [Z]).")
        ]),
        ("3.3 💡 Visual Explainer & MindMap Synthesizer", [
            ("Layered Conceptual Deconstruction", "Deconstructs complex algorithms and system designs into beginner, intermediate, and senior architectural visual layers."),
            ("Interactive MindMap Canvas", "Generates interactive hierarchical node-and-edge mind maps illustrating how distributed components communicate."),
            ("Side-by-Side Technology Comparison", "Creates structured trade-off matrices comparing competing technologies (e.g., Kafka vs RabbitMQ, SQL vs NoSQL, REST vs gRPC)."),
            ("Stateful Continuous Synthesis", "Maintains session state allowing users to drill down into sub-concepts with contextual follow-up prompts.")
        ]),
        ("3.4 🏗️ Build Studio & GitHub Repository Reviewer", [
            ("Monetizable API Builder", "Enables developers to configure, test, and monetize their own AI tools and backend endpoints using the x402 protocol."),
            ("Full-Repository Static & AI Analysis", "Ingests public GitHub repository URLs or Pull Requests to evaluate codebase architecture, test coverage, security vulnerabilities, and code smell patterns."),
            ("Modular Architecture Scoring", "Grades codebases across maintainability, modularity, security, performance, and documentation completeness."),
            ("Instant PDF/Doc Audit Reports", "Generates downloadable code audit and architectural review certificates.")
        ]),
        ("3.5 🔌 Interactive x402 Live API Playground", [
            ("Live HTTP 402 Inspection", "Developers can trigger raw API requests and inspect the returned HTTP 402 Payment-Required headers and payload specifications."),
            ("Automated Wallet Challenge Handshake", "Prompts connected Algorand wallets with precise transaction payloads matching the API endpoint price tag."),
            ("Header Injection & Signature Verification", "Demonstrates how client applications attach payment signature headers (x402-payment-sig) to access premium resources seamlessly.")
        ]),
        ("3.6 💸 x402 Micropayments Protocol on Algorand", [
            ("HTTP 402 Payment Standard", "Implements the open web monetization specification where API servers signal costs directly in HTTP responses."),
            ("Algorand USDC Settlement", "Leverages Algorand's fast 3.3-second block finality and minimal gas fee to make sub-dollar transactions economically viable."),
            ("Multi-Wallet Support", "Connects instantly with Pera Mobile/Web, Defly Wallet, Lute, and Exodus."),
            ("GoPlausible Facilitator Integration", "Verifies signed transactions, prevents replay attacks, submits to Algorand TestNet, and returns proof-of-settlement tokens."),
            ("Split Revenue & Platform Fees", "Automatically distributes micropayment revenue between content creators, API builders, and the platform.")
        ]),
        ("3.7 📊 Learner Dashboard & 🛡️ 3.8 Admin Dashboard", [
            ("Learner Dashboard", "Personal learning hub displaying enrolled courses, completed interview tracks, resume gap history, mock interview progress radar, and on-chain payment history."),
            ("Admin Control Center", "Comprehensive operational dashboard featuring real-time revenue analytics (total USDC collected, transaction volume, platform fee revenue), user management (role promotion, suspension), course moderation, and API health monitoring."),
            ("Enterprise Security & Auth", "JWT token-based session management, bcrypt salt rounds, secure HTTP-only cookies, and automated transactional emails via Nodemailer."),
            ("Fault-Tolerant Key Rotation", "Rotates across a dedicated pool of 8 Groq API keys (GROQ_API_KEY_20 to GROQ_API_KEY_27) to guarantee zero rate-limit downtime.")
        ])
    ]

    for f_heading, bullets in features:
        h2 = doc.add_heading(level=2)
        r = h2.add_run(f_heading)
        r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
        for b_title, b_desc in bullets:
            bp = doc.add_paragraph(style='List Bullet')
            r1 = bp.add_run(f"{b_title}: ")
            r1.bold = True
            r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
            r2 = bp.add_run(b_desc)
            r2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # ── Section 4: API Catalog ───────────────────────────────────────────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("4. Complete API Endpoint Catalog")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    api_table = doc.add_table(rows=1, cols=4)
    style_table(
        api_table,
        [1.0, 2.0, 1.3, 2.5],
        ["Method", "Endpoint Route", "Protection Tier", "Description & Response Logic"],
        [
            ["POST", "/api/auth/register", "Public", "Registers new user, hashes password with bcrypt, sends SMTP welcome email."],
            ["POST", "/api/auth/login", "Public", "Authenticates credentials, issues JWT token with role and user ID."],
            ["POST", "/analyze-text", "x402 / Protected", "FastAPI Python engine: Full JD vs Resume 9-step gap analysis."],
            ["POST", "/evaluate-scenario", "Protected", "FastAPI: Evaluates student engineering solution with Principal rubric."],
            ["POST", "/upload", "x402 / Protected", "FastAPI: Uploads PDF/DOCX and executes full gap extraction."],
            ["GET", "/api/interview-pro/health", "Public", "Groq key pool health check & active key count."],
            ["POST", "/api/resume/analyze", "x402 Micropayment", "Full resume analysis & scoring engine."],
            ["POST", "/api/resume/jobs", "Protected", "Live job matching via Apify web scraper integration."],
            ["POST", "/api/ai/visual-explain", "x402 Micropayment", "Deconstructs code/concept into visual explanation layers."],
            ["POST", "/api/ai/mindmap", "Protected", "Generates structured JSON hierarchy for mindmap rendering."],
            ["POST", "/api/ai/compare", "Protected", "Generates multi-attribute trade-off matrix between two technologies."],
            ["POST", "/api/code-review/analyze", "x402 Micropayment", "Static & AI repository security/architecture review."],
            ["GET", "/api/courses", "Public / Auth", "Course listing, filtering by category and difficulty."],
            ["GET", "/api/admin/analytics", "Admin Only", "Platform-wide volume, user counts, and USDC fee collections."],
            ["GET", "/api/x402/verify", "x402 Protocol", "Facilitator transaction verification & access clearance."]
        ]
    )
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ── Section 5: End-to-End User Workflows ─────────────────────────────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("5. Core User & Payment Workflows")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    wf_bullets = [
        ("Workflow 1: AI Resume Gap Analysis & Learning Path",
         "1. Candidate navigates to Resume Intelligence page (/resume-intelligence).\n"
         "2. Uploads resume (PDF/DOCX) and pastes the target job description.\n"
         "3. System prompts an x402 payment challenge ($0.10 USDC on Algorand TestNet).\n"
         "4. User approves transaction in Pera/Defly wallet.\n"
         "5. Python microservice parses document, queries Groq LLM cluster (openai/gpt-oss-120b), and returns 4 match scores, missing skills matrix, quick wins, and the 9-step learning journey."),
        ("Workflow 2: Adaptive Mock Interview & Engineering Scenario Evaluation",
         "1. Candidate selects target role, level, and prep timeline in Interview Prep Studio (/interview-prep).\n"
         "2. Candidate attempts realistic system design / coding scenario challenges.\n"
         "3. Candidate types or dictates their architectural solution.\n"
         "4. AI evaluates response against Principal Engineer rubric and returns 0-100 scores, missed edge cases, and a model Staff Engineer solution."),
        ("Workflow 3: x402 Micropayment Lifecycle",
         "1. Client makes request to payment-gated endpoint.\n"
         "2. Server responds with HTTP Status 402 Payment Required and JSON payment details (price, receiver address, asset ID).\n"
         "3. Frontend prompts wallet to sign Algorand Asset Transfer transaction.\n"
         "4. Signed transaction is sent to GoPlausible Facilitator for on-chain verification.\n"
         "5. Facilitator verifies validity, broadcasts to Algorand TestNet, and returns settlement signature.\n"
         "6. Client replays request with x402-payment-sig header to unlock the AI resource.")
    ]
    for w_title, w_desc in wf_bullets:
        h3 = doc.add_heading(level=3)
        r = h3.add_run(w_title)
        r.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)
        p = doc.add_paragraph(w_desc)
        p.paragraph_format.space_after = Pt(6)

    # ── Section 6: Summary Table ────────────────────────────────────────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("6. Sikho-AI Competitive Advantages")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    summary_data = [
        ["Zero Subscription Lock-in", "Users pay per feature usage via Algorand USDC micropayments (x402) rather than recurring monthly fees."],
        ["Real-World Interview Depth", "Simulates actual Principal Engineer interview standards rather than basic multiple-choice trivia."],
        ["Fault-Tolerant AI Engine", "Rotates across a dedicated pool of 8 Groq API keys to eliminate rate limits and maintain 99.9% uptime."],
        ["All-in-One Career Suite", "Combines resume intelligence, skill gap analysis, adaptive mock interviews, code reviews, and visual concept builders."],
        ["Seamless Web2 / Web3 Bridge", "Modern React/Tailwind user experience paired with non-custodial Web3 wallet integration."]
    ]
    sum_table = doc.add_table(rows=1, cols=2)
    style_table(sum_table, [2.5, 4.2], ["Core Dimension", "Sikho-AI Advantage"], summary_data, header_bg="0F766E")

    for path in file_paths:
        doc.save(path)
        print(f"Saved document to: {path}")

if __name__ == "__main__":
    p1 = os.path.abspath("c:/Users/krish/Desktop/xx/sikho-AI/Sikho-AI_Complete_Project_Specification_and_Features.docx")
    p2 = os.path.abspath("c:/Users/krish/Desktop/Sikho-AI_Complete_Project_Specification_and_Features.docx")
    generate_comprehensive_docx([p1, p2])
