// Read events
const jsonFilePath = "assets/events.json";
let stressMode = localStorage.getItem("stressMode") ?? false;
let refresh;

// Fetch JSON data
fetch(jsonFilePath)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        updateTimeLeft();

        const tableBodies = [
            document.querySelector("#eventsDay tbody"),
            document.querySelector("#eventsWeek tbody"),
            document.querySelector("#eventsMajor tbody"),
            document.querySelector("#eventsAll tbody"),
            document.querySelector("#eventsCompleted tbody")
        ];

        // Populate a row with JSON data
        const addRow = (item, tableBody) => {
            const row = document.createElement("tr");
            row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.name}</td>
            <td><input type="checkbox" class="itemCheckbox", id=item${item.id}></td>
            <td>${item.type}</td>
            <td>${item.major}</td>
            <td>${item.notes}</td> 
            `;

            // Time left field becomes menacing if the event is due today, or empty if the event has passed
            if (item.daysLeft == 0) {
                row.innerHTML += `<td><b>Due Today.</b><br/>${item.timeLeft}</td>`;
                row.querySelectorAll("td").forEach(item => {
                    item.classList.add("timedCell");
                });
            } else if (item.daysLeft > 0) {
                row.innerHTML += `<td>${item.timeLeft}</td>`;
            } else {
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
        cohortDropdown.addEventListener("change", function() {
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
        chemDropdown.addEventListener("change", function() {
            if (this.value == "") return;
            chemSection = this.value;
            chemWarn.style.display = "none";
            localStorage.setItem("chemSection", chemSection);
            renderItems();
        });

        staticsDropdown.addEventListener("change", function() {
            if (this.value == "") return;
            staticsSection = this.value;
            staticsWarn.style.display = "none";
            localStorage.setItem("staticsSection", staticsSection);
            renderItems();
        });

        programmingDropdown.addEventListener("change", function() {
            if (this.value == "") return;
            programmingSection = this.value;
            programmingWarn.style.display = "none";
            localStorage.setItem("progSection", programmingSection);
            renderItems();
        });

        renderSecondsBox.addEventListener("change", function() {
            stressMode = this.checked;
            localStorage.setItem("stressMode", stressMode);
            renderItems();
        });

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

            // Special surprise for April 1st
            var currentDate = new Date();
            if (currentDate.toString().includes("Apr 01")) {
                emergency();
            }

            data.forEach(item => {
                const eventDate = new Date(item.date + "T" + item.time);
                // console.log(eventDate);
                const timeDiff = eventDate - currentDate;

                item.daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                item.hoursLeft = Math.floor(timeDiff / 1000 / 60 / 60);

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
                } else if (item.hoursLeft >= 0 && item.hoursLeft < 48)
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

        function renderItems() {
            // Clear tables
            tableBodies.forEach(body => {
                body.innerHTML = "";
            });

            updateTimeLeft();

            data.forEach(item => {
                // If you are not attending the section related to this item, skip it
                if (checkAttendance(item) == false) return;

                // Add item to all applicable tables
                if (item.hoursLeft >= 0 && item.hoursLeft < 48) // due within 48 hours
                    addRow(item, tableBodies[0]);
                else if (item.hoursLeft >= 48 && item.hoursLeft < 168) // due within a week
                    addRow(item, tableBodies[1]);

                if (item.daysLeft >= 0 && item.daysLeft <= 31 && item.major === "Yes") // upcoming major assessments
                    addRow(item, tableBodies[2]);

                if (item.hoursLeft >= 0) // all upcoming
                    addRow(item, tableBodies[3]);
                else if (item.hoursLeft < 0) // all completed
                    addRow(item, tableBodies[4]);
            });

            // Empty tables give a congratulatory message
            tableBodies.forEach(body => {
                if (body.innerHTML === "") {
                    body.innerHTML
            = "<tr><td colspan='6' style='font-style: italic; background-color: #f0fff0;'>There are no upcoming events! Enjoy it while it lasts...</td></tr>";
                }
            });

            // Refresh tables after one second (only if tables should be updated each second)
            if (stressMode) {
                clearTimeout(refresh);
                refresh = setTimeout(renderItems, 1000);
            } else { // Otherwise update it once every ten minutes
                clearTimeout(refresh);
                refresh = setTimeout(renderItems, 600000);
            }

            initializeCheckboxes();
        }

        // Initialize item checkboxes after rendering items
        function initializeCheckboxes() {
            itemCheckboxes = document.querySelectorAll(".itemCheckbox");
            itemCheckboxes.forEach(itemCheckbox => {
                itemCheckbox.checked = localStorage.getItem(itemCheckbox.id) == "true";
                itemCheckbox.addEventListener("change", function() {
                    localStorage.setItem(itemCheckbox.id, itemCheckbox.checked);
                });
            });
        };


        // Render items
        renderItems();

    })
    .catch(error => {
        console.error("Error fetching or parsing JSON:", error);
    });

function toggleVisibility(id, linkId) {
    // Toggle table visibility
    const container = document.querySelector(`#${id}Container`);
    container.style.display = container.style.display === "none" ? "block" : "none";

    // Toggle link visibility
    linkId.innerHTML = linkId.innerHTML === "+ Click to Open"
        ? "- Click to Collapse"
        : "+ Click to Open";
}