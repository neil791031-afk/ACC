document.addEventListener('DOMContentLoaded', () => {
    const categoryNav = document.getElementById('category-nav');
    const gridContainer = document.getElementById('grid-container');
    const currentTextDisplay = document.getElementById('current-text');
    const playBtn = document.getElementById('play-btn');
    const clearBtn = document.getElementById('clear-btn');
    const statusBar = document.getElementById('status-bar');

    let currentCategory = vocabulary[0];
    let currentUtterance = null;

    // Initialize TTS
    const synth = window.speechSynthesis;
    let voices = [];
    let preferredVoice = null;

    function loadVoices() {
        voices = synth.getVoices();

        // Priority: Google zh-TW > Hanhan > any zh-TW > any zh
        preferredVoice = voices.find(v => v.name.includes('Google') && v.lang === 'zh-TW') ||
            voices.find(v => v.name.includes('Hanhan')) ||
            voices.find(v => v.lang === 'zh-TW') ||
            voices.find(v => v.lang.includes('zh'));

        if (preferredVoice) {
            statusBar.textContent = `語音就緒: ${preferredVoice.name}`;
            console.log('Selected voice:', preferredVoice.name);
        } else {
            statusBar.textContent = '使用預設語音 (可能非中文)';
        }
    }

    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();

    // Render Categories
    function renderCategories() {
        categoryNav.innerHTML = '';
        vocabulary.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `cat-btn ${cat.id === currentCategory.id ? 'active' : ''}`;
            btn.textContent = cat.name;
            btn.onclick = () => {
                currentCategory = cat;
                renderCategories(); // Re-render to update active state
                renderGrid();
            };
            categoryNav.appendChild(btn);
        });
    }

    // Render Grid
    function renderGrid() {
        gridContainer.innerHTML = '';
        currentCategory.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'word-card';
            card.innerHTML = `
                <div class="word-icon">${item.icon}</div>
                <div class="word-label">${item.text}</div>
            `;
            card.onclick = () => speakText(item.text, card);
            gridContainer.appendChild(card);
        });
    }

    // New Speak Function
    function speakText(text, element) {
        if (synth.speaking) {
            synth.cancel();
        }

        currentTextDisplay.textContent = text;

        const utterance = new SpeechSynthesisUtterance(text);

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.rate = 0.9; // Slightly slower
        utterance.pitch = 1.0;

        // Visual feedback
        if (element) {
            element.classList.add('playing');
            utterance.onend = () => {
                element.classList.remove('playing');
            };
            // Handle error case to remove class
            utterance.onerror = () => {
                element.classList.remove('playing');
            };
        }

        synth.speak(utterance);
    }

    // Bottom Bar Actions
    playBtn.onclick = () => {
        const text = currentTextDisplay.textContent;
        if (text) speakText(text);
    };

    clearBtn.onclick = () => {
        currentTextDisplay.textContent = '';
        if (synth.speaking) synth.cancel();
    };

    // Initial Render
    renderCategories();
    renderGrid();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    }
});
