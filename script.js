// Read events
const sheetId = localStorage.getItem("sheetId") ?? "1B6kZoFqaIocyBSl--YfNAmb3_QC__8kcnnV4xVhCC6A";
const sheetName = "Events"; // tab name
const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;


const jsonFilePath = "assets/events.json";
let stressMode = localStorage.getItem("stressMode") ?? false;
let refreshData;
let refreshTime
let data = [];

const tableBodies = [
    document.querySelector("#eventsDay tbody"),
    document.querySelector("#eventsWeek tbody"),
    document.querySelector("#eventsMajor tbody"),
    document.querySelector("#eventsAll tbody"),
    document.querySelector("#eventsCompleted tbody")
];

const chemWarn = document.querySelector("#chemWarn");
const programmingWarn = document.querySelector("#programmingWarn");
const staticsWarn = document.querySelector("#staticsWarn");
const cohortWarn = document.querySelector("#cohortWarn");

const courseDropdowns = document.querySelector("#courseDropdowns");
const programmingSelect = document.querySelector(".programmingSelect");
const chemSelect = document.querySelector("#chemSelect");
const cohortDropdown = document.querySelector("#cohortDropdown");
const staticsDropdown = document.querySelector("#staticsDropdown");
const chemDropdown = document.querySelector("#chemDropdown");
const programmingDropdown = document.querySelector("#programmingDropdown");
const renderSecondsBox = document.querySelector("#renderSeconds");

// Declare variables for cohort and course sections
let staticsSection = "";
let chemSection = "";
let programmingSection = "";
let cohort = "";

// Event listeners for dropdowns
cohortDropdown.addEventListener("change", function () {
    if (this.value == "") return;
    cohort = this.value;
    cohortWarn.style.display = "none";
    localStorage.setItem("cohort", cohort);

    courseDropdowns.style.display = "flex";

    if (!staticsSection) {
        staticsWarn.style.display = "block";
    }

    // Hide all elements relating to the other cohort and show all elements relating to this cohort
    if (cohort == "cohortA") {
        chemSelect.style.display = "block";

        programmingSelect.style.display = "none";
        programmingSection = "";
        programmingDropdown.selectedIndex = 0;
        programmingWarn.style.display = "none";

        if (!chemSection) {
            chemWarn.style.display = "block";
        }
    }

    if (cohort == "cohortB") {
        programmingSelect.style.display = "block";

        chemSelect.style.display = "none";
        chemWarn.style.display = "none";
        chemSection = "";
        chemDropdown.selectedIndex = 0;

        if (!programmingSection) {
            programmingWarn.style.display = "block";
        }
    }

    renderItems();
});

// Clear warning upon selecting a section ID
chemDropdown.addEventListener("change", function () {
    if (this.value == "") return;
    chemSection = this.value;
    chemWarn.style.display = "none";
    localStorage.setItem("chemSection", chemSection);
    renderItems();
});

staticsDropdown.addEventListener("change", function () {
    if (this.value == "") return;
    staticsSection = this.value;
    staticsWarn.style.display = "none";
    localStorage.setItem("staticsSection", staticsSection);
    renderItems();
});

programmingDropdown.addEventListener("change", function () {
    if (this.value == "") return;
    programmingSection = this.value;
    programmingWarn.style.display = "none";
    localStorage.setItem("progSection", programmingSection);
    renderItems();
});

renderSecondsBox.addEventListener("change", function () {
    stressMode = this.checked;
    localStorage.setItem("stressMode", stressMode);
    renderItems();
});

document.querySelector("h3.introText").innerHTML = atob("YnkgTmF0aGFuIENoaXU=");

cohortDropdown.value = localStorage.getItem("cohort") ?? "";
staticsDropdown.value = localStorage.getItem("staticsSection") ?? "";
chemDropdown.value = localStorage.getItem("chemSection") ?? "";
programmingDropdown.value = localStorage.getItem("progSection") ?? "";
renderSecondsBox.checked = localStorage.getItem("stressMode") == "true";

// Update dropdowns
cohortDropdown.dispatchEvent(new Event("change"));
staticsDropdown.dispatchEvent(new Event("change"));
chemDropdown.dispatchEvent(new Event("change"));
programmingDropdown.dispatchEvent(new Event("change"));
renderSecondsBox.dispatchEvent(new Event("change"));

function emergency() {
    data.forEach(item => {
        item.major = "Yes";
    });
}

// Update time remaining for each item
function updateTimeLeft() {
    let currentDate = new Date();
    // currentDate = new Date("2025-02-25T10:00:00"); // Set to a specific date for testing

    // Special surprise for April 1st
    if (currentDate.toString().includes("Apr 01")) {
        emergency();
    }

    data.forEach(item => {
        const eventDate = item.fullDate;
        const timeDiff = eventDate - currentDate;
        
        item.daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        item.hoursLeft = Math.floor(timeDiff / 1000 / 60 / 60);
        item.minutesLeft = Math.floor(timeDiff / 1000 / 60);
        
        // Track time to the second if stress mode is enabled
        if (stressMode == true) {
            let secondsLeft = Math.ceil(timeDiff / 1000) % 60;
            let minutesLeft = Math.floor(timeDiff / 1000 / 60) % 60;
            let hoursLeft = Math.floor(timeDiff / 1000 / 60 / 60) % 24;
            let daysLeft = Math.floor(timeDiff / 1000 / 60 / 60 / 24);

            if (daysLeft <= 9) {
                daysLeft = "0" + daysLeft;
            }
            if (hoursLeft <= 9) {
                hoursLeft = "0" + hoursLeft;
            }
            if (minutesLeft <= 9) {
                minutesLeft = "0" + minutesLeft;
            }
            if (secondsLeft <= 9) {
                secondsLeft = "0" + secondsLeft;
            }

            item.timeLeft = `${daysLeft}:${hoursLeft}:${minutesLeft}:${secondsLeft}`;
        } else if (item.minutesLeft >= 0 && item.minutesLeft < 60)
            item.timeLeft = `${item.minutesLeft} minutes`;
        else if (item.hoursLeft >= 0 && item.hoursLeft < 48)
            item.timeLeft = `${item.hoursLeft} hours`;
        else
            item.timeLeft = `${item.daysLeft} days`;
    });
}

// Check if the user is attending the section related to the item
function checkAttendance(item) {
    return item.attending == "All"
        || item.attending == cohort
        || item.attending == staticsSection
        || item.attending == programmingSection
        || item.attending == chemSection;
}

// Refresh the page every eight hours of use to ensure up to date data
setInterval(() => {
    location.reload();
}, 1000 * 60 * 60 * 8);


// Initialize item checkboxes after rendering items
function initializeCheckboxes() {
    const itemCheckboxes = document.querySelectorAll(".itemCheckbox");
    itemCheckboxes.forEach(itemCheckbox => {
        itemCheckbox.checked = localStorage.getItem(itemCheckbox.id) == "true";
        itemCheckbox.addEventListener("change", function () {
            localStorage.setItem(itemCheckbox.id, itemCheckbox.checked);
            const otherBoxes = document.querySelectorAll(`#${itemCheckbox.id}`);
            otherBoxes.forEach(box => {
                box.checked = itemCheckbox.checked;
            });
        });
    });
}

// Populate a row with JSON data
const addRow = (item, tableBody) => {
    const row = document.createElement("tr");
    row.innerHTML = `
    <td>${item.date}</td>
    <td>${item.name}</td>
    <td><input type="checkbox" class="itemCheckbox" id="item${item.id}"></td>
    <td>${item.type}</td>
    <td>${item.major}</td>
    <td>${item.notes}</td> 
    `;

    // Time left field becomes menacing if the event is due today, or empty if the event has passed
    if (item.daysLeft == 0) {
        row.innerHTML += `<td><b>Due Today.</b><br/>${item.timeLeft}</td>`;
        if (item.major === "No") {
            row.querySelectorAll("td").forEach(item => {
                item.classList.add("timedCell");
            });
        }
    }
    else if (item.daysLeft > 0) {
        row.innerHTML += `<td>${item.timeLeft}</td>`;
    }
    else {
        row.innerHTML += "<td>-</td>";
    }

    // Table becomes menacing if the item is a major assessment
    if (item.major === "Yes") {
        row.style.backgroundColor = "#ffcccc";
        row.querySelectorAll("td").forEach(item => {
            item.classList.add("majorCell");
        });
    } else {
        row.style.backgroundColor = "white";
        row.querySelectorAll("td").forEach(item => {
            item.classList.add("cell");
        });
    }

    // Append item to table
    tableBody.append(row);
};


function renderItems() {
    // Clear tables
    tableBodies.forEach(body => {
        body.innerHTML = "";
    });

    updateTimeLeft();

    data.forEach(item => {
        // If you are not attending the section related to this item, skip it
        if (checkAttendance(item) == false) return;

        // Add items to all applicable tables

        // Due within 48 Hours
        if (item.hoursLeft >= 0 && item.hoursLeft < 48)
            addRow(item, tableBodies[0]);
        
        // Due within 48-168 Hours
        else if (item.hoursLeft >= 48 && item.hoursLeft < 168) // due within a week
            addRow(item, tableBodies[1]);
        
        // Major assessments due within one month
        if (item.daysLeft >= 0 && item.daysLeft <= 31 && item.major === "Yes") // upcoming major assessments
            addRow(item, tableBodies[2]);

        // All upcoming events
        if (item.hoursLeft >= 0)
            addRow(item, tableBodies[3]);
        // All completed events
        else addRow(item, tableBodies[4]);
    });

    // All events completed
    if (tableBodies[3].innerHTML === "") {
        tableBodies.forEach(body => {
            if (body.innerHTML === "") {
                body.innerHTML
                    = "<tr><td colspan='7' style='font-style: italic; background-color: #f0fff0;'>Everything has been completed! Enjoy your summer!</td></tr>";
            }
        });
    }
    // No upcoming events
    else {
        tableBodies.forEach(body => {
            if (body.innerHTML === "") {
                body.innerHTML
                    = "<tr><td colspan='7' style='font-style: italic; background-color: #f0fff0;'>There are no upcoming events! Enjoy it while it lasts...</td></tr>";
            }
        });
    }

    // Refresh tables after one second (only if tables should be updated each second)
    if (stressMode) {
        clearTimeout(refreshTime);
        refreshTime = setTimeout(renderItems, 1000);
    } else { // Otherwise update it once every ten minutes
        clearTimeout(refreshTime);
        refreshTime = setTimeout(renderItems, 600000);
    }

    initializeCheckboxes();
}

function fetchData() {
    data = []
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text()
        })
        .then(res => {
            let rows = JSON.parse(res.substr(47).slice(0, -2))['table']['rows'];
            // console.log(rows)
            rows = rows.map(r => r['c'])
            for(r of rows) {
                r = r.map((r, i) => {

                    if (!r) return null;
                    if (!r['v']) return null;
                    if (!r['f']) return r['v']
                    return r['f']
                })
                
                // Switch date format to ISO 8601 because mobile is annoying
                if(!r[1]) r[1] = '11:59 PM'

                let dateSplit = r[0].split("/") // ex. 12/14/2025
                let timeSplit = r[1].split(" ") // ex. 3:00 PM
                let hour = timeSplit[0].split(":")[0]
                let minute = timeSplit[0].split(":")[1]
                let hourAdjusted = Number(hour) + (timeSplit[1] === "PM" ? 12 : 0)
                let timeAdjusted = `${hourAdjusted < 10 ? "0" : ""}${hourAdjusted}:${minute}:00`
                jsonRow = {
                    'date' : r[0],
                    'fullDate' : new Date(`${dateSplit[2]}-${dateSplit[0] < 10 ? "0" : ""}${dateSplit[0]}-${dateSplit[1] < 10 ? "0" : ""}${dateSplit[1]}T${timeAdjusted}`),
                    'time' : r[1] ?? '11:59 PM',
                    'name' : r[2] ?? 'Unnamed Event',
                    'type' : r[3] ?? 'No',
                    'major' : r[4] ?? 'No',
                    'attending' : r[5] ?? 'All',
                    'notes' : r[6] ?? '-',
                    'id' : r[2] ? r[2].replace(" ", "") : 'Unnamed'
                }
                data.push(jsonRow)
            }
            
            data.sort((a, b) => a.fullDate - b.fullDate)
            processData(data)
        })
        .catch(error => {
            console.error("Error fetching or parsing JSON from sheets:", error);
            
            data = [{
                "date": "-",
                "fullDate": new Date() + 1000*60*60*12,
                "time": "11:59 PM",
                "name": "ERROR 500",
                "type": "No",
                "major": "Yes",
                "attending": "All",
                "notes": "An unknown error occurred while trying to load event data.\nPlease contact the organizer of the spreadsheet.",
                "id": "ERROR500",
            }];
            processData(data);
        });

    clearTimeout(refreshData);
    // Refresh data every 15 minutes
    refreshData = setTimeout(fetchData, 1000*60*15);
}

function processData(data) {
    updateTimeLeft();
    renderItems();
}

function toggleVisibility(id, linkId) {
    // Toggle table visibility
    const container = document.querySelector(`#${id}Container`);
    container.style.display = container.style.display === "none" ? "block" : "none";

    // Toggle link visibility
    linkId.innerHTML = linkId.innerHTML === "+ Click to Open"
        ? "- Click to Collapse"
        : "+ Click to Open";
}

fetchData();