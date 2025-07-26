async function callData() {
  try {
    const response = await fetch("http://localhost:8000/quiz");
    const data = await response.json();
    console.log("ResData : ", data);

    const ques = document.getElementById("question");
    const quesNo = document.getElementById("question-no");
    const time = document.getElementById("time");
    const optionsUl = document.getElementById("options");

    const timeoutScreen = document.getElementById("timeout-screen");
    const mainScreen = document.getElementById("main-screen");
    const paginationContainer = document.getElementById("pagination");
    const resultScreen = document.getElementById("result-screen");
    const resultScore = document.getElementById("result-score");
    const ans = document.getElementById("ans");

    const startScreen = document.getElementById("start-screen");
    const startBtn = document.getElementById("start-btn");
    const retryBtn = document.getElementById("retry-btn");

    let currentData = 0;
    let userAnswers = [];
    let filterAnswers = {};
    let timer;

    function startTimer(duration, display) {
      clearInterval(timer);
      let timeLeft = duration;

      timer = setInterval(() => {
        let minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");

        let seconds = String(timeLeft % 60).padStart(2, "0");
        display.textContent = `00:${minutes}:${seconds}`;

        if (timeLeft <= 10) {
          display.classList.remove("text-white");
          display.classList.add("text-red-500");
        } else {
          display.classList.remove("text-red-500");
          display.classList.add("text-white");
        }
        --timeLeft;
        if (timeLeft < 0) {
          clearInterval(timer);
          timeoutScreen.classList.remove("hidden");
          timeoutScreen.classList.add("flex");
          mainScreen.classList.add("hidden");
          startScreen.classList.add("hidden");
        }
      }, 1000);
    }

    function resetQuiz() {
      startScreen.classList.remove("hidden");
      timeoutScreen.classList.add("hidden");
      timeoutScreen.classList.remove("flex");
      mainScreen.classList.add("hidden");
      resultScreen.classList.add("hidden");
      resultScreen.classList.remove("flex");

      currentData = 0;
      userAnswers = [];
      filterAnswers = {};
      optionsUl.innerHTML = "";
      ans.innerHTML = "";
    }

    function renderQuestion(index) {
      optionsUl.innerHTML = "";
      ques.innerHTML = data[index].question
        .replace("javascript", "")
        .replaceAll("\n", "<br>")
        .replaceAll("```", "");

      quesNo.textContent = `${+index + 1} / ${data.length}`;

      data[index].options.forEach((item) => {
        const li = document.createElement("li");
        li.id = item.char;
        li.className =
          "option h-1/4 flex items-center justify-center text-2xl font-medium bg-sky-600 rounded-lg cursor-pointer hover:bg-sky-500 transition";
        li.innerHTML = item.text;

        if (userAnswers[index] === item.char) {
          li.classList.remove("bg-sky-600");
          li.classList.add("bg-orange-500");
        }

        optionsUl.append(li);
      });

      addOptionListeners(index);
      // updatePagination();
      createPagination();
      startTimer(600, time);
    }

    function addOptionListeners(index) {
      const optionLis = document.querySelectorAll(".option");
      optionLis.forEach((li) => {
        li.addEventListener("click", () => {
          userAnswers[index] = li.id;
          startTimer(600, time);
          console.log(userAnswers);

          if (index < data.length - 1) {
            currentData++;
            renderQuestion(currentData);
          } else {
            showResults();
          }
        });
      });
    }

    // ======= IMPROVED PAGINATION LOGIC =======
    function createPagination() {
      paginationContainer.innerHTML = ""; // Clear container

      // Create Prev button
      const prevBtn = createNavButton("Prev", "prev-page", currentData === 0);
      paginationContainer.appendChild(prevBtn);

      // Render page buttons per logic below
      renderPageButtons();

      // Create Next button
      const nextBtn = createNavButton(
        "Next",
        "next-page",
        currentData === data.length - 1
      );
      paginationContainer.appendChild(nextBtn);

      // Navigation listeners
      prevBtn.addEventListener("click", () => {
        if (currentData > 0) {
          goToPage(currentData - 1);
        }
      });

      nextBtn.addEventListener("click", () => {
        if (currentData < data.length - 1) {
          goToPage(currentData + 1);
        }
      });
    }

    function renderPageButtons() {
      const totalPages = data.length;
      const page = currentData + 1;

      // Clean page buttons (those with class 'page-btn')
      Array.from(
        paginationContainer.querySelectorAll(".page-btn, .ellipsis")
      ).forEach((el) => el.remove());

      const addBtn = (label, pageIndex, isActive, isEllipsis = false) => {
        const li = document.createElement("li");
        if (isEllipsis) {
          li.className = "ellipsis px-3 py-1 select-none";
          li.innerText = "...";
          li.setAttribute("aria-disabled", "true");
          // Ellipsis is not clickable
        } else {
          li.className =
            "page-btn px-3 py-1 rounded-full border border-white cursor-pointer select-none";
          if (isActive)
            li.classList.add("bg-orange-500", "text-black", "font-bold");
          li.innerText = label;
          li.setAttribute("aria-current", isActive ? "page" : "false");
          li.addEventListener("click", () => goToPage(pageIndex));
        }
        // Get the reference node to insert before (the 'Next' button)
        const nextBtn = document.getElementById("next-page");
        paginationContainer.insertBefore(li, nextBtn);
      };

      // Logic for pagination with ellipses and window size 7 max
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) {
          addBtn(i, i - 1, i === page);
        }
      } else {
        addBtn(1, 0, page === 1);

        if (page > 4) addBtn("...", null, false, true);

        let start = Math.max(2, page - 1);
        let end = Math.min(totalPages - 1, page + 1);

        if (page <= 4) {
          start = 2;
          end = 5;
        }
        if (page >= totalPages - 3) {
          start = totalPages - 4;
          end = totalPages - 1;
        }

        for (let i = start; i <= end; i++) {
          addBtn(i, i - 1, i === page);
        }

        if (page < totalPages - 3) addBtn("...", null, false, true);

        addBtn(totalPages, totalPages - 1, page === totalPages);
      }
    }

    function createNavButton(label, id, disabled) {
      const li = document.createElement("li");
      li.id = id;
      li.className =
        "px-3 py-1 rounded-full border border-white cursor-pointer select-none " +
        (disabled ? "disabled" : "");
      li.innerText = label;
      li.setAttribute("aria-disabled", disabled.toString());
      return li;
    }

    function goToPage(pageIndex) {
      currentData = pageIndex;
      renderQuestion(currentData);
      startTimer(600, time);
    }
    // ======= END IMPROVED PAGINATION LOGIC =======

    function showResults() {
      clearInterval(timer);
      resultScreen.classList.remove("hidden");
      resultScreen.classList.add("flex");
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

      console.log("Score = ", score);
      console.log("Lenght = ", data.length);
      resultScore.innerHTML = `Your Score: <span class="text-white font-bold">${score}</span>/${data.length}`;
      // background-color: #414141; padding: 16px 32px; margin-bottom: 28px;

      data.forEach((item, index) => {
        let box = document.createElement("div");
        box.id = "ans-box";
        box.classList = "w-full rounded-lg";
        box.setAttribute(
          "style",
          "background-color: #414141; padding: 16px 32px; margin-bottom: 28px; position: relative"
        );

        const ansQue = document.createElement("div");
        ansQue.setAttribute("style", "margin-bottom: 14px; font-weight: 500;");
        ansQue.innerHTML = `<span
    style="margin-right: 8px; position:absolute; top:40px; right:32px; font-size:40px">${
      filterAnswers[index]
    }</span> ${item.question
          .replace("javascript", "")
          .replaceAll("\n", "<br>")
          .replaceAll("```", "")}`;

        const ansExplanation = document.createElement("div");
        ansExplanation.innerHTML = item.explanation.replaceAll("\n", "<br>");
        ansExplanation.setAttribute(
          "style",
          "margin-top: 48px; color: lightgreen"
        );

        box.append(ansQue);
        box.append(ansExplanation);
        ans.append(box);
      });
    }

    startBtn.addEventListener("click", () => {
      startScreen.classList.add("hidden");
      mainScreen.classList.remove("hidden");
      renderQuestion(currentData);
      startTimer(600, time);
      createPagination();
    });

    retryBtn.addEventListener("click", () => {
      resetQuiz();
    });
  } catch (err) {
    console.log(err);
  }
}

callData();
