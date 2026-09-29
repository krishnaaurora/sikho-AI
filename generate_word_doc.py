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

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
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
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    r_title = p.add_run(f"[{title}] ")
    r_title.bold = True
    r_title.font.name = "Arial"
    r_title.font.size = Pt(10)
    r_title.font.color.rgb = RGBColor(0x1A, 0x36, 0x5D)
    
    r_text = p.add_run(text)
    r_text.font.name = "Arial"
    r_text.font.size = Pt(10)
    r_text.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

def style_table(tbl, col_widths, headers, data, header_bg="1E3A8A", alt_bg="F8FAFC"):
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    # Set header row
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
            
    # Data rows
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

    # Set column widths
    for row in tbl.rows:
        for c_idx, width in enumerate(col_widths):
            row.cells[c_idx].width = Inches(width)

def build_document(output_path):
    doc = docx.Document()
    
    # Page setup
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)
        
    # Styles
    normal_style = doc.styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'Arial'
    normal_font.size = Pt(11)
    normal_font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    
    # Title Block
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    r_title = title_p.add_run("🎓 Sikho-AI Platform")
    r_title.font.name = 'Arial'
    r_title.font.size = Pt(26)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A) # Deep Navy
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(16)
    r_sub = sub_p.add_run("Comprehensive Product Specification, Feature Guide & Technical Architecture")
    r_sub.font.name = 'Arial'
    r_sub.font.size = Pt(14)
    r_sub.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)
    
    # Metadata Box
    add_callout(doc, "Platform: Sikho-AI | Protocol: x402 HTTP Payment Standard | Blockchain: Algorand TestNet (USDC) | AI Engine: Groq High-Throughput LLM Cluster (openai/gpt-oss-120b, LLaMA 3, Mixtral) | Architecture: Hybrid React SPA + Node.js/Express + Python/FastAPI Microservices", "SYSTEM SUMMARY", "F0FDF4", "16A34A")

    # ─────────────────────────────────────────────────────────────
    # SECTION 1: EXECUTIVE SUMMARY & VISION
    # ─────────────────────────────────────────────────────────────
    h1 = doc.add_heading(level=1)
    h1_r = h1.add_run("1. Executive Summary & Vision")
    h1_r.font.name = 'Arial'
    h1_r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    p = doc.add_paragraph()
    p.add_run(
        "Sikho-AI (\"Sikho\" means 'learn' in Hindi) is a next-generation AI-powered career accelerator, "
        "interview preparation ecosystem, and decentralized micro-learning marketplace. "
        "Traditional career preparation platforms force users into expensive recurring subscriptions ($30-$100/month) "
        "and offer rigid, one-size-fits-all question sets. Sikho-AI solves both problems by coupling:\n\n"
        "1. Real-time, highly personalized AI career intelligence powered by Groq LLMs that analyze real candidate resumes "
        "against real job descriptions to identify granular knowledge gaps.\n"
        "2. Frictionless, pay-per-use micropayments via the x402 HTTP payment protocol on the Algorand blockchain (USDC), "
        "letting students and developers pay pennies (e.g., $0.05 to $0.50) strictly for the mock interviews, resume audits, "
        "or API tool runs they actually use without subscriptions or lock-in."
    )
    
    # ─────────────────────────────────────────────────────────────
    # SECTION 2: HIGH-LEVEL ARCHITECTURE & TECH STACK
    # ─────────────────────────────────────────────────────────────
    h1 = doc.add_heading(level=1)
    h1_r = h1.add_run("2. System Architecture & Tech Stack")
    h1_r.font.name = 'Arial'
    h1_r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    p = doc.add_paragraph("The Sikho-AI platform is engineered with a modular, high-availability multi-tier architecture:")
    
    # Architecture Table
    tech_table = doc.add_table(rows=1, cols=3)
    style_table(
        tech_table,
        [1.8, 2.2, 2.5],
        ["Architecture Layer", "Technologies Used", "Core Responsibility"],
        [
            ["Frontend Client", "React 18, TypeScript, Vite, TailwindCSS, Lucide Icons", "Responsive SPA, Wallet Connection UI, Interactive Visualizers, Monaco Editor"],
            ["Web3 Wallet Layer", "@txnlab/use-wallet-react (Pera, Defly, Lute, Exodus, KMD)", "Algorand TestNet wallet connectivity, transaction signing, account state"],
            ["API Gateway & Auth", "Node.js, Express.js, TypeScript, JWT, bcrypt, Nodemailer", "User authentication, course management, analytics, x402 middleware proxy"],
            ["AI & Parsing Engine", "Python 3.11, FastAPI, Groq SDK, pypdf, python-docx", "High-throughput LLM reasoning, document extraction, gap matrix generation"],
            ["LLM Inference Cluster", "Groq Cloud (openai/gpt-oss-120b, LLaMA-3.3-70B)", "Rotating key pool (GROQ_API_KEY_20..27) for fault-tolerant AI generation"],
            ["Payment Protocol", "x402 HTTP Standard, GoPlausible Facilitator", "HTTP 402 challenge header generator, signature verification, settlement"],
            ["Settlement Ledger", "Algorand TestNet (Asset ID: 10458941 - USDC)", "Sub-second, ultra-low fee ($0.001) on-chain settlement & receipt recording"],
            ["Database Tier", "MongoDB & Mongoose ODM", "User profiles, course catalogue, purchase ledger, review histories"]
        ]
    )
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ─────────────────────────────────────────────────────────────
    # SECTION 3: COMPREHENSIVE FEATURE BREAKDOWN
    # ─────────────────────────────────────────────────────────────
    h1 = doc.add_heading(level=1)
    h1_r = h1.add_run("3. Exhaustive Feature-by-Feature Breakdown")
    h1_r.font.name = 'Arial'
    h1_r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    # Feature 3.1
    h2 = doc.add_heading(level=2)
    h2_r = h2.add_run("3.1 🎤 AI Interview Prep Studio & Adaptive Mock Interviews")
    h2_r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    p = doc.add_paragraph(
        "The Interview Prep Studio delivers an adaptive, high-yield technical interview preparation "
        "environment designed by senior principal architects and executive recruiters."
    )
    
    f1_bullets = [
        ("Role & Seniority Customization: ", "Supports customization by target role (Frontend, Backend, Fullstack, DevOps, ML/AI, System Architect), experience tier (Beginner, Intermediate, Senior, Staff/Principal), and target preparation timeframe (e.g. 7-day sprint)."),
        ("9-Step Progressive Learning Journey: ", "Transforms conceptual weaknesses into structured engineering mastery: WHY (Problem Context) → WHAT (Core Theory) → HOW (Internal Mechanics) → REAL WORLD (Production Architecture) → SCENARIO CHALLENGE → PROGRESSIVE HINTS → FOLLOW-UPS → INTERVIEW CONNECTION."),
        ("Interactive Scenario Sandbox: ", "Presents real-world production incidents and architectural dilemmas (e.g. distributed cache stampedes, database replication lag, eventual consistency vs strict locking). Students submit their proposed solution and receive deep AI architectural evaluation."),
        ("Principal Engineer Rubric Evaluation: ", "Scores user submissions across 5 axes: Overall Score, Concept Understanding, Real-World Mechanics, Engineering Reasoning, and Interview Readiness. Highlights identified strengths, missed edge-cases/failure modes, and provides a 'Staff Engineer Sample Solution'."),
        ("Targeted Question Bank & STAR Method Answers: ", "Generates 6-10 high-yield interview questions targeting candidate gaps with full STAR-format (Situation, Task, Action, Result) answers and trade-off explanations."),
        ("Speech-to-Text & Audio Simulation: ", "Supports simulated voice-driven mock interviews with speech recognition and speech synthesis to mimic real-world verbal interview conditions.")
    ]
    for b_title, b_desc in f1_bullets:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(b_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        r2 = bp.add_run(b_desc)
        r2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Feature 3.2
    h2 = doc.add_heading(level=2)
    h2_r = h2.add_run("3.2 📄 Resume Intelligence & AI Skill Gap Engine")
    h2_r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    p = doc.add_paragraph(
        "The Resume Intelligence module parses unstructured resumes and performs multidimensional semantic comparison "
        "against target Job Descriptions (JDs)."
    )
    
    f2_bullets = [
        ("Universal Document Parser: ", "Extracts and cleans text from PDF (pypdf), DOCX (python-docx), and plain text files with automatic formatting normalization."),
        ("Four-Factor Match Scoring: ", "Computes granular match metrics: Overall Match %, Skills Match %, Experience Match %, and Domain Fit %."),
        ("Prioritized Missing Skills Matrix: ", "Categorizes missing skills by priority (High / Medium / Low), explains why the skill is critical for the target JD, and provides exact recommendations for bridging the gap."),
        ("Skills to Strengthen: ", "Identifies technologies mentioned on the resume that lack sufficient depth, detailing target mastery levels and proof-of-work project suggestions."),
        ("Experience Gap Bridges: ", "Flags missing production competencies (e.g., zero-downtime migrations, distributed tracing) and provides concrete bridge strategies."),
        ("24-48 Hour Quick Wins & 3-Phase Action Plan: ", "Gives immediate actionable items for upcoming interviews alongside a structured short-term and medium-term preparation roadmap."),
        ("Live Job Scraping & Matching (Apify Integration): ", "Queries real-time job openings from top job boards matching the candidate's refined skill profile."),
        ("Resume Bullet-Point Optimizer: ", "Analyzes individual resume bullet points to apply the Google XYZ formula (Accomplished [X], as measured by [Y], by doing [Z]).")
    ]
    for b_title, b_desc in f2_bullets:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(b_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        r2 = bp.add_run(b_desc)
        r2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Feature 3.3
    h2 = doc.add_heading(level=2)
    h2_r = h2.add_run("3.3 💡 Visual Explainer & MindMap Knowledge Synthesizer")
    h2_r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    f3_bullets = [
        ("Multi-Level Concept Breakdown: ", "Explains complex algorithms, systems, and protocols with customizable abstraction levels (Beginner, Intermediate, Senior Architect)."),
        ("Interactive MindMap Visualizer: ", "Generates dynamic node-and-edge hierarchical mind maps illustrating how system components interconnect."),
        ("Side-by-Side Comparative Analyzer: ", "Generates structural trade-off matrices between competing technologies (e.g. Kafka vs RabbitMQ, SQL vs NoSQL, REST vs gRPC, Optimistic vs Pessimistic Locking)."),
        ("Continuous Synthesis Sessions: ", "Maintains session state allowing users to drill down infinitely into sub-concepts with contextual follow-up prompts.")
    ]
    for b_title, b_desc in f3_bullets:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(b_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        r2 = bp.add_run(b_desc)
        r2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Feature 3.4
    h2 = doc.add_heading(level=2)
    h2_r = h2.add_run("3.4 🏗️ Build Studio & GitHub Repository Reviewer")
    h2_r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    f4_bullets = [
        ("Monetizable API Endpoint Builder: ", "Allows developers to create, configure, and monetize their own AI tools and backend endpoints using the x402 protocol."),
        ("Full-Repository Static & AI Analysis: ", "Ingests public GitHub repository URLs or Pull Requests to evaluate codebase architecture, test coverage, security vulnerabilities, and code smell patterns."),
        ("Modular Architecture Scoring: ", "Grades codebases across maintainability, modularity, security, performance, and documentation completeness."),
        ("Instant PDF/Doc Audit Reports: ", "Generates downloadable code audit and architectural review certificates.")
    ]
    for b_title, b_desc in f4_bullets:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(b_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        r2 = bp.add_run(b_desc)
        r2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Feature 3.5
    h2 = doc.add_heading(level=2)
    h2_r = h2.add_run("3.5 🔌 Interactive x402 Live API Playground")
    h2_r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    f5_bullets = [
        ("Live HTTP 402 Inspection: ", "Developers can trigger raw API requests and inspect the returned HTTP 402 Payment-Required headers and payload specifications."),
        ("Automated Wallet Challenge Handshake: ", "Prompts connected Algorand wallets with precise transaction payloads matching the API endpoint price tag."),
        ("Header Injection & Signature Verification: ", "Demonstrates how client applications attach payment signature headers (`x402-payment-sig`) to access premium resources seamlessly.")
    ]
    for b_title, b_desc in f5_bullets:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(b_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        r2 = bp.add_run(b_desc)
        r2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Feature 3.6
    h2 = doc.add_heading(level=2)
    h2_r = h2.add_run("3.6 💸 x402 Micropayments & Algorand Blockchain Layer")
    h2_r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    f6_bullets = [
        ("HTTP 402 Payment Standard: ", "Implements the open web monetization specification where API servers signal costs directly in HTTP responses."),
        ("Algorand USDC Settlement: ", "Leverages Algorand's fast 3.3-second block finality and minimal gas fee to make sub-dollar transactions economically viable."),
        ("Multi-Wallet Support: ", "Connects instantly with Pera Mobile/Web, Defly Wallet, Lute, and Exodus."),
        ("GoPlausible Facilitator Integration: ", "Verifies signed transactions, prevents replay attacks, submits to Algorand TestNet, and returns proof-of-settlement tokens."),
        ("Split Revenue & Platform Fees: ", "Automatically distributes micropayment revenue between content creators, API builders, and the platform.")
    ]
    for b_title, b_desc in f6_bullets:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(b_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        r2 = bp.add_run(b_desc)
        r2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Feature 3.7 & 3.8
    h2 = doc.add_heading(level=2)
    h2_r = h2.add_run("3.7 📊 Learner Dashboard & 3.8 🛡️ Admin Dashboard")
    h2_r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    f7_bullets = [
        ("Learner Dashboard: ", "Personal learning hub displaying enrolled courses, completed interview tracks, resume gap history, mock interview progress radar, and on-chain payment history."),
        ("Admin Control Center: ", "Comprehensive operational dashboard featuring real-time revenue analytics (total USDC collected, transaction volume, platform fee revenue), user management (role promotion, suspension), course moderation, and API health monitoring."),
        ("Enterprise Security & Auth: ", "JWT token-based session management, bcrypt salt rounds, secure HTTP-only cookies, and automated transactional emails via Nodemailer.")
    ]
    for b_title, b_desc in f7_bullets:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(b_title)
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        r2 = bp.add_run(b_desc)
        r2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # ─────────────────────────────────────────────────────────────
    # SECTION 4: COMPLETE API ENDPOINT CATALOG
    # ─────────────────────────────────────────────────────────────
    h1 = doc.add_heading(level=1)
    h1_r = h1.add_run("4. API Endpoint Directory & Routing Architecture")
    h1_r.font.name = 'Arial'
    h1_r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    doc.add_paragraph("The following table outlines the complete route structure across the backend services:")
    
    api_table = doc.add_table(rows=1, cols=4)
    style_table(
        api_table,
        [1.0, 1.8, 1.2, 2.5],
        ["Method", "Endpoint Route", "Protection", "Description & Logic"],
        [
            ["POST", "/api/auth/register", "Public", "User registration, password hash, welcome email dispatch"],
            ["POST", "/api/auth/login", "Public", "JWT authentication & profile verification"],
            ["POST", "/analyze-text", "x402 / Protected", "FastAPI Python engine: Full JD vs Resume 9-step gap analysis"],
            ["POST", "/evaluate-scenario", "Protected", "FastAPI: Evaluates student engineering solution with Principal rubric"],
            ["POST", "/upload", "x402 / Protected", "FastAPI: Uploads PDF/DOCX and executes full gap extraction"],
            ["GET", "/api/interview-pro/health", "Public", "Groq key pool health check & active key count"],
            ["POST", "/api/resume/analyze", "x402 Micropayment", "Full resume analysis & scoring engine"],
            ["POST", "/api/resume/jobs", "Protected", "Live job matching via Apify web scraper integration"],
            ["POST", "/api/ai/visual-explain", "x402 Micropayment", "Deconstructs code/concept into visual explanation layers"],
            ["POST", "/api/ai/mindmap", "Protected", "Generates structured JSON hierarchy for mindmap rendering"],
            ["POST", "/api/ai/compare", "Protected", "Generates multi-attribute trade-off matrix between two technologies"],
            ["POST", "/api/code-review/analyze", "x402 Micropayment", "Static & AI repository security/architecture review"],
            ["GET", "/api/courses", "Public / Auth", "Course listing, filtering by category and difficulty"],
            ["GET", "/api/admin/analytics", "Admin Only", "Platform-wide volume, user counts, and USDC fee collections"],
            ["GET", "/api/x402/verify", "x402 Protocol", "Facilitator transaction verification & access clearance"]
        ]
    )
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ─────────────────────────────────────────────────────────────
    # SECTION 5: STEP-BY-STEP USER FLOWS
    # ─────────────────────────────────────────────────────────────
    h1 = doc.add_heading(level=1)
    h1_r = h1.add_run("5. Core User Workflows & Protocol Lifecycle")
    h1_r.font.name = 'Arial'
    h1_r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    workflows = [
        ("Workflow A: AI Resume Gap Analysis & Learning Path Generation",
         "1. User navigates to Resume Intelligence page (/resume-intelligence).\n"
         "2. User uploads their PDF/DOCX resume and pastes the target job description.\n"
         "3. The system initiates an x402 payment request ($0.10 USDC).\n"
         "4. User approves the transaction in Pera/Defly wallet.\n"
         "5. The Python microservice parses text using pypdf/docx, runs prompt synthesis over the Groq LLM cluster (openai/gpt-oss-120b).\n"
         "6. The response renders an interactive dashboard: 4 match scores, missing skills breakdown, 24h quick wins, and a tailored 9-step learning journey."),
        ("Workflow B: Adaptive Mock Interview & Scenario Evaluation",
         "1. User accesses Interview Prep Studio (/interview-prep) and selects target role & timeframe.\n"
         "2. User explores generated question banks and attempts live engineering scenarios.\n"
         "3. User types or speaks their architectural solution.\n"
         "4. Backend calls /evaluate-scenario with Principal Engineer prompts.\n"
         "5. User receives detailed rubric scores (0-100), missed edge cases, and a model Staff Engineer solution."),
        ("Workflow C: x402 Decentralized Micropayment Lifecycle",
         "1. Client makes an unauthenticated or unpaid request to a protected endpoint.\n"
         "2. Server responds with HTTP Status 402 Payment Required and JSON payment details (price, receiver address, asset ID).\n"
         "3. Frontend prompts user wallet to sign an Algorand Asset Transfer transaction.\n"
         "4. Signed transaction is transmitted to the GoPlausible Facilitator for on-chain verification.\n"
         "5. Facilitator verifies validity, submits to Algorand TestNet, and returns a verified signature.\n"
         "6. Client replays the request with `x402-payment-sig` header to unlock the AI resource instantly.")
    ]
    for w_title, w_desc in workflows:
        h3 = doc.add_heading(level=3)
        h3_r = h3.add_run(w_title)
        h3_r.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)
        p = doc.add_paragraph(w_desc)
        p.paragraph_format.space_after = Pt(8)

    # ─────────────────────────────────────────────────────────────
    # SECTION 6: SUMMARY & KEY HIGHLIGHTS
    # ─────────────────────────────────────────────────────────────
    h1 = doc.add_heading(level=1)
    h1_r = h1.add_run("6. Competitive Advantages & Key Highlights")
    h1_r.font.name = 'Arial'
    h1_r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    summary_data = [
        ["Zero Subscription Lock-in", "Users only pay for what they consume via Algorand USDC micropayments (x402)."],
        ["Real-World Interview Depth", "Goes far beyond basic LeetCode trivia by simulating real Staff Engineer architectural decision-making."],
        ["Fault-Tolerant AI Engine", "Rotates across a dedicated pool of 8 Groq API keys to eliminate rate limits and maintain 99.9% uptime."],
        ["End-to-End Career Suite", "Integrates resume parsing, skill gap analysis, custom study tracks, mock interviews, and repository code reviews in one unified platform."],
        ["Web3 + Web2 Synergy", "Seamlessly combines modern Web2 UX (Vite/React/Tailwind) with Web3 non-custodial wallet infrastructure."]
    ]
    sum_table = doc.add_table(rows=1, cols=2)
    style_table(sum_table, [2.5, 4.0], ["Key Dimension", "Sikho-AI Advantage"], summary_data, header_bg="0F766E")
    
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    out_file = os.path.abspath("c:/Users/krish/Desktop/xx/sikho-AI/Sikho-AI_Complete_Project_Specification_and_Features.docx")
    build_document(out_file)
