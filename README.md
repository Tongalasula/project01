Azani ISP Management System - Quick Start Guide

Welcome to the **Azani ISP Electronic Management System**. This guide will help you get the system up and running on your computer in just a few simple steps.

---

 Prerequisites
Before starting, ensure you have **Node.js** installed on your computer.
- If you don't have it, download and install it from [nodejs.org](https://nodejs.org/). (Choose the "LTS" version).

---

 How to Run the System

### Step 1: Open your Terminal
- On **Windows**: Search for "PowerShell" or "Command Prompt".
- On **Mac/Linux**: Open "Terminal".

 Step 2: Clone and enter the project
```bash
git clone https://github.com/Tongalasula/project01.git
cd project01
```

 Step 3: Install Required Files
```bash
npm install
```

 Step 4: Start the System
```bash
node server.js
```
*You should see a message saying:* `Server running on http://localhost:3000`

 Step 5: Open the Dashboard
- Open your web browser (Chrome, Edge, or Firefox).
- Find the file named `index.html` in your project folder and **drag it into your browser window**.
- **Alternatively**, just double-click the `index.html` file in your folder.

---

How to Use the System
1. **Register Institution**: Go to the "Register Institution" tab to add a new school.
2. **Setup Subscription**: Go to "Subscription" to select bandwidth (e.g., 50MBPS) and enter the number of PCs. 
   - *Note: The system automatically calculates the 10% discount for upgrades!*
3. **Record Payments**: Use the "Payments" tab to record fees.
   - *Note: If a project payment is made late, the system automatically adds a 15% fine.*
4. **View Reports**: Click the "Reports" tab to see lists of registered schools, defaulters, or total money collected.

---

Project Folder Breakdown
- `index.html`: The main screen you interact with.
- `app.js`: The "brain" of the website interface.
- `server.js`: The "bridge" between the website and the database.
- `azani_isp.db`: Where all your data is safely saved.

