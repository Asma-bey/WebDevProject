/*Course: COSC 225: Web Programming
Student: Asma Bachir Bey
Date: 2025/05/20
file:  notes.js file */

const taskInput = document.getElementById("taskInput"); // Input field for new tasks
const addTaskBtn = document.getElementById("addTaskBtn"); // Add task button
const taskList = document.getElementById("taskList"); // List where tasks are displayed
const themeSelector = document.getElementById("theme"); // Theme dropdown selector
const quoteElement = document.getElementById("quote"); // Element to display daily quote
const socket = io(); // Socket.io client for real-time updates

// Real-time Updates
// Listen for task refresh events from the server and refresh task data and completion rate
socket.on("refreshTasks", () => {
  loadTasks();
  loadCompletionRate();
});

// Setting today's date as a default Date for Task Start
function setDefaultDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  //Converts the number to a string ex: februarry -> 02
  const day = String(today.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;
  document.getElementById("taskStartDate").value = formattedDate;
}

// Function to handle switching between different tabs in the UI
function switchTab(tab) {
  // Remove active class from all sidebar items
  document
    .querySelectorAll(".sidebar li")
    .forEach((li) => li.classList.remove("active"));

  // Add active class to the clicked tab
  event.target.closest("li").classList.add("active");

  // Hide all sections with the class 'tab-section'
  document
    .querySelectorAll(".tab-section")
    .forEach((section) => (section.style.display = "none"));

  // Show the selected section
  document.getElementById(`${tab}Section`).style.display = "block";

  // Load the appropriate tasks or data based on the selected tab
  if (tab === "completed") {
    loadCompletedTasks();
  } else if (tab === "current") {
    loadTasks();
  } else if (tab === "upcoming") {
    loadUpcomingTasks();
  } else if (tab === "analytics") {
    loadAnalytics();
  } else if (tab === "calendar") {
    loadCalendar();
  }
}

// Load Upcoming Tasks
// Function to load tasks that are scheduled for future dates
async function loadUpcomingTasks() {
  try {
    const response = await fetch("/api/tasks?upcoming=true&deleted=false");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const tasks = await response.json();
    const taskList = document.getElementById("upcomingTaskList");
    taskList.innerHTML = "";
    tasks.forEach((task) => {
      addTaskToDOM(task, taskList);
    });
    console.log("Upcoming tasks loaded successfully:", tasks);
  } catch (error) {
    console.error("Error loading upcoming tasks:", error);
    alert("Failed to load upcoming tasks. Please try again.");
  }
}

// Load Today's Tasks
// Function to load tasks that are due today and not completed or deleted
async function loadTasks() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await fetch(`/api/tasks?deleted=false&startDate=${today}`);
    console.log("Fetch response:", response);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const tasks = await response.json();
    const taskList = document.getElementById("currentTaskList");
    if (!taskList) {
      console.error("currentTaskList element not found");
      return;
    }
    taskList.innerHTML = "";
    tasks.forEach((task) => {
      addTaskToDOM(task, taskList);
    });
    console.log("Today's tasks loaded successfully:", tasks);
  } catch (error) {
    console.error("Error loading today's tasks:", error);
    alert("Failed to load today's tasks. Please try again.");
  }
}

// Function to load analytics data
async function loadAnalytics() {
  try {
    const response = await fetch("/api/tasks");
    const tasks = await response.json();
    const analyticsData = prepareAnalyticsData(tasks);
    destroyCharts();

    createTaskStatusChart(analyticsData);
  } catch (error) {
    console.error("Error loading analytics:", error);
    alert("Failed to load analytics. Please try again.");
  }
}

// Function to destroy existing charts to avoid canvas conflicts
function destroyCharts() {
  Chart.helpers.each(Chart.instances, function (instance) {
    instance.destroy();
  });
}

// Function to process tasks and prepare data for charts
function prepareAnalyticsData(tasks) {
  let completed = 0;
  let abandoned = 0;
  let uncompleted = 0;

  tasks.forEach((task) => {
    if (task.completed) {
      completed++;
    } else if (task.deleted) {
      abandoned++;
    } else {
      uncompleted++;
    }
  });

  return {
    // abandoned = deleted but not completed
    taskStatus: [completed, abandoned, uncompleted],
  };
}

// Function to create a pie chart showing task status distribution
function createTaskStatusChart(data) {
  const ctx = document.getElementById("taskStatusChart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Completed", "Abandoned", "Uncompleted"],
      datasets: [
        {
          data: data.taskStatus,
          backgroundColor: [
            "rgba(75, 192, 192, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Task Status Distribution",
        },
      },
    },
  });
}

// Function to load and initialize the calendar
async function loadCalendar() {
  try {
    const response = await fetch("/api/tasks");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const tasks = await response.json();
    const calendarData = prepareCalendarData(tasks);
    initializeCalendar(calendarData);
  } catch (error) {
    console.error("Error loading calendar:", error);
    alert("Failed to load calendar. Please try again.");
  }
}

// Function to process tasks and prepare data for the calendar
function prepareCalendarData(tasks) {
  const calendarEvents = [];
  tasks.forEach((task) => {
    const event = {
      title: task.text,
      start: task.startDate
        ? new Date(task.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      extendedProps: {
        id: task._id,
        completed: task.completed,
        deleted: task.deleted,
      },
    };

    if (task.completed) {
      event.backgroundColor = "#4CAF50";
    } else if (task.deleted && !task.completed) {
      event.backgroundColor = "#F44336";
    } else if (!task.deleted && !task.completed) {
      event.backgroundColor = "#FFC107";
    } else if (
      !task.completed &&
      !task.deleted &&
      task.startDate &&
      new Date(task.startDate) > new Date()
    ) {
      event.backgroundColor = "#2196F3";
    }

    calendarEvents.push(event);
  });

  return calendarEvents;
}

// Initialize Calendar
// Function to initialize the FullCalendar component with prepared event data
function initializeCalendar(events) {
  const calendarEl = document.getElementById("calendar");

  new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    events: events,
    eventClick: function (info) {
      const task = info.event.extendedProps;
      console.log("Task clicked:", task);
    },
    eventDidMount: function (info) {
      const tooltip = document.createElement("div");
      tooltip.className = "fc-event-tooltip";
      tooltip.innerHTML = `
        <strong>${info.event.title}</strong><br>
        ${
          info.event.extendedProps.completed
            ? "Completed"
            : info.event.extendedProps.deleted
            ? "Abandoned"
            : "Uncompleted"
        }
      `;
      info.el.appendChild(tooltip);
    },
  }).render();
}

// Add Task to DOM
// Function to create a task element and append it to the specified task list
function addTaskToDOM(task, taskList) {
  const li = document.createElement("li");
  li.className = "task-item";
  li.dataset.id = task._id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = task.completed;

  const taskText = document.createElement("span");
  taskText.className = "task-text";
  taskText.textContent = task.text;
  taskText.style.textDecoration = task.completed ? "line-through" : "none";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";

  const startDateSpan = document.createElement("span");
  startDateSpan.className = "start-date";
  if (task.startDate) {
    const [year, month, day] = task.startDate.split("-"); // Manually parse the date string
    const date = new Date(year, month - 1, day);
    startDateSpan.textContent = `Start: ${
      new Date(task.startDate).toISOString().split("T")[0]
    }`;
  }

  li.appendChild(checkbox);
  li.appendChild(taskText);
  li.appendChild(startDateSpan);
  li.appendChild(deleteBtn);

  checkbox.addEventListener("change", async () => {
    taskText.style.textDecoration = checkbox.checked ? "line-through" : "none";
    await updateTask(task._id, { completed: checkbox.checked });
  });

  deleteBtn.addEventListener("click", async () => {
    try {
      await fetch(`/api/tasks/${task._id}`, {
        method: "DELETE",
      });
      li.remove();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  });

  taskList.appendChild(li);
}

// Add Task Button Event Listener
// Event listener for adding new tasks when the add button is clicked
// Add Task Button Event Listener
addTaskBtn.addEventListener("click", async () => {
  const text = taskInput.value.trim();
  const startDate = document.getElementById("taskStartDate").value;
  if (!text) return;

  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, startDate }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const newTask = await response.json();
    const currentTaskList = document.getElementById("currentTaskList");
    if (currentTaskList) {
      addTaskToDOM(newTask, currentTaskList);
    } else {
      console.error("currentTaskList element not found");
    }
    taskInput.value = "";
    document.getElementById("taskStartDate").value = startDate; // Reset start date
  } catch (error) {
    console.error("Error adding task:", error);
    alert("Failed to add task. Please try again.");
  }
});

// Theme Handling
// Event listener for theme selection changes
themeSelector.addEventListener("change", async (e) => {
  const theme = e.target.value;
  document.body.className = theme;
  localStorage.setItem("theme", theme);
});

// Function to load and apply the default theme on the page
function loadTheme() {
  const theme = localStorage.getItem("theme") || "default";
  document.body.className = theme;
  themeSelector.value = theme;
}

// Fetch with Retry
// Function to fetch data with retry logic in case of failure
async function fetchWithRetry(url, retries = 3) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
}

// Function to load and display a daily quote
async function loadQuote() {
  try {
    const data = await fetchWithRetry("/api/external-quote");
    quoteElement.textContent = `"${data.q}" - ${data.a}`;
  } catch (error) {
    console.error("Error loading quote:", error);
    quoteElement.textContent = "Failed to load quote.";
  }
}

// Feeling Form Submission
// Event listener for submitting the feeling form
document.getElementById("feelingForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const emotion = document.querySelector(
    'input[name="emotion"]:checked'
  )?.value;
  if (!emotion) return alert("Please select an emotion.");

  try {
    await fetch("/api/feelings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emotion }),
    });
    alert("Feeling recorded!");
  } catch (error) {
    console.error("Error recording feeling:", error);
  }
});

// Load Completed Tasks
// Function to load completed tasks and display them
async function loadCompletedTasks() {
  try {
    const response = await fetch("/api/tasks?completed=true");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const tasks = await response.json();
    const list = document.getElementById("completedList");
    list.innerHTML = "";

    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task-item";
      li.textContent = task.text;

      const btn = document.createElement("button");
      btn.textContent = "Reopen";
      btn.onclick = async () => {
        await fetch(`/api/tasks/${task._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: false, deleted: false }),
        });
        li.remove();
      };

      const startDateSpan = document.createElement("span");
      startDateSpan.className = "start-date";
      if (task.startDate) {
        startDateSpan.textContent = `Start: ${new Date(
          task.startDate
        ).toLocaleDateString()}`;
      }

      li.innerHTML = "";
      li.appendChild(btn);
      li.appendChild(document.createTextNode(task.text));
      li.appendChild(startDateSpan);

      list.appendChild(li);
    });
    console.log("Completed tasks loaded successfully:", tasks);
  } catch (error) {
    console.error("Error loading completed tasks:", error);
    alert("Failed to load completed tasks. Please try again.");
  }
}

// Load Task Completion Rate
// Function to load and display the task completion rate on the circle
async function loadCompletionRate() {
  try {
    const response = await fetch("/api/tasks/completion-rate");
    const data = await response.json();
    const rate = parseFloat(data.completionRate);
    document.getElementById("completionRate").textContent = `${rate.toFixed(
      0
    )}%`;

    const circumference = 440;
    const offset = circumference - (rate / 100) * circumference;

    const circle = document.querySelector(".skill circle");
    circle.style.strokeDashoffset = offset;
    circle.style.transition = "stroke-dashoffset 0.5s ease";
  } catch (error) {
    console.error("Error loading completion rate:", error);
  }
}

// Update Task
// Function to update task data on the server
async function updateTask(id, updates) {
  try {
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error updating task:", error);
  }
}

// Delete Task
// Function to delete a task
async function deleteTask(id) {
  try {
    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}

// Toggle Sidebar
// Function to toggle the sidebar panel
function togglePanel() {
  const panel = document.getElementById("sidePanel");
  panel.style.right = panel.style.right === "0px" ? "-250px" : "0px";
}

// Initialize Application
// Function calls to initialize the application on page load
loadTasks(); // Load today's tasks
loadTheme(); // Apply saved theme
loadQuote(); // Load daily quote
loadCompletionRate(); // Load completion rate
setDefaultDate(); // Set default date to today's date
document.getElementById("currentSection").style.display = "block"; // Show default tab
document.querySelector(".sidebar li.active").classList.add("active"); // Set active class on default tab
