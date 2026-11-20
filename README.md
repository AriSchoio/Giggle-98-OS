# HTML OS

A browser-based desktop inspired by Windows 98, with a collection of small HTML apps and an importer for public GitHub repositories.

## Features

- Open built-in Sticky Notes, Calculator, Color Palette, and Focus Timer apps.
- Search and filter the app collection, and manage windows from the taskbar.
- Import HTML files from a public GitHub repository, customize their names and icons, and remove them from the collection.
- Save imported app details and Sticky Notes in browser storage when available.

## Importing apps

Choose **Connect a GitHub repo**, then enter `owner/repository` or a GitHub repository or file URL. Select the HTML files you want to add, customize them, and choose **Add selected apps**. Installed apps appear in the collection and as desktop shortcuts.

The importer searches the repository's default branch. GitHub API rate limits or a truncated repository tree can affect the results. An internet connection is required to connect to GitHub and open imported apps; the editor's sandbox may not provide network access. Imported apps are fetched when opened, so they are not available offline.

## Limitations

Imported apps run in a sandbox. Relative assets are loaded through jsDelivr, and apps requiring server-side code, browser permissions, storage, or external services may not work. Imported app metadata, uploaded icons, and notes are stored locally in the browser and can be lost if browser storage is cleared or unavailable.
