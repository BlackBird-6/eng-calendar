// Read events
const jsonFilePath = "assets/events.json";
let stressMode = false;
let refresh;

// Fetch JSON data
fetch(jsonFilePath)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    updateTimeLeft();

    const tableBodies = [
      document.querySelector("#eventsDay tbody"),
      document.querySelector("#eventsWeek tbody"),
      document.querySelector("#eventsMajor tbody"),
      document.querySelector("#eventsAll tbody"),
      document.querySelector("#eventsCompleted tbody"),
    ];

    // Populate a row with JSON data
    const addRow = (item, tableBody) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${item.date}</td>
          <td>${item.name}</td>
          <td>${item.type}</td>
          <td>${item.major}</td>
          <td>${item.notes}</td> 
        `;

      // Time left field becomes menacing if the event is due today, or empty if the event has passed
      if (item.daysLeft == 0) {
        row.innerHTML += `<td><b>Due Today.</b><br/>${item.timeLeft}</td>`;
        row.querySelectorAll("td").forEach((item) => {
          item.classList.add("timedCell");
        });
      } else if (item.daysLeft > 0) {
        row.innerHTML += `<td>${item.timeLeft}</td>`;
      } else {
        row.innerHTML += `<td>-</td>`;
      }

      // Table becomes menacing if the item is a major assessment
      if (item.major === "Yes") {
        row.style.backgroundColor = "#ffcccc";
        row.querySelectorAll("td").forEach((item) => {
          item.classList.add("majorCell");
        });
      } else {
        row.style.backgroundColor = "white";
        row.querySelectorAll("td").forEach((item) => {
          item.classList.add("cell");
        });
      }

      // Append item to table
      tableBody.appendChild(row);
    };

    // Declare variables for cohort and course sections
    let staticsSection = "N/A";
    let chemSection = "N/A";
    let programmingSection = "N/A";
    let cohort = "N/A";

    const programmingSelect = document.querySelector(".programmingSelect");
    const chemSelect = document.getElementById("chemSelect");

    document
      .getElementById("cohortDropdown")
      .addEventListener("change", function () {
        cohortWarn.style.display = "none";
        cohort = this.value;

        courseDropdowns.style.display = "flex";

        if (staticsSection == "N/A") {
          staticsWarn.style.display = "block";
        }

        // Hide all elements relating to the other cohort and show all elements relating to this cohort
        if (cohort == "cohortA") {
          chemSelect.style.display = "block";

          programmingSelect.style.display = "none";
          programmingSection = "N/A";
          programmingDropdown.selectedIndex = 0;
          programmingWarn.style.display = "none";

          if (chemSection == "N/A") {
            chemWarn.style.display = "block";
          }
        }

        if (cohort == "cohortB") {
          programmingSelect.style.display = "block";

          chemSelect.style.display = "none";
          chemWarn.style.display = "none";
          chemSection = "N/A";
          chemDropdown.selectedIndex = 0;

          if (programmingSection == "N/A") {
            programmingWarn.style.display = "block";
          }
        }

        renderItems();
      });

    // Clear warning upon selecting a section ID
    document
      .getElementById("chemDropdown")
      .addEventListener("change", function () {
        chemWarn.style.display = "none";
        chemSection = this.value;
        renderItems();
      });

    document
      .getElementById("staticsDropdown")
      .addEventListener("change", function () {
        staticsWarn.style.display = "none";
        staticsSection = this.value;
        renderItems();
      });

    document
      .getElementById("programmingDropdown")
      .addEventListener("change", function () {
        programmingWarn.style.display = "none";
        programmingSection = this.value;
        renderItems();
      });

    document
      .getElementById("renderSeconds")
      .addEventListener("change", function () {
        stressMode = this.checked;
        renderItems();
      });

    function emergency() {
      data.forEach((item) => {
        item.major = "Yes";
      });
    }

    // Update time remaining for each item
    function updateTimeLeft() {
      // var currentDate = new Date('2025-04-01T09:00:01');
      var currentDate = new Date();
      if (currentDate.toString().includes("Apr 01")) {
        emergency();
      }

      data.forEach((item) => {
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
        } else if (item.hoursLeft >= 0 && item.hoursLeft < 48) {
          item.timeLeft = `${item.hoursLeft} hours`;
        } else item.timeLeft = `${item.daysLeft} days`;
      });
    }

    // Check if the user is attending the section related to the item
    function checkAttendance(item) {
      if (
        item.attending == "All" ||
        item.attending == cohort ||
        item.attending == staticsSection ||
        item.attending == programmingSection ||
        item.attending == chemSection
      ) {
        return true;
      } else return false;
    }

    function renderItems() {
      // Clear tables
      tableBodies.forEach((body) => {
        body.innerHTML = "";
      });

      updateTimeLeft();

      data.forEach((item) => {
        // If you are not attending the section related to this item, skip it
        if (checkAttendance(item) == false) {
          return;
        }

        // Add item to all applicable tables
        if (item.hoursLeft >= 0 && item.hoursLeft < 48) {
          addRow(item, tableBodies[0]);
        }
        if (item.hoursLeft >= 48 && item.hoursLeft < 168) {
          addRow(item, tableBodies[1]);
        }
        if (item.daysLeft >= 0 && item.daysLeft <= 31 && item.major === "Yes") {
          addRow(item, tableBodies[2]);
        }

        if (item.hoursLeft >= 0) {
          addRow(item, tableBodies[3]);
        }

        if (item.hoursLeft < 0) {
          addRow(item, tableBodies[4]);
        }
      });

      // Empty tables give a congratulatory message
      tableBodies.forEach((body) => {
        if (body.innerHTML === "") {
          body.innerHTML =
            "<tr><td colspan='6' style='font-style: italic; background-color: #f0fff0;'>There are no upcoming events! Enjoy it while it lasts...</td></tr>";
        }
      });

      // Refresh tables after one second (only if tables should be updated each second)
      if (stressMode) {
        clearTimeout(refresh);
        refresh = setTimeout(renderItems, 1000);
      }

      // Otherwise update it once every ten minutes
      else {
        clearTimeout(refresh);
        refresh = setTimeout(renderItems, 600000);
      }
    }

    // Initial table rendering
    renderItems();
  })
  .catch((error) => {
    console.error("Error fetching or parsing JSON:", error);
  });

function toggleVisibility(id, linkId) {
  // Toggle table visibility
  const container = document.getElementById(id + "Container");
  if (container.style.display === "none") {
    container.style.display = "block";
  } else {
    container.style.display = "none";
  }

  // Toggle link visibility
  if (linkId.innerHTML === "+ Click to Open")
    linkId.innerHTML = "- Click to Collapse";
  else {
    linkId.innerHTML = "+ Click to Open";
  }
}
