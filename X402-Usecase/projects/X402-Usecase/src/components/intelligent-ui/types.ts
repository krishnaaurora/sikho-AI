export interface SimulatorParameter {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
}

export interface SimulatorPreset {
  name: string;
  values: Record<string, number>;
}

export interface SimulatorConfig {
  title: string;
  description: string;
  parameters: SimulatorParameter[];
  metricsFormula: string;
  metricPresets?: SimulatorPreset[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
  benchmark?: number;
  secondary?: number;
  [key: string]: any;
}

export interface ConceptChartConfig {
  title: string;
  description: string;
  type: 'bar' | 'line' | 'area';
  xAxisKey: string;
  data: ChartDataPoint[];
}

export interface FlowStepNode {
  step: number;
  title: string;
  description: string;
  nodeType: 'client' | 'gateway' | 'queue' | 'worker' | 'cache' | 'database' | 'ai';
  highlight: string;
}

export interface CodeSnippetConfig {
  language: string;
  title: string;
  code: string;
  explanation: string;
}

export interface ConceptQuiz {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  celebrationText: string;
}

export interface ConceptExplanationBreakdown {
  component: string;
  role: string;
  details: string;
  icon?: string;
}

export interface ConceptExplanationTradeoff {
  factor: string;
  pro: string;
  con: string;
}

export interface ConceptExplanationConfig {
  title: string;
  tagline: string;
  overview: string;
  problemSolved: string;
  architectureBreakdown: ConceptExplanationBreakdown[];
  tradeoffs: ConceptExplanationTradeoff[];
  productionCaseStudy: {
    company: string;
    scenario: string;
    impact: string;
  };
  failureModes: string[];
}

export interface ArchitectureSimulationServer {
  id: string;
  name: string;
  port: number;
  initialHealthy: boolean;
  load?: number;
}

export interface ArchitectureSimulationConfig {
  title: string;
  description: string;
  diagramImage?: string;
  frontendTitle: string;
  gatewayTitle: string;
  algorithms: string[];
  servers: ArchitectureSimulationServer[];
  databaseTitle: string;
}

export interface IntelligentUiConceptData {
  concept: string;
  topic: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  summary: string;
  mentalModel: {
    analogy: string;
    whyItMatters: string;
    keyTakeaway: string;
  };
  explanation: ConceptExplanationConfig;
  architectureSim?: ArchitectureSimulationConfig;
  flowSteps: FlowStepNode[];
  codeSnippet: CodeSnippetConfig;
  quiz: ConceptQuiz;
  // Optional backwards compatibility fields
  simulator?: SimulatorConfig;
  chart?: ConceptChartConfig;
}
