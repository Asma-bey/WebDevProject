Course: COSC 225: Web Programming
Student: Asma 
Date: 2025/05/20
Final Project:  To-Do List for productivity

Overview
This project is a dynamic task management web application that allows users to create, complete, delete tasks. In addition to that you get to have an analysis of the tasks in the form of a progress circle pie chart. The application also includes features for recording feelings–input into the mongoDB–and displaying daily quotes to keep the user motivated. It is designed to be user-friendly with a simple and intuitive interface that allows users to choose themes(default, floral, space, pink). The application integrates FullCalendar which shows the task calendar by month, week and day with different colors (red for abandoned taks:deleted but not completed, yellow for uncompleted and green for completed tasks).

Look and Feel
The application features a modern but simple and minimalistic design. The color scheme is chosen to be pleasant and to suit the theme that is chosen (the background image), different themes are available for customization(default, floral, space, pink). A task bar is provided to go from one page to another for different functionalities:Today’s Tasks, Upcoming, Completed, Analytics and Calendar. I used  charts to provide an intuitive way to visualize progress.

User Interactions
Users can interact with the website in several ways:
1. Task Management: Users can add new tasks with a start date, mark tasks as completed, and delete tasks. These interactions are handled through fetch requests to the server, which updates the database and broadcasts changes to all clients using Socket.io for real-time updates.
2. Theme Customization: Users can select from different themes to personalize their experience.
3. Feeling Recording: Users can record their current feelings using a simple form. This data is sent to the server and stored in the database.
4. Quote Display: The application fetches and displays a daily quote.
5. Analytics: Users can view a pie chart with all the features of chart.js on their task completion rates. They could also view a progress circle.
6. Hovering over buttons would make them slightly red and hovering over the items in the side bar would make them change color to 
reflect that they are clickable.

Third-Party Packages
The following npm packages are necessary for running the site:
- express: Web framework for Node.js.
- mongoose: MongoDB object data modeling (ODM) library.
- socket.io: Library for real-time, bidirectional communication.
- http: HTTP server module.
- node-fetch: HTTP request library.
- chart.js: Library for creating charts and graphs.
- fullcalendar: Library for displaying and interacting with calendars.
-font-awesome:Library for displaying icons.


Running the Server
To run the server you need to follow these steps:
1. Ensure you have Node.js and npm installed on your machine.
2. Unzip the project files and navigate to the project directory.
3. Install the dependencies by running `npm install` in the terminal.
4. Start the server by executing `node server.js`.
5. Open a web browser and navigate to `http://localhost:5000/note.html` to access the application.

Project Structure
- server.js: The main server file that sets up the Express application, connects to MongoDB, defines API routes, and handles Socket.io connections.
- notes.js: Contains client-side JavaScript for DOM manipulation, event handling, and interacting with the server via fetch requests and Socket.io.
- note.html: The HTML structure of the web application.
- notes.css: Stylesheet for the application, defining the look and feel and the layout design.
- package.json: Lists project dependencies and scripts for running the application.





