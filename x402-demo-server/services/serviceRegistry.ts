export interface IRegisteredService {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  endpoint: string;
  providerPrice: number; // 0.20 USDC
  platformFee: number;   // 0.05 USDC
  userPrice: number;     // 0.25 USDC
  currency: string;      // "USDC"
  assetId: string;       // "31566704" (MainNet USDC ASA)
  payToAddress: string;  // Provider PayTo Address
  network: string;       // CAIP-2 Algorand MainNet identifier
  platformTreasuryAddress?: string;
  enabled: boolean;
  supportedMethods: string[];
}

export const SERVICE_REGISTRY: Record<string, IRegisteredService> = {
  "prism-code-review": {
    id: "prism-code-review",
    name: "Senior AI Code Review & Security Audit",
    provider: "Prism",
    category: "AI Code Analysis",
    description: "Performs comprehensive senior-engineer code review and security auditing on a single code file using high-precision LLM reasoning.",
    endpoint: "https://prism-99h2.onrender.com/code-review-accurate",
    providerPrice: 0.20,
    platformFee: 0.05,
    userPrice: 0.25,
    currency: "USDC",
    assetId: "31566704",
    payToAddress: "FL7U7GHUZB2R6RACPGY5UFD2K47CP2IL4RQWX7LKYE5QSFGXVJCDGPRLBE",
    platformTreasuryAddress: "2RIRIX5XK6GWK7LOXDAYIDTN4IYDVNRDJFXR4TJCLYIM72A3EF2UQPROQY",
    network: "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
    enabled: true,
    supportedMethods: ["GET", "POST"],
  },
};

export const getServiceById = (serviceId: string): IRegisteredService | null => {
  return SERVICE_REGISTRY[serviceId] || null;
};

export const getAllServices = (): IRegisteredService[] => {
  return Object.values(SERVICE_REGISTRY).filter((s) => s.enabled);
};
