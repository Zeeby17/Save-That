# SAVE THAT — App Specification

## Overview
"Save That" is a mobile-first dashcam-style video recording app. It continuously records video in a rolling buffer and lets users instantly save the last N seconds/minutes of footage with one tap. Think of it like a gaming replay system, but for your phone camera.

---

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom theme
- **Mobile**: Capacitor (configured for iOS/Android wrapping)
- **Storage**: In-memory blob storage (no backend/database)
- **Routing**: React Router v6

---

## Brand / Design System

### Colors (HSL-based CSS variables)
- **Primary Purple**: `#3C096C` (main brand), Light: `#5A189A`, Dark: `#240046`
- **Red/Accent**: `#FF1E00`, Light: `#FF4D00`, Dark: `#CC0000`
- **Orange (logo/text accent)**: `#FF8C00` / `#FF7E36`
- **Background**: Dark purple (`270 86% 13%`)
- **Foreground**: White

### Logo
- Custom SVG hourglass icon with purple frame and orange sand particles
- "SAVE THAT" text in Impact/Arial Black font, orange with purple text-stroke, uppercase

### General UI Style
- Dark theme throughout
- Rounded buttons with `bg-black/50` semi-transparent backgrounds
- Purple gradient sections for controls area
- Red accent buttons for save actions
- Mobile-optimized with safe area insets and viewport height fix (`--vh` variable)

---

## Pages & Routes

### 1. Home / Camera (`/`)
The main screen. Full-screen camera viewfinder with overlaid controls.

### 2. Saved Clips (`/clips`)
Gallery of saved video clips with playback, export, and delete.

### 3. Settings (`/settings`)
Configuration panel for recording and app preferences.

### 4. Not Found (`/*`)
404 fallback page.

---

## Feature Spec: Camera Screen (`/`)

### Camera Viewfinder
- Full-screen `<video>` element showing live camera feed
- `object-cover` fit, black background
- Supports crop modes: full, landscape, portrait, 16:9, 4:3, 1:1 (applied via CSS `aspectRatio`)
- Camera defaults to rear-facing (`environment`)

### Rolling Buffer Recording
- Starts automatically on load — always recording
- Uses `MediaRecorder` API with 1-second chunk intervals
- Maintains a rolling buffer (default 10 minutes / 600 seconds)
- Old chunks are automatically discarded when buffer exceeds max
- MIME type auto-detection: tries `video/webm;codecs=vp9,opus` → `vp8,opus` → `h264,opus` → `webm` → `mp4`

### Top-Left: Logo + Recording Timer
- Hourglass SVG icon (24px)
- "SAVE THAT" brand text (orange, Impact font, purple stroke)
- Blinking red recording dot (CSS animation, 1s blink)
- Elapsed recording time in `M:SS` format

### Top-Right: Quality & Crop Dropdowns
- **Video Quality Dropdown**: 420p / 720p / 1080p / 4K
  - Changing quality restarts the camera
- **Crop Mode Dropdown**: Full Screen / Landscape / Portrait / 16:9 / 4:3 / 1:1
- Styled as semi-transparent black buttons with purple dropdown menus and orange text

### Bottom-Left (on video): Sound Bar Toggle
- White music icon button (`Music` from lucide-react)
- Toggles the audio visualization bar on/off
- Persisted to `localStorage` key `soundTimerBar`

### Bottom-Right (on video): Switch Camera
- White camera-switch icon button (`SwitchCamera` from lucide-react)
- Toggles between front (`user`) and rear (`environment`) camera

### Purple Control Bar (below video)
Always visible at bottom. Contains:

#### Audio Visualization (when sound bar enabled)
- 480 thin vertical bars representing 60 seconds of audio history
- Updates every 125ms (480 data points per minute)
- Analyzes vocal/music frequency range (200Hz–8kHz) using Web Audio API `AnalyserNode`
- FFT size 2048, smoothing 0.3
- Time markers: 60s, 45s, 30s, 15s, now
- Red-colored bars with opacity based on level

#### Time Segment Save Buttons
- Row of buttons labeled: **10s, 20s, 30s, 1m, 2m, 5m**
- Each button saves the last N seconds from the rolling buffer
- "Save Last" title text above buttons
- Red background buttons with scale-down active state
- On tap: slices the last N chunks from buffer, creates a Blob, saves to clip storage

#### Settings Button (bottom-left of purple bar)
- Gear icon, navigates to `/settings`
- Orange icon on semi-transparent black circle

#### Clips Gallery Button (bottom-right of purple bar)
- Image icon, navigates to `/clips`
- Orange icon on semi-transparent black circle

---

## Feature Spec: Clips Page (`/clips`)

### Header
- Hourglass logo + "Time Segments" title
- Camera icon button (top-right) → navigates back to `/`

### Clip List
- Grid layout (1 col mobile, 2 col desktop)
- Each clip card shows:
  - Video thumbnail (generated from video frame at 50% duration)
  - Timestamp (formatted locale string)
  - Duration (seconds or minutes)
  - File size (MB)
  - 3-dot menu with Export and Delete options

### Video Player
- Selecting a clip opens an inline video player above the list
- Shows clip metadata (duration, size)
- Has export and delete options

### Empty State
- "No clips saved yet" message with prompt to use camera

### Clip Storage
- In-memory `Map<string, StoredClip>` (clips lost on page refresh)
- Each clip stores: `id`, `timestamp`, `duration`, `size`, `blob`, `mimeType`, `url` (object URL)
- Export creates a download link with `.webm` filename
- Delete revokes object URL and removes from map
- Cross-component communication via `CustomEvent('clipSaved')`

---

## Feature Spec: Settings Page (`/settings`)

### Header
- Hourglass logo + "Settings" title
- Camera icon button (top-right) → navigates back to `/`

### Recording Settings
- **Buffer Duration**: Slider, 1–60 minutes (default 10)
- **Video Quality**: Radio group — 480p / 720p / 1080p
- **Audio Recording**: Toggle switch (default on)
- **Auto Save**: Toggle switch (default off)

### Storage Management
- **Maximum Saved Clips**: Slider, 10–100 (default 50, step 10)
- **Delete All Saved Clips**: Destructive button

### App Preferences
- **Notifications**: Toggle (default on)
- **Sound Timer Bar**: Toggle (default on)
- **Dark Mode**: Toggle (default on)

### Action Buttons
- **Save All Settings**: Saves all values to `localStorage`
- **Reset to Defaults**: Resets all settings to default values

### localStorage Keys
`bufferMinutes`, `autoSave`, `videoQuality`, `audioEnabled`, `notifications`, `darkMode`, `maxClips`, `soundTimerBar`

---

## Key Technical Details

### Hooks Architecture
1. **`useCamera`**: Manages MediaRecorder, video stream, rolling buffer chunks, camera switching, quality constraints
2. **`useAudioAnalysis`**: Web Audio API analyser, 480-point frequency data array, 125ms update interval
3. **`useSaveClips`**: Takes chunks array + seconds, slices buffer, creates blob, saves to clipStorage

### Camera Constraints by Quality
| Quality | Width | Height |
|---------|-------|--------|
| 420p    | 640   | 480    |
| 720p    | 1280  | 720    |
| 1080p   | 1920  | 1080   |
| 4K      | 3840  | 2160   |

### Frame Rate
- Standard: 30fps ideal
- (Turbo mode exists in code but disabled: 60–240fps)

### Mobile Optimizations
- `--vh` CSS variable for proper mobile viewport height
- `overscroll-behavior-y: none` to prevent pull-to-refresh
- `touch-action: manipulation` to prevent double-tap zoom
- Safe area insets for notched devices
- `playsInline` on all video elements

### Capacitor Config
- App ID: `app.lovable.f243e3e1c9db45dc8ffd732b9abe0785`
- Web directory: `dist`
- Camera and microphone permissions declared

---

## Known Limitations / Future Work
1. **No persistent storage** — clips are in-memory only, lost on refresh. Needs IndexedDB, filesystem API, or cloud storage.
2. **No user authentication** — no accounts, no cloud sync.
3. **Auto-save setting exists in UI but is not wired up** in recording logic.
4. **Max clips setting exists in UI but is not enforced** when saving.
5. **Dark mode toggle exists but app is always dark** — no light theme implemented.
6. **Notifications toggle exists but no notification system** is implemented.
7. **Audio enabled toggle in settings doesn't affect** the camera's audio capture.
8. **Video quality in settings doesn't sync with** the camera screen's quality dropdown.
9. **Navigation uses `window.location.href`** instead of React Router's `useNavigate`, causing full page reloads and losing in-memory clips.

---

## File Structure
```
src/
├── App.tsx                    # Router setup
├── main.tsx                   # Entry point
├── index.css                  # Global styles, CSS variables, animations
├── pages/
│   ├── Index.tsx              # Camera page wrapper
│   ├── ClipsPage.tsx          # Clips gallery page
│   ├── SettingsPage.tsx       # Settings page wrapper
│   └── NotFound.tsx           # 404 page
├── components/
│   ├── Camera.tsx             # Main camera component with all controls
│   ├── CameraControls.tsx     # Quality & crop dropdown menus
│   ├── TimeSegmentButtons.tsx # Save time buttons (10s–5m)
│   ├── AudioVisualization.tsx # 480-bar audio frequency display
│   ├── ClipsList.tsx          # Clip gallery with player
│   ├── Settings.tsx           # Settings form
│   └── AppIcon.tsx            # Hourglass SVG logo
├── hooks/
│   ├── useCamera.ts           # Camera/MediaRecorder/buffer logic
│   ├── useAudioAnalysis.ts    # Web Audio API frequency analysis
│   └── useSaveClips.ts        # Clip saving logic
└── utils/
    └── clipStorage.ts         # In-memory clip storage class
```
