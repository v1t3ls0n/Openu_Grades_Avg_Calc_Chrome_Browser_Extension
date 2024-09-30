// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "injectData") {
        const courses = request.data;
        insertCoursesIntoForm(courses);
        assignCalcFunction();
        clickCalculateButton(); // Add this line to trigger the calculation
    }
});

function insertCoursesIntoForm(courses) {
    // Assuming the calculator page supports adding more courses
    for (let i = 0; i < courses.length; i++) {
        if (i >= 2) {
            // Click the 'Add' button to add more input fields
            document.getElementById("ad").click();
        }
        // Fill in the course data
        document.getElementById(`${i + 1}n`).value = courses[i].course;
        document.getElementById(`${i + 1}p`).value = courses[i].nakaz;
        document.getElementById(`${i + 1}g`).value = courses[i].grade;
    }
}

function assignCalcFunction() {
    const calcButton = document.querySelector("body > form > button.submit");
    if (calcButton) {
        calcButton.onclick = calcFloatAvg;
    }
}

function calcFloatAvg() {
    let gradeSum = 0;
    let nakazSum = 0;
    const arr = [];

    // Collect all course indices
    document.querySelectorAll('[id$="n"]').forEach(input => {
        const id = input.id.replace('n', '');
        arr.push(id);
    });

    for (let i = 0; i < arr.length; i++) {
        const nakaz = Number(document.getElementById(`${arr[i]}p`).value);
        const grade = Number(document.getElementById(`${arr[i]}g`).value);

        gradeSum += nakaz * grade;
        nakazSum += nakaz;
    }

    const endGrade = gradeSum / nakazSum;

    document.getElementById('endgrad').innerHTML = endGrade
        ? `ממוצע :<b> ${endGrade.toFixed(2)}</b>`
        : `אנא הזן ציונים`;
}

function clickCalculateButton() {
    // Click the calculate button after a short delay to ensure the form is filled
    setTimeout(() => {
        const calcButton = document.querySelector("body > form > button.submit");
        if (calcButton) {
            calcButton.click();
        } else {
            // Fallback: Use the provided selector
            const alternativeButton = document.querySelector("body > form > button:nth-child(8)");
            if (alternativeButton) {
                alternativeButton.click();
            }
        }
    }, 500); // Adjust the delay if necessary
}