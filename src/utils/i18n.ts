/* 
 * Copyright (C) 2025-present YouGo (https://github.com/youg-o)
 * This program is licensed under the GNU Affero General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the license.
 * 
 * Attribution must be given to the original author.
 * This program is distributed without any warranty; see the license for details.
 */

/**
 * Get localized message from browser.i18n
 * @param key - Message key from messages.json
 * @param substitutions - Optional substitutions for placeholders
 * @returns Localized message string
 */
export function getMessage(key: string, substitutions?: string | string[]): string {
    return browser.i18n.getMessage(key, substitutions) || key;
}

/**
 * Localize all text content and attributes in the document
 */
export function localizeDocument(): void {
    // Localize text content with data-i18n
    document.querySelectorAll('[data-i18n]').forEach((element) => {
        const key = element.getAttribute('data-i18n');
        if (key) {
            element.textContent = getMessage(key);
        }
    });
    
    // Localize placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (key && element instanceof HTMLInputElement) {
            element.placeholder = getMessage(key);
        }
    });
    
    // Localize titles
    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
        const key = element.getAttribute('data-i18n-title');
        if (key && element instanceof HTMLElement) {
            element.title = getMessage(key);
        }
    });

    // Localize option text
    document.querySelectorAll('option[data-i18n]').forEach((element) => {
        const key = element.getAttribute('data-i18n');
        if (key && element instanceof HTMLOptionElement) {
            element.textContent = getMessage(key);
        }
    });
}