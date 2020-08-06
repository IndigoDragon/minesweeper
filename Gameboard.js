class Gameboard {
    initialised = false;
    cells = [];

    constructor(level) {
        switch (level) {
            case 1: this.setup(10, 10, 20); break;
            case 2: this.setup(16, 16, 40); break;
            default: this.setup(30, 16, 99); break;
        }
    }

    setup(width, height, bombCount) {
        this.width = width;
        this.height = height;
        this.bombCount = bombCount;
    }

    /// <summary>
    /// Create the gameboard with bombs distrubuted randomly throughout the board.
    /// </summary>
    initialize() {
        this.initialised = true;

        const mineCells = Array(this.bombCount);
        for (let i = 0; i < mineCells.length; i++) {
            mineCells[i] = new GameboardCell();
            mineCells[i].mined = true;
        }

        const emptyCells = Array(this.width * this.height - mineCells.length);
        for (let i = 0; i < emptyCells.length; i++) {
            emptyCells[i] = new GameboardCell();
        }

        this.cells = shuffle(emptyCells.concat(mineCells));

        // For each safe cell, starting from the north west, count the number of
        // bombs in the cell's adjacent cells.
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i].adjacentMineCount = this.getAdjacentCellIndexes(i).filter(ai => this.cells[ai].mined).length;
        }

        return this.board;
    }

    /// <summary>
    /// Returns the index of each cell that is adjacent to the cell at the specified index.
    /// </summary>
    getAdjacentCellIndexes(index) {
        const isLeftEdge = (index % this.width === 0);
        const isRightEdge = (index % this.width === this.width - 1);
        let indexes = [];
        if (index >= this.width) {
            if (!isLeftEdge) {
                indexes.push(index - this.width - 1);
            }
            indexes.push(index - this.width);
            if (!isRightEdge) {
                indexes.push(index - this.width + 1);
            }
        }
        if (!isRightEdge) {
            indexes.push(index + 1);
        }
        if (index < this.width * this.height - this.width) {
            if (!isRightEdge) {
                indexes.push(index + this.width + 1);
            }
            indexes.push(index + this.width);
            if (!isLeftEdge) {
                indexes.push(index + this.width - 1);
            }
        }
        if (!isLeftEdge) {
            indexes.push(index - 1);
        }
        return indexes;
    }

    getUsedFlagCount() {
        return this.cells.filter(cell => cell.flagged).length;
    }
}

/// <summary>
/// Fisher–Yates Shuffle
/// </summary>
function shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex !== 0) {
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        let temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}