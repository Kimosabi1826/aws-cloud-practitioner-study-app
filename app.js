
let questionBank = {};
let modulesManifest = [];
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let answeredCount = 0;
let questionLocked = false;
let missedQuestions = [];
let currentMode = "Module Quiz";
let currentSourceFiles = [];
let currentQuizSize = 0;
let maxQuestions = 0;
let bestVoice = null;
let selectedAnswers = [];
let currentCheatSheetData = null;
let cheatSheetPlaylist = [];
let currentCheatSheetIndex = 0;
let speechRunId = 0;
let speechTimeouts = [];

const MODULES_MANIFEST_PATH = "questions/modules.json";

const SPEECH_PAUSES = {
  short: 350,
  medium: 600,
  long: 850
};

const questionNumber = document.getElementById("questionNumber");
const questionText = document.getElementById("questionText");
const choicesContainer = document.getElementById("choicesContainer");
const scoreBox = document.getElementById("scoreBox");
const questionCounter = document.getElementById("questionCounter");
const modeBox = document.getElementById("modeBox");
const progressBar = document.getElementById("progressBar");

const hintBtn = document.getElementById("hintBtn");
const speakBtn = document.getElementById("speakBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const finalRestartBtn = document.getElementById("finalRestartBtn");
const reviewMissedBtn = document.getElementById("reviewMissedBtn");
const finalReviewMissedBtn = document.getElementById("finalReviewMissedBtn");

const loadModuleBtn = document.getElementById("loadModuleBtn");
const startMixedExamBtn = document.getElementById("startMixedExamBtn");
const moduleSelect = document.getElementById("moduleSelect");
const shuffleQuestionsCheckbox = document.getElementById("shuffleQuestionsCheckbox");
const shuffleAnswersCheckbox = document.getElementById("shuffleAnswersCheckbox");
const mixedExamCount = document.getElementById("mixedExamCount");

const hintPanel = document.getElementById("hintPanel");
const hintText = document.getElementById("hintText");

const feedbackPanel = document.getElementById("feedbackPanel");
const feedbackTitle = document.getElementById("feedbackTitle");
const correctAnswerText = document.getElementById("correctAnswerText");
const explanationsList = document.getElementById("explanationsList");

const quizCard = document.getElementById("quizCard");
const finalCard = document.getElementById("finalCard");
const finalScore = document.getElementById("finalScore");
const finalMessage = document.getElementById("finalMessage");
const finalCorrectCount = document.getElementById("finalCorrectCount");
const finalMissedCount = document.getElementById("finalMissedCount");
const finalModeText = document.getElementById("finalModeText");

const questionTypeBox = document.getElementById("questionTypeBox");
const selectionHelpText = document.getElementById("selectionHelpText");

const studyCheatSheetBtn = document.getElementById("studyCheatSheetBtn");
const cheatSheetCard = document.getElementById("cheatSheetCard");
const cheatSheetModuleTitle = document.getElementById("cheatSheetModuleTitle");
const cheatSheetTitle = document.getElementById("cheatSheetTitle");
const cheatSheetContent = document.getElementById("cheatSheetContent");
const backToQuizBtn = document.getElementById("backToQuizBtn");

function applyInterfaceCopy() {
  document.title = "AWS Cloud Practitioner Exam Trainer";

  const headline = document.querySelector("[data-app-title], .app-title, h1");
  if (headline) headline.textContent = "AWS Cloud Practitioner";

  const subtitle = document.querySelector("[data-app-subtitle], .app-subtitle, .subtitle");
  if (subtitle) {
    subtitle.textContent = "Certification Practice - 13 Modules - Voice - Study Sheets";
  }

  if (hintBtn) hintBtn.textContent = "Show Tip";
  if (speakBtn) speakBtn.textContent = "Read Question";
  if (nextBtn) nextBtn.textContent = "Next Question";
  if (restartBtn) restartBtn.textContent = "Restart Current Quiz";
  if (finalRestartBtn) finalRestartBtn.textContent = "Restart Quiz";
  if (reviewMissedBtn) reviewMissedBtn.textContent = "Review Missed";
  if (finalReviewMissedBtn) finalReviewMissedBtn.textContent = "Review Missed";
  if (loadModuleBtn) loadModuleBtn.textContent = "Load Module Quiz";
  if (startMixedExamBtn) startMixedExamBtn.textContent = "Start Final Mixed Exam";
  if (studyCheatSheetBtn) studyCheatSheetBtn.textContent = "Study Cheat Sheet";
  if (backToQuizBtn) backToQuizBtn.textContent = "Back to Quiz";
}

function applyVisualPolish() {
  if (document.getElementById("safeQuizVisualPolish")) return;

  const style = document.createElement("style");
  style.id = "safeQuizVisualPolish";
  style.textContent = `
    :root {
      --quiz-bg: #07111f;
      --quiz-card: #111827;
      --quiz-card-soft: #162033;
      --quiz-border: #2d4263;
      --quiz-border-strong: #3b82f6;
      --quiz-text: #f8fafc;
      --quiz-muted: #93a4bb;
      --quiz-primary: #2563eb;
      --quiz-primary-hover: #1d4ed8;
      --quiz-success: #10b981;
      --quiz-warning: #f59e0b;
      --quiz-danger: #ef4444;
      --quiz-purple: #7c3aed;
    }

    body {
      background:
        radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 34%),
        linear-gradient(135deg, #07111f 0%, #0f172a 55%, #111827 100%);
      color: var(--quiz-text);
      letter-spacing: 0;
    }

    h1,
    h2,
    h3 {
      color: var(--quiz-text);
      letter-spacing: 0;
    }

    .card,
    .panel,
    .quiz-card,
    #quizCard,
    #finalCard,
    #cheatSheetCard {
      background: rgba(17, 24, 39, 0.94);
      border: 1px solid var(--quiz-border);
      border-radius: 8px;
      box-shadow: 0 22px 70px rgba(0, 0, 0, 0.3);
    }

    button,
    .action-btn {
      border-radius: 8px;
      letter-spacing: 0;
      transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
    }

    button:hover:not(:disabled),
    .action-btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    button:disabled,
    .action-btn:disabled {
      cursor: not-allowed;
      opacity: 0.58;
    }

    select,
    #moduleSelect,
    #mixedExamCount {
      background-color: #0f172a !important;
      color: #f8fafc !important;
      border: 1px solid #31507a !important;
      border-radius: 8px;
    }

    select option,
    #moduleSelect option,
    #mixedExamCount option {
      background-color: #0f172a !important;
      color: #f8fafc !important;
    }

    select:focus,
    #moduleSelect:focus,
    #mixedExamCount:focus {
      outline: 2px solid rgba(56, 189, 248, 0.45);
      outline-offset: 2px;
    }

    .choice-btn {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      color: var(--quiz-text);
    }

    .choice-btn:hover:not(:disabled) {
      background: #162235;
      border-color: #38bdf8;
    }

    .choice-btn.correct {
      background: rgba(16, 185, 129, 0.16) !important;
      border-color: rgba(16, 185, 129, 0.9) !important;
    }

    .choice-btn.wrong {
      background: rgba(239, 68, 68, 0.16) !important;
      border-color: rgba(239, 68, 68, 0.9) !important;
    }

    .choice-btn.neutral-dim {
      opacity: 0.58;
    }

    .result-good {
      color: var(--quiz-success);
    }

    .result-bad {
      color: var(--quiz-danger);
    }

    #progressBar {
      background: linear-gradient(90deg, #38bdf8, #10b981);
    }

    #hintPanel,
    #feedbackPanel {
      background: rgba(15, 23, 42, 0.72);
      border-color: var(--quiz-border);
    }

    .cheat-block {
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid #334155;
      border-radius: 8px;
    }

    .active-cheat-block {
      background: rgba(56, 189, 248, 0.14) !important;
      border-color: rgba(56, 189, 248, 0.7) !important;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.2) !important;
    }

    .exam-tip {
      border-left: 3px solid var(--quiz-warning);
      background: rgba(245, 158, 11, 0.1);
      padding: 0.85rem 1rem;
      border-radius: 6px;
    }

    .small-note {
      color: var(--quiz-muted);
    }
  `;

  document.head.appendChild(style);
}

function loadVoices() {
  if (!("speechSynthesis" in window)) return [];

  const voices = window.speechSynthesis.getVoices();

  bestVoice =
    voices.find((v) => v.name.includes("Microsoft Jenny")) ||
    voices.find((v) => v.name.includes("Microsoft Aria")) ||
    voices.find((v) => v.name.includes("Google US English")) ||
    voices.find((v) => v.name.includes("Google")) ||
    voices.find((v) => v.lang && v.lang.toLowerCase().includes("en-us")) ||
    voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("en")) ||
    voices[0] ||
    null;

  return voices;
}

function waitForVoices(timeoutMs = 1500) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    let finished = false;

    const done = () => {
      if (finished) return;
      finished = true;
      resolve(window.speechSynthesis.getVoices());
    };

    const previousHandler = window.speechSynthesis.onvoiceschanged;
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
      done();
      if (typeof previousHandler === "function") {
        previousHandler();
      }
    };

    setTimeout(done, timeoutMs);
  });
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

function stopSpeaking() {
  speechRunId++;

  const pendingTimeouts = [...speechTimeouts];
  speechTimeouts = [];

  pendingTimeouts.forEach((timeoutRecord) => {
    clearTimeout(timeoutRecord.id);
    timeoutRecord.resolve(false);
  });

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function waitSpeechDelay(ms, runId) {
  return new Promise((resolve) => {
    if (!Number.isFinite(ms) || ms <= 0) {
      resolve(runId === speechRunId);
      return;
    }

    const timeoutRecord = {
      id: null,
      resolve: null
    };

    timeoutRecord.resolve = (result = true) => {
      speechTimeouts = speechTimeouts.filter((record) => record !== timeoutRecord);
      resolve(result);
    };

    timeoutRecord.id = setTimeout(() => {
      timeoutRecord.resolve(runId === speechRunId);
    }, ms);

    speechTimeouts.push(timeoutRecord);
  });
}

async function speakSpeechParts(parts, errorMessage, onEndCallback) {
  if (!("speechSynthesis" in window)) {
    alert("Your browser does not support text-to-speech.");
    return false;
  }

  const speechParts = Array.isArray(parts) ? parts : [parts];
  const hasTextToRead = speechParts.some(
    (part) => typeof part === "string" && formatSpeechText(part)
  );

  if (!hasTextToRead) {
    alert("There is nothing to read yet.");
    return false;
  }

  stopSpeaking();

  const runId = speechRunId;

  await waitForVoices();
  loadVoices();

  const ready = await waitSpeechDelay(120, runId);
  if (!ready || runId !== speechRunId) return false;

  for (const part of speechParts) {
    if (runId !== speechRunId) return false;

    if (typeof part === "number") {
      const stillActive = await waitSpeechDelay(part, runId);
      if (!stillActive || runId !== speechRunId) return false;
      continue;
    }

    const cleanText = formatSpeechText(part);
    if (!cleanText) continue;

    const completed = await new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance();
      utterance.text = cleanText;
      utterance.rate = 0.92;
      utterance.pitch = 1;
      utterance.volume = 1;

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onend = () => resolve(true);

      utterance.onerror = (event) => {
        console.warn("Speech event:", event.error);

        if (event.error !== "canceled" && event.error !== "interrupted") {
          alert(errorMessage || "Speech failed in this browser.");
        }

        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    });

    if (!completed || runId !== speechRunId) return false;
  }

  if (typeof onEndCallback === "function") {
    onEndCallback();
  }

  return true;
}

function formatSpeechText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/=/g, " means ")
    .replace(/\?/g, "? ")
    .replace(/\./g, ". ")
    .replace(/:/g, ": ")
    .replace(/;/g, "; ")
    .replace(/\bAWS\b/g, "A W S")
    .replace(/\bIAM\b/g, "I A M")
    .replace(/\bMFA\b/g, "M F A")
    .replace(/\bKMS\b/g, "K M S")
    .replace(/\bACM\b/g, "A C M")
    .replace(/\bWAF\b/g, "W A F")
    .replace(/\bS3\b/g, "S 3")
    .replace(/\bEC2\b/g, "E C 2")
    .replace(/\bRDS\b/g, "R D S")
    .replace(/\bDDoS\b/g, "D D O S")
    .trim();
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function shuffleArray(inputArray) {
  const array = [...inputArray];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getCorrectAnswersArray(questionObj) {
  return Array.isArray(questionObj.correct) ? [...questionObj.correct] : [questionObj.correct];
}

function isMultiSelectQuestion(questionObj) {
  return Array.isArray(questionObj.correct) && questionObj.correct.length > 1;
}

function arraysMatchIgnoringOrder(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;

  const a = [...arr1].sort();
  const b = [...arr2].sort();

  return a.every((value, index) => value === b[index]);
}

function getDisplayLetterForOriginal(questionObj, originalLetter) {
  const match = questionObj.displayChoices.find(
    (choice) => choice.originalLetter === originalLetter
  );
  return match ? match.displayLetter : originalLetter;
}

function getDisplayLettersForCorrectAnswers(questionObj) {
  return getCorrectAnswersArray(questionObj).map((letter) =>
    getDisplayLetterForOriginal(questionObj, letter)
  );
}

function clearButtonState(button) {
  button.classList.remove("correct", "wrong", "neutral-dim");
  button.style.borderColor = "";
  button.style.background = "";
}

function prepareQuestion(questionObj) {
  const prepared = deepClone(questionObj);

  if (!shuffleAnswersCheckbox.checked) {
    prepared.displayChoices = Object.entries(prepared.choices).map(([letter, text]) => ({
      originalLetter: letter,
      displayLetter: letter,
      text: text
    }));
    return prepared;
  }

  const choiceEntries = Object.entries(prepared.choices).map(([letter, text]) => ({
    originalLetter: letter,
    text: text
  }));

  const shuffledChoices = shuffleArray(choiceEntries);
  const displayLetters = ["A", "B", "C", "D"];

  prepared.displayChoices = shuffledChoices.map((item, index) => ({
    originalLetter: item.originalLetter,
    displayLetter: displayLetters[index],
    text: item.text
  }));

  return prepared;
}

function prepareQuestionSet(rawQuestions) {
  let workingSet = rawQuestions.map(prepareQuestion);

  if (shuffleQuestionsCheckbox.checked) {
    workingSet = shuffleArray(workingSet);
  }

  return workingSet;
}

async function fetchJsonFile(filePath) {
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Failed to load file: ${filePath}`);
  }
  return response.json();
}

async function fetchQuestionFile(filePath) {
  if (questionBank[filePath]) {
    return deepClone(questionBank[filePath]);
  }

  const data = await fetchJsonFile(filePath);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Question file is empty or invalid: ${filePath}`);
  }

  questionBank[filePath] = data;
  return deepClone(data);
}

function isValidManifestEntry(entry) {
  return (
    entry &&
    typeof entry === "object" &&
    typeof entry.label === "string" &&
    entry.label.trim() !== "" &&
    typeof entry.file === "string" &&
    entry.file.trim() !== ""
  );
}

async function populateModuleSelectFromManifest() {
  if (!moduleSelect) return false;

  try {
    const data = await fetchJsonFile(MODULES_MANIFEST_PATH);

    if (!Array.isArray(data) || data.length === 0 || !data.every(isValidManifestEntry)) {
      throw new Error("modules.json is invalid. Expected an array of { label, file } objects.");
    }

    modulesManifest = data;
    moduleSelect.innerHTML = "";

    modulesManifest.forEach((moduleItem) => {
      const option = document.createElement("option");
      option.value = moduleItem.file;
      option.textContent = moduleItem.label;
      moduleSelect.appendChild(option);
    });

    return true;
  } catch (error) {
    console.warn("Manifest load skipped or failed:", error.message);
    return false;
  }
}

function hideAllMainCards() {
  if (quizCard) quizCard.classList.add("hidden");
  if (finalCard) finalCard.classList.add("hidden");
  if (cheatSheetCard) cheatSheetCard.classList.add("hidden");
}

function resetQuizState() {
  stopSpeaking();

  currentQuestionIndex = 0;
  score = 0;
  answeredCount = 0;
  questionLocked = false;
  missedQuestions = [];
  selectedAnswers = [];

  hideAllMainCards();
  if (quizCard) quizCard.classList.remove("hidden");
  if (feedbackPanel) feedbackPanel.classList.add("hidden");
  if (hintPanel) hintPanel.classList.add("hidden");

  if (nextBtn) {
    nextBtn.classList.add("hidden");
    nextBtn.textContent = "Next Question";
    nextBtn.disabled = false;
  }

  if (reviewMissedBtn) reviewMissedBtn.classList.add("hidden");
  if (finalReviewMissedBtn) finalReviewMissedBtn.classList.add("hidden");
}

function updateTopBar() {
  const totalQuestions = maxQuestions || questions.length || 0;

  if (scoreBox) scoreBox.textContent = `Score: ${score} / ${answeredCount}`;

  if (questionCounter) {
    if (currentMode === "Study Mode") {
      questionCounter.textContent = cheatSheetPlaylist.length
        ? `Note ${currentCheatSheetIndex + 1} / ${cheatSheetPlaylist.length}`
        : "Question 0 / 0";
    } else {
      questionCounter.textContent = `Question ${totalQuestions ? currentQuestionIndex + 1 : 0} / ${totalQuestions}`;
    }
  }

  if (modeBox) modeBox.textContent = `Mode: ${currentMode}`;

  let progressPercent = 0;
  if (currentMode === "Study Mode" && cheatSheetPlaylist.length > 0) {
    progressPercent = ((currentCheatSheetIndex + 1) / cheatSheetPlaylist.length) * 100;
  } else if (totalQuestions > 0) {
    progressPercent = (currentQuestionIndex / totalQuestions) * 100;
  }

  if (progressBar) progressBar.style.width = `${progressPercent}%`;
}

function setTemporarySelectedStyle(button, isSelected) {
  if (isSelected) {
    button.style.borderColor = "#38bdf8";
    button.style.background = "rgba(56, 189, 248, 0.14)";
  } else {
    button.style.borderColor = "";
    button.style.background = "";
  }
}

function updateQuestionTypeUi(questionObj) {
  if (!questionTypeBox && !selectionHelpText) return;

  if (currentMode === "Study Mode") {
    if (questionTypeBox) questionTypeBox.textContent = "Type: Cheat Sheet";
    if (selectionHelpText) selectionHelpText.textContent = "Use Previous / Next to move through notes.";
    return;
  }

  const correctAnswers = getCorrectAnswersArray(questionObj);

  if (correctAnswers.length === 1) {
    if (questionTypeBox) questionTypeBox.textContent = "Type: Single Answer";
    if (selectionHelpText) selectionHelpText.textContent = "Choose the best answer.";
  } else {
    if (questionTypeBox) questionTypeBox.textContent = `Type: Select ${correctAnswers.length}`;
    if (selectionHelpText) {
      selectionHelpText.textContent = `Select exactly ${correctAnswers.length} answers, then press Submit Answer.`;
    }
  }
}

function renderQuestion() {
  if (!questions.length || maxQuestions === 0) {
    if (questionNumber) questionNumber.textContent = "";
    if (questionText) questionText.textContent = "No questions loaded.";
    if (choicesContainer) choicesContainer.innerHTML = "";
    updateTopBar();
    return;
  }

  if (currentQuestionIndex >= maxQuestions) {
    showFinalScreen();
    return;
  }

  const q = questions[currentQuestionIndex];
  const isMulti = isMultiSelectQuestion(q);

  questionLocked = false;
  selectedAnswers = [];

  if (questionNumber) questionNumber.textContent = `Question ${currentQuestionIndex + 1}`;
  if (questionText) questionText.textContent = q.question;
  if (choicesContainer) choicesContainer.innerHTML = "";
  if (hintPanel) hintPanel.classList.add("hidden");
  if (feedbackPanel) feedbackPanel.classList.add("hidden");
  if (hintText) hintText.textContent = q.tip;

  updateQuestionTypeUi(q);

  q.displayChoices.forEach((choice) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.innerHTML = `<strong>${choice.displayLetter}.</strong> ${choice.text}`;

    if (isMulti) {
      btn.addEventListener("click", () => toggleMultiSelect(choice.originalLetter, btn));
    } else {
      btn.addEventListener("click", () => handleSingleAnswer(choice.originalLetter));
    }

    if (choicesContainer) choicesContainer.appendChild(btn);
  });

  if (nextBtn) {
    if (isMulti) {
      nextBtn.classList.remove("hidden");
      nextBtn.textContent = "Submit Answer";
      nextBtn.disabled = true;
    } else {
      nextBtn.classList.add("hidden");
      nextBtn.textContent = "Next Question";
      nextBtn.disabled = false;
    }
  }

  updateTopBar();
}

function toggleMultiSelect(originalLetter, button) {
  if (questionLocked) return;

  const q = questions[currentQuestionIndex];
  const requiredSelections = getCorrectAnswersArray(q).length;

  if (selectedAnswers.includes(originalLetter)) {
    selectedAnswers = selectedAnswers.filter((answer) => answer !== originalLetter);
    setTemporarySelectedStyle(button, false);
  } else {
    if (selectedAnswers.length >= requiredSelections) return;
    selectedAnswers.push(originalLetter);
    setTemporarySelectedStyle(button, true);
  }

  if (nextBtn) nextBtn.disabled = selectedAnswers.length !== requiredSelections;
}

function handleSingleAnswer(selectedOriginalLetter) {
  if (questionLocked) return;
  evaluateAnswer([selectedOriginalLetter]);
}

function evaluateAnswer(selectedOriginalLetters) {
  if (questionLocked) return;
  questionLocked = true;

  const q = questions[currentQuestionIndex];
  const correctAnswers = getCorrectAnswersArray(q);
  answeredCount++;

  const allButtons = document.querySelectorAll(".choice-btn");

  allButtons.forEach((btn, index) => {
    const choice = q.displayChoices[index];
    clearButtonState(btn);
    btn.disabled = true;

    if (correctAnswers.includes(choice.originalLetter)) btn.classList.add("correct");

    if (
      selectedOriginalLetters.includes(choice.originalLetter) &&
      !correctAnswers.includes(choice.originalLetter)
    ) {
      btn.classList.add("wrong");
    }

    if (
      !correctAnswers.includes(choice.originalLetter) &&
      !selectedOriginalLetters.includes(choice.originalLetter)
    ) {
      btn.classList.add("neutral-dim");
    }
  });

  const isCorrect = arraysMatchIgnoringOrder(selectedOriginalLetters, correctAnswers);

  if (feedbackTitle) {
    if (isCorrect) {
      score++;
      feedbackTitle.innerHTML = `<span class="result-good">Correct</span>`;
    } else {
      feedbackTitle.innerHTML = `<span class="result-bad">Incorrect</span>`;
      missedQuestions.push(deepClone(q));
    }
  } else if (!isCorrect) {
    missedQuestions.push(deepClone(q));
  } else {
    score++;
  }

  const correctDisplayLetters = getDisplayLettersForCorrectAnswers(q);
  const correctAnswerTextParts = correctAnswers.map((originalLetter, index) => {
    const displayLetter = correctDisplayLetters[index];
    return `<strong>${displayLetter}</strong> - ${q.choices[originalLetter]}`;
  });

  if (correctAnswerText) {
    correctAnswerText.innerHTML =
      correctAnswerTextParts.length === 1
        ? `Correct Answer: ${correctAnswerTextParts[0]}`
        : `Correct Answers: ${correctAnswerTextParts.join(" | ")}`;
  }

  if (explanationsList) {
    explanationsList.innerHTML = "";
    q.displayChoices.forEach((choice) => {
      const explanation = q.explanations[choice.originalLetter] || "No explanation added yet.";
      const li = document.createElement("li");
      li.innerHTML = `<strong>${choice.displayLetter}.</strong> ${explanation}`;
      explanationsList.appendChild(li);
    });
  }

  if (feedbackPanel) feedbackPanel.classList.remove("hidden");

  if (nextBtn) {
    if (currentQuestionIndex + 1 < maxQuestions) {
      nextBtn.classList.remove("hidden");
      nextBtn.textContent = "Next Question";
      nextBtn.disabled = false;
    } else {
      nextBtn.classList.remove("hidden");
      nextBtn.textContent = "Finish Quiz";
      nextBtn.disabled = false;
    }
  }

  updateTopBar();
}

function goToNextQuestion() {
  const q = questions[currentQuestionIndex];

  if (!questionLocked && isMultiSelectQuestion(q)) {
    if (selectedAnswers.length === getCorrectAnswersArray(q).length) {
      evaluateAnswer(selectedAnswers);
    }
    return;
  }

  if (currentQuestionIndex + 1 < maxQuestions) {
    currentQuestionIndex++;
    renderQuestion();
  } else {
    showFinalScreen();
  }
}

function showFinalScreen() {
  stopSpeaking();
  hideAllMainCards();
  if (finalCard) finalCard.classList.remove("hidden");
  if (progressBar) progressBar.style.width = "100%";

  const totalQuestions = maxQuestions || questions.length || 0;

  if (finalScore) finalScore.textContent = `Final Score: ${score} / ${totalQuestions}`;
  if (finalCorrectCount) finalCorrectCount.textContent = `Correct: ${score}`;
  if (finalMissedCount) finalMissedCount.textContent = `Missed: ${missedQuestions.length}`;
  if (finalModeText) finalModeText.textContent = `Mode: ${currentMode}`;

  let message = "";
  const ratio = totalQuestions ? score / totalQuestions : 0;

  if (ratio === 1) {
    message = "Perfect run. You are ready for harder questions.";
  } else if (ratio >= 0.8) {
    message = "Strong score. Review the misses, then run it again.";
  } else if (ratio >= 0.6) {
    message = "Good foundation. Focus on the explanations before retrying.";
  } else {
    message = "Needs another pass. Start with missed questions and rebuild from there.";
  }

  if (finalMessage) finalMessage.textContent = message;

  if (missedQuestions.length > 0) {
    if (reviewMissedBtn) reviewMissedBtn.classList.remove("hidden");
    if (finalReviewMissedBtn) finalReviewMissedBtn.classList.remove("hidden");
  } else {
    if (reviewMissedBtn) reviewMissedBtn.classList.add("hidden");
    if (finalReviewMissedBtn) finalReviewMissedBtn.classList.add("hidden");
  }
}

function restartQuiz() {
  if (!questions.length) return;

  const rawCurrent = questions.slice(0, maxQuestions).map((q) => ({
    question: q.question,
    choices: q.choices,
    correct: q.correct,
    tip: q.tip,
    explanations: q.explanations
  }));

  questions = prepareQuestionSet(rawCurrent);
  maxQuestions = questions.length;
  currentQuizSize = questions.length;

  currentMode = "Module Quiz";
  resetQuizState();
  renderQuestion();
}

function startMissedReviewMode() {
  if (!missedQuestions.length) {
    alert("No missed questions to review.");
    return;
  }

  currentMode = "Missed Review";
  questions = prepareQuestionSet(
    missedQuestions.map((q) => ({
      question: q.question,
      choices: q.choices,
      correct: q.correct,
      tip: q.tip,
      explanations: q.explanations
    }))
  );

  maxQuestions = questions.length;
  currentQuizSize = questions.length;

  resetQuizState();
  renderQuestion();
}

async function speakText(text, errorMessage, onEndCallback) {
  return speakSpeechParts([text], errorMessage, onEndCallback);
}

async function speakCurrentQuestion() {
  if (!questions.length || currentQuestionIndex >= maxQuestions) return;

  const q = questions[currentQuestionIndex];

  const correctAnswers = getCorrectAnswersArray(q);
  const selectInstruction =
    correctAnswers.length > 1
      ? `Select ${correctAnswers.length} answers.`
      : "Choose the best answer.";

  const speechParts = [
    `Question ${currentQuestionIndex + 1}.`,
    SPEECH_PAUSES.short,
    q.question,
    SPEECH_PAUSES.long,
    selectInstruction,
    SPEECH_PAUSES.long,
    ...q.displayChoices.flatMap((choice) => [
      `Option ${choice.displayLetter}. ${choice.text}.`,
      SPEECH_PAUSES.medium
    ])
  ];

  await speakSpeechParts(speechParts, "Question speech failed in this browser.");
}

function buildCheatSheetPlaylist(data) {
  const playlist = [];

  if (!data || !Array.isArray(data.sections)) {
    return playlist;
  }

  data.sections.forEach((section, index) => {
    const title = section.title || `Section ${index + 1}`;
    const points = Array.isArray(section.points) ? section.points : [];
    const tip = section.exam_tip ? `Exam tip. ${section.exam_tip}` : "";

    playlist.push({
      index: index,
      title: title,
      parts: [
        `Section ${index + 1}.`,
        SPEECH_PAUSES.short,
        title,
        SPEECH_PAUSES.long,
        ...points.flatMap((point) => [point, SPEECH_PAUSES.medium]),
        ...(tip ? [SPEECH_PAUSES.long, tip] : [])
      ]
    });
  });

  return playlist;
}

function clearCheatSheetHighlight() {
  document.querySelectorAll(".cheat-block").forEach((block) => {
    block.classList.remove("active-cheat-block");
    block.style.background = "";
    block.style.borderColor = "";
    block.style.boxShadow = "";
  });
}

function highlightCheatSheetBlock(index) {
  clearCheatSheetHighlight();

  const block = document.querySelector(`[data-cheat-index="${index}"]`);
  if (!block) return;

  block.classList.add("active-cheat-block");
  block.style.background = "rgba(56,189,248,0.14)";
  block.style.borderColor = "rgba(56,189,248,0.7)";
  block.style.boxShadow = "0 0 20px rgba(56,189,248,0.2)";
  block.scrollIntoView({ behavior: "smooth", block: "center" });
}

function updateCheatSheetNowPlaying() {
  const nowPlaying = document.getElementById("cheatSheetNowPlaying");
  if (!nowPlaying) return;

  if (!cheatSheetPlaylist.length) {
    nowPlaying.textContent = "No notes loaded.";
    return;
  }

  const item = cheatSheetPlaylist[currentCheatSheetIndex];
  nowPlaying.textContent = `Now Reading: ${currentCheatSheetIndex + 1}/${cheatSheetPlaylist.length} - ${item.title}`;
  updateTopBar();
}

async function speakCurrentCheatSheetItem() {
  if (!cheatSheetPlaylist.length) {
    await speakText("No cheat sheet notes loaded yet.", "Cheat sheet speech failed in this browser.");
    return;
  }

  const item = cheatSheetPlaylist[currentCheatSheetIndex];
  highlightCheatSheetBlock(item.index);
  updateCheatSheetNowPlaying();

  await speakSpeechParts(item.parts, "Cheat sheet speech failed in this browser.");
}

function stopCheatSheetReading() {
  stopSpeaking();
}

async function nextCheatSheetItem() {
  if (!cheatSheetPlaylist.length) return;

  stopCheatSheetReading();
  currentCheatSheetIndex = Math.min(currentCheatSheetIndex + 1, cheatSheetPlaylist.length - 1);
  await speakCurrentCheatSheetItem();
}

async function previousCheatSheetItem() {
  if (!cheatSheetPlaylist.length) return;

  stopCheatSheetReading();
  currentCheatSheetIndex = Math.max(currentCheatSheetIndex - 1, 0);
  await speakCurrentCheatSheetItem();
}

async function loadModuleQuiz() {
  try {
    const filePath = moduleSelect.value;
    if (!filePath) throw new Error("No module selected.");

    currentSourceFiles = [filePath];
    currentMode = "Module Quiz";

    const data = await fetchQuestionFile(filePath);
    questions = prepareQuestionSet(data);

    maxQuestions = questions.length;
    currentQuizSize = questions.length;

    resetQuizState();
    renderQuestion();
  } catch (error) {
    showLoadError(error);
  }
}

async function startMixedExam() {
  try {
    const filePath = moduleSelect.value;
    if (!filePath) throw new Error("No module selected.");

    currentSourceFiles = [filePath];
    currentMode = "Final Mixed Exam";

    let combinedQuestions = [];
    for (const sourceFile of currentSourceFiles) {
      const fileQuestions = await fetchQuestionFile(sourceFile);
      combinedQuestions = combinedQuestions.concat(fileQuestions);
    }

    if (combinedQuestions.length === 0) throw new Error("No questions found for mixed exam.");

    combinedQuestions = shuffleArray(combinedQuestions);

    const requestedCount = Number(mixedExamCount.value);
    const finalCount = Math.min(requestedCount, combinedQuestions.length);

    questions = prepareQuestionSet(combinedQuestions.slice(0, finalCount));

    maxQuestions = questions.length;
    currentQuizSize = questions.length;

    resetQuizState();
    renderQuestion();
  } catch (error) {
    showLoadError(error);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCheatSheetSections(data) {
  if (!cheatSheetContent) return;

  currentCheatSheetData = data;
  cheatSheetPlaylist = buildCheatSheetPlaylist(data);
  currentCheatSheetIndex = 0;

  if (!data || !Array.isArray(data.sections) || data.sections.length === 0) {
    cheatSheetContent.innerHTML = `
      <div class="actions">
        <button class="action-btn gray-btn" id="readCheatSheetBtn">Read Current</button>
      </div>
      <p class="small-note" id="cheatSheetNowPlaying">No notes loaded.</p>
      <h3>Cheat Sheet Not Added Yet</h3>
      <p>This module does not have study notes yet.</p>
      <p>We can build it next.</p>
    `;

    const readCheatSheetBtn = document.getElementById("readCheatSheetBtn");
    if (readCheatSheetBtn) readCheatSheetBtn.addEventListener("click", speakCurrentCheatSheetItem);
    updateCheatSheetNowPlaying();
    return;
  }

  cheatSheetContent.innerHTML = `
    <div class="actions">
      <button class="action-btn gray-btn" id="prevCheatSheetBtn">Previous</button>
      <button class="action-btn green-btn" id="readCheatSheetBtn">Read Current</button>
      <button class="action-btn purple-btn" id="nextCheatSheetBtn">Next</button>
      <button class="action-btn orange-btn" id="stopCheatSheetBtn">Stop</button>
    </div>
    <p class="small-note" id="cheatSheetNowPlaying"></p>
    ${data.sections
      .map((section, index) => {
        const safeTitle = escapeHtml(section.title || "Section");
        const points = Array.isArray(section.points) ? section.points : [];
        const examTip = section.exam_tip
          ? `<p class="exam-tip"><strong>Exam Tip:</strong> ${escapeHtml(section.exam_tip)}</p>`
          : "";

        return `
          <div class="cheat-block" data-cheat-index="${index}">
            <h3>${safeTitle}</h3>
            <ul>
              ${points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
            </ul>
            ${examTip}
          </div>
        `;
      })
      .join("")}
  `;

  const readCheatSheetBtn = document.getElementById("readCheatSheetBtn");
  const stopCheatSheetBtn = document.getElementById("stopCheatSheetBtn");
  const nextCheatSheetBtn = document.getElementById("nextCheatSheetBtn");
  const prevCheatSheetBtn = document.getElementById("prevCheatSheetBtn");

  if (readCheatSheetBtn) readCheatSheetBtn.addEventListener("click", speakCurrentCheatSheetItem);
  if (stopCheatSheetBtn) stopCheatSheetBtn.addEventListener("click", stopCheatSheetReading);
  if (nextCheatSheetBtn) nextCheatSheetBtn.addEventListener("click", nextCheatSheetItem);
  if (prevCheatSheetBtn) prevCheatSheetBtn.addEventListener("click", previousCheatSheetItem);

  highlightCheatSheetBlock(currentCheatSheetIndex);
  updateCheatSheetNowPlaying();
}

async function loadCheatSheet() {
  if (!moduleSelect || !cheatSheetContent || !cheatSheetModuleTitle || !cheatSheetTitle) return;

  const selectedLabel =
    moduleSelect.options[moduleSelect.selectedIndex]?.textContent || "Module";
  const filePath = moduleSelect.value || "";

  cheatSheetModuleTitle.textContent = selectedLabel;
  cheatSheetTitle.textContent = "Study Cheat Sheet";
  cheatSheetContent.innerHTML = "<p>Loading cheat sheet...</p>";

  if (!filePath.endsWith(".json")) {
    currentCheatSheetData = null;
    cheatSheetPlaylist = [];
    cheatSheetContent.innerHTML = `
      <h3>Cheat Sheet Not Added Yet</h3>
      <p>This module path is not valid.</p>
    `;
    return;
  }

  const notesPath = filePath.replace(".json", "_notes.json");

  try {
    const data = await fetchJsonFile(notesPath);
    renderCheatSheetSections(data);
  } catch (error) {
    console.warn("Cheat sheet load skipped or failed:", error.message);
    currentCheatSheetData = null;
    cheatSheetPlaylist = [];
    cheatSheetContent.innerHTML = `
      <div class="actions">
        <button class="action-btn gray-btn" id="readCheatSheetBtn">Read Current</button>
      </div>
      <p class="small-note" id="cheatSheetNowPlaying">No notes loaded.</p>
      <h3>Cheat Sheet Not Added Yet</h3>
      <p>We looked for:</p>
      <p><code>${escapeHtml(notesPath)}</code></p>
      <p>Create that file when you're ready and this screen will load it automatically.</p>
    `;

    const readCheatSheetBtn = document.getElementById("readCheatSheetBtn");
    if (readCheatSheetBtn) readCheatSheetBtn.addEventListener("click", speakCurrentCheatSheetItem);
    updateCheatSheetNowPlaying();
  }
}

async function showCheatSheet() {
  currentMode = "Study Mode";
  hideAllMainCards();

  if (cheatSheetCard) cheatSheetCard.classList.remove("hidden");

  updateQuestionTypeUi({ correct: ["A", "B"] });
  updateTopBar();
  await loadCheatSheet();
}

function backToQuiz() {
  stopCheatSheetReading();
  clearCheatSheetHighlight();

  currentMode = "Module Quiz";
  hideAllMainCards();

  if (quizCard) quizCard.classList.remove("hidden");

  if (questions.length > 0) {
    updateQuestionTypeUi(questions[currentQuestionIndex] || questions[0]);
  }

  updateTopBar();
}

function showLoadError(error) {
  alert(
    "Could not load question file.\n\n" +
      "If you opened index.html directly by double-clicking it, some browsers block fetch for local JSON files.\n\n" +
      "Best fix: run a local server.\n\n" +
      "Python example:\npython -m http.server 8000\n\n" +
      "Then open:\nhttp://localhost:8000\n\n" +
      "Error: " +
      error.message
  );
  console.error(error);
}

if (hintBtn) {
  hintBtn.addEventListener("click", () => {
    if (hintPanel) hintPanel.classList.toggle("hidden");
  });
}

if (speakBtn) speakBtn.addEventListener("click", speakCurrentQuestion);
if (nextBtn) nextBtn.addEventListener("click", goToNextQuestion);
if (restartBtn) restartBtn.addEventListener("click", restartQuiz);
if (finalRestartBtn) finalRestartBtn.addEventListener("click", restartQuiz);

if (reviewMissedBtn) reviewMissedBtn.addEventListener("click", startMissedReviewMode);
if (finalReviewMissedBtn) finalReviewMissedBtn.addEventListener("click", startMissedReviewMode);

if (loadModuleBtn) loadModuleBtn.addEventListener("click", loadModuleQuiz);
if (startMixedExamBtn) startMixedExamBtn.addEventListener("click", startMixedExam);

if (studyCheatSheetBtn) studyCheatSheetBtn.addEventListener("click", showCheatSheet);
if (backToQuizBtn) backToQuizBtn.addEventListener("click", backToQuiz);

window.addEventListener("DOMContentLoaded", async () => {
  applyVisualPolish();
  applyInterfaceCopy();

  loadVoices();
  await populateModuleSelectFromManifest();

  if (moduleSelect && moduleSelect.options.length > 0) {
    await loadModuleQuiz();
  }
});
```
