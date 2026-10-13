//  Virtual Identity, Form Validation & Cookie Management

// --- NEW COOKIE SYSTEM ---
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // We encode it so the JSON brackets don't break the cookie format!
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/";
}

// This function reads the cookie when the user returns to the website.
function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return decodeURIComponent(c.substring(nameEQ.length,c.length));
    }
    return null;
}

// This function deletes the cookie by setting its expiration date to the past.
function eraseCookie(name) {
    document.cookie = name+'=; Max-Age=-99999999; path=/';
}

// --- AUTHENTICATION STATE MANAGER --
const AuthSystem = {
    async register(username, email, password) { return await API.register(username, email, password); },
    
    async login(username, password) {
        const result = await API.login(username, password);
        if (result.success) {
            // Save the player in a cookie for 7 days!
            setCookie('currentUser', JSON.stringify(result.user), 7);
        }
        return result;
    },
    
    logout() {
        eraseCookie('currentUser'); // Deletes the cookie on logout
        window.location.href = 'index.html';
    },
    
    getCurrentUser() { 
        const cookieStr = getCookie('currentUser');
        return cookieStr ? JSON.parse(cookieStr) : null; 
    },
    
    async updateScore(level, score) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;
        
        const result = await API.saveScore(currentUser.username, level, score);
        
        if (result.success && result.updated) {
            currentUser[`best_${level}`] = score;
            // Update the cookie with the new high score
            setCookie('currentUser', JSON.stringify(currentUser), 7);
        }
        return result;
    }
};

// --- ROUTE PROTECTION (AUTHORIZATION) ---
function checkAuth() {
    const currentUser = AuthSystem.getCurrentUser();
    const publicPages = ['index.html', ''];
    const currentPage = window.location.pathname.split('/').pop();
    if (!currentUser && !publicPages.includes(currentPage)) {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

// --- UI HELPER: PASSWORD TOGGLE ---
window.togglePasswordVisibility = function(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        iconElement.textContent = '🙈'; 
    } else {
        input.type = 'password';
        iconElement.textContent = '👁️'; 
    }
};

function showMessage(text, isError) {
    const msg = document.getElementById('auth-message');
    msg.textContent = text;
    msg.className = isError ? 'message error' : 'message success';
    msg.style.display = 'block';
}

// --- EVENT-DRIVEN UI LOGIC ---
// Waits for the HTML to fully load before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const slider = document.getElementById('toggle-slider');
    
    // Auto-redirect to Home if the player's cookie is already saved!
    if (loginForm && AuthSystem.getCurrentUser()) {
        window.location.href = 'home.html';
    }
    
    if (loginForm) {
        document.getElementById('show-register').addEventListener('click', () => {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            slider.classList.add('right'); 
        });
        document.getElementById('show-login').addEventListener('click', () => {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            slider.classList.remove('right'); 
        });

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pass = document.getElementById('login-password').value;
            if (pass.length < 6) return showMessage('Password must be at least 6 characters. 🥀', true);

            const result = await AuthSystem.login(document.getElementById('login-username').value, pass);
            showMessage(result.message, !result.success);
            if (result.success) setTimeout(() => window.location.href = 'home.html', 1000);
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value;
            const pass = document.getElementById('reg-password').value;

            if (username.length < 3) return showMessage('Username must be at least 3 characters. 🥀', true);
            if (pass.length < 6) return showMessage('Password must be at least 6 characters. 🥀', true);

            const result = await AuthSystem.register(username, document.getElementById('reg-email').value, pass);
            showMessage(result.message, !result.success);
            
            if(result.success) {
                setTimeout(() => {
                    // --- AUTO-FILL LOGIN FORM ---
                    document.getElementById('login-username').value = username;
                    document.getElementById('login-password').value = pass;
                    
                    registerForm.reset();
                    document.getElementById('show-login').click();
                    showMessage('Account created! Your details are filled in, just click Login! 💕', false);
                }, 1500);
            }
        });
    }
});    


/* --- GLOBAL LOGIN SCREEN AUDIO --- */
document.addEventListener('DOMContentLoaded', () => {
    const clickSound = document.getElementById('click-sound');
    const bgMusic = document.getElementById('bg-music');
    
    if (bgMusic) {
        bgMusic.volume = 0.4; // Soft pastel volume
        
        // 1. Ask the browser to play it immediately!
        let playPromise = bgMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // 2. If the browser blocks autoplay, wait for the very first click!
                console.log("Browser blocked autoplay. Waiting for the player's first click! 🌸");
                document.body.addEventListener('click', () => {
                    bgMusic.play().catch(() => {});
                }, { once: true });
            });
        }
    }

    const allButtons = document.querySelectorAll('button, .tab-btn');
    allButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (clickSound) {
                clickSound.currentTime = 0; 
                clickSound.play().catch(() => {});
            }
        });
    });
});