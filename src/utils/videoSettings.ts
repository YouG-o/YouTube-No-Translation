/* 
 * Copyright (C) 2025-present YouGo (https://github.com/youg-o)
 * This program is licensed under the GNU Affero General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the license.
 * 
 * Attribution must be given to the original author.
 * This program is distributed without any warranty; see the license for details.
 */

import { currentSettings } from "../content/index";

import { handleAudioTranslation } from "../content/audio/audioIndex";
import { refreshEmbedTitle } from "../content/titles/mainTitle";
import { handleSubtitlesTranslation } from "../content/subtitles/subtitlesIndex";


function applyAudioTrack(): void {
    currentSettings?.audioTranslation.enabled && handleAudioTranslation();
}

function applySubtitleTrack(): void {
    currentSettings?.subtitlesTranslation.enabled && handleSubtitlesTranslation();
}

function applyEmbedTitle(): void {
    currentSettings?.titleTranslation && refreshEmbedTitle();
}

function applyVideoPlayerSettings(): void {
    applySubtitleTrack();
    applyEmbedTitle();
}


export { applyAudioTrack, applyVideoPlayerSettings };