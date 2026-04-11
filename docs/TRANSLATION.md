# Translation Guide for YouTube No Translation

This document explains how to contribute translations for the extension and its store descriptions.
We welcome translations to make YouTube No Translation accessible to users worldwide! The extension uses the WebExtension internationalization (i18n) system.

### How to Add a Translation

1. **Create a new locale folder**
   
   Navigate to the `_locales` directory and create a new folder with the appropriate locale code:
   ```bash
   mkdir _locales/fr  # For French
   mkdir _locales/es  # For Spanish
   mkdir _locales/de  # For German
   # etc.
   ```
   
   Use the [ISO 639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) for your language.

2. **Copy the English template**
   
   Copy the English `messages.json` file as your starting point:
   ```bash
   cp _locales/en/messages.json _locales/YOUR_LOCALE/messages.json
   ```

3. **Translate the messages**
   
   Open your new `messages.json` file and translate **only** the `"message"` values. Keep the keys and structure unchanged:
   
   ```json
   {
     "extensionName": {
       "message": "YouTube No Translation",  // ← Translate this
       "description": "Name of the extension"  // ← Leave this in English (it's for context)
     }
   }
   ```

4. **Important notes**
   
   - **Do not translate**: JSON keys, `"description"` fields, or placeholder names
   - **Keep placeholders**: If a message contains `$PLACEHOLDER$`, keep it as-is in your translation
   - **Maintain formatting**: Preserve line breaks and punctuation where meaningful
   - **Test your translation**: Build the extension and verify your translation appears correctly

5. **Submit your translation**
   
   Create a pull request with your new locale folder. Make sure to:
   - Test the extension with your locale
   - Update the [`CHANGELOG.md`](CHANGELOG.md) in the `[Unreleased]` section under `Added`
   - Mention which language you've added

### Example Translation

English (`_locales/en/messages.json`):
```json
{
  "popup_originalTitles": {
    "message": "Original Titles",
    "description": "Title for original titles feature"
  }
}
```

French (`_locales/fr/messages.json`):
```json
{
  "popup_originalTitles": {
    "message": "Titres originaux",
    "description": "Title for original titles feature"
  }
}
```

# Store Descriptions to Translate

Below are the official descriptions for Mozilla and Chrome stores.  
Please translate them and just include them in your PR message.

### Mozilla Add-ons description

```
Keeps YouTube content in its original language (Titles, Audio Tracks, Descriptions...)

FEATURES ✨ :
• 🏷️ VIDEO TITLES : Keep titles in their original language
• 🔊 AUDIO TRACKS : Choose your default audio track : Always original, or a specific language (if available). This feature is DESKTOP-ONLY
• 📝 DESCRIPTIONS : Prevent description translations
• 🖼️ THUMBNAILS : Switch back to original thumbnails
• 💬 SUBTITLES : Set your preferred language. If your language is not available, subtitles are disabled

🙏 💌 This Add-On is free to use so it can remain accessible to everyone but if you find it valuable, and if you can afford it, you can support its development with a pay-what-you-want contribution on KO-FI: https://ko-fi.com/yougo

🔒 Privacy guaranteed: No tracking, no data collection, no sneaky stuff. The add-on only does its job and minds its own business.
🛠️ You can find the source code here: https://github.com/YouG-o/YouTube_No_Translation

Also available on Chrome Web Store: https://chromewebstore.google.com/detail/youtube-no-translation/lmkeolibdeeglfglnncmfleojmakecjb for Chromium browsers.

Want to report an issue or suggest a feature? You can do it here: https://github.com/YouG-o/YouTube_No_Translation/issues

This add-on is not affiliated with YouTube™ or Google™.
```

### Chrome Web Store Description

```
FEATURES ✨ :
• 🏷️ VIDEO TITLES — Keep titles in their original language (titles, notifications, channel titles..)
• 🔊 AUDIO TRACKS — Choose your default audio track : Always original, or a specific language (if available). This feature is DESKTOP-ONLY
• 📝 DESCRIPTION — Prevent video description translation
• 🖼️ THUMBNAILS — Switch back to original thumbnails.
• 💬 SUBTITLES — Choose your preferred subtitle language. If your preferred language is not available, subtitles are disabled.

🙏💌 This Add-On is free to use so it can remain accessible to everyone but if you find it valuable, and if you can afford it, you can support its development with a pay-what-you-want contribution on KO-FI: https://ko-fi.com/yougo .

🔒 Privacy guaranteed: No tracking, no data collection, no sneaky stuff. The add-on only does its job and minds its own business.
🛠️You can find the extension's source code here: https://github.com/YouG-o/YouTube_No_Translation

Also available on Firefox: https://addons.mozilla.org/firefox/addon/youtube-no-translation/

Want to report an issue or ask for a feature: https://github.com/YouG-o/YouTube_No_Translation/issues

This extension is not affiliated with YouTube™ or Google™.
```

## Tips for Translators

- Keep emojis and formatting as in the original text.
- If you are unsure about a term, ask in your pull request or open an issue.
- Test your translation in the browser to ensure everything displays correctly.

Thank you for helping make YouTube No Translation accessible to everyone!

### Need Help?

If you have questions about translating specific terms or context, feel free to open an issue or ask in your pull request!