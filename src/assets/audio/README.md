# Audio Assets

This directory contains audio files for the game.

## Adding Your Title Screen Music

**To add your looping m4a music file:**

1. Place your `.m4a` music file in this directory
2. Rename it to exactly: `title_theme.m4a`
3. The music will automatically start playing on the title screen and loop continuously

## Current Implementation

✅ **Music System Features:**
- Automatic looping background music on title screen
- Music stops when navigating away from title screen
- Plays at 30% volume by default
- Graceful handling when no music file is present
- Web Audio API integration for high-quality playback

## File Requirements

- **Filename:** Must be exactly `title_theme.m4a`
- **Format:** .m4a (recommended) or .mp3
- **Location:** `/src/assets/audio/title_theme.m4a`

## Supported Audio Formats

- `.m4a` (recommended for music - best quality/size ratio)
- `.mp3` (alternative)
- `.wav` (for sound effects)
- `.ogg` (web-optimized)

## Testing

After adding your music file:
1. The webpack dev server will automatically rebuild
2. Refresh the browser or it will hot-reload
3. Visit the title screen to hear your music
4. Check browser console for any audio-related messages

## Troubleshooting

- If music doesn't play, check the browser console for error messages
- Ensure the file is named exactly `title_theme.m4a`
- Some browsers require user interaction before playing audio
- The music will start when you click any button on the title screen