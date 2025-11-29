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

// Material Mapping (Folder based)
const FOLDER_MAPPING = {
    'Network2': 'networks-1',
    'NOSs': 'os-1',
    'Programming': 'programming-1',
    'PCCT': 'maintenance',
    'Network1': 'networks-intro'
};

// Keyword Mapping (Filename based for new files)
const KEYWORD_MAPPING = [
    { keyword: 'Hardware', slug: 'maintenance' },
    { keyword: 'PCCT', slug: 'maintenance' },
    { keyword: 'NOS', slug: 'os-1' },
    { keyword: 'Linux', slug: 'os-1' },
    { keyword: 'Network1', slug: 'networks-intro' },
    { keyword: 'Network2', slug: 'networks-1' },
    { keyword: 'Switch', slug: 'networks-1' },
    { keyword: 'Routing', slug: 'networks-1' },
    { keyword: 'VLAN', slug: 'networks-1' },
    { keyword: 'DHCP', slug: 'networks-1' },
    { keyword: 'Web', slug: 'programming-1' },
    { keyword: 'Programming', slug: 'programming-1' },
    { keyword: 'Python', slug: 'programming-1' }
];

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
    console.log('🚀 Starting V1 Content Migration (Auto-Discovery)...');

    try {
        const searchDataRaw = fs.readFileSync(SEARCH_DATA_FILE, 'utf8');
        const searchData = JSON.parse(searchDataRaw);

        // Create a map of filename -> searchData entry
        const searchDataMap = {};
        searchData.forEach(item => {
            const filename = path.basename(item.url);
            searchDataMap[filename] = item;
        });

        const migratedTopics = [];
        let skippedCount = 0;

        // Get all HTML files in directory
        const files = fs.readdirSync(V1_DIR).filter(f => f.endsWith('.html'));

        for (const filename of files) {
            const fullPath = path.join(V1_DIR, filename);
            const htmlContent = fs.readFileSync(fullPath, 'utf8');

            let topicData = {};

            // 1. Check if in search_data.json
            if (searchDataMap[filename]) {
                const item = searchDataMap[filename];
                topicData = {
                    id: `v1-${item.id}`,
                    title: item.title,
                    materialSlug: null, // Will resolve below
                    folder: item.url.split('/')[0]
                };
            } else {
                // 2. New File - Generate Metadata
                console.log(`🆕 Found new file: ${filename}`);
                const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i) || htmlContent.match(/<h1>(.*?)<\/h1>/i);
                const title = titleMatch ? cleanText(titleMatch[1]) : filename.replace('.html', '').replace(/_/g, ' ');

                topicData = {
                    id: `v1-new-${filename.replace('.html', '')}`,
                    title: title,
                    materialSlug: null,
                    folder: null
                };
            }

            // 3. Resolve Material Slug
            if (topicData.folder && FOLDER_MAPPING[topicData.folder]) {
                topicData.materialSlug = FOLDER_MAPPING[topicData.folder];
            } else {
                // Try keyword matching
                const match = KEYWORD_MAPPING.find(m => filename.toLowerCase().includes(m.keyword.toLowerCase()));
                if (match) {
                    topicData.materialSlug = match.slug;
                } else {
                    topicData.materialSlug = 'uncategorized';
                    console.warn(`⚠️ Could not categorize: ${filename} -> Defaulting to 'uncategorized'`);
                }
            }

            // 4. Parse Content
            const contentBlocks = parseHtmlContent(htmlContent);

            if (!contentBlocks || contentBlocks.length === 0) {
                skippedCount++;
                continue;
            }

            migratedTopics.push({
                ...topicData,
                content: contentBlocks,
                order: topicData.id, // Simple ordering
                tags: ['v1-migration']
            });
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(migratedTopics, null, 2));
        console.log(`✅ Migration Complete!`);
        console.log(`📂 Total Files Scanned: ${files.length}`);
        console.log(`✨ Migrated: ${migratedTopics.length}`);
        console.log(`⏭️ Skipped (Empty): ${skippedCount}`);
        console.log(`💾 Saved to: ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('❌ Migration Failed:', error);
    }
}

migrate();
