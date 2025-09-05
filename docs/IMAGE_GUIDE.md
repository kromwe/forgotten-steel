# Location Image Configuration Guide

This guide provides everything you need to add images to locations without troubleshooting. Follow these patterns and you'll have a solid, working solution every time.

## Quick Start (90% of Use Cases)

### Adding a Simple Image to a Location

```javascript
import { quickAddImage } from '../src/js/imageHelpers.js';

// Add image to any location - this handles everything automatically
await quickAddImage(gameData, 'my_new_location', 'My_New_Location.png');
```

### Manual Configuration (More Control)

```javascript
import { createSimpleImageConfig } from '../src/js/imageHelpers.js';

// Add to your location in gameData.js
my_new_location: {
  name: "My New Location",
  scene: "my_new_location",
  images: createSimpleImageConfig('My_New_Location.png'),
  description: "A description of the location...",
  // ... rest of location config
}
```

## Image Naming Conventions

**Follow these rules to avoid issues:**

1. **Use PascalCase with underscores**: `Village_Entrance.png`, `Forest_Path.png`
2. **Match your location ID**: `village_entrance` → `Village_Entrance.png`
3. **Add descriptive suffixes for variants**:
   - `_night` for night versions
   - `_empty` for empty locations
   - `_after` for post-event states
   - `_peaceful` for calm states

**Examples:**
- `Cave_Entrance.png` (default)
- `Cave_Entrance_night.png` (night version)
- `Cave_Entrance_cleared.png` (after defeating creature)

## Common Patterns

### 1. Time-Based Images (Day/Night)

```javascript
import { createTimeBasedImageConfig } from '../src/js/imageHelpers.js';

location.images = createTimeBasedImageConfig(
  'Village_Square.png',      // Day image
  'Village_Square_night.png' // Night image
);
```

### 2. Event-Based Images (Before/After)

```javascript
import { createEventBasedImageConfig } from '../src/js/imageHelpers.js';

location.images = createEventBasedImageConfig(
  'Cave_Entrance.png',           // Before defeating creature
  'defeatedCaveCreature',        // Flag name to check
  'Cave_Entrance_cleared.png'    // After defeating creature
);
```

### 3. NPC-Based Images

```javascript
import { createNPCBasedImageConfig } from '../src/js/imageHelpers.js';

location.images = createNPCBasedImageConfig(
  'Village_Empty.png',           // When no special NPCs
  {
    'village_elder': 'Village_With_Elder.png',
    'small_creature': 'Village_Under_Attack.png'
  }
);
```

### 4. Multiple Conditions

```javascript
import { createConditionalImageConfig } from '../src/js/imageHelpers.js';

location.images = createConditionalImageConfig(
  'Default.png',
  {
    'savedChildren': 'After_Rescue.png',
    'NIGHT': 'Night_Version.png',
    'defeatedCaveCreature': 'Hero_Welcome.png'
  }
);
```

## File Organization

**Put all images in:** `src/assets/images/`

**Recommended folder structure:**
```
src/assets/images/
├── villages/
│   ├── Village_Entrance.png
│   ├── Village_Square.png
│   └── Cottage.png
├── forests/
│   ├── Forest_Path.png
│   └── Forest_Clearing.png
├── caves/
│   ├── Cave_Entrance.png
│   └── Cave_Interior.png
└── events/
    ├── Wolf_Children.png
    └── Battle_Aftermath.png
```

## Validation and Troubleshooting

### Check for Missing Images

```javascript
import { imageValidator } from '../src/js/imageValidator.js';

// Validate all location images
const report = await imageValidator.validateAllLocationImages(gameData);
console.log(report.summary);

// Check specific location
const result = await imageValidator.validateLocationImages(
  location.images, 
  'location_id'
);
if (!result.valid) {
  console.log('Missing images:', result.missingImages);
}
```

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Image not loading | Check file exists in `src/assets/images/` |
| Wrong image showing | Verify condition logic and flag names |
| Fallback image used | Location missing `images` configuration |
| Case sensitivity | Use exact filename including capitalization |

## Step-by-Step: Adding Your First Image

1. **Create/Find your image file**
   - Save as PNG, JPG, or SVG
   - Place in `src/assets/images/`
   - Use descriptive name: `My_Location.png`

2. **Add to location in gameData.js**
   ```javascript
   import { createSimpleImageConfig } from './imageHelpers.js';
   
   my_location: {
     name: "My Location",
     scene: "my_location",
     images: createSimpleImageConfig('My_Location.png'),
     description: "...",
     exits: { /* ... */ }
   }
   ```

3. **Test in game**
   - Navigate to the location
   - Image should load automatically
   - Check browser console for any errors

4. **Validate (optional)**
   ```javascript
   // In browser console
   const report = await imageValidator.validateAllLocationImages(gameData);
   console.log(report.summary);
   ```

## Advanced Examples

### Complex Multi-State Location

```javascript
village_square: {
  name: "Village Square",
  scene: "village_square",
  images: {
    default: "Village_Square.png",
    conditions: {
      "time:night": "Village_Square_night.png",
      "flag:savedChildren": "Village_Square_celebration.png",
      "flag:defeatedCaveCreature": "Village_Square_hero.png",
      "npc:village_elder": "Village_Square_meeting.png"
    }
  },
  description: "The central square...",
  // ... rest of config
}
```

### Dynamic Event Images

```javascript
// In your event handler
storyEngine.webglRenderer.setDynamicSceneImage('assets/images/Special_Event.png');

// Clear dynamic image to return to location default
storyEngine.webglRenderer.setDynamicSceneImage(null);
```

## Condition Reference

### Flag Conditions
- `"flag:flagName"` - Check if flag is true
- `"!flag:flagName"` - Check if flag is false

### Time Conditions
- `"time:day"` - Daytime
- `"time:night"` - Nighttime
- `"time:dawn"` - Dawn
- `"time:dusk"` - Dusk

### NPC Conditions
- `"npc:npcId"` - NPC is present in location
- `"!npc:npcId"` - NPC is not present

### Item Conditions
- `"item:itemId"` - Player has item
- `"!item:itemId"` - Player doesn't have item

## Best Practices

1. **Start Simple**: Use `createSimpleImageConfig()` for most locations
2. **Test Early**: Add image and test immediately
3. **Use Validation**: Run validation after adding multiple images
4. **Consistent Naming**: Follow the naming conventions
5. **Optimize Images**: Use appropriate file sizes for web
6. **Document Conditions**: Comment complex condition logic

## Troubleshooting Checklist

- [ ] Image file exists in `src/assets/images/`
- [ ] Filename matches exactly (case-sensitive)
- [ ] Location has `images` configuration
- [ ] Condition syntax is correct
- [ ] Flag names match game state
- [ ] No console errors in browser
- [ ] Webpack compiled successfully

## Getting Help

If you're still having issues:

1. Check the browser console for errors
2. Run the validation system
3. Verify the image file exists and is accessible
4. Check that the location ID matches your gameData
5. Ensure webpack is running and compiled successfully

This system is designed to be foolproof - follow these patterns and you shouldn't need to troubleshoot!