<div align="center">

# OS Final Project

**An interactive simulator for CPU scheduling, page replacement, and disk scheduling algorithms.**

Enter your input, pick an algorithm, and watch the result unfold as a Gantt chart, a frame-by-frame trace, or a disk head path.

[Quick Start](#quick-start) · [Features](#features) · [Usage](#usage) · [How It Works](#how-it-works) · [Testing](#testing) · [Roadmap](#roadmap)

</div>

---

## Overview

This project helps you see how an operating system makes decisions. It brings three core algorithm topics together in one lightweight web app:

| Tab | What it simulates | Algorithms |
|-----|-------------------|------------|
| **CPU scheduling** | Which process runs next, and for how long | FCFS, SJF, Round Robin |
| **Page replacement** | Which memory page gets evicted when frames are full | FIFO, LRU, Optimal |
| **Disk scheduling** *(in development)* | In what order the disk head serves track requests | FCFS, SSTF, SCAN |

There is nothing to install and nothing to build. It is plain HTML, CSS, and JavaScript that runs entirely in your browser.

*Final term project for CS 3104N (Group 11): designing and implementing three algorithms each for CPU scheduling, page replacement, and disk scheduling.*

## Quick Start

1. Download or clone this repository.
2. Open `index.html` in any modern browser.

```bash
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

Prefer a local server? Either of these works too:

```bash
python3 -m http.server 8000    # then visit http://localhost:8000
```

## Features

### CPU Scheduling

- **Flexible input:** add and delete process rows by hand, or import them with **Upload CSV**
- **Gantt chart:** color-coded per process, with idle time shown explicitly
- **Full metrics:** Arrival (AT), Burst (BT), Completion (CT), Turnaround (TAT), and Waiting (WT) for every process, plus average TAT and WT
- **Clear validation:** problems are flagged on the offending field with a plain-language message

### Page Replacement

- **Frame-by-frame trace:** every reference is shown with its hit or fault clearly marked
- **Summary stats:** total faults, total hits, and fault and hit ratios
- **Compare all:** run FIFO, LRU, and Optimal side by side on the same input

## Usage

### CPU scheduling

1. Fill in the process table (**Process ID**, **Arrival**, **Burst**), or click **Upload CSV**.
2. Choose an algorithm. For Round Robin, also enter a **time quantum**.
3. Run the simulation to see the Gantt chart and metrics table.

**Supported algorithms**

| Algorithm | Type | Behavior |
|-----------|------|----------|
| FCFS | Non-preemptive | Runs processes in order of arrival |
| SJF | Non-preemptive | Runs the shortest burst among arrived processes |
| Round Robin | Preemptive | Gives each process a fixed time slice in rotation |

**CSV format**

Use a header row followed by one process per line. Try the included `sample/processes.csv`.

```csv
Process ID,Arrival,Burst
P1,0,5
P2,2,3
P3,8,2
P4,9,4
```

**Input rules**

- Process IDs must be unique and non-empty. `IDLE` is reserved.
- Arrival time is a whole number, 0 or more.
- Burst time is a whole number greater than 0.
- Time quantum (Round Robin only) is a whole number greater than 0.

### Page replacement

1. Enter a **reference string**, with pages separated by spaces or commas.
2. Set the number of **frames** (1 to 10).
3. Pick an algorithm, or click **Compare all**.

**Supported algorithms**

| Algorithm | Eviction rule |
|-----------|---------------|
| FIFO | Evicts the page that has been in memory the longest |
| LRU | Evicts the page that was used least recently |
| OPT | Evicts the page whose next use is farthest in the future |

**Try this:** reference string `7 0 1 2 0 3 0 4 2 3 0 3 2` with `3` frames.

**Input rules**

- Pages are whole numbers, 0 or more, up to 100 pages per string.
- Frames is a whole number from 1 to 10.

## How It Works

### Metrics

```
Turnaround Time (TAT) = Completion Time − Arrival Time
Waiting Time (WT)     = Turnaround Time − Burst Time
```

### Tie-breaking rules

Results are deterministic, so the same input always gives the same chart.

- **FCFS:** earliest arrival first; ties go to the row listed first.
- **SJF:** shortest burst first, then earliest arrival, then the row listed first.
- **Round Robin:** processes that arrive during a time slice are queued *before* the preempted process is placed back in the queue.
- **Idle time:** when no process has arrived yet, the CPU idles until the next arrival, and the gap appears as `IDLE` on the Gantt chart.

## Testing

Requires [Node.js](https://nodejs.org). Run from the project root:

```bash
node tests/algorithms.test.js          # scheduling algorithms
node tests/pagereplacement.test.js     # page replacement algorithms
node backend_demo.js                   # console demo: Gantt charts and metrics
```

The algorithm modules contain no DOM code and work in both the browser and Node, so the UI, the demo, and the tests all run the same logic.

## Project Structure

```
cpuschedsim/
├── index.html                # Page layout for both tabs
├── css/
│   └── style.css             # Styling
├── js/
│   ├── algorithms.js         # FCFS, SJF, Round Robin, metrics
│   ├── app.js                # Scheduling UI: table, validation, CSV, Gantt
│   ├── pagereplacement.js    # FIFO, LRU, Optimal
│   └── pagingui.js           # Page replacement UI and tab switching
├── sample/
│   └── processes.csv         # Example CSV for upload
├── tests/
│   ├── algorithms.test.js
│   └── pagereplacement.test.js
└── backend_demo.js           # Console demo of the scheduling algorithms
```

## Roadmap

- [x] CPU scheduling: FCFS, SJF, Round Robin
- [x] Page replacement: FIFO, LRU, Optimal
- [ ] **Disk scheduling** *(in development)*: a third tab simulating disk head movement with FCFS, SSTF, and SCAN, showing the head path, total seek distance, and average seek time per request

## Tech Stack

HTML · CSS · JavaScript (no frameworks, no build tools)

## Team

- Jyreneah Angel
- Llewelyn Dramayo
