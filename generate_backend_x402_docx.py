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
            <w:left w:val="single" w:sz="28" w:space="0" w:color="{border_hex}"/>
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
    r_text.font.size = Pt(9.5)
    r_text.font.color.rgb = RGBColor(0x2D, 0x37, 0x48)
    
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_after = Pt(4)

def add_code_block(doc, code_text, lang_label="JSON / TYPESCRIPT"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "1E293B")
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    
    r_lbl = p.add_run(f"// {lang_label}\n")
    r_lbl.font.name = "Consolas"
    r_lbl.font.size = Pt(8.5)
    r_lbl.font.bold = True
    r_lbl.font.color.rgb = RGBColor(0x94, 0xA3, 0xB8)
    
    r_code = p.add_run(code_text)
    r_code.font.name = "Consolas"
    r_code.font.size = Pt(9)
    r_code.font.color.rgb = RGBColor(0xE2, 0xE8, 0xF0)
    
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
            run.font.size = Pt(9.5)
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
                run.font.size = Pt(9)
                run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    for row in tbl.rows:
        for c_idx, width in enumerate(col_widths):
            row.cells[c_idx].width = Inches(width)

def generate_backend_x402_document(file_paths):
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
    
    # ── Document Title ───────────────────────────────────────────────────────────
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    r_title = title_p.add_run("⚡ Sikho-AI Backend Engineering & x402 Payment Lifecycle")
    r_title.font.name = 'Arial'
    r_title.font.size = Pt(21)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(10)
    r_sub = sub_p.add_run("Comprehensive Technical Guide: Transaction Performance, Multi-Tier Storage Architecture, and GoPlausible Facilitator Settlement")
    r_sub.font.name = 'Arial'
    r_sub.font.size = Pt(11.5)
    r_sub.font.color.rgb = RGBColor(0x47, 0x55, 0x69)
    
    add_callout(
        doc,
        "This architectural specification details the complete backend lifecycle of x402 HTTP micropayments in the Sikho-AI platform. "
        "It covers the end-to-end request-response flow, cryptographic transaction group signing, GoPlausible facilitator validation "
        "and on-chain broadcasting, MongoDB multi-tier persistence schemas, Algorand indexer synchronization, and split-fee revenue distribution.",
        "EXECUTIVE REFERENCE",
        "EFF6FF",
        "2563EB"
    )

    # ── Section 1: Executive Summary & System Architecture ────────────────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("1. System Architecture & Component Interactions")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    p = doc.add_paragraph(
        "Sikho-AI replaces conventional monthly software subscriptions ($30–$100/month) with fine-grained, "
        "cryptographically verified HTTP micropayments ($0.05–$0.50 USDC per operation). The backend is built to "
        "operate as a non-custodial Resource Server governed by the x402 standard, where access to high-value AI "
        "inference and automated code analysis is granted strictly upon verified on-chain settlement."
    )
    
    doc.add_paragraph("The backend ecosystem comprises five primary interconnected components:")
    
    comp_table = doc.add_table(rows=1, cols=3)
    style_table(
        comp_table,
        [1.6, 2.0, 3.2],
        ["Component Layer", "Technology / Stack", "Architectural Role & Functionality"],
        [
            ["Client Application", "React 18, Vite, TypeScript, @txnlab/use-wallet-react", "Initiates API calls, intercepts HTTP 402 Payment Required challenges, creates Algorand transaction groups, requests user cryptographic signatures via Pera/Defly/Lute wallets, and transmits Payment-Signature headers."],
            ["API Gateway & Resource Server", "Node.js, Express.js / Hono, TypeScript, Mongoose", "Enforces x402 middleware protection across premium routes, canonicalizes request endpoints, builds payment-required metadata, relays verification to GoPlausible, records local transaction ledgers, and dispatches services."],
            ["AI & Code Review Engines", "Python FastAPI, Groq SDK (8-key rotation pool), PyPDF", "Executes 9-step resume vs JD skill gap analyses, Principal Engineer interview rubric evaluations, and full GitHub codebase quality reviews upon verified payment."],
            ["x402 Facilitator", "GoPlausible Cloud Service (https://facilitator.goplausible.xyz)", "Decentralized verification and settlement engine. Validates cryptographic signatures, verifies sender balances, executes replay prevention, and broadcasts signed atomic transaction groups to the Algorand blockchain."],
            ["Persistence & Ledger Layer", "MongoDB Atlas (Database) + Algorand Blockchain Ledger", "Dual-tier storage model: On-chain ledger guarantees immutable, audit-proof settlement; MongoDB Atlas maintains relational tracking, user progress, session state, platform fee ledger, and rapid index queries."]
        ]
    )
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ── Section 2: How Transactions are Performing (Detailed Flow) ───────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("2. Transaction Performance & Complete End-to-End Lifecycle")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    p = doc.add_paragraph(
        "The x402 protocol turns standard HTTP request cycles into atomic, cryptographically secured economic exchanges. "
        "Below is the exact step-by-step transaction flow from the initial unauthenticated call to final resource delivery."
    )
    
    steps = [
        ("Step 1: Client Request Dispatch (Unauthenticated)",
         "The client frontend issues a standard HTTP request (GET or POST) to a premium endpoint (e.g., /api/v1/resume/quality or /api/v1/interview-prep).\n"
         "Because this initial request carries no payment proof (no Payment-Signature or X-PAYMENT header), the backend middleware intercepts it immediately."),
        
        ("Step 2: Backend Interception & HTTP 402 Challenge Generation",
         "The Express middleware (`enforceWorkspacePayment`) inspects request headers. Finding no payment header, it invokes `buildWorkspacePaymentRequired()` to construct a standardized x402 V2 response.\n"
         "The server halts request execution and returns HTTP Status 402 Payment Required along with response headers: PAYMENT-REQUIRED, X-PAYMENT-RESPONSE, and ACCESS-CONTROL-EXPOSE-HEADERS.\n"
         "The response body contains the price (e.g. 0.05 USDC = 50,000 micro-units), the receiver address (AVM_ADDRESS), the asset ID (ASA 31566704 on MainNet / 10458941 on TestNet), the CAIP-2 network identifier, and the Bazaar discovery schema."),
        
        ("Step 3: Atomic Transaction Group Construction",
         "The client's `@x402-avm/fetch` wrapper catches the 402 status. It reads the payment requirements and generates an atomic group of 2 Algorand transactions:\n"
         "• Transaction [0] (Setup Transaction - acfg/appl): Calls the Facilitator smart contract application to initialize the payment group context and attach metadata.\n"
         "• Transaction [1] (Payment Transfer - axfer): An Algorand Asset Transfer transaction transferring the exact micro-USDC amount from the user's wallet to the merchant's AVM_ADDRESS.\n"
         "Both transactions are bound together by an Algorand Group ID (`groupIndex` 0 and 1) ensuring all-or-nothing atomic execution on the blockchain."),
        
        ("Step 4: Non-Custodial Cryptographic Wallet Signing",
         "The client invokes `walletSigner.signTransactions([txn0, txn1])`. The browser triggers a signing popup via Pera, Defly, Lute, or Exodus.\n"
         "The user reviews the recipient, token asset, and amount, and authorizes the transaction with their private key.\n"
         "The wallet returns signed binary transaction arrays (`Uint8Array[]`)."),
        
        ("Step 5: Client Re-Execution with Payment-Signature Header",
         "The client encodes the signed group into a base64 string conforming to the x402 V2 PaymentPayload specification:\n"
         "• `Payment-Signature: base64({ x402Version: 2, payload: { paymentGroup: [signed_txn0, signed_txn1], paymentIndex: 1 }, accepted: { scheme: 'exact', network: '...', payTo: '...' } })`\n"
         "The client automatically replays the original HTTP request, this time attaching the `Payment-Signature` header."),
        
        ("Step 6: Server Forwarding & GoPlausible Facilitator Settlement",
         "The server's `enforceWorkspacePayment` middleware detects the `Payment-Signature` header, parses and decodes the payload, and calls `verifyX402Payment()`.\n"
         "The server issues an internal POST request to the GoPlausible Facilitator (`https://facilitator.goplausible.xyz/settle`) forwarding the payload and requirements.\n"
         "The facilitator cryptographically verifies the signatures, ensures sender balance and opt-in status, checks for replay attacks, broadcasts the transaction group to Algorand nodes, and waits for block confirmation (3.3-second block finality)."),
        
        ("Step 7: Facilitator Confirmation & Server Resource Fulfillment",
         "The Facilitator responds with `{ success: true, transaction: 'TX_ID_HASH', payer: 'SENDER_ADDRESS' }`.\n"
         "The server middleware records the transaction in MongoDB (`X402Transaction` & `Payment`), sets outgoing HTTP headers `X-PAYMENT-RESPONSE` with the transaction hash receipt, and calls `next()`.\n"
         "The target controller executes the high-throughput Groq AI inference or code review engine and returns HTTP 200 OK with the unlocked data payload.")
    ]
    
    for s_title, s_desc in steps:
        h3 = doc.add_heading(level=3)
        r = h3.add_run(s_title)
        r.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)
        p = doc.add_paragraph(s_desc)
        p.paragraph_format.space_after = Pt(4)

    # Add Transaction Flow Diagram Table
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    h3 = doc.add_heading(level=3)
    r = h3.add_run("Architectural Protocol Sequence Summary")
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    seq_table = doc.add_table(rows=1, cols=4)
    style_table(
        seq_table,
        [0.8, 1.8, 1.8, 2.4],
        ["Step #", "Source → Target", "Protocol Action / Payload", "HTTP / Blockchain State"],
        [
            ["1", "Browser → Express API", "GET/POST /api/v1/resource (no auth)", "HTTP 200 Pending"],
            ["2", "Express API → Browser", "HTTP 402 + Payment-Required JSON metadata", "HTTP 402 Payment Required"],
            ["3", "Browser ↔ User Wallet", "Atomic Group [Setup Txn + axfer 50,000 µUSDC]", "Cryptographic ECDSA Signature"],
            ["4", "Browser → Express API", "Replay request with Payment-Signature header", "HTTP 200 In-Flight"],
            ["5", "Express API → Facilitator", "POST /settle (x402 V2 payment payload)", "Verification Handshake"],
            ["6", "Facilitator → Algorand Node", "Broadcasts signed atomic transaction group", "On-Chain Settlement (Round Finality)"],
            ["7", "Facilitator → Express API", "Returns { success: true, transaction: txHash }", "Proof of Settlement Confirmed"],
            ["8", "Express API → Mongo / AI", "Saves X402Transaction + invokes Groq LLM", "DB Write + AI Inference (100+ tps)"],
            ["9", "Express API → Browser", "HTTP 200 OK + Data + X-PAYMENT-RESPONSE Header", "HTTP 200 Resource Unlocked"]
        ],
        header_bg="0F766E"
    )
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ── Section 3: How & Where Transactions are Storing ──────────────────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("3. Data Persistence Architecture: How & Where Data is Stored")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    p = doc.add_paragraph(
        "Sikho-AI employs a robust, resilient multi-tier persistence model. Transactions are simultaneously "
        "anchored immutably on the Algorand blockchain and indexed locally across dedicated MongoDB collections "
        "to ensure high-performance querying, accounting reconciliation, and platform auditability."
    )
    
    # Subsection 3.1: On-chain ledger
    h2 = doc.add_heading(level=2)
    r = h2.add_run("3.1 Tier 1: On-Chain Immutable Blockchain Ledger (Algorand MainNet / TestNet)")
    r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    p = doc.add_paragraph(
        "Every micropayment executed through x402 produces a permanent on-chain transaction on Algorand. "
        "Because Algorand utilizes Pure Proof of Stake (PPoS) with immediate finality, transactions are finalized "
        "within 3.3 seconds without risk of forks or reorganization."
    )
    
    onchain_table = doc.add_table(rows=1, cols=3)
    style_table(
        onchain_table,
        [1.8, 1.8, 3.2],
        ["On-Chain Parameter", "Production Value", "Technical Function & Cryptographic Guarantee"],
        [
            ["Network CAIP-2", "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=", "Global CAIP-2 identifier for Algorand MainNet (TestNet: algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=)."],
            ["Asset ID (ASA)", "31566704 (USDC MainNet)", "Official Circle USDC Standard Asset ID. Algorand TestNet ASA ID: 10458941."],
            ["Decimals & Atomic Units", "6 Decimals (1 USDC = 1,000,000 µUSDC)", "$0.05 fee is exactly 50,000 atomic units; $0.25 is 250,000 atomic units."],
            ["Recipient (payTo)", "AVM_ADDRESS / Treasury", "Authoritative merchant treasury wallet address where payment funds are settled."],
            ["Transaction Type", "Asset Transfer (axfer) in Atomic Group", "Standard ASA transfer linked atomically to a setup app call (acfg/appl)."],
            ["Transaction Note", "Base64 Encoded Metadata String", "Includes operation metadata: e.g., 'x402:resume_improvement', 'x402:interview_prep' for automated indexing."],
            ["Public Indexer Visibility", "Algonode / AlgoScan / Pera Explorer", "Publicly verifiable via `https://mainnet-idx.algonode.cloud/v2/transactions/{txId}`."]
        ]
    )
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Subsection 3.2: MongoDB Schemas
    h2 = doc.add_heading(level=2)
    r = h2.add_run("3.2 Tier 2: Application Database Schemas (MongoDB Atlas)")
    r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    p = doc.add_paragraph(
        "Inside MongoDB, transaction data is structured across specialized schemas tailored for operational efficiency, "
        "analytics tracking, split-fee reconciliation, and user entitlement verification."
    )
    
    # Model 1: X402Transaction
    p_m1 = doc.add_paragraph()
    r = p_m1.add_run("A. X402Transaction Model (`models/X402Transaction.model.ts`)")
    r.bold = True
    r.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    p_m1_desc = doc.add_paragraph(
        "A streamlined operational ledger recording every micropayment at the middleware layer. "
        "It stores the user identity, service ID, target resource, price, payer wallet address, blockchain transaction hash, and settlement status."
    )
    add_code_block(
        doc,
        """interface IX402Transaction extends Document {
  userId: string;
  serviceId: string;        // 'job_analysis', 'resume_improvement', 'interview_prep', etc.
  resourceId?: string;      // specific resumeId, jobId, or chapter path
  amount: number;           // e.g. 0.05, 0.25 (USDC)
  currency: string;         // 'USDC'
  walletAddress: string;    // Payer's public Algorand address
  txHash: string;           // On-chain Algorand transaction ID
  status: string;           // 'Success' | 'Failed'
  timestamp: Date;
}""",
        "TYPESCRIPT SCHEMA: X402Transaction"
    )

    # Model 2: ServiceTransaction
    p_m2 = doc.add_paragraph()
    r = p_m2.add_run("B. ServiceTransaction Model (`models/ServiceTransaction.model.ts`)")
    r.bold = True
    r.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    p_m2_desc = doc.add_paragraph(
        "Manages complex multi-party and split-payment transactions (e.g. GitHub code reviews via Prism). "
        "Tracks the breakdown between the total user fee ($0.25), platform fee ($0.05), and downstream provider cost ($0.20), "
        "along with multi-state workflow tracking (`pending` → `payment_confirmed` → `processing` → `completed`)."
    )
    add_code_block(
        doc,
        """interface IServiceTransaction extends Document {
  requestId: string;                // Unique UUID for tracking
  userId: string;                   // User initiating request
  serviceId: string;                // 'prism-code-review'
  providerId: string;               // 'Prism'
  providerAmount: number;           // $0.20 USDC
  platformFee: number;              // $0.05 USDC
  userAmount: number;               // $0.25 USDC total
  currency: string;                 // 'USDC'
  network: string;                  // 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8='
  status: ServiceTransactionStatus; // 'payment_confirmed' | 'completed' | 'failed'
  userPaymentTxId?: string;         // Algorand TxID from user to Sikho treasury
  providerPaymentTxId?: string;     // Algorand TxID from Sikho to provider
  requestPayload: {                 // Snapshot of analyzed payload
    file_path?: string;
    raw_url?: string;
    code?: string;
    language?: string;
  };
  result?: any;                     // AI / Code audit result JSON
  completedAt?: Date;
}""",
        "TYPESCRIPT SCHEMA: ServiceTransaction"
    )

    # Model 3: PlatformFeeTransaction
    p_m3 = doc.add_paragraph()
    r = p_m3.add_run("C. PlatformFeeTransaction Model (`models/PlatformFeeTransaction.model.ts`)")
    r.bold = True
    r.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    p_m3_desc = doc.add_paragraph(
        "An authoritative per-file revenue ledger with strict idempotency locks. "
        "Prevents double-charging users for multi-file codebase reviews by locking on `reviewId` + `fileId` combinations."
    )
    add_code_block(
        doc,
        """interface IPlatformFeeTransaction extends Document {
  feeTransactionId: string; // 'fee_ref_1715000000_a1b2c3d4'
  reviewId: string;         // Parent repository review ID
  fileId: string;           // Target file UUID
  filePath: string;         // 'src/controllers/auth.controller.ts'
  amount: number;           // Exactly 50,000 micro-USDC ($0.05)
  currency: string;         // 'USDC'
  assetId: string;          // '31566704'
  network: string;          // 'Algorand MainNet'
  status: 'completed' | 'failed';
  timestamp: Date;
}""",
        "TYPESCRIPT SCHEMA: PlatformFeeTransaction"
    )

    # Subsection 3.3: Background Onchain Sync Daemon
    h2 = doc.add_heading(level=2)
    r = h2.add_run("3.3 Tier 3: Real-Time On-Chain Synchronization Daemon (`services/onchainSync.service.ts`)")
    r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    p = doc.add_paragraph(
        "To guarantee accounting consistency and capture out-of-band wallet payments, the backend operates a background "
        "synchronization daemon. It queries the Algorand MainNet and TestNet public indexers every 15 seconds."
    )
    
    p_bullets = [
        ("Indexer Polling", "Fetches the latest 100 transactions for the configured `AVM_ADDRESS` treasury from `https://mainnet-idx.algonode.cloud/v2/accounts/{address}/transactions`."),
        ("ASA & Amount Filtering", "Filters for incoming Asset Transfers matching USDC ASA `31566704` (or `10458941`) and standard ALGO payments."),
        ("Note Decoding & Feature Matching", "Decodes the base64 transaction note to infer the purchased feature (e.g. 'Resume Intelligence', 'GitHub Review', 'Interview Prep')."),
        ("Database Upsert Reconciliation", "Executes an idempotent `Payment.findOneAndUpdate()` with `{ upsert: true }`, ensuring no payment is lost even during temporary network interruptions.")
    ]
    for b_title, b_desc in p_bullets:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(f"{b_title}: ")
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        r2 = bp.add_run(b_desc)
        r2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ── Section 4: How It Goes to the Facilitator (Deep Dive) ───────────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("4. Facilitator Integration: How Data Relays to GoPlausible")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    p = doc.add_paragraph(
        "The GoPlausible Facilitator (`https://facilitator.goplausible.xyz`) is the decentralized settlement relayer "
        "governing the x402 protocol on Algorand. The backend acts as a verification orchestrator, transmitting "
        "signed client payloads to the facilitator for cryptographic verification and on-chain submission."
    )
    
    # Subsection 4.1: Facilitator Role
    h2 = doc.add_heading(level=2)
    r = h2.add_run("4.1 Core Responsibilities of the GoPlausible Facilitator")
    r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    f_roles = [
        ("Cryptographic Signature Verification", "Verifies that the transaction group contains valid ECDSA signatures corresponding to the sender's public Algorand key."),
        ("Balance & Asset Opt-in Checking", "Checks on-chain state to confirm that the sender has sufficient USDC balance (e.g. >= 0.05 USDC) and is opted into ASA 31566704."),
        ("Requirement Enforcement", "Validates that the payment transfer exactly matches the merchant's requested price, receiver address (AVM_ADDRESS), and network CAIP-2."),
        ("Replay Attack Prevention", "Tracks processed transaction IDs in memory and on-chain to reject any duplicated or replayed transaction headers."),
        ("Atomic Blockchain Broadcasting", "Submits the validated atomic transaction group directly to Algorand consensus nodes, monitoring round progression until final block confirmation."),
        ("Bazaar Catalog Registration", "Probes the merchant's `resource.url` to scrape Open Graph metadata and register monetized endpoints in the global x402 Bazaar discovery network.")
    ]
    for r_title, r_desc in f_roles:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(f"{r_title}: ")
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        r2 = bp.add_run(r_desc)
        r2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Subsection 4.2: Payload Structure
    h2 = doc.add_heading(level=2)
    r = h2.add_run("4.2 Exact Facilitator Request & Response Payloads (`/settle`)")
    r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    p = doc.add_paragraph(
        "When `verifyX402Payment()` executes in `services/payment/index.ts`, it dispatches a structured JSON POST to `https://facilitator.goplausible.xyz/settle`:"
    )
    
    add_code_block(
        doc,
        """// Outgoing POST https://facilitator.goplausible.xyz/settle
{
  "x402Version": 2,
  "paymentPayload": {
    "x402Version": 2,
    "payload": {
      "paymentGroup": [
        "AYEB123... (signed base64 setup transaction)",
        "AYEB456... (signed base64 USDC asset transfer transaction)"
      ],
      "paymentIndex": 1
    },
    "accepted": {
      "scheme": "exact",
      "network": "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
      "payTo": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY"
    }
  },
  "paymentRequirements": {
    "scheme": "exact",
    "network": "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
    "payTo": "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
    "amount": "50000",
    "asset": "31566704",
    "extra": {
      "name": "USDC",
      "version": "1",
      "resource": "https://sikho-ai-im1v.onrender.com/api/v1/resume/quality",
      "tag": "x402-global-challenge",
      "discovery": true,
      "category": "education"
    },
    "maxTimeoutSeconds": 300
  }
}""",
        "FACILITATOR REQUEST PAYLOAD: POST /settle"
    )
    
    p_resp = doc.add_paragraph("Upon successful on-chain settlement, the facilitator responds with:")
    add_code_block(
        doc,
        """// Response from Facilitator (HTTP 200 OK)
{
  "success": true,
  "transaction": "ZSKIJ5VWW4P6J4V7WJ22YF6OGHNY662WTYP3M23JNY6KXX6OXYPA",
  "payer": "RK6K3SMBBNVUH3CZIQNHB4EEDOQSLZHYBLJPSDSBYIQN75RU5VUVWQXGVA",
  "network": "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
  "settledAt": "2026-09-28T17:25:32.410Z"
}""",
        "FACILITATOR SUCCESS RESPONSE"
    )

    # Subsection 4.3: Response Headers & Receipt
    h2 = doc.add_heading(level=2)
    r = h2.add_run("4.3 HTTP Header Exchange & Proof-of-Settlement Receipt")
    r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    p = doc.add_paragraph(
        "Once verified, the backend injects standardized receipt headers into the HTTP response before sending it back to the client. "
        "This gives the client immediate cryptographic proof of payment."
    )
    
    hdr_table = doc.add_table(rows=1, cols=3)
    style_table(
        hdr_table,
        [2.0, 2.0, 2.8],
        ["HTTP Header Name", "Header Value / Format", "Purpose & Consumer"],
        [
            ["PAYMENT-REQUIRED", "Base64(PaymentRequiredObject)", "Emitted on HTTP 402; informs client x402 SDK of required payment parameters."],
            ["PAYMENT-SIGNATURE / X-PAYMENT", "Base64(PaymentPayloadObject)", "Attached by client on retry; contains signed transaction group."],
            ["X-PAYMENT-RESPONSE / PAYMENT-RESPONSE", "Base64({ success: true, transaction: txHash, payer, network })", "Returned with HTTP 200; serves as digital receipt and settlement confirmation."],
            ["Access-Control-Expose-Headers", "X-PAYMENT-RESPONSE, PAYMENT-RESPONSE, PAYMENT-REQUIRED", "Crucial CORS directive allowing browser JavaScript to read payment response headers."]
        ]
    )
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ── Section 5: Advanced Engineering & Multi-Party Split Workflows ────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("5. Multi-Party Split Payments & AI Cluster Integration")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    p = doc.add_paragraph(
        "Sikho-AI extends simple peer-to-peer payments into multi-party orchestration architectures, "
        "such as automated third-party API monetization and high-throughput AI inference cluster routing."
    )
    
    h2 = doc.add_heading(level=2)
    r = h2.add_run("5.1 Multi-Party Split Settlement (e.g. GitHub Review with Prism)")
    r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    p = doc.add_paragraph(
        "In the GitHub repository code review pipeline (`serviceOrchestrator.service.ts`), a single user transaction ($0.25 USDC) "
        "is mathematically decomposed into platform revenue and downstream service provider payment:"
    )
    
    split_table = doc.add_table(rows=1, cols=4)
    style_table(
        split_table,
        [1.5, 1.3, 1.8, 2.2],
        ["Revenue Tier", "Amount (USDC)", "Recipient Entity", "Execution Mechanism"],
        [
            ["User Total Charge", "$0.25 USDC (250,000 µUSDC)", "Sikho Treasury Address", "Signed by user wallet via x402 challenge."],
            ["Platform Fee", "$0.05 USDC (50,000 µUSDC)", "Sikho Platform Account", "Recorded in `PlatformFeeTransaction` ledger with per-file idempotency."],
            ["Downstream Provider", "$0.20 USDC (200,000 µUSDC)", "Prism AI Review Service", "Orchestrated via service proxy with separate x402 provider challenge."],
            ["Total Economic Split", "$0.25 = $0.05 + $0.20", "Fully Settled On-Chain", "Guarantees zero platform deficit and auditable margin."]
        ],
        header_bg="1E3A8A"
    )
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

    h2 = doc.add_heading(level=2)
    r = h2.add_run("5.2 Fault-Tolerant AI Engine: 8-Key Rotating Groq Cluster")
    r.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
    
    p = doc.add_paragraph(
        "Following payment validation, the backend routes requests to Groq's LPU (Language Processing Unit) cluster. "
        "To prevent rate-limit throttling and achieve 99.9% uptime, the engine rotates across 8 dedicated API keys "
        "(`GROQ_API_KEY_20` through `GROQ_API_KEY_27`), powering models like `openai/gpt-oss-120b` and `LLaMA-3.3-70B` "
        "at speeds exceeding 100+ tokens per second."
    )
    
    # ── Section 6: Security, Error Handling & Idempotency ────────────────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("6. Security, Replay Defense & Idempotency Engineering")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    sec_items = [
        ("Replay Attack Immunity", "Transactions are uniquely identified on the Algorand blockchain by their 52-character base32 transaction ID. The facilitator and MongoDB `ServiceTransaction` index prevent any previously used transaction ID from unlocking a second resource request."),
        ("Strict Amount & Asset Verification", "The backend rejects any payment where the asset ID does not match USDC ASA `31566704` (or `10458941`) or where the micro-USDC transfer is less than the required amount, eliminating fractional payment spoofing."),
        ("Receiver Address Whitelisting", "All payments must strictly transfer assets to the authoritative treasury address configured in `env.AVM_ADDRESS`. Any redirect to an unauthorized address is flagged and rejected by the facilitator."),
        ("Idempotent Platform Fee Processing", "The platform fee engine (`processPlatformFee`) enforces unique constraint indexing on `reviewId + fileId`. If a user re-submits a review for an already-settled file, the system detects the existing fee record and avoids duplicate charges."),
        ("Graceful Degradation & Timeout Controls", "All facilitator network calls enforce a 10-second connection timeout with fallback checks against Algorand Algod nodes. Expired transactions (>300 seconds) are automatically rejected.")
    ]
    
    for s_title, s_desc in sec_items:
        bp = doc.add_paragraph(style='List Bullet')
        r1 = bp.add_run(f"{s_title}: ")
        r1.bold = True
        r1.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
        r2 = bp.add_run(s_desc)
        r2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # ── Section 7: Summary & Quick Reference Table ──────────────────────────────
    h1 = doc.add_heading(level=1)
    r = h1.add_run("7. Backend Lifecycle Summary & Quick Reference")
    r.font.name = 'Arial'
    r.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)
    
    sum_data = [
        ["Protocol Standard", "x402 HTTP Payment Required Standard (V2 AVM Specification)"],
        ["Blockchain Network", "Algorand MainNet (CAIP-2: algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=)"],
        ["Settlement Currency", "USDC (Algorand Standard Asset ID: 31566704 / TestNet: 10458941)"],
        ["Block Finality Time", "3.3 Seconds (Instant settlement, zero block re-org risk)"],
        ["Facilitator Endpoint", "https://facilitator.goplausible.xyz (POST /settle, POST /validate)"],
        ["Middleware Handler", "enforceWorkspacePayment() in x402-demo-server/middlewares/x402.middleware.ts"],
        ["Primary DB Collections", "X402Transactions, ServiceTransactions, PlatformFeeTransactions, Payments"],
        ["On-Chain Sync Daemon", "syncOnchainTransactions() polling Algonode Indexer every 15 seconds"],
        ["Downstream AI Engine", "Groq Cloud (openai/gpt-oss-120b) with 8-Key Dynamic Rotation Pool"]
    ]
    sum_table = doc.add_table(rows=1, cols=2)
    style_table(sum_table, [2.5, 4.3], ["Core Architecture Dimension", "Technical Implementation Specification"], sum_data, header_bg="1E3A8A")

    # Save documents
    for path in file_paths:
        doc.save(path)
        print(f"[SUCCESS] Saved document successfully to: {path}")

if __name__ == "__main__":
    p1 = os.path.abspath("c:/Users/krish/Desktop/xx/sikho-AI/Sikho-AI_Backend_Transactions_and_Facilitator_Architecture.docx")
    p2 = os.path.abspath("c:/Users/krish/Desktop/Sikho-AI_Backend_Transactions_and_Facilitator_Architecture.docx")
    generate_backend_x402_document([p1, p2])
