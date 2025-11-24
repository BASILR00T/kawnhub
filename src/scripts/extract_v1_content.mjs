import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const V1_DIR = path.join(PROJECT_ROOT, 'V1 content HTML');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/data/migrated_topics.json');
const SEARCH_DATA_FILE = path.join(V1_DIR, 'search_data.json');

// Material Mapping
const MATERIAL_MAPPING = {
    'Network2': 'networks-1',
    'NOSs': 'os-1',
    'Programming': 'programming-1',
    'PCCT': 'maintenance',
    'Network1': 'networks-intro'
};

// Helper to clean text
const cleanText = (text) => {
    if (!text) return '';
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .trim();
};

// Helper to extract text from code blocks (stripping tags)
const extractCodeText = (html) => {
    // Replace <br> with newlines
    let text = html.replace(/<br\s*\/?>/gi, '\n');
    // Strip other tags
    text = text.replace(/<[^>]+>/g, '');
    return cleanText(text);
};

// Helper to parse HTML content
const parseHtmlContent = (html) => {
    const blocks = [];

    // 1. Split into sections
    let sections = [];

    // Extract <section class="section"> (Safe for nested divs)
    const sectionRegex = /<section class="section">([\s\S]*?)<\/section>/g;
    let sectionMatch;
    while ((sectionMatch = sectionRegex.exec(html)) !== null) {
        sections.push(sectionMatch[1]);
    }

    // Extract <div class="command-section"> (Might be fragile if nested divs exist, but usually simple)
    const commandSectionRegex = /<div class="command-section">([\s\S]*?)<\/div>/g;
    let commandMatch;
    while ((commandMatch = commandSectionRegex.exec(html)) !== null) {
        sections.push(commandMatch[1]);
    }

    if (sections.length === 0) {
        // Try to find content in <main> or just use body content if simple
        const mainRegex = /<main>([\s\S]*?)<\/main>/;
        const mainMatch = html.match(mainRegex);
        if (mainMatch) {
            sections.push(mainMatch[1]);
        }
    }

    if (sections.length === 0) return null; // Skip if really empty

    sections.forEach(sectionContent => {
        let remaining = sectionContent;

        while (remaining.length > 0) {
            // Find the first occurrence of any of our targets
            const targets = [
                { type: 'subheading', regex: /<h[234]>(.*?)<\/h[234]>/ },
                { type: 'note', regex: /<p class="note">(.*?)<\/p>/ }, // Check specific classes first
                { type: 'paragraph', regex: /<p>(.*?)<\/p>/ },
                { type: 'list', regex: /<(ul|ol)>([\s\S]*?)<\/\1>/ },
                { type: 'code', regex: /<pre>([\s\S]*?)<\/pre>/ },
                // Improved video regex to handle newlines and attributes flexibly
                { type: 'video', regex: /<div class="video-container">[\s\S]*?<iframe[^>]+src="([^"]+)"[\s\S]*?<\/iframe>[\s\S]*?<\/div>/ },
                { type: 'image', regex: /<img[^>]+src="([^"]+)"[^>]*>/ }
            ];

            let bestMatch = null;
            let bestIndex = Infinity;
            let bestType = null;

            targets.forEach(target => {
                const match = remaining.match(target.regex);
                if (match && match.index < bestIndex) {
                    bestIndex = match.index;
                    bestMatch = match;
                    bestType = target.type;
                }
            });

            if (!bestMatch) {
                break; // No more known blocks
            }

            // Add the block
            if (bestType === 'subheading') {
                blocks.push({
                    type: 'subheading',
                    data: { en: cleanText(bestMatch[1]), ar: '' }
                });
            } else if (bestType === 'note') {
                blocks.push({
                    type: 'note',
                    data: { en: cleanText(bestMatch[1]), ar: '' }
                });
            } else if (bestType === 'paragraph') {
                blocks.push({
                    type: 'paragraph',
                    data: { en: cleanText(bestMatch[1]), ar: '' }
                });
            } else if (bestType === 'list') {
                const listContent = bestMatch[2];
                const items = [];
                const liRegex = /<li>([\s\S]*?)<\/li>/g;
                let liMatch;
                while ((liMatch = liRegex.exec(listContent)) !== null) {
                    items.push(cleanText(liMatch[1]));
                }
                if (items.length > 0) {
                    blocks.push({
                        type: 'orderedList', // Default to orderedList for now as it renders nicely
                        data: items
                    });
                }
            } else if (bestType === 'code') {
                const codeContent = bestMatch[1];
                // Check if it has <code> inside
                const innerCodeMatch = codeContent.match(/<code>([\s\S]*?)<\/code>/);
                const rawCode = innerCodeMatch ? innerCodeMatch[1] : codeContent;

                blocks.push({
                    type: 'ciscoTerminal',
                    data: extractCodeText(rawCode)
                });
            } else if (bestType === 'video') {
                blocks.push({
                    type: 'videoEmbed',
                    data: {
                        url: bestMatch[1],
                        caption: 'Video Tutorial'
                    }
                });
            } else if (bestType === 'image') {
                blocks.push({
                    type: 'image',
                    data: {
                        url: bestMatch[1], // This might need path correction if relative
                        caption: 'Image'
                    }
                });
            }

            // Advance
            remaining = remaining.substring(bestIndex + bestMatch[0].length);
        }
    });

    return blocks;
};

async function migrate() {
    console.log('🚀 Starting V1 Content Migration (Refined)...');

    try {
        const searchDataRaw = fs.readFileSync(SEARCH_DATA_FILE, 'utf8');
        const searchData = JSON.parse(searchDataRaw);

        const migratedTopics = [];
        let skippedCount = 0;

        for (const item of searchData) {
            const relativeUrl = item.url;

            // 1. Determine Material Slug (using the folder name from the JSON url)
            const rootFolder = relativeUrl.split('/')[0];
            const materialSlug = MATERIAL_MAPPING[rootFolder];

            if (!materialSlug) {
                // console.warn(`⚠️ No mapping for folder: ${rootFolder}`);
                continue;
            }

            // 2. Resolve File Path (Flat Structure: File is directly in V1_DIR)
            const filename = path.basename(relativeUrl);
            const fullPath = path.join(V1_DIR, filename);

            if (!fs.existsSync(fullPath)) {
                console.warn(`❌ File not found: ${fullPath} (Original URL: ${relativeUrl})`);
                continue;
            }

            const htmlContent = fs.readFileSync(fullPath, 'utf8');
            const contentBlocks = parseHtmlContent(htmlContent);

            if (!contentBlocks || contentBlocks.length === 0) {
                skippedCount++;
                continue;
            }

            migratedTopics.push({
                id: `v1-${item.id}`,
                title: item.title,
                materialSlug: materialSlug,
                content: contentBlocks,
                order: item.id,
                tags: ['v1-migration']
            });
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(migratedTopics, null, 2));
        console.log(`✅ Migration Complete!`);
        console.log(`📄 Processed: ${searchData.length}`);
        console.log(`✨ Migrated: ${migratedTopics.length}`);
        console.log(`⏭️ Skipped (Hubs/Empty): ${skippedCount}`);
        console.log(`💾 Saved to: ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('❌ Migration Failed:', error);
    }
}

migrate();
