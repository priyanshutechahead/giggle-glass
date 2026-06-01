# GiggleGlass: Retro Windows 95/98 "Redmond Desktop" Overhaul

A full visual redesign of the GiggleGlass Single Page Application, replacing the dark glassmorphism styling with a highly detailed, extremely nostalgic **Windows 98 / Redmond desktop experience**. It blends MS Paint toolbar layouts, Windows Sound Recorder TTS players, and Outlook Express bookmark grids.

## retro Aesthetics Design Spec (Windows 95/98 Style)

To deliver an incredibly detailed, authentic, and fun retro UI, we will implement:
- **Classic Teal Desktop Background**: `#008080` base background color, replicating the default Windows 95/98 desktop theme.
- **3D Bevel Containers**:
  - Outset Borders: For buttons, active cards, and windows. Replicated with white/light-gray top-left borders and dark-gray/black bottom-right borders (`border: 2px solid; border-color: #fff #808080 #808080 #fff;`).
  - Inset Borders: For text inputs, canvas displays, and select lists. Replicated with black/dark-gray top-left borders and white/light-gray bottom-right borders.
- **Window Title Bars**:
  - Classic blue gradient bar (`#000080` to `#1084d0`) with white bold text.
  - A retro `[?]` help and `[X]` close button block in the top right.
- **MS Paint Categories Toolbar**:
  - Left vertical toolbar layout holding square selection buttons.
  - Each button represents a joke category (e.g., Programming, Pun, Spooky, etc.) using custom retro-styled 16-bit icons or classic keyboard glyphs.
- **Windows Sound Recorder / Media Player TTS Engine**:
  - Refactors the Text-to-Speech playback area to look like `sndrec32.exe` (Windows Sound Recorder) or Windows Media Player 6.4.
  - A sliding seekbar track, classic gray circular play/pause/stop styled buttons, and a **green digital wave display window** that animates like an oscilloscope when speech is active!
- **Outlook Express Bookmark Inbox**:
  - The favorites list drawer will look like a retro email client or file explorer window.
  - Row lists with custom mail/paper icons, columns for Category, Size (length), and Date.

---

## Proposed Changes

We will refactor the files under the `giggle glass` subfolder:

### [Core Components]

#### 📄 [style.css](file:///Users/priyanshupaikra/Desktop/projects/project/giggle%20glass/style.css)
Complete overhaul of styles:
- Remove all dark background layers, blur filters, and glowing neon effects.
- Define a system colors palette: `--win-gray: #c0c0c0`, `--win-shadow: #808080`, `--win-dark-shadow: #0a0a0a`, `--win-blue: #000080`.
- Implement `Tahoma`, `MS Sans Serif`, `monospace` typography rules.
- Set up outset and inset bevel utility classes.
- Design the oscilloscope-wave animation (green glowing canvas line that scale-vibrates).
- Design the classic gray select boxes, checkbox square frames, and status bars.

#### 📄 [index.html](file:///Users/priyanshupaikra/Desktop/projects/project/giggle%20glass/index.html)
Refactor markup for retro system container alignment:
- Enclose the main card inside a `.window` class with title bar headers.
- Restructure settings to look like standard Windows Tab items (e.g., "General", "Voice Settings", "Exclusions").
- Adapt category selection to a vertical floating toolbar (like MS Paint's tool dock).
- Restructure TTS speech controls into a retro audio panel layout with play/pause icons and seek bars.
- Redraw inline SVGs to match the 16-bit pixelated styling.

#### 📄 [app.js](file:///Users/priyanshupaikra/Desktop/projects/project/giggle%20glass/app.js)
Minor adjustments to support the retro layout:
- Synchronize active toolbar selection states for MS Paint category select.
- Bind the animated retro wave (Sound Recorder green oscilloscope) to active speech.
- Ensure the toast popup stack looks like retro Windows Warning/Alert Dialog dialog boxes (`sys_error.exe` or `sys_info.exe`!) with alert icons and `OK` confirm buttons.

---

## Verification Plan

### Manual Verification
1. **Interactive Retro Elements**:
   - Verify category selection via Paint toolbar updates states and fetches jokes.
   - Verify SpeechSynthesis runs and oscillates the green retro audio wave in the Sound Recorder deck.
   - Verify bookmarks drawer appears like Outlook Express and manages LocalStorage correctly.
   - Verify popup warnings mimic classic Windows error dialog boxes.
2. **Visual Inspection**:
   - Check raised bevel buttons push down correctly when clicked.
   - Verify layout is completely pixel-perfect on small mobile devices.
