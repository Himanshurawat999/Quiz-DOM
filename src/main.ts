// quiz.ts
interface QuizOption {
  char: string;
  text: string;
}
interface QuizItem {
  question: string;
  options: QuizOption[];
  correctAnswer: string;
  explanation: string;
}

async function main() {
  try {
    let noOfQuestions = 10;
    const response = await fetch("http://localhost:8000/quiz");
    const allQuestions: QuizItem[] = await response.json();
    const data = allQuestions.slice(0, noOfQuestions);
    console.log("ResData:", data);

    const ques = document.getElementById("question")!;
    const quesNo = document.getElementById("question-no")!;
    const timeEl = document.getElementById("time")!;
    const optionsUl = document.getElementById("options")!;

    const timeoutScreen = document.getElementById("timeout-screen")!;
    const mainScreen = document.getElementById("main-screen")!;
    const paginationContainer = document.getElementById("pagination")!;
    const resultScreen = document.getElementById("result-screen")!;
    const resultScore = document.getElementById("result-score")!;
    const ans = document.getElementById("ans")!;

    const startScreen = document.getElementById("start-screen")!;
    const startBtn = document.getElementById("start-btn")!;
    const retryBtn = document.getElementById("retry-btn")!;

    let currentData = 0;
    const userAnswers: (string | undefined)[] = [];
    const filterAnswers: Record<number, string> = {};
    let timer: number;

    function startTimer(durationSec: number, display: HTMLElement) {
      clearInterval(timer);
      let timeLeft = durationSec;
      timer = setInterval(() => {
        const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
        const seconds = String(timeLeft % 60).padStart(2, "0");
        display.textContent = `00:${minutes}:${seconds}`;
        display.classList.toggle("text-red-500", timeLeft <= 10);
        display.classList.toggle("text-white", timeLeft > 10);

        timeLeft--;
        if (timeLeft < 0) {
          clearInterval(timer);
          timeoutScreen.classList.replace("hidden", "flex");
          mainScreen.classList.add("hidden");
          startScreen.classList.add("hidden");
        }
      }, 1000);
    }

    const initialState = () => {
      startScreen.classList.remove("hidden");
      timeoutScreen.classList.replace("flex", "hidden");
      mainScreen.classList.add("hidden");
      resultScreen.classList.replace("flex", "hidden");

      currentData = 0;
      userAnswers.length = 0;
    }

    function resetQuiz() {
      initialState();

      Object.keys(filterAnswers).forEach(k => delete filterAnswers[+k]);
      optionsUl.innerHTML = "";
      ans.innerHTML = "";
    }

    function renderQuestion(index: number) {
      optionsUl.innerHTML = "";
      const item = data[index];
      ques.innerHTML = item.question
        .replace("javascript", "")
        .replaceAll("\n", "<br>")
        .replaceAll("```", "");

      quesNo.textContent = `${index + 1} / ${data.length}`;

      item.options.forEach(opt => {
        const li = document.createElement("li");
        li.id = opt.char;
        li.className = "option h-1/4 flex items-center justify-center text-2xl font-medium bg-sky-600 rounded-lg cursor-pointer hover:bg-sky-500 transition";
        li.innerHTML = opt.text;

        if (userAnswers[index] === opt.char) {
          li.classList.replace("bg-sky-600", "bg-orange-500");
        }
        optionsUl.appendChild(li);
      });

      addOptionListeners(index);
      // updatePagination();
      createPagination();
      startTimer(60, timeEl);
    }

    function addOptionListeners(index: number) {
      document.querySelectorAll<HTMLLIElement>(".option").forEach(li => {
        li.onclick = () => {
          userAnswers[index] = li.id;
          if (index < data.length - 1) {
            currentData++;
            renderQuestion(currentData);
          } else {
            showResults();
          }
        };
      });
    }

    function createPagination() {
      paginationContainer.innerHTML = ""; // Clear container

      // Create Prev button
      const prevBtn = createNavButton("Prev", "prev-page", currentData === 0);
      paginationContainer.appendChild(prevBtn);

      // Render page buttons per logic below
      renderPageButtons();

      // Create Next button
      const nextBtn = createNavButton("Next", "next-page", currentData === data.length - 1);
      paginationContainer.appendChild(nextBtn);

      // Navigation listeners
      prevBtn.onclick = () => currentData > 0 && goToPage(currentData - 1);
      nextBtn.onclick = () => currentData < data.length - 1 && goToPage(currentData + 1);
    }

    function renderPageButtons() {
      const totalPages = data.length;
      const page = currentData + 1;

      // Clean page buttons (those with class 'page-btn')
      paginationContainer.querySelectorAll<HTMLElement>(".page-btn, .ellipsis").forEach(el => el.remove());

      const addBtn = (label: string, pageIndex: number | null, isActive = false, isEllipsis = false) => {
        const li = document.createElement("li");
        if (isEllipsis) {
          li.className = "ellipsis px-3 py-1 select-none";
          li.innerText = "...";
          li.setAttribute("aria-disabled", "true");
          // Ellipsis is not clickable
        } else {
          li.className = "page-btn px-3 py-1 rounded-full border border-white cursor-pointer select-none";
          if (isActive) li.classList.add("bg-orange-500", "text-black", "font-bold");
          li.innerText = label;
          li.setAttribute("aria-current", isActive ? "page" : "false");
          li.onclick = () => pageIndex !== null && goToPage(pageIndex);
        }

        // Get the reference node to insert before (the 'Next' button)
        const nextBtn = document.getElementById("next-page")!;
        paginationContainer.insertBefore(li, nextBtn);
      };

      // Logic for pagination with ellipses and window size 7 max
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
          addBtn(i.toString(), i - 1, i === page);
        }
      } else {
        addBtn("1", 0, page === 1);
        if (page > 4) addBtn("...", null, false, true);

        let start = Math.max(2, page - 1);
        let end = Math.min(totalPages - 1, page + 1);
        if (page <= 4) { start = 2; end = 5; }
        if (page >= totalPages - 3) { start = totalPages - 4; end = totalPages - 1; }

        for (let i = start; i <= end; i++) addBtn(i.toString(), i - 1, i === page);
        if (page < totalPages - 3) addBtn("...", null, false, true);
        addBtn(totalPages.toString(), totalPages - 1, page === totalPages);
      }
    }

    function createNavButton(label: string, id: string, disabled: boolean): HTMLLIElement {
      const li = document.createElement("li");
      li.id = id;
      li.className = `px-3 py-1 rounded-full border border-white cursor-pointer select-none ${disabled ? "disabled" : ""}`;
      li.innerText = label;
      li.setAttribute("aria-disabled", String(disabled));
      return li;
    }

    function goToPage(pageIndex: number) {
      currentData = pageIndex;
      renderQuestion(currentData);
    }

    function showResults() {
      clearInterval(timer);
      resultScreen.classList.replace("hidden", "flex");
      mainScreen.classList.add("hidden");

      let score = 0;
      data.forEach((q, i) => {
        if (userAnswers[i] === q.correctAnswer) {
          score++;
          filterAnswers[i] = "✔";
        } else {
          filterAnswers[i] = "❌";
        }
      });
      resultScore.innerHTML = `Your Score: <span class="text-white font-bold">${score}</span>/${data.length}`;

      data.forEach((item, index) => {
        const box = document.createElement("div");
        box.id = "ans-box";
        box.className = "w-full rounded-lg";
        box.setAttribute("style", "background-color: #414141; padding: 16px 32px; margin-bottom: 28px; position: relative");

        const ansQue = document.createElement("div");
        ansQue.setAttribute("style", "margin-bottom: 14px; font-weight: 500;");
        ansQue.innerHTML = `<span style="position:absolute; top:40px; right:32px; font-size:40px">${filterAnswers[index]}</span> ${item.question.replace("javascript", "").replace(/\n/g, "<br>").replace(/```/g, "")}`;

        const ansExplanation = document.createElement("div");
        ansExplanation.innerHTML = item.explanation.replace(/\n/g, "<br>");
        ansExplanation.setAttribute("style", "margin-top: 48px; color: lightgreen");

        box.append(ansQue, ansExplanation);
        ans.appendChild(box);
      });
    }

    startBtn.addEventListener("click", () => {
      startScreen.classList.add("hidden");
      mainScreen.classList.remove("hidden");
      renderQuestion(currentData);
    });
    retryBtn.addEventListener("click", resetQuiz);

  } catch (error) {
    console.error(error);
  }
}

main();
