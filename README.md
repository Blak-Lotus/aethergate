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


AI prompy:
the  fonts are perfect, the landing page is perfect.
class of stat-float and clocker orb are not supposed to exist as  it takes up negative space which thats supposed to have nothing there.
the clicker game needs to be mmore difficult and the keyboard buttons mmmust only work when pressed and not wirk like an autoclicker and click infinitely when held.
ginr rummy must allow you to have a premenu screen whic allows you to choose the following multiselected options: joker gamemode, no points gamemode, ai/player. gin rummy must also allow me to place melds and also see the melds the opponent has placed. i must alos be able to place the appropriate card on the opponents meld and they have to drop a card as per the equivalent exchange rules ai and player must be able to take turns.
get rid of the ndot visibility.
each carousel will get rid of the slide-bg-art and have on the right side where there is the most negative space a render of the game b eing played(a static preview of sorts) and the left side will have padding
when i leave a game it should go back to the carousel card of that game.
in gin rummy the player must be able to place melds and on the first turn you  must draw from the discard if not you can offer it to the other oponneet if youj dont need it. the second person may draw from=both pilees