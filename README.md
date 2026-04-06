# aethergate
just a web site with games in html,scss,js

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7aeeb54f-da61-4c39-80b0-5a92c40ed131" />


aethergate/
├── package.json
├── Dockerfile
├── docker-compose.yml
├── server.js
├── game-logic/
│   ├── blackjackLogic.js
│   ├── ginRummyLogic.js
│   └── clickerLogic.js
├── public/
│   ├── index.html
│   ├── blackjack.html
│   ├── clicker.html
│   ├── gin-rummy.html
│   ├── css/
│   │   └── style.scss
│   └── js/
│       ├── main.js
│       ├── intro.js
│       ├── carousel.js
│       ├── blackjack.js
│       ├── ginRummy.js
│       ├── clicker.js
│       └── socket.js
├── src/
│   └── css/
│       └── style.scss           ← Source SCSS (will be compiled)
├── data/                  # SQLite DB will be created here (Docker volume)
├── README.md
└── sounds/                # (optional - add .mp3 files: door-creak.mp3, whoosh.mp3, etc.)
