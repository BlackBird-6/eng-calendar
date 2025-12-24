// Read events
let sheetId = localStorage.getItem("sheetId") ?? "1B6kZoFqaIocyBSl--YfNAmb3_QC__8kcnnV4xVhCC6A";
const sheetName = "Events"; // tab name

let url = ''
let loadCount = 0

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

const courseWarn = document.querySelector("#courseWarn");

const courseDropdowns = document.querySelector("#courseDropdowns");
const programmingSelect = document.querySelector(".programmingSelect");
const chemSelect = document.querySelector("#chemSelect");
const renderSecondsBox = document.querySelector("#renderSeconds");

// Declare variables for course sections
let attendingList = localStorage.getItem("attendingList") ? JSON.parse(localStorage.getItem("attendingList")) : {};


renderSecondsBox.addEventListener("change", function() {
    stressMode = this.checked;
    localStorage.setItem("stressMode", stressMode);
    renderItems();
});

renderSecondsBox.checked = localStorage.getItem("stressMode") == "true";

// Update dropdowns
renderSecondsBox.dispatchEvent(new Event("change"));

function swapSheet(sheetId) {
    localStorage.setItem("sheetId", sheetId)
        url_new = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=${sheetName}&tqx=out:json&tq=select A,B,C,D,E,F,G,H,I limit 1000 offset 0`;
        if (url === url_new) return;
        url = url_new;
        fetchData();
}

// Update time remaining for each item
function updateTimeLeft() {
    let currentDate = new Date();
    // currentDate = new Date("2025-10-25T10:00:00"); // Set to a specific date for testing

    // Special surprise for April 1st
    if (currentDate.toString().includes("Apr 01")) {
        data.forEach(item => {
            item.major = "Yes";
        });
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
        || item.attending.includes(attendingList[toId(item.attendingHeader)]);
    }

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
function addRow(item, tableBody) {
    const row = document.createElement("tr");
    row.innerHTML = `
    <td></td>
    <td></td>
    <td><input type="checkbox" class="itemCheckbox"></td>
    <td></td>
    <td></td>
    <td></td>
    <td></td> 
    `;

    item.notes = item.notes.replaceAll("\\n", "\n");
    row.children[0].textContent = item.date;
    row.children[1].textContent = item.name;
    row.children[2].children[0].id = `item${item.id}`;
    row.children[3].textContent = item.type;
    row.children[4].textContent = item.major;
    row.children[5].textContent = item.notes;

    // Time left field becomes menacing if the event is due today, or empty if the event has passed
    if (item.daysLeft == 0) {
        row.children[6].innerHTML = `<b>Due Today.</b><br/>`;
        row.children[6].append(document.createTextNode(item.timeLeft));
        if (item.major === "No") {
            row.querySelectorAll("td").forEach(item => {
                item.classList.add("timedCell");
            });
        }
    }
    else if (item.daysLeft > 0) {
        row.children[6].textContent = item.timeLeft;
    }
    else {
        row.children[6].textContent = "-";
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

function toId(str) {
    return str.split("").filter(c => "abcdefghijklmnopqrstuvwxyz1234567890".includes(c.toLowerCase())).join("")
}

function checkUnselectedCourses() {
    courseWarn.style.display = 'none';
    Array.from(courseDropdowns.children).forEach(n => {
        
        if(n.style.display !== "none") {
            let select = n.querySelector("select");
            if(select && (!select.value || select.value === '-')) {
                courseWarn.style.display = 'block';
            }            
        }

    })
}

function renderDropdowns() {
    courseDropdowns.innerHTML = '';
    let dropdownIds = {};

    for(let entry of data) {
        if (entry.attending && entry.attending !== 'All') {
            
            entry.attending = entry.attending.split(",").map((ele) => ele.trim())

            // Set to empty array if it doesn't exist yet
            dropdownIds[entry.attendingHeader] ??= new Set()
            for(id of entry.attending) {
                dropdownIds[entry.attendingHeader].add(id)
            }
            entry.attending.push("");
        }
    }

    // Create a sorted dropdown for all necessary fields
    for(let header in dropdownIds) {
        dropdownIds[header] = Array.from(dropdownIds[header]).sort()

        let dropdownDiv = document.createElement("div")
        dropdownDiv.id = `${toId(header)}Select`

        let dropdownLabel = document.createElement("label")
        dropdownLabel.textContent = `${header}: `

        let dropdownSelect = document.createElement("select")
        dropdownSelect.innerHTML = `<option selected value>-</option>`

        for(let id of dropdownIds[header]) {
            let option = document.createElement("option")
            option.value = id
            option.textContent = `${id}`
            dropdownSelect.append(option)
        }
        
        dropdownSelect.addEventListener("change", function() {
            attendingList[toId(header)] = this.value;
            localStorage.setItem("attendingList", JSON.stringify(attendingList));
            checkUnselectedCourses();
            renderItems();
        });

        dropdownDiv.append(dropdownLabel)
        dropdownDiv.append(dropdownSelect)
        courseDropdowns.append(dropdownDiv)
    }

    Array.from(courseDropdowns.children).forEach(n => {
        let select = n.querySelector("select");
        if(select) {
            select.value = attendingList[n.id.slice(0, -6)] ?? '-'
            select.dispatchEvent(new Event("change"));
        }
    })
    
}

document.querySelector(".introText").innerHTML = atob("YnkgTmF0aGFuIENoaXU=");
document.querySelector(".supportText").innerHTML = atob("PGhyPklmIHlvdSdkIGxpa2UgdG8gc3VwcG9ydCBteSBwcm9qZWN0cywgY2xpY2sgPGEgc3R5bGU9InBhZGRpbmc6IDA7IiBocmVmPSJodHRwczovL2tvLWZpLmNvbS9ibGFja2JpcmQ2Ij5oZXJlPC9hPiE=");
document.querySelector(".disc-link").href = atob("aHR0cHM6Ly9kaXNjb3JkLmdnL25lTWJmZk5RZWY=");

function renderItems() {
    // Clear tables
    tableBodies.forEach(body => {
        body.innerHTML = "";
    });

    updateTimeLeft();

    data.forEach(item => {
        if(item.hidden === 'Yes') return;
        if(!item.date) return;
        if (!checkAttendance(item)) return;

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

    // All events completed (No events due within a week and no major assessments due within a month)
    if (tableBodies[1].innerHTML === "" && tableBodies[2].innerHTML === "") {
        let phrase = "Everything has been completed! Enjoy your summer!";

        if ((new Date()).toString().includes("Dec") || (new Date()).toString().includes("Jan")) {
            phrase = "Everything has been completed! Enjoy your winter break!";
        }
        
        tableBodies.forEach(body => {
            if (body.innerHTML === "") {
                body.innerHTML
                    = `<tr><td colspan='7' style='font-style: italic; background-color: #f0fff0;'>${phrase}</td></tr>`;
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
    } else { // Otherwise update it once every minute
        clearTimeout(refreshTime);
        refreshTime = setTimeout(renderItems, 60000);
    }

    initializeCheckboxes();
    stopLoading();
}

function fetchData() {
    
    data = []
    if(loadCount > 10) {
        alert("Please wait a bit before trying again.");
        return;
    }

    loadCount += 1
    setTimeout(() => {loadCount -= 1}, 30000) // Soft cap at 10 fetch requests/30 seconds
    
    startLoading();

    fetch(url)
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.text();
    })
    .then(res => {
        let rows = JSON.parse(res.substr(47).slice(0, -2))['table']['rows'];
        rows = rows.map(r => r['c'].slice(0, 9))
        // console.log(rows)
        for(r of rows) {
            r = r.map((r) => {
                if (!r) return null;
                if (!r['v']) return null;
                if (!r['f']) return r['v']
                return r['f']
            })
            
            // Switch date format to ISO 8601 because mobile is annoying
            if(!r[1]) r[1] = '11:59 PM'
            
            let fullDate = null;
            if(r[0]) {
                let dateSplit = r[0].split("/") // ex. 12/14/2025
                let timeSplit = r[1].split(" ") // ex. 3:00 PM
                let hour = timeSplit[0].split(":")[0]
                let minute = timeSplit[0].split(":")[1]
                let hourAdjusted = Number(hour) + (timeSplit[1] === "PM" ? 12 : 0) - (Number(hour) === 12 ? 12 : 0)
                let timeAdjusted = `${hourAdjusted < 10 ? "0" : ""}${hourAdjusted}:${minute}:00`
                fullDate = new Date(`${dateSplit[2]}-${dateSplit[0] < 10 ? "0" : ""}${dateSplit[0]}-${dateSplit[1] < 10 ? "0" : ""}${dateSplit[1]}T${timeAdjusted}`)                    
            }

            jsonRow = {
                'date' : r[0],
                'fullDate' : fullDate,
                'time' : r[1] ?? '11:59 PM',
                'name' : r[2] ?? 'Unnamed Event',
                'type' : r[3] ?? 'No',
                'major' : r[4] ?? 'No',
                'attendingHeader' : r[5] ?? (r[6] ? 'Unnamed Dropdown' : null),
                'attending' : r[6] ?? 'All',
                'notes' : r[7] ?? '-',
                'id' : r[2] ? toId(r[2]) : 'Unnamed',
                'hidden' : r[8] ?? 'No'
            }
            data.push(jsonRow)
        }
        
        data.sort((a, b) => a.fullDate - b.fullDate)
        renderItems();
        renderDropdowns()
    })
    .catch(error => {
        console.error("Error fetching or parsing JSON from sheets:", error);
        renderError();
    });
    
    // Refresh data every 15 minutes
    clearTimeout(refreshData);
    refreshData = setTimeout(fetchData, 1000*60*15);
}

function renderError() {
    data = [{
                "date": "-",
                "fullDate": new Date(Date.now() + + 1000*60*60*12),
                "time": "11:59 PM",
                "name": `ERROR`,
                "type": "No",
                "major": "Yes",
                "attending": "All",
                "notes": "An unknown error occurred while trying to load event data. Try reloading the page or check console for details. Contact the organizer of the spreadsheet if the error persists.",
            }];
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
function startLoading() {
    const body = document.querySelector(".calendarBody")
    body.style.opacity = 0
    const loading = document.querySelector(".calendarLoading")
    loading.style.display = "block";
}
function stopLoading() {
    const body = document.querySelector(".calendarBody")
    body.style.opacity = 1
    const loading = document.querySelector(".calendarLoading")
    loading.style.display = "none";
}

startLoading();
swapSheet(sheetId)
