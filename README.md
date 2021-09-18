<p align="center">
  <img src="/screenshots/main-alpha.png">
</p>

<h1 align="center">
  GeoIp Scavenger Hunt
</h1>

This is a browser extension for Google Chrome which helps visualize all of the world wide connections we make while surfing the web!

## Installation

This extension can be installed here from the Chrome Web Store, but you can also install it manually after building via the following steps:
1. Navigate to chrome://extensions
2. Enable Developer mode (top right slider)
3. Click the "Load Unpacked" button and select the `dist` folder of this repository

## Usage

Once the extension is installed, everything is ready to go! Clicking on the globe icon from the extension toolbar will open the extension popup. This is where the interactive globe and ping statistics can be found. Every time a web request is logged, a red dot will travel from your location (the green dot) to the remote webserver and back.

The **Recent** tab shows the country, region, and city of web requests. The list stacks the newest web requests on the top and pushes older ones toward the bottom.

The **Stats** tab contains statistics about your web requests and some modifiers to adjust the appearence of the interactive globe. Any statistic or modifier can be hovered over using the cursor for more information.

Finally, the **About** tab displays the current version of the extension.

<p align="center">
  <img src="/screenshots/recent.png">
</p>

## Building

Building the extension is unnecessary if you install it from the Chrome Web Store, but it is a straightforward process nonetheless. The only caveat is the GeoIP database needs to be manually downloaded and placed in the `database` folder. This extension requires `IP2LOCATION-LITE-DB5.IPV6.BIN` from the IP2Location [website](https://lite.ip2location.com/).
After this, the following commands will install all dependencies and build the extension:
```
npm i
npm run build
```
Optionally, the release version can be generated via:
```
npm run release
```
------------------
This site or product includes IP2Location LITE data available from [http://www.ip2location.com](https://www.ip2location.com).
