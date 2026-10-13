// --- HIGH COHESION & LOW COUPLING DEMONSTRATION ---

// The base URL for your local Node.js backend
const API_URL = 'http://localhost:3000/api';

const API = {
    async request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (data) options.body = JSON.stringify(data);
        
        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.error("Network Event Error:", error);
            return []; // Safe fallback to prevent crashing
        }
    },

    login: (username, password) => API.request('/login', 'POST', { username, password }),
    register: (username, email, password) => API.request('/register', 'POST', { username, email, password }),
    saveScore: (username, level, score) => API.request('/score', 'POST', { username, level, score }),
    getLeaderboard: (level) => API.request(`/leaderboard/${level}`),
    getPrivateLeaderboard: (username, level) => API.request(`/leaderboard/private/${username}/${level}`)
};