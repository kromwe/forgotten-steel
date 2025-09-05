// Game data: locations, items, and NPCs

export const gameData = {
  // Locations
  locations: {
    // Starting location
    crossroads: {
      name: "Crossroads",
      scene: "crossroads",
      description: "You stand at a dusty crossroads. The dirt beneath your feet is stained with what appears to be dried blood—your blood. Your head throbs with pain, and your memory is a fog. Paths lead in four directions through the surrounding forest.",
      exits: {
        north: "forest_path_north",
        south: "forest_path_south",
        east: "forest_path_east",
        west: "forest_path_west"
      },
      features: [
        {
          keywords: ["blood", "stain", "stains"],
          description: "Dark, dried blood stains the dirt. It seems to be yours, though you have no memory of how you were injured."
        },
        {
          keywords: ["path", "paths", "road", "roads"],
          description: "Dirt paths extend in all four directions, disappearing into the dense forest."
        },
        {
          keywords: ["forest", "trees", "woods"],
          description: "A thick forest surrounds the crossroads, with tall trees blocking much of the sunlight."
        },
        {
          keywords: ["ground", "dirt", "earth"],
          description: "The ground is disturbed, as if there was a struggle here. Scuff marks and overturned stones tell a story of violence.",
          onExamine: (gameState, terminal) => {
            if (!gameState.memoryFragments.includes('crossroads_battle')) {
              gameState.memoryFragments.push('crossroads_battle');
              terminal.print("As you examine the ground more closely, a memory flashes: You see yourself fighting multiple shadowy figures here, your sword flashing in the moonlight before something strikes you from behind.", 'memory-flash');
              gameState.setFlag('rememberedAmbush', true);
            } else {
              terminal.print("The signs of your desperate battle are still visible in the disturbed earth.", 'description');
            }
          }
        }
      ],
      onFirstVisit: (gameState, terminal) => {
        terminal.print("Your head pounds as you try to remember who you are and how you got here. Nothing comes to mind except a vague sense of urgency.", 'memory-flash');
      }
    },
    
    // Forest paths
    forest_path_west: {
      name: "Forest Path - West",
      scene: "forest_path",
      description: "The forest path winds westward. The trees grow closer together here, and the air feels cooler. You hear faint sounds of distress in the distance.",
      exits: {
        east: "crossroads",
        west: "village_outskirts"
      },
      features: [
        {
          keywords: ["sounds", "distress", "noise", "cries"],
          description: "The sounds seem to be coming from further west—perhaps children in trouble?"
        },
        {
          keywords: ["trees", "forest"],
          description: "The forest is dense here, with ancient trees towering overhead."
        },
        {
          keywords: ["path"],
          description: "The dirt path continues west, leading deeper into the forest."
        }
      ]
    },
    
    village_outskirts: {
      name: "Village Outskirts",
      scene: "village_outskirts",
      description: "The forest thins as the path approaches what appears to be a small village. Nearby, you hear children screaming in terror.",
      exits: {
        east: {
          locationId: "forest_path_west",
          condition: (gameState, storyEngine) => {
            console.log('East exit condition - savedChildren:', gameState.getFlag('savedChildren'));
            const location = storyEngine.locations['village_outskirts'];
            console.log('East exit condition - NPCs in village_outskirts:', location.npcs);
            const hasWolf = location.npcs.includes('small_creature');
            console.log('East exit condition - hasWolf:', hasWolf);
            
            // If children haven't been saved and wolf is still present, trigger wolf encounter
            if (!gameState.getFlag('savedChildren') && hasWolf) {
              console.log('East exit condition - Setting triggerWolfDeathStory to true');
              gameState.setFlag('triggerWolfDeathStory', true);
              return false;
            }
            console.log('East exit condition - Allowing movement');
            return true;
          },
          blockedMessage: ""
        },
        west: {
          locationId: "village_entrance",
          condition: (gameState, storyEngine) => {
            console.log('West exit condition - savedChildren:', gameState.getFlag('savedChildren'));
            const location = storyEngine.locations['village_outskirts'];
            console.log('West exit condition - NPCs in village_outskirts:', location.npcs);
            const hasWolf = location.npcs.includes('small_creature');
            console.log('West exit condition - hasWolf:', hasWolf);
            
            // If children haven't been saved and wolf is still present, trigger wolf encounter
            if (!gameState.getFlag('savedChildren') && hasWolf) {
              console.log('West exit condition - Setting triggerWolfDeathStory to true');
              gameState.setFlag('triggerWolfDeathStory', true);
              return false;
            }
            console.log('West exit condition - Allowing movement');
            return true;
          },
          blockedMessage: ""
        }
      },
      npcs: ["child1", "child2", "small_creature"],
      items: ["branch"],
      features: [
        {
          keywords: ["village"],
          description: "A small village lies to the west, with simple wooden buildings visible through the trees."
        }
      ],
      onFirstVisit: (gameState, terminal) => {
        terminal.print("Two children are being attacked by a twisted, snarling creature! Without thinking, you look for something to use as a weapon.", 'story-event');
        gameState.setFlag('metChildren', true);
      }
    },
    
    village_entrance: {
      name: "Village Entrance",
      scene: "village_entrance",
      description: "You stand at the entrance to a modest village. Simple wooden buildings line a central dirt road. Villagers move about, though they seem wary and on edge.",
      exits: {
        east: "village_outskirts",
        west: "village_square",
        north: "village_smithy",
        south: "village_inn"
      },
      features: [
        {
          keywords: ["buildings", "houses"],
          description: "The buildings are simple but sturdy, made of wood with thatched roofs."
        },
        {
          keywords: ["villagers", "people"],
          description: "The villagers glance at you with a mixture of hope and suspicion. They seem troubled by something."
        }
      ],
      onFirstVisit: (gameState, terminal) => {
        if (gameState.getFlag('savedChildren')) {
          terminal.print("As you enter the village, people turn to look at you. Word of your rescue of the children has already spread.", 'story-event');
          terminal.print("An older man approaches you. 'You saved those children! Please, our village needs help with another creature that's been terrorizing us.'", 'npc-dialog');
          gameState.setFlag('visitedVillage', true);
        } else {
          terminal.print("The villagers eye you warily as you enter. You hear whispers about children being attacked outside the village.", 'story-event');
          gameState.setFlag('visitedVillage', true);
        }
      }
    },
    
    village_square: {
      name: "Village Square",
      scene: "village_square",
      description: "The central square of the village. A well sits in the middle, and villagers gather in small groups, speaking in hushed tones. A village elder stands near the well.",
      exits: {
        east: "village_entrance",
        north: "village_elder_house",
        south: "village_market"
      },
      npcs: ["village_elder"],
      features: [
        {
          keywords: ["well"],
          description: "A stone well stands in the center of the square, providing water for the village."
        },
        {
          keywords: ["villagers", "people", "groups"],
          description: "The villagers speak quietly among themselves, occasionally glancing in your direction."
        }
      ]
    },
    
    village_smithy: {
      name: "Village Smithy",
      scene: "village_smithy",
      description: "The village blacksmith's shop. The forge is hot, and the sound of hammering fills the air. Tools and weapons line the walls.",
      exits: {
        south: "village_entrance"
      },
      npcs: ["blacksmith"],
      items: ["rusty_sword"],
      features: [
        {
          keywords: ["forge", "furnace"],
          description: "The forge glows with hot coals, ready for metalworking."
        },
        {
          keywords: ["tools", "weapons"],
          description: "Various tools and simple weapons hang on the walls or rest on racks."
        }
      ]
    },
    
    village_inn: {
      name: "Village Inn",
      scene: "village_inn",
      description: "A cozy inn with a few tables and a small bar. A fire crackles in the hearth, providing warmth and light.",
      exits: {
        north: "village_entrance"
      },
      npcs: ["innkeeper"],
      features: [
        {
          keywords: ["fire", "hearth", "fireplace"],
          description: "A warm fire burns in the stone hearth, casting flickering shadows around the room."
        },
        {
          keywords: ["tables", "chairs"],
          description: "Wooden tables and chairs are arranged around the room, most of them empty."
        },
        {
          keywords: ["bar"],
          description: "A simple wooden bar stands along one wall, with a few bottles and mugs behind it."
        }
      ]
    },
    
    village_elder_house: {
      name: "Village Elder's House",
      scene: "village_elder_house",
      description: "The home of the village elder. It's larger than most houses in the village, with bookshelves lining the walls and a large table in the center.",
      exits: {
        south: "village_square"
      },
      items: ["leather_armor"],
      features: [
        {
          keywords: ["bookshelves", "books"],
          description: "The bookshelves contain old tomes and scrolls, many of them appearing to be historical records."
        },
        {
          keywords: ["table"],
          description: "A large wooden table dominates the center of the room, with a map of the surrounding area spread across it."
        },
        {
          keywords: ["map"],
          description: "The map shows the village and surrounding forest. A location to the north is marked with a red X and labeled 'Creature's Den'.",
          revealsItem: "map_to_den",
          autoTake: true
        },
        {
          keywords: ["scroll", "scrolls", "parchment"],
          description: "Among the scrolls, one catches your eye. It bears a royal seal and mentions something about a 'Knight Commander'.",
          onExamine: (gameState, terminal) => {
            if (!gameState.memoryFragments.includes('royal_scroll')) {
              gameState.memoryFragments.push('royal_scroll');
              terminal.print("As you read the scroll, a memory flashes: You see yourself kneeling before a throne, receiving a sword from a crowned woman. 'Protect the realm, Sir Knight,' she says.", 'memory-flash');
              gameState.setFlag('rememberedKnighthood', true);
            } else {
              terminal.print("The royal scroll still bears the seal of your former queen.", 'description');
            }
          }
        }
      ]
    },
    
    village_market: {
      name: "Village Market",
      scene: "village_market",
      description: "The village market area. Several stalls are set up, though many are empty or abandoned. A few villagers browse the remaining goods.",
      exits: {
        north: "village_square"
      },
      npcs: ["merchant"],
      features: [
        {
          keywords: ["stalls", "stands"],
          description: "Most of the market stalls are empty or in disrepair. The few that remain open offer basic goods."
        },
        {
          keywords: ["goods", "wares", "merchandise"],
          description: "The available goods are simple: some food, cloth, and basic tools. Nothing particularly valuable."
        }
      ]
    },
    
    forest_path_north: {
      name: "Forest Path - North",
      scene: "forest_path",
      description: "The forest path continues northward. The trees are thinner here, allowing more sunlight to filter through.",
      exits: {
        south: "crossroads",
        north: {
          locationId: "creature_den_entrance",
          condition: (gameState) => gameState.hasItem('map_to_den'),
          blockedMessage: "The path seems to continue north, but you're not sure where it leads. Perhaps someone in the village would know."
        }
      },
      features: [
        {
          keywords: ["trees", "forest"],
          description: "The forest is less dense here, with more space between the trees."
        },
        {
          keywords: ["path"],
          description: "The dirt path winds northward through the forest."
        },
        {
          keywords: ["sunlight", "light"],
          description: "Sunlight filters through the canopy, creating dappled patterns on the ground."
        }
      ]
    },
    
    creature_den_entrance: {
      name: "Creature's Den - Entrance",
      scene: "cave_entrance",
      description: "A dark cave mouth opens in the side of a small hill. Strange scratches mark the rocks around the entrance, and an unnatural silence hangs in the air.",
      exits: {
        south: "forest_path_north",
        north: "creature_den_interior"
      },
      features: [
        {
          keywords: ["cave", "entrance", "mouth"],
          description: "The cave entrance is roughly circular, about seven feet in diameter. Claw marks surround the opening."
        },
        {
          keywords: ["scratches", "marks", "claw", "claws"],
          description: "Deep gouges in the stone suggest a creature with formidable claws. Some marks are fresh."
        },
        {
          keywords: ["hill"],
          description: "The hill is small but steep, covered in sparse vegetation. The cave appears to go deep inside."
        }
      ]
    },
    
    creature_den_interior: {
      name: "Creature's Den - Interior",
      scene: "cave_interior",
      description: "The inside of the cave is damp and dark. Bones litter the floor, and a foul smell permeates the air. At the back of the cave, a large creature stirs.",
      exits: {
        south: "creature_den_entrance"
      },
      npcs: ["cave_creature"],
      items: [],
      features: [
        {
          keywords: ["bones", "remains"],
          description: "Animal bones are scattered across the floor, picked clean. Some appear to be from livestock, others from forest animals."
        },
        {
          keywords: ["smell", "odor", "stench"],
          description: "A putrid smell fills the cave—a mixture of rotting meat and something else, something unnatural."
        }
      ],
      onFirstVisit: (gameState, terminal) => {
        terminal.print("As your eyes adjust to the darkness, you see a large, twisted creature at the back of the cave. It was once a bear, but now it's something else—its form warped by dark magic, with extra limbs and glowing red eyes.", 'story-event');
        terminal.print("The creature growls as it notices you, rising to its feet and preparing to attack!", 'story-event');
      }
    },
    
    forest_path_east: {
      name: "Forest Path - East",
      scene: "forest_path",
      description: "The forest path extends eastward. The trees here are older and taller, with thick canopies that block much of the sunlight.",
      exits: {
        west: "crossroads",
        east: "forest_clearing"
      },
      features: [
        {
          keywords: ["trees", "forest"],
          description: "Ancient trees tower overhead, their massive trunks covered in moss and lichen."
        },
        {
          keywords: ["path"],
          description: "The dirt path winds through the massive trees, occasionally obscured by roots and undergrowth."
        },
        {
          keywords: ["canopy", "leaves"],
          description: "The dense canopy high above allows only occasional shafts of sunlight to reach the forest floor."
        }
      ]
    },
    
    forest_clearing: {
      name: "Forest Clearing",
      scene: "forest_clearing",
      description: "A circular clearing in the forest. Sunlight streams down, illuminating a small pond in the center. The water reflects the sky above, unnaturally still and clear.",
      exits: {
        west: "forest_path_east",
        east: "deep_forest"
      },
      features: [
        {
          keywords: ["pond", "water", "pool"],
          description: "The pond's surface is mirror-like, reflecting the sky perfectly. As you look closer, you see not just the sky's reflection, but fleeting images—a castle, a crowned woman, a man in armor...",
          onExamine: (gameState, terminal) => {
            if (!gameState.memoryFragments) {
              gameState.memoryFragments = [];
            }
            
            if (!gameState.memoryFragments.includes('pond_visions')) {
              gameState.memoryFragments.push('pond_visions');
              terminal.print("The images in the water become clearer: You see yourself in shining armor, standing in a great hall. A beautiful queen speaks: 'Rise, Sir Knight. The kingdom needs your courage.'", 'memory-flash');
              gameState.setFlag('rememberedKnight', true);
              terminal.print("You remember now—you are a knight! But why were you on that road, and what happened to your armor and weapons?", 'memory-flash');
            } else if (gameState.memoryFragments.length >= 3) {
              terminal.print("The pond shows you more: A dark wizard casting a spell, your memories being torn away as you fall unconscious. You remember now—you were sent to stop him!", 'memory-flash');
              if (!gameState.memoryFragments.includes('wizard_betrayal')) {
                gameState.memoryFragments.push('wizard_betrayal');
                gameState.setFlag('rememberedMission', true);
              }
            } else {
              terminal.print("The pond's surface ripples gently, but the visions remain unclear. Perhaps more memories would help focus what you see here.", 'description');
            }
          }
        },
        {
          keywords: ["clearing"],
          description: "The clearing is a perfect circle, as if deliberately created rather than naturally formed."
        },
        {
          keywords: ["sunlight", "light"],
          description: "Sunlight fills the clearing, warm and bright compared to the shadowy forest around it."
        }
      ]
    },
    
    deep_forest: {
      name: "Deep Forest",
      scene: "deep_forest",
      description: "The deepest part of the forest. The trees here are ancient and massive, their roots creating a maze on the forest floor. Strange glowing fungi grow on the trees, providing an eerie blue light.",
      exits: {
        west: "forest_clearing",
        east: {
          locationId: "wizard_tower_base",
          condition: (gameState) => gameState.getFlag('rememberedWizard'),
          blockedMessage: "The forest seems to continue eastward, but something makes you hesitate. You feel you're not ready to go that way yet."
        }
      },
      features: [
        {
          keywords: ["trees", "forest"],
          description: "The trees here must be centuries old, with trunks wider than a man is tall. They seem to watch you with ancient awareness."
        },
        {
          keywords: ["roots"],
          description: "Massive roots snake across the ground, creating natural steps and barriers."
        },
        {
          keywords: ["fungi", "mushrooms", "glow"],
          description: "Bioluminescent fungi grow on the trees and roots, emitting a soft blue glow that illuminates the forest with otherworldly light.",
          onExamine: (gameState, terminal) => {
            if (!gameState.getFlag('rememberedWizard')) {
              terminal.print("As you touch one of the glowing mushrooms, another memory flashes in your mind: a tall man in flowing robes, his hands crackling with energy. 'Your queen cannot protect you now, knight,' he sneers. 'My magic will twist this land until it bows to me!'", 'memory-flash');
              gameState.setFlag('rememberedWizard', true);
              terminal.print("The wizard! He attacked you... he must have taken the queen! You must find his tower and stop him before his corruption spreads further.", 'memory-flash');
            }
          }
        }
      ]
    },
    
    wizard_tower_base: {
      name: "Wizard's Tower - Base",
      scene: "wizard_tower_exterior",
      description: "A tall, twisted tower rises before you, its black stone seeming to absorb the light around it. The forest has been cleared in a perfect circle around the structure, and the ground is barren and cracked.",
      exits: {
        west: "deep_forest",
        enter: "wizard_tower_entrance"
      },
      features: [
        {
          keywords: ["tower", "structure"],
          description: "The tower spirals upward, its architecture defying natural laws. Windows glow with an unnatural purple light at irregular intervals along its height."
        },
        {
          keywords: ["ground", "earth", "soil"],
          description: "The ground around the tower is dead and cracked, as if all life has been drained from it."
        },
        {
          keywords: ["door", "entrance"],
          description: "A heavy iron door stands at the base of the tower, covered in strange arcane symbols."
        },
        {
          keywords: ["symbols", "runes", "markings"],
          description: "The arcane symbols pulse with a faint purple light. As you study them, they seem familiar...",
          onExamine: (gameState, terminal) => {
            if (gameState.getFlag('rememberedMission') && !gameState.memoryFragments.includes('tower_symbols')) {
              gameState.memoryFragments.push('tower_symbols');
              terminal.print("The symbols trigger a memory: You remember studying these same runes in the royal library, preparing for your mission to stop the dark wizard Malachar!", 'memory-flash');
              gameState.setFlag('rememberedWizardName', true);
            } else if (!gameState.getFlag('rememberedMission')) {
              terminal.print("The symbols seem familiar, but you can't quite place where you've seen them before.", 'description');
            } else {
              terminal.print("The symbols of Malachar's dark magic. You know what lies beyond this door.", 'description');
            }
          }
        }
      ],
      onFirstVisit: (gameState, terminal) => {
        terminal.print("As you approach the tower, your final memories return in a rush: You led a group of knights to confront the wizard after he threatened the queen. There was a battle... your companions fell... and the wizard struck you down with a spell that sent you flying through the air.", 'memory-flash');
        terminal.print("You remember crashing to the ground at the crossroads, your armor shattered, your mind wiped clean by the impact. But now you remember everything—and the queen is still in danger.", 'memory-flash');
        gameState.setFlag('rememberedQueen', true);
        gameState.setFlag('foundTower', true);
      }
    },
    
    forest_path_south: {
      name: "Forest Path - South",
      scene: "forest_path",
      description: "The forest path leads southward. The trees thin out slightly here, and you can see rolling hills in the distance.",
      exits: {
        north: "crossroads",
        south: "hillside"
      },
      features: [
        {
          keywords: ["trees", "forest"],
          description: "The forest is less dense here, with more space between the trees."
        },
        {
          keywords: ["path"],
          description: "The dirt path winds southward toward the hills."
        },
        {
          keywords: ["hills", "distance"],
          description: "Rolling hills can be seen to the south, their slopes covered in tall grass."
        }
      ]
    },
    
    hillside: {
      name: "Hillside",
      scene: "hillside",
      description: "You stand on a grassy hillside overlooking a vast valley. In the far distance, you can see what appears to be a castle or large stone structure.",
      exits: {
        north: "forest_path_south"
      },
      features: [
        {
          keywords: ["hills", "hillside", "grass"],
          description: "The hills are covered in tall grass that waves gently in the breeze."
        },
        {
          keywords: ["valley"],
          description: "A wide valley stretches before you, with fields and small clusters of trees."
        },
        {
          keywords: ["castle", "structure", "distance"],
          description: "In the far distance, you can make out what appears to be a castle or large stone structure. It's too far to reach from here, but seeing it triggers a sense of familiarity.",
          onExamine: (gameState, terminal) => {
            if (!gameState.getFlag('rememberedKnight')) {
              terminal.print("As you gaze at the distant castle, you feel a strong sense of duty and belonging. Though you can't remember details, you know that place is important to you.", 'memory-flash');
            }
          }
        }
      ]
    }
  },
  
  // Items
  items: {
    branch: {
      name: "Sturdy Branch",
      description: "A thick, sturdy branch that could serve as a makeshift weapon.",
      keywords: ["branch", "stick", "weapon"],
      type: "weapon",
      damage: 5,
      takeable: true
    },
    
    rusty_sword: {
      name: "Rusty Sword",
      description: "An old sword with a rusty blade. Despite its condition, it's still sharp enough to be effective.",
      keywords: ["sword", "rusty", "blade", "weapon"],
      type: "weapon",
      damage: 10,
      takeable: true,
      hidden: true,
      revealFlag: 'visitedVillage'
    },
    
    leather_armor: {
      name: "Leather Armor",
      description: "A simple set of leather armor. It's worn but serviceable, offering basic protection.",
      keywords: ["armor", "leather", "protection"],
      type: "armor",
      protection: 3,
      speedPenalty: 1,
      takeable: true,
      hidden: true,
      revealFlag: 'visitedVillage'
    },
    
    map_to_den: {
      name: "Map to Creature's Den",
      description: "A rough map showing the location of a creature's den north of the village.",
      keywords: ["map", "parchment", "paper"],
      type: "quest",
      takeable: true,
      usable: true,
      onUse: (gameState, terminal) => {
        terminal.print("You study the map. It shows a path leading north from the crossroads to a small cave in the hills. The cave is marked as 'Creature's Den'.", 'item-use');
        return true;
      }
    },
    
    steel_sword: {
      name: "Steel Sword",
      description: "A well-crafted steel sword with a sharp edge and good balance.",
      keywords: ["sword", "steel", "blade", "weapon"],
      type: "weapon",
      damage: 15,
      takeable: true
    },
    
    chainmail: {
      name: "Chainmail Armor",
      description: "A shirt of interlocking metal rings, providing good protection without sacrificing too much mobility.",
      keywords: ["chainmail", "armor", "mail", "chain"],
      type: "armor",
      protection: 5,
      speedPenalty: 2,
      takeable: true
    },
    
    health_potion: {
      name: "Health Potion",
      description: "A small vial containing a red liquid that smells of herbs and magic.",
      keywords: ["potion", "health", "vial", "healing"],
      type: "consumable",
      takeable: true,
      usable: true,
      usableInCombat: true,
      onUse: (gameState, terminal) => {
        gameState.heal(25);
        terminal.print("You drink the potion. A warm sensation spreads through your body as your wounds begin to close.", 'item-use');
        terminal.print(`Your health is now ${gameState.playerHealth}/${gameState.playerMaxHealth}.`, 'status-update');
        
        // Remove from inventory after use
        gameState.removeFromInventory('health_potion');
        return true;
      },
      onCombatUse: (gameState, terminal, enemy, combatSystem) => {
        gameState.heal(25);
        terminal.print("You quickly drink the potion. A warm sensation spreads through your body as your wounds begin to close.", 'item-use');
        terminal.print(`Your health is now ${gameState.playerHealth}/${gameState.playerMaxHealth}.`, 'status-update');
        
        // Remove from inventory after use
        gameState.removeFromInventory('health_potion');
        return true;
      }
    },
    
    knight_signet: {
      name: "Knight's Signet Ring",
      description: "A heavy gold ring bearing the royal coat of arms. It feels familiar in your hand.",
      keywords: ["ring", "signet", "gold", "royal"],
      type: "quest",
      takeable: true,
      hidden: true,
      revealFlag: 'defeatedCaveCreature',
      onTake: (gameState, terminal) => {
        if (!gameState.memoryFragments.includes('knight_signet')) {
          gameState.memoryFragments.push('knight_signet');
          terminal.print("As you slip the ring onto your finger, memories flood back: You remember your oath of service, your training in the royal guard, and your true name—Sir Aldric of Westmarch!", 'memory-flash');
          gameState.setFlag('rememberedName', true);
          gameState.playerName = 'Sir Aldric of Westmarch';
        }
      }
    },
    
    memory_crystal: {
      name: "Memory Crystal",
      description: "A small, glowing crystal that pulses with inner light. It seems to resonate with your thoughts.",
      keywords: ["crystal", "memory", "gem", "stone"],
      type: "quest",
      takeable: true,
      usable: true,
      onUse: (gameState, terminal) => {
        if (gameState.memoryFragments.length >= 5) {
          terminal.print("The crystal glows brightly as it absorbs your recovered memories. You feel your mind becoming clearer and more focused. Your maximum health increases!", 'memory-flash');
          gameState.playerMaxHealth += 15;
          gameState.heal(15);
          return true; // Crystal is consumed
        } else {
          terminal.print("The crystal glows faintly, but you need more memories to unlock its power.", 'description');
          return false; // Crystal is not consumed
        }
      }
    },
    
    wolf_pelt: {
      name: "Wolf Pelt",
      description: "A rough pelt from a twisted wolf. The fur is patchy and has an unnatural texture, but it might be useful for crafting.",
      keywords: ["pelt", "fur", "hide", "wolf"],
      type: "material",
      takeable: true
    },
    
    twisted_claw: {
      name: "Twisted Claw",
      description: "A sharp claw from a corrupted creature. It's unnaturally hard and seems to shimmer with dark energy.",
      keywords: ["claw", "talon", "twisted"],
      type: "material",
      takeable: true
    },
    
    bear_hide: {
      name: "Bear Hide",
      description: "A thick hide from a massive bear. Despite the creature's corruption, the hide is still valuable and could be used for armor.",
      keywords: ["hide", "skin", "bear"],
      type: "material",
      takeable: true
    },
    
    bear_claws: {
      name: "Bear Claws",
      description: "Massive claws from a twisted bear. They're razor-sharp and could potentially be crafted into weapons.",
      keywords: ["claws", "talons", "bear"],
      type: "material",
      takeable: true
    }
  },
  
  // NPCs
  npcs: {
    child1: {
      name: "Village Boy",
      description: "A young boy, no more than ten years old, with tousled hair and wide, frightened eyes.",
      presenceDescription: "A young boy cowers against a tree, trying to protect a smaller girl.",
      keywords: ["boy", "child", "kid", "children"],
      talkable: true,
      attackable: false,
      hidden: false,
      onTalk: (gameState, terminal, storyEngine) => {
        if (!gameState.getFlag('savedChildren')) {
          terminal.print("'Please help us!' the boy cries. 'That monster is going to eat us!'", 'npc-dialog');
        } else {
          terminal.print("'Thank you for saving us,' the boy says, still trembling. 'That thing came from the forest. There are more of them around the village lately.'", 'npc-dialog');
        }
      }
    },
    
    child2: {
      name: "Village Girl",
      description: "A small girl with braided hair, tears streaming down her face.",
      presenceDescription: "A little girl huddles close to the boy, sobbing quietly.",
      keywords: ["girl", "child", "kid", "children"],
      talkable: true,
      attackable: false,
      hidden: false,
      onTalk: (gameState, terminal, storyEngine) => {
        if (!gameState.getFlag('savedChildren')) {
          terminal.print("The girl is too frightened to speak, only sobbing and pointing at the creature.", 'npc-dialog');
        } else {
          terminal.print("'Are you a knight?' the girl asks between sniffles. 'My papa says knights protect people from monsters.'", 'npc-dialog');
          
          if (!gameState.getFlag('rememberedKnight')) {
            terminal.print("Something about her words resonates with you. Knight... The title feels right somehow.", 'memory-flash');
          }
        }
      }
    },
    
    small_creature: {
      name: "Twisted Wolf",
      description: "What might once have been a wolf, now warped by dark magic. Its fur is patchy, revealing scaled skin underneath, and its eyes glow with an unnatural red light.",
      presenceDescription: "A twisted, wolf-like creature snarls and advances toward the children, its movements jerky and unnatural.",
      combatDescription: "The creature's jaws drip with saliva as it turns its attention to you, growling deeply.",
      keywords: ["creature", "monster", "wolf", "beast"],
      talkable: false,
      attackable: true,
      hidden: false,
      health: 20,
      maxHealth: 20,
      damage: 4,
      speed: 6,
      onDefeat: (gameState, terminal, storyEngine) => {
        terminal.print("The twisted wolf collapses, its unnatural red glow fading from its eyes. The children are safe!", 'combat-aftermath');
        gameState.setFlag('savedChildren', true);
        
        // Remove the creature and update the location description
        const location = storyEngine.locations['village_outskirts'];
        location.description = "The forest thins as the path approaches what appears to be a small village. The children you saved have run back to safety.";        
        
        // Remove the creature from the location's NPCs
        const creatureIndex = location.npcs.indexOf('small_creature');
        if (creatureIndex !== -1) {
          location.npcs.splice(creatureIndex, 1);
        }
        
        // Remove the children from the location's NPCs since they ran to safety
        const child1Index = location.npcs.indexOf('child1');
        if (child1Index !== -1) {
          location.npcs.splice(child1Index, 1);
        }
        
        const child2Index = location.npcs.indexOf('child2');
        if (child2Index !== -1) {
          location.npcs.splice(child2Index, 1);
        }
        
        terminal.print("'Thank you!' the boy cries, helping the girl to her feet. 'We need to get back to the village. You should come too—our elder will want to thank you.'", 'npc-dialog');
        terminal.print("The children run toward the village to the west.", 'story-event');
        
        // Prevent corpse creation for this special story encounter
        return { preventCorpse: true };
      }
    },
    
    village_elder: {
      name: "Village Elder",
      description: "An elderly man with a long gray beard and kind eyes that have seen much hardship. He walks with the aid of a wooden staff.",
      presenceDescription: "An elderly man with a long gray beard stands near the well, watching you with interest.",
      keywords: ["elder", "old man", "man", "villager"],
      talkable: true,
      attackable: false,
      hidden: false,
      onTalk: (gameState, terminal, storyEngine) => {
        if (gameState.getFlag('savedChildren')) {
          terminal.print("'You have our thanks for saving those children,' the elder says. 'These are dark times. Strange creatures have been appearing in the forest, twisted by some evil magic.'", 'npc-dialog');
          terminal.print("'One larger beast has made its den north of here. It's been taking our livestock and threatening travelers. If you could deal with it, we would be most grateful. I've marked its location on a map in my house.'", 'npc-dialog');
          
          if (gameState.getFlag('defeatedVillageMonster')) {
            terminal.print("'You've defeated the creature? Remarkable! You have the bearing of a warrior—perhaps even a knight. There are rumors that the royal knights were defeated by an evil wizard who has captured the queen. These twisted creatures began appearing after that.'", 'npc-dialog');
          }
        } else {
          terminal.print("'Welcome, stranger,' the elder says. 'You seem lost. Our village has seen better days—we're plagued by strange creatures from the forest.'", 'npc-dialog');
        }
      }
    },
    
    blacksmith: {
      name: "Village Blacksmith",
      description: "A muscular woman with soot-stained arms and a leather apron. Her hands are calloused from years of metalwork.",
      presenceDescription: "A strong-looking woman works at the forge, hammering a piece of metal.",
      keywords: ["blacksmith", "smith", "woman"],
      talkable: true,
      attackable: false,
      hidden: false,
      onTalk: (gameState, terminal, storyEngine) => {
        if (gameState.getFlag('savedChildren')) {
          terminal.print("'Heard you saved those kids,' the blacksmith says, pausing her work. 'We need more people like you around here. Take that old sword if you want—it's not much, but it's better than nothing.'", 'npc-dialog');
          
          // Make the rusty sword visible
          storyEngine.items['rusty_sword'].hidden = false;
        } else {
          terminal.print("'Don't have time to chat,' the blacksmith says without looking up from her work. 'Unless you're buying something.'", 'npc-dialog');
        }
      }
    },
    
    innkeeper: {
      name: "Innkeeper",
      description: "A portly man with a friendly face and a stained apron. He has the look of someone who enjoys sampling his own cooking.",
      presenceDescription: "A heavyset man stands behind the bar, wiping a mug with a cloth.",
      keywords: ["innkeeper", "barkeeper", "bartender", "man"],
      talkable: true,
      attackable: false,
      hidden: false,
      onTalk: (gameState, terminal, storyEngine) => {
        terminal.print("'Welcome to the Twisted Oak Inn,' the innkeeper says with a smile. 'Not many travelers these days, what with the strange creatures about. Can I get you something to drink?'", 'npc-dialog');
        
        if (gameState.getFlag('defeatedVillageMonster')) {
          terminal.print("'You're the one who killed that beast in the cave? Drinks are on the house! We haven't had a proper hero around here since... well, since before the wizard took the queen.'", 'npc-dialog');
          
          if (!gameState.hasItem('health_potion')) {
            terminal.print("'Here, take this healing potion. A traveling merchant left it as payment. Might come in handy for someone like you.'", 'npc-dialog');
            
            // Add health potion to inventory
            gameState.addToInventory({
              id: 'health_potion',
              ...storyEngine.items['health_potion']
            });
            
            terminal.print("You received: Health Potion", 'item-received');
          }
        }
      }
    },
    
    merchant: {
      name: "Traveling Merchant",
      description: "A thin woman with sharp eyes and colorful clothes. She has a small cart of goods beside her.",
      presenceDescription: "A merchant with a small cart watches you carefully, evaluating you as a potential customer.",
      keywords: ["merchant", "trader", "seller", "woman"],
      talkable: true,
      attackable: false,
      hidden: false,
      onTalk: (gameState, terminal, storyEngine) => {
        terminal.print("'Interested in trading?' the merchant asks. 'I don't have much these days—the roads are too dangerous with all these creatures about. I heard a wizard is responsible, twisting animals with dark magic.'", 'npc-dialog');
        
        if (gameState.getFlag('rememberedWizard')) {
          terminal.print("'A wizard, you say? Yes, I remember now. He attacked the royal castle and took the queen. I need to find his tower.'", 'player-dialog');
          
          terminal.print("The merchant's eyes widen. 'The wizard's tower? They say it's deep in the eastern forest, but no one who's gone looking for it has returned. You'd have to be mad—or a hero—to go there.'", 'npc-dialog');
        }
      }
    },
    
    cave_creature: {
      name: "Twisted Bear",
      description: "A massive bear warped by dark magic. Its body is asymmetrical, with extra limbs growing from its torso, and its eyes glow with malevolent red light.",
      presenceDescription: "A huge, twisted bear-like creature growls at the back of the cave, its red eyes fixed on you.",
      combatDescription: "The monstrous bear rises to its full height, easily eight feet tall. Multiple limbs end in razor-sharp claws, and its jaws are filled with too many teeth.",
      keywords: ["creature", "monster", "bear", "beast"],
      talkable: false,
      attackable: true,
      hidden: false,
      health: 50,
      maxHealth: 50,
      damage: 8,
      speed: 4,
      rewards: {
        healthIncrease: 10,
        items: ['chainmail', 'steel_sword', 'knight_signet']
      },
      onDefeat: (gameState, terminal, storyEngine) => {
        terminal.print("The twisted bear collapses with a final roar. As it dies, you notice its form seems to partially revert to that of a normal bear, though the corruption is too deep to fully disappear.", 'combat-aftermath');
        gameState.setFlag('defeatedVillageMonster', true);
        
        terminal.print("At the back of the cave, you find what appears to be the creature's hoard—items taken from its victims.", 'story-event');
        
        // Remove the creature from the location's NPCs
        const location = storyEngine.locations['creature_den_interior'];
        const index = location.npcs.indexOf('cave_creature');
        if (index !== -1) {
          location.npcs.splice(index, 1);
        }
        
        // Update the location description
        location.description = "The inside of the cave is damp and dark. Bones litter the floor, and a foul smell permeates the air. The twisted bear lies dead at the back of the cave.";
      }
    }
  }
};