import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccessResponse } from "../../utils/response";
import { queryAIWithJsonRotation } from "../../services/ai/aiRotator";

export interface VisualStep {
  id: number;
  stepNumber: number;
  title: string;
  description: string;
  animation: string;
  highlightNodes: string[];
  caption: string;
}

export interface VisualExplainResponse {
  concept: string;
  title: string;
  subtitle: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number;
  visualType: "request_distribution" | "token_streaming" | "client_server" | "caching" | "neural_network" | "data_pipeline";
  author: string;
  metrics: {
    labelLeft: string;
    valueLeft: string;
    labelRight: string;
    valueRight: string;
  };
  steps: VisualStep[];
  realWorldExample: string;
  challenge: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  };
}

// Robust fallback definitions for key technical concepts
const FALLBACK_CONCEPTS: Record<string, VisualExplainResponse> = {
  "load balancing": {
    concept: "Load Balancing",
    title: "How Load Balancing Works",
    subtitle: "Distributing incoming traffic evenly across backend servers to prevent bottlenecks",
    difficulty: "beginner",
    duration: 45,
    visualType: "request_distribution",
    author: "@sikho.ai",
    metrics: {
      labelLeft: "TOTAL REQUESTS",
      valueLeft: "2,400 /s",
      labelRight: "SERVER HEALTH",
      valueRight: "3/3 Optimal"
    },
    steps: [
      {
        id: 1,
        stepNumber: 1,
        title: "Users Send Traffic",
        description: "Multiple users from across the globe send requests simultaneously to the web application.",
        animation: "users_to_balancer",
        highlightNodes: ["users", "balancer"],
        caption: "Users send incoming requests towards the application gateway."
      },
      {
        id: 2,
        stepNumber: 2,
        title: "Load Balancer Evaluates Capacity",
        description: "The load balancer inspects incoming requests and monitors real-time server health and current capacity.",
        animation: "balancer_inspect",
        highlightNodes: ["balancer"],
        caption: "The load balancer evaluates active connections and server health."
      },
      {
        id: 3,
        stepNumber: 3,
        title: "Requests Distributed Across Servers",
        description: "Traffic is intelligently routed across Server 1, Server 2, and Server 3 using algorithms like Round Robin or Least Connections.",
        animation: "distribute_servers",
        highlightNodes: ["server1", "server2", "server3"],
        caption: "Requests are smoothly distributed across healthy server bays."
      }
    ],
    realWorldExample: "Food delivery apps like DoorDash or UberEats use load balancing when millions of users simultaneously place dinner orders on Friday night.",
    challenge: {
      question: "What happens if one server becomes overloaded or fails health checks?",
      options: [
        "Send more requests to the failed server",
        "Automatically redirect traffic to healthy remaining servers",
        "Shutdown all servers and display an error page"
      ],
      answer: 1,
      explanation: "Load balancers continuously check server health and automatically reroute new traffic to healthy servers with zero user downtime."
    }
  },
  "token streaming": {
    concept: "Token Streaming",
    title: "Token Streaming Architecture",
    subtitle: "Why AI answers arrive word by word instead of waiting for full generation",
    difficulty: "beginner",
    duration: 35,
    visualType: "token_streaming",
    author: "@sikho.ai",
    metrics: {
      labelLeft: "FIRST TOKEN LATENCY",
      valueLeft: "0.1s (Streaming)",
      labelRight: "WITHOUT STREAMING",
      valueRight: "3.0s Wait"
    },
    steps: [
      {
        id: 1,
        stepNumber: 1,
        title: "Model Predicts Next Token",
        description: "Large language models compute the probability distribution and emit one token chunk at a time.",
        animation: "model_generate",
        highlightNodes: ["model", "buffer"],
        caption: "The AI model predicts each word sequentially in real-time."
      },
      {
        id: 2,
        stepNumber: 2,
        title: "Without Streaming: Long Blocking Delay",
        description: "Without streaming, the client must wait until the entire 500-word response finishes before seeing any text.",
        animation: "compare_no_stream",
        highlightNodes: ["no_stream_channel"],
        caption: "Traditional HTTP blocks until the full response payload is completed."
      },
      {
        id: 3,
        stepNumber: 3,
        title: "With Streaming: Instant Delivery via SSE",
        description: "Using Server-Sent Events (SSE), every single token is pushed to the client interface the exact millisecond it is computed.",
        animation: "stream_packets",
        highlightNodes: ["stream_channel"],
        caption: "Streaming transmits tokens immediately over an open HTTP stream."
      }
    ],
    realWorldExample: "ChatGPT, Claude, and Gemini use token streaming so you can start reading the answer within 100 milliseconds.",
    challenge: {
      question: "Why does Token Streaming make AI chat feel so much faster?",
      options: [
        "It makes the LLM calculate 10x faster mathematically",
        "It sends the first words immediately as they are generated, reducing perceived latency",
        "It caches all future answers in memory"
      ],
      answer: 1,
      explanation: "Token streaming drastically reduces Time-To-First-Token (TTFT) by transmitting tokens immediately via persistent streaming chunks."
    }
  },
  "caching": {
    concept: "Caching & Redis",
    title: "How In-Memory Caching Works",
    subtitle: "Accelerating data retrieval by serving frequent requests from ultra-fast RAM memory",
    difficulty: "beginner",
    duration: 40,
    visualType: "caching",
    author: "@sikho.ai",
    metrics: {
      labelLeft: "CACHE READ LATENCY",
      valueLeft: "0.2ms (RAM)",
      labelRight: "DATABASE DISK LATENCY",
      valueRight: "25ms (Disk)"
    },
    steps: [
      {
        id: 1,
        stepNumber: 1,
        title: "Client Requests Resource",
        description: "The user requests their profile or dashboard data from the application backend.",
        animation: "client_to_cache",
        highlightNodes: ["input", "cache"],
        caption: "Request enters the gateway and first inspects the high-speed cache."
      },
      {
        id: 2,
        stepNumber: 2,
        title: "Cache Hit vs Cache Miss",
        description: "If data exists in RAM (Cache Hit), it returns in 0.2ms. If missing (Cache Miss), the database is queried and updates the cache.",
        animation: "cache_evaluate",
        highlightNodes: ["core", "cache"],
        caption: "Fast RAM lookup delivers instantaneous response without database disk I/O."
      },
      {
        id: 3,
        stepNumber: 3,
        title: "High Throughput Persistence",
        description: "By offloading 95% of reads to Redis/Memcached, the database handles write transactions without lock contention.",
        animation: "cache_persist",
        highlightNodes: ["output", "db"],
        caption: "Database remains lean, resilient, and responsive under peak load."
      }
    ],
    realWorldExample: "Instagram and Twitter use Redis to cache user feeds so millions of concurrent users get sub-millisecond scrolling.",
    challenge: {
      question: "What is the primary trade-off when using in-memory caches?",
      options: [
        "Cache data can become stale if not invalidated upon database writes",
        "It slows down network request round-trips",
        "It completely prevents any database writes"
      ],
      answer: 0,
      explanation: "Cache invalidation (TTL or write-through strategies) must be handled so users don't view stale data."
    }
  },
  "dsa": {
    concept: "Binary Search",
    title: "Binary Search & Divide and Conquer",
    subtitle: "Finding target elements in logarithmic O(log n) time by halving the search space",
    difficulty: "beginner",
    duration: 35,
    visualType: "request_distribution",
    author: "@sikho.ai",
    metrics: {
      labelLeft: "TIME COMPLEXITY",
      valueLeft: "O(log n)",
      labelRight: "SPACE COMPLEXITY",
      valueRight: "O(1) Auxiliary"
    },
    steps: [
      {
        id: 1,
        stepNumber: 1,
        title: "Sorted Input Invariant",
        description: "Binary search requires that the array or dataset is strictly sorted in ascending or descending order.",
        animation: "sort_check",
        highlightNodes: ["input"],
        caption: "Confirming sorted array invariant and establishing left/right pointers."
      },
      {
        id: 2,
        stepNumber: 2,
        title: "Divide Search Space at Midpoint",
        description: "Compute mid = (left + right) / 2. Compare mid with target to eliminate half the entire search space in one comparison.",
        animation: "halve_space",
        highlightNodes: ["core"],
        caption: "Comparing middle element and discarding the non-matching half."
      },
      {
        id: 3,
        stepNumber: 3,
        title: "Logarithmic Convergence",
        description: "Repeatedly halving reaches 1 element in log2(n) steps — finding targets across 1 million items in just 20 comparisons!",
        animation: "converge_target",
        highlightNodes: ["output"],
        caption: "Target located in O(log n) optimal steps."
      }
    ],
    realWorldExample: "Database B-Tree indexes and Git Bisect utilize binary search to find commits and index entries among billions of records instantly.",
    challenge: {
      question: "What happens if Binary Search is executed on an unsorted array?",
      options: [
        "It will still find the element in O(log n)",
        "It will fail unpredictably because the elimination invariant is violated",
        "It will automatically sort the array in O(1) time"
      ],
      answer: 1,
      explanation: "Without a sorted array, discarding half the search space might discard the target element."
    }
  }
};

export const visualExplain = asyncHandler(async (req: Request, res: Response) => {
  const method = req.method.toUpperCase();
  const source = method === "GET" ? req.query : { ...req.query, ...req.body };
  const rawTopic = (source.concept || source.userQuery || source.q || source.topic || "Load Balancing").toString().trim();
  const difficulty = (source.difficulty || "beginner").toString().trim() as "beginner" | "intermediate" | "advanced";
  const lowerTopic = rawTopic.toLowerCase();

  // Check fallback dictionary
  for (const [key, fallback] of Object.entries(FALLBACK_CONCEPTS)) {
    if (lowerTopic.includes(key) || key.includes(lowerTopic)) {
      return sendSuccessResponse(res, fallback, "Visual explanation generated successfully");
    }
  }

  const systemPrompt = `You are SikhoAI's Visual Concept Explainer Engine.
Your task is to convert any technical, computer science, or system design concept into a structured step-by-step visual animation schematic.

STRICT VISUAL TYPES ALLOWED:
- "request_distribution" (Load balancing, reverse proxies, DNS routing)
- "token_streaming" (LLM token generation, streaming APIs, SSE)
- "client_server" (HTTP requests, APIs, RPC)
- "caching" (Redis, CDN, in-memory caches)
- "neural_network" (Weights, activations, forward pass)
- "data_pipeline" (Kafka, message queues, ETL)

OUTPUT STRICT JSON MATCHING THIS EXACT SCHEMA:
{
  "concept": "Name of Concept",
  "title": "Clear Catchy Title (e.g. How Load Balancing Works)",
  "subtitle": "One sentence explaining why it matters",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "duration": 45,
  "visualType": "request_distribution",
  "author": "@sikho.ai",
  "metrics": {
    "labelLeft": "METRIC 1",
    "valueLeft": "Value 1",
    "labelRight": "METRIC 2",
    "valueRight": "Value 2"
  },
  "steps": [
    {
      "id": 1,
      "stepNumber": 1,
      "title": "Step 1 Title",
      "description": "Clear 1-2 sentence explanation of what happens here.",
      "animation": "animation_identifier",
      "highlightNodes": ["node1", "node2"],
      "caption": "Short punchy caption displayed at bottom of screen."
    },
    {
      "id": 2,
      "stepNumber": 2,
      "title": "Step 2 Title",
      "description": "Explanation of step 2.",
      "animation": "animation_identifier_2",
      "highlightNodes": ["node2"],
      "caption": "Punchy caption for step 2."
    },
    {
      "id": 3,
      "stepNumber": 3,
      "title": "Step 3 Title",
      "description": "Explanation of step 3.",
      "animation": "animation_identifier_3",
      "highlightNodes": ["node3"],
      "caption": "Punchy caption for step 3."
    }
  ],
  "realWorldExample": "One sentence real world application.",
  "challenge": {
    "question": "Multiple choice check question",
    "options": ["Option A", "Option B", "Option C"],
    "answer": 1,
    "explanation": "Clear explanation of why this answer is correct."
  }
}
Return pure JSON ONLY. No markdown, no commentary.`;

  const userPrompt = `Create an interactive visual explanation schematic for the concept: "${rawTopic}" with difficulty level "${difficulty}".`;

  try {
    const aiData = await queryAIWithJsonRotation(systemPrompt, userPrompt);
    if (aiData && aiData.concept && aiData.steps && aiData.steps.length > 0) {
      return sendSuccessResponse(res, aiData, "Visual explanation generated successfully");
    }
  } catch (err: any) {
    console.warn(`[VisualExplain] AI rotation fallback triggered for "${rawTopic}":`, err?.message || err);
  }

  // Graceful standard fallback if AI fails or topic unrecognized
  const genericFallback: VisualExplainResponse = {
    concept: rawTopic,
    title: `How ${rawTopic} Works`,
    subtitle: `Visual architecture and step-by-step breakdown of ${rawTopic}`,
    difficulty: "beginner",
    duration: 40,
    visualType: "request_distribution",
    author: "@sikho.ai",
    metrics: {
      labelLeft: "STATUS",
      valueLeft: "Active",
      labelRight: "ARCHITECTURE",
      valueRight: "Distributed"
    },
    steps: [
      {
        id: 1,
        stepNumber: 1,
        title: "Input & Initiation",
        description: `Initial requests or signals enter the ${rawTopic} pipeline.`,
        animation: "users_to_balancer",
        highlightNodes: ["users", "balancer"],
        caption: `Initiating workflow for ${rawTopic}.`
      },
      {
        id: 2,
        stepNumber: 2,
        title: "Processing & Orchestration",
        description: `The core controller evaluates state and manages processing tasks.`,
        animation: "balancer_inspect",
        highlightNodes: ["balancer"],
        caption: `Orchestrating tasks across available computational resources.`
      },
      {
        id: 3,
        stepNumber: 3,
        title: "Execution & Response",
        description: `Tasks are executed in parallel and the result is delivered back seamlessly.`,
        animation: "distribute_servers",
        highlightNodes: ["server1", "server2", "server3"],
        caption: `Successfully executed and delivered with optimal performance.`
      }
    ],
    realWorldExample: `Modern scalable software architectures rely on ${rawTopic} to ensure high throughput, fault tolerance, and responsiveness.`,
    challenge: {
      question: `What is the primary benefit of implementing ${rawTopic}?`,
      options: [
        "Increases single point of failure risks",
        "Improves system scalability, reliability, and responsiveness",
        "Eliminates the need for any backend infrastructure"
      ],
      answer: 1,
      explanation: `${rawTopic} ensures distributed workloads are processed efficiently without overwhelming any individual component.`
    }
  };

  return sendSuccessResponse(res, genericFallback, "Visual explanation generated successfully");
});
