/*Course: COSC 225: Web Programming
Student: Asma Bachir Bey
Date: 2025/05/20
file: my server */

import fetch from "node-fetch"; // HTTP request library
import dotenv from "dotenv"; // Environment variables loader
import express from "express"; // Web framework
import mongoose from "mongoose"; // MongoDB ODM
import cors from "cors"; // CORS middleware
import { Server } from "socket.io"; // WebSockets for real-time updates
import http from "http"; // HTTP server module

// Initialize Express application
const app = express();

// Parse JSON request bodies
app.use(express.json());
// Serve static files from public directory
app.use(express.static("public"));

// connecting to  MongoDB
mongoose
  .connect("mongodb://localhost:27017/todo_list", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  .then(() => console.log("Connected to MongoDB")) // Success callback
  .catch((err) => console.error("MongoDB connection error:", err)); // Error callback

// Define Mongoose schemas
// Schema for feelings recorded by users
const feelingSchema = new mongoose.Schema({
  emotion: String, // Type of emotion recorded
  createdAt: { type: Date, default: Date.now }, // Automatic creation timestamp
});

// Schema for tasks
const taskSchema = new mongoose.Schema({
  text: String, // Task description
  completed: { type: Boolean, default: false }, // Task completion status
  deleted: { type: Boolean, default: false }, // Task deletion status
  startDate: { type: Date }, // Start date for the task
  createdAt: { type: Date, default: Date.now }, // Automatic creation timestamp
  completedAt: Date, // Timestamp when task was completed
});

// Create Mongoose models from schemas
const Feeling = mongoose.model("Feeling", feelingSchema);
const Task = mongoose.model("Task", taskSchema);

// Socket.io setup for real-time communication
const server = http.createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: { origin: "*" }, // Allow all origins for WebSocket connections
});

// Socket.io event handling
io.on("connection", (socket) => {
  console.log("A client connected"); // Log client connection

  socket.on("taskUpdated", () => {
    io.emit("refreshTasks"); // Broadcast task refresh event to all clients
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected"); // Log client disconnection
  });
});

// API Endpoints

// GET all tasks with optional filters
app.get("/api/tasks", async (req, res) => {
  const { completed, deleted, startDate, upcoming } = req.query;
  const query = {};

  if (completed !== undefined) {
    query.completed = completed === "true";
  }

  if (deleted !== undefined) {
    query.deleted = deleted === "true";
  }

  if (startDate) {
    query.startDate = { $lte: new Date(startDate) };
  }

  if (upcoming === "true") {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Start of today
    query.startDate = { $gt: today };
  }

  try {
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
    console.log("Tasks retrieved successfully:", tasks);
  } catch (error) {
    console.error("Error retrieving tasks:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create a new task
app.post("/api/tasks", async (req, res) => {
  const { text, startDate } = req.body; // Get task data from request
  try {
    const newTask = new Task({ text, startDate }); // Create new task instance
    await newTask.save(); // Save task to database (using mongoos)
    res.status(201).json(newTask); // Return created task
    io.emit("refreshTasks"); // Notify clients of task update
  } catch (error) {
    res.status(500).json({ message: "Server error" }); // Handle server errors
  }
});

// PUT update an existing task
app.put("/api/tasks/:id", async (req, res) => {
  const { id } = req.params; // Get task ID from URL parameters
  const { completed, deleted, startDate } = req.body; // Get update data from request

  try {
    const update = { completed, deleted };
    if (completed !== undefined) {
      update.completedAt = completed ? new Date() : null; // Update completion timestamp
    }
    if (startDate !== undefined) {
      update.startDate = startDate; // Update start date if provided
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      update,
      { new: true } // Return updated task
    );
    res.json(updatedTask); // Return updated task
    io.emit("refreshTasks"); // Notify clients of task update
  } catch (error) {
    res.status(500).json({ message: "Server error" }); // Handle server errors
  }
});

// DELETE soft-delete a task by setting deleted flag to true
app.delete("/api/tasks/:id", async (req, res) => {
  const { id } = req.params; // Get task ID from URL parameters

  try {
    await Task.findByIdAndUpdate(id, { deleted: true }); // Soft-delete task
    res.json({ message: "Task deleted" }); // Return success message
    io.emit("refreshTasks"); // Notify clients of task update
  } catch (error) {
    res.status(500).json({ message: "Server error" }); // Handle server errors
  }
});

// GET task completion rate
app.get("/api/tasks/completion-rate", async (req, res) => {
  try {
    // Count total non-deleted tasks
    const total = await Task.countDocuments({ deleted: false });
    // Count completed non-deleted tasks
    const completed = await Task.countDocuments({
      completed: true,
      deleted: false,
    });

    // Calculate completion rate
    const rate = total > 0 ? (completed / total) * 100 : 0;
    res.json({ completionRate: rate.toFixed(2) }); // Return completion rate
  } catch (error) {
    res.status(500).json({ message: "Server error" }); // Handle server errors
  }
});

// POST record a feeling
app.post("/api/feelings", async (req, res) => {
  const { emotion } = req.body; // Get emotion from request

  try {
    const newFeeling = new Feeling({ emotion }); // Create new feeling instance
    await newFeeling.save(); // Save feeling to database
    res.status(201).json({ message: "Feeling recorded" }); // Return success message
  } catch (error) {
    res.status(500).json({ message: "Server error" }); // Handle server errors
  }
});

// GET fetch a random quote from external API
app.get("/api/external-quote", async (req, res) => {
  try {
    const response = await fetch("https://zenquotes.io/api/random"); // Fetch quote
    const data = await response.json();
    res.json(data[0]); // Return quote data
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quote" }); // Handle fetch errors
  }
});

// Start server
const PORT = 5000;
server.listen(PORT);
console.log(`Server running on port ${PORT}`);
