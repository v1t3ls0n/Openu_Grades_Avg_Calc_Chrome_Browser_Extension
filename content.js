// content.js

async function fetchCourseData(course_url_link) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "fetchData", url: course_url_link },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error communicating with background:",
            chrome.runtime.lastError.message
          );
          reject("Error communicating with background");
        } else if (response && response.success) {
          resolve(response.creditPoints);
        } else {
          reject("Failed to fetch course data");
        }
      }
    );
  });
}

(async function () {
  console.log("content.js is running");

  if (
    location.href.startsWith(
      "https://sheilta.apps.openu.ac.il/pls/dmyopt2/course_info.courses"
    )
  ) {
    console.log("Extension: On the correct page.");
    await waitForCourseDataAndRun();
  } else {
    alert(
      "Please log in to your Open University account, then re-run the extension."
    );
  }
})();

async function waitForCourseDataAndRun() {
  console.log("Extension: Waiting for course data...");
  const observer = new MutationObserver(async (mutationsList, observer) => {
    const rows = document.querySelectorAll(".content_tbl > tbody > tr");
    if (rows.length > 0) {
      console.log("Extension: Course data detected.");
      observer.disconnect();
      mainFunction();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

async function mainFunction() {
  console.log("Extension: mainFunction started.");
  const rows = document.querySelectorAll(".content_tbl > tbody > tr");
  console.log("Extension: Rows found:", rows.length);

  if (rows.length === 0) {
    alert("No course data found. Please ensure you are on the correct page.");
    return;
  }

  // Define the status filters
  const successStatuses = ["עבר", "הצלחה"];
  const inProgressStatuses = ["נרשם", "בלימוד"];

  let studentCoursesDataObj = Array.from(rows)
    .filter((tr) => {
      // Ensure the row has enough cells
      if (tr.children.length > 9) {
        const status = tr.children[3].innerText.trim();
        // Filter courses based on status
        return (
          successStatuses.includes(status) ||
          inProgressStatuses.includes(status)
        );
      }
      return false;
    })
    .map((tr) => {
      let course_url_link = tr.children[8].children[0].children[0].href;
      let status = tr.children[3].innerText.trim(); // סטטוס
      let nakaz = status === "עבר" ? 0 : tr.children[2].innerText.trim(); // נקודות זכות
      let grade = status === "עבר" ? 1 : tr.children[4].innerText.trim(); // ציון סופי
      let course = tr.children[7].innerText.trim(); // שם קורס
      let courseId = tr.children[8].innerText.trim(); // מספר קורס
      let semester = tr.children[9].innerText.trim(); // סמסטר
      let creditPoints = nakaz != 0 ? nakaz : undefined;
      status = status === "עבר" ? "עובר בינארי" : status;
      return {
        nakaz,
        status,
        grade,
        course,
        courseId,
        semester,
        course_url_link,
        creditPoints,
      };
    })
    .sort((a, b) => b.grade - a.grade);

  console.log("Extension: Extracted course data:", studentCoursesDataObj);

  if (studentCoursesDataObj.length === 0) {
    alert("No eligible courses found based on the status filters.");
    return;
  }

  for await (const [index, course] of studentCoursesDataObj.entries()) {
    try {
      const creditPoints = await fetchCourseData(course.course_url_link);
      if (!studentCoursesDataObj[index].nakaz) {
        studentCoursesDataObj[index].grade = -1;
        studentCoursesDataObj[index].creditPoints = creditPoints;
        studentCoursesDataObj[index].nakaz = creditPoints;
      }
    } catch (error) {
      console.error("Error fetching course URL:", course_url_link, error);
    }
  }
  // Inject the calculator into the page
  await injectCalculator(studentCoursesDataObj);
}

async function injectCalculator(courseData) {
  try {
    console.log("Attempting to inject calculator iframe.");

    // Create a container for the calculator
    const container = document.createElement("div");
    container.id = "extension-calculator-container";
    container.style.position = "fixed";
    container.style.top = "5vh";
    container.style.left = "25vw";
    container.style.right = "25vw";
    container.style.width = "50vw";
    container.style.height = "90vh";

    container.style.zIndex = "9999";
    container.style.border = "1px solid #ccc";
    container.style.backgroundColor = "#fff";
    container.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
    container.style.resize = "both";
    container.draggable = true;
    container.resize = "both";
    container.style.overflow = "auto";
    container.style.minHeight = "fit-content";
    container.style.minWidth = "fit-content";

    // Create a header for dragging and close button
    const header = document.createElement("div");
    // header.style.backgroundColor = "#2364DB";
    header.style.cursor = "move";
    header.style.position = "relative";
    header.style.zIndex = "1000";
    header.style.padding = "5px";
    header.style.margin = "5px";
    header.style.maxHeight = "100px";
    header.style.minHeight = "75px";

    // Add close button to header
    const closeButton = document.createElement("span");
    closeButton.innerHTML = "&times;";
    // closeButton.style.position = "absolute";
    // closeButton.style.height = "24px";
    // closeButton.style.width = "24px";
    // closeButton.style.padding = "10px";
    // closeButton.style.right = "0px";
    // closeButton.style.top = "0px";
    closeButton.style.cursor = "pointer";
    closeButton.style.marginRight = "10px";
    closeButton.style.fontSize = "50px";
    // closeButton.style.color = "white";

    closeButton.addEventListener("click", () => {
      container.remove();
    });

    header.appendChild(closeButton);

    // Draggable functionality
    let isDragging = false;
    let startX, startY, initialX, initialY;

    header.addEventListener("mousedown", function (e) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = parseInt(container.style.left, 10);
      initialY = parseInt(container.style.top, 10);
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", stopDrag);
    });

    function drag(e) {
      if (isDragging) {
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        container.style.left = initialX + dx + "px";
        container.style.top = initialY + dy + "px";
      }
    }

    function stopDrag() {
      isDragging = false;
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("mouseup", stopDrag);
    }

    // Create an iframe element to load the calculator page
    const iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("calculator.html");
    iframe.style.position = "absolute";
    // iframe.style.top = "100px";
    // iframe.style.left = "0";
    iframe.style.width = "100%";
    // iframe.style.height = "calc(100% - 100px)";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.resize = "both";
    iframe.style.overflow = "auto";
    iframe.style.minHeight = "fit-content";
    iframe.style.minWidth = "fit-content";
    // Add the header and iframe to the container
    container.appendChild(header);
    container.appendChild(iframe);

    // Add the container to the body
    document.body.appendChild(container);

    // Send the course data to the iframe after it loads
    iframe.addEventListener("load", () => {
      console.log("Extension: calculator iframe loaded.");
      iframe.contentWindow.postMessage(
        { action: "injectData", data: courseData },
        "*"
      );
    });
  } catch (error) {
    console.error("Error injecting calculator:", error);
  }
}
