/* 
 * Copyright (C) 2025-present YouGo (https://github.com/youg-o)
 * This program is licensed under the GNU Affero General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the license.
 * 
 * Attribution must be given to the original author.
 * This program is distributed without any warranty; see the license for details.
 */


// Function to wait for an element to be present in the DOM
export function waitForElement(selector: string, timeout = 7500): Promise<Element> {
    return new Promise((resolve, reject) => {
        const existingElement = document.querySelector(selector);
        if (existingElement) {
            return resolve(existingElement);
        }

        const observationRoot = document.documentElement;
        if (!observationRoot) {
            reject(new Error('Cannot observe DOM while waiting for element: ' + selector));
            return;
        }

        let isResolved = false;

        const observer = new MutationObserver((mutations) => {
            if (isResolved) return;

            const element = document.querySelector(selector);
            if (element) {
                isResolved = true;
                observer.disconnect();
                clearTimeout(timer);
                resolve(element);
            }
        });

        const timer = setTimeout(() => {
            if (!isResolved) {
                isResolved = true;
                observer.disconnect();
                reject(new Error('Timeout waiting for element: ' + selector));
            }
        }, timeout);

        observer.observe(observationRoot, {
            childList: true,
            subtree: true
        });
    });
}


// Waits for all #video-title elements to be present and non-empty before resolving
export function waitForFilledVideoTitles(timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        function check() {
            const titles = Array.from(document.querySelectorAll('#video-title'));
            const allFilled = titles.length > 0 && titles.every(el => el.textContent && el.textContent.trim().length > 0);
            if (allFilled) {
                resolve();
            } else if (Date.now() - start > timeout) {
                // Timeout: resolve anyway to avoid blocking forever
                resolve();
            } else {
                setTimeout(check, 50);
            }
        }
        check();
    });
}