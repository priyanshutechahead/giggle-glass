// GiggleGlass App Controller
document.addEventListener('DOMContentLoaded', () => {
    // === STATE MANAGEMENT ===
    let state = {
        currentJoke: null,
        favorites: [],
        isPlayingSpeech: false,
        isAutoplay: false,
        autoplayTimer: null,
        autoplayProgressTimer: null,
        selectedVoice: null,
        speechRate: 1.0,
        utterance: null
    };

    // === CACHE DOM ELEMENTS ===
    const btnFetch = document.getElementById('btn-fetch');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const btnSpeak = document.getElementById('btn-speak');
    const btnFavorite = document.getElementById('btn-favorite');
    const btnShare = document.getElementById('btn-share');
    const btnToggleSettings = document.getElementById('btn-toggle-settings');
    const btnToggleAutoplay = document.getElementById('btn-toggle-autoplay');
    const btnOpenFavorites = document.getElementById('btn-open-favorites');
    const btnCloseFavorites = document.getElementById('btn-close-favorites');
    
    const settingsPanel = document.getElementById('settings-panel');
    const jokeDisplay = document.getElementById('joke-display');
    const soundwave = document.getElementById('soundwave');
    const favIcon = document.getElementById('fav-icon');
    const favPanel = document.getElementById('fav-panel');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const favListContainer = document.getElementById('fav-list-container');
    const toastStack = document.getElementById('toast-stack');
    const autoplayIndicator = document.getElementById('autoplay-indicator');
    const footerFavoritesInfo = document.getElementById('footer-favorites-info');

    // Filter Inputs
    const selectCategory = document.getElementById('select-category');
    const inputSearch = document.getElementById('input-search');
    const blacklistCheckboxes = document.querySelectorAll('.blacklist-flag');
    
    // Voice Config Inputs
    const selectVoice = document.getElementById('select-voice');
    const voiceRate = document.getElementById('voice-rate');
    const voiceRateVal = document.getElementById('voice-rate-val');

    // === INITIALIZATION ===
    initFavorites();
    initSpeechVoices();

    // === EVENT LISTENERS ===
    btnFetch.addEventListener('click', () => {
        stopSpeech();
        fetchJoke();
    });

    btnSpeak.addEventListener('click', toggleSpeech);
    btnFavorite.addEventListener('click', toggleFavorite);
    btnShare.addEventListener('click', shareCurrentJoke);
    
    btnToggleSettings.addEventListener('click', toggleSettingsPanel);
    btnToggleAutoplay.addEventListener('click', toggleAutoplay);
    
    btnOpenFavorites.addEventListener('click', openFavoritesDrawer);
    btnCloseFavorites.addEventListener('click', closeFavoritesDrawer);
    sidebarOverlay.addEventListener('click', closeFavoritesDrawer);

    // Sync speech speed UI slider
    voiceRate.addEventListener('input', (e) => {
        state.speechRate = parseFloat(e.target.value);
        voiceRateVal.textContent = state.speechRate.toFixed(1) + 'x';
        if (state.isPlayingSpeech) {
            // Re-speak with updated rate
            const textToSpeak = getJokeTextForSpeech(state.currentJoke);
            stopSpeech();
            speakText(textToSpeak);
        }
    });

    selectVoice.addEventListener('change', (e) => {
        const selectedName = e.target.value;
        const voices = window.speechSynthesis.getVoices();
        state.selectedVoice = voices.find(v => v.name === selectedName) || null;
    });

    // === FUNCTIONS ===

    // Toast Stack Notification System
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = '';
        if (type === 'success') {
            icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else if (type === 'error') {
            icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-pink)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        } else {
            icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        toast.innerHTML = `${icon}<span>${message}</span>`;
        toastStack.appendChild(toast);

        // Auto remove after 3s
        setTimeout(() => {
            toast.classList.add('removing');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }

    // Toggle Settings Panel
    function toggleSettingsPanel() {
        btnToggleSettings.classList.toggle('active');
        settingsPanel.classList.toggle('open');
    }

    // Open & Close Favorites Sidebar Drawer
    function openFavoritesDrawer() {
        favPanel.classList.add('open');
        sidebarOverlay.classList.add('open');
        renderFavoritesList();
    }

    function closeFavoritesDrawer() {
        favPanel.classList.remove('open');
        sidebarOverlay.classList.remove('open');
    }

    // Initialize Favorites from LocalStorage
    function initFavorites() {
        try {
            const raw = localStorage.getItem('giggleglass_favs');
            state.favorites = raw ? JSON.parse(raw) : [];
        } catch (e) {
            state.favorites = [];
        }
        updateFavoritesFooterInfo();
    }

    function updateFavoritesFooterInfo() {
        const count = state.favorites.length;
        footerFavoritesInfo.textContent = `${count} bookmark${count === 1 ? '' : 's'} saved`;
    }

    // Initialize TTS Voices
    function initSpeechVoices() {
        if (!('speechSynthesis' in window)) {
            selectVoice.innerHTML = '<option value="none">Speech API Not Supported</option>';
            selectVoice.disabled = true;
            voiceRate.disabled = true;
            btnSpeak.style.display = 'none';
            return;
        }

        function populateVoices() {
            const voices = window.speechSynthesis.getVoices();
            // Filter English or common voices for natural output, and fall back to all
            const filtered = voices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('en-'));
            const voicesToUse = filtered.length > 0 ? filtered : voices;

            selectVoice.innerHTML = '';
            voicesToUse.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                
                // Select Google voice or default system voice if available
                if (voice.name.includes('Google US English') || voice.default) {
                    option.selected = true;
                    state.selectedVoice = voice;
                }
                selectVoice.appendChild(option);
            });

            if (!state.selectedVoice && voicesToUse.length > 0) {
                state.selectedVoice = voicesToUse[0];
            }
        }

        populateVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = populateVoices;
        }
    }

    // === FETCH JOKE CLIENT ===
    async function fetchJoke() {
        setFetchingState(true);
        
        // Build base endpoint
        const category = selectCategory.value;
        let url = `https://v2.jokeapi.dev/joke/${category}`;
        
        const params = [];

        // Blacklist Flags
        const blacklisted = [];
        blacklistCheckboxes.forEach(cb => {
            if (cb.checked) blacklisted.push(cb.value);
        });
        if (blacklisted.length > 0) {
            params.push(`blacklistFlags=${blacklisted.join(',')}`);
        }

        // Search text
        const searchVal = inputSearch.value.trim();
        if (searchVal) {
            params.push(`contains=${encodeURIComponent(searchVal)}`);
        }

        // Append query parameters
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('API server returned error code');
            const data = await res.json();

            if (data.error) {
                // E.g. search keyword not matched
                renderError(data.message || 'Could not find any jokes matching those settings.');
                return;
            }

            state.currentJoke = data;
            renderJokeCard(data);
            
            // Enable interactive elements
            btnSpeak.removeAttribute('disabled');
            btnFavorite.removeAttribute('disabled');
            btnShare.removeAttribute('disabled');
            
            updateFavoriteButtonState();
            
            // Handle autoplay cycling
            if (state.isAutoplay) {
                restartAutoplayProgress();
            }

        } catch (err) {
            console.error(err);
            renderError('Connection Failed. Please check your network and try again.');
        } finally {
            setFetchingState(false);
        }
    }

    function setFetchingState(isFetching) {
        if (isFetching) {
            btnFetch.setAttribute('disabled', 'true');
            btnSpinner.style.display = 'block';
            btnText.textContent = 'Giggling...';
            jokeDisplay.classList.add('fetching');
            
            // Card transition feedback
            jokeDisplay.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 160px; gap: 15px; color: var(--text-secondary);">
                    <div class="loading-spinner" style="width: 40px; height: 40px; border-width: 3px; border-top-color: var(--accent-indigo);"></div>
                    <span style="font-size: 14px; font-family: var(--font-heading); letter-spacing: 0.5px; opacity: 0.8;">CONSULTING COMEDY ENGINE...</span>
                </div>
            `;
        } else {
            btnFetch.removeAttribute('disabled');
            btnSpinner.style.display = 'none';
            btnText.textContent = 'Giggle Me!';
            jokeDisplay.classList.remove('fetching');
        }
    }

    // Render loaded joke card
    function renderJokeCard(joke) {
        const isSafe = joke.safe;
        const category = joke.category;

        let contentHtml = '';

        if (joke.type === 'single') {
            contentHtml = `
                <div class="joke-single">
                    <p class="joke-content">"${escapeHtml(joke.joke)}"</p>
                </div>
            `;
        } else {
            contentHtml = `
                <div class="joke-twopart">
                    <p class="joke-content setup">"${escapeHtml(joke.setup)}"</p>
                    <div class="punchline-reveal-container" id="punchline-reveal">
                        <button class="btn-reveal" id="btn-reveal-punchline">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            Reveal Punchline
                        </button>
                    </div>
                    <div id="punchline-container"></div>
                </div>
            `;
        }

        jokeDisplay.innerHTML = `
            <div class="joke-meta">
                <span class="category-tag">${escapeHtml(category)}</span>
                <div class="safety-badge ${isSafe ? 'safe' : 'nsfw'}">
                    <span></span>
                    ${isSafe ? 'Family Friendly' : 'Unfiltered'}
                </div>
            </div>
            ${contentHtml}
        `;

        // If twopart, hook the reveal click
        if (joke.type === 'twopart') {
            const btnReveal = document.getElementById('btn-reveal-punchline');
            btnReveal.addEventListener('click', () => {
                const deliveryContainer = document.getElementById('punchline-container');
                deliveryContainer.innerHTML = `
                    <p class="joke-content delivery">${escapeHtml(joke.delivery)}</p>
                `;
                document.getElementById('punchline-reveal').style.display = 'none';
                
                // If TTS is currently playing, restart with entire joke since delivery is now visible
                if (state.isPlayingSpeech) {
                    stopSpeech();
                    speakText(getJokeTextForSpeech(joke));
                }
            });
        }
    }

    // Render error container
    function renderError(message) {
        btnSpeak.setAttribute('disabled', 'true');
        btnFavorite.setAttribute('disabled', 'true');
        btnShare.setAttribute('disabled', 'true');
        
        jokeDisplay.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 160px; text-align: center; color: var(--text-secondary); gap: 15px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-pink)" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div style="font-family: var(--font-heading); font-size: 16px; font-weight: 600; color: #ffffff;">Opps! Comedy Static</div>
                <p style="font-size: 13.5px; max-width: 320px; line-height: 1.5; color: var(--text-muted);">${escapeHtml(message)}</p>
            </div>
        `;
        showToast(message, 'error');
    }

    // === TEXT TO SPEECH (TTS) ENGINE ===
    function getJokeTextForSpeech(joke) {
        if (!joke) return '';
        if (joke.type === 'single') {
            return joke.joke;
        } else {
            // Check if delivery is visible
            const deliveryElem = document.querySelector('.joke-twopart .delivery');
            if (deliveryElem) {
                return `${joke.setup} ... ... ${joke.delivery}`;
            } else {
                // If not revealed, read setup, prompt user
                return `${joke.setup}. Click reveal punchline to hear the rest!`;
            }
        }
    }

    function toggleSpeech() {
        if (!state.currentJoke) return;

        if (state.isPlayingSpeech) {
            stopSpeech();
        } else {
            const textToSpeak = getJokeTextForSpeech(state.currentJoke);
            speakText(textToSpeak);
        }
    }

    function speakText(text) {
        if (!('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel(); // Stop any pending speech

        state.utterance = new SpeechSynthesisUtterance(text);
        
        if (state.selectedVoice) {
            state.utterance.voice = state.selectedVoice;
        }
        state.utterance.rate = state.speechRate;

        state.utterance.onstart = () => {
            state.isPlayingSpeech = true;
            btnSpeak.classList.add('active');
            soundwave.classList.add('speaking');
            btnSpeak.setAttribute('data-tooltip', 'Pause / Mute');
        };

        state.utterance.onend = () => {
            resetSpeechState();
        };

        state.utterance.onerror = (e) => {
            console.error('Speech error:', e);
            resetSpeechState();
        };

        window.speechSynthesis.speak(state.utterance);
    }

    function stopSpeech() {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        resetSpeechState();
    }

    function resetSpeechState() {
        state.isPlayingSpeech = false;
        btnSpeak.classList.remove('active');
        soundwave.classList.remove('speaking');
        btnSpeak.setAttribute('data-tooltip', 'Speak Out Loud');
    }

    // === FAVORITES MANAGEMENT ===
    function toggleFavorite() {
        if (!state.currentJoke) return;

        const jokeId = state.currentJoke.id;
        const existsIndex = state.favorites.findIndex(j => j.id === jokeId);

        if (existsIndex > -1) {
            state.favorites.splice(existsIndex, 1);
            showToast('Joke removed from bookmarks.', 'info');
        } else {
            state.favorites.unshift(state.currentJoke);
            showToast('Joke saved to bookmarks!', 'success');
        }

        // Save
        localStorage.setItem('giggleglass_favs', JSON.stringify(state.favorites));
        updateFavoriteButtonState();
        updateFavoritesFooterInfo();
        
        if (favPanel.classList.contains('open')) {
            renderFavoritesList();
        }
    }

    function updateFavoriteButtonState() {
        if (!state.currentJoke) return;
        
        const exists = state.favorites.some(j => j.id === state.currentJoke.id);
        if (exists) {
            btnFavorite.classList.add('active');
            favIcon.setAttribute('fill', 'white');
        } else {
            btnFavorite.classList.remove('active');
            favIcon.setAttribute('fill', 'none');
        }
    }

    // Render favorites dashboard drawer content
    function renderFavoritesList() {
        favListContainer.innerHTML = '';

        if (state.favorites.length === 0) {
            favListContainer.innerHTML = `
                <div class="fav-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" style="color: var(--text-muted);">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <p style="font-size: 14px; font-weight: 500;">No Bookmarks Saved Yet</p>
                    <p style="font-size: 12px; line-height: 1.5; color: var(--text-muted); max-width: 200px;">
                        Click the heart button under jokes to build your custom comedy tray!
                    </p>
                </div>
            `;
            return;
        }

        state.favorites.forEach(joke => {
            const card = document.createElement('article');
            card.className = 'fav-item';
            
            // Format joke content for small rendering
            let jokeSnippet = '';
            if (joke.type === 'single') {
                jokeSnippet = `"${escapeHtml(joke.joke)}"`;
            } else {
                jokeSnippet = `<strong>Q:</strong> "${escapeHtml(joke.setup)}"<br><strong style="color: var(--accent-cyan);">A:</strong> "${escapeHtml(joke.delivery)}"`;
            }

            card.innerHTML = `
                <div class="fav-item-category">${escapeHtml(joke.category)}</div>
                <div class="fav-item-content">${jokeSnippet}</div>
                <div class="fav-item-actions">
                    <button class="btn-fav-action btn-fav-speak" title="Speak Joke">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M12 2v9"></path><path d="M8 5h8"></path></svg>
                    </button>
                    <button class="btn-fav-action btn-fav-share" title="Share Joke">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    </button>
                    <button class="btn-fav-action btn-delete" title="Delete Bookmark">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;

            // Hook individual fav actions
            card.querySelector('.btn-fav-speak').addEventListener('click', () => {
                const text = joke.type === 'single' ? joke.joke : `${joke.setup} ... ... ${joke.delivery}`;
                speakText(text);
            });

            card.querySelector('.btn-fav-share').addEventListener('click', () => {
                shareJokeObject(joke);
            });

            card.querySelector('.btn-delete').addEventListener('click', () => {
                const existsIndex = state.favorites.findIndex(j => j.id === joke.id);
                if (existsIndex > -1) {
                    state.favorites.splice(existsIndex, 1);
                    localStorage.setItem('giggleglass_favs', JSON.stringify(state.favorites));
                    updateFavoritesFooterInfo();
                    
                    // visual exit transition
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        renderFavoritesList();
                        updateFavoriteButtonState();
                    }, 300);
                    
                    showToast('Bookmark deleted.', 'info');
                }
            });

            favListContainer.appendChild(card);
        });
    }

    // === SOCIAL SHARING ENGINE ===
    function getJokeTextForSharing(joke) {
        if (!joke) return '';
        if (joke.type === 'single') {
            return joke.joke;
        } else {
            return `Q: ${joke.setup}\nA: ${joke.delivery}`;
        }
    }

    function shareCurrentJoke() {
        if (!state.currentJoke) return;
        shareJokeObject(state.currentJoke);
    }

    function shareJokeObject(joke) {
        const jokeText = getJokeTextForSharing(joke);
        
        // Native Web Share API if supported
        if (navigator.share) {
            navigator.share({
                title: 'Check out this joke from GiggleGlass!',
                text: jokeText,
                url: window.location.href
            })
            .then(() => showToast('Shared successfully!', 'success'))
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    fallbackShare(jokeText);
                }
            });
        } else {
            fallbackShare(jokeText);
        }
    }

    function fallbackShare(text) {
        // Copy to clipboard
        navigator.clipboard.writeText(text)
            .then(() => {
                showToast('Copied joke to clipboard!', 'success');
            })
            .catch(() => {
                showToast('Unable to copy joke to clipboard.', 'error');
            });
    }

    // === AUTO PLAY / AUTO SLIDER MODE ===
    function toggleAutoplay() {
        state.isAutoplay = !state.isAutoplay;
        
        if (state.isAutoplay) {
            btnToggleAutoplay.classList.add('active');
            document.getElementById('main-card').classList.add('autoplay-active');
            showToast('Auto-Play Mode Active: Fetching joke every 15s', 'success');
            
            // Immediate fetch, then starts interval
            fetchJoke();
            startAutoplayInterval();
        } else {
            btnToggleAutoplay.classList.remove('active');
            document.getElementById('main-card').classList.remove('autoplay-active');
            showToast('Auto-Play Mode Deactivated', 'info');
            
            clearAutoplayIntervals();
        }
    }

    function startAutoplayInterval() {
        clearAutoplayIntervals();
        
        // 15 seconds timer
        state.autoplayTimer = setInterval(() => {
            if (!document.hidden && !state.isPlayingSpeech) {
                fetchJoke();
            }
        }, 15000);
        
        restartAutoplayProgress();
    }

    function restartAutoplayProgress() {
        // Reset indicator animation
        autoplayIndicator.style.transition = 'none';
        autoplayIndicator.style.width = '0%';
        
        // Force reflow
        void autoplayIndicator.offsetWidth;
        
        // Start animation
        autoplayIndicator.style.transition = 'width 15s linear';
        autoplayIndicator.style.width = '100%';
    }

    function clearAutoplayIntervals() {
        if (state.autoplayTimer) {
            clearInterval(state.autoplayTimer);
            state.autoplayTimer = null;
        }
        autoplayIndicator.style.transition = 'none';
        autoplayIndicator.style.width = '0%';
    }

    // === HELPERS ===
    // Simple HTML sanitizer to prevent injection
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Clear background timers if tab is closed or hidden to optimize resources
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (state.isAutoplay) {
                clearAutoplayIntervals();
            }
            stopSpeech();
        } else {
            if (state.isAutoplay) {
                startAutoplayInterval();
            }
        }
    });
});
