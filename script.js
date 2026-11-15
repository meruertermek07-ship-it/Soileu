/* =====================================================
   «СӨЙЛЕУ ӘЛЕМІНЕ САЯХАТ»
   ДИСЛАЛИЯНЫ ТҮЗЕТУ БАҒДАРЛАМАСЫ

   Негізгі мүмкіндіктер:
   - 10 дыбыс
   - 4 түзету кезеңі
   - 400 негізгі тапсырма
   - Жеке прогресс
   - Жұлдызшалар
   - LocalStorage
   - Камера және микрофон
   - Тыныс алу жаттығулары
   - Сергіту ойындары
   - Ұсақ моторика
   - Нәтижелер
   - Диплом
===================================================== */


/* =====================================================
   1. НЕГІЗГІ АЙНЫМАЛЫЛАР
===================================================== */

const STORAGE_KEY =
    PROGRAM_DATA.progressSettings.storageKey;

const CHILD_NAME_KEY =
    PROGRAM_DATA.progressSettings.childNameKey;

let progress = loadProgress();

let selectedSound = null;

let selectedStage = null;

let currentTasks = [];

let currentTaskIndex = 0;

let currentTask = null;

let currentGame = null;

let cameraStream = null;

let microphoneStream = null;

let audioContext = null;

let analyser = null;

let microphoneAnimation = null;

let toastTimer = null;


/* =====================================================
   2. ПРОГРЕСТІ ЖҮКТЕУ ЖӘНЕ САҚТАУ
===================================================== */

function createDefaultProgress() {

    return JSON.parse(
        JSON.stringify(PROGRAM_DATA.progressTemplate)
    );

}


function loadProgress() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

        if (!saved) {

            return createDefaultProgress();

        }

        const parsed = JSON.parse(saved);

        return {
            ...createDefaultProgress(),
            ...parsed,
            completedTasks:
                Array.isArray(parsed.completedTasks)
                    ? parsed.completedTasks
                    : [],
            completedStages:
                Array.isArray(parsed.completedStages)
                    ? parsed.completedStages
                    : [],
            completedSounds:
                Array.isArray(parsed.completedSounds)
                    ? parsed.completedSounds
                    : [],
            achievements:
                Array.isArray(parsed.achievements)
                    ? parsed.achievements
                    : []
        };

    } catch (error) {

        console.error(
            "Прогресті жүктеу қатесі:",
            error
        );

        return createDefaultProgress();

    }

}


function saveProgress() {

    progress.lastActivity =
        new Date().toISOString();

    progress.totalStars =
        progress.completedTasks.length;

    progress.totalProgress =
        Math.round(
            progress.completedTasks.length /
            PROGRAM_DATA.totalTasks * 100
        );

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(progress)
        );

        localStorage.setItem(
            CHILD_NAME_KEY,
            progress.childName || ""
        );

    } catch (error) {

        console.error(
            "Прогресті сақтау қатесі:",
            error
        );

        showToast(
            "Деректерді сақтау мүмкін болмады."
        );

    }

    updateHeader();

}


function isTaskCompleted(taskId) {

    return progress.completedTasks.includes(taskId);

}


/* =====================================================
   3. БЕТТЕР АРАСЫНДА АУЫСУ
===================================================== */

function showPage(pageId) {

    const pages =
        document.querySelectorAll(".page");

    pages.forEach(page => {

        page.classList.remove("active");

    });

    const target =
        document.getElementById(pageId);

    if (!target) {

        console.error(
            "Бет табылмады:",
            pageId
        );

        return;

    }

    target.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    if (pageId === "mainMenu") {

        renderMainMenu();

    }

    if (pageId === "soundSelection") {

        renderSounds();

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

        renderMotorGames();

    }

}


function startJourney() {

    openChildModal();

}


function openChildModal() {

    const savedName =
        progress.childName ||
        localStorage.getItem(CHILD_NAME_KEY) ||
        "";

    const input =
        document.getElementById("childNameInput");

    if (input) {

        input.value = savedName;

    }

    showPage("childModal");

}


function saveChildName() {

    const input =
        document.getElementById("childNameInput");

    const name =
        input.value.trim();

    if (!name) {

        showToast(
            "Алдымен атыңды енгіз!"
        );

        input.focus();

        return;

    }

    progress.childName = name;

    if (!progress.startedAt) {

        progress.startedAt =
            new Date().toISOString();

    }

    saveProgress();

    showToast(
        "Қош келдің, " + name + "!"
    );

    showPage("mainMenu");

}


/* =====================================================
   4. БАСТЫ МӘЗІР
===================================================== */

function renderMainMenu() {

    const name =
        progress.childName || "саяхатшы";

    const welcome =
        document.getElementById("welcomeText");

    if (welcome) {

        welcome.textContent =
            "Қош келдің, " + name +
            "! Өзіңе ұнайтын бөлімді таңда.";

    }

    const completed =
        progress.completedTasks.length;

    const percent =
        Math.round(
            completed /
            PROGRAM_DATA.totalTasks * 100
        );

    setText(
        "menuProgressText",
        percent + "%"
    );

    setText(
        "menuCompletedTasks",
        completed + " / 400 тапсырма"
    );

    setWidth(
        "menuProgressBar",
        percent
    );

    updateHeader();

}


function updateHeader() {

    setText(
        "headerChildName",
        progress.childName || "Қонақ"
    );

    setText(
        "headerStars",
        progress.completedTasks.length
    );

    setText(
        "taskStars",
        progress.completedTasks.length
    );

}


/* =====================================================
   5. ДЫБЫСТАРДЫ КӨРСЕТУ
===================================================== */

function renderSounds() {

    const container =
        document.getElementById("soundGrid");

    if (!container) return;

    container.innerHTML = "";

    PROGRAM_DATA.sounds.forEach(sound => {

        const completed =
            getCompletedTaskCountForSound(sound);

        const percent =
            Math.round(completed / 40 * 100);

        const card =
            document.createElement("button");

        card.className = "sound-card";

        card.type = "button";

        card.style.setProperty(
            "--sound-color",
            sound.color || "#9B83EA"
        );

        card.innerHTML = `

            <span class="sound-card-character">
                ${escapeHTML(sound.character || "🐰")}
            </span>

            <strong class="sound-letter">
                ${escapeHTML(sound.letter)}
            </strong>

            <span class="sound-name">
                ${escapeHTML(sound.name || sound.letter + " дыбысы")}
            </span>

            <span class="sound-world">
                ${escapeHTML(sound.world || "Сиқырлы әлем")}
            </span>

            <div class="progress-track">

                <div
                    class="progress-fill"
                    style="width:${percent}%">
                </div>

            </div>

            <small>
                ${completed} / 40 тапсырма
            </small>

            <span class="sound-percent">
                ${percent}%
            </span>

        `;

        card.addEventListener(
            "click",
            () => selectSound(sound.id)
        );

        container.appendChild(card);

    });

}


function selectSound(soundId) {

    selectedSound =
        getSoundById(soundId);

    if (!selectedSound) {

        showToast(
            "Дыбыс табылмады."
        );

        return;

    }

    progress.selectedSound =
        soundId;

    selectedStage = null;

    saveProgress();

    renderSoundDetails();

    showPage("soundDetailsPage");

}


function renderSoundDetails() {

    if (!selectedSound) return;

    const container =
        document.getElementById(
            "soundDetailsContent"
        );

    if (container) {

        container.innerHTML = `

            <div class="sound-detail-card">

                <div class="sound-detail-character">
                    ${escapeHTML(selectedSound.character || "🐰")}
                </div>

                <h1>
                    ${escapeHTML(selectedSound.letter)}
                    дыбысы
                </h1>

                <h2>
                    ${escapeHTML(selectedSound.world || "")}
                </h2>

                <p>
                    ${escapeHTML(selectedSound.description || "")}
                </p>

                <p>
                    <strong>Мысал:</strong>
                    ${escapeHTML(selectedSound.example || "")}
                </p>

            </div>

        `;

    }

    renderStages();

}


/* =====================================================
   6. КЕЗЕҢДЕРДІ КӨРСЕТУ
===================================================== */

function renderStages() {

    if (!selectedSound) return;

    const container =
        document.getElementById("stageGrid");

    if (!container) return;

    container.innerHTML = "";

    PROGRAM_DATA.stageInfo.forEach(stage => {

        const tasks =
            getStageTasks(selectedSound, stage.id);

        const completed =
            tasks.filter(task =>
                isTaskCompleted(task.id)
            ).length;

        const percent =
            completed * 10;

        const card =
            document.createElement("button");

        card.className = "stage-card";

        card.type = "button";

        card.innerHTML = `

            <span class="stage-icon">
                ${escapeHTML(stage.icon || "⭐")}
            </span>

            <strong>
                ${escapeHTML(stage.title)}
            </strong>

            <p>
                ${escapeHTML(stage.description || "")}
            </p>

            <div class="progress-track">

                <div
                    class="progress-fill"
                    style="width:${percent}%">
                </div>

            </div>

            <small>
                ${completed} / 10 тапсырма
            </small>

            <span>
                ${percent}%
            </span>

        `;

        card.addEventListener(
            "click",
            () => openStage(stage.id)
        );

        container.appendChild(card);

    });

}


function getStageTasks(sound, stageId) {

    if (!sound || !Array.isArray(sound.stages)) {

        return [];

    }

    const stage =
        sound.stages.find(item =>
            item.id === stageId
        );

    if (!stage || !Array.isArray(stage.tasks)) {

        return [];

    }

    return stage.tasks;

}


function openStage(stageId) {

    if (!selectedSound) {

        showToast("Алдымен дыбысты таңда!");

        return;

    }

    selectedStage =
        getStageById(stageId);

    if (!selectedStage) {

        showToast("Кезең табылмады.");

        return;

    }

    currentTasks =
        getStageTasks(selectedSound, stageId);

    if (currentTasks.length !== 10) {

        showToast(
            "Бұл кезеңде 10 тапсырма болуы керек. Data.js файлын тексер."
        );

        console.error(
            "Тапсырма саны:",
            currentTasks.length,
            selectedSound.letter,
            stageId
        );

        return;

    }

    progress.selectedStage =
        stageId;

    saveProgress();

    currentTaskIndex = 0;

    openFirstUncompletedTask();

}


function openExerciseSection(stageId) {

    if (!selectedSound) {

        showToast(
            "Алдымен дыбысты таңда!"
        );

        showPage("soundSelection");

        return;

    }

    openStage(stageId);

}


function openFirstUncompletedTask() {

    const first =
        currentTasks.findIndex(task =>
            !isTaskCompleted(task.id)
        );

    currentTaskIndex =
        first === -1 ? 0 : first;

    renderCurrentTask();

    showPage("taskPage");

}


/* =====================================================
   7. ТАПСЫРМАНЫ КӨРСЕТУ
===================================================== */

function renderCurrentTask() {

    currentTask =
        currentTasks[currentTaskIndex];

    if (!currentTask) return;

    setText(
        "currentSoundLabel",
        selectedSound.letter + " дыбысы"
    );

    setText(
        "currentStageLabel",
        selectedStage.title
    );

    setText(
        "taskProgressText",
        getCompletedCountForCurrentStage() +
        " / 10"
    );

    setWidth(
        "taskProgressBar",
        getCompletedCountForCurrentStage() * 10
    );

    const title =
        document.getElementById("taskTitle");

    if (title) {

        title.textContent =
            currentTask.title;

    }

    const container =
        document.getElementById("taskContent");

    if (!container) return;

    const completed =
        isTaskCompleted(currentTask.id);

    container.innerHTML = `

        <div class="task-card">

            <div class="task-number">
                ТАПСЫРМА ${currentTaskIndex + 1} / 10
            </div>

            <div class="task-visual">
                ${escapeHTML(currentTask.visual || "🌟")}
            </div>

            <h2>
                ${escapeHTML(currentTask.title)}
            </h2>

            <div class="task-goal">

                <strong>🎯 Мақсаты:</strong>

                <p>
                    ${escapeHTML(currentTask.goal || "")}
                </p>

            </div>

            <div class="task-instruction">

                <strong>📌 Нұсқаулық:</strong>

                <p>
                    ${escapeHTML(currentTask.instruction || "")}
                </p>

            </div>

            <div class="task-procedure">

                <strong>🪄 Орындау тәртібі:</strong>

                <p>
                    ${escapeHTML(currentTask.procedure || "")}
                </p>

            </div>

            ${renderTaskInteraction(currentTask)}

            <div
                id="taskFeedback"
                class="task-feedback"
                aria-live="polite">

                ${completed
                    ? "⭐ Бұл тапсырма орындалған!"
                    : "Тапсырманы орындап көр!"}

            </div>

            <div class="task-audio">

                <button
                    type="button"
                    class="secondary-button"
                    onclick="speakTaskText()">

                    🔊 Нұсқаулықты тыңдау

                </button>

            </div>

        </div>

    `;

    updateTaskButtons();

}


/* =====================================================
   8. ТАПСЫРМА ТҮРЛЕРІНІҢ ИНТЕРАКТИВТІЛІГІ
===================================================== */

function renderTaskInteraction(task) {

    const type =
        task.type || "specialist";

    if (
        Array.isArray(task.options) &&
        task.options.length > 0
    ) {

        return renderOptions(task);

    }

    if (
        Array.isArray(task.items) &&
        task.items.length > 0
    ) {

        return renderTaskItems(task);

    }

    if (
        Array.isArray(task.pairs) &&
        task.pairs.length > 0
    ) {

        return renderPairs(task);

    }

    if (
        task.example ||
        task.sentence
    ) {

        return `

            <div class="task-example">

                <h3>📖 Орындап көр:</h3>

                <p>
                    ${escapeHTML(
                        task.example || task.sentence
                    )}
                </p>

            </div>

        `;

    }

    if (
        type === "mirror" ||
        type === "movement"
    ) {

        return `

            <div class="task-action-area">

                <div class="task-action-icon">
                    🪞
                </div>

                <p>
                    Айнаға қарап жаттығуды орында.
                    Қажет болса, камераны қос.
                </p>

                <button
                    class="secondary-button"
                    onclick="startCamera()">

                    📷 Камераны қосу

                </button>

            </div>

        `;

    }

    if (
        type === "microphone"
    ) {

        return `

            <div class="task-action-area">

                <div class="task-action-icon">
                    🎤
                </div>

                <p>
                    Дыбысты дауыстап айтып көр.
                </p>

                <button
                    class="secondary-button"
                    onclick="startMicrophone()">

                    Микрофонды қосу

                </button>

            </div>

        `;

    }

    return `

        <div class="task-action-area">

            <div class="task-action-icon">
                🌟
            </div>

            <p>
                Нұсқаулық бойынша логопедпен бірге орында.
            </p>

        </div>

    `;

}


function renderOptions(task) {

    return `

        <div class="task-options">

            <h3>
                Дұрыс жауапты таңда:
            </h3>

            <div class="option-list">

                ${task.options.map((option, index) => `

                    <button
                        type="button"
                        class="option-button"
                        onclick="checkTaskAnswer(${index})">

                        ${escapeHTML(option)}

                    </button>

                `).join("")}

            </div>

        </div>

    `;

}


function renderTaskItems(task) {

    return `

        <div class="task-items">

            <h3>
                Берілген тапсырманы орында:
            </h3>

            <div class="task-item-list">

                ${task.items.map((item, index) => {

                    const value =
                        typeof item === "object"
                            ? item.word || item.label || item.name || JSON.stringify(item)
                            : item;

                    return `

                        <button
                            type="button"
                            class="task-item-button"
                            onclick="selectTaskItem(${index})">

                            ${escapeHTML(value)}

                        </button>

                    `;

                }).join("")}

            </div>

        </div>

    `;

}


function renderPairs(task) {

    return `

        <div class="task-pairs">

            <h3>
                Сәйкестендір:
            </h3>

            ${task.pairs.map((pair, index) => `

                <div class="pair-row">

                    <span>
                        ${escapeHTML(pair.left || pair.word || "")}
                    </span>

                    <span>
                        ↔
                    </span>

                    <span>
                        ${escapeHTML(pair.right || pair.match || "")}
                    </span>

                </div>

            `).join("")}

        </div>

    `;

}


/* =====================================================
   9. ЖАУАПТАРДЫ ТЕКСЕРУ
===================================================== */

function checkTaskAnswer(index) {

    if (!currentTask) return;

    const options =
        currentTask.options || [];

    const selected =
        options[index];

    if (selected === undefined) return;

    const answer =
        currentTask.answer;

    const normalizedAnswer =
        normalizeAnswer(answer);

    const normalizedSelected =
        normalizeAnswer(selected);

    let correct = false;

    if (Array.isArray(answer)) {

        correct =
            answer.some(item =>
                normalizeAnswer(item) ===
                normalizedSelected
            );

    } else {

        correct =
            normalizedAnswer ===
            normalizedSelected ||
            String(answer) === String(index);

    }

    if (correct) {

        showTaskFeedback(
            "Дұрыс! Жарайсың! ⭐",
            true
        );

        const buttons =
            document.querySelectorAll(
                ".option-button"
            );

        buttons.forEach(button => {

            button.disabled = true;

        });

    } else {

        showTaskFeedback(
            "Тағы бір рет ойланып көр! 😊",
            false
        );

    }

}


function normalizeAnswer(value) {

    if (value === undefined || value === null) {

        return "";

    }

    return String(value)
        .toLowerCase()
        .trim()
        .replace(/[.!?,]/g, "");

}


function selectTaskItem(index) {

    const buttons =
        document.querySelectorAll(
            ".task-item-button"
        );

    buttons.forEach((button, buttonIndex) => {

        button.classList.toggle(
            "selected",
            buttonIndex === index
        );

    });

    const item =
        currentTask.items[index];

    const value =
        typeof item === "object"
            ? item.word || item.label || item.name || ""
            : item;

    showTaskFeedback(
        "Сен таңдадың: " + value,
        true
    );

}


function showTaskFeedback(message, success) {

    const feedback =
        document.getElementById("taskFeedback");

    if (!feedback) return;

    feedback.textContent = message;

    feedback.className =
        success
            ? "task-feedback success"
            : "task-feedback retry";

}


/* =====================================================
   10. ТАПСЫРМАНЫ АЯҚТАУ
===================================================== */

function completeTask() {

    if (!currentTask) return;

    if (!isTaskCompleted(currentTask.id)) {

        progress.completedTasks.push(
            currentTask.id
        );

        saveProgress();

        updateAchievements();

        updateCompletedStages();

        showToast(
            "Жарайсың! ⭐ 1 жұлдызша алдың!"
        );

    } else {

        showToast(
            "Бұл тапсырма бұрын орындалған."
        );

    }

    renderCurrentTask();

    renderStages();

    updateHeader();

}


function getCompletedCountForCurrentStage() {

    return currentTasks.filter(task =>
        isTaskCompleted(task.id)
    ).length;

}


function updateCompletedStages() {

    const completedStages = [];

    PROGRAM_DATA.sounds.forEach(sound => {

        sound.stages.forEach(stage => {

            const tasks =
                stage.tasks || [];

            const allCompleted =
                tasks.length === 10 &&
                tasks.every(task =>
                    isTaskCompleted(task.id)
                );

            const stageKey =
                sound.id + "-" + stage.id;

            if (allCompleted) {

                completedStages.push(stageKey);

            }

        });

    });

    progress.completedStages =
        completedStages;

    const completedSounds = [];

    PROGRAM_DATA.sounds.forEach(sound => {

        const allCompleted =
            sound.stages.every(stage =>
                stage.tasks.length === 10 &&
                stage.tasks.every(task =>
                    isTaskCompleted(task.id)
                )
            );

        if (allCompleted) {

            completedSounds.push(sound.id);

        }

    });

    progress.completedSounds =
        completedSounds;

    progress.diplomaUnlocked =
        progress.completedTasks.length >= 400;

    saveProgress();

}


/* =====================================================
   11. АЛДЫҢҒЫ ЖӘНЕ КЕЛЕСІ ТАПСЫРМА
===================================================== */

function previousTask() {

    if (currentTaskIndex <= 0) {

        showToast(
            "Бұл — бірінші тапсырма."
        );

        return;

    }

    currentTaskIndex--;

    renderCurrentTask();

}


function nextTask() {

    if (
        currentTaskIndex >=
        currentTasks.length - 1
    ) {

        const completed =
            getCompletedCountForCurrentStage();

        if (completed === 10) {

            showToast(
                "Кезең толық аяқталды! 🏆"
            );

        } else {

            showToast(
                "Кезеңді аяқтау үшін қалған тапсырмаларды орында."
            );

        }

        return;

    }

    currentTaskIndex++;

    renderCurrentTask();

}


function goBackToStage() {

    stopCamera();

    stopMicrophone();

    renderSoundDetails();

    showPage("soundDetailsPage");

}


function updateTaskButtons() {

    const previous =
        document.getElementById(
            "previousTaskButton"
        );

    const next =
        document.getElementById(
            "nextTaskButton"
        );

    if (previous) {

        previous.disabled =
            currentTaskIndex === 0;

    }

    if (next) {

        next.disabled =
            currentTaskIndex ===
            currentTasks.length - 1;

    }

}


/* =====================================================
   12. ДЫБЫСТЫ ДАУЫСТАП ОҚУ
===================================================== */

function speakTaskText() {

    if (!currentTask) return;

    if (!("speechSynthesis" in window)) {

        showToast(
            "Бұл браузерде дауыстап оқу қолжетімсіз."
        );

        return;

    }

    window.speechSynthesis.cancel();

    const text =
        currentTask.title + ". " +
        currentTask.instruction + ". " +
        currentTask.procedure;

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.lang = "kk-KZ";

    utterance.rate = 0.85;

    utterance.pitch = 1;

    window.speechSynthesis.speak(
        utterance
    );

}


/* =====================================================
   13. КАМЕРАНЫ ҚОСУ
===================================================== */

async function startCamera() {

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

        showToast(
            "Камера үшін HTTPS қосылымы қажет."
        );

        return;

    }

    try {

        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: "user"
                },

                audio: false

            });

        const video =
            document.getElementById(
                "cameraVideo"
            );

        video.srcObject =
            cameraStream;

        video.style.display =
            "block";

        setText(
            "cameraStatus",
            "Камера қосылды. Өзіңді бақыла!"
        );

    } catch (error) {

        console.error(error);

        setText(
            "cameraStatus",
            "Камераға рұқсат берілмеді."
        );

        showToast(
            "Браузерден камераға рұқсат бер."
        );

    }

}


function stopCamera() {

    if (cameraStream) {

        cameraStream.getTracks().forEach(track => {

            track.stop();

        });

        cameraStream = null;

    }

    const video =
        document.getElementById(
            "cameraVideo"
        );

    if (video) {

        video.srcObject = null;

    }

    setText(
        "cameraStatus",
        "Камера өшірілді."
    );

}


/* =====================================================
   14. МИКРОФОН ЖӘНЕ ДЫБЫС ДЕҢГЕЙІ
===================================================== */

async function startMicrophone() {

    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

        showToast(
            "Микрофон үшін HTTPS қосылымы қажет."
        );

        return;

    }

    try {

        microphoneStream =
            await navigator.mediaDevices.getUserMedia({

                audio: true,

                video: false

            });

        audioContext =
            new AudioContext();

        const source =
            audioContext.createMediaStream
