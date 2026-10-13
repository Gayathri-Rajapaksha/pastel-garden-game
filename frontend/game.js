//  Demonstrates High Cohesion and Event-Driven Logic
// HIGH COHESION: The AudioManager object has one single responsibility: handling audio.
const AudioManager = {
    bgMusic: document.getElementById('bg-music'),
    sounds: {
        flip: document.getElementById('flip-sound'),
        match: document.getElementById('match-sound'),
        wrong: document.getElementById('wrong-sound'),
        win: document.getElementById('win-sound'),
        gameover: document.getElementById('gameover-sound'),
        click: document.getElementById('click-sound')
    },
    isMuted: false,
    volume: 0.5,

    init() {
        if (this.bgMusic) {
            this.bgMusic.volume = this.volume;
            let playPromise = this.bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    document.body.addEventListener('click', () => this.playBGM(), { once: true });
                });
            }
        }
        Object.values(this.sounds).forEach(sound => { if (sound) sound.volume = this.volume; });
    },
    playBGM() { if (this.bgMusic && !this.isMuted) this.bgMusic.play().catch(() => {}); },
    pauseBGM() { if (this.bgMusic) this.bgMusic.pause(); },
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.bgMusic) this.bgMusic.muted = this.isMuted;
        Object.values(this.sounds).forEach(s => { if (s) s.muted = this.isMuted; });
        return this.isMuted;
    },
    setVolume(value) {
        this.volume = value / 100;
        if (this.bgMusic) this.bgMusic.volume = this.volume;
        Object.values(this.sounds).forEach(s => { if (s) s.volume = this.volume; });
    },
    playSound(soundName) {
        if (this.isMuted) return;
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }
};

// EVENT-DRIVEN: The entire game waits for the DOM (HTML) to load before doing anything.
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = checkAuth();
    if (!currentUser) return;
    AudioManager.init();

    // UI Elements
    const musicToggle = document.getElementById('music-toggle');
    const volumeSlider = document.getElementById('volume-slider');
    
    // EVENT LISTENERS: The UI is driven by user interactions in event driven architecture
    if (musicToggle) {
        musicToggle.addEventListener('click', () => {
            const isMuted = AudioManager.toggleMute();
            musicToggle.textContent = isMuted ? '🔇 Music Off' : '🎵 Music On';
            musicToggle.classList.toggle('muted', isMuted);
            isMuted ? AudioManager.pauseBGM() : AudioManager.playBGM();
            AudioManager.playSound('click');
        });
    }

    if (volumeSlider) volumeSlider.addEventListener('input', (e) => AudioManager.setVolume(e.target.value));
    document.body.addEventListener('click', () => AudioManager.playBGM(), { once: true });

    document.getElementById('current-player').textContent = currentUser.username;

    const grid = document.getElementById('grid');
    const scoreDisplay = document.getElementById('score');
    const timeDisplay = document.getElementById('time');
    const chancesDisplay = document.getElementById('chances');
    const roundDisplay = document.getElementById('round');
    const levelSelect = document.getElementById('level-select');
    const levelDisplayEl = document.getElementById('current-level-display');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const heartBtn = document.getElementById('heart-btn');
    const pauseOverlay = document.getElementById('pause-overlay');
    
    const apiModal = document.getElementById('api-modal');
    const puzzleImage = document.getElementById('puzzle-image');
    const puzzleAnswer = document.getElementById('puzzle-answer');
    
    // --- GAME STATE VARIABLES ---
    const cuteItems = ['🌸', '🍓', '🐰', '⭐', '🎀', '🌷', '🐱', '🌈', '🍄', '☁️', '🍦', '🍒', '🎨', '🧸', '🦋', '🍉']; 
    let squares = [], shuffledItems = [];
    let score = 0, timeLeft = 0, chancesLeft = 0, currentRound = 1, timerId;
    let isPlaying = false, isPaused = false, currentApiSolution = 0, currentLevel = 'easy';
    let cardsChosen = [], cardsChosenIds = [], pairsMatched = 0;
    
    // --- BULLETPROOF FIX VARIABLES ---
    let transitionTimerId = null; 
    let isGameEnding = false; 

    // Level Configurations
    const levels = {
        easy: { time: 120, chances: 3, cards: 9 },    
        medium: { time: 90, chances: 5, cards: 16 },  
        hard: { time: 60, chances: 7, cards: 25 }     
    };

    function showLeaderboard() {
        const modal = document.getElementById('leaderboard-modal');
        const list = document.getElementById('leaderboard-list');
        const closeBtn = document.getElementById('close-leaderboard');
        const tabs = document.querySelectorAll('.tab-btn');
        if (!modal || !list) return;

        // Pattern to prevent binding multiple click listeners to the same buttons
        if (!modal.dataset.eventsBound) {
            tabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    AudioManager.playSound('click');
                    tabs.forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                    loadLeaderboard(e.target.dataset.level);
                });
            });
            if (closeBtn) {
                closeBtn.addEventListener('click', () => { 
                    AudioManager.playSound('click'); 
                    modal.style.display = 'none'; 
                });
            }
            modal.dataset.eventsBound = "true"; 
        }

        async function loadLeaderboard(level) {
            const currentUser = AuthSystem.getCurrentUser();
            list.innerHTML = '<p style="text-align: center; color: #ff66a3; padding: 20px;">Loading Scores... 🌸</p>';
            
            try {
                // Fetch from the API
                const scores = await API.getPrivateLeaderboard(currentUser.username, level);
                list.innerHTML = '';
                
                if (!scores || !Array.isArray(scores) || scores.length === 0) {
                    list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No scores yet! Play a round! 🌸</p>';
                    return;
                }

                const medals = ['🥇', '🥈', '🥉'];
                scores.forEach((entry, index) => {
                    const item = document.createElement('div');
                    item.className = 'leaderboard-item current-user';
                    item.innerHTML = `
                        <span class="leaderboard-rank">${medals[index] || '•'}</span>
                        <span class="leaderboard-name">${currentUser.username} (You)</span>
                        <span class="leaderboard-score">${entry.score} pts</span>
                    `;
                    list.appendChild(item);
                });
            } catch (err) {
                list.innerHTML = '<p style="text-align: center; color: #ff4d4d; padding: 20px;">Failed to load scores! 🥀</p>';
            }
        }
        
        tabs.forEach(t => t.classList.remove('active'));
        const activeTab = Array.from(tabs).find(t => t.dataset.level === currentLevel);
        if (activeTab) activeTab.classList.add('active');
        
        loadLeaderboard(currentLevel);
        modal.style.display = 'flex';
    }

    // EVENT-DRIVEN: Manual leaderboard trigger
    document.getElementById('leaderboard-btn')?.addEventListener('click', () => { 
        AudioManager.playSound('click'); 
        
        clearTimeout(transitionTimerId); 
        if (startBtn) startBtn.disabled = false;
        if (levelSelect) levelSelect.disabled = false;
        
        // FIXED: Unlock the grid shield if they manually open the leaderboard early
        grid.style.pointerEvents = 'auto'; 
        
        showLeaderboard(); 
    });
    
    document.getElementById('game-logout')?.addEventListener('click', () => { 
        AudioManager.playSound('click'); 
        AuthSystem.logout(); 
    });

    // EVENT-DRIVEN: 'change' event fires when dropdown is modified
    if (levelSelect) {
        levelSelect.addEventListener('change', (e) => {
            AudioManager.playSound('click');
            
            if (isPlaying) {
                if(confirm("Changing the difficulty will restart your current game. Continue?")) {
                    startGame();
                } else {
                    e.target.value = currentLevel; 
                }
            } else {
                currentLevel = e.target.value;
                levelDisplayEl.textContent = currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1);
                timeDisplay.innerHTML = levels[currentLevel].time;
                chancesDisplay.innerHTML = levels[currentLevel].chances;
                createBoard(); 
            }
        });
    }

    function createBoard() {
        grid.innerHTML = '';
        squares = [];
        pairsMatched = 0;
        cardsChosen = [];
        cardsChosenIds = [];
        grid.className = `grid grid-${currentLevel}`;

        const config = levels[currentLevel];
        const isOdd = config.cards % 2 !== 0; 
        const requiredPairs = Math.floor(config.cards / 2);
        
        let pool = [];
        let itemIndex = 0;

        for (let i = 0; i < requiredPairs; i++) {
            pool.push(cuteItems[itemIndex % cuteItems.length]);
            pool.push(cuteItems[itemIndex % cuteItems.length]);
            itemIndex++;
        }
        
        if (isOdd) pool.push('✨');
        
        shuffledItems = pool.sort(() => Math.random() - 0.5);

        for (let i = 0; i < config.cards; i++) {
            const square = document.createElement('div');
            square.setAttribute('data-id', i);
            square.classList.add('hidden'); 
            square.addEventListener('click', flipCard);
            grid.appendChild(square);
            squares.push(square);
        }
    }

    createBoard(); 

    function countdown() {
        if (timeLeft > 0) {
            timeLeft--;
            timeDisplay.innerHTML = timeLeft;
        } else {
            clearInterval(timerId);
            if (chancesLeft > 0) {
                AudioManager.playSound('wrong');
                if (confirm("Time's up! ⏰ Do you want to use a Heart Chance to get 15 seconds and keep playing?")) {
                    openHeartPuzzle();
                } else { endGame(); }
            } else { endGame(); }
        }
    }

    // --- GAME OVER LOGIC ---
    function endGame() {
        if (isGameEnding) return; 
        isGameEnding = true; 
        
        clearInterval(timerId);
        clearTimeout(transitionTimerId);

        isPlaying = false;
        
        // THE MASTER FIX: Physically shield the grid so rapid mouse clicks are blocked!
        grid.style.pointerEvents = 'none';

        if(heartBtn) heartBtn.disabled = true;
        if(pauseBtn) pauseBtn.disabled = true;
        if(stopBtn) stopBtn.disabled = true; 
        if(levelSelect) levelSelect.disabled = true; 
        if(startBtn) startBtn.disabled = true; 
        
        AudioManager.playSound('gameover');
        
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; grid-row: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #ff66a3; background: white; border-radius: 15px; border: 3px solid #ffb3d9;">
                <h2 style="font-size: 2.2rem; margin-bottom: 10px;">🥀 Game Over! 🥀</h2>
                <p style="font-size: 1.2rem; font-weight: bold; margin-bottom: 5px;">You reached Round ${currentRound}</p>
                <p style="font-size: 1.2rem; font-weight: bold;">Final Score: ${score} 💖</p>
                <button onclick="document.getElementById('leaderboard-btn').click()" style="margin-top: 15px; padding: 10px 20px; background: #ffe6f2; border: 2px solid #ffb3d9; color: #ff66a3; border-radius: 20px; cursor: pointer; font-weight: bold; font-family: 'Quicksand', sans-serif;">🏆 View Leaderboard</button>
            </div>
        `;

        try {
            if (score > 0 && typeof AuthSystem !== 'undefined' && typeof AuthSystem.updateScore === 'function') {
                AuthSystem.updateScore(currentLevel, score).catch(err => console.error(err)); 
            }
        } catch (e) {
            console.error("Score saving error:", e);
        }

        // EVENT-DRIVEN UI TRANSITION: Wait exactly 2000ms, then unlock the UI and show leaderboard
        transitionTimerId = setTimeout(() => {
            // UNLOCK the game board shield and buttons after exactly 2 seconds
            grid.style.pointerEvents = 'auto';
            if(startBtn) startBtn.disabled = false;
            if(levelSelect) levelSelect.disabled = false;
            showLeaderboard();
        }, 2000);
    }

    //timing events in event driven
    function startGame() {
        AudioManager.playSound('click');
        clearInterval(timerId);
        clearTimeout(transitionTimerId);
        
        isGameEnding = false; 
        grid.style.pointerEvents = 'auto'; // Fallback shield unlock for new games

        currentLevel = levelSelect.value;
        timeLeft = levels[currentLevel].time;
        chancesLeft = levels[currentLevel].chances;
        score = 0; 
        currentRound = 1;
        isPaused = false; 
        
        scoreDisplay.innerHTML = score;
        timeDisplay.innerHTML = timeLeft;
        chancesDisplay.innerHTML = chancesLeft;
        roundDisplay.innerHTML = currentRound;
        levelDisplayEl.textContent = currentLevel.charAt(0).toUpperCase() + currentLevel.slice(1);
        
        pauseOverlay.classList.remove('active');
        pauseBtn.innerHTML = "Pause ⏸️";
        
        if(pauseBtn) pauseBtn.disabled = false;
        if(stopBtn) stopBtn.disabled = false; 
        if(heartBtn) heartBtn.disabled = false;
        if(levelSelect) levelSelect.disabled = false;
        if(startBtn) startBtn.disabled = false;
        
        isPlaying = true;
        
        // TIMING EVENT: Start the core game clock (1000ms interval)
        createBoard();
        timerId = setInterval(countdown, 1000);
    }

    if (startBtn) startBtn.addEventListener('click', startGame);

    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            if (!isPlaying) return;
            AudioManager.playSound('click');
            
            if (isPaused) {
                isPaused = false;
                pauseBtn.innerHTML = "Pause ⏸️";
                pauseOverlay.classList.remove('active');
                timerId = setInterval(countdown, 1000);
            } else {
                isPaused = true;
                pauseBtn.innerHTML = "Resume ▶️";
                pauseOverlay.classList.add('active');
                clearInterval(timerId); 
            }
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (!isPlaying) return;
            AudioManager.playSound('click');
            if (confirm("Are you sure you want to stop? Your current score will be saved! 🌸")) {
                clearInterval(timerId);
                endGame();
            }
        });
    }

    function flipCard() {
        if (!isPlaying || isPaused || cardsChosen.length === 2) return;
        
        let cardId = parseInt(this.getAttribute('data-id'));
        if (cardsChosenIds.includes(cardId) || this.classList.contains('empty')) return;

        AudioManager.playSound('flip');
        this.classList.remove('hidden');
        this.innerHTML = shuffledItems[cardId];

        if (shuffledItems[cardId] === '✨') {
            AudioManager.playSound('match');
            score += 50; 
            scoreDisplay.innerHTML = score;
            setTimeout(() => this.classList.add('empty'), 500);
            return; 
        }

        cardsChosen.push(shuffledItems[cardId]);
        cardsChosenIds.push(cardId);

        if (cardsChosen.length === 2) setTimeout(checkForMatch, 500); 
    }

    function checkForMatch() {
        if (isGameEnding) return;

        const [id1, id2] = cardsChosenIds;
        if (cardsChosen[0] === cardsChosen[1]) {
            AudioManager.playSound('match');
            squares[id1].classList.add('empty'); squares[id2].classList.add('empty');
            score += 20; 
            pairsMatched++;
        } else {
            AudioManager.playSound('wrong');
            squares[id1].innerHTML = ''; squares[id1].classList.add('hidden');
            squares[id2].innerHTML = ''; squares[id2].classList.add('hidden');
        }

        scoreDisplay.innerHTML = score;
        cardsChosen = []; cardsChosenIds = [];

        // --- LEVEL UP LOGIC ---
        if (pairsMatched === Math.floor(levels[currentLevel].cards / 2)) {
            clearInterval(timerId);
            clearTimeout(transitionTimerId); 
            isPlaying = false;
            
            // THE MASTER FIX: Shield the grid during Level Up transition too!
            grid.style.pointerEvents = 'none';

            if(pauseBtn) pauseBtn.disabled = true; 
            if(stopBtn) stopBtn.disabled = true; 
            if(levelSelect) levelSelect.disabled = true;
            if(startBtn) startBtn.disabled = true;
            
            AudioManager.playSound('win');
            
            currentRound++;
            
            scoreDisplay.innerHTML = score;
            roundDisplay.innerHTML = currentRound;
            
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; grid-row: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #ff66a3; background: rgba(255, 255, 255, 0.95); border-radius: 15px; z-index: 10;">
                    <h2 style="font-size: 2.5rem; margin-bottom: 10px;">🌸 Level Up! 🌸</h2>
                    <p style="font-size: 1.5rem; font-weight: bold;">Starting Round ${currentRound}...</p>
                </div>
            `;
            
            // TIMING EVENT:
            transitionTimerId = setTimeout(() => {
                let newTime = levels[currentLevel].time - ((currentRound - 1) * 10);
                if (newTime < 20) newTime = 20; 
                
                timeLeft = newTime; 
                timeDisplay.innerHTML = timeLeft;
                
                createBoard(); 
                isPlaying = true;
                
                // UNLOCK the shield and buttons for the new round
                grid.style.pointerEvents = 'auto';
                if(pauseBtn) pauseBtn.disabled = false; 
                if(stopBtn) stopBtn.disabled = false; 
                if(levelSelect) levelSelect.disabled = false;
                if(startBtn) startBtn.disabled = false;
                
                timerId = setInterval(countdown, 1000);
            }, 2000); 
        }
    }

    // --- INTEROPERABILITY DEMONSTRATION heart API---
    function openHeartPuzzle() {
        if (chancesLeft <= 0) return alert("No extra chances left! 😢");
        AudioManager.playSound('click');
        
        clearInterval(timerId); 

        // INTEROPERABILITY: Using Fetch API to GET JSON data from the university server
        fetch('https://marcconrad.com/uob/heart/api.php')
            .then(res => res.json())
            .then(data => {
                puzzleImage.src = data.question; 
                currentApiSolution = data.solution; 
                puzzleAnswer.value = ''; 
                apiModal.style.display = 'flex'; 
            }).catch(() => {
                alert("Couldn't load puzzle!");
                if (timeLeft > 0 && isPlaying && !isPaused) timerId = setInterval(countdown, 1000);
            });
    }

    if (heartBtn) heartBtn.addEventListener('click', openHeartPuzzle);

    document.getElementById('submit-puzzle')?.addEventListener('click', () => {
        if (puzzleAnswer.value === "") {
            alert("Please type a number or use the arrows! 🌸");
            return;
        }

        if (parseInt(puzzleAnswer.value) === currentApiSolution) {
            AudioManager.playSound('match');
            timeLeft += 15; score -= 20; chancesLeft--; 
            timeDisplay.innerHTML = timeLeft; scoreDisplay.innerHTML = score; chancesDisplay.innerHTML = chancesLeft;
            apiModal.style.display = 'none';
            alert("Correct! +15 seconds added. (-20 pts) 🌸");
            
            clearInterval(timerId); 
            isPlaying = true; 
            timerId = setInterval(countdown, 1000); 
            
        } else {
            AudioManager.playSound('wrong');
            alert("Oops! Wrong answer. 🥀");
            if (timeLeft <= 0) { 
                apiModal.style.display = 'none'; 
                endGame(); 
            } else {
                apiModal.style.display = 'none';
                clearInterval(timerId);
                if (isPlaying && !isPaused) timerId = setInterval(countdown, 1000);
            }
        }
    });

    // Modal closing logic
    document.getElementById('close-modal')?.addEventListener('click', () => {
        AudioManager.playSound('click');
        apiModal.style.display = 'none';
        if (timeLeft <= 0) {
            endGame();
        } else {
            clearInterval(timerId);
            if (isPlaying && !isPaused) timerId = setInterval(countdown, 1000);
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('leaderboard-modal')) { 
            AudioManager.playSound('click'); 
            document.getElementById('leaderboard-modal').style.display = 'none'; 
        }
        if (e.target === apiModal) { 
            AudioManager.playSound('click'); 
            apiModal.style.display = 'none'; 
            if (timeLeft <= 0) endGame(); 
            else {
                clearInterval(timerId);
                if (isPlaying && !isPaused) timerId = setInterval(countdown, 1000);
            }
        }
    });
});


