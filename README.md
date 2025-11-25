<div align='center'>

  [![Release Version](https://img.shields.io/github/v/release/YouG-o/YouTube_No_Translation?style=flat&logo=github&color=2ea44f)](https://github.com/YouG-o/YouTube_No_Translation/releases/latest)
  [![Github Stargazers](https://img.shields.io/github/stars/YouG-o/YouTube_No_Translation?style=flat&logo=github&color=f9d71c)](https://github.com/YouG-o/YouTube_No_Translation/stargazers)
  [![Github Contributors](https://img.shields.io/github/contributors/YouG-o/YouTube_No_Translation?style=flat&logo=github&color=blue)](https://github.com/YouG-o/YouTube_No_Translation/graphs/contributors)
  [![Mozilla Users](https://img.shields.io/amo/users/youtube-no-translation?label=&style=flat&logo=firefox-browser&logoColor=white&color=ff7139)](https://addons.mozilla.org/firefox/addon/youtube-no-translation/)
  [![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/lmkeolibdeeglfglnncmfleojmakecjb?label=&style=flat&logo=google-chrome&logoColor=white&color=4285F4)](https://chromewebstore.google.com/detail/youtube-no-translation/lmkeolibdeeglfglnncmfleojmakecjb)
  ![LICENSE](https://img.shields.io/github/license/YouG-o/YouTube_No_Translation?label=&style=flat&logo=license&logoColor=white&color=3da639)

</div>

###

<div align="center">

  ![Add-On icon](./assets/images/icon.png)


  ###

  # YouTube No Translation

  A web browser extension that keeps your YouTube experience authentic by preventing automatic translations.


  <br>

</div>

<div align="center">

  ## Features:

</div>
  
- **Video Titles**: Keep titles in their original language (Video titles, Shorts, Notifications...)
- **Audio Tracks**: Always use the original audio track (or choose a specific one)
- **Descriptions**: Prevent automatic translation of videos descriptions
- **Thumbnails**: Restore original thumbnails
- **Subtitles**: Set your preferred subtitle language, if unavailable, subtitles are disabled (auto generated ones are ignored)

You can enable YouTube Data API v3 (requires your own API key) for the most reliable and fastest way to fetch original data. [Learn more](./docs/YT_DATA_API.md).<br>


If you want to use the [DeArrow](https://github.com/ajayyy/DeArrow) extension alongside this one  [PLEASE CHECK THIS](./docs/DEARROW_SUPPORT.md) to avoid any conflicts.


###

<div align="center">

  ## Download:


  [![Available on Mozilla](./assets/images/mozilla-firefox_banner.png)](https://addons.mozilla.org/firefox/addon/youtube-no-translation/)
  [![Available on Chrome Web Store](./assets/images/chrome-web-store_banner.png)](https://chromewebstore.google.com/detail/youtube-no-translation/lmkeolibdeeglfglnncmfleojmakecjb)  
  [![Available on Microsoft Store](./assets/images/microsoft-edge_banner.png)](https://microsoftedge.microsoft.com/addons/detail/dflkepcdbnjbbfdokanhhdeolodkcofb)
  [![Available on App Store](./assets/images/safari_banner.png)](https://apps.apple.com/app/no-translation-for-youtube/id6754244353)

</div>


###


<div align="center">
  
  # Build it yourself

</div>

  While the extension is available through the official stores, you can also build it from source:

  ### Prerequisites
  - Node.js
  - npm
  - **For Safari**: macOS with Xcode installed

  ### Installation
  ```bash
  # Clone the repository
  git clone https://github.com/YouG-o/YouTube_No_Translation.git
  cd YouTube_No_Translation

  # Install dependencies
  npm install
  ```

  ```bash
  # Build for Firefox
  npm run package:firefox
  ```

  ```bash
  # Build for Chromium
  npm run package:chromium
  ```

  ```bash
  # Build for Safari (macOS only)
  npm run prepare:safari
  open "safari/YouTube No Translation/YouTube No Translation.xcodeproj"
  # Then build and run in Xcode to generate the .app
  # Make sure you have allowed usigned extension in Safari settings
  ```

  ---

  ### ⚠️ Firefox versions older than 128

  If you use Firefox **older than version 128**, you must build the extension with a compatible manifest (without the `data_collection_permissions` field), use this command to do so :

  ```bash
  npm run package:firefox-old
  ```


###

<div align="center">
  
  # Contributors:
  
</div>

  Contributions are welcome! Whether you want to fix bugs, add features, or add a language translation, your help is appreciated.
  Please read [CONTRIBUTING.md](CONTRIBUTING.md) to get started, or browse [existing issues](https://github.com/YouG-o/YouTube_No_Translation/issues) to see what needs help.

  <br>

  
  Thanks to all [contributors](./docs/CONTRIBUTORS_LIST.md) !
  
  <br>

  ![Contributor](https://contrib.rocks/image?repo=YouG-o/YouTube_No_Translation)

  

###

<div align="center">
  
  # Support This Project

</div>  

This extension is completely free and open-source. If you find it valuable, you can support its development with a pay-what-you-want contribution!

<br>

<div align="center">

  [![Support me on Ko-Fi](./assets/images/support_me_on_kofi.png)](https://ko-fi.com/yougo)
    
  [![Support with Cryptocurrency](https://img.shields.io/badge/Support-Cryptocurrency-8256D0?style=for-the-badge&logo=bitcoin&logoColor=white)](https://youtube-no-translation.vercel.app/?donate=crypto)

</div>

<br>

You can also support this project by:

- Starring this repository
- Rating the extension on [Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/youtube-no-translation/) or the [Chrome Web Store](https://chromewebstore.google.com/detail/youtube-no-translation/lmkeolibdeeglfglnncmfleojmakecjb)
- Following me on [GitHub](https://github.com/YouG-o)

###

<div align="center">

  # LICENSE


This project is licensed under the [GNU Affero General Public License v3.0](LICENSE)

</div>