# CCNA Arcade - Project Status

**Last Updated:** March 22, 2026
**Version:** 3.1
**Server:** `python -m http.server 5500` in the network-tetris folder

---

## Overview

**CCNA Arcade** (formerly SubnetPro/Network Tetris) is a comprehensive network training game designed to help users master CCNA concepts through arcade-style gameplay.

---

## Game Modes

### 1. Speed Subnet (Arcade Mode)
Quick-fire CIDR training with multiple question categories:

**Question Categories:**
| Category | Description | Difficulty |
|----------|-------------|------------|
| `hosts_to_cidr` | Given host count, find minimum CIDR | All |
| `cidr_to_hosts` | Given CIDR, calculate usable hosts | All |
| `subnet_mask` | Match CIDR to subnet mask | Medium+ |
| `network_class` | Identify IP address class (A/B/C) | All |
| `binary_bits` | Calculate host bits needed | Medium+ |
| `network_address` | Find network address from IP/CIDR | Hard+ |
| `broadcast` | Find broadcast address | Hard+ |
| `first_host` | First usable host IP | Hard+ |
| `last_host` | Last usable host IP | Hard+ |
| `port_number` | Protocol to port matching | Medium+ |
| `wildcard_mask` | Calculate wildcard from subnet mask | Hard+ |
| `private_ip` | Identify RFC 1918 private IPs | All |
| `binary_convert` | Decimal to binary conversion | Hard+ |
| `subnet_in_subnet` | Calculate subnet divisions | Hard+ |

**Features:**
- Weighted random category selection
- Streak-based scoring with multipliers
- Mascot animation ("Bit" rides network cables)
- Keyboard support (1-4 keys)
- Difficulty levels: Easy, Medium, Hard, Master, Nightmare

### 2. Client Scenarios (Puzzle Mode)
Real-world network design challenges:
- 16 client scenarios with unique requirements
- Visual building representation with network animation
- WiFi antenna with signal waves
- Drag-and-drop subnet allocation
- Efficiency scoring and star ratings

### 3. Packet Journey Mode (NEW in v3.0)
Interactive packet flow visualization:

**Scenarios:**
| Scenario | Description | Difficulty |
|----------|-------------|------------|
| `local_web` | HTTP request on local LAN | Easy |
| `remote_web` | HTTP through gateway to internet | Medium |
| `dns_lookup` | DNS resolution process | Easy |
| `arp_discovery` | MAC address resolution | Medium |
| `tcp_handshake` | TCP 3-way handshake | Medium |
| `vlan_basics` | Virtual LAN concepts | Hard |

**Features:**
- Top-down network topology canvas
- "Packie" mascot follows packet path
- OSI layer visualization
- Encapsulation stack display
- Step-by-step explanations

### 4. OSI Trainer Mode (NEW in v3.0)
OSI model quiz training:

**Question Categories:**
- `layer_name` - Identify layer by number
- `layer_number` - Identify number by layer name
- `layer_pdu` - Match PDU to layer
- `layer_protocol` - Match protocol to layer
- `layer_device` - Match device to layer
- `encapsulation_order` - PDU encapsulation sequence
- `layer_function` - Layer functions and responsibilities

**Features:**
- Visual 7-layer diagram with highlighting
- Streak tracking
- Achievement integration

### 5. IOS Commands Module (Enhanced in v3.1)
Two training modes for Cisco IOS commands:

**Multiple Choice Quiz:**
- 50 randomized questions
- Instant feedback with explanations
- Topics: CLI Navigation, Show Commands, VLANs, Trunking, STP, OSPF, EIGRP, Security

**CLI Terminal Simulator (NEW in v3.1):**
- Simulated Cisco IOS terminal interface
- Type actual commands with IOS-style prompts
- Realistic mode switching (User/Privileged/Config modes)
- Simulated IOS output responses
- Tab for hints, arrow keys for history
- 25+ command challenges across all topics
- Streak-based scoring

### 6. Daily Challenge
Timed daily subnetting challenges:
- 15 questions with 2-minute time limit
- Seeded random (same challenge for all users each day)
- Daily themes (CIDR Monday, Binary Tuesday, etc.)
- Weekend bonus multipliers
- Streak tracking for consecutive days
- Leaderboard integration

### 6. Practice Mode
Focused training on weak areas:
- Category selection based on accuracy stats
- Color-coded recommendations (critical, needs-work, good, excellent)
- "Select Weak", "Select All", "Clear" quick actions

---

## Technical Architecture

### File Structure
```
network-tetris/
├── index.html          # Main HTML structure (~810 lines)
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline play
├── css/
│   └── style.css       # All styles (~3380 lines)
├── js/
│   ├── subnet.js       # Core subnet calculations
│   ├── speedsubnet.js  # Speed Subnet game mode (~1470 lines)
│   ├── packetjourney.js# Packet Journey mode (NEW)
│   ├── ositrainer.js   # OSI Trainer mode (NEW)
│   ├── game.js         # Main game controller
│   ├── ui.js           # UI management
│   ├── sounds.js       # Web Audio API sound effects
│   ├── settings.js     # Settings & achievements
│   ├── scenarios.js    # Client scenario data (16 scenarios)
│   ├── mascot.js       # "Bit" mascot animations
│   ├── grid.js         # Grid canvas rendering
│   ├── building.js     # Building visualization
│   ├── requirements.js # Requirement management
│   ├── levels.js       # Level progression
│   ├── stats.js        # Statistics tracking
│   ├── dailychallenge.js# Daily challenge mode
│   ├── tutorial.js     # Tutorial system
│   ├── practice.js     # Practice mode
│   ├── leaderboard.js  # Leaderboard system
│   ├── themes.js       # Theme management (8 themes)
│   └── savedata.js     # Save/load system
├── icons/
│   └── icon.svg        # App icon
└── PROJECT_STATUS.md   # This file
```

### Key Dependencies
- **Font**: Press Start 2P (Google Fonts)
- **PWA**: Service Worker with offline caching
- **Storage**: localStorage for save data

### CSS Theming
Theme variables defined in `:root`:
```css
--color-primary: #00d4ff;    /* Cyan */
--color-secondary: #ff6b9d;  /* Pink */
--color-success: #00ff9d;    /* Green */
--color-warning: #ffd400;    /* Yellow */
--color-danger: #ff4444;     /* Red */
--color-background: #0a0a1a; /* Dark blue */
--color-surface: #1a1a3a;    /* Surface */
```

### Accent Colors by Mode
| Mode | Color | Hex |
|------|-------|-----|
| Speed Subnet | Cyan | #00d4ff |
| Daily Challenge | Gold | #ffd400 |
| Packet Journey | Purple | #9933ff |
| OSI Trainer | Pink | #ff6b9d |

---

## Achievements System

### Core Achievements
| ID | Name | Description |
|----|------|-------------|
| `first_subnet` | First Allocation | Complete first subnet question |
| `combo_master` | Combo Master | Achieve 10x streak |
| `perfect_game` | Perfect Game | 100% accuracy in Speed Subnet |
| `speed_demon` | Speed Demon | Score 10,000+ in Speed Subnet |
| `subnet_scholar` | Subnet Scholar | Answer 500 questions correctly |

### Mode-Specific Achievements
| ID | Name | Description |
|----|------|-------------|
| `packet_journey_first` | Packet Pioneer | Complete first Packet Journey |
| `packet_journey_all` | Network Navigator | Complete all Packet Journey scenarios |
| `packet_journey_perfect` | Flawless Flow | Complete scenario with no mistakes |
| `osi_first` | Layer Learner | Complete first OSI quiz |
| `osi_master` | OSI Expert | Score 2000+ in OSI Trainer |
| `port_expert` | Port Expert | Answer 50 port questions correctly |
| `binary_wizard` | Binary Wizard | Answer 50 binary questions correctly |

### Daily Achievements
| ID | Name | Description |
|----|------|-------------|
| `daily_first` | Daily Challenger | Complete first daily challenge |
| `streak_7` | Weekly Warrior | 7-day daily streak |
| `streak_30` | Monthly Master | 30-day daily streak |

---

## Recent Updates (v3.1)

### New Features
1. **CLI Terminal Simulator** - Type actual IOS commands
   - Simulated terminal with realistic IOS prompts
   - Mode switching: User > Privileged > Config > Interface
   - 25+ command challenges covering navigation, show commands, VLANs, OSPF, STP
   - Tab for hints, command history with arrow keys
   - Simulated IOS output responses
   - Streak-based scoring with difficulty multipliers

2. **IOS Commands Mode Selection** - Choice between quiz and terminal
   - Multiple choice quiz mode (existing)
   - New CLI Terminal simulator mode
   - Visual mode selection cards

3. **Performance Improvements**
   - Self-hosted Press Start 2P font (reduced latency)
   - Deferred script loading for non-critical modules
   - Loading spinner during initial load

4. **Accessibility Improvements**
   - ARIA live regions for screen reader announcements
   - Enhanced focus indicators for keyboard navigation
   - Skip-to-content link
   - Improved color contrast ratios

---

## Previous Updates (v3.0)

### New Features
1. **Packet Journey Mode** - Interactive packet visualization
   - 6 scenarios covering LAN, WAN, DNS, ARP, TCP, VLANs
   - Canvas-based network topology rendering
   - "Packie" mascot with bounce animation
   - Encapsulation stack visualization

2. **OSI Trainer Mode** - OSI model quiz system
   - 7 question categories
   - Visual layer diagram with highlighting
   - Layer-specific color coding

3. **Expanded Speed Subnet** - 5 new question categories:
   - Port numbers (17 common protocols)
   - Wildcard masks
   - Private IP identification (RFC 1918)
   - Binary conversion
   - Subnet-in-subnet calculations

4. **Renamed to CCNA Arcade** - Main menu reorganized with topic sections

### Bug Fixes
1. **3-Answer Bug** - Bulletproof fix ensuring exactly 4 options:
   - Set-based deduplication with string normalization
   - Type-aware fallback generation (numeric, IP, string)
   - Emergency "Option N" fallback as final safety net
   - Console logging for debugging (`[SpeedSubnet]` prefix)

2. **Element ID Mapping** - Fixed Packet Journey init() to use correct HTML IDs (pj-* prefix)

3. **IP Display Overflow** - Fixed with `white-space: pre` and proper wrapping

### UI Updates
1. Reorganized main menu with topic sections (IP & Subnetting, Packet Journey, OSI & Protocols)
2. New Help screen content for ports and private IPs
3. Updated service worker cache to v3

---

## Known Issues
- favicon.ico returns 404 (cosmetic only)
- Building animation runs even when not visible (minor CPU usage)

---

## Future Considerations / Backlog

### High Priority
- **Octet Translation Game** - Replace Binary Munchers with IP address building game (convert binary octets to build IPs)
- **Layer Builder Game** - BurgerTime-style OSI layer game (design doc: GAME_DESIGN_LAYER_BUILDER.md)
- **Binary Frog Mascot** - Character made of 1s and 0s for binary-themed content
- **Mobile Layout Optimization** - Improve small screen experience

### Medium Priority
- Enterprise engagement features (team leaderboards, usage analytics)
- Additional Packet Journey scenarios (ICMP, NAT, DHCP process)
- More advanced subnetting challenges (VLSM design)
- Sound effects for Packet Journey and OSI Trainer
- Additional themes

### Future Exploration
- Multiplayer challenge mode
- Progress certificates for enterprise training completion
- Integration with IT training platforms

---

## Browser Compatibility
| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 13+ |
| Edge | 80+ |

PWA features require HTTPS in production.

---

## Performance Notes
- Canvas rendering optimized with requestAnimationFrame
- Service worker caches all assets for offline play
- localStorage used for persistent data (< 5MB limit)
- CSS animations hardware-accelerated where possible
- Mascot animation stops when game is inactive

---

## How to Run

```bash
cd network-tetris
python -m http.server 5500
```

Then open: http://localhost:5500

---

## Tech Stack
- Vanilla JavaScript (no frameworks)
- HTML5 Canvas for grid and animations
- Web Audio API for synthesized sound effects
- CSS3 with variables for theming and responsive design
- Service Worker for PWA/offline support
- localStorage for persistence
- Press Start 2P font (Google Fonts)
