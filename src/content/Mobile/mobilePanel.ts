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
import { getChannelHandle } from '../../utils/utils';
import { currentSettings } from '../index';
import { fetchMainTitle } from '../titles/mainTitle';
import { updateDescriptionElement, fetchOriginalDescription } from '../description/MainDescription';
import { descriptionCache } from '../description/index';
import { getOriginalChannelDescriptionInnerTube, getOriginalChannelDescriptionDataAPI } from '../channel/channelDescription';
import { isYouTubeDataAPIEnabled, getChannelIdFromInnerTube } from '../../utils/utils';


let mobilePanelObserver: MutationObserver | null = null;


/**
 * Updates the title inside the mobile video panel
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
 * Updates the description inside the mobile video panel
 */
async function updateMobilePanelVideoDescription(videoId: string): Promise<void> {
    const descriptionContainer = document.querySelector('panel-container ytm-expandable-video-description-body-renderer') as HTMLElement;
    
    if (!descriptionContainer) {
        descriptionLog('[Mobile Panel] Video description container not found');
        return;
    }
    
    // Get cached description
    const description = descriptionCache.getDescription(videoId);
    
    if (description) {
        descriptionLog('[Mobile Panel] Using cached video description');
        updateDescriptionElement(descriptionContainer, description, videoId);
    } else {
        descriptionLog('[Mobile Panel] No cached video description, fetching...');
        const fetchedDescription = await fetchOriginalDescription();
        if (fetchedDescription) {
            descriptionCache.setDescription(videoId, fetchedDescription);
            updateDescriptionElement(descriptionContainer, fetchedDescription, videoId);
        } else {
            descriptionLog('[Mobile Panel] Failed to fetch video description');
        }
    }
}


/**
 * Updates the full channel description inside the mobile channel panel
 */
async function updateMobilePanelChannelDescription(): Promise<void> {
    const descriptionElement = document.querySelector('panel-container ytm-about-channel-renderer .user-text span.yt-core-attributed-string') as HTMLElement;
    
    if (!descriptionElement) {
        descriptionLog('[Mobile Panel] Channel description element not found');
        return;
    }
    
    const currentDescription = descriptionElement.textContent?.trim() || '';
    
    // Get channel identifier
    let channelId: string | null = null;
    let originalDescriptionData: { id: string; description: string } | null = null;
    const channelHandle = getChannelHandle(window.location.href);
    
    // Try Data API if enabled
    if (isYouTubeDataAPIEnabled(currentSettings)) {
        const apiKey = currentSettings?.youtubeDataApi?.apiKey;
        if (!apiKey) {
            descriptionLog('[Mobile Panel] YouTube Data API key is missing');
            return;
        }
        
        if (channelHandle) {
            originalDescriptionData = await getOriginalChannelDescriptionDataAPI({ handle: channelHandle });
            if (!originalDescriptionData) {
                channelId = await getChannelIdFromInnerTube(channelHandle);
                if (channelId) {
                    originalDescriptionData = await getOriginalChannelDescriptionDataAPI({ id: channelId });
                }
            }
        }
    }
    
    let originalDescription: string | null = null;
    
    // Use Data API result if available, otherwise use InnerTube
    if (originalDescriptionData?.description) {
        originalDescription = originalDescriptionData.description;
    } else {
        if (!channelId && channelHandle) {
            channelId = await getChannelIdFromInnerTube(channelHandle);
        }
        if (!channelId) {
            descriptionLog('[Mobile Panel] Channel ID could not be retrieved');
            return;
        }
        originalDescription = await getOriginalChannelDescriptionInnerTube(channelId);
        if (!originalDescription) {
            descriptionLog('[Mobile Panel] Failed to fetch channel description from InnerTube');
            return;
        }
    }
    
    // Skip if already original (prefix matching)
    if (normalizeText(originalDescription).startsWith(normalizeText(currentDescription))) {
        descriptionLog('[Mobile Panel] Channel description already original');
        return;
    }
    
    descriptionLog('[Mobile Panel] Updating channel description');
    descriptionElement.textContent = originalDescription;
}


/**
 * Refreshes content in the mobile video panel (title + description)
 */
async function refreshMobileVideoPanelContent(): Promise<void> {
    const videoId = extractVideoIdFromUrl(window.location.href);
    
    if (!videoId) {
        coreLog('[Mobile Panel] No video ID found');
        return;
    }
    
    coreLog(`[Mobile Panel] Refreshing video panel content for ${videoId}`);
    
    // Update both title and description
    if (currentSettings?.titleTranslation) {
        await updateMobilePanelTitle(videoId);
    }
    
    if (currentSettings?.descriptionTranslation) {
        await updateMobilePanelVideoDescription(videoId);
    }
}


/**
 * Refreshes content in the mobile channel panel (full description)
 */
async function refreshMobileChannelPanelContent(): Promise<void> {
    coreLog('[Mobile Panel] Refreshing channel panel content');
    
    if (currentSettings?.descriptionTranslation) {
        await updateMobilePanelChannelDescription();
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
            // Check what type of content was added
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // Check for video panel (primary-info)
                    const primaryInfoAdded = Array.from(mutation.addedNodes).some(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as Element;
                            return element.matches('.primary-info') || element.querySelector('.primary-info');
                        }
                        return false;
                    });
                    
                    if (primaryInfoAdded) {
                        coreLog('[Mobile Panel] Video panel opened (primary-info detected)');
                        refreshMobileVideoPanelContent();
                        return;
                    }
                    
                    // Check for channel panel (ytm-about-channel-renderer)
                    const aboutChannelAdded = Array.from(mutation.addedNodes).some(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as Element;
                            return element.matches('ytm-about-channel-renderer') || element.querySelector('ytm-about-channel-renderer');
                        }
                        return false;
                    });
                    
                    if (aboutChannelAdded) {
                        coreLog('[Mobile Panel] Channel panel opened (ytm-about-channel-renderer detected)');
                        refreshMobileChannelPanelContent();
                        return;
                    }
                    
                    // Optional: detect panel close
                    const panelClosed = Array.from(mutation.removedNodes).some(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as Element;
                            return element.matches('.primary-info') || 
                                   element.querySelector('.primary-info') ||
                                   element.matches('ytm-about-channel-renderer') ||
                                   element.querySelector('ytm-about-channel-renderer');
                        }
                        return false;
                    });
                    
                    if (panelClosed) {
                        coreLog('[Mobile Panel] Panel closed');
                    }
                }
            }
        });
        
        // Observe only childList (detect when content is added/removed)
        mobilePanelObserver.observe(panel, {
            childList: true,
            subtree: true
        });
        
        // Check initial state
        const existingPrimaryInfo = panel.querySelector('.primary-info');
        if (existingPrimaryInfo) {
            coreLog('[Mobile Panel] Video panel already open on setup');
            refreshMobileVideoPanelContent();
        }
        
        const existingAboutChannel = panel.querySelector('ytm-about-channel-renderer');
        if (existingAboutChannel) {
            coreLog('[Mobile Panel] Channel panel already open on setup');
            refreshMobileChannelPanelContent();
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