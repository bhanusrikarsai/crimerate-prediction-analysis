# Crime Intelligence Backend

This is the backend server for the **Crime Intelligence Dashboard**. It is built with **Node.js** and **Express.js** to handle data requests and file uploads (like crime reports or evidence images).

## 🚀 Features
* **Express Server:** Handles API routing and middleware.
* **File Uploads:** Integrated **Multer** for handling multipart/form-data.
* **Automated Testing:** Includes **Puppeteer** scripts for end-to-end browser testing.
* **Persistent Storage:** Saves uploaded files to a local `uploads/` directory.

## 🛠️ Tech Stack
| Tool | Purpose |
| :--- | :--- |
| **Node.js** | JavaScript Runtime |
| **Express** | Backend Framework |
| **Multer** | Image/File Upload Middleware |
| **Puppeteer** | Headless Browser Testing |

## 📦 Installation

Before running the server, make sure you have **Node.js** installed on your system.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/crime.git
   cd crime
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create an uploads folder:**
   Make sure there is a folder named `uploads` in your root directory to store the images.
   ```bash
   mkdir uploads
   ```

## 🏃 How to Run

### Start the Server
To run the main backend server:
```bash
node server.js
```
The server will typically start on **http://localhost:3000** (or whichever port you defined in `server.js`).

### Run Tests
To run the Puppeteer automated tests:
```bash
node puppeteer_test.js
```

## 📂 Project Structure
* `server.js`: The main entry point for the Express application.
* `puppeteer_test.js`: Script for automated browser interaction and testing.
* `uploads/`: Directory where images or crime report files are stored.
* `package.json`: Contains project metadata and dependency list.
