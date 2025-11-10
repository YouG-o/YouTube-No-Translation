import { fetchChannelNameDataAPI, fetchChannelNameInnerTube, shouldUpdateChannelName } from "./mainChannelName";
import { getOriginalChannelDescriptionDataAPI, getOriginalChannelDescriptionInnerTube } from "./channelDescription";
import { isYouTubeDataAPIEnabled, getChannelIdFromInnerTube } from "../../utils/utils";
import { isMobileSite } from "../../utils/navigation";
import { currentSettings } from "../index";
import { coreErrorLog } from "../../utils/logger";

/**
 * Updates the channel name and description in all channel renderer elements on the search results page.
 * Supports both desktop (ytd-channel-renderer) and mobile (ytm-compact-channel-renderer).
 */
export async function patchChannelRendererBlocks(): Promise<void> {
    const isMobile = isMobileSite();
    
    // Select appropriate renderer based on platform
    const rendererSelector = isMobile ? 'ytm-compact-channel-renderer' : 'ytd-channel-renderer';
    const channelRenderers = document.querySelectorAll(rendererSelector);
    
    for (const renderer of channelRenderers) {
        // Extract the handle - different selectors for mobile/desktop
        let handle: string | null = null;
        
        if (isMobile) {
            // Mobile: handle is in .YtmCompactMediaItemByline (e.g., "@Nowtech")
            const bylineElements = renderer.querySelectorAll('.YtmCompactMediaItemByline span.yt-core-attributed-string');
            for (const byline of bylineElements) {
                const text = byline.textContent?.trim() || "";
                if (text.startsWith('@')) {
                    handle = text.substring(1); // Remove '@'
                    break;
                }
            }
        } else {
            // Desktop: handle is in #subscribers element (e.g., "@Nowtech • 435K subscribers")
            const handleElement = renderer.querySelector('yt-formatted-string#subscribers');
            const handleText = handleElement?.textContent?.trim() || "";
            const handleMatch = handleText.match(/@([a-zA-Z0-9_-]+)/);
            handle = handleMatch ? handleMatch[1] : null;
        }
        
        if (!handle) continue;

        let channelId: string | null = null;

        // Fetch the original channel name
        let originalChannelName: string | null = null;
        if (isYouTubeDataAPIEnabled(currentSettings)) {
            originalChannelName = await fetchChannelNameDataAPI(handle);
        } else {
            channelId = await getChannelIdFromInnerTube(handle);
            if (!channelId) {
                coreErrorLog(`Channel ID not found for handle: ${handle}`);
                continue;
            }
            originalChannelName = await fetchChannelNameInnerTube(handle, channelId);
        }

        // Replace the channel name if needed - different selectors for mobile/desktop
        const nameElement = isMobile 
            ? renderer.querySelector('.YtmCompactMediaItemHeadline span.yt-core-attributed-string')
            : renderer.querySelector('ytd-channel-name #text');
        
        const currentName = nameElement?.textContent?.trim() || null;
        if (nameElement && shouldUpdateChannelName(originalChannelName, currentName)) {
            nameElement.textContent = originalChannelName || "";
        }

        // Skip description on mobile (doesn't exist in mobile renderer)
        if (isMobile) continue;

        // Fetch the original channel description (desktop only)
        let originalDescription: string | null = null;
        if (isYouTubeDataAPIEnabled(currentSettings)) {
            const data = await getOriginalChannelDescriptionDataAPI({ handle });
            originalDescription = data?.description || null;
        } else {
            if (channelId){
                originalDescription = await getOriginalChannelDescriptionInnerTube(channelId);
            } else {
                coreErrorLog("Channel ID is missing for InnerTube description fetch.");
                continue;
            }
        }

        // Replace the description if needed (desktop only)
        const descElement = renderer.querySelector('yt-formatted-string#description');
        if (descElement && originalDescription && descElement.textContent?.trim() !== originalDescription) {
            descElement.textContent = originalDescription;
        }
    }
}