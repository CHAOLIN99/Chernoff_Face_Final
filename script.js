const faceWidth = 400;
const faceHeight = 400;
let globalMaxValues = {};

document.getElementById('csv-upload').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            const processedData = processCSVData(results.data);
            globalMaxValues = calculateGlobalMax(processedData);
            drawAllFaces(processedData);
            displayTextSummary(processedData);
        },
        error: function(err) {
            console.error('CSV parsing error:', err);
        }
    });
}

function processCSVData(data) {
    const grouped = {};
    data.forEach(row => {
        const date = row.Date;
        const category = row.Category;
        const amount = Math.abs(Number(row.Amount));
        
        if (!grouped[date]) grouped[date] = {};
        grouped[date][category] = (grouped[date][category] || 0) + amount;
    });
    return grouped;
}

function calculateGlobalMax(data) {
    const maxValues = {};
    Object.values(data).forEach(dateData => {
        Object.entries(dateData).forEach(([category, value]) => {
            if (!maxValues[category] || value > maxValues[category]) {
                maxValues[category] = value;
            }
        });
    });
    return maxValues;
}

function drawAllFaces(data) {
    const container = d3.select('#face-container');
    container.selectAll('*').remove();
    
    const dates = Object.keys(data);
    const facesPerRow = Math.floor(container.node().offsetWidth / 130);

    dates.forEach((date, index) => {
        const faceGroup = container.append('div')
            .classed('face-group', true);

        const svg = faceGroup.append('svg')
            .classed('face-svg', true)
            .attr('viewBox', `0 0 ${faceWidth} ${faceHeight}`);

        drawCartoonFace(svg, data[date], date);
        
        faceGroup.append('div')
            .classed('date-label', true)
            .text(date);
    });
}

function drawCartoonFace(svg, dateData, date) {
    const centerX = faceWidth / 2;
    const centerY = faceHeight / 2 + 30;

    // Original face design with dynamic scaling
    const features = {
        faceRY: scaleValue(dateData.Housing, globalMaxValues.Housing, 80, 120),
        eyeRx: scaleValue(dateData.Transport, globalMaxValues.Transport, 8, 16),
        mouthWidth: scaleValue(dateData.Food, globalMaxValues.Food, 40, 80),
        eyebrowY: scaleValue(dateData.Entertainment, globalMaxValues.Entertainment, centerY - 35, centerY - 45)
    };

    // Face shape
    svg.append('ellipse')
        .classed('face', true)
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('rx', 80)
        .attr('ry', features.faceRY);

    // Hair
    const hairPath = [
        { x: centerX - 80, y: centerY - 40 },
        { x: centerX - 85, y: centerY - 80 },
        { x: centerX - 60, y: centerY - 110 },
        { x: centerX, y: centerY - 120 },
        { x: centerX + 60, y: centerY - 110 },
        { x: centerX + 85, y: centerY - 80 },
        { x: centerX + 80, y: centerY - 40 }
    ];
    
    svg.append('path')
        .classed('hair', true)
        .attr('d', d3.line().curve(d3.curveBasisClosed)(hairPath));

    // Eyebrows
    svg.append('path')
        .attr('d', `M${centerX - 45} ${features.eyebrowY} Q${centerX - 30} ${features.eyebrowY - 5}, ${centerX - 15} ${features.eyebrowY}`)
        .attr('stroke', '#000')
        .attr('stroke-width', 2)
        .attr('fill', 'none');

    svg.append('path')
        .attr('d', `M${centerX + 15} ${features.eyebrowY} Q${centerX + 30} ${features.eyebrowY - 5}, ${centerX + 45} ${features.eyebrowY}`)
        .attr('stroke', '#000')
        .attr('stroke-width', 2)
        .attr('fill', 'none');

    // Eyes
    ['left', 'right'].forEach(side => {
        const eyeX = side === 'left' ? centerX - 25 : centerX + 25;
        svg.append('ellipse')
            .classed('eye', true)
            .attr('cx', eyeX)
            .attr('cy', centerY - 20)
            .attr('rx', features.eyeRx)
            .attr('ry', 8);

        svg.append('circle')
            .attr('cx', eyeX)
            .attr('cy', centerY - 20)
            .attr('r', 4)
            .attr('fill', '#000');
    });

    // Nose
    svg.append('path')
        .classed('nose', true)
        .attr('d', `M${centerX} ${centerY - 10} Q${centerX + 8} ${centerY + 10}, ${centerX} ${centerY + 10}`);

    // Mouth
    svg.append('path')
        .classed('mouth', true)
        .attr('d', `M${centerX - features.mouthWidth/2} ${centerY + 35} Q${centerX} ${centerY + 45}, ${centerX + features.mouthWidth/2} ${centerY + 35}`);
}

function scaleValue(value, maxValue, minSize, maxSize) {
    const normalized = (value || 0) / (maxValue || 1);
    return minSize + (maxSize - minSize) * Math.min(normalized, 1);
}

function displayTextSummary(data) {
    const textOutput = d3.select('#extracted-text');
    textOutput.text(JSON.stringify(data, null, 2));
}