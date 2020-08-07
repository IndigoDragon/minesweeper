let isGameOver = false;
let isNewGame = true;
let difficultyLevel = 1;
let gameboard = new Gameboard();
let startTime = null;

document.addEventListener('DOMContentLoaded', () => {
    newGame();
});

function newGame() {
    gameboard = new Gameboard(difficultyLevel);
    renderBoard();
    isNewGame = true;
    isGameOver = false;
    hideResult();
}

/// <summary>
/// Renders the gameboard in the brower ready for the game to commence.
/// </summary>
function renderBoard() {

    // The size of the board and grid increases with difficultly.
    const outerContainer = document.getElementById("outerContainer");
    outerContainer.style.width = gameboard.width * 40 + 50 + "px";
    const grid = document.querySelector('.grid');
    grid.style.width = gameboard.width * 40 + "px";
    grid.style.height = gameboard.height * 40 +"px";

    // Render the board. At this point we don't know the location of
    // the mines. There position will be determined when the player
    // first clicks on the gameboard so we can ensure they don't hit
    // a mine on their first click.
    grid.innerHTML = "";
    for (let i = 0; i < gameboard.width * gameboard.height; i++) {
        const cell = document.createElement("div");
        cell.setAttribute("id", i);
        cell.classList.add("cell");
        cell.classList.add("empty");
        cell.addEventListener("click", function (e) { click(cell) });
        cell.oncontextmenu = function (e) {
            e.preventDefault();
            flag(cell);
        };
        grid.appendChild(cell);
    }

    updateRemainingFlagsCount(gameboard.bombCount);
    renderTimerValue(0);

    facePanel.innerText = "😐";
}

function updateRemainingFlagsCount(value) {
    let flagsRemainingElement = document.getElementById("remainingFlagsCount");
    flagsRemainingElement.innerText = (value + "").padStart(2, "0");
}

/// <summary>
/// Responds to the left mouse button being clicked while over a cell.
/// </summary>
function click(cell) {
    if (isGameOver) {
        return;
    }

    // Show face with open mouth.
    const facePanel = document.getElementById("facePanel");
    facePanel.innerText = "😮";

    let index = parseInt(cell.id);

    // Ensure player gets an "auto" reveal on their first go.
    if (isNewGame) {
        do {
            gameboard.initialize();
        } while (gameboard.cells[index].mined || gameboard.cells[index].adjacentMineCount !== 0);
        isNewGame = false;
        startTime = Math.floor(Date.now() / 1000);
        updateTimer();
    }

    if (gameboard.cells[index].mined) {
        if (!gameboard.cells[index].flagged) {
            gameOver(cell);
            facePanel.innerText = "😧";

        }
    }
    else {
        revealCell(cell);
        if (isWon()) {
            showResult("You win");
            facePanel.innerText = "😎";
        }
    }

    if (facePanel.innerText === "😮") {
        setTimeout(() => facePanel.innerText = "😐", 250);
    }
}

/// <summary>
/// Returns a value that specifies whether the game is won.
/// </summary>
function isWon() {
    let count = gameboard.cells.filter(cell => cell.revealed && !cell.mined).length;
    return count === (gameboard.cells.length - gameboard.bombCount);
}

/// <summary>
/// Responds to the right mouse button being clicked while over a cell by
/// putting a flag in the cell, or removing a flag if one is already present.
/// </summary>
function flag(cell) {

    if (isGameOver || !gameboard.initialised) {
        return;
    }

    let index = parseInt(cell.id);

    if (gameboard.cells[index].revealed) {
        return;
    }

    let flagCount = gameboard.getUsedFlagCount();

    if (gameboard.cells[index].flagged) {
        gameboard.cells[index].flagged = false;
        flagCount--;
        cell.innerText = "";
    }
    else if (flagCount < gameboard.bombCount) {
        gameboard.cells[index].flagged = true;
        cell.innerText = "🚩";
        flagCount++;
    }

    updateRemainingFlagsCount(gameboard.bombCount - flagCount);

    if (isWon()) {
        showResult("You win");
    }
}


/// <summary>
/// Reveals the specified cell.
/// </summary>
function revealCell(cell) {

    let index = parseInt(cell.id);

    if (gameboard.cells[index].revealed || gameboard.cells[index].flagged) {
        return;
    }

    gameboard.cells[index].revealed = true;

    // Change formatting of the cell to show that it's been clicked.
    cell.classList.remove("empty");
    cell.classList.add("revealedCell");
    drawCellSeparators(cell);

    if (gameboard.cells[index].triggered) {
        // Reveal a deternated mine in response to the player clicking on a mine.
        cell.appendChild(createMineImage("red"));
    }
    else if (gameboard.cells[index].mined) {
        // Reveal an undeternated mine (position of all mines revealed at game end).
        cell.appendChild(createMineImage("grey"));
    }
    else if (gameboard.cells[index].adjacentMineCount === 0) {
        // Empty cell surrounded by empty cells.
        // Recusively reveal the cell and it's empty surrounding cells.
        setTimeout(() => {
            gameboard.getAdjacentCellIndexes(index).forEach(adjacentIndex => {
                if (!gameboard.cells[adjacentIndex].mined) {
                    let adjacentCell = document.getElementById(adjacentIndex);
                    revealCell(adjacentCell);
                }
            });
        }, 10);
    }
    else {
        // Empty cell surrounded by one or more mines.
        // Reveal the number of mines in adjacent cells.
        const span = document.createElement("span");
        span.innerHTML = gameboard.cells[index].adjacentMineCount;
        span.classList.add("number" + gameboard.cells[index].adjacentMineCount);
        cell.appendChild(span);
    }
}

function createMineImage(colour) {
    const image = document.createElement("img");
    image.setAttribute("alt", "mine");
    image.setAttribute("src", (colour === "red" ? "red-mine.png" : "grey-mine.png"));
    image.classList.add("revealedAsset");
    return image;
}

/// <summary>
/// Draws lines that separate the specified cell and the cells adjacent
/// to it (north, east, south and west) that have already been cleared.
/// </summary>
function drawCellSeparators(cell) {
    let cellIndex = parseInt(cell.id);

    // Draw line between the cell and the one below it, if needed.
    let cellBelowIndex = cellIndex + gameboard.width;
    if (cellBelowIndex < gameboard.cells.length && gameboard.cells[cellBelowIndex].revealed) {
        document.getElementById(cellBelowIndex).classList.add("revealedCellTopBorder");
    }

    // Draw line between the cell and the one the left, if needed.
    const isLeftEdge = (cellIndex % gameboard.width === 0);
    if (!isLeftEdge) {
        let leftCellIndex = cellIndex - 1;
        if (gameboard.cells[leftCellIndex].revealed) {
            document.getElementById(leftCellIndex).classList.add("revealedCellRightBorder");
        }
    }

    // Draw line between the cell and the one above it, if needed.
    let cellAboveIndex = cellIndex - gameboard.width;
    if (cellAboveIndex >= 0 && gameboard.cells[cellAboveIndex].revealed) {
        cell.classList.add("revealedCellTopBorder");
    }

    // Draw line between the cell and the one to the right, if needed.
    const isRightEdge = (cellIndex % gameboard.width === gameboard.width - 1);
    if (!isRightEdge) {
        let rightCellIndex = cellIndex + 1;
        if (gameboard.cells[rightCellIndex].revealed) {
            cell.classList.add("revealedCellRightBorder");
        }
    }
}

/// <summary>
/// Game over. Reveal position of each bomb.
/// </summary>
function gameOver(cell) {
    isGameOver = true;

    // Reveal the mine the player triggered.
    let cellIndex = parseInt(cell.id);
    gameboard.cells[cellIndex].triggered = true;
    revealCell(cell);

    // Reveal incorrect flags.
    for (let i = 0; i < gameboard.cells.length; i++) {
        if (gameboard.cells[i].flagged && !gameboard.cells[i].mined) {
            const flaggedCell = document.getElementById(i);
            const cross = document.createElement("img");
            cross.setAttribute("src", "red-cross.png");
            cross.style.position = "absolute";
            flaggedCell.appendChild(cross);
        }
    }

    // Slowly reveal remaining mines.
    let mineCount = 1;
    for (let i = 0; i < gameboard.cells.length; i++) {
        if (gameboard.cells[i].mined && !gameboard.cells[i].flagged) {
            setTimeout(() => {
                // Skip reveal if player has requested a new game.
                if (!isNewGame) revealCell(document.getElementById(i));
            }, 20 * mineCount++);
        }
    }

    showResult("You lose");
}


function showResult(result) {
    const element = document.getElementById("result");
    const grid = document.querySelector(".grid");
    element.innerText = result;
    element.style.display = "flex";
    element.style.width = grid.style.width;
    element.style.height = grid.style.height;
}

function hideResult() {
    let element = document.getElementById("result");
    element.innerText = "";
    element.style.display = "none";
}

function decreaseDifficultyLevel() {
    if (difficultyLevel > 1) {
        difficultyLevel--;
        displayDifficultyLevel();
    }
}

function increaseDifficultyLevel() {
    if (difficultyLevel < 3) {
        difficultyLevel++;
        displayDifficultyLevel();
    }
}

function displayDifficultyLevel() {
    let label = document.getElementById("difficultyText");
    switch (difficultyLevel) {
        case 1: label.innerText = "Easy"; break;
        case 2: label.innerText = "Medium"; break;
        case 3: label.innerText = "Hard"; break;
    }
}

function calculateTimerValue() {

    document.getElementById("idName").innerHTML = m + ":" + s; // update the element where the timer will appear
    var t = setTimeout(startTimeCounter, 500); // set a timeout to update the timer
}

function updateTimer() {
    if (!isGameOver && !isNewGame && !isWon()) {
        const duration = Math.floor(Date.now() / 1000) - startTime;
        if (duration > 0) {
            renderTimerValue(duration);
        }
        if (duration < 999) {
            setTimeout(() => updateTimer(), 1000);
        }
    }
}

function renderTimerValue(duration) {
    let durationString = "";
    if (duration > 0) {
        durationString += duration;
    }
    const timerValueElement = document.getElementById("timerValue");
    timerValueElement.innerText = durationString.padStart(3, "0");
}