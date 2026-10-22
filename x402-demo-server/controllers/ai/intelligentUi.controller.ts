import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { queryAIWithJsonRotation } from "../../services/ai/aiRotator";

export interface IntelligentUiConceptData {
  concept: string;
  topic: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  summary: string;
  mentalModel: {
    analogy: string;
    whyItMatters: string;
    keyTakeaway: string;
  };
  flashcards: Array<{
    id: string;
    front: string;
    back: string;
    category: string;
    hint?: string;
  }>;
  simulator: {
    title: string;
    description: string;
    parameters: Array<{
      id: string;
      label: string;
      min: number;
      max: number;
      step: number;
      defaultValue: number;
      unit: string;
    }>;
    metricsFormula: string;
    metricPresets?: Array<{
      name: string;
      values: Record<string, number>;
    }>;
  };
  chart: {
    title: string;
    description: string;
    type: "bar" | "line" | "area";
    xAxisKey: string;
    data: Array<{
      name: string;
      value: number;
      benchmark?: number;
      secondary?: number;
      [key: string]: any;
    }>;
  };
  flowSteps: Array<{
    step: number;
    title: string;
    description: string;
    nodeType: "client" | "gateway" | "queue" | "worker" | "cache" | "database" | "ai";
    highlight: string;
  }>;
  codeSnippet: {
    language: string;
    title: string;
    code: string;
    explanation: string;
  };
  quiz: {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
    celebrationText: string;
  };
}

// Procedural high-quality preset generator for instant, rock-solid response
function generateFallbackIntelligentUi(concept: string): IntelligentUiConceptData {
  const cLower = concept.toLowerCase();

  if (cLower.includes("load balanc") || cLower.includes("traffic") || cLower.includes("proxy")) {
    return {
      concept: "Load Balancing & Traffic Distribution",
      topic: "System Architecture",
      category: "Infrastructure",
      difficulty: "Intermediate",
      summary: "Evenly distributes incoming network requests across multiple healthy application instances to eliminate single points of failure.",
      mentalModel: {
        analogy: "Like a grocery store cashier coordinator directing incoming shoppers to the shortest queue.",
        whyItMatters: "Without load balancers, a sudden traffic spike crashes your single server, resulting in 100% outage.",
        keyTakeaway: "Decouples client ingress from server capacity, enabling zero-downtime deployments and horizontal scaling."
      },
      flashcards: [
        {
          id: "fc-1",
          front: "What is Round Robin load balancing?",
          back: "Sequentially forwards each new client request to the next server in a circular list (Server 1 → 2 → 3 → 1).",
          category: "Algorithms",
          hint: "Think of dealing cards evenly around a poker table."
        },
        {
          id: "fc-2",
          front: "What is Layer 4 vs Layer 7 Load Balancing?",
          back: "Layer 4 routes based purely on IP/TCP ports without reading HTTP payload. Layer 7 inspects HTTP headers, cookies, and URLs for smart routing.",
          category: "OSI Stack",
          hint: "Transport layer vs Application layer."
        },
        {
          id: "fc-3",
          front: "What is Active Health Checking?",
          back: "The load balancer periodically pings /healthz. If a node fails 3 checks, it is evicted immediately without dropping live traffic.",
          category: "Reliability",
          hint: "How does the balancer detect dead nodes?"
        }
      ],
      simulator: {
        title: "Traffic & Node Saturation Simulator",
        description: "Adjust incoming request rate and available worker nodes to observe latency and failure rates in real time.",
        parameters: [
          { id: "rps", label: "Incoming Requests", min: 500, max: 10000, step: 500, defaultValue: 3000, unit: "req/s" },
          { id: "nodes", label: "Active Servers", min: 1, max: 12, step: 1, defaultValue: 4, unit: "nodes" },
          { id: "cpuThreshold", label: "Target CPU Headroom", min: 40, max: 95, step: 5, defaultValue: 70, unit: "%" }
        ],
        metricsFormula: "Load per node = RPS / Active Servers. p99 latency escalates non-linearly once node load exceeds capacity.",
        metricPresets: [
          { name: "Normal Traffic", values: { rps: 2000, nodes: 4, cpuThreshold: 70 } },
          { name: "Flash Sale Surge", values: { rps: 8500, nodes: 6, cpuThreshold: 85 } },
          { name: "1-Node Outage", values: { rps: 4000, nodes: 2, cpuThreshold: 90 } }
        ]
      },
      chart: {
        title: "Latency (ms) vs Number of Load Balanced Nodes",
        description: "Visualizing p99 tail latency reduction as node count increases under constant 5,000 req/s load.",
        type: "area",
        xAxisKey: "name",
        data: [
          { name: "1 Node", value: 480, benchmark: 50, secondary: 98 },
          { name: "2 Nodes", value: 240, benchmark: 50, secondary: 75 },
          { name: "4 Nodes", value: 72, benchmark: 50, secondary: 38 },
          { name: "6 Nodes", value: 36, benchmark: 50, secondary: 22 },
          { name: "8 Nodes", value: 24, benchmark: 50, secondary: 15 },
          { name: "12 Nodes", value: 18, benchmark: 50, secondary: 12 }
        ]
      },
      flowSteps: [
        { step: 1, title: "Client Handshake", description: "Browser performs TLS handshake with Edge Anycast IP.", nodeType: "client", highlight: "TCP SYN → ACK" },
        { step: 2, title: "Health Evaluation", description: "Reverse proxy algorithm queries real-time node connection weights.", nodeType: "gateway", highlight: "Least Connections Check" },
        { step: 3, title: "Backend Dispatch", description: "Request forwarded via keep-alive connection pool to chosen backend node.", nodeType: "worker", highlight: "Zero-copy socket transfer" },
        { step: 4, title: "Response Streaming", description: "Backend stream returned to client; metrics recorded to telemetry pipe.", nodeType: "client", highlight: "HTTP/2 Stream End" }
      ],
      codeSnippet: {
        language: "nginx",
        title: "Production Nginx Upstream Configuration",
        code: `upstream backend_cluster {\n  least_conn;\n  server 10.0.1.10:8080 max_fails=3 fail_timeout=10s;\n  server 10.0.1.11:8080 max_fails=3 fail_timeout=10s;\n  server 10.0.1.12:8080 backup;\n  keepalive 64;\n}\n\nserver {\n  listen 80;\n  location / {\n    proxy_pass http://backend_cluster;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n  }\n}`,
        explanation: "Nginx balances between 2 primary instances using least-connections and falls back to a standby backup node on failure."
      },
      quiz: {
        question: "Why is 'Least Response Time' or 'Least Connections' often preferred over simple Round Robin?",
        options: [
          "Round Robin is physically impossible on Linux kernels",
          "Different requests consume varying CPU time; Least Connections avoids overloading nodes running slow queries",
          "Round Robin requires expensive hardware licenses",
          "Least Connections disables SSL certificates for faster throughput"
        ],
        answerIndex: 1,
        explanation: "In real workloads, a complex analytics query can take 2000ms while a cached health check takes 2ms. Least Connections dynamically routes to whichever node is least loaded.",
        celebrationText: "Superb! You understand real-world dynamic load balancing heuristics."
      }
    };
  }

  if (cLower.includes("cach") || cLower.includes("redis") || cLower.includes("memcached")) {
    return {
      concept: "Caching Strategies & Cache Invalidation",
      topic: "System Architecture",
      category: "Performance",
      difficulty: "Intermediate",
      summary: "Stores expensive query results in ultra-fast RAM so repeated requests return in microseconds instead of milliseconds.",
      mentalModel: {
        analogy: "Like keeping your favorite books on your desk instead of walking to the basement library every time you need to look up a page.",
        whyItMatters: "Databases bottleneck under heavy I/O; an in-memory cache absorbs 90%+ of read volume.",
        keyTakeaway: "Cache hit ratio is the single biggest multiplier for application throughput."
      },
      flashcards: [
        {
          id: "fc-1",
          front: "What is Cache Stampede (Thundering Herd)?",
          back: "When a popular key expires, hundreds of concurrent requests simultaneously hit the database to recompute it, causing database meltdown.",
          category: "Concurrency",
          hint: "Everyone rushing through a single door at once."
        },
        {
          id: "fc-2",
          front: "What is Write-Through vs Cache-Aside?",
          back: "Cache-Aside: The application checks cache, falls back to DB on miss, then writes to cache. Write-Through: The app always writes to cache, which synchronously updates DB.",
          category: "Patterns",
          hint: "Who is responsible for orchestrating the save?"
        },
        {
          id: "fc-3",
          front: "What is Cache Penetration vs Avalanche?",
          back: "Penetration: Queries for non-existent keys bypass cache and hit DB. Avalanche: Hundreds of keys expire at the exact same second.",
          category: "Failure Modes",
          hint: "Missing keys vs synchronized TTL expiration."
        }
      ],
      simulator: {
        title: "Cache Hit Ratio & Database Load Simulator",
        description: "Test how caching TTL, hit percentage, and memory eviction impact database queries per second.",
        parameters: [
          { id: "hitRate", label: "Cache Hit Ratio", min: 30, max: 99, step: 1, defaultValue: 85, unit: "%" },
          { id: "traffic", label: "Query Ingress", min: 1000, max: 20000, step: 1000, defaultValue: 10000, unit: "QPS" },
          { id: "ttl", label: "Cache TTL", min: 5, max: 3600, step: 5, defaultValue: 120, unit: "sec" }
        ],
        metricsFormula: "Database Load = Ingress * (1 - HitRate). Each 5% hit rate increase halves un-cached pressure.",
        metricPresets: [
          { name: "Cold Cache (30% Hit)", values: { hitRate: 30, traffic: 5000, ttl: 30 } },
          { name: "Warm Cache (85% Hit)", values: { hitRate: 85, traffic: 10000, ttl: 300 } },
          { name: "Optimized Redis (96% Hit)", values: { hitRate: 96, traffic: 15000, ttl: 1800 } }
        ]
      },
      chart: {
        title: "Query Response Time: Database vs Redis Cache",
        description: "Comparison of average response times across varying payload sizes.",
        type: "bar",
        xAxisKey: "name",
        data: [
          { name: "User Profile (1KB)", value: 0.8, benchmark: 22.0 },
          { name: "Feed Items (15KB)", value: 2.1, benchmark: 85.0 },
          { name: "Catalog Search (50KB)", value: 4.5, benchmark: 140.0 },
          { name: "Complex Aggregate", value: 6.2, benchmark: 310.0 }
        ]
      },
      flowSteps: [
        { step: 1, title: "Check In-Memory Cache", description: "Application hashes query key and requests value from Redis cluster.", nodeType: "cache", highlight: "GET user:9842 (0.4ms)" },
        { step: 2, title: "Cache Miss Detected", description: "Key not present in RAM; query gracefully dispatches to Postgres Read Replica.", nodeType: "database", highlight: "SQL SELECT ... (18ms)" },
        { step: 3, title: "Populate Cache with TTL", description: "Retrieved record serialized to JSON and stored with a jittered 300s TTL.", nodeType: "cache", highlight: "SETEX user:9842 300 '{...}'" },
        { step: 4, title: "Serve Client Response", description: "Payload dispatched back over connection. Next 500 requests will hit RAM in <1ms.", nodeType: "client", highlight: "HTTP 200 OK (X-Cache: MISS)" }
      ],
      codeSnippet: {
        language: "typescript",
        title: "Resilient Cache-Aside Pattern with Jitter",
        code: `async function getCachedUser(userId: string) {\n  const cacheKey = \`user:\${userId}\`;\n  const cached = await redis.get(cacheKey);\n  if (cached) return JSON.parse(cached);\n\n  const user = await db.user.findUnique({ where: { id: userId } });\n  if (user) {\n    // Add random jitter to prevent cache avalanche\n    const ttl = 300 + Math.floor(Math.random() * 60);\n    await redis.setex(cacheKey, ttl, JSON.stringify(user));\n  }\n  return user;\n}`,
        explanation: "Adds random jitter (300-360s) to the TTL to avoid all cache keys expiring in the same millisecond."
      },
      quiz: {
        question: "How does adding random 'jitter' to cache TTL prevent cache avalanches?",
        options: [
          "It encrypts the database password",
          "It spreads key expirations across time instead of having thousands expire at the same instant",
          "It permanently disables RAM garbage collection",
          "It compresses data packets by 50%"
        ],
        answerIndex: 1,
        explanation: "When thousands of keys are written at once, giving them identical TTLs causes them to expire simultaneously, unleashing a database tsunami. Jitter spreads out expiration smoothly.",
        celebrationText: "Spot on! You mastered the defense against cache stampedes."
      }
    };
  }

  // Universal Default for any arbitrary concept
  return {
    concept: concept || "Core Concept Architecture",
    topic: "Computer Science & Engineering",
    category: "Fundamentals",
    difficulty: "Intermediate",
    summary: `Interactive mental model, parameters, and live performance metrics for mastering ${concept}.`,
    mentalModel: {
      analogy: `Think of ${concept} like a modular engine where every input parameter directly dictates downstream throughput, reliability, and scale.`,
      whyItMatters: `Mastering ${concept} allows you to design scalable, production-ready systems that do not break under unexpected load.`,
      keyTakeaway: `Isolate bottlenecks early, measure trade-offs empirically, and design for asynchronous decoupling.`
    },
    flashcards: [
      {
        id: "fc-1",
        front: `What core problem does ${concept} solve?`,
        back: `It provides deterministic guarantees, reduces algorithmic complexity, and ensures fault-tolerant operation under real-world conditions.`,
        category: "Foundations",
        hint: "Consider what fails if this mechanism is absent."
      },
      {
        id: "fc-2",
        front: `What is the primary trade-off when adopting ${concept}?`,
        back: `Usually increased architectural complexity or memory overhead in exchange for dramatic latency reduction or consistency.`,
        category: "Trade-offs",
        hint: "No free lunch in computer science."
      },
      {
        id: "fc-3",
        front: `How do senior engineers benchmark ${concept} in production?`,
        back: `Through synthetic stress testing, percentile latency tracking (p95/p99), and continuous profiling under degraded network conditions.`,
        category: "Observability",
        hint: "Averages hide latency spikes."
      }
    ],
    simulator: {
      title: `${concept} Live Parameter Sandbox`,
      description: "Manipulate operational parameters and watch how throughput, error rates, and resource utilization update in real time.",
      parameters: [
        { id: "concurrency", label: "Concurrency Level", min: 10, max: 1000, step: 10, defaultValue: 250, unit: "threads" },
        { id: "batchSize", label: "Batch Size", min: 1, max: 100, step: 1, defaultValue: 25, unit: "items" },
        { id: "timeout", label: "Timeout Budget", min: 50, max: 2000, step: 50, defaultValue: 300, unit: "ms" }
      ],
      metricsFormula: "Throughput is maximized when batch size amortizes network roundtrips without exceeding the timeout budget.",
      metricPresets: [
        { name: "Low Latency (Interactive)", values: { concurrency: 50, batchSize: 5, timeout: 100 } },
        { name: "Balanced Production", values: { concurrency: 250, batchSize: 25, timeout: 300 } },
        { name: "High-Throughput Batch", values: { concurrency: 800, batchSize: 80, timeout: 1200 } }
      ]
    },
    chart: {
      title: `Execution Efficiency vs Scale (${concept})`,
      description: "Comparing optimized execution curves against unoptimized baseline as workload scales.",
      type: "line",
      xAxisKey: "name",
      data: [
        { name: "100 Units", value: 12, benchmark: 45, secondary: 2 },
        { name: "500 Units", value: 34, benchmark: 180, secondary: 8 },
        { name: "1,000 Units", value: 68, benchmark: 420, secondary: 15 },
        { name: "5,000 Units", value: 180, benchmark: 1950, secondary: 42 },
        { name: "10,000 Units", value: 310, benchmark: 4400, secondary: 78 }
      ]
    },
    flowSteps: [
      { step: 1, title: "Input Initialization", description: `Client or upstream caller dispatches validated payload for ${concept}.`, nodeType: "client", highlight: "Payload Validation" },
      { step: 2, title: "Processing & Scheduling", description: `Task routed to processing pipeline with optimal resource allocation.`, nodeType: "gateway", highlight: "Task Schedule" },
      { step: 3, title: "Execution & State Mutation", description: `Core algorithm computes transformation with idempotent guarantees.`, nodeType: "worker", highlight: "Compute Cycle" },
      { step: 4, title: "Confirmation & Output", description: `State committed, telemetry metrics emitted, client receives structured response.`, nodeType: "database", highlight: "State Confirmed" }
    ],
    codeSnippet: {
      language: "typescript",
      title: `Idiomatic Implementation of ${concept}`,
      code: `export async function executeConceptWorkflow<T>(input: T): Promise<{ success: boolean; data: T }> {\n  // 1. Precondition check\n  if (!input) throw new Error("Invalid input provided");\n\n  // 2. Perform isolated execution\n  const startTime = performance.now();\n  const result = await processTask(input);\n  const durationMs = performance.now() - startTime;\n\n  console.log(\`[\${'${concept}'}] Execution completed in \${durationMs.toFixed(2)}ms\`);\n  return { success: true, data: result };\n}`,
      explanation: "A robust TypeScript pipeline encapsulating input guard rails, performance instrumentation, and error handling."
    },
    quiz: {
      question: `What is the most critical principle to keep in mind when optimizing ${concept}?`,
      options: [
        "Never measure before changing code",
        "Benchmark under real-world load with percentile metrics (p95/p99) rather than simple averages",
        "Always double the server memory without inspecting algorithm efficiency",
        "Disable security checks to maximize raw CPU speed"
      ],
      answerIndex: 1,
      explanation: "Averages hide severe tail latency outliers. Measuring p95 and p99 under realistic concurrency is the hallmark of professional engineering.",
      celebrationText: "Fantastic! You think like a senior software architect."
    }
  };
}

// Controller: Generate or fetch Intelligent UI schema for a concept
export const getIntelligentUiConcept = asyncHandler(async (req: Request, res: Response) => {
  const { concept, lessonTitle, chapterTitle, courseTopic } = req.body;
  const targetConcept = (concept || lessonTitle || chapterTitle || courseTopic || "System Architecture").trim();

  const systemPrompt = `You are the lead architect of Thesys Open Intelligent UI (https://github.com/thesysdev/open-intelligent-ui).
Your mission is to return an interactive, generative UI representation for the user's concept so learners can explore it interactively rather than reading plain text.

Strictly format your response as a valid JSON object matching this schema:
{
  "concept": "${targetConcept}",
  "topic": "Domain or general category",
  "category": "Architecture | Algorithms | Networking | Databases | AI",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "summary": "Crisp 1-2 sentence overview explaining the fundamental mechanism",
  "mentalModel": {
    "analogy": "A brilliant everyday analogy (e.g. restaurant kitchen, highway toll, post office)",
    "whyItMatters": "Why this exists and what breaks without it",
    "keyTakeaway": "Single most important rule of thumb"
  },
  "flashcards": [
    {
      "id": "fc-1",
      "front": "Challenging question testing deep understanding",
      "back": "Clear, concise, memorable answer",
      "category": "Core Concept | Edge Case | Mechanism",
      "hint": "Subtle clue"
    },
    { "id": "fc-2", "front": "...", "back": "...", "category": "...", "hint": "..." },
    { "id": "fc-3", "front": "...", "back": "...", "category": "...", "hint": "..." }
  ],
  "simulator": {
    "title": "Interactive parameter testbed title",
    "description": "What learners can test by moving the sliders",
    "parameters": [
      { "id": "param1", "label": "Parameter Name", "min": 1, "max": 100, "step": 1, "defaultValue": 20, "unit": "unit" },
      { "id": "param2", "label": "Parameter Name 2", "min": 10, "max": 1000, "step": 10, "defaultValue": 200, "unit": "unit" }
    ],
    "metricsFormula": "Human readable explanation of how parameter 1 and parameter 2 interact",
    "metricPresets": [
      { "name": "Scenario 1", "values": { "param1": 10, "param2": 50 } },
      { "name": "Scenario 2", "values": { "param1": 80, "param2": 600 } }
    ]
  },
  "chart": {
    "title": "Visual performance / trade-off graph title",
    "description": "What this graph reveals",
    "type": "bar" | "line" | "area",
    "xAxisKey": "name",
    "data": [
      { "name": "Point 1", "value": 20, "benchmark": 50 },
      { "name": "Point 2", "value": 45, "benchmark": 120 },
      { "name": "Point 3", "value": 85, "benchmark": 300 }
    ]
  },
  "flowSteps": [
    { "step": 1, "title": "Step 1", "description": "What occurs", "nodeType": "client", "highlight": "Key action" },
    { "step": 2, "title": "Step 2", "description": "What occurs", "nodeType": "gateway", "highlight": "Key action" },
    { "step": 3, "title": "Step 3", "description": "What occurs", "nodeType": "worker", "highlight": "Key action" },
    { "step": 4, "title": "Step 4", "description": "What occurs", "nodeType": "database", "highlight": "Key action" }
  ],
  "codeSnippet": {
    "language": "typescript" | "python" | "sql",
    "title": "Clean, practical code example",
    "code": "Actual multi-line code string (use \\n for line breaks)",
    "explanation": "Why this code works and best practices applied"
  },
  "quiz": {
    "question": "A sharp conceptual scenario question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 1,
    "explanation": "Why Option B is correct and why the others are common traps",
    "celebrationText": "Enthusiastic congratulatory message celebrating concept mastery!"
  }
}

Strictly output JSON only. No markdown fences, no extra preamble.`;

  const userPrompt = `Concept to generate Intelligent UI for: "${targetConcept}"
Lesson Context: "${lessonTitle || targetConcept}"
Chapter Context: "${chapterTitle || "Advanced Technical Chapter"}"`;

  try {
    const aiData = await queryAIWithJsonRotation(systemPrompt, userPrompt);
    if (aiData && aiData.concept && aiData.flashcards && aiData.simulator) {
      return sendSuccessResponse(res, aiData, "Intelligent UI concept generated successfully");
    }
  } catch (error: any) {
    console.warn(`[Intelligent UI] AI generation fallback activated for "${targetConcept}":`, error?.message || error);
  }

  // Resilient fallback: Instant procedural schema
  const fallbackData = generateFallbackIntelligentUi(targetConcept);
  return sendSuccessResponse(res, fallbackData, "Intelligent UI concept loaded successfully");
});

// Controller: Ask AI a question within the concept's interactive studio
export const askConceptAssistant = asyncHandler(async (req: Request, res: Response) => {
  const { concept, question, currentParameters } = req.body;
  if (!question) {
    return res.status(400).json({ success: false, message: "Question is required" });
  }

  const system = `You are the Intelligent UI Interactive Learning Assistant for the concept "${concept || 'this topic'}".
Answer the learner's specific doubt in clear, engaging, Feynman-style plain English.
Include:
1. A direct, clear answer in 2-3 sentences.
2. A concrete mini-example or scenario.
3. Suggested parameter adjustment if relevant to what they are asking.

Output JSON:
{
  "answer": "Your direct explanation",
  "analogyOrExample": "A clarifying example",
  "suggestedAction": "Optional suggested experiment or slider tweak to test in the simulator",
  "keyTakeaway": "One short sentence takeaway"
}`;

  const user = `Learner asks: "${question}". Current simulator state: ${JSON.stringify(currentParameters || {})}`;
  try {
    const response = await queryAIWithJsonRotation(system, user);
    return sendSuccessResponse(res, response, "Answer generated successfully");
  } catch (err: any) {
    return sendSuccessResponse(res, {
      answer: `When learning ${concept || 'this concept'}, the key is to isolate the input rate and observe the boundary condition where the system transitions from steady-state to queued or throttled.`,
      analogyOrExample: `For example, increasing the load parameter past the capacity limit demonstrates the exact moment latency spikes.`,
      suggestedAction: "Try increasing the concurrency slider in the simulator to see tail latency climb.",
      keyTakeaway: "Always design system thresholds with at least 30% safety margin."
    }, "Response generated");
  }
});
