# Satoshi's Dream — Art Asset Specification

## Game Overview
Satoshi's Dream is a 3D idle/RPG Bitcoin mining game played in a web browser. The player walks around a small town, entering buildings to mine Bitcoin, buy hardware, trade, and progress. The town is rendered using Babylon.js (WebGL) with a camera looking down at ~45 degrees.

## Technical Requirements
- **Format**: GLB (binary glTF 2.0)
- **Poly count**: 500-3,000 triangles per model (low-poly stylized)
- **Textures**: Baked into vertex colors OR single shared texture atlas (PNG, max 1024x1024)
- **Scale**: 1 unit = ~1 meter. Buildings should be 8-15 units tall, 10-20 units wide
- **Style**: Stylized low-poly, colorful, clean. Think Kenney assets, POLYGON packs, or Crossy Road buildings. NOT photorealistic.
- **Colors**: Warm, inviting palette. Each building should be visually distinct and recognizable from a distance.

---

## BUILDINGS NEEDED (20 models)

### 1. Mining HQ
- **Purpose**: Main Bitcoin mining facility
- **Look**: Industrial building with satellite dishes on roof, server room vibe, orange/gold accent color
- **Size**: Large (20x15 units, 12 units tall)
- **Key details**: Antenna/satellite dish on roof, glowing windows, "digital" feel

### 2. Hardware Shop
- **Purpose**: Buy mining equipment
- **Look**: Electronics store/computer shop with a display window
- **Size**: Medium (15x15 units, 10 units tall)
- **Color**: Blue accents
- **Key details**: Display window showing computers, small sign

### 3. Exchange
- **Purpose**: Sell Bitcoin for USD
- **Look**: Modern financial office, glass front, stock ticker vibe
- **Size**: Medium (15x10 units, 10 units tall)
- **Color**: Green/teal accents
- **Key details**: Large windows, modern architecture

### 4. Bank
- **Purpose**: Loans, bribes, ticket payment
- **Look**: Classical bank building with columns, imposing
- **Size**: Large (20x15 units, 15 units tall — tallest building)
- **Color**: Gold/cream
- **Key details**: Columns at entrance, grand doors, clock on facade

### 5. Diner
- **Purpose**: Buy food for energy
- **Look**: Classic American diner, red/chrome, retro
- **Size**: Small (15x10 units, 6 units tall)
- **Color**: Red with chrome/silver trim
- **Key details**: Neon sign, large windows, awning over entrance

### 6. Coffee Shop
- **Purpose**: Buy drinks for energy
- **Look**: Cozy cafe with outdoor seating area
- **Size**: Small (10x10 units, 6 units tall)
- **Color**: Brown/warm wood tones
- **Key details**: Small awning, cafe tables outside, coffee cup sign

### 7. University
- **Purpose**: Research upgrades
- **Look**: Academic building with tower/bell tower
- **Size**: Large (20x15 units, 13 units tall)
- **Color**: Purple/stone
- **Key details**: Clock tower or bell tower, arched windows, ivy

### 8. Hospital
- **Purpose**: Full energy/heat restore
- **Look**: Modern hospital with red cross
- **Size**: Medium-large (15x15 units, 12 units tall)
- **Color**: White with red accents
- **Key details**: Red cross symbol, ambulance bay, clean modern look

### 9. Internet Cafe
- **Purpose**: Dark web purchases
- **Look**: Sketchy cyber cafe, neon signs, dark
- **Size**: Medium (15x10 units, 8 units tall)
- **Color**: Dark teal/cyan with neon glow
- **Key details**: Neon signs, dark windows, slightly run-down look

### 10. Casino
- **Purpose**: Gambling mini-games
- **Look**: Flashy casino with lights
- **Size**: Medium-large (20x15 units, 10 units tall)
- **Color**: Purple/magenta with gold
- **Key details**: Marquee lights, grand entrance, flashy facade

### 11. Post Office
- **Purpose**: Mail orders, delivery quests
- **Look**: Government/postal building, flag
- **Size**: Medium (15x10 units, 8 units tall)
- **Color**: Gray/blue
- **Key details**: Flag, mailbox outside, official look

### 12. Gym
- **Purpose**: Increase max energy
- **Look**: Fitness center with large windows
- **Size**: Small-medium (15x10 units, 7 units tall)
- **Color**: Orange
- **Key details**: Large windows showing equipment, strong/bold signage

### 13. Real Estate
- **Purpose**: Housing upgrades
- **Look**: Real estate office with house models in window
- **Size**: Small-medium (15x10 units, 7 units tall)
- **Color**: Green
- **Key details**: "For Sale" signs, model houses in display

### 14. Car Dealership
- **Purpose**: Buy vehicles
- **Look**: Car showroom with large glass front, car on display
- **Size**: Large (20x10 units, 6 units tall — wide and low)
- **Color**: Silver/gray
- **Key details**: Large glass panels, car visible inside, parking lot area

### 15. Pet Shop
- **Purpose**: Adopt pets for bonuses
- **Look**: Cute pet store with paw print decorations
- **Size**: Small (10x10 units, 6 units tall)
- **Color**: Pink/coral
- **Key details**: Paw prints, cute facade, pet silhouettes in windows

### 16. Pawn Shop
- **Purpose**: Sell hardware for USD
- **Look**: Small cluttered shop, "We Buy Gold" vibe
- **Size**: Small (10x10 units, 6 units tall)
- **Color**: Dark gold/brown
- **Key details**: Cluttered look, barred windows, neon "OPEN" sign

### 17. Utility Company
- **Purpose**: Electricity management, solar panels
- **Look**: Industrial utility building with power lines
- **Size**: Medium (15x10 units, 8 units tall)
- **Color**: Blue-gray
- **Key details**: Power lines, transformer, industrial equipment

### 18. Clothing Store
- **Purpose**: Buy stat-boosting clothing
- **Look**: Boutique/fashion shop with mannequins
- **Size**: Small-medium (15x10 units, 7 units tall)
- **Color**: Pink/mauve
- **Key details**: Display window with mannequins, stylish facade

### 19. Your Home (Apartment)
- **Purpose**: Player's home, sleep, garden, furniture display
- **Look**: Cozy apartment/house — should look residential, not commercial
- **Size**: Small (10x10 units, 7 units tall)
- **Color**: Warm tan/beige
- **Key details**: Residential door, windows with curtains, small yard/balcony

### 20. Home Goods Store
- **Purpose**: Buy furniture and garden seeds
- **Look**: Home improvement/furniture store
- **Size**: Medium (15x10 units, 8 units tall)
- **Color**: Olive green
- **Key details**: Display of furniture in windows, "HOME" signage

---

## OTHER MODELS NEEDED

### 21. Tree (3 variations)
- Variation A: Round canopy deciduous tree (green sphere on brown trunk)
- Variation B: Tall pine/conifer (cone shape)
- Variation C: Small bush/shrub
- **Size**: 3-8 units tall
- **Colors**: Various greens + brown trunk

### 22. Avatar/Character
- Simple humanoid character, ~2 units tall
- Stylized (not realistic) — could be chibi/cute proportions
- Gold/orange Bitcoin-themed outfit
- Should be visible and recognizable from the 45-degree camera angle

### 23. Street Lamp
- Post with light on top
- ~4 units tall
- Should glow at night (emissive material on light part)

### 24. Bench
- Simple park bench, ~2 units wide
- Wood + metal

### 25. Mailbox
- Small blue mailbox for near Post Office
- ~1.5 units tall

### 26. Bitcoin Collectible Orb
- Glowing golden sphere with ₿ symbol
- ~0.5 units diameter
- Should have emissive/glow material

### 27. Craig (Rival NPC)
- Different-looking humanoid character
- Red/dark outfit to contrast with player's gold
- Slightly taller than player avatar
- Smug posture if possible

### 28. Vehicle Models (optional, 3 types)
- Bicycle: simple bike, ~2 units long
- Car: compact sedan, ~4 units long
- Sports car: sleeker, ~4.5 units long

---

## ROAD PIECES (optional — we have procedural roads that work)
If you can create these, they'd replace our flat gray planes:
- Straight road piece (10x10 units)
- Road intersection (10x10)
- Road corner (10x10)
- Sidewalk strip

---

## TEXTURE ATLAS (if not using vertex colors)
- A single 1024x1024 PNG color palette
- Each building references UV coordinates on this atlas
- Similar to Kenney's "colormap.png" approach
- Flat colors work fine — no need for photorealistic textures

---

## DELIVERY FORMAT
- Each model as a separate `.glb` file
- Named: `building-mining-hq.glb`, `building-bank.glb`, `tree-round.glb`, `avatar-player.glb`, etc.
- Place in `/models/` directory
- No external texture dependencies (bake everything into the GLB)

## STYLE REFERENCE
- Kenney City Kit: https://kenney.nl/assets/city-kit-suburban
- POLYGON City Pack: https://syntystore.com/products/polygon-city-pack
- Infinitown: https://demos.littleworkshop.fr/infinitown
- The key qualities: colorful, consistent style, recognizable silhouettes, clean geometry
