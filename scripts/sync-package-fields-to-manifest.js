const fs = require('fs');
const path = require('path');
const { getCommonScriptResources } = require('./content-scripts-config');

const rootDir = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const manifestPath = path.join(rootDir, 'manifest.json');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

/**
 * Common list of page scripts built into dist/content/scripts.
 * This list is shared across all browsers, but the way it is injected
 * into web_accessible_resources depends on manifest_version/platform.
 */
const commonScriptResources = getCommonScriptResources();

/**
 * Extra resources for MV3 browsers (Firefox/Chromium).
 */
const mv3ExtraResources = [
  'dist/content/toast.html',
  'dist/assets/icons/*'
];

/**
 * Detects the target platform based on manifest shape.
 * We only need to distinguish Safari (MV2) from MV3-based manifests.
 */
function detectPlatform(manifestJson) {
  if (manifestJson.manifest_version === 2) {
    return 'safari';
  }
  // Default: MV3 (Firefox/Chromium)
  return 'mv3';
}

/**
 * Builds the web_accessible_resources value for MV3 manifests
 * (Firefox and Chromium share the same structure here).
 */
function buildMv3WebAccessibleResources() {
  return [
    {
      resources: [
        ...commonScriptResources,
        ...mv3ExtraResources
      ],
      matches: [
        '*://*.youtube.com/*',
        '*://*.youtube-nocookie.com/*'
      ]
    }
  ];
}

/**
 * Builds the web_accessible_resources value for Safari (MV2-style).
 * Safari intentionally only exposes the script bundles.
 */
function buildSafariWebAccessibleResources() {
  return [...commonScriptResources];
}

/**
 * Inject version, description, and author from package.json as first keys,
 * and also inject web_accessible_resources according to the manifest type.
 */
function buildNewManifest(manifestJson) {
  const platform = detectPlatform(manifestJson);

  const newManifest = {
    version: pkg.version,
    description: pkg.description,
    author: pkg.author,
    ...manifestJson
  };

  if (platform === 'safari') {
    newManifest.web_accessible_resources = buildSafariWebAccessibleResources();
  } else {
    newManifest.web_accessible_resources = buildMv3WebAccessibleResources();
  }

  return newManifest;
}

const newManifest = buildNewManifest(manifest);

fs.writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2) + '\n');
console.log('[inject-version] Set manifest.json version, description, and author from package.json');
console.log('[inject-resources] Injected web_accessible_resources into manifest.json');