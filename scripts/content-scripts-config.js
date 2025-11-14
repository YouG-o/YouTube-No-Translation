/**
 * Central configuration for page-injected content scripts.
 *
 * This list is used by:
 * - bundle-scripts.js to build bundles into dist/content/scripts
 * - sync-package-fields-to-manifest.js to generate web_accessible_resources
 *
 * Paths are relative to src/content.
 */
const contentScriptEntries = [
  'scripts/getChannelIdScript.js',
  'titles/mainTitleScript.js',
  'titles/getIdFromMiniPlayer.js',
  'titles/TitlesInnerTube.js',
  'audio/audioScript.js',
  'description/MainDescriptionScript.js',
  'description/timestampScript.js',
  'description/searchDescriptionInnerTube.js',
  'description/DescriptionGuardScript.js',
  'subtitles/subtitlesScript.js',
  'channel/channelNameScript.js',
  'channel/ChannelNameInnerTubeScript.js',
  'channel/ChannelDescriptionInnerTube.js'
];

/**
 * Returns the list of web-accessible dist paths for scripts.
 * Example: ["dist/content/scripts/audioScript.js", ...]
 */
function getCommonScriptResources() {
  return contentScriptEntries.map((relPath) => {
    const fileName = relPath.split('/').pop();
    return `dist/content/scripts/${fileName}`;
  });
}

module.exports = {
  contentScriptEntries,
  getCommonScriptResources
};