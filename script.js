// =====================================================
// «СӨЙЛЕУ ӘЛЕМІНЕ САЯХАТ»
// ИНТЕРАКТИВТІ ЛОГОПЕДИЯЛЫҚ БАҒДАРЛАМА
// =====================================================

"use strict";

// =====================================================
// 1. БАҒДАРЛАМА ЖӘНЕ ПРОГРЕСС
// =====================================================

const App = {
    progress: null,
    currentSound: null,
    currentStage: null,
    currentTaskIndex: 0,
    currentGame: null,
    media: {
        camera: null,
        microphone: null,
        microphoneActive: false,
        audioContext: null,
        analyser: null,
        animation: null
    }
};

const STORAGE_KEY = "dislaliaProgramProgress";

function getProgram() {
    if (typeof PROGRAM_DATA === "undefined") {
        console.error("PROGRAM_DATA табылмады. data.js файлын тексер!");
        return null;
    }

    return PROGRAM_DATA;
}

function createDefaultProgress() {
    const template = getProgram()?.progressTemplate || {};

    return {
        ...template,
        childName: template.childName || "",
        completedTasks: [],
        completedStages: [],
        completedSounds: [],
        achievements: [],
        totalStars: 0,
        totalProgress: 0,
        selectedSound: "R",
        selectedStage: "preparation",
        diplomaUnlocked: false
    };
}

function loadProgress() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            App.progress = {
                ...createDefaultProgress(),
                ...parsed
            };

            return;
        }
    } catch (error) {
        console.error("Прогресті оқу қатесі:", error);
    }

    App.progress = createDefaultProgress();
}

function saveProgress() {
    if (!App.progress) return;

    App.progress.lastActivity = new Date().toISOString();

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(App.progress)
        );
    } catch (error) {
        console.error("Сақтау қатесі:", error);
        showToast("Прогресті сақтау мүмкін болмады.");
    }
}

// =====================================================
// 2. КӨМЕКШІ ФУНКЦИЯЛАР
// =====================================================

function byId(id) {
    return document.getElementById(id);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function showToast(message) {
    const toast = byId("toast");

    if (!toast) {
        console.log(message);
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function getSounds() {
    return getProgram()?.sounds || [];
}

function getCurrentSound() {
    return getSounds().find(
        sound => sound.id === App.currentSound
    );
}

function getCurrentStage() {
    const sound = getCurrentSound();

    return sound?.stages?.find(
        stage => stage.id === App.currentStage
    );
}

function getCurrentTask() {
    const stage = getCurrentStage();

    return stage?.tasks?.[App.currentTaskIndex] || null;
}

function isCompleted(taskId) {
    return App.progress.completedTasks.includes(taskId);
}

// =====================================================
// 3. БЕТТЕРДІ АУЫСТЫРУ
// =====================================================

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const page = byId(pageId);

    if (page) {
        page.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function navigateTo(page) {
    const pages = {
        home: "homePage",
        menu: "mainMenu",
        sounds: "soundSelection",
        stages: "stageSelection",
        task: "taskPage",
        breathing: "breathingPage",
        relaxation: "relaxationPage",
        motor: "motorPage",
        results: "resultsPage",
        diploma: "diplomaPage"
    };

    if (pages[page]) {
        showPage(pages[page]);
    }
}

// =====================================================
// 4. МОБИЛЬДІ МӘЗІР
// =====================================================

function setupMobileMenu() {
    const toggle = byId("menuToggle");
    const navigation = byId("mainNavigation");

    if (!toggle || !navigation) return;

    toggle.addEventListener("click", () => {
        navigation.classList.toggle("open");

        toggle.setAttribute(
            "aria-expanded",
            String(navigation.classList.contains("open"))
        );
    });
}

// =====================================================
// 5. ДЫБЫСТАРДЫ КӨРСЕТУ
// =====================================================

function renderSounds() {
    const container = byId("soundGrid");

    if (!container) return;

    container.innerHTML = getSounds().map(sound => {
        const completed = App.progress.completedSounds.includes(
            sound.id
        );

        return `
            <button class="sound-card"
                data-sound="${escapeHTML(sound.id)}">

                <span class="sound-icon">
                    ${escapeHTML(sound.icon || "🔤")}
                </span>

                <strong>
                    ${escapeHTML(sound.letter || sound.title || sound.id)}
                </strong>

                <small>
                    ${completed ? "✅ Аяқталды" : "Оқуды бастау"}
                </small>

            </button>
        `;
    }).join("");
}

function selectSound(soundId) {
    const sound = getSounds().find(
        item => item.id === soundId
    );

    if (!sound) {
        showToast("Дыбыс табылмады.");
        return;
    }

    App.currentSound = soundId;
    App.progress.selectedSound = soundId;

    saveProgress();
    renderStages();

    showPage("stageSelection");
}

// =====================================================
// 6. КЕЗЕҢДЕР
// =====================================================

function renderStages() {
    const container = byId("stageGrid");
    const sound = getCurrentSound();

    if (!container || !sound) return;

    const stageInfo = getProgram().stageInfo || [];

    const stages = stageInfo.map(info => {
        const actual = sound.stages?.find(
            stage => stage.id === info.id
        );

        return {
            ...info,
            ...actual
        };
    });

    const label = byId("selectedSoundLabel");

    if (label) {
        label.textContent =
            sound.letter || sound.title || sound.id;
    }

    container.innerHTML = stages.map(stage => {
        const tasks = stage.tasks || [];

        const completed = tasks.filter(
            task => isCompleted(task.id)
        ).length;

        const percent = tasks.length
            ? Math.round(completed / tasks.length * 100)
            : 0;

        return `
            <button class="stage-card"
                data-stage="${escapeHTML(stage.id)}">

                <span class="stage-icon">
                    ${escapeHTML(stage.icon || "🌟")}
                </span>

                <h3>${escapeHTML(stage.title)}</h3>

                <div class="progress-track">
                    <div class="progress-fill"
                        style="width:${percent}%"></div>
                </div>

                <p>${completed}/${tasks.length} тапсырма</p>

                <strong>${percent}%</strong>

            </button>
        `;
    }).join("");
}

function openStage(stageId) {
    const sound = getCurrentSound();

    if (!sound) return;

    const stage = sound.stages?.find(
        item => item.id === stageId
    );

    if (!stage) {
        showToast("Кезең табылмады.");
        return;
    }

    App.currentStage = stageId;
    App.currentTaskIndex = 0;

    App.progress.selectedStage = stageId;

    saveProgress();
    renderTaskPage();

    showPage("taskPage");
}

// =====================================================
// 7. ТАПСЫРМАЛАР
// =====================================================

function renderTaskPage() {
    const stage = getCurrentStage();

    if (!stage) return;

    const tasks = stage.tasks || [];

    const list = byId("taskList");

    if (list) {
        list.innerHTML = tasks.map((task, index) => `
            <button
                class="task-list-item
                ${isCompleted(task.id) ? "completed" : ""}
                ${index === App.currentTaskIndex ? "selected" : ""}"
                data-task-index="${index}">

                ${isCompleted(task.id) ? "⭐" : "○"}
                ${index + 1}. ${escapeHTML(task.title)}

            </button>
        `).join("");
    }

    renderCurrentTask();
}

function renderCurrentTask() {
    const task = getCurrentTask();

    if (!task) return;

    const title = byId("taskTitle");
    const meta = byId("taskMeta");
    const content = byId("taskContent");

    if (title) title.textContent = task.title || "";

    if (meta) {
        meta.textContent =
            `Тапсырма ${App.currentTaskIndex + 1} / 10`;
    }

    if (content) {
        content.innerHTML = `
            <div class="task-description">

                <h3>🎯 Мақсаты</h3>
                <p>${escapeHTML(task.goal || "")}</p>

                <h3>📖 Нұсқаулық</h3>
                <p>${escapeHTML(task.instruction || "")}</p>

                <div class="task-visual">
                    ${escapeHTML(task.visual || "🌟")}
                </div>

                <h3>📝 Орындау тәртібі</h3>
                <p>${escapeHTML(task.procedure || "")}</p>

                ${renderTaskInteraction(task)}

            </div>
        `;
    }

    const progress = byId("taskProgress");

    if (progress) {
        const completed = (getCurrentStage()?.tasks || [])
            .filter(item => isCompleted(item.id)).length;

        progress.style.width = `${completed * 10}%`;
    }

    const feedback = byId("taskFeedback");

    if (feedback) feedback.textContent = "";

    updateTaskButtons();
}

function renderTaskInteraction(task) {
    if (Array.isArray(task.options)) {
        return `
            <div class="task-options">
                ${task.options.map((option, index) => `
                    <button class="option-button"
                        data-option-index="${index}">
                        ${escapeHTML(
                            typeof option === "object"
                                ? option.text || option.label || ""
                                : option
                        )}
                    </button>
                `).join("")}
            </div>
        `;
    }

    if (task.type === "mirror") {
        return `
            <div class="interaction-panel">
                <p>🪞 Айнаға қарап жаттығуды орында.</p>
                <button class="primary-button"
                    onclick="speakText('${escapeHTML(task.audioText || task.title)}')">
                    🔊 Тыңдау
                </button>
            </div>
        `;
    }

    return `
        <div class="interaction-panel">
            <button class="primary-button"
                onclick="speakText('${escapeHTML(task.audioText || task.title)}')">
                🔊 Тапсырманы тыңдау
            </button>
        </div>
    `;
}

function checkTaskAnswer(index) {
    const task = getCurrentTask();

    if (!task) return;

    const selected = task.options?.[index];

    const selectedValue = typeof selected === "object"
        ? selected.value ?? selected.text ?? selected.label
        : selected;

    const answerValue = typeof task.answer === "object"
        ? task.answer.value ?? task.answer.text
        : task.answer;

    const correct =
        String(selectedValue) === String(answerValue) ||
        String(index) === String(answerValue);

    const feedback = byId("taskFeedback");

    if (correct) {
        if (feedback) {
            feedback.textContent = "🎉 Дұрыс! Жарайсың!";
        }

        completeCurrentTask();
    } else {
        if (feedback) {
            feedback.textContent =
                "🌱 Тағы бір рет ойланып көр!";
        }
    }
}

function completeCurrentTask() {
    const task = getCurrentTask();

    if (!task) return;

    if (!isCompleted(task.id)) {
        App.progress.completedTasks.push(task.id);
    }

    updateProgress();
    saveProgress();
    renderTaskPage();

    showToast("⭐ Жарайсың! Тапсырма орындалды!");
}

function changeTask(direction) {
    const tasks = getCurrentStage()?.tasks || [];

    const next = App.currentTaskIndex + direction;

    if (next < 0 || next >= tasks.length) return;

    App.currentTaskIndex = next;

    renderTaskPage();
}

function updateTaskButtons() {
    const tasks = getCurrentStage()?.tasks || [];

    const previous = byId("previousTaskButton");
    const next = byId("nextTaskButton");
    const complete = byId("completeTaskButton");

    if (previous) {
        previous.disabled = App.currentTaskIndex === 0;
    }

    if (next) {
        next.disabled = App.currentTaskIndex >= tasks.length - 1;
    }

    if (complete) {
        complete.textContent = isCompleted(
            getCurrentTask()?.id
        ) ? "✅ Орындалды" : "⭐ Тапсырманы аяқтау";
    }
}

// =====================================================
// 8. ДАУЫСТАП ОҚУ
// =====================================================

function speakText(text) {
    if (!("speechSynthesis" in window)) {
        showToast("Браузерде дауыс функциясы жоқ.");
        return;
    }

    const speech = window.speechSynthesis;

    speech.cancel();

    const utterance = new SpeechSynthesisUtterance(
        String(text || "")
    );

    utterance.lang = "kk-KZ";
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

    const voices = speech.getVoices();

    const voice = voices.find(item =>
        item.lang.toLowerCase().startsWith("kk")
    );

    if (voice) utterance.voice = voice;

    utterance.onerror = event => {
        console.error("Дауыс қатесі:", event.error);
        showToast("Дауыс ойнатылмады.");
    };

    speech.resume();
    speech.speak(utterance);
}

// =====================================================
// 9. ТЫНЫС АЛУ ОЙЫНДАРЫ
// =====================================================

function renderBreathingGames() {
    const container = byId("breathingContent");

    if (!container) return;

    const games = getProgram().breathingGames || [];

    container.innerHTML = games.map((game, index) => `
        <div class="game-card">

            <div class="game-icon">🌬️</div>

            <h3>${escapeHTML(game.title)}</h3>

            <p>${escapeHTML(game.goal || "")}</p>

            <p>${escapeHTML(game.instruction || "")}</p>

            <button class="primary-button"
                data-game="breathing"
                data-index="${index}">
                Ойынды бастау
            </button>

            <div id="breathingResult${index}"></div>

        </div>
    `).join("");
}

function startBreathingGame(index) {
    const game = getProgram().breathingGames?.[index];

    const result = byId(`breathingResult${index}`);

    if (!game || !result) return;

    if (index === 0 || game.id === "B-01") {
        result.innerHTML = `
            <div class="cotton-game">

                <h3>☁️ Мақтаны ұшыр!</h3>

                <p>Мақтаны мәреге жеткіз.</p>

                <div class="cotton-track">
                    <span id="cottonBall">☁️</span>
                    <span class="cotton-finish">🏁</span>
                </div>

                <p id="cottonMessage">
                    Үрлеу батырмасын бас!
                </p>

                <button class="primary-button"
                    id="cottonBlowButton">
                    🌬️ ҮРЛЕУ
                </button>

                <button class="secondary-button"
                    id="cottonResetButton">
                    Қайта бастау
                </button>

            </div>
        `;

        let position = 0;

        const cotton = byId("cottonBall");
        const message = byId("cottonMessage");

        byId("cottonBlowButton").onclick = () => {
            position = Math.min(position + 12, 88);

            cotton.style.left = position + "%";

            cotton.classList.remove("cotton-fly");
            void cotton.offsetWidth;
            cotton.classList.add("cotton-fly");

            if (position >= 88) {
                message.textContent =
                    "🏆 Жарайсың! Мақта мәреге жетті!";
            } else {
                message.textContent =
                    "Тамаша! Тағы бір рет үрле!";
            }
        };

        byId("cottonResetButton").onclick = () => {
            position = 0;
            cotton.style.left = "0%";
            message.textContent = "Қайта бастайық!";
        };

        return;
    }

    result.innerHTML = `
        <div class="game-play-area">
            <div class="breathing-animation">🌸</div>
            <p>${escapeHTML(game.procedure || game.instruction || "")}</p>
            <button class="primary-button"
                onclick="finishSupplementaryGame(this)">
                Аяқтау
            </button>
        </div>
    `;
}

// =====================================================
// 10. ҰСАҚ МОТОРИКА: НҮКТЕЛЕРДІ ҚОСУ
// =====================================================

function renderDotGame() {
    const container = byId("motorContent");

    if (!container) return;

    container.innerHTML = `
        <div class="game-card">

            <h2>🔵 Нүктелерді ретімен қос</h2>

            <p>
                1-ден 6-ға дейінгі нүктелерді ретімен бас.
                Суретті құрастырып көр!
            </p>

            <div class="dot-game-board" id="dotBoard">

                <svg id="dotLines"
                    viewBox="0 0 300 220"
                    preserveAspectRatio="none">
                </svg>

                <button class="dot-point" data-dot="1"
                    style="left:15%;top:75%">1</button>

                <button class="dot-point" data-dot="2"
                    style="left:30%;top:25%">2</button>

                <button class="dot-point" data-dot="3"
                    style="left:50%;top:15%">3</button>

                <button class="dot-point" data-dot="4"
                    style="left:70%;top:30%">4</button>

                <button class="dot-point" data-dot="5"
                    style="left:85%;top:75%">5</button>

                <button class="dot-point" data-dot="6"
                    style="left:50%;top:85%">6</button>

            </div>

            <p id="dotMessage">
                Бірінші нүктені бас!
            </p>

            <button class="secondary-button"
                id="resetDots">
                Қайта бастау
            </button>

        </div>
    `;

    let expected = 1;
    const points = [...container.querySelectorAll(".dot-point")];
    const svg = byId("dotLines");

    points.forEach(point => {
        point.addEventListener("click", () => {
            const number = Number(point.dataset.dot);

            if (number !== expected) {
                byId("dotMessage").textContent =
                    "🌱 Келесі дұрыс нүктені тап!";
                return;
            }

            point.classList.add("dot-active");

            if (expected > 1) {
                const previous = points.find(
                    item => Number(item.dataset.dot) === expected - 1
                );

                const a = previous.getBoundingClientRect();
                const b = point.getBoundingClientRect();
                const parent = byId("dotBoard").getBoundingClientRect();

                const x1 = (a.left + a.width / 2 - parent.left)
                    / parent.width * 300;

                const y1 = (a.top + a.height / 2 - parent.top)
                    / parent.height * 220;

                const x2 = (b.left + b.width / 2 - parent.left)
                    / parent.width * 300;

                const y2 = (b.top + b.height / 2 - parent.top)
                    / parent.height * 220;

                svg.innerHTML += `
                    <line x1="${x1}" y1="${y1}"
                        x2="${x2}" y2="${y2}"
                        stroke="#8b5cf6"
                        stroke-width="4"
                        stroke-linecap="round"/>
                `;
            }

            expected++;

            if (expected === 7) {
                byId("dotMessage").textContent =
                    "🎉 Жарайсың! Барлық нүктені қостың!";
            } else {
                byId("dotMessage").textContent =
                    `Керемет! Енді ${expected}-нүктені бас.`;
            }
        });
    });

    byId("resetDots").onclick = renderDotGame;
}

// =====================================================
// 11. ҰСАҚ МОТОРИКА: ЛАБИРИНТ
// =====================================================

function renderMazeGame() {
    const container = byId("motorContent");

    if (!container) return;

    const maze = [
        [0, 0, 1, 0, 0],
        [1, 0, 1, 0, 1],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]
    ];

    let player = { row: 0, col: 0 };

    function draw() {
        container.innerHTML = `
            <div class="game-card">

                <h2>🐰 Қоянға жол көрсет!</h2>

                <p>Қоянды сәбізге жеткіз.</p>

                <div class="maze-board">
                    ${maze.map((row, r) => row.map((cell, c) => {
                        let content = "";

                        if (player.row === r && player.col === c) {
                            content = "🐰";
                        } else if (r === 4 && c === 4) {
                            content = "🥕";
                        } else if (cell === 1) {
                            content = "🧱";
                        }

                        return `
                            <div class="maze-cell
                                ${cell === 1 ? "wall" : ""}">
                                ${content}
                            </div>
                        `;
                    }).join("")).join("")}
                </div>

                <div class="maze-controls">
                    <button data-move="up">⬆️</button>
                    <button data-move="left">⬅️</button>
                    <button data-move="down">⬇️</button>
                    <button data-move="right">➡️</button>
                </div>

                <p id="mazeMessage">Қоянға көмектес!</p>

                <button class="secondary-button"
                    id="resetMaze">
                    Қайта бастау
                </button>

            </div>
        `;

        container.querySelectorAll("[data-move]").forEach(button => {
            button.onclick = () => move(button.dataset.move);
        });

        byId("resetMaze").onclick = () => {
            player = { row: 0, col: 0 };
            draw();
        };
    }

    function move(direction) {
        const moves = {
            up: [-1, 0],
            down: [1, 0],
            left: [0, -1],
            right: [0, 1]
        };

        const [dr, dc] = moves[direction];

        const row = player.row + dr;
        const col = player.col + dc;

        if (
            row < 0 || row >= 5 ||
            col < 0 || col >= 5 ||
            maze[row][col] === 1
        ) {
            byId("mazeMessage").textContent =
                "Бұл жол жабық. Басқа жолды таңда!";
            return;
        }

        player = { row, col };

        if (row === 4 && col === 4) {
            draw();
            byId("mazeMessage").textContent =
                "🏆 Қоян сәбізге жетті! Жарайсың!";
            return;
        }

        draw();
    }

    draw();
}

// =====================================================
// 12. ҰСАҚ МОТОРИКА: ПАЗЛ
// =====================================================

function renderPuzzleGame() {
    const container = byId("motorContent");

    if (!container) return;

    const pieces = ["🌸", "🦋", "🌈", "☁️"];

    let order = [...pieces].sort(() => Math.random() - 0.5);

    container.innerHTML = `
        <div class="game-card">

            <h2>🧩 Пазл құрастыр</h2>

            <p>Суреттерді дұрыс ретке орналастыр.</p>

            <div class="puzzle-board" id="puzzleBoard">
                ${order.map((piece, index) => `
                    <button class="puzzle-piece"
                        draggable="true"
                        data-index="${index}">
                        ${piece}
                    </button>
                `).join("")}
            </div>

            <p id="puzzleMessage">
                Екі бөліктің орнын ауыстыр.
            </p>

            <button class="secondary-button"
                id="puzzleReset">
                Қайта араластыру
            </button>

        </div>
    `;

    let first = null;

    const board = byId("puzzleBoard");

    function bindPieces() {
        board.querySelectorAll(".puzzle-piece").forEach(button => {
            button.onclick = () => {
                if (first === null) {
                    first = Number(button.dataset.index);
                    button.classList.add("selected");
                    return;
                }

                const second = Number(button.dataset.index);

                [order[first], order[second]] =
                    [order[second], order[first]];

                first = null;
                draw();
            };
        });
    }

    function draw() {
        board.innerHTML = order.map((piece, index) => `
            <button class="puzzle-piece"
                data-index="${index}">
                ${piece}
            </button>
        `).join("");

        bindPieces();

        if (order.every((piece, index) => piece === pieces[index])) {
            byId("puzzleMessage").textContent =
                "🎉 Пазл толық құрастырылды!";
        }
    }

    byId("puzzleReset").onclick = () => {
        order = [...pieces].sort(() => Math.random() - 0.5);
        first = null;
        draw();
        byId("puzzleMessage").textContent =
            "Қайтадан құрастырып көр!";
    };

    bindPieces();
}

// =====================================================
// 13. ҰСАҚ МОТОРИКА БӨЛІМІ
// =====================================================

function renderFineMotorGames() {
    const container = byId("motorContent");

    if (!container) return;

    container.innerHTML = `
        <div class="motor-menu">

            <button class="game-card"
                onclick="renderDotGame()">
                <span>🔵</span>
                <h3>Нүктелерді қос</h3>
                <p>Нүктелерді ретімен байланыстыру.</p>
            </button>

            <button class="game-card"
                onclick="renderMazeGame()">
                <span>🐰</span>
                <h3>Лабиринт</h3>
                <p>Қоянға дұрыс жолды тап.</p>
            </button>

            <button class="game-card"
                onclick="renderPuzzleGame()">
                <span>🧩</span>
                <h3>Пазл</h3>
                <p>Суреттің бөліктерін жина.</p>
            </button>

        </div>
    `;
}

// =====================================================
// 14. СЕРГІТУ СӘТІ
// =====================================================

const RELAXATION_VIDEOS = [
    {
        title: "Балаларға арналған сергіту сәті",
        url: "https://www.youtube.com/embed/05vbfFqqTu4"
    },
    {
        title: "Қимыл-қозғалыс жаттығулары",
        url: "https://www.youtube.com/embed/0i9SAAmtVSk"
    },
    {
        title: "Көңілді балалар жаттығуы",
        url: "https://www.youtube.com/embed/8VzI1ztH8ek"
    }
];

function renderRelaxationGames() {
    const container = byId("relaxationContent");

    if (!container) return;

    container.innerHTML = RELAXATION_VIDEOS.map((video, index) => `
        <div class="game-card">

            <h3>🎵 ${escapeHTML(video.title)}</h3>

            <div class="video-container">
                <iframe
                    src="${video.url}"
                    title="${escapeHTML(video.title)}"
                    allow="accelerometer; autoplay; clipboard-write;
                    encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            </div>

            <button class="primary-button"
                onclick="speakText('${escapeHTML(video.title)}')">
                🔊 Жаттығуды тыңдау
            </button>

        </div>
    `).join("");
}

// =====================================================
// 15. ҚОСЫМША ОЙЫНДЫ АЯҚТАУ
// =====================================================

function finishSupplementaryGame(button) {
    const card = button.closest(".game-card");

    if (card) {
        card.classList.add("game-finished");
    }

    button.textContent = "✅ Орындалды";
    button.disabled = true;

    showToast("Жарайсың! Жаттығу аяқталды!");
}

// =====================================================
// 16. ПРОГРЕСС
// =====================================================

function updateProgress() {
    const sounds = getSounds();

    let totalTasks = 0;
    let completedTasks = 0;

    sounds.forEach(sound => {
        (sound.stages || []).forEach(stage => {
            (stage.tasks || []).forEach(task => {
                totalTasks++;

                if (isCompleted(task.id)) {
                    completedTasks++;
                }
            });
        });
    });

    App.progress.totalStars = completedTasks;

    App.progress.totalProgress = totalTasks
        ? Math.round(completedTasks / totalTasks * 100)
        : 0;

    updateCompletedStages();
    updateCompletedSounds();

    App.progress.diplomaUnlocked =
        completedTasks >= 400 &&
        App.progress.completedStages.length >= 40 &&
        App.progress.completedSounds.length >= 10;

    saveProgress();
}

function updateCompletedStages() {
    const completed = [];

    getSounds().forEach(sound => {
        (sound.stages || []).forEach(stage => {
            const tasks = stage.tasks || [];

            if (
                tasks.length === 10 &&
                tasks.every(task => isCompleted(task.id))
            ) {
                completed.push(`${sound.id}-${stage.id}`);
            }
        });
    });

    App.progress.completedStages = completed;
}

function updateCompletedSounds() {
    App.progress.completedSounds = getSounds()
        .filter(sound => {
            const stages = sound.stages || [];

            return stages.length === 4 &&
                stages.every(stage =>
                    (stage.tasks || []).length === 10 &&
                    stage.tasks.every(task => isCompleted(task.id))
                );
        })
        .map(sound => sound.id);
}

// =====================================================
// 17. НӘТИЖЕ
// =====================================================

function renderResults() {
    const container = byId("resultsContent");

    if (!container) return;

    updateProgress();

    container.innerHTML = `
        <div class="results-summary">

            <h2>🏆 Менің нәтижем</h2>

            <div class="result-stat">
                <strong>${App.progress.totalProgress}%</strong>
                <span>Жалпы орындалу</span>
            </div>

            <div class="result-stat">
                <strong>${App.progress.completedTasks.length}</strong>
                <span>Орындалған тапсырма</span>
            </div>

            <div class="result-stat">
                <strong>${App.progress.totalStars} ⭐</strong>
                <span>Жиналған жұлдыз</span>
            </div>

            <div class="result-stat">
                <strong>${App.progress.completedSounds.length}/10</strong>
                <span>Аяқталған дыбыс</span>
            </div>

        </div>

        <div class="sound-results">
            ${getSounds().map(sound => `
                <div class="sound-result-card">
                    <strong>
                        ${escapeHTML(sound.letter || sound.id)}
                    </strong>
                    <span>
                        ${sound.stages?.reduce(
                            (sum, stage) =>
                                sum + (stage.tasks || []).filter(
                                    task => isCompleted(task.id)
                                ).length,
                            0
                        ) || 0}/40
                    </span>
                </div>
            `).join("")}
        </div>
    `;
}

// =====================================================
// 18. БАЛАНЫҢ АТЫН САҚТАУ
// =====================================================

function saveChildName() {
    const input = byId("childName");

    if (!input) return;

    App.progress.childName = input.value.trim();

    saveProgress();

    showToast("Аты сақталды!");
}

// =====================================================
// 19. ДИПЛОМ
// =====================================================

function renderDiploma() {
    const container = byId("diplomaContent");

    if (!container) return;

    updateProgress();

    const name = escapeHTML(
        App.progress.childName || "________________"
    );

    if (!App.progress.diplomaUnlocked) {
        container.innerHTML = `
            <div class="diploma-locked">

                <h2>🔒 Диплом әзірге жабық</h2>

                <p>
                    Диплом алу үшін 10 дыбыс бойынша
                    400 тапсырманы орындау қажет.
                </p>

                <p>
                    Қазіргі нәтиже:
                    ${App.progress.completedTasks.length}/400
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML = `
        <div class="diploma">

            <div class="diploma-decoration">
                🌈 ⭐ 🦋 🌟
            </div>

            <h1>🏆 ДЫБЫСТАР ШЕБЕРІ 🏆</h1>

            <h3>МАДАҚТАМА</h3>

            <p>Марапатталады:</p>

            <h2>${name}</h2>

            <p>
                «Сөйлеу әлеміне саяхат»
                интерактивті бағдарламасының
                барлық 400 тапсырмасын орындағаны үшін.
            </p>

            <h3>⭐ ${App.progress.totalStars} жұлдыз</h3>

            <p>
                Берілген күні:
                ${new Date().toLocaleDateString("kk-KZ")}
            </p>

            <p>Бағдарлама авторы</p>

        </div>
    `;
}

function printDiploma() {
    if (!App.progress.diplomaUnlocked) {
        showToast("Алдымен барлық тапсырманы аяқта!");
        return;
    }

    renderDiploma();
    window.print();
}

// =====================================================
// 20. КАМЕРА
// =====================================================

async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        App.media.camera = stream;

        const video = byId("cameraVideo");

        if (video) {
            video.srcObject = stream;
            video.play();
        }

        if (byId("cameraStatus")) {
            byId("cameraStatus").textContent =
                "Камера қосылды";
        }

    } catch (error) {
        console.error(error);
        showToast("Камераға рұқсат берілмеді.");
    }
}

function stopCamera() {
    if (App.media.camera) {
        App.media.camera.getTracks().forEach(track => track.stop());
        App.media.camera = null;
    }

    const video = byId("cameraVideo");

    if (video) video.srcObject = null;

    if (byId("cameraStatus")) {
        byId("cameraStatus").textContent = "Камера өшірулі";
    }
}

// =====================================================
// 21. МИКРОФОН
// =====================================================

async function startMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            showToast("Аудио талдау қолжетімсіз.");
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        const context = new AudioContextClass();

        const analyser = context.createAnalyser();
        const source = context.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        source.connect(analyser);

        App.media.microphone = stream;
        App.media.audioContext = context;
        App.media.analyser = analyser;
        App.media.microphoneActive = true;

        measureSoundLevel();

        if (byId("microphoneStatus")) {
            byId("microphoneStatus").textContent =
                "Микрофон қосылды";
        }

    } catch (error) {
        console.error(error);
        showToast("Микрофонға рұқсат берілмеді.");
    }
}

function measureSoundLevel() {
    const analyser = App.media.analyser;

    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);

    analyser.getByteFrequencyData(data);

    const average = data.reduce(
        (sum, value) => sum + value,
        0
    ) / data.length;

    const level = byId("soundLevel");

    if (level) {
        if (average < 20) {
            level.textContent = "Дыбыс әлсіз";
        } else if (average < 65) {
            level.textContent = "Дыбыс орташа";
        } else {
            level.textContent = "Дыбыс қатты";
        }
    }

    App.media.animation =
        requestAnimationFrame(measureSoundLevel);
}

function stopMicrophone() {
    if (App.media.animation) {
        cancelAnimationFrame(App.media.animation);
        App.media.animation = null;
    }

    if (App.media.microphone) {
        App.media.microphone.getTracks().forEach(track => track.stop());
        App.media.microphone = null;
    }

    if (App.media.audioContext) {
        App.media.audioContext.close();
        App.media.audioContext = null;
    }

    App.media.analyser = null;
    App.media.microphoneActive = false;

    if (byId("microphoneStatus")) {
        byId("microphoneStatus").textContent =
            "Микрофон өшірулі";
    }

    if (byId("soundLevel")) {
        byId("soundLevel").textContent = "";
    }
}

// =====================================================
// 22. БАТЫРМАЛАРДЫ БАЙЛАНЫСТЫРУ
// =====================================================

function setupEvents() {
    document.addEventListener("click", event => {
        const soundButton = event.target.closest("[data-sound]");

        if (soundButton) {
            selectSound(soundButton.dataset.sound);
            return;
        }

        const stageButton = event.target.closest("[data-stage]");

        if (stageButton) {
            openStage(stageButton.dataset.stage);
            return;
        }

        const taskButton = event.target.closest("[data-task-index]");

        if (taskButton) {
            App.currentTaskIndex =
                Number(taskButton.dataset.taskIndex);

            renderTaskPage();
            return;
        }

        const optionButton = event.target.closest(
            "[data-option-index]"
        );

        if (optionButton) {
            checkTaskAnswer(
                Number(optionButton.dataset.optionIndex)
            );
            return;
        }

        const pageButton = event.target.closest("[data-page]");

        if (pageButton) {
            navigateTo(pageButton.dataset.page);
            return;
        }

        const gameButton = event.target.closest("[data-game]");

        if (gameButton) {
            const index = Number(gameButton.dataset.index);

            if (gameButton.dataset.game === "breathing") {
                startBreathingGame(index);
            }
            return;
        }
    });

    byId("completeTaskButton")?.addEventListener(
        "click",
        completeCurrentTask
    );

    byId("previousTaskButton")?.addEventListener(
        "click",
        () => changeTask(-1)
    );

    byId("nextTaskButton")?.addEventListener(
        "click",
        () => changeTask(1)
    );

    byId("saveNameButton")?.addEventListener(
        "click",
        saveChildName
    );

    byId("printDiplomaButton")?.addEventListener(
        "click",
        printDiploma
    );

    byId("cameraStartButton")?.addEventListener(
        "click",
        startCamera
    );

    byId("cameraStopButton")?.addEventListener(
        "click",
        stopCamera
    );

    byId("microphoneStartButton")?.addEventListener(
        "click",
        startMicrophone
    );

    byId("microphoneStopButton")?.addEventListener(
        "click",
        stopMicrophone
    );

    byId("taskMicButton")?.addEventListener(
        "click",
        startMicrophone
    );

    byId("childName")?.addEventListener("change", saveChildName);
}

// =====================================================
// 23. БАСТАПҚЫ ІСКЕ ҚОСУ
// =====================================================

function initializeProgram() {
    if (!getProgram()) return;

    loadProgress();

    updateProgress();

    renderSounds();
    renderBreathingGames();
    renderRelaxationGames();
    renderFineMotorGames();
    renderResults();
    renderDiploma();

    const nameInput = byId("childName");

    if (nameInput) {
        nameInput.value = App.progress.childName || "";
    }

    setupMobileMenu();
    setupEvents();

    console.log("Сөйлеу әлеміне саяхат іске қосылды!");
}

document.addEventListener(
    "DOMContentLoaded",
    initializeProgram
);

// =====================================================
// 24. БЕТ ЖАБЫЛҒАНДА ҚҰРЫЛҒЫЛАРДЫ ӨШІРУ
// =====================================================

window.addEventListener("beforeunload", () => {
    stopCamera();
    stopMicrophone();
});
