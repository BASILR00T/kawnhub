'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { unstable_cache } from 'next/cache';

// Cached function to fetch all topics
const getCachedTopics = unstable_cache(
    async () => {
        try {
            const topicsRef = collection(db, 'topics');
            const snapshot = await getDocs(topicsRef);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching topics for cache:', error);
            return [];
        }
    },
    ['all-topics-search-cache'], // Cache key
    {
        revalidate: 3600, // Revalidate every hour (or adjust as needed)
        tags: ['topics'] // Tag for manual revalidation if needed
    }
);

export async function searchTopics(searchQuery) {
    if (!searchQuery || searchQuery.trim().length < 2) {
        return [];
    }

    const term = searchQuery.toLowerCase().trim();

    try {
        // Use cached topics instead of fetching from Firestore every time
        const topics = await getCachedTopics();

        const results = [];

        for (const data of topics) {
            const title = data.title || '';
            let matchFound = false;
            let snippet = '';
            let blockIndex = -1;

            // 1. Check Title
            if (title.toLowerCase().includes(term)) {
                matchFound = true;
                snippet = 'Topic Title Match';
            }

            // 2. Check Content Blocks
            if (data.content && Array.isArray(data.content)) {
                for (let i = 0; i < data.content.length; i++) {
                    const block = data.content[i];
                    let textToCheck = '';

                    if (typeof block.data === 'string') {
                        textToCheck = block.data;
                    } else if (block.data && typeof block.data === 'object') {
                        // Check English and Arabic
                        textToCheck = (block.data.en || '') + ' ' + (block.data.ar || '');
                        // Also check array data (like orderedList)
                        if (Array.isArray(block.data)) {
                            textToCheck = block.data.map(item => typeof item === 'string' ? item : (item.en + ' ' + item.ar)).join(' ');
                        }
                    }

                    if (textToCheck.toLowerCase().includes(term)) {
                        if (!matchFound) {
                            matchFound = true;
                            blockIndex = i;
                            const index = textToCheck.toLowerCase().indexOf(term);
                            const start = Math.max(0, index - 30);
                            const end = Math.min(textToCheck.length, index + 70);
                            snippet = (start > 0 ? '...' : '') + textToCheck.substring(start, end) + (end < textToCheck.length ? '...' : '');
                        } else if (blockIndex === -1) {
                            blockIndex = i;
                        }
                        break;
                    }
                }
            }

            if (matchFound) {
                results.push({
                    id: data.id,
                    title: data.title,
                    materialSlug: data.materialSlug,
                    type: 'topic',
                    snippet: snippet,
                    blockIndex: blockIndex
                });
            }
        }

        // Limit results
        return results.slice(0, 15);
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}
