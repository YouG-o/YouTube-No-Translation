/* 
 * Copyright (C) 2025-present YouGo (https://github.com/youg-o)
 * This program is licensed under the GNU Affero General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the license.
 * 
 * Attribution must be given to the original author.
 * This program is distributed without any warranty; see the license for details.
 */

export interface LanguageOption {
    code: string;
    i18nKey: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
    { code: 'en', i18nKey: 'language_en' },
    { code: 'fr', i18nKey: 'language_fr' },
    { code: 'es', i18nKey: 'language_es' },
    { code: 'ar', i18nKey: 'language_ar' },
    { code: 'zh', i18nKey: 'language_zh' },
    { code: 'nl', i18nKey: 'language_nl' },
    { code: 'de', i18nKey: 'language_de' },
    { code: 'he', i18nKey: 'language_he' },
    { code: 'hi', i18nKey: 'language_hi' },
    { code: 'id', i18nKey: 'language_id' },
    { code: 'it', i18nKey: 'language_it' },
    { code: 'ja', i18nKey: 'language_ja' },
    { code: 'ko', i18nKey: 'language_ko' },
    { code: 'pl', i18nKey: 'language_pl' },
    { code: 'pt', i18nKey: 'language_pt' },
    { code: 'ru', i18nKey: 'language_ru' },
    { code: 'th', i18nKey: 'language_th' },
    { code: 'tr', i18nKey: 'language_tr' },
    { code: 'uk', i18nKey: 'language_uk' },
    { code: 'vi', i18nKey: 'language_vi' }
];
