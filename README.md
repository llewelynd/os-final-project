
# OS final project
 
A browser-based simulator for two core operating-systems topics:
 
1. **CPU scheduling**: see how FCFS, SJF, and Round Robin schedule a set of processes, with a Gantt chart and per-process metrics.
2. **Page replacement**: see how FIFO, LRU, and Optimal choose which page to evict when memory frames are full.
No build step, no dependencies. It is plain HTML, CSS, and JavaScript.
 
Developed as the final term project for CS 3104N (Group 11).
 
## Team
 
- Jyreneah Angel
- Llewelyn Dramayo

## Quick Start
 
1. Download or clone this repository.
2. Open `index.html` in any modern browser (double-click it, or run `open index.html` on macOS, `start index.html` on Windows, `xdg-open index.html` on Linux).
Optionally, serve it locally instead:
 
```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```
 
## Features
 
### CPU Scheduling tab
 
- Process input table with **Process ID**, **Arrival Time**, and **Burst Time**
- Add and delete rows, or **Upload CSV**
- Input validation with on-screen error messages (e.g., burst time must be greater than 0, quantum must be a whole number greater than 0)
- Color-coded **Gantt chart** per process, including idle time
- Per-process metrics: Arrival (AT), Burst (BT), Completion (CT), Turnaround (TAT), and Waiting (WT)
- Average TAT and average WT
**Algorithms**
 
| Algorithm | Type | Notes |
|-----------|------|-------|
| FCFS | Non-preemptive | Runs processes in arrival order |
| SJF | Non-preemptive | Picks the shortest burst among arrived processes |
| Round Robin | Preemptive | Requires a time quantum (whole number, at least 1) |
 
**CSV format**
 
The first row is a header; each following row is one process:
 
```csv
Process ID,Arrival,Burst
P1,0,5
P2,2,3
P3,8,2
P4,9,4
```
 
A ready-made example is in `sample/processes.csv`.
 
### Page Replacement tab
 
- Enter a **reference string** (separated by spaces or commas) and a **frame count** (1 to 10)
- Frame-by-frame trace with hits and faults marked
- Totals for page faults and hits, plus fault and hit ratios
- **Compare all** runs the three algorithms side by side on the same input
**Algorithms**
 
| Algorithm | Eviction rule |
|-----------|---------------|
| FIFO | Evicts the page that has been in memory longest |
| LRU | Evicts the least recently used page |
| OPT | Evicts the page whose next use is farthest in the future |
 
Example reference string: `7 0 1 2 0 3 0 4 2 3 0 3 2` with 3 frames.
 
## Command-Line Usage (optional, requires Node.js)
 
Run these from the project root.
 
```bash
node backend_demo.js                     # prints Gantt charts and metrics for sample process sets
node tests/algorithms.test.js            # scheduling algorithm tests
node tests/pagereplacement.test.js       # page replacement tests
```
 
The algorithm modules (`js/algorithms.js`, `js/pagereplacement.js`) work both in the browser and under Node, so the same logic powers the UI, the demo, and the tests.
 
## Project Structure
 
```
cpuschedsim/
├── index.html               # Page layout for both tabs
├── css/
│   └── style.css            # Styling
├── js/
│   ├── algorithms.js        # FCFS, SJF, Round Robin and metric calculations
│   ├── app.js               # Scheduling UI: input table, validation, CSV upload, Gantt chart
│   ├── pagereplacement.js   # FIFO, LRU, OPT logic
│   └── pagingui.js          # Page replacement UI and comparison view
├── sample/
│   └── processes.csv        # Example CSV for upload
├── tests/
│   ├── algorithms.test.js
│   └── pagereplacement.test.js
└── backend_demo.js          # Console demo of the scheduling algorithms
```
 
## Tech Stack
 
- HTML
- CSS
- JavaScript (no frameworks or build tools)
## Task Delegation
 
- **Angel:** UI design, input table, Gantt chart rendering, and input validation
- **Dramayo:** Core algorithm logic (FCFS, SJF, RR), ready queue management, and TAT/WT calculations
- **Both:** Testing the simulator together
## Formulas
 
- Turnaround Time (TAT) = Completion Time − Arrival Time
- Waiting Time (WT) = Turnaround Time − Burst Time
