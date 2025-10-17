# Ren'Py Sample Script
# Visual Novel Game Translation Sample

label start:
    "Welcome to our adventure!"
    
    hero "Hello, I'm the main character."
    npc "Welcome to our village, traveler!"
    
    menu:
        "What will you do?"
        
        "Explore the village":
            jump village
        
        "Go to the mountain":
            jump mountain
        
        "Rest at the inn":
            jump inn

label village:
    "You walk around the village."
    villager "The dragon has been terrorizing us!"
    hero "I will defeat the dragon!"
    
label mountain:
    "You climb the mountain peak."
    "The dragon awaits!"
    dragon "Who dares disturb my slumber?"
    hero "Prepare to fight!"
    
label inn:
    "You rest at the inn."
    innkeeper "That will be 50 gold."
    "Your HP and Mana are fully restored."