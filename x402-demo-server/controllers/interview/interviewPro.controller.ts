import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { queryAIWithJsonRotation, queryInterviewPrepWithJsonRotation } from "../../services/ai/aiRotator";

const queryRotator = typeof queryInterviewPrepWithJsonRotation === "function"
  ? queryInterviewPrepWithJsonRotation
  : queryAIWithJsonRotation;

// ─── 1. Interview Questions (0.01 USDC) ───────────────────────────────────────
export const getOrPostInterviewQuestions = asyncHandler(async (req: Request, res: Response) => {
  const role = (req.method === "GET" ? req.query.role : req.body.role) || "Full Stack Software Engineer";
  const experience = (req.method === "GET" ? req.query.experience : req.body.experience) || "Intermediate";
  const gaps = (req.method === "GET" ? (req.query.gaps as string)?.split(",") : req.body.gaps) || ["System Design", "Database Indexing", "Distributed Caching"];

  const systemPrompt = `You are a Principal Software Architect and Executive Technical Recruiter.
Generate 6-8 high-yield technical and architectural interview questions with STAR answers tailored to the candidate's target role and identified skill gaps.
Return pure JSON matching this schema:
{
  "endpoint": "interview-questions",
  "role": "${role}",
  "experience": "${experience}",
  "questions": [
    {
      "question": "Question text",
      "difficulty": "medium",
      "category": "System Design | Database | Backend | Security | Architecture",
      "sampleAnswer": "Comprehensive STAR format or technical architectural answer detailing trade-offs, scaling, and failure modes."
    }
  ]
}
Output strictly valid JSON only.`;

  const userPrompt = `Generate interview questions for Role: ${role}, Experience Level: ${experience}, Identified Focus Gaps: ${JSON.stringify(gaps)}`;
  
  try {
    const aiResponse = await queryRotator(systemPrompt, userPrompt);
    return sendSuccessResponse(res, aiResponse, "Interview questions generated and unlocked successfully");
  } catch (err: any) {
    // Fallback response with structured high-yield questions
    return sendSuccessResponse(res, {
      endpoint: "interview-questions",
      role,
      experience,
      questions: [
        {
          question: "How would you design an idempotent payment processing pipeline to prevent duplicate charges upon network timeouts?",
          difficulty: "hard",
          category: "System Design",
          sampleAnswer: "To ensure idempotency: 1) Client generates a unique UUID Idempotency-Key per checkout attempt. 2) API Gateway checks a Redis distributed lock for the key. If in-flight, reject concurrent duplicate with 409 Conflict. 3) Check PostgreSQL idempotency record. If already settled, return the cached result. 4) Process transaction atomically inside a DB transaction and commit both payment ledger and idempotency record. 5) Release lock."
        },
        {
          question: "Explain the difference between Cache-Aside, Write-Through, and Write-Behind caching strategies with trade-offs.",
          difficulty: "medium",
          category: "Database",
          sampleAnswer: "Cache-Aside: Application queries cache first; on miss, loads from DB and updates cache. Lazy, resilient to cache failure, but initial latency on miss. Write-Through: App writes to cache, which synchronously writes to DB. High read/write consistency, but higher write latency. Write-Behind: App writes to cache, which asynchronously batches writes to DB. Fast writes, but risk of data loss if cache fails before flushing."
        },
        {
          question: "How do B-Tree indexes work internally in PostgreSQL, and when does adding an index hurt performance?",
          difficulty: "medium",
          category: "Database",
          sampleAnswer: "PostgreSQL B-Tree indexes maintain a balanced multi-way search tree where leaf nodes contain pointers (TIDs) to heap table rows. Lookups execute in O(log N). Adding an index hurts performance when: 1) Tables have heavy write/update volume (every write updates the index tree), 2) Low cardinality columns (e.g. boolean status), where index scans cause excessive random page I/O compared to sequential scans."
        },
        {
          question: "How do you protect a distributed REST API against DDoS attacks, brute force, and credential stuffing?",
          difficulty: "medium",
          category: "Security",
          sampleAnswer: "Apply defense in depth: 1) Cloudflare / AWS CloudFront WAF for DDoS mitigation. 2) Token bucket or sliding window rate limiting via Redis at API Gateway (e.g., 60 req/min per IP/user). 3) Enforce bcrypt / Argon2id password hashing with work factor. 4) Use short-lived JWTs (15 min) paired with secure HttpOnly refresh cookies. 5) Implement CAPTCHA and IP reputation checks upon consecutive authentication failures."
        }
      ]
    }, "Interview questions unlocked successfully");
  }
});

// ─── 2. Learning Path 3-Module Batch (0.02 USDC) ──────────────────────────────
export const getOrPostLearningPathBatch = asyncHandler(async (req: Request, res: Response) => {
  const batch = Number((req.method === "GET" ? req.query.batch : req.body.batch) || 1);
  const role = (req.method === "GET" ? req.query.role : req.body.role) || "Software Engineer";
  const modulesToUnlock = Number((req.method === "GET" ? req.query.modulesToUnlock : req.body.modulesToUnlock) || 3);

  const systemPrompt = `You are a Principal Software Architect and Senior Technical Mentor.
Generate a batch of ${modulesToUnlock} deep, 9-step concept learning modules for Batch #${batch} tailored to: ${role}.
For EVERY module, provide:
- id: string
- title: string
- difficulty: "Beginner" | "Intermediate" | "Advanced"
- estimatedTime: string (e.g. "30 mins")
- why: Real-world problem explaining why the concept exists
- what: Simple definition and breakdown of core components
- how: Step-by-step internal execution mechanism
- realWorld: Array of 3-4 objects with { domain, pattern, productionNote }
- scenario: Realistic engineering challenge (How would you solve this?)
- progressiveHints: Array of 3 progressive hints
- followUpQuestions: Array of 3 probing interview questions
- keyConcepts: Array of 2 objects { title, description }

Return pure JSON matching this schema:
{
  "endpoint": "learning-path",
  "batch": ${batch},
  "role": "${role}",
  "unlockedCount": ${modulesToUnlock},
  "modules": [...]
}
Strictly output JSON only.`;

  const userPrompt = `Generate 3 concept modules for Batch #${batch} for Role: ${role}`;

  try {
    const aiResponse = await queryRotator(systemPrompt, userPrompt);
    return sendSuccessResponse(res, aiResponse, `Learning path batch #${batch} unlocked successfully`);
  } catch (err: any) {
    return sendSuccessResponse(res, {
      endpoint: "learning-path",
      batch,
      role,
      unlockedCount: 3,
      modules: [
        {
          id: `batch-${batch}-mod-1`,
          title: batch === 2 ? "Distributed Transactions & 2-Phase Commit (2PC)" : "Asynchronous Message Queues & Event Streaming (Kafka / RabbitMQ)",
          difficulty: "Intermediate",
          estimatedTime: "35 mins",
          why: "When microservices each manage their own database, standard ACID transactions cannot span across network boundaries. Distributed transactions coordinate multi-service consistency without data corruption.",
          what: "Coordination protocols like Two-Phase Commit (Prepare + Commit) and the Saga Pattern (orchestrated or choreographed compensating transactions) guarantee eventual consistency across microservice boundaries.",
          how: "Coordinator sends 'Prepare' to all nodes -> All nodes acquire locks and reply 'Ready' -> Coordinator sends 'Global Commit' -> Nodes commit and release locks. If any node fails 'Prepare', coordinator broadcasts 'Global Abort'.",
          realWorld: [
            { domain: "🏦 Banking & Transfers", pattern: "Cross-Bank Settlement Ledger", productionNote: "Saga Orchestrator with idempotency keys and compensating rollback events." },
            { domain: "🛒 E-Commerce Checkout", pattern: "Inventory Reservation + Payment + Shipping", productionNote: "Temporal / Cadence workflow engines managing async Saga states." },
            { domain: "🚕 Ride Sharing", pattern: "Driver Dispatch & Rider Wallet Escrow", productionNote: "Event-driven state machines backed by Kafka and PostgreSQL." }
          ],
          scenario: "A customer completes an order. The Payment Service charges their card, but the Inventory Service fails to reserve stock due to high concurrency. How do you prevent the customer from losing money without an atomic cross-database transaction?",
          progressiveHints: [
            "Think about compensating transactions (Sagas) rather than distributed locks.",
            "Review how to publish a PaymentRefundedEvent if inventory reservation returns out-of-stock.",
            "Consider outbox pattern for atomic message dispatch from DB."
          ],
          followUpQuestions: [
            "What happens if the service crashes while executing a compensating refund?",
            "Why is 2PC considered a bottleneck in high-throughput cloud microservices?",
            "How does the Outbox Pattern guarantee reliable message publishing?"
          ],
          keyConcepts: [
            { title: "Saga Pattern vs 2PC", description: "Eventual consistency through forward execution and backward compensating actions." },
            { title: "Transactional Outbox", description: "Writing events to a database table within the same ACID transaction to avoid dual-write bugs." }
          ]
        },
        {
          id: `batch-${batch}-mod-2`,
          title: batch === 2 ? "Database Sharding & Consistent Hashing" : "Distributed Locks & Concurrency Control (Redlock / ZooKeeper)",
          difficulty: "Advanced",
          estimatedTime: "40 mins",
          why: "Single database nodes hit vertical hardware ceilings (CPU, RAM, disk I/O). Sharding partitions datasets horizontally across multiple database nodes.",
          what: "Horizontal partitioning where each database instance (shard) holds a unique subset of rows based on a shard key (e.g. user_id % N or Consistent Hashing ring).",
          how: "Client / Router queries Shard Map via hash ring -> Maps shard key to specific node -> Routes query directly to assigned shard instance.",
          realWorld: [
            { domain: "📱 Social Media", pattern: "User Timeline & Followers Shard", productionNote: "Consistent hashing ring with virtual nodes (vnodes) to prevent hot spots." },
            { domain: "🛒 Global E-Commerce", pattern: "Geographic Data Residency & Orders", productionNote: "Vitess / Citus / CockroachDB managing distributed range partitions." },
            { domain: "💬 Chat Applications", pattern: "Channel ID / Conversation Partitioning", productionNote: "Cassandra / DynamoDB distributed partition keys." }
          ],
          scenario: "Your database has grown to 500 million records and 50,000 queries per second. Read/write replicas can no longer handle the write volume. How would you partition and shard the dataset without breaking cross-user queries?",
          progressiveHints: [
            "Select a high-cardinality Shard Key (e.g., user_id or account_id).",
            "Consider virtual nodes on a consistent hashing ring to handle server addition/removal.",
            "Use scatter-gather queries only when absolutely necessary, and maintain search indexes in Elasticsearch."
          ],
          followUpQuestions: [
            "What is a 'hot shard' problem and how do virtual nodes mitigate it?",
            "How do you handle schema migrations across 64 database shards?",
            "What are the trade-offs between range-based sharding and hash-based sharding?"
          ],
          keyConcepts: [
            { title: "Consistent Hashing Ring", description: "Minimizes data reorganization when scaling nodes up or down." },
            { title: "Shard Key Cardinality", description: "Selecting keys that evenly distribute write throughput across all physical nodes." }
          ]
        },
        {
          id: `batch-${batch}-mod-3`,
          title: batch === 2 ? "Rate Limiting & Token Bucket Algorithms" : "API Gateway Architecture & Reverse Proxies",
          difficulty: "Intermediate",
          estimatedTime: "30 mins",
          why: "Unbounded API traffic leaves backends vulnerable to noisy neighbors, DDoS attacks, and resource exhaustion. Rate limiting protects server stability.",
          what: "Traffic shaping algorithms (Token Bucket, Leaky Bucket, Sliding Window Log) that throttle excess client requests with HTTP 429 Too Many Requests.",
          how: "Incoming request -> API Gateway checks Redis key (user_id:minute) -> Evaluates token balance -> If tokens >= 1, deduct token and forward request. If 0, return 429 with Retry-After header.",
          realWorld: [
            { domain: "☁ SaaS & Public APIs", pattern: "Tiered Rate Limits (Free vs Enterprise)", productionNote: "Envoy / Nginx / Cloudflare WAF token bucket limits." },
            { domain: "🏦 Open Banking APIs", pattern: "Regulatory API Throttling", productionNote: "Redis sliding window rate limiter at edge proxy." },
            { domain: "🍔 Food Delivery", pattern: "Driver GPS Ingestion Rate Limiting", productionNote: "Token bucket allowing bursts of location pings while capping sustained bandwidth." }
          ],
          scenario: "Third-party developers are hammering your public API with automated scraper bots, causing server degradation. How would you design a distributed, low-latency rate limiter that handles 100,000 req/sec across multiple regions?",
          progressiveHints: [
            "Place the rate limiter at the edge / API Gateway using in-memory Redis.",
            "Use Lua scripts in Redis to execute atomic check-and-decrement operations without race conditions.",
            "Adopt the Sliding Window Counter algorithm to prevent 2x traffic bursts at boundary intervals."
          ],
          followUpQuestions: [
            "Why is the Token Bucket algorithm better suited for APIs than Leaky Bucket?",
            "How do you prevent race conditions when multiple API gateways check Redis simultaneously?",
            "What HTTP headers should a rate-limited API return to clients (RFC 6585)?"
          ],
          keyConcepts: [
            { title: "Sliding Window Counter", description: "Smooths traffic spikes across minute boundaries by calculating weighted request percentages." },
            { title: "Atomic Redis Lua Scripts", description: "Executes check-and-deduct logic atomically in <1ms without distributed locks." }
          ]
        }
      ]
    }, `Learning path batch #${batch} unlocked successfully`);
  }
});

// ─── 3. Study Resources (0.01 USDC) ───────────────────────────────────────────
export const getOrPostStudyResources = asyncHandler(async (req: Request, res: Response) => {
  const topic = (req.method === "GET" ? req.query.topic : req.body.topic) || "System Design & Modern Backend Architecture";
  const gaps = (req.method === "GET" ? (req.query.gaps as string)?.split(",") : req.body.gaps) || ["Distributed Systems", "SQL Indexing", "Caching", "Security"];

  const resources = [
    {
      title: "The System Design Primer - Interactive Blueprint",
      url: "https://github.com/donnemartin/system-design-primer",
      type: "Documentation",
      category: "System Design",
      description: "Comprehensive guide to large-scale systems, caching patterns, load balancers, and CAP theorem."
    },
    {
      title: "PostgreSQL Query Optimization & EXPLAIN ANALYZE Deep Dive",
      url: "https://use-the-index-luke.com/",
      type: "Tutorial",
      category: "Database Indexing",
      description: "Everything developers need to know about SQL indexing, B-Trees, bitmap heap scans, and execution plans."
    },
    {
      title: "Redis Distributed Caching Architecture & Anti-Patterns",
      url: "https://redis.io/docs/latest/develop/use/patterns/",
      type: "Documentation",
      category: "Caching & Queues",
      description: "Best practices for Cache-Aside, TTL expiration, Redis Sentinel failover, and Redis Cluster sharding."
    },
    {
      title: "OWASP Top 10 API Security & Defensive Engineering",
      url: "https://owasp.org/www-project-api-security/",
      type: "Security Spec",
      category: "API Security",
      description: "Production guidelines on preventing Broken Object Level Authorization (BOLA), injection, and JWT misuse."
    },
    {
      title: "LeetCode Top Interview 150 - Essential Algorithms",
      url: "https://leetcode.com/studyplan/top-interview-150/",
      type: "Practice Platform",
      category: "Algorithms & DSA",
      description: "Curated high-yield algorithmic challenges categorized by patterns (Sliding Window, Two Pointers, Trees, Graphs)."
    },
    {
      title: "MDN Web Docs - HTTP Semantics & Architecture",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP",
      type: "Documentation",
      category: "HTTP & REST APIs",
      description: "Authoritative reference for HTTP/1.1, HTTP/2, HTTP/3, status codes, CORS, caching headers, and idempotency."
    }
  ];

  return sendSuccessResponse(res, {
    endpoint: "study-resources",
    topic,
    gaps,
    count: resources.length,
    resources
  }, "Study resources unlocked and retrieved successfully");
});
