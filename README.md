# Forgotten Steel

A WebGL text adventure game where you play as a knight with amnesia on a quest to recover your memories and save the queen from an evil wizard.

## 🚀 GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup Instructions:

1. **Create GitHub Repository:**
   ```bash
   # Create a new repository on GitHub named 'forgotten-steel'
   # Then connect your local repository:
   git remote add origin https://github.com/yourusername/forgotten-steel.git
   git branch -M main
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository settings on GitHub
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "GitHub Actions"
   - The workflow will automatically deploy on every push to main branch

3. **Update Homepage URL:**
   - Replace `yourusername` in `package.json` homepage field with your actual GitHub username
   - Commit and push the change

4. **Access Your Game:**
   - After deployment, your game will be available at: `https://yourusername.github.io/forgotten-steel`

### Local Development:

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Build Electron app
npm run dist
```

## Features

- **WebGL Graphics**: Visual representation of game locations in the top half of the screen
- **Text Adventure Interface**: Classic text adventure gameplay in the bottom half
- **Character Creation**: Name your character and have it referenced throughout the story
- **Progressive Memory Recovery**: Discover your identity and mission as you progress
- **Combat System**: Battle creatures and enemies with weapons and armor
- **Inventory Management**: Collect, use, and equip items throughout your journey
- **Save/Load System**: Save your progress and continue your adventure later

## Story

You awaken at a crossroads with no memory of who you are or how you got there. As you explore, you'll discover a village plagued by evil creatures, help the villagers, and slowly recover your memories. You'll learn that you are a knight, and that an evil wizard has captured the queen and is twisting the land and its creatures. Your quest will take you through various locations, culminating in a final confrontation at the wizard's tower.

## How to Play

### Installation

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the development server with `npm start`
4. Open your browser to `http://localhost:8080`

### Commands

The game understands a variety of commands, including:

- **Movement**: `go north`, `move south`, `walk east`, `travel west` (or simply `north`, `south`, etc.)
- **Look**: `look`, `look at [object]`, `examine [object]`
- **Items**: `take [item]`, `drop [item]`, `use [item]`, `equip [item]`
- **Inventory**: `inventory` or `inv`
- **Interaction**: `talk to [person]`, `attack [enemy]`
- **System**: `help`, `save`

## Development

### Project Structure

- `src/js/main.js` - Main entry point and game initialization
- `src/js/webgl.js` - WebGL rendering system
- `src/js/gameState.js` - Game state management
- `src/js/terminal.js` - Terminal interface for text input/output
- `src/js/storyEngine.js` - Story and location management
- `src/js/combatSystem.js` - Combat mechanics
- `src/js/gameData.js` - Game content (locations, items, NPCs)
- `src/css/style.css` - Game styling
- `src/assets/` - Images and audio files

### Building for Production

Run `npm run build` to create a production build in the `dist` directory.

## Credits

Created as a modern homage to classic text adventures like Zork, with the addition of WebGL graphics.