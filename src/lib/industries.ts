import {
  TrendingUp, Scale, Stethoscope, Building2, Cpu, ShoppingBag,
  Utensils, GraduationCap, Truck, Paintbrush, Leaf, Plane,
  type LucideIcon
} from "lucide-react";

export interface IndustryConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string; // tailwind color class
  description: string;
  aiPersona: string; // injected into system prompt
  quickActions: string[];
  dashboardWidgets: string[];
  missionTemplates: {
    icon: string;
    label: string;
    prompt: string;
    category: string;
  }[];
}

export const INDUSTRIES: IndustryConfig[] = [
  {
    id: "finance",
    name: "Finance & Trading",
    icon: TrendingUp,
    color: "text-emerald-500",
    description: "Markets, portfolio analysis, risk management, crypto, forex",
    aiPersona: `You are a senior financial analyst and trading strategist. Prioritize: market data interpretation, risk/reward analysis, portfolio optimization, technical & fundamental analysis, regulatory compliance (SEC, FINRA). Use precise financial terminology. Include disclaimers for investment advice. Format numbers with proper currency notation. When discussing stocks, include ticker symbols. For crypto, mention on-chain metrics.`,
    quickActions: ["Analyze stock", "Portfolio review", "Market sentiment", "Risk assessment", "Earnings analysis"],
    dashboardWidgets: ["market-overview", "portfolio-tracker", "sentiment-gauge", "watchlist", "risk-metrics"],
    missionTemplates: [
      { icon: "TrendingUp", label: "Stock Deep Dive", prompt: "Comprehensive analysis of [TICKER]: fundamentals, technicals, insider activity, institutional holdings, and 12-month price target", category: "research" },
      { icon: "BarChart3", label: "Portfolio Audit", prompt: "Analyze my portfolio allocation, identify concentration risks, suggest rebalancing strategies, and calculate risk-adjusted returns", category: "research" },
      { icon: "Globe", label: "Market Sentiment Report", prompt: "Scan news, social media, and analyst reports for current market sentiment on [sector/ticker]. Include fear & greed indicators", category: "research" },
      { icon: "Shield", label: "Risk Assessment", prompt: "Generate a comprehensive risk report: VaR analysis, stress testing scenarios, correlation matrix, and hedging strategies for [portfolio/position]", category: "business" },
    ],
  },
  {
    id: "legal",
    name: "Legal & Compliance",
    icon: Scale,
    color: "text-amber-500",
    description: "Contract analysis, regulatory compliance, case research",
    aiPersona: `You are a senior legal advisor specializing in corporate law, contracts, and regulatory compliance. Prioritize: jurisdiction-specific analysis, precedent citations, risk assessment, contractual obligations. Use precise legal terminology. Always note jurisdiction relevance. Include statutory references. Format legal citations properly (e.g., Bluebook style). Disclaimer: not a substitute for licensed legal counsel.`,
    quickActions: ["Review contract", "Compliance check", "Legal research", "Draft NDA", "Risk analysis"],
    dashboardWidgets: ["compliance-tracker", "regulation-alerts", "contract-pipeline", "case-research"],
    missionTemplates: [
      { icon: "FileText", label: "Contract Analysis", prompt: "Review this contract for risks, unfavorable clauses, missing protections, and suggest amendments with redline markup", category: "research" },
      { icon: "Shield", label: "Compliance Audit", prompt: "Audit [company/product] for compliance with [GDPR/CCPA/SOX/HIPAA]. Identify gaps and provide remediation steps", category: "research" },
      { icon: "Search", label: "Case Law Research", prompt: "Research relevant case law and precedents for [legal issue]. Include citations, court decisions, and applicability analysis", category: "research" },
      { icon: "PenTool", label: "Draft Legal Document", prompt: "Draft a [NDA/Terms of Service/Privacy Policy/Employment Agreement] for [company description]", category: "content" },
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare & Medical",
    icon: Stethoscope,
    color: "text-red-500",
    description: "Clinical research, patient management, medical documentation",
    aiPersona: `You are a medical informatics specialist and clinical research advisor. Prioritize: evidence-based medicine, clinical trial data, HIPAA compliance, patient safety. Reference PubMed/medical journals. Use proper medical terminology with layman explanations. Always include medical disclaimers. For drug interactions, cite FDA databases. Format dosages precisely.`,
    quickActions: ["Research condition", "Drug interactions", "Clinical guidelines", "Patient summary", "Literature review"],
    dashboardWidgets: ["clinical-alerts", "research-pipeline", "patient-metrics", "drug-database"],
    missionTemplates: [
      { icon: "Search", label: "Clinical Research", prompt: "Systematic review of latest research on [condition/treatment]. Include meta-analyses, clinical trials, and evidence grades", category: "research" },
      { icon: "FileText", label: "Patient Documentation", prompt: "Generate comprehensive patient documentation template for [specialty/condition] following [SOAP/BIRP] format", category: "content" },
      { icon: "Shield", label: "HIPAA Compliance Check", prompt: "Audit [system/process] for HIPAA compliance. Identify PHI exposure risks and remediation steps", category: "research" },
      { icon: "Database", label: "Drug Interaction Analysis", prompt: "Analyze interactions between [medications]. Include severity, mechanisms, clinical significance, and alternatives", category: "research" },
    ],
  },
  {
    id: "realestate",
    name: "Real Estate",
    icon: Building2,
    color: "text-blue-500",
    description: "Property analysis, market trends, investment modeling",
    aiPersona: `You are a real estate investment analyst and market strategist. Prioritize: comparable market analysis (CMA), cap rates, cash-on-cash returns, location analysis, zoning regulations. Use property investment metrics. Include market cycle analysis. Format property values and yields precisely. Consider local market conditions and regulations.`,
    quickActions: ["Property analysis", "Market comps", "ROI calculator", "Zoning check", "Investment model"],
    dashboardWidgets: ["market-trends", "property-pipeline", "roi-calculator", "area-analysis"],
    missionTemplates: [
      { icon: "Search", label: "Market Analysis", prompt: "Comprehensive real estate market analysis for [location]: trends, pricing, inventory, days on market, and 12-month forecast", category: "research" },
      { icon: "BarChart3", label: "Investment Model", prompt: "Build a detailed financial model for [property type] investment: purchase price, renovation costs, rental income, cap rate, ROI projections", category: "business" },
      { icon: "Globe", label: "Location Intel", prompt: "Deep analysis of [neighborhood/city]: demographics, school ratings, crime stats, development plans, and appreciation potential", category: "research" },
      { icon: "FileText", label: "Property Report", prompt: "Generate a comprehensive property analysis report for [address] including comps, condition assessment, and investment recommendation", category: "content" },
    ],
  },
  {
    id: "technology",
    name: "Technology & SaaS",
    icon: Cpu,
    color: "text-violet-500",
    description: "Software architecture, product strategy, tech analysis",
    aiPersona: `You are a senior technology strategist and software architect. Prioritize: system design, scalability, tech stack selection, SaaS metrics (MRR, churn, LTV/CAC), product-market fit. Use precise technical terminology. Include architecture diagrams as code. Reference industry benchmarks. Consider security, performance, and maintainability.`,
    quickActions: ["Architecture review", "Tech stack analysis", "SaaS metrics", "Code review", "Product roadmap"],
    dashboardWidgets: ["tech-radar", "saas-metrics", "deployment-status", "bug-tracker"],
    missionTemplates: [
      { icon: "Code", label: "Architecture Review", prompt: "Review system architecture for [project]: scalability, security, performance bottlenecks, and optimization recommendations", category: "engineering" },
      { icon: "BarChart3", label: "SaaS Metrics Dashboard", prompt: "Analyze SaaS metrics: MRR growth, churn rate, LTV/CAC ratio, expansion revenue. Provide benchmarks and improvement strategies", category: "business" },
      { icon: "Network", label: "Tech Stack Analysis", prompt: "Evaluate and compare tech stacks for [use case]. Include performance, developer experience, scalability, and cost analysis", category: "engineering" },
      { icon: "TrendingUp", label: "Product Roadmap", prompt: "Create a 6-month product roadmap for [product] based on user feedback, market trends, and competitive analysis", category: "business" },
    ],
  },
  {
    id: "ecommerce",
    name: "E-Commerce & Retail",
    icon: ShoppingBag,
    color: "text-pink-500",
    description: "Sales optimization, inventory, customer analytics",
    aiPersona: `You are an e-commerce strategist and retail analytics expert. Prioritize: conversion optimization, customer lifetime value, inventory management, pricing strategy, marketplace dynamics. Use retail metrics (AOV, ROAS, CAC). Include seasonal trend analysis. Reference industry benchmarks for conversion rates and margins.`,
    quickActions: ["Sales analysis", "Product pricing", "Customer segments", "Inventory forecast", "Ad performance"],
    dashboardWidgets: ["sales-overview", "conversion-funnel", "inventory-alerts", "customer-segments"],
    missionTemplates: [
      { icon: "ShoppingCart", label: "Conversion Audit", prompt: "Audit [store/website] for conversion optimization: checkout flow, product pages, pricing psychology, and A/B test suggestions", category: "business" },
      { icon: "Users", label: "Customer Analysis", prompt: "Segment customers by RFM analysis, identify high-value cohorts, and create targeted retention strategies", category: "research" },
      { icon: "TrendingUp", label: "Pricing Strategy", prompt: "Develop pricing strategy for [product line]: competitive analysis, margin optimization, and dynamic pricing recommendations", category: "business" },
      { icon: "Image", label: "Product Listings", prompt: "Create optimized product listings for [products]: SEO titles, descriptions, bullet points, and A+ content for [marketplace]", category: "content" },
    ],
  },
  {
    id: "food",
    name: "Food & Hospitality",
    icon: Utensils,
    color: "text-orange-500",
    description: "Restaurant ops, menu engineering, food safety",
    aiPersona: `You are a hospitality industry consultant and food service strategist. Prioritize: menu engineering, food cost optimization, health code compliance, customer experience, supply chain management. Use restaurant metrics (food cost %, table turnover, RevPASH). Include seasonal menu planning and trend analysis.`,
    quickActions: ["Menu analysis", "Food cost calc", "Health compliance", "Staff scheduling", "Review management"],
    dashboardWidgets: ["daily-revenue", "food-cost-tracker", "review-sentiment", "staff-schedule"],
    missionTemplates: [
      { icon: "BarChart3", label: "Menu Engineering", prompt: "Analyze menu for profitability: categorize items by popularity and margin, suggest pricing changes and menu redesign", category: "business" },
      { icon: "Shield", label: "Health Code Audit", prompt: "Comprehensive health and safety compliance audit for [restaurant type]. Include HACCP plan and staff training checklist", category: "research" },
      { icon: "TrendingUp", label: "Revenue Optimization", prompt: "Analyze revenue streams and suggest optimization: upselling strategies, happy hour programs, delivery partnerships, and loyalty programs", category: "business" },
      { icon: "PenTool", label: "Brand Content", prompt: "Create a month of social media content for [restaurant]: posts, stories, reels scripts, and influencer collaboration templates", category: "content" },
    ],
  },
  {
    id: "education",
    name: "Education & Training",
    icon: GraduationCap,
    color: "text-sky-500",
    description: "Curriculum design, student analytics, EdTech",
    aiPersona: `You are an education technology specialist and curriculum design expert. Prioritize: learning outcomes, pedagogical best practices, accessibility (WCAG), assessment design, student engagement metrics. Reference education research and standards. Include differentiated instruction strategies. Consider diverse learning needs and styles.`,
    quickActions: ["Curriculum design", "Assessment create", "Learning analytics", "Lesson plan", "Student report"],
    dashboardWidgets: ["student-progress", "course-analytics", "assessment-results", "engagement-metrics"],
    missionTemplates: [
      { icon: "FileText", label: "Curriculum Builder", prompt: "Design a [duration] curriculum for [subject/skill]: learning objectives, module breakdown, assessments, and resource list", category: "content" },
      { icon: "BarChart3", label: "Learning Analytics", prompt: "Analyze student performance data: identify at-risk students, learning gaps, and personalized intervention strategies", category: "research" },
      { icon: "PenTool", label: "Course Content", prompt: "Create comprehensive course materials for [topic]: lecture notes, exercises, quizzes, and supplementary resources", category: "content" },
      { icon: "Users", label: "Training Program", prompt: "Design a corporate training program for [skill/tool]: objectives, modules, hands-on exercises, and certification criteria", category: "content" },
    ],
  },
  {
    id: "logistics",
    name: "Logistics & Supply Chain",
    icon: Truck,
    color: "text-teal-500",
    description: "Supply chain optimization, fleet management, warehousing",
    aiPersona: `You are a supply chain management consultant and logistics optimization expert. Prioritize: route optimization, inventory management (JIT, EOQ), warehouse efficiency, carrier management, demand forecasting. Use logistics metrics (OTIF, fill rate, cost per mile). Include sustainability considerations in supply chain decisions.`,
    quickActions: ["Route optimize", "Inventory forecast", "Carrier analysis", "Warehouse audit", "Cost analysis"],
    dashboardWidgets: ["shipment-tracker", "inventory-levels", "carrier-performance", "cost-breakdown"],
    missionTemplates: [
      { icon: "Globe", label: "Route Optimization", prompt: "Optimize delivery routes for [fleet size] vehicles across [area]: minimize fuel costs, maximize deliveries, consider time windows", category: "engineering" },
      { icon: "Database", label: "Inventory Optimization", prompt: "Analyze inventory levels: identify dead stock, optimize reorder points, calculate safety stock, and forecast demand", category: "research" },
      { icon: "BarChart3", label: "Supply Chain Audit", prompt: "End-to-end supply chain audit: identify bottlenecks, single points of failure, cost reduction opportunities, and resilience improvements", category: "research" },
      { icon: "TrendingUp", label: "Demand Forecasting", prompt: "Build demand forecast model for [product line]: seasonal patterns, trend analysis, and inventory planning recommendations", category: "business" },
    ],
  },
  {
    id: "creative",
    name: "Creative & Media",
    icon: Paintbrush,
    color: "text-fuchsia-500",
    description: "Content strategy, brand design, media production",
    aiPersona: `You are a creative director and brand strategist. Prioritize: brand consistency, audience engagement, content strategy, visual storytelling, campaign performance. Use creative industry metrics (engagement rate, reach, impressions). Include trend analysis for design and content. Consider platform-specific best practices for each channel.`,
    quickActions: ["Brand audit", "Content calendar", "Campaign brief", "Design critique", "Audience analysis"],
    dashboardWidgets: ["content-calendar", "engagement-metrics", "brand-assets", "campaign-tracker"],
    missionTemplates: [
      { icon: "PenTool", label: "Brand Strategy", prompt: "Develop comprehensive brand strategy for [company]: positioning, voice guidelines, visual identity, and messaging framework", category: "content" },
      { icon: "Image", label: "Content Pipeline", prompt: "Create 30-day content calendar for [brand] across [platforms]: posts, stories, reels, with copy, hashtags, and visual briefs", category: "content" },
      { icon: "BarChart3", label: "Campaign Analysis", prompt: "Analyze [campaign] performance: ROAS, engagement, reach, conversions. Identify winners and optimization opportunities", category: "research" },
      { icon: "Users", label: "Audience Research", prompt: "Deep audience research for [brand/product]: demographics, psychographics, media consumption, pain points, and content preferences", category: "research" },
    ],
  },
  {
    id: "energy",
    name: "Energy & Sustainability",
    icon: Leaf,
    color: "text-green-500",
    description: "Renewable energy, carbon tracking, ESG reporting",
    aiPersona: `You are an energy sector analyst and sustainability consultant. Prioritize: renewable energy analysis, carbon footprint calculation, ESG compliance, energy efficiency optimization, regulatory compliance. Use energy metrics (LCOE, capacity factor, carbon intensity). Include policy and subsidy analysis. Reference IEA/IRENA data.`,
    quickActions: ["Energy audit", "Carbon calc", "ESG report", "Solar analysis", "Grid optimization"],
    dashboardWidgets: ["energy-usage", "carbon-tracker", "esg-scores", "renewable-mix"],
    missionTemplates: [
      { icon: "BarChart3", label: "Energy Audit", prompt: "Comprehensive energy audit for [facility/company]: consumption analysis, efficiency opportunities, ROI on improvements, and carbon reduction potential", category: "research" },
      { icon: "FileText", label: "ESG Report", prompt: "Generate ESG report for [company]: environmental metrics, social impact, governance practices, and GRI/SASB alignment", category: "content" },
      { icon: "TrendingUp", label: "Renewable Analysis", prompt: "Feasibility analysis for [solar/wind/battery] installation: site assessment, financial modeling, payback period, and incentive mapping", category: "business" },
      { icon: "Globe", label: "Carbon Strategy", prompt: "Develop carbon reduction strategy for [company]: Scope 1/2/3 emissions baseline, reduction targets, offset strategies, and SBTi alignment", category: "business" },
    ],
  },
  {
    id: "travel",
    name: "Travel & Aviation",
    icon: Plane,
    color: "text-cyan-500",
    description: "Travel planning, aviation analytics, hospitality management",
    aiPersona: `You are a travel industry analyst and aviation consultant. Prioritize: route profitability, load factors, revenue management, customer experience optimization, regulatory compliance (FAA/EASA). Use aviation/travel metrics (RPK, yield, RASM). Include seasonal demand patterns and competitive route analysis.`,
    quickActions: ["Route analysis", "Revenue forecast", "Customer segments", "Competitor routes", "Demand forecast"],
    dashboardWidgets: ["route-performance", "load-factors", "revenue-trends", "booking-pipeline"],
    missionTemplates: [
      { icon: "Globe", label: "Route Analysis", prompt: "Analyze [route/destination] viability: demand, competition, pricing, seasonality, and profitability projection", category: "research" },
      { icon: "TrendingUp", label: "Revenue Management", prompt: "Optimize pricing strategy for [routes/properties]: demand forecasting, dynamic pricing rules, and yield management", category: "business" },
      { icon: "Users", label: "Guest Experience", prompt: "Design guest experience improvement plan for [hotel/airline]: touchpoint mapping, NPS improvement strategies, and loyalty program optimization", category: "business" },
      { icon: "BarChart3", label: "Market Intel", prompt: "Competitive intelligence report for [destination/carrier]: market share, pricing comparison, service gaps, and expansion opportunities", category: "research" },
    ],
  },
];

export const getIndustryById = (id: string): IndustryConfig | undefined =>
  INDUSTRIES.find((i) => i.id === id);

export const getIndustrySystemPrompt = (industryId: string): string => {
  const industry = getIndustryById(industryId);
  if (!industry) return "";
  return `\n\n## INDUSTRY SPECIALIZATION: ${industry.name.toUpperCase()}\n${industry.aiPersona}`;
};
