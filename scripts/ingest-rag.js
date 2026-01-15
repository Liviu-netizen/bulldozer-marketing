import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://liviu-mkfxdm5h-eastus2.cognitiveservices.azure.com/';
const azureApiKey = process.env.AZURE_OPENAI_KEY;
const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';
const embeddingsDeployment = process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT;
const siteUrl = process.env.SITE_URL || 'https://bulldozermarketing.com';

const files = [
  { file: 'index.html', url: '/' },
  { file: 'about.html', url: '/about.html' },
  { file: 'portfolio.html', url: '/portfolio.html' },
  { file: 'privacy.html', url: '/privacy.html' },
  { file: 'terms.html', url: '/terms.html' },
  { file: 'cookies.html', url: '/cookies.html' }
];

const required = [
  ['SUPABASE_URL', supabaseUrl],
  ['SUPABASE_SERVICE_ROLE_KEY', supabaseServiceKey],
  ['AZURE_OPENAI_KEY', azureApiKey],
  ['AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT', embeddingsDeployment]
];

const missing = required.filter(([, value]) => !value).map(([name]) => name);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

const reset = process.argv.includes('--reset');

const stripHtml = (html) => {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  const withBreaks = withoutScripts.replace(/<\/(p|li|h[1-6]|br|section|div)>/gi, '\n');
  return withBreaks
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

const extractTitle = (html, fallback) => {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1].trim() : fallback;
};

const chunkText = (text, maxLength = 900, overlap = 120) => {
  if (!text) return [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;
    if (next.length > maxLength && current) {
      chunks.push(current.trim());
      const overlapText = current.slice(-overlap);
      current = overlapText ? `${overlapText} ${sentence}` : sentence;
    } else {
      current = next;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
};

const toAzureUrl = (pathPart) => {
  const url = new URL(pathPart, azureEndpoint);
  url.searchParams.set('api-version', azureApiVersion);
  return url.toString();
};

const embedText = async (text) => {
  const response = await fetch(
    toAzureUrl(`/openai/deployments/${embeddingsDeployment}/embeddings`),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureApiKey
      },
      body: JSON.stringify({ input: text })
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Embedding request failed.');
  }

  return data?.data?.[0]?.embedding;
};

const hashContent = (source, content) =>
  crypto.createHash('sha256').update(`${source}:${content}`).digest('hex');

const upsertBatch = async (records) => {
  const { error } = await supabase
    .from('rag_chunks')
    .upsert(records, { onConflict: 'content_hash' });
  if (error) {
    throw new Error(error.message);
  }
};

const run = async () => {
  if (reset) {
    const sources = files.map((entry) => entry.file);
    const { error } = await supabase
      .from('rag_chunks')
      .delete()
      .in('source', sources);
    if (error) {
      throw new Error(error.message);
    }
  }

  for (const entry of files) {
    const filePath = path.resolve(process.cwd(), entry.file);
    const html = await fs.readFile(filePath, 'utf8');
    const title = extractTitle(html, entry.file);
    const text = stripHtml(html);
    const chunks = chunkText(text);
    const pageUrl = new URL(entry.url, siteUrl).toString();

    const records = [];
    for (let i = 0; i < chunks.length; i += 1) {
      const content = chunks[i];
      const embedding = await embedText(content);
      records.push({
        source: entry.file,
        page_title: title,
        section_title: null,
        content,
        chunk_index: i,
        content_hash: hashContent(entry.file, content),
        embedding,
        metadata: { url: pageUrl }
      });
    }

    const batchSize = 12;
    for (let i = 0; i < records.length; i += batchSize) {
      await upsertBatch(records.slice(i, i + batchSize));
    }

    console.log(`Ingested ${records.length} chunks from ${entry.file}`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
