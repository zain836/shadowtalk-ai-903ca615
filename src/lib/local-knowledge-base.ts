import { openDB, IDBPDatabase } from 'idb';

/**
 * Local Knowledge Base — Indexes and searches cached knowledge content
 * (articles, docs, research) for fully offline RAG retrieval.
 */

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  indexedAt: string;
  wordCount: number;
}

export interface KBSearchResult {
  article: KBArticle;
  score: number;
  matchedTerms: string[];
  snippet: string;
}

const DB_NAME = 'shadow-knowledge-base';
const ARTICLES_STORE = 'articles';
const INDEX_STORE = 'inverted_index';

let dbInstance: IDBPDatabase | null = null;

async function getDb(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(ARTICLES_STORE)) {
        const store = db.createObjectStore(ARTICLES_STORE, { keyPath: 'id' });
        store.createIndex('by-category', 'category');
        store.createIndex('by-source', 'source');
      }
      if (!db.objectStoreNames.contains(INDEX_STORE)) {
        db.createObjectStore(INDEX_STORE, { keyPath: 'term' });
      }
    },
  });
  return dbInstance;
}

// Tokenize and normalize text
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

// TF-IDF inspired term frequency
function computeTF(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  const max = Math.max(...freq.values());
  for (const [k, v] of freq) {
    freq.set(k, v / max);
  }
  return freq;
}

// Index an article into the knowledge base
export async function indexArticle(article: Omit<KBArticle, 'id' | 'indexedAt' | 'wordCount'>): Promise<string> {
  const db = await getDb();
  const id = `kb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const tokens = tokenize(article.content + ' ' + article.title);

  const entry: KBArticle = {
    ...article,
    id,
    indexedAt: new Date().toISOString(),
    wordCount: tokens.length,
  };

  await db.put(ARTICLES_STORE, entry);

  // Update inverted index
  const tf = computeTF(tokens);
  const tx = db.transaction(INDEX_STORE, 'readwrite');
  for (const [term, score] of tf) {
    const existing = await tx.store.get(term);
    if (existing) {
      existing.articles[id] = score;
      await tx.store.put(existing);
    } else {
      await tx.store.put({ term, articles: { [id]: score } });
    }
  }
  await tx.done;

  return id;
}

// Search the knowledge base
export async function searchKnowledgeBase(query: string, limit = 10): Promise<KBSearchResult[]> {
  const db = await getDb();
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Score articles via inverted index
  const scores = new Map<string, { score: number; matchedTerms: string[] }>();

  for (const token of queryTokens) {
    const entry = await db.get(INDEX_STORE, token);
    if (!entry) continue;
    for (const [articleId, tf] of Object.entries(entry.articles)) {
      const existing = scores.get(articleId) || { score: 0, matchedTerms: [] };
      existing.score += tf as number;
      if (!existing.matchedTerms.includes(token)) existing.matchedTerms.push(token);
      scores.set(articleId, existing);
    }
  }

  // Sort by score and fetch articles
  const ranked = Array.from(scores.entries())
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, limit);

  const results: KBSearchResult[] = [];
  for (const [articleId, { score, matchedTerms }] of ranked) {
    const article = await db.get(ARTICLES_STORE, articleId);
    if (!article) continue;

    // Generate snippet
    const lowerContent = article.content.toLowerCase();
    let snippetStart = 0;
    for (const term of matchedTerms) {
      const idx = lowerContent.indexOf(term);
      if (idx !== -1) {
        snippetStart = Math.max(0, idx - 50);
        break;
      }
    }
    const snippet = article.content.substring(snippetStart, snippetStart + 200).trim() + '...';

    results.push({ article, score, matchedTerms, snippet });
  }

  return results;
}

// Batch index multiple articles
export async function batchIndexArticles(articles: Omit<KBArticle, 'id' | 'indexedAt' | 'wordCount'>[]): Promise<number> {
  let count = 0;
  for (const article of articles) {
    await indexArticle(article);
    count++;
  }
  return count;
}

// Get all articles by category
export async function getArticlesByCategory(category: string): Promise<KBArticle[]> {
  const db = await getDb();
  return db.getAllFromIndex(ARTICLES_STORE, 'by-category', category);
}

// Get knowledge base stats
export async function getKBStats(): Promise<{
  totalArticles: number;
  totalWords: number;
  categories: { name: string; count: number }[];
  sources: { name: string; count: number }[];
}> {
  const db = await getDb();
  const all: KBArticle[] = await db.getAll(ARTICLES_STORE);

  const categories = new Map<string, number>();
  const sources = new Map<string, number>();
  let totalWords = 0;

  for (const article of all) {
    totalWords += article.wordCount;
    categories.set(article.category, (categories.get(article.category) || 0) + 1);
    sources.set(article.source, (sources.get(article.source) || 0) + 1);
  }

  return {
    totalArticles: all.length,
    totalWords,
    categories: Array.from(categories.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    sources: Array.from(sources.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
  };
}

// Remove an article
export async function removeArticle(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(ARTICLES_STORE, id);
}

// Clear entire knowledge base
export async function clearKnowledgeBase(): Promise<void> {
  const db = await getDb();
  await db.clear(ARTICLES_STORE);
  await db.clear(INDEX_STORE);
}

// Seed knowledge base with built-in domain knowledge
export async function seedDefaultKnowledge(): Promise<number> {
  const defaultArticles = [
    {
      title: 'Privacy-First AI Architecture',
      content: 'Privacy-first AI systems process data locally on the user\'s device, ensuring data sovereignty. Key techniques include federated learning, differential privacy, homomorphic encryption, and on-device inference using WebGPU. Models like Phi-3.5-Mini and Qwen2.5 can run entirely in the browser via WebLLM, eliminating the need for cloud API calls. This approach ensures GDPR and CCPA compliance by default since personal data never leaves the device.',
      category: 'AI/ML',
      tags: ['privacy', 'on-device', 'federated-learning', 'WebGPU'],
      source: 'built-in',
    },
    {
      title: 'SaaS Pricing Strategies',
      content: 'Effective SaaS pricing models include freemium (free tier with paid upgrades), usage-based (pay per unit consumed), tiered (fixed packages), per-seat (per user), and hybrid approaches. Key metrics: LTV/CAC ratio should exceed 3:1, monthly churn below 5%, and gross margins above 70%. Price anchoring, decoy pricing, and annual discount incentives (typically 15-20%) are proven strategies to maximize ARR.',
      category: 'Business Strategy',
      tags: ['pricing', 'SaaS', 'monetization', 'ARR'],
      source: 'built-in',
    },
    {
      title: 'Zero-Trust Security Model',
      content: 'Zero-trust security assumes no implicit trust for any user, device, or network. Core principles: verify explicitly (always authenticate), least-privilege access, assume breach mentality. Implementation involves multi-factor authentication (MFA), micro-segmentation, continuous monitoring, encryption at rest and in transit, and identity-based access controls. Essential for SOC2, ISO 27001, and HIPAA compliance frameworks.',
      category: 'Cybersecurity',
      tags: ['zero-trust', 'security', 'compliance', 'MFA'],
      source: 'built-in',
    },
    {
      title: 'Product-Led Growth Framework',
      content: 'Product-Led Growth (PLG) uses the product itself as the primary driver of acquisition, conversion, and expansion. Key components: frictionless onboarding, time-to-value optimization, viral loops, in-product upsells, and self-serve purchasing. Successful PLG companies (Slack, Notion, Figma) achieve 120%+ net revenue retention through product usage expansion. Metrics to track: activation rate, feature adoption, PQL conversion rate.',
      category: 'Business Strategy',
      tags: ['PLG', 'growth', 'acquisition', 'retention'],
      source: 'built-in',
    },
    {
      title: 'Large Language Model Optimization',
      content: 'LLM optimization techniques for production: quantization (INT4/INT8 reduces model size 4x with <1% quality loss), KV-cache optimization, speculative decoding for faster inference, prompt engineering best practices, and RAG (Retrieval-Augmented Generation) for grounding responses in factual data. On-device LLMs benefit from WebGPU acceleration, ONNX Runtime Web, and progressive model loading for optimal user experience.',
      category: 'AI/ML',
      tags: ['LLM', 'optimization', 'quantization', 'RAG'],
      source: 'built-in',
    },
    {
      title: 'Competitive Analysis Framework',
      content: 'Structured competitive analysis includes Porter\'s Five Forces (supplier power, buyer power, competitive rivalry, threat of substitution, threat of new entry), SWOT analysis (strengths, weaknesses, opportunities, threats), and feature comparison matrices. Track competitor pricing, feature releases, funding rounds, and market positioning. Use battle cards for sales enablement and differentiation messaging.',
      category: 'Business Strategy',
      tags: ['competitive-analysis', 'strategy', 'Porters-Five-Forces', 'SWOT'],
      source: 'built-in',
    },
    {
      title: 'WebGPU Computing for AI',
      content: 'WebGPU is the next-generation web standard for GPU-accelerated computing, enabling ML inference directly in browsers. It provides low-level access to GPU hardware similar to Vulkan/Metal. Key features: compute shaders for parallel processing, efficient memory management, cross-platform compatibility. Libraries like WebLLM and ONNX Runtime Web leverage WebGPU for running transformer models at near-native speeds. Supported in Chrome 113+, Edge 113+, with Firefox and Safari support in development.',
      category: 'Technology',
      tags: ['WebGPU', 'browser', 'GPU', 'inference'],
      source: 'built-in',
    },
    {
      title: 'Data Sovereignty Regulations',
      content: 'Data sovereignty laws require data to be stored and processed within specific jurisdictions. Key regulations: GDPR (EU, fines up to 4% of global revenue), CCPA/CPRA (California), LGPD (Brazil), POPIA (South Africa), PIPL (China). Compliance strategies include data localization, encryption, consent management, data minimization, and right-to-erasure implementation. On-device processing provides inherent compliance by eliminating cross-border data transfers.',
      category: 'Compliance',
      tags: ['GDPR', 'data-sovereignty', 'privacy', 'regulations'],
      source: 'built-in',
    },
  ];

  return batchIndexArticles(defaultArticles);
}
