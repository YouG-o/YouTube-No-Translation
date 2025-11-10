/* 
 * Copyright (C) 2025-present YouGo (https://github.com/youg-o)
 * This program is licensed under the GNU Affero General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the license.
 * 
 * Attribution must be given to the original author.
 * This program is distributed without any warranty; see the license for details.
 */

import { coreLog, mainTitleLog, descriptionLog } from '../../utils/logger';
import { extractVideoIdFromUrl } from '../../utils/video';
import { normalizeText } from '../../utils/text';
import { waitForElement } from '../../utils/dom';
import { currentSettings } from '../index';
import { fetchMainTitle } from '../titles/mainTitle';
import { updateDescriptionElement, fetchOriginalDescription } from '../description/MainDescription';
import { descriptionCache } from '../description/index';


let mobilePanelObserver: MutationObserver | null = null;


/**
 * Updates the title inside the mobile panel
 */
async function updateMobilePanelTitle(videoId: string): Promise<void> {
    const titleElement = document.querySelector('panel-container .primary-info .title span.yt-core-attributed-string') as HTMLElement;
    
    if (!titleElement) {
        mainTitleLog('[Mobile Panel] Title element not found');
        return;
    }
    
    const currentTitle = titleElement.textContent;
    const originalTitle = await fetchMainTitle(videoId, false);
    
    if (!originalTitle) {
        mainTitleLog('[Mobile Panel] Failed to get original title');
        return;
    }
    
    // Skip if title is already correct
    if (normalizeText(currentTitle) === normalizeText(originalTitle)) {
        mainTitleLog('[Mobile Panel] Title already correct');
        return;
    }
    
    mainTitleLog(
        `[Mobile Panel] Updated title from: %c${normalizeText(currentTitle)}%c to: %c${normalizeText(originalTitle)}`,
        'color: grey',
        'color: #fcd34d',
        'color: white; background: rgba(0,0,0,0.5); padding:2px 4px; border-radius:3px;'
    );
    
    titleElement.textContent = originalTitle;
}


/**
 * Updates the description inside the mobile panel
 */
async function updateMobilePanelDescription(videoId: string): Promise<void> {
    const descriptionContainer = document.querySelector('panel-container ytm-expandable-video-description-body-renderer') as HTMLElement;
    
    if (!descriptionContainer) {
        descriptionLog('[Mobile Panel] Description container not found');
        return;
    }
    
    // Get cached description
    const description = descriptionCache.getDescription(videoId);
    
    if (description) {
        descriptionLog('[Mobile Panel] Using cached description');
        updateDescriptionElement(descriptionContainer, description, videoId);
    } else {
        descriptionLog('[Mobile Panel] No cached description, fetching...');
        const fetchedDescription = await fetchOriginalDescription();
        if (fetchedDescription) {
            descriptionCache.setDescription(videoId, fetchedDescription);
            updateDescriptionElement(descriptionContainer, fetchedDescription, videoId);
        } else {
            descriptionLog('[Mobile Panel] Failed to fetch description');
        }
    }
}


/**
 * Refreshes both title and description in the mobile panel
 */
async function refreshMobilePanelContent(): Promise<void> {
    const videoId = extractVideoIdFromUrl(window.location.href);
    
    if (!videoId) {
        coreLog('[Mobile Panel] No video ID found');
        return;
    }
    
    coreLog(`[Mobile Panel] Refreshing content for ${videoId}`);
    
    // Update both title and description
    if (currentSettings?.titleTranslation) {
        await updateMobilePanelTitle(videoId);
    }
    
    if (currentSettings?.descriptionTranslation) {
        await updateMobilePanelDescription(videoId);
    }
}


/**
 * Sets up observer for the mobile panel container
 */
export function setupMobilePanelObserver(): void {
    cleanupMobilePanelObserver();
    
    // Wait for panel-container to exist
    waitForElement('ytm-app > panel-container').then((panel) => {
        coreLog('[Mobile Panel] Setting up observer on panel-container');
        
        mobilePanelObserver = new MutationObserver((mutations) => {
            // Check if .primary-info was added (panel opened)
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // Check if .primary-info was added
                    const primaryInfoAdded = Array.from(mutation.addedNodes).some(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as Element;
                            // Check if added node is .primary-info or contains it
                            return element.matches('.primary-info') || element.querySelector('.primary-info');
                        }
                        return false;
                    });
                    
                    if (primaryInfoAdded) {
                        coreLog('[Mobile Panel] Panel opened (primary-info detected), refreshing content');
                        refreshMobilePanelContent();
                        return; // Stop after first detection
                    }
                    
                    // Optional: detect panel close
                    const primaryInfoRemoved = Array.from(mutation.removedNodes).some(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as Element;
                            return element.matches('.primary-info') || element.querySelector('.primary-info');
                        }
                        return false;
                    });
                    
                    if (primaryInfoRemoved) {
                        coreLog('[Mobile Panel] Panel closed (primary-info removed)');
                    }
                }
            }
        });
        
        // Observe only childList (detect when content is added/removed)
        mobilePanelObserver.observe(panel, {
            childList: true,
            subtree: true // Important: detect .primary-info even if nested
        });
        
        // Check if panel is already open (initial state)
        const existingPrimaryInfo = panel.querySelector('.primary-info');
        if (existingPrimaryInfo) {
            coreLog('[Mobile Panel] Panel already open on setup, refreshing content');
            refreshMobilePanelContent();
        }
        
    }).catch(() => {
        coreLog('[Mobile Panel] panel-container not found (desktop or not available)');
    });
}


/**
 * Cleans up the mobile panel observer
 */
export function cleanupMobilePanelObserver(): void {
    if (mobilePanelObserver) {
        mobilePanelObserver.disconnect();
        mobilePanelObserver = null;
        coreLog('[Mobile Panel] Observer cleaned up');
    }
}