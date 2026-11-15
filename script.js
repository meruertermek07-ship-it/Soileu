/* ==========================================
   СӨЙЛЕУ ӘЛЕМІНЕ САЯХАТ
   Негізгі басқару жүйесі
   ========================================== */

"use strict";

/* ---------- НЕГІЗГІ КҮЙ ---------- */

const App = {
    currentPage: "homePage",
    currentSound: "R",
    currentStage: "preparation",
    currentTaskIndex: 0,
    currentTasks: [],
    progress: null,
    cameraStream: null,
    microphoneStream: null,
    audioContext: null,
    animationFrame: null
};


/* ---------- ДЕРЕКТЕРДІ ТЕКСЕРУ ---------- */

function checkProgramData() {
    if (typeof PROGRAM_DATA === "undefined") {
        alert("Қате: data.js файлы жүктелмеді!");
        return false;
    }

    if (!Array.isArray(PROGRAM_DATA.sounds)) {
        alert("Қате: PROGRAM_DATA.sounds табылмады!");
        return false;
    }

    if (!Array.isArray(PROGRAM_DATA.stageInfo)) {
        alert("Қате: кезеңдер тізімі табылмады!");
        return false;
    }

    return true;
}


/* ---------- ПРОГРЕСТІ ЖҮКТЕУ ---------- */

function createDefaultProgress() {
    const template = PROGRAM_DATA.progressTemplate || {};

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
    const storageKey =
        PROGRAM_DATA.progressSettings?.storageKey ||
        "dislaliaProgramProgress";

    try {
        const saved = localStorage.getItem(storageKey);

        if (!saved) {
            App.progress = createDefaultProgress();
            return;
        }

        const parsed = JSON.parse(saved);

        App.progress = {
            ...createDefaultProgress(),
            ...parsed,
            completedTasks: Array.isArray(parsed.completedTasks)
                ? parsed.completedTasks : [],
            completedStages: Array.isArray(parsed.completedStages)
                ? parsed.completedStages : [],
            completedSounds: Array.isArray(parsed.completedSounds)
                ? parsed.completedSounds : [],
            achievements: Array.isArray(parsed.achievements)
                ? parsed.achievements : []
        };

    } catch (error) {
        console.error("Прогресті оқу қатесі:", error);
        App.progress = createDefaultProgress();
    }
}


/* ---------- ПРОГРЕСТІ САҚТАУ ---------- */

function saveProgress() {
    const storageKey =
        PROGRAM_DATA.progressSettings?.storageKey ||
        "dislaliaProgramProgress";

    App.progress.lastActivity = new Date().toISOString();

    localStorage.setItem(
        storageKey,
        JSON.stringify(App.progress)
    );
}


/* ---------- БЕТТЕРДІ АУЫСТЫРУ ---------- */

function showPage(pageId) {
    const target = document.getElementById(pageId);

    if (!target) {
        console.error("Бет табылмады:", pageId);
        return;
    }

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    target.classList.add("active");

    App.currentPage = pageId;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (pageId === "soundSelection") {
        renderSounds();
    }

    if (pageId === "stageSelection") {
        renderStages();
    }

    if (pageId === "resultsPage") {
        renderResults();
    }

    if (pageId === "diplomaPage") {
        renderDiploma();
    }

    if (pageId === "breathingPage") {
        renderBreathingGames();
    }

    if (pageId === "relaxationPage") {
        renderRelaxationGames();
    }

    if (pageId === "motorPage") {
        renderFineMotorGames();
    }
}


/* ---------- ДЫБЫСТАРДЫ КӨРСЕТУ ---------- */

function renderSounds() {
    const grid = document.getElementById("soundGrid");

    if (!grid) return;

    grid.innerHTML = "";

    PROGRAM_DATA.sounds.forEach(sound => {
        const card = document.createElement("button");

        card.className = "sound-card";

        const letter = sound.letter || sound.sound || sound.id;

        card.innerHTML = `
            <span class="sound-letter">${letter}</span>
            <h3>${sound.name || letter + " дыбысы"}</h3>
            <p>${sound.description || "Дыбыспен саяхат"}</p>
        `;

        card.addEventListener("click", () => {
            selectSound(sound.id);
        });

        grid.appendChild(card);
    });
}


/* ---------- ДЫБЫСТЫ ТАҢДАУ ---------- */

function selectSound(soundId) {
    const sound = getSoundById(soundId);

    if (!sound) {
        showToast("Дыбыс табылмады!");
        return;
    }

    App.currentSound = soundId;
    App.progress.selectedSound = soundId;

    saveProgress();

    showPage("stageSelection");
}


/* ---------- КЕЗЕҢДЕРДІ КӨРСЕТУ ---------- */

function renderStages() {
    const grid = document.getElementById("stageGrid");

    if (!grid) return;

    const sound = getSoundById(App.currentSound);

    if (!sound) return;

    const label = document.getElementById("selectedSoundLabel");

    if (label) {
        label.textContent =
            `${sound.letter || sound.sound || sound.id} дыбысы`;
    }

    grid.innerHTML = "";

    PROGRAM_DATA.stageInfo.forEach(stage => {
        const tasks =
            sound.stages?.find(s => s.id === stage.id)?.tasks || [];

        const completed = tasks.filter(task =>
            App.progress.completedTasks.includes(task.id)
        ).length;

        const percent = tasks.length
            ? Math.round(completed / tasks.length * 100)
            : 0;

        const card = document.createElement("button");

        card.className = "stage-card";

        card.innerHTML = `
            <span>${stage.icon || "⭐"}</span>
            <h3>${stage.title}</h3>
            <p>${stage.description || ""}</p>

            <div class="progress-track">
                <div class="progress-fill"
                     style="width:${percent}%"></div>
            </div>

            <small>${completed}/10 тапсырма · ${percent}%</small>
        `;

        card.addEventListener("click", () => {
            openStage(stage.id);
        });

        grid.appendChild(card);
    });
}


/* ---------- КЕЗЕҢДІ АШУ ---------- */

function openStage(stageId) {
    const sound = getSoundById(App.currentSound);

    if (!sound) return;

    const stage = sound.stages?.find(s => s.id === stageId);

    if (!stage || !Array.isArray(stage.tasks)) {
        showToast("Бұл кезеңнің тапсырмалары табылмады.");
        return;
    }

    App.currentStage = stageId;
    App.currentTasks = stage.tasks;
    App.currentTaskIndex = 0;

    App.progress.selectedStage = stageId;

    saveProgress();

    renderTaskPage();

    showPage("taskPage");
}


/* ---------- ТАПСЫРМА БЕТІ ---------- */

function renderTaskPage() {
    const title = document.getElementById("taskTitle");
    const meta = document.getElementById("taskMeta");
    const list = document.getElementById("taskList");

    if (!App.currentTasks.length) return;

    const stage = PROGRAM_DATA.stageInfo.find(
        s => s.id === App.currentStage
    );

    if (title) {
        title.textContent = stage?.title || "Тапсырмалар";
    }

    if (meta) {
        meta.textContent =
            `Тапсырма ${App.currentTaskIndex + 1} / ${App.currentTasks.length}`;
    }

    if (list) {
        list.innerHTML = "";

        App.currentTasks.forEach((task, index) => {
            const button = document.createElement("button");

            const done =
                App.progress.completedTasks.includes(task.id);

            button.className = "task-card";

            button.textContent =
                `${done ? "⭐" : "○"} ${index + 1}. ${task.title}`;

            button.addEventListener("click", () => {
                App.currentTaskIndex = index;
                renderTaskPage();
            });

            list.appendChild(button);
        });
    }

    renderCurrentTask();
}


/* ---------- АҒЫМДАҒЫ ТАПСЫРМА ---------- */

function renderCurrentTask() {
    const task = App.currentTasks[App.currentTaskIndex];

    if (!task) return;

    const content = document.getElementById("taskContent");

    const feedback = document.getElementById("taskFeedback");

    const progress = document.getElementById("taskProgress");

    if (!content) return;

    if (feedback) feedback.textContent = "";

    const done =
        App.progress.completedTasks.includes(task.id);

    content.innerHTML = `
        <article class="task-detail">

            <div class="task-visual">
                ${task.visual || "🌟"}
            </div>

            <h2>${task.title}</h2>

            <div class="task-goal">
                <strong>Мақсаты:</strong>
                ${task.goal || ""}
            </div>

            <div class="task-instruction">
                <strong>Нұсқаулық:</strong>
                ${task.instruction || ""}
            </div>

            <div class="task-procedure">
                <strong>Орындалу барысы:</strong>
                ${formatProcedure(task.procedure)}
            </div>

            ${renderTaskInteraction(task)}

            <p class="task-status">
                ${done ? "⭐ Бұл тапсырма орындалды!" : "Тапсырманы орындап көр!"}
            </p>

        </article>
    `;

    if (progress) {
        const completed = App.currentTasks.filter(t =>
            App.progress.completedTasks.includes(t.id)
        ).length;

        progress.innerHTML = `
            <div class="progress-track">
                <div class="progress-fill"
                     style="width:${completed * 10}%"></div>
            </div>
            <p>${completed * 10}% орындалды</p>
        `;
    }

    updateTaskButtons();
}


/* ---------- ОРЫНДАУ БАРЫСЫН ПІШІМДЕУ ---------- */

function formatProcedure(procedure) {
    if (Array.isArray(procedure)) {
        return `<ol>${procedure.map(item =>
            `<li>${item}</li>`
        ).join("")}</ol>`;
    }

    return procedure || "Нұсқаулық бойынша орында.";
}


/* ---------- ТАПСЫРМА ТҮРЛЕРІ ---------- */

function renderTaskInteraction(task) {
    const options = task.options;

    if (Array.isArray(options) && options.length) {
        return `
            <div class="task-action-area">
                <h3>Дұрыс жауапты таңда:</h3>

                <div class="options-grid">
                    ${options.map((option, index) => `
                        <button class="option-button"
                                data-option-index="${index}">
                            ${option}
                        </button>
                    `).join("")}
                </div>
            </div>
        `;
    }

    if (task.type === "mirror") {
        return `
            <div class="task-action-area">
                <p>Айнаға қарап жаттығуды орында.</p>
                <button class="primary-button"
                        data-action="speak"
                        data-text="${escapeAttribute(task.audioText || task.title)}">
                    🔊 Нұсқауды тыңдау
                </button>
            </div>
        `;
    }

    if (task.type === "microphone") {
        return `
            <div class="task-action-area">
                <p>Дыбысты анық және асықпай айтып көр.</p>
                <button class="primary-button"
                        id="taskMicButton">
                    🎤 Микрофонды қосу
                </button>
                <div id="taskMicLevel"></div>
            </div>
        `;
    }

    return `
        <div class="task-action-area">
            <button class="primary-button"
                    data-action="speak"
                    data-text="${escapeAttribute(task.audioText || task.example || task.title)}">
                🔊 Тыңдау
            </button>
        </div>
    `;
}


/* ---------- HTML ҚАУІПСІЗДІГІ ---------- */

function escapeAttribute(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


/* ---------- ЖАУАПТЫ ТЕКСЕРУ ---------- */

function checkTaskAnswer(index) {
    const task = App.currentTasks[App.currentTaskIndex];

    if (!task) return;

    const selected = task.options?.[index];

    if (selected === undefined) return;

    const buttons = document.querySelectorAll(
        "[data-option-index]"
    );

    buttons.forEach(button => {
        button.disabled = true;
    });

    const feedback =
        document.getElementById("taskFeedback");

    const correct = String(selected) === String(task.answer);

    if (correct) {
        if (feedback) {
            feedback.textContent =
                "🌟 Жарайсың! Дұрыс жауап!";
        }

        showToast("Тамаша! ⭐");
    } else {
        if (feedback) {
            feedback.textContent =
                task.feedback || "Қайта ойланып көр!";
        }

        buttons.forEach(button => {
            button.disabled = false;
        });

        return;
    }

    completeCurrentTask();
}


/* ---------- ТАПСЫРМАНЫ АЯҚТАУ ---------- */

function completeCurrentTask() {
    const task = App.currentTasks[App.currentTaskIndex];

    if (!task) return;

    if (!App.progress.completedTasks.includes(task.id)) {
        App.progress.completedTasks.push(task.id);
    }

    updateProgress();

    saveProgress();

    renderTaskPage();

    showToast("Тапсырма орындалды! ⭐");
}


/* ---------- ПРОГРЕСТІ ЕСЕПТЕУ ---------- */

function updateProgress() {
    const total = PROGRAM_DATA.assessment?.totalTasks || 400;

    const completed = App.progress.completedTasks.length;

    App.progress.totalProgress =
        Math.round(completed / total * 100);

    App.progress.totalStars = completed;

    updateCompletedStages();

    updateCompletedSounds();

    updateDiplomaStatus();
}


/* ---------- КЕЗЕҢДІ ЕСЕПТЕУ ---------- */

function updateCompletedStages() {
    const completedStages = [];

    PROGRAM_DATA.sounds.forEach(sound => {
        (sound.stages || []).forEach(stage => {
            const tasks = stage.tasks || [];

            if (
                tasks.length === 10 &&
                tasks.every(task =>
                    App.progress.completedTasks.includes(task.id)
                )
            ) {
                completedStages.push(
                    `${sound.id}-${stage.id}`
                );
            }
        });
    });

    App.progress.completedStages = completedStages;
}


/* ---------- ДЫБЫСТАРДЫ ЕСЕПТЕУ ---------- */

function updateCompletedSounds() {
    App.progress.completedSounds =
        PROGRAM_DATA.sounds
            .filter(sound =>
                (sound.stages || []).every(stage =>
                    stage.tasks?.length === 10 &&
                    stage.tasks.every(task =>
                        App.progress.completedTasks.includes(task.id)
                    )
                )
            )
            .map(sound => sound.id);
}


/* ---------- ДИПЛОМДЫ АШУ ---------- */

function updateDiplomaStatus() {
    App.progress.diplomaUnlocked =
        App.progress.completedSounds.length === 10 &&
        App.progress.completedStages.length === 40 &&
        App.progress.completedTasks.length >= 400;
}


/* ---------- БАТЫРМАЛАР ---------- */

function updateTaskButtons() {
    const previous =
        document.getElementById("previousTaskButton");

    const next =
        document.getElementById("nextTaskButton");

    if (previous) {
        previous.disabled = App.currentTaskIndex === 0;
    }

    if (next) {
        next.disabled =
            App.currentTaskIndex >= App.currentTasks.length - 1;
    }
}


/* ---------- ТАПСЫРМАЛАР АРАСЫНДА ЖҮРУ ---------- */

function changeTask(direction) {
    const newIndex =
        App.currentTaskIndex + direction;

    if (
        newIndex < 0 ||
        newIndex >= App.currentTasks.length
    ) return;

    App.currentTaskIndex = newIndex;

    renderTaskPage();
}
/* ==========================================
   2-БӨЛІМ. ОЙЫНДАР, НӘТИЖЕЛЕР, ДИПЛОМ
   ========================================== */


/* ---------- ТЫНЫС АЛУ ОЙЫНДАРЫ ---------- */

function renderBreathingGames() {
    const container =
        document.getElementById("breathingContent");

    if (!container) return;

    const games = PROGRAM_DATA.breathingGames || [];

    container.innerHTML = games.map((game, index) => `
        <article class="game-card">
            <div class="game-visual">
                ${game.visual || "🌬️"}
            </div>

            <h3>${game.title}</h3>

            <p>${game.goal || ""}</p>

            <p>${game.instruction || ""}</p>

            <button class="primary-button"
                    data-game="breathing"
                    data-index="${index}">
                Ойынды бастау
            </button>

            <div id="breathingResult${index}"></div>
        </article>
    `).join("");
}


function startBreathingGame(index) {
    const game = PROGRAM_DATA.breathingGames?.[index];

    if (!game) return;

    const result =
        document.getElementById(`breathingResult${index}`);

    if (!result) return;

    result.innerHTML = `
        <div class="game-play-area">
            <div class="breathing-animation">🌬️</div>

            <p>${game.instruction}</p>

            <p>
                ${game.procedure || ""}
            </p>

            <button class="secondary-button"
                    onclick="finishSupplementaryGame(this)">
                Ойынды аяқтау
            </button>
        </div>
    `;
}


/* ---------- СЕРГІТУ ОЙЫНДАРЫ ---------- */

function renderRelaxationGames() {
    const container =
        document.getElementById("relaxationContent");

    if (!container) return;

    const games = PROGRAM_DATA.relaxationGames || [];

    container.innerHTML = games.map((game, index) => `
        <article class="game-card">
            <div class="game-visual">
                ${game.visual || "🎵"}
            </div>

            <h3>${game.title}</h3>

            <p>${game.goal || ""}</p>

            <p>${game.instruction || ""}</p>

            <button class="primary-button"
                    data-game="relaxation"
                    data-index="${index}">
                Сергітуді бастау
            </button>

            <div id="relaxationResult${index}"></div>
        </article>
    `).join("");
}


function startRelaxationGame(index) {
    const game = PROGRAM_DATA.relaxationGames?.[index];

    if (!game) return;

    const result =
        document.getElementById(`relaxationResult${index}`);

    if (!result) return;

    result.innerHTML = `
        <div class="game-play-area">
            <div class="relaxation-animation">
                🐰 🎵 ⭐
            </div>

            <p>${game.instruction || ""}</p>

            <p>${game.procedure || ""}</p>

            <button class="secondary-button"
                    onclick="finishSupplementaryGame(this)">
                Аяқтау
            </button>
        </div>
    `;
}


/* ---------- ҰСАҚ МОТОРИКА ---------- */

function renderFineMotorGames() {
    const container =
        document.getElementById("motorContent");

    if (!container) return;

    const games = PROGRAM_DATA.fineMotorGames || [];

    container.innerHTML = games.map((game, index) => `
        <article class="game-card">
            <div class="game-visual">
                ${game.visual || "🧩"}
            </div>

            <h3>${game.title}</h3>

            <p>${game.goal || ""}</p>

            <p>${game.instruction || ""}</p>

            <button class="primary-button"
                    data-game="motor"
                    data-index="${index}">
                Ойынды бастау
            </button>

            <div id="motorResult${index}"></div>
        </article>
    `).join("");
}


function startFineMotorGame(index) {
    const game = PROGRAM_DATA.fineMotorGames?.[index];

    if (!game) return;

    const result =
        document.getElementById(`motorResult${index}`);

    if (!result) return;

    result.innerHTML = `
        <div class="game-play-area">

            <h4>${game.title}</h4>

            <p>${game.instruction || ""}</p>

            <p>${game.procedure || ""}</p>

            <button class="secondary-button"
                    onclick="finishSupplementaryGame(this)">
                Тапсырманы аяқтау
            </button>

        </div>
    `;
}


/* ---------- ҚОСЫМША ОЙЫНДЫ АЯҚТАУ ---------- */

function finishSupplementaryGame(button) {
    const area = button.closest(".game-play-area");

    if (!area) return;

    area.innerHTML = `
        <h3>🌟 Жарайсың!</h3>
        <p>Ойынды аяқтадың!</p>
    `;
}


/* ---------- НӘТИЖЕЛЕР ---------- */

function renderResults() {
    const container =
        document.getElementById("resultsContent");

    if (!container) return;

    updateProgress();

    const total = PROGRAM_DATA.assessment?.totalTasks || 400;

    const completed = App.progress.completedTasks.length;

    const percent = Math.round(completed / total * 100);

    container.innerHTML = `
        <div class="results-overview">

            <div class="result-card">
                <span>⭐</span>
                <h2>${App.progress.totalStars}</h2>
                <p>Жұлдыз</p>
            </div>

            <div class="result-card">
                <span>📚</span>
                <h2>${completed}/${total}</h2>
                <p>Орындалған тапсырма</p>
            </div>

            <div class="result-card">
                <span>🏆</span>
                <h2>${percent}%</h2>
                <p>Жалпы прогресс</p>
            </div>

            <div class="result-card">
                <span>🔤</span>
                <h2>${App.progress.completedSounds.length}/10</h2>
                <p>Аяқталған дыбыс</p>
            </div>

        </div>

        <h2>Дыбыстар бойынша нәтиже</h2>

        <div class="sound-results">
            ${PROGRAM_DATA.sounds.map(sound => {
                const tasks = (sound.stages || [])
                    .flatMap(stage => stage.tasks || []);

                const done = tasks.filter(task =>
                    App.progress.completedTasks.includes(task.id)
                ).length;

                const soundPercent = tasks.length
                    ? Math.round(done / tasks.length * 100)
                    : 0;

                return `
                    <div class="sound-result-card">
                        <h3>${sound.letter || sound.id}</h3>

                        <div class="progress-track">
                            <div class="progress-fill"
                                 style="width:${soundPercent}%">
                            </div>
                        </div>

                        <p>${done}/40 тапсырма · ${soundPercent}%</p>
                    </div>
                `;
            }).join("")}
        </div>
    `;

    const nameInput = document.getElementById("childName");

    if (nameInput) {
        nameInput.value = App.progress.childName || "";
    }
}


/* ---------- БАЛА АТЫН САҚТАУ ---------- */

function saveChildName() {
    const input = document.getElementById("childName");

    if (!input) return;

    App.progress.childName = input.value.trim();

    saveProgress();

    showToast("Атың сақталды! ⭐");
}


/* ---------- ДИПЛОМ ---------- */

function renderDiploma() {
    const container =
        document.getElementById("diplomaContent");

    if (!container) return;

    updateProgress();

    if (!App.progress.diplomaUnlocked) {
        container.innerHTML = `
            <div class="diploma-locked">
                <div>🔒</div>

                <h2>Диплом әлі ашылған жоқ</h2>

                <p>
                    Диплом алу үшін 10 дыбыстың
                    барлық 4 кезеңіндегі 400 тапсырманы аяқта.
                </p>

                <p>
                    Қазіргі нәтиже:
                    ${App.progress.completedTasks.length}/400
                </p>
            </div>
        `;

        return;
    }

    const name = escapeAttribute(
        App.progress.childName || "Жас қатысушы"
    );

    const date = new Date().toLocaleDateString("kk-KZ");

    container.innerHTML = `
        <div class="diploma-paper">

            <div class="diploma-decoration">
                🌈 ⭐ 🦋 🌟 🐬
            </div>

            <h1>🏆 ДЫБЫСТАР ШЕБЕРІ 🏆</h1>

            <h2>МАДАҚТАМА</h2>

            <p>Осы диплом</p>

            <h2 class="diploma-name">${name}</h2>

            <p>
                «Сөйлеу әлеміне саяхат»
                авторлық интерактивті логопедиялық
                бағдарламасының барлық негізгі
                тапсырмаларын орындағаны үшін беріледі.
            </p>

            <h3>400 тапсырма · 40 кезең · 10 дыбыс</h3>

            <p>Берілген күні: ${date}</p>

            <div class="diploma-decoration">
                ⭐ 🌸 🌈 ⭐
            </div>

        </div>
    `;
}


/* ---------- ДИПЛОМДЫ БАСЫП ШЫҒАРУ ---------- */

function printDiploma() {
    if (!App.progress.diplomaUnlocked) {
        showToast("Алдымен барлық тапсырманы орында!");
        return;
    }

    window.print();
}


/* ---------- ХАБАРЛАМА ---------- */

function showToast(message) {
    const toast = document.getElementById("toast");

    if (!toast) return;

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}


/* ---------- ДЫБЫСТЫ ДАУЫСТАП ОҚУ ---------- */

function speakText(text) {
    if (!("speechSynthesis" in window)) {
        showToast("Бұл браузерде дауыс функциясы қолжетімсіз.");
        return;
    }

    window.speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.lang = "kk-KZ";
    utterance.rate = 0.85;

    window.speechSynthesis.speak(utterance);
}


/* ---------- КАМЕРАНЫ ҚОСУ ---------- */

async function startCamera() {
    try {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("Камераға рұқсат берілмейді.");
        }

        App.cameraStream =
            await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });

        const video =
            document.getElementById("cameraVideo");

        video.srcObject = App.cameraStream;

        document.getElementById("cameraStatus").textContent =
            "Камера қосылды";

    } catch (error) {
        showToast("Камераға рұқсат берілмеді.");
        console.error(error);
    }
}


/* ---------- КАМЕРАНЫ ӨШІРУ ---------- */

function stopCamera() {
    if (App.cameraStream) {
        App.cameraStream.getTracks().forEach(track =>
            track.stop()
        );

        App.cameraStream = null;
    }

    const video = document.getElementById("cameraVideo");

    if (video) video.srcObject = null;

    const status = document.getElementById("cameraStatus");

    if (status) status.textContent = "Камера өшірілді";
}


/* ---------- МИКРОФОН ---------- */

async function startMicrophone() {
    try {
        App.microphoneStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        App.audioContext = new AudioContextClass();

        const source =
            App.audioContext.createMediaStreamSource(
                App.microphoneStream
            );

        const analyser =
            App.audioContext.createAnalyser();

        analyser.fftSize = 256;

        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);

        const status =
            document.getElementById("microphoneStatus");

        if (status) status.textContent = "Микрофон қосылды";

        function measure() {
            if (!App.microphoneStream) return;

            analyser.getByteFrequencyData(data);

            const average =
                data.reduce((sum, value) => sum + value, 0) /
                data.length;

            const level =
                document.getElementById("soundLevel");

            if (level) {
                let description = "Тыныш";

                if (average > 35) description = "Орташа дыбыс";
                if (average > 75) description = "Қатты дыбыс";

                level.textContent =
                    `Дыбыс деңгейі: ${description}`;
            }

            App.animationFrame =
                requestAnimationFrame(measure);
        }

        measure();

    } catch (error) {
        showToast("Микрофонға рұқсат берілмеді.");
        console.error(error);
    }
}


/* ---------- МИКРОФОНДЫ ӨШІРУ ---------- */

function stopMicrophone() {
    if (App.animationFrame) {
        cancelAnimationFrame(App.animationFrame);
        App.animationFrame = null;
    }

    if (App.microphoneStream) {
        App.microphoneStream.getTracks().forEach(track =>
            track.stop()
        );

        App.microphoneStream = null;
    }

    if (App.audioContext) {
        App.audioContext.close();
        App.audioContext = null;
    }

    const status =
        document.getElementById("microphoneStatus");

    if (status) status.textContent = "Микрофон өшірілді";

    const level = document.getElementById("soundLevel");

    if (level) level.textContent = "Дыбыс деңгейі: —";
}


/* ---------- БАТЫРМАЛАРДЫ БАЙЛАНЫСТЫРУ ---------- */

document.addEventListener("click", function(event) {

    const pageButton = event.target.closest("[data-page]");

    if (pageButton) {
        showPage(pageButton.dataset.page);
        return;
    }

    const actionButton = event.target.closest("[data-action]");

    if (actionButton) {
        const action = actionButton.dataset.action;

        if (action === "startProgram") {
            showPage("mainMenu");
        }

        if (action === "openStage") {
            openStage(actionButton.dataset.stage);
        }

        if (action === "speak") {
            speakText(actionButton.dataset.text || "");
        }

        return;
    }

    const optionButton =
        event.target.closest("[data-option-index]");

    if (optionButton) {
        checkTaskAnswer(
            Number(optionButton.dataset.optionIndex)
        );

        return;
    }

    const gameButton = event.target.closest("[data-game]");

    if (gameButton) {
        const index = Number(gameButton.dataset.index);

        if (gameButton.dataset.game === "breathing") {
            startBreathingGame(index);
        }

        if (gameButton.dataset.game === "relaxation") {
            startRelaxationGame(index);
        }

        if (gameButton.dataset.game === "motor") {
            startFineMotorGame(index);
        }
    }

});


/* ---------- ҚОСЫМША БАТЫРМАЛАР ---------- */

document.getElementById("completeTaskButton")
    ?.addEventListener("click", completeCurrentTask);

document.getElementById("previousTaskButton")
    ?.addEventListener("click", () => changeTask(-1));

document.getElementById("nextTaskButton")
    ?.addEventListener("click", () => changeTask(1));

document.getElementById("saveNameButton")
    ?.addEventListener("click", saveChildName);

document.getElementById("printDiplomaButton")
    ?.addEventListener("click", printDiploma);

document.getElementById("cameraStartButton")
    ?.addEventListener("click", startCamera);

document.getElementById("cameraStopButton")
    ?.addEventListener("click", stopCamera);

document.getElementById("microphoneStartButton")
    ?.addEventListener("click", startMicrophone);

document.getElementById("microphoneStopButton")
    ?.addEventListener("click", stopMicrophone);


/* ---------- БЕТ ЖАБЫЛҒАНДА МЕДИА ӨШІРУ ---------- */

window.addEventListener("beforeunload", () => {
    stopCamera();
    stopMicrophone();
});


/* ---------- БАҒДАРЛАМАНЫ ІСКЕ ҚОСУ ---------- */

function initializeProgram() {
    if (!checkProgramData()) return;

    loadProgress();

    updateProgress();

    saveProgress();

    console.log("Сөйлеу әлемі іске қосылды!");

    console.log(
        "Дыбыстар саны:",
        PROGRAM_DATA.sounds.length
    );

    console.log(
        "Орындалған тапсырмалар:",
        App.progress.completedTasks.length
    );
}


initializeProgram();
