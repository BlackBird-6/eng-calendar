import json
import re

raw_input = open("assets/raw_events.txt", "r+", encoding="UTF-8").read().splitlines()
output = open("assets/events.json", "w+")

calendar_year = "2025"

parsed_input = []

current_id = 0

# Truncate all non-event lines out of the output (and ID counter)
truncated_input = []
for l in raw_input:
    if l.startswith("%"):
        break

    if l.startswith("#") or l == "":
        continue
    truncated_input.append(l)

for i, l in enumerate(truncated_input):

    # Remove whitespace near commas
    l = l.replace(", ", ",")
    l = l.replace(" ,","")
    l = l.split(",")

    date = l[0].split()

    school_year = 2025

    months = {
        "Jan": "01",
        "Feb": "02",
        "Mar": "03",
        "Apr": "04",
        "May": "05",
        "Jun": "06",
        "Jul": "07",
        "Aug": "08",
        "Sep": "09",
        "Oct": "10",
        "Nov": "11",
        "Dec": "12",
    }

    # Nov 29 1pm --> [Month] [Day] [Time]

    # If the month is not one of the above, raises exception
    if date[0] not in months.keys():
        print(f"Error: Month {date[0]} not detected in month names in entry, or not correctly formatted in YYYY-MM-DD:\n {l}.")
        raise Exception

    # Ensure day is formatted to two digits
    if len(date[1]) == 1:
        date[1] = "0" + date[1]

    new_date = [calendar_year, "-", months[date[0]], "-", date[1]]
    l[0] = "".join(new_date)

    # Convert time to local time
    if len(date) >= 3:
        time = "".join(date[2:])

        hour_offset = 0

        if "AM" not in time.upper() and "PM" not in time.upper():
            print(f"Error: 'AM' or 'PM' not detected in entry {l}.")
            raise Exception

        if "PM" in time.upper():
            hour_offset = 12

        time = time.upper().replace("AM", "")
        time = time.upper().replace("PM", "")

        if ":" not in time: # e.g. if 9am or 12pm is inputted instead of 9:00am or 12:00pm
            time += ":00"
        elif not re.findall("\d{1,2}:\d\d", time):
            print(f"Error: {time} incorrectly formatted in entry {l}.")
            raise Exception

        # e.g. 23:59 --> 23 59
        time = time.split(":")

        # Translate AM entries to 24 hour time
        time[0] = str(int(time[0]) + hour_offset)

        # Ensure leading zero is placed
        if len(time[0]) == 1:
            time[0] = "0" + time[0]

        # Ensure trailing seconds are placed
        if len(time) <= 2:
            time.append("00")
        time = ":".join(time)

        # Insert resulting time
        l.insert(1, "".join(time))
    else:
        # Assume default of 11:59pm
        l.insert(1, "23:59:00")

    parsed_input.append(l)

# Sort list by date and time
parsed_input.sort(key=lambda ele: (ele[0], ele[1]))

# Output into JSON
output.writelines("[\n")
for i, l in enumerate(parsed_input):

    l.append(l[2].replace(" ", ""))

    if len(l) != 8:
        print(f"Error: Incorrect number of arguments detected in {l}.")
        raise Exception

    res = {"date": l[0],
           "time": l[1],
           "name": l[2],
           "type": l[3],
           "major": l[4],
           "attending": l[5],
           "notes": l[6],
           "id": l[7]}

    if i == len(parsed_input) - 1:
        output.writelines(json.dumps(res))
    else:
        output.writelines(json.dumps(res) + ",\n")

    print(json.dumps(res))

output.writelines("\n]")
print("Finished JSON Generation!")