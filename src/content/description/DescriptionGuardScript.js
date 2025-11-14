/* 
 * Copyright (C) 2025-present YouGo (https://github.com/youg-o)
 * This program is licensed under the GNU Affero General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the license.
 * 
 * Attribution must be given to the original author.
 * This program is distributed without any warranty; see the license for details.
 */

/**
 * DESCRIPTION GUARD SCRIPT (PAGE CONTEXT)
 *
 * IMPORTANT:
 * - This script is injected into the page context (not the extension content script context).
 * - We do this because YouTube's own JavaScript runs in the page context and uses
 *   the real window / Node prototypes there.
 * - Content scripts run in an isolated world and do NOT share the same Node.prototype,
 *   so overriding Node.prototype.removeChild from a content script would NOT affect YouTube.
 *
 * GOAL:
 * - Prevent YouTube from restoring its own translated description on hover.
 * - We do NOT try to "restore" our content here. That is handled by the extension logic.
 * - We only block YouTube from removing children inside the main description container.
 *
 * STRATEGY:
 * - The content script injects this file with a "mode" attribute:
 *     - data-ynt-description-guard-mode="enable"  => install the guard
 *     - data-ynt-description-guard-mode="disable" => remove the guard and restore original behavior
 * - We store the original Node.prototype.removeChild on window.__YNT_ORIGINAL_REMOVE_CHILD
 *   so we can restore it later.
 * - The guard itself:
 *   - Finds the main description element: #description-inline-expander
 *   - Overrides Node.prototype.removeChild in the page context.
 *   - When removeChild is called and "this" is inside the description element,
 *     we block the operation and simply return the child without removing it.
 */

(() => {
    const LOG_PREFIX = '[YNT][DescriptionGuard]';
    const LOG_COLOR = '#FF9800'; // Orange

    function guardLog(message, ...args) {
        // Keep logging very light to avoid spam
        console.log(`%c${LOG_PREFIX} ${message}`, `color: ${LOG_COLOR}`, ...args);
    }

    // Determine mode from the script tag that loaded this file
    const currentScript = document.currentScript;
    const mode = currentScript?.getAttribute('data-ynt-description-guard-mode') || 'enable';

    // Use a well-known property on window to store the original removeChild
    const ORIGINAL_KEY = '__YNT_ORIGINAL_REMOVE_CHILD__';

    if (mode === 'disable') {
        // Restore original removeChild if we have it
        const originalRemoveChild = window[ORIGINAL_KEY];
        if (typeof originalRemoveChild === 'function') {
            Node.prototype.removeChild = originalRemoveChild;
            guardLog('removeChild guard disabled, original behavior restored');
            // Optional: clear the stored reference
            // window[ORIGINAL_KEY] = undefined;
        } else {
            guardLog('No original removeChild stored, nothing to restore');
        }
        return;
    }

    // mode === 'enable' (default)

    // If we already installed the guard previously, do not re-install
    if (window[ORIGINAL_KEY]) {
        guardLog('removeChild guard already installed, skipping re-install');
        return;
    }

    const descriptionElement = document.querySelector('#description-inline-expander');
    if (!descriptionElement) {
        guardLog('Description element not found, guard not applied');
        return;
    }

    guardLog('Description element found, applying removeChild guard');

    // Store original removeChild globally so we can restore it later
    window[ORIGINAL_KEY] = Node.prototype.removeChild;

    // Track how many times we blocked YouTube
    let blockCount = 0;

    /**
     * Returns true if the given node is inside the protected description element.
     */
    function isInDescriptionElement(node) {
        let current = node;
        while (current) {
            if (current === descriptionElement) return true;
            current = current.parentNode;
        }
        return false;
    }

    // Override removeChild (minimal guard based on working IIFE)
    Node.prototype.removeChild = function (child) {
        if (isInDescriptionElement(this)) {
            blockCount++;
            guardLog(`Blocked removeChild inside description (#${blockCount})`);
            // Do not remove the child, just pretend everything is fine
            return child;
        }
        return window[ORIGINAL_KEY].call(this, child);
    };

    guardLog('removeChild guard installed');
})();