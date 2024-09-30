// calculator.js

document.addEventListener("DOMContentLoaded", () => {
  const coursesContainer = document.getElementById("courses-container");
  const addCourseButton = document.getElementById("add-course");
  const calculateButton = document.getElementById("calculate-average");
  const averageResult = document.getElementById("average-result");
  const removeSelectedButton = document.getElementById("remove-courses");

  // Function to add a new course input row
  function addCourse(course = {}) {
    const tableWrapper = document.createElement("tr");
    tableWrapper.className = "course-row";

    // Create input elements according to the desired order
    const nakazEl = document.createElement("td");
    nakazEl.contentEditable = true;
    // nakazEl.type = "number";
    nakazEl.placeholder = `נק"ז`;
    nakazEl.innerText = course.nakaz || 0;

    const statusEl = document.createElement("td");
    statusEl.contentEditable = true;
    statusEl.placeholder = "סטטוס";
    statusEl.innerText = course.status || "";

    const gradeEl = document.createElement("td");
    // gradeEl.type = "number";
    gradeEl.contentEditable = true;
    gradeEl.placeholder = "-1";
    gradeEl.innerText = course.grade || "   ";

    const courseTitle = document.createElement("td");
    const courseIdLink = document.createElement("a");
    courseTitle.contentEditable = true;
    courseIdLink.contentEditable = true;
    courseIdLink.href = `https://www.openu.ac.il/courses/${course.courseId}.htm`;
    courseIdLink.target = "_blank";
    courseIdLink.innerText = `${course.course}`;
    courseTitle.appendChild(courseIdLink);
    const semesterEl = document.createElement("td");
    semesterEl.contentEditable = true;
    semesterEl.placeholder = "סמסטר";
    semesterEl.innerText = course.semester || "";

    const checkboxWrapper = document.createElement("td");
    const checkboxEl = document.createElement("input");
    checkboxEl.type = "checkbox";
    checkboxEl.checked = false;
    checkboxWrapper.appendChild(checkboxEl);

    // Append elements in the desired order
    tableWrapper.appendChild(semesterEl);
    tableWrapper.appendChild(courseTitle);
    tableWrapper.appendChild(statusEl);
    tableWrapper.appendChild(nakazEl);
    tableWrapper.appendChild(gradeEl);
    tableWrapper.appendChild(checkboxWrapper);
    coursesContainer.appendChild(tableWrapper);
  }

  // Add initial course rows or populate with data
  function initializeCourses(courses = []) {
    coursesContainer.innerHTML = ""; // Clear existing courses
    if (courses.length > 0) {
      courses.forEach((course) => addCourse(course));
    } else {
      addCourse(); // Add an empty course row by default
    }
  }

  // Calculate the average grade
  function calculateAverage() {
    const courseRows = document.querySelectorAll(".course-row");
    let totalWeightedGrades = 0;
    let totalCredits = 0;

    courseRows.forEach((row) => {
      const inputs = row.querySelectorAll("td");
      const nakaz = parseFloat(inputs[3].innerText);
      const grade = parseFloat(inputs[4].innerText);

      if (!isNaN(nakaz) && !isNaN(grade) && grade >= 60) {
        totalWeightedGrades += nakaz * grade;
        totalCredits += nakaz;
      }
    });

    if (totalCredits > 0) {
      const average = totalWeightedGrades / totalCredits;
      averageResult.innerHTML = `<p>ממוצע הציונים שלך הוא: <strong>${average.toFixed(
        2
      )}</strong></p>`;
    } else {
      averageResult.innerHTML = '<p>אנא הזן נק"ז וציונים תקינים.</p>';
    }
  }

  const removeCourses = () => {
    document
      .querySelectorAll('#courses-table tr td > input[type="checkbox"]:checked')
      .forEach((checkbox) => {
        const tr = checkbox.closest("tr");
        if (tr) {
          tr.remove();
        }
      });
    calculateAverage();
  };

  // Event listeners
  addCourseButton.addEventListener("click", addCourse);
  calculateButton.addEventListener("click", calculateAverage);
  removeSelectedButton.addEventListener("click", removeCourses);

  // Listen for messages from the content script
  window.addEventListener("message", (event) => {
    if (event.data.action === "injectData") {
      initializeCourses(event.data.data);
      calculateAverage(); // Automatically calculate after injecting data
    }
  });
});
