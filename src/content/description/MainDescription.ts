/* 
* Copyright (C) 2025-present YouGo (https://github.com/youg-o)
* This program is licensed under the GNU Affero General Public License v3.0.
* You may redistribute it and/or modify it under the terms of the license.
* 
 * Attribution must be given to the original author.
 * This program is distributed without any warranty; see the license for details.
*/

import { descriptionLog, descriptionErrorLog } from '../../utils/logger';
import { waitForElement } from '../../utils/dom';
import { normalizeText } from '../../utils/text';
import { calculateSimilarity } from '../../utils/text';
import { extractVideoIdFromUrl } from '../../utils/video';
import { isMobileSite } from '../../utils/navigation';
import { descriptionCache } from './index';


export async function fetchOriginalDescription(): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
        const handleDescription = (event: CustomEvent) => {
            window.removeEventListener('ynt-description-data', handleDescription as EventListener);
            resolve(event.detail?.description || null);
        };
        window.addEventListener('ynt-description-data', handleDescription as EventListener);
        const script = document.createElement('script');
        script.src = browser.runtime.getURL('dist/content/scripts/MainDescriptionScript.js');
        document.documentElement.appendChild(script);
    });
}


/**
 * Returns the current description text, excluding YouTube suggestion links.
 * Only includes text nodes not inside a suggestion link.
 */
function getCurrentDescriptionText(element: HTMLElement): string {
    
    let container: Element | null = null;
    
    if (isMobileSite()) {
        // Mobile: find the collapsed-string div
        container = element.querySelector('#collapsed-string');
    } else {
        // Desktop: existing selectors
        const snippet = element.querySelector('#attributed-snippet-text');
        const core = element.querySelector('.yt-core-attributed-string--white-space-pre-wrap');
        container = snippet || core;
    }
    
    if (!container) return "";

    function extractText(node: Node): string {
        // If this node is a suggestion link, ignore it
        if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as Element).matches('a.yt-core-attributed-string__link')
        ) {
            return "";
        }
        // If it's a text node, return its content
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || "";
        }
        // Otherwise, recurse into children
        let text = "";
        node.childNodes.forEach(child => {
            text += extractText(child);
        });
        return text;
    }

    return extractText(container).trim();
}


function isDescriptionOriginal(cached: string, current: string): boolean {
    return normalizeText(cached, true).startsWith(normalizeText(current, true));
}


export async function refreshDescription(id: string): Promise<void> {
    const isMobile = isMobileSite();
    const descriptionSelector = isMobile 
        ? 'ytm-expandable-video-description-body-renderer' 
        : '#description-inline-expander';
    
    //descriptionLog(`Waiting for description element (${isMobile ? 'mobile' : 'desktop'})`);
    try {
        await waitForElement(descriptionSelector);
        
        // Check if video ID has changed after waiting
        const currentVideoId = extractVideoIdFromUrl(window.location.href);
        if (currentVideoId !== id) {
            descriptionLog(`Aborting refreshDescription: video changed from ${id} to ${currentVideoId}`);
            return;
        }
        
        // First check if we already have the description in cache
        let description: string | null = descriptionCache.getDescription(id) || null;

        // Only fetch if not in cache
        if (!description) {
            description = await fetchOriginalDescription();
            
            // Check again after async fetch
            const stillCurrentVideoId = extractVideoIdFromUrl(window.location.href);
            if (stillCurrentVideoId !== id) {
                descriptionLog(`Aborting refreshDescription after fetch: video changed from ${id} to ${stillCurrentVideoId}`);
                return;
            }
            //descriptionLog('Description element found, injecting script');
        } else {
            //descriptionLog('Using cached description');
        }

        if (description) {
            const descriptionElement = document.querySelector(descriptionSelector);
            if (descriptionElement) {
                // Always update the element, whether it's in cache or not
                updateDescriptionElement(descriptionElement as HTMLElement, description, id);
                descriptionLog('Description updated to original');
            }
        }
    } catch (error) {
        descriptionLog(`${error}`);
    }
}


/**
 * Insert the processed description span into a given container.
 * Removes all previous children before appending the new content.
 */
function insertDescriptionSpan(container: Element | null, span: HTMLElement): void {
    if (!container) return;
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    container.appendChild(span.cloneNode(true));
}


/**
 * Parses a text and returns a DocumentFragment with clickable timestamp links.
 * Non-timestamp parts are returned as plain text nodes.
 */
function createTimestampFragment(text: string): DocumentFragment {
    const timestampPattern = /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/g;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let match;

    timestampPattern.lastIndex = 0;
    while ((match = timestampPattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
        }
        const timestamp = match[0];
        let seconds = 0;
        if (match[3]) {
            seconds = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]);
        } else {
            seconds = parseInt(match[1]) * 60 + parseInt(match[2]);
        }
        const outerSpan = document.createElement('span');
        outerSpan.className = 'yt-core-attributed-string--link-inherit-color';
        outerSpan.dir = 'auto';
        outerSpan.style.color = 'rgb(62, 166, 255)';
        const timestampLink = document.createElement('a');
        timestampLink.textContent = timestamp;
        timestampLink.className = 'yt-core-attributed-string__link yt-core-attributed-string__link--call-to-action-color';
        timestampLink.style.cursor = 'pointer';
        timestampLink.tabIndex = 0;
        timestampLink.setAttribute('ynt-timestamp', seconds.toString());
        outerSpan.appendChild(timestampLink);
        fragment.appendChild(outerSpan);
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }
    return fragment;
}

/**
 * Creates an anchor element for a given URL with YouTube description styling.
 * @param url - The URL to link to.
 * @returns HTMLAnchorElement
 */
function createUrlLink(url: string): HTMLAnchorElement {
    const link = document.createElement('a');
    link.href = url;
    link.textContent = url;
    link.className = 'yt-core-attributed-string__link yt-core-attributed-string__link--call-to-action-color';
    link.setAttribute('target', '_blank');
    link.style.color = 'rgb(62, 166, 255)';
    return link;
}


export function updateDescriptionElement(element: HTMLElement, description: string, id: string): void {
    // Check if video ID has changed before applying description
    const currentVideoId = extractVideoIdFromUrl(window.location.href);
    if (currentVideoId !== id) {
        descriptionLog(`Aborting description update: video changed from ${id} to ${currentVideoId}`);
        return;
    }
        
    if (isMobileSite()) {
        // Mobile: single container in #collapsed-string
        const collapsedString = element.querySelector('#collapsed-string');
        
        if (!collapsedString) {
            descriptionErrorLog('No mobile description container found (#collapsed-string)');
            return;
        }
        
        // Create the parent span with YouTube's structure
        const parentSpan = document.createElement('span');
        parentSpan.className = 'yt-core-attributed-string yt-core-attributed-string--white-space-pre-wrap';
        parentSpan.dir = 'auto';
        
        // Create the inner wrapper span
        const innerSpan = document.createElement('span');
        innerSpan.className = 'yt-core-attributed-string--link-inherit-color';
        innerSpan.dir = 'auto';
        
        // URL regex pattern
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        
        const lines = description.split('\n');
        lines.forEach((line, index) => {
            const parts = line.split(urlPattern);
            parts.forEach((part) => {
                if (part.match(urlPattern)) {
                    innerSpan.appendChild(createUrlLink(part));
                } else if (part) {
                    const fragment = createTimestampFragment(part);
                    innerSpan.appendChild(fragment);
                }
            });
            if (index < lines.length - 1) {
                innerSpan.appendChild(document.createElement('br'));
            }
        });
        
        // Assemble the structure
        parentSpan.appendChild(innerSpan);
        
        // Insert into mobile container
        insertDescriptionSpan(collapsedString, parentSpan);
        
    } else {
        // Desktop: existing logic with two containers
        const attributedString = element.querySelector('yt-attributed-string');
        const snippetAttributedString = element.querySelector('#attributed-snippet-text');
        
        if (!attributedString && !snippetAttributedString) {
            descriptionErrorLog('No desktop description text container found');
            return;
        }

        // Create the parent span with YouTube's exact structure
        const parentSpan = document.createElement('span');
        parentSpan.className = 'yt-core-attributed-string yt-core-attributed-string--white-space-pre-wrap';
        parentSpan.dir = 'auto';
        parentSpan.setAttribute('role', 'text');
        
        // Create the inner wrapper span (YouTube's structure)
        const innerSpan = document.createElement('span');
        innerSpan.className = 'yt-core-attributed-string--link-inherit-color';
        innerSpan.dir = 'auto';
        
        // URL regex pattern
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        
        const lines = description.split('\n');
        lines.forEach((line, index) => {
            const parts = line.split(urlPattern);
            parts.forEach((part) => {
                if (part.match(urlPattern)) {
                    innerSpan.appendChild(createUrlLink(part));
                } else if (part) {
                    const fragment = createTimestampFragment(part);
                    innerSpan.appendChild(fragment);
                }
            });
            if (index < lines.length - 1) {
                innerSpan.appendChild(document.createElement('br'));
            }
        });
        
        // Assemble the structure: parentSpan > innerSpan > content
        parentSpan.appendChild(innerSpan);

        // Use the utility function to insert the span into both containers
        insertDescriptionSpan(attributedString, parentSpan);
        insertDescriptionSpan(snippetAttributedString, parentSpan);
    }

    setupDescriptionContentObserver(id);
}


// Compare description text and determine if update is needed
export function compareDescription(element: HTMLElement, id: string): Promise<{ isOriginal: boolean; description: string | null }> {
    return new Promise(async (resolve) => {
        // Check if video ID is still current before starting
        const currentVideoId = extractVideoIdFromUrl(window.location.href);
        if (currentVideoId !== id) {
            descriptionLog(`Aborting compareDescription: video changed from ${id} to ${currentVideoId}`);
            resolve({ isOriginal: false, description: null });
            return;
        }
        
        // Get the cached description or fetch a new one
        let description: string | null = descriptionCache.getDescription(id) || null;
        
        if (!description) {
            // Fetch description if not cached
            description = await fetchOriginalDescription();
            
            // CRITICAL: Check again after async fetch to prevent cache pollution
            const stillCurrentVideoId = extractVideoIdFromUrl(window.location.href);
            if (stillCurrentVideoId !== id) {
                descriptionLog(`Aborting compareDescription after fetch: video changed from ${id} to ${stillCurrentVideoId}`);
                resolve({ isOriginal: false, description: null });
                return;
            }
        }
        
        // If no description available, we need to update (return false)
        if (!description) {
            resolve({ isOriginal: false, description: null });
            return;
        }
        
        const currentText = getCurrentDescriptionText(element);
        if (!currentText) {
            resolve({ isOriginal: false, description });
            return;
        }
                
        // Check if description is already in original language (using prefix matching)
        const isOriginal = isDescriptionOriginal(description, currentText);

        if (isOriginal) {
            descriptionLog('Description is already in original language, no update needed');
            // Don't cache if already original - save memory
        } else {
            // Only cache when description is translated
            // At this point we're certain 'description' corresponds to 'id' thanks to checks above
            descriptionCache.setDescription(id, description);
        }
        
        // Return both isOriginal flag and the description itself
        resolve({ isOriginal, description });
    });
}


// DESCRIPTION OBSERVERS ------------------------------------------------------------
let descriptionExpansionObserver: MutationObserver | null = null;
let descriptionContentObserver: MutationObserver | null = null;


// Helper function to process description for current video ID
export async function processDescriptionForVideoId(id: string): Promise<string | null> {
    const descriptionSelector = isMobileSite() 
        ? 'ytm-expandable-video-description-body-renderer' 
        : '#description-inline-expander';
    
    const descriptionElement = document.querySelector(descriptionSelector);
    
    if (descriptionElement) {
        return waitForElement('#movie_player').then(() => {
            // Check if video ID is still current after waiting
            const currentVideoId = extractVideoIdFromUrl(window.location.href);
            if (currentVideoId !== id) {
                descriptionLog(`Aborting processDescriptionForVideoId: video changed from ${id} to ${currentVideoId}`);
                return null;
            }
            
            return compareDescription(descriptionElement as HTMLElement, id).then(({ isOriginal, description }) => {
                // Check again after compareDescription
                const stillCurrentVideoId = extractVideoIdFromUrl(window.location.href);
                if (stillCurrentVideoId !== id) {
                    descriptionLog(`Aborting after compareDescription: video changed from ${id} to ${stillCurrentVideoId}`);
                    return null;
                }
                
                if (!isOriginal) {
                    // Only refresh if not original
                    return refreshDescription(id).then(() => {
                        // Final check before setting up observers
                        const finalVideoId = extractVideoIdFromUrl(window.location.href);
                        if (finalVideoId !== id) {
                            descriptionLog(`Aborting observer setup: video changed from ${id} to ${finalVideoId}`);
                            return null;
                        }
                        
                        descriptionExpandObserver(id);
                        setupDescriptionContentObserver(id);
                        
                        // Return the description from cache (was just set because not original)
                        return descriptionCache.getDescription(id) ?? null;
                    });
                } else {
                    cleanupDescriptionObservers();
                    return description;
                }
            });
        });
    } else {
        // If not found, wait for it
        return waitForElement(descriptionSelector).then(() => {
            // Check if video ID is still current after waiting
            const currentVideoId = extractVideoIdFromUrl(window.location.href);
            if (currentVideoId !== id) {
                descriptionLog(`Aborting processDescriptionForVideoId (element wait): video changed from ${id} to ${currentVideoId}`);
                return null;
            }
            
            return refreshDescription(id).then(() => {
                // Final check before setting up observers
                const finalVideoId = extractVideoIdFromUrl(window.location.href);
                if (finalVideoId !== id) {
                    descriptionLog(`Aborting observer setup (after wait): video changed from ${id} to ${finalVideoId}`);
                    return null;
                }
                
                descriptionExpandObserver(id);
                setupDescriptionContentObserver(id);
                
                // Return the description from cache (was just set)
                return descriptionCache.getDescription(id) ?? null;
            });
        });
    }
}


function descriptionExpandObserver(id: string): void {
    
    if (isMobileSite()) {
        // Mobile: observe collapsible-string for expand/collapse
        const descriptionSelector = 'ytm-expandable-video-description-body-renderer';
        
        waitForElement(descriptionSelector).then((descriptionElement) => {
            const collapsibleString = descriptionElement.querySelector('collapsible-string');
            
            if (!collapsibleString) {
                descriptionLog('Mobile collapsible-string not found');
                return;
            }
            
            //descriptionLog('Setting up mobile expand/collapse observer');
            descriptionExpansionObserver = new MutationObserver(async (mutations) => {
                for (const mutation of mutations) {
                    // On mobile, YouTube toggles classes on collapsible-string when expanding
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'class' || mutation.attributeName === 'aria-expanded')) {
                        descriptionLog('Mobile description expanded/collapsed');
                        const cachedDescription = descriptionCache.getDescription(id);
                        if (cachedDescription) {
                            //descriptionLog('Using cached description');
                            updateDescriptionElement(descriptionElement as HTMLElement, cachedDescription, id);
                        } else {
                            const description = await fetchOriginalDescription();
                            if (description) {
                                updateDescriptionElement(descriptionElement as HTMLElement, description, id);
                            }
                        }
                    }
                }
            });

            descriptionExpansionObserver.observe(collapsibleString, {
                attributes: true,
                attributeFilter: ['class', 'aria-expanded']
            });
        });
        
    } else {
        // Desktop: existing logic
        waitForElement('#description-inline-expander').then((descriptionElement) => {
            //descriptionLog('Setting up desktop expand/collapse observer');
            descriptionExpansionObserver = new MutationObserver(async (mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'is-expanded') {
                        descriptionLog('Desktop description expanded/collapsed');
                        const cachedDescription = descriptionCache.getDescription(id);
                        if (cachedDescription) {
                            //descriptionLog('Using cached description');
                            updateDescriptionElement(descriptionElement as HTMLElement, cachedDescription, id);
                        } else {
                            const description = await fetchOriginalDescription();
                            if (description) {
                                updateDescriptionElement(descriptionElement as HTMLElement, description, id);
                            }
                        }
                    }
                }
            });

            descriptionExpansionObserver.observe(descriptionElement, {
                attributes: true,
                attributeFilter: ['is-expanded']
            });
        });
    }
}

export function setupDescriptionContentObserver(id: string) {
    // Cleanup existing observer avoiding infinite loops
    cleanupDescriptionContentObserver();
    
    const descriptionSelector = isMobileSite() 
        ? 'ytm-expandable-video-description-body-renderer' 
        : '#description-inline-expander';
    
    const descriptionElement = document.querySelector(descriptionSelector);
    if (!descriptionElement) {
        descriptionLog('Description element not found, skipping content observer setup');
        return;
    }
    
    // Get cached description
    let cachedDescription = descriptionCache.getDescription(id);
    if (!cachedDescription) {
        descriptionLog('No cached description available, fetching from API');
        
        // Fetch description instead of returning
        fetchOriginalDescription().then(description => {
            if (description) {
                cachedDescription = description;
                
                // Now set up the observer with the fetched description
                setupObserver();
            }
        });
        return; // Still need to return here since we're doing async work
    }
    
    // If we have a cached description, set up the observer
    setupObserver();
    
    // Debounce timer
    let debounceTimer: number | null = null;
    
    // Local function to avoid duplicating the observer setup code
    function setupObserver() {
        //descriptionLog('Setting up description content observer');
        
        descriptionContentObserver = new MutationObserver((mutations) => {
            // Skip if we don't have a cached description to compare with
            if (!cachedDescription) {
                descriptionLog('No cached description available, skipping content observer setup');
                return;
            }
            
            // Clear previous debounce timer
            if (debounceTimer !== null) {
                clearTimeout(debounceTimer);
            }
            
            // Debounce: wait for mutations to settle before processing
            debounceTimer = window.setTimeout(() => {
                debounceTimer = null;
                
                // Make sure descriptionElement still exists in this closure
                if (!descriptionElement) return;
                
                const currentText = getCurrentDescriptionText(descriptionElement as HTMLElement);
                if (!currentText) return;
                
                // Compare similarity instead of exact match
                const similarity = calculateSimilarity(normalizeText(currentText, true), normalizeText(cachedDescription, true));
                
                // Consider texts similar if they match at least 75%
                const isOriginal = similarity >= 0.75;
                if (isOriginal) return;
                
                //descriptionLog(`currentText: ${normalizeText(currentText, true)}`);
                //descriptionLog(`cachedDescription: ${normalizeText(cachedDescription, true)}`);
                //descriptionLog(`Similarity: ${(similarity * 100).toFixed(1)}%`);
                
                descriptionLog('Description content changed by YouTube, restoring original');
                
                // Temporarily disconnect to prevent infinite loop
                descriptionContentObserver?.disconnect();
                
                // Update with original description - ensure cachedDescription isn't null
                updateDescriptionElement(descriptionElement as HTMLElement, cachedDescription as string, id);
                
                // Reconnect observer
                if (descriptionContentObserver) {
                    descriptionContentObserver.observe(descriptionElement, {
                        childList: true,
                        subtree: true,
                        characterData: true
                    });
                }
            }, 1); // 1ms debounce
        });
        
        // Start observing - ensure descriptionElement isn't null
        if (descriptionContentObserver && descriptionElement) {
            descriptionContentObserver.observe(descriptionElement, {
                childList: true,
                subtree: true,
                characterData: true
            });
        }
        
        //descriptionLog('Description content observer setup completed');
    }
}

function cleanupDescriptionContentObserver(): void{
    descriptionContentObserver?.disconnect();
    descriptionContentObserver = null;
}

export function cleanupDescriptionObservers(): void {
    descriptionExpansionObserver?.disconnect();
    descriptionExpansionObserver = null;

    cleanupDescriptionContentObserver();
}