/* 
 * Copyright (C) 2025-present YouGo (https://github.com/youg-o)
 * This program is licensed under the GNU Affero General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the license.
 * 
 * Attribution must be given to the original author.
 * This program is distributed without any warranty; see the license for details.
 */

import { browsingThumbnailsErrorLog, browsingThumbnailsLog } from '../../utils/logger';
import { isMobileSite } from '../../utils/navigation';

// Store observers for lazy-loaded thumbnails
const thumbnailObservers = new Map<HTMLImageElement, MutationObserver>();

/**
 * Removes the translation markers from a thumbnail URL
 * @param thumbnailUrl - The translated thumbnail URL
 * @returns The original thumbnail URL
 */
function removeTranslationMarkers(thumbnailUrl: string): string {
    // Replace 'vi_lc' with 'vi' and remove language code pattern
    let originalUrl = thumbnailUrl.replace('vi_lc', 'vi');
    
    // Remove language code pattern (e.g., _fr, _es, _de, _zh-Hant, _pt-BR, etc.)
    // Pattern matches underscore followed by letters, dashes, or both, before file extension
    originalUrl = originalUrl.replace(/_[a-zA-Z-]+(?=\.jpg)/, '');
    
    return originalUrl;
}

/**
 * Checks if a thumbnail URL is translated
 * @param thumbnailUrl - The thumbnail URL to check
 * @returns true if the thumbnail appears to be translated
 */ 
function isThumbnailTranslated(thumbnailUrl: string): boolean {
    return thumbnailUrl.includes('vi_lc') && /_[a-z]{2,3}\.jpg/i.test(thumbnailUrl);
}

/**
 * Checks if a thumbnail src is empty or a placeholder
 * @param src - The thumbnail src to check
 * @returns true if the src is empty or appears to be a placeholder
 */
function isThumbnailPlaceholder(src: string): boolean {
    return !src || 
           src === '' || 
           src.includes('data:image') || 
           src.includes('placeholder');
}

/**
 * Sets up an observer to watch for lazy-loaded thumbnail changes
 * @param thumbnailImg - The thumbnail image element to observe
 * @param videoId - The video ID for logging
 */
function setupThumbnailObserver(thumbnailImg: HTMLImageElement, videoId: string): void {
    // Clean up any existing observer for this element
    const existingObserver = thumbnailObservers.get(thumbnailImg);
    if (existingObserver) {
        existingObserver.disconnect();
        thumbnailObservers.delete(thumbnailImg);
    }

    // Mark as observed to avoid re-processing
    thumbnailImg.setAttribute('ynt-thumbnail', 'observed');

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Watch for src attribute changes (lazy loading)
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                const currentSrc = thumbnailImg.src;
                
                // Only process if YouTube loaded a real image (not placeholder)
                if (!isThumbnailPlaceholder(currentSrc)) {
                    // Check if the loaded image is translated
                    if (isThumbnailTranslated(currentSrc)) {
                        const restoredUrl = removeTranslationMarkers(currentSrc);
                        thumbnailImg.src = restoredUrl;
                        
                        browsingThumbnailsLog(
                            `Restored lazy-loaded thumbnail for video %c${videoId}%c`,
                            'color: #4ade80',
                            'color: #fca5a5'
                        );
                    }
                    
                    // Disconnect observer after processing the loaded image
                    observer.disconnect();
                    thumbnailObservers.delete(thumbnailImg);
                }
            }
        });
    });

    observer.observe(thumbnailImg, {
        attributes: true,
        attributeFilter: ['src']
    });

    thumbnailObservers.set(thumbnailImg, observer);
}

/**
 * Restores original thumbnail for a video by removing translation markers
 * @param videoId - The YouTube video ID
 * @param titleElement - The title element to find the associated thumbnail
 */
export function restoreOriginalThumbnail(videoId: string, titleElement: HTMLElement): void {
    try {
        const isMobile = isMobileSite();
        
        // Find the closest parent that contains both the title and thumbnail
        const parentSelectors = isMobile
            ? 'ytm-video-with-context-renderer, ytm-video-card-renderer, ytm-compact-video-renderer'
            : 'ytd-rich-grid-media, ytd-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer, ytd-grid-video-renderer, .yt-lockup-view-model';
        
        const commonParent = titleElement.closest(parentSelectors);
        
        if (!commonParent) {
            return;
        }

        // Find thumbnail image - accept both loaded and unloaded thumbnails
        const thumbnailImg = commonParent.querySelector('img.ytCoreImageHost') as HTMLImageElement;
        
        if (!thumbnailImg) {
            return; // Silently skip if thumbnail not found
        }

        // Skip if already being observed
        if (thumbnailImg.hasAttribute('ynt-thumbnail')) {
            return;
        }

        const currentSrc = thumbnailImg.src;

        // Case 1: Thumbnail is lazy-loaded (empty or placeholder)
        // Let YouTube load it naturally, but observe for when it does
        if (isThumbnailPlaceholder(currentSrc)) {
            setupThumbnailObserver(thumbnailImg, videoId);
            return;
        }

        // Case 2: Thumbnail is already loaded and translated
        if (isThumbnailTranslated(currentSrc)) {
            const originalUrl = removeTranslationMarkers(currentSrc);
            thumbnailImg.src = originalUrl;
            
            // Mark as processed
            thumbnailImg.setAttribute('ynt-thumbnail', 'processed');
            
            browsingThumbnailsLog(
                `Updated thumbnail from translated to original for video %c${videoId}%c (${isMobile ? 'mobile' : 'desktop'})`,
                'color: #4ade80',
                'color: #fca5a5'
            );
            return;
        }

        // Case 3: Thumbnail is already loaded and original
        // Mark as processed to avoid re-checking
        thumbnailImg.setAttribute('ynt-thumbnail', 'original');
        
    } catch (error) {
        browsingThumbnailsErrorLog(`Failed to restore original thumbnail for ${videoId}:`, error);
    }
}

/**
 * Cleans up all thumbnail observers
 */
export function cleanupThumbnailObservers(): void {
    thumbnailObservers.forEach((observer) => {
        observer.disconnect();
    });
    thumbnailObservers.clear();
    
    // Remove all ynt-thumbnail attributes
    document.querySelectorAll('img[ynt-thumbnail]').forEach(img => {
        img.removeAttribute('ynt-thumbnail');
    });
    
    browsingThumbnailsLog('Thumbnail observers cleaned up');
}