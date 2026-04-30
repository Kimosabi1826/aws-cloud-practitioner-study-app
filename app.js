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

const MODULES_MANIFEST_PATH = "questions/modules.json";

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

function loadVoices() {
  if (!("speechSynthesis" in window)) return [];

  const voices = window.speechSynthesis.getVoices();

  bestVoice =
    voices.find((v) => v.name.includes("Microsoft Aria")) ||
    voices.find((v) => v.name.includes("Microsoft Guy")) ||
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
    nextBtn.textContent = "➡ Next Question";
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
      questionCounter.textContent = "Question 0 / 0";
    } else {
      questionCounter.textContent = `Question ${totalQuestions ? currentQuestionIndex + 1 : 0} / ${totalQuestions}`;
    }
  }

  if (modeBox) modeBox.textContent = `Mode: ${currentMode}`;

  let progressPercent = 0;
  if (currentMode === "Study Mode") {
    progressPercent = 0;
  } else if (totalQuestions > 0) {
    progressPercent = (currentQuestionIndex / totalQuestions) * 100;
  }

  if (progressBar) progressBar.style.width = `${progressPercent}%`;
}

function setTemporarySelectedStyle(button, isSelected) {
  if (isSelected) {
    button.style.borderColor = "#60a5fa";
    button.style.background = "#243041";
  } else {
    button.style.borderColor = "";
    button.style.background = "";
  }
}

function updateQuestionTypeUi(questionObj) {
  if (!questionTypeBox && !selectionHelpText) return;

  if (currentMode === "Study Mode") {
    if (questionTypeBox) questionTypeBox.textContent = "Type: Cheat Sheet";
    if (selectionHelpText) selectionHelpText.textContent = "Study notes for the selected module.";
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
      nextBtn.textContent = "✅ Submit Answer";
      nextBtn.disabled = true;
    } else {
      nextBtn.classList.add("hidden");
      nextBtn.textContent = "➡ Next Question";
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
      feedbackTitle.innerHTML = `<span class="result-good">✅ Correct</span>`;
    } else {
      feedbackTitle.innerHTML = `<span class="result-bad">❌ Incorrect</span>`;
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
      nextBtn.textContent = "➡ Next Question";
      nextBtn.disabled = false;
    } else {
      nextBtn.classList.remove("hidden");
      nextBtn.textContent = "🏁 Finish Quiz";
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
    message = "Monster run. You smoked this quiz.";
  } else if (ratio >= 0.8) {
    message = "Strong job. You actually understand the material.";
  } else if (ratio >= 0.6) {
    message = "Decent base, but you need another pass before trusting it.";
  } else {
    message = "No sugar-coating: you need another round.";
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

async function speakText(text, errorMessage) {
  if (!("speechSynthesis" in window)) {
    alert("Your browser does not support text-to-speech.");
    return;
  }

  const cleanText = String(text || "").trim();
  if (!cleanText) {
    alert("There is nothing to read yet.");
    return;
  }

  await waitForVoices();
  loadVoices();

  const utterance = new SpeechSynthesisUtterance();
  utterance.text = cleanText;
  utterance.rate = 0.92;
  utterance.pitch = 1.0;
  utterance.volume = 1;

  if (bestVoice) {
    utterance.voice = bestVoice;
  }

  utterance.onerror = (event) => {
    console.warn("Speech event:", event.error);

    if (event.error === "canceled" || event.error === "interrupted") {
      return;
    }

    alert(errorMessage || "Speech failed in this browser.");
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

async function speakCurrentQuestion() {
  if (!questions.length || currentQuestionIndex >= maxQuestions) return;

  const q = questions[currentQuestionIndex];

  const correctAnswers = getCorrectAnswersArray(q);
  const selectInstruction =
    correctAnswers.length > 1
      ? `Select ${correctAnswers.length} answers. `
      : "Choose the best answer. ";

  const speechText =
    `Question ${currentQuestionIndex + 1}. ${q.question}. ${selectInstruction}` +
    q.displayChoices.map((choice) => `Option ${choice.displayLetter}. ${choice.text}.`).join(" ");

  await speakText(speechText, "Question speech failed in this browser.");
}

function buildCheatSheetSpeechText(data) {
  const selectedLabel =
    moduleSelect?.options[moduleSelect.selectedIndex]?.textContent || "Selected module";

  if (!data || !Array.isArray(data.sections) || data.sections.length === 0) {
    return `${selectedLabel}. Cheat sheet has not been added yet.`;
  }

  const parts = [`${selectedLabel}. Study Cheat Sheet.`];

  data.sections.forEach((section, sectionIndex) => {
    parts.push(`Section ${sectionIndex + 1}. ${section.title || "Section"}.`);

    if (Array.isArray(section.points)) {
      section.points.forEach((point) => {
        parts.push(point);
      });
    }

    if (section.exam_tip) {
      parts.push(`Exam tip. ${section.exam_tip}`);
    }
  });

  return parts.join(" ");
}

async function speakCurrentCheatSheet() {
  const speechText = buildCheatSheetSpeechText(currentCheatSheetData);
  await speakText(speechText, "Cheat sheet speech failed in this browser.");
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

  if (!data || !Array.isArray(data.sections) || data.sections.length === 0) {
    cheatSheetContent.innerHTML = `
      <div class="actions">
        <button class="action-btn gray-btn" id="readCheatSheetBtn">🔊 Read Cheat Sheet</button>
      </div>
      <h3>⚠ Cheat Sheet Not Added Yet</h3>
      <p>This module does not have study notes yet.</p>
      <p>We can build it next.</p>
    `;

    const readCheatSheetBtn = document.getElementById("readCheatSheetBtn");
    if (readCheatSheetBtn) readCheatSheetBtn.addEventListener("click", speakCurrentCheatSheet);
    return;
  }

  cheatSheetContent.innerHTML = `
    <div class="actions">
      <button class="action-btn gray-btn" id="readCheatSheetBtn">🔊 Read Cheat Sheet</button>
      <button class="action-btn orange-btn" id="stopCheatSheetBtn">⏹ Stop Reading</button>
    </div>
    ${data.sections
      .map((section) => {
        const safeTitle = escapeHtml(section.title || "Section");
        const points = Array.isArray(section.points) ? section.points : [];
        const examTip = section.exam_tip
          ? `<p class="exam-tip"><strong>Exam Tip:</strong> ${escapeHtml(section.exam_tip)}</p>`
          : "";

        return `
          <div class="cheat-block">
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

  if (readCheatSheetBtn) readCheatSheetBtn.addEventListener("click", speakCurrentCheatSheet);

  if (stopCheatSheetBtn && "speechSynthesis" in window) {
    stopCheatSheetBtn.addEventListener("click", () => {
      window.speechSynthesis.cancel();
    });
  }
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
    cheatSheetContent.innerHTML = `
      <h3>⚠ Cheat Sheet Not Added Yet</h3>
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
    cheatSheetContent.innerHTML = `
      <div class="actions">
        <button class="action-btn gray-btn" id="readCheatSheetBtn">🔊 Read Cheat Sheet</button>
      </div>
      <h3>⚠ Cheat Sheet Not Added Yet</h3>
      <p>We looked for:</p>
      <p><code>${escapeHtml(notesPath)}</code></p>
      <p>Create that file when you're ready and this screen will load it automatically.</p>
    `;

    const readCheatSheetBtn = document.getElementById("readCheatSheetBtn");
    if (readCheatSheetBtn) readCheatSheetBtn.addEventListener("click", speakCurrentCheatSheet);
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
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();

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
  loadVoices();
  await populateModuleSelectFromManifest();

  if (moduleSelect && moduleSelect.options.length > 0) {
    await loadModuleQuiz();
  }
});
