# RUN LONDON RUN

> _Operational Simulation | Incident Report #2024-RLR_

![Status](https://img.shields.io/badge/STATUS-ONLINE-lightgrey?style=for-the-badge) ![Version](https://img.shields.io/badge/VERSION-2.0.0-black?style=for-the-badge)

**Run London Run** is an interactive browser-based experience that simulates the high-frequency occurrence of mobile phone snatch-thefts in London.

Designed with a **"neutral, institutional, and visually silent"** aesthetic, the project rejects gamification in favor of a procedural, bureaucratic tone. It presents the user not as a hero, but as a statistic within a system designated "CASE ID: AUTO-GENERATED".

![Screenshot](img/screen.png) <!-- Placeholder for actual screenshot -->

---

## 📂 Project Overview

The experience places the user in a stylized, monochromatic procedural recreation of London. The objective is seemingly to navigate the environment, but the inevitable outcome—theft—serves as a narrative device to introduce real-world crime statistics.

**Key Aesthetic Principles:**

- **Institutional Silence:** Visuals consist of pure blacks (`#0E0E0E`), greys, and off-whites (`#EAEAEA`). No vibrant colours, no textures, no "fun".
- **Procedural Coldness:** The city is generated via code, reflecting the indifference of the urban environment.
- **Bureaucratic Interface:** Loading screens mimic case file intake systems; outcomes are presented as "Case Status" updates rather than "Game Over" screens.

---

## 🕹️ Controls

The simulation supports both Desktop (Keyboard/Mouse) and Mobile (Touch) interfaces.

### Desktop

- **W / A / S / D** - Movement
- **SHIFT** - Sprint (Limited Stamina hidden from UI)
- **SPACE** - Jump
- **MOUSE** - Look

### Mobile

- **Left Stick** - Movement
- **Sprint Button** - Toggle Sprint
- **Jump Button** - Jump

---

## 🛠️ Technical Implementation

Built with **Vanilla JavaScript** and **Three.js**, prioritizing performance and broad compatibility.

### Core Stack

- **[Three.js (r128)](https://threejs.org/)**: 3D Rendering Engine.
- **[Supabase](https://supabase.com/)**: Backend for "Story Submission" feature (PostgreSQL).
- **[Chart.js](https://www.chartjs.org/)**: Rendering statistical data in the post-incident sequence.

### Modules

- `index.html`: Core game loop, rendering pipelines, and UI logic.
- `styles.css`: Definition of the "Institutional" design language.
- `js/character.js`: _New_ Newtonian Physics module for realistic character movement (Velocity, Friction, Gravity).
- `js/world.js`: World generation methodology.

---

## 🚀 Installation & Development

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/iamr7d/run-london-run.git
    cd RLR
    ```

2.  **Serve Locally**

    - Using a simple static server (e.g., Python or VS Code Live Server):

    ```bash
    python -m http.server 8000
    # OR
    npx serve .
    ```

3.  **Supabase Setup** (For Story Features)
    - Create a table `stories` in your Supabase project.
    - Enable RLS and creating a policy for anonymous inserts.
    - Update `supabaseUrl` and `supabaseKey` in `index.html`.

---

## 📊 Data Source

Statistics cited within the simulation are based on **official police-recorded figures in England and Wales** for the year ending March 2024.

> "In the year ending March 2024, an estimated 78,000 incidents of phones or bags being snatched on the street were reported."

---

_This project is a design fiction / educational simulation._
