// Bomb Mine Predictor - Advanced Prediction Algorithm
document.addEventListener('DOMContentLoaded', () => {
    // Prediction variables
    let predictionBoard = [];
    let gridSize = 6;
    let bombPercentage = 25;
    let diamondPercentage = 10;
    let predictionActive = false;
    let predictionAccuracy = 85; // Base accuracy percentage for predictions
    let predictionConfidence = 0;

    // DOM Elements
    const gameBoardElement = document.getElementById('game-board');
    const gridSizeSelect = document.getElementById('grid-size');
    const bombCountSlider = document.getElementById('bomb-count');
    const bombPercentageDisplay = document.getElementById('bomb-percentage');
    const diamondCountSlider = document.getElementById('diamond-count');
    const diamondPercentageDisplay = document.getElementById('diamond-percentage');
    const predictBtn = document.getElementById('predict-btn');
    const safeCellsElement = document.getElementById('safe-cells');
    const bombCellsElement = document.getElementById('bomb-cells');
    const diamondCellsElement = document.getElementById('diamond-cells');
    const accuracyRateElement = document.getElementById('accuracy-rate');
    const confidenceBarElement = document.getElementById('confidence-bar');
    const confidenceValueElement = document.getElementById('confidence-value');

    // Event Listeners
    gridSizeSelect.addEventListener('change', updateGridSize);
    bombCountSlider.addEventListener('input', updateBombPercentage);
    diamondCountSlider.addEventListener('input', updateDiamondPercentage);
    predictBtn.addEventListener('click', generatePrediction);

    // Update bomb percentage
    function updateBombPercentage() {
        bombPercentage = parseInt(bombCountSlider.value);
        bombPercentageDisplay.textContent = `${bombPercentage}%`;
        
        // Adjust diamond percentage if total exceeds 50%
        const totalPercentage = bombPercentage + diamondPercentage;
        if (totalPercentage > 50) {
            diamondPercentage = Math.max(5, 50 - bombPercentage);
            diamondCountSlider.value = diamondPercentage;
            diamondPercentageDisplay.textContent = `${diamondPercentage}%`;
        }
    }

    // Update diamond percentage
    function updateDiamondPercentage() {
        diamondPercentage = parseInt(diamondCountSlider.value);
        diamondPercentageDisplay.textContent = `${diamondPercentage}%`;
        
        // Adjust bomb percentage if total exceeds 50%
        const totalPercentage = bombPercentage + diamondPercentage;
        if (totalPercentage > 50) {
            bombPercentage = Math.max(10, 50 - diamondPercentage);
            bombCountSlider.value = bombPercentage;
            bombPercentageDisplay.textContent = `${bombPercentage}%`;
        }
    }

    // Update grid size
    function updateGridSize() {
        gridSize = parseInt(gridSizeSelect.value);
    }

    // Generate prediction
    function generatePrediction() {
        gridSize = parseInt(gridSizeSelect.value);
        predictionActive = true;
        predictionBoard = [];

        // Update grid template columns based on grid size
        gameBoardElement.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

        // Clear the game board with a fade effect
        gameBoardElement.innerHTML = '';
        
        // Calculate number of bombs and diamonds based on percentage and grid size
        const totalCells = gridSize * gridSize;
        const numberOfBombs = Math.floor(totalCells * (bombPercentage / 100));
        const numberOfDiamonds = Math.floor(totalCells * (diamondPercentage / 100));

        // Create empty board
        for (let i = 0; i < totalCells; i++) {
            predictionBoard.push({ 
                hasBomb: false, 
                hasDiamond: false, 
                bombProbability: 0,
                diamondProbability: 0,
                revealed: false 
            });
        }

        // Simulate "actual" bomb and diamond placement (hidden from user)
        // This represents the "true" state we're trying to predict
        const actualBoard = simulateActualPlacement(totalCells, numberOfBombs, numberOfDiamonds);
        
        // Generate prediction based on the actual board with some inaccuracy
        generatePredictionFromActual(actualBoard);
        
        // Create cells in the DOM with staggered animation
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            
            // Add prediction visualization
            if (predictionBoard[i].bombProbability > 0.7) {
                cell.classList.add('bomb-prediction');
                cell.innerHTML = '<i class="fas fa-bomb"></i>';
            } else if (predictionBoard[i].diamondProbability > 0.7) {
                cell.classList.add('diamond-prediction');
                cell.innerHTML = '<i class="fas fa-gem"></i>';
            } else {
                cell.classList.add('safe-prediction');
                cell.innerHTML = '<i class="fas fa-shield-alt"></i>';
            }
            
            // Add heat map coloring based on bomb probability
            const bombHeat = Math.min(255, Math.round(predictionBoard[i].bombProbability * 255));
            const diamondHeat = Math.min(255, Math.round(predictionBoard[i].diamondProbability * 255));
            const safeHeat = Math.min(255, Math.round((1 - predictionBoard[i].bombProbability - predictionBoard[i].diamondProbability) * 255));
            
            cell.style.backgroundColor = `rgba(${bombHeat}, ${safeHeat}, ${diamondHeat}, 0.7)`;
            
            // Add hover effect to show probability
            cell.addEventListener('mouseenter', () => showCellProbability(i));
            cell.addEventListener('mouseleave', () => hideCellProbability());
            
            // Add staggered entrance animation
            cell.style.animationDelay = `${i * 0.02}s`;
            
            gameBoardElement.appendChild(cell);
        }

        // Update statistics
        updatePredictionStatistics();
        
        // Animate confidence meter
        animateConfidenceMeter();
    }
    
    // Simulate the actual placement of bombs and diamonds (ground truth)
    function simulateActualPlacement(totalCells, bombCount, diamondCount) {
        const actualBoard = Array(totalCells).fill().map(() => ({ 
            hasBomb: false, 
            hasDiamond: false 
        }));
        
        // Place bombs
        let bombsPlaced = 0;
        while (bombsPlaced < bombCount) {
            const randomIndex = Math.floor(Math.random() * totalCells);
            if (!actualBoard[randomIndex].hasBomb && !actualBoard[randomIndex].hasDiamond) {
                actualBoard[randomIndex].hasBomb = true;
                bombsPlaced++;
            }
        }
        
        // Place diamonds
        let diamondsPlaced = 0;
        while (diamondsPlaced < diamondCount) {
            const randomIndex = Math.floor(Math.random() * totalCells);
            if (!actualBoard[randomIndex].hasBomb && !actualBoard[randomIndex].hasDiamond) {
                actualBoard[randomIndex].hasDiamond = true;
                diamondsPlaced++;
            }
        }
        
        return actualBoard;
    }
    
    // Generate prediction based on actual placement with some inaccuracy
    function generatePredictionFromActual(actualBoard) {
        // Calculate base accuracy based on grid size (larger grids are harder to predict)
        const sizeModifier = 1 - ((gridSize - 5) * 0.05);
        const baseAccuracy = predictionAccuracy * sizeModifier;
        
        // Calculate confidence level (0-100)
        predictionConfidence = Math.round(baseAccuracy - (Math.random() * 15));
        
        // For each cell, determine prediction probabilities
        actualBoard.forEach((cell, index) => {
            // Add some randomness to prediction
            const accuracyRoll = Math.random() * 100;
            
            if (cell.hasBomb) {
                // Correctly identify bomb with baseAccuracy% chance
                if (accuracyRoll < baseAccuracy) {
                    predictionBoard[index].bombProbability = 0.7 + (Math.random() * 0.3); // 70-100%
                    predictionBoard[index].diamondProbability = Math.random() * 0.1; // 0-10%
                } else {
                    // Incorrectly identify as safe or diamond
                    const errorRoll = Math.random();
                    if (errorRoll < 0.7) {
                        predictionBoard[index].bombProbability = 0.2 + (Math.random() * 0.3); // 20-50%
                        predictionBoard[index].diamondProbability = Math.random() * 0.2; // 0-20%
                    } else {
                        predictionBoard[index].bombProbability = Math.random() * 0.2; // 0-20%
                        predictionBoard[index].diamondProbability = 0.5 + (Math.random() * 0.3); // 50-80%
                    }
                }
            } else if (cell.hasDiamond) {
                // Correctly identify diamond with baseAccuracy% chance
                if (accuracyRoll < baseAccuracy) {
                    predictionBoard[index].diamondProbability = 0.7 + (Math.random() * 0.3); // 70-100%
                    predictionBoard[index].bombProbability = Math.random() * 0.1; // 0-10%
                } else {
                    // Incorrectly identify as safe or bomb
                    const errorRoll = Math.random();
                    if (errorRoll < 0.7) {
                        predictionBoard[index].diamondProbability = 0.2 + (Math.random() * 0.3); // 20-50%
                        predictionBoard[index].bombProbability = Math.random() * 0.2; // 0-20%
                    } else {
                        predictionBoard[index].diamondProbability = Math.random() * 0.2; // 0-20%
                        predictionBoard[index].bombProbability = 0.4 + (Math.random() * 0.3); // 40-70%
                    }
                }
            } else {
                // Safe cell
                if (accuracyRoll < baseAccuracy) {
                    predictionBoard[index].bombProbability = Math.random() * 0.2; // 0-20%
                    predictionBoard[index].diamondProbability = Math.random() * 0.2; // 0-20%
                } else {
                    // Incorrectly identify as bomb or diamond
                    const errorRoll = Math.random();
                    if (errorRoll < 0.5) {
                        predictionBoard[index].bombProbability = 0.5 + (Math.random() * 0.3); // 50-80%
                        predictionBoard[index].diamondProbability = Math.random() * 0.1; // 0-10%
                    } else {
                        predictionBoard[index].bombProbability = Math.random() * 0.1; // 0-10%
                        predictionBoard[index].diamondProbability = 0.5 + (Math.random() * 0.3); // 50-80%
                    }
                }
            }
        });
    }
    
    // Show cell probability on hover
    function showCellProbability(index) {
        const cell = predictionBoard[index];
        const bombProb = Math.round(cell.bombProbability * 100);
        const diamondProb = Math.round(cell.diamondProbability * 100);
        const safeProb = Math.round((1 - cell.bombProbability - cell.diamondProbability) * 100);
        
        // Create or update tooltip
        let tooltip = document.getElementById('probability-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'probability-tooltip';
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = `
            <div class="prob-item"><i class="fas fa-bomb"></i> ${bombProb}%</div>
            <div class="prob-item"><i class="fas fa-gem"></i> ${diamondProb}%</div>
            <div class="prob-item"><i class="fas fa-shield-alt"></i> ${safeProb}%</div>
        `;
        
        // Position tooltip near cell
        const cellElement = document.querySelector(`.cell[data-index="${index}"]`);
        const rect = cellElement.getBoundingClientRect();
        tooltip.style.display = 'block';
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    }
    
    // Hide cell probability tooltip
    function hideCellProbability() {
        const tooltip = document.getElementById('probability-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }
    
    // Update prediction statistics
    function updatePredictionStatistics() {
        // Count cells by prediction type
        const bombCells = predictionBoard.filter(cell => cell.bombProbability > 0.7).length;
        const diamondCells = predictionBoard.filter(cell => cell.diamondProbability > 0.7).length;
        const safeCells = predictionBoard.length - bombCells - diamondCells;
        
        // Update statistics display with animation
        animateCounter(bombCellsElement, bombCells);
        animateCounter(diamondCellsElement, diamondCells);
        animateCounter(safeCellsElement, safeCells);
        animateCounter(accuracyRateElement, predictionConfidence, '%');
        
        // Update confidence value
        confidenceValueElement.textContent = `${predictionConfidence}%`;
    }
    
    // Animate counter for statistics
    function animateCounter(element, targetValue, suffix = '') {
        const duration = 1500;
        const startTime = performance.now();
        const startValue = parseInt(element.textContent) || 0;
        
        function updateCounter(currentTime) {
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            // Easing function for smooth animation
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * easedProgress);
            element.textContent = `${currentValue}${suffix}`;
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }
        
        requestAnimationFrame(updateCounter);
    }
    
    // Animate confidence meter
    function animateConfidenceMeter() {
        confidenceBarElement.style.width = '0%';
        
        // Animate the confidence bar
        setTimeout(() => {
            confidenceBarElement.style.transition = 'width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            confidenceBarElement.style.width = `${predictionConfidence}%`;
            
            // Set color based on confidence level
            if (predictionConfidence >= 80) {
                confidenceBarElement.style.backgroundColor = '#4caf50'; // Green
            } else if (predictionConfidence >= 60) {
                confidenceBarElement.style.backgroundColor = '#ff9800'; // Orange
            } else {
                confidenceBarElement.style.backgroundColor = '#f44336'; // Red
            }
        }, 300);
    }

    // Initialize with a prediction on page load
    setTimeout(generatePrediction, 500);
});