const faceWidth = 400;
const faceHeight = 400;
let globalMaxValues = {};

document.getElementById('csv-upload').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
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
        const amount = parseFloat((row.Amount || '0').replace(/[^0-9.]/g, '')) || 0;
        
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

    // Category to feature mapping
    const categories = {
        Grocery: dateData.Grocery || 0,
        Transportation: dateData.Transportation || 0,
        'Go out to eat': dateData['Go out to eat'] || 0,
        Tithing: dateData.Tithing || 0
    };

    const features = {
        faceRY: scaleValue(categories.Grocery, globalMaxValues.Grocery, 80, 120),
        eyeRx: scaleValue(categories.Transportation, globalMaxValues.Transportation, 8, 16),
        mouthWidth: scaleValue(categories['Go out to eat'], globalMaxValues['Go out to eat'], 40, 80),
        eyebrowY: scaleValue(categories.Tithing, globalMaxValues.Tithing, centerY - 35, centerY - 45)
    };

    // Face shape (Grocery)
    svg.append('ellipse')
        .classed('face', true)
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('rx', 80)
        .attr('ry', features.faceRY);

    // Hair (fixed element)
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

    // Eyebrows (Tithing)
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

    // Eyes (Transportation)
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

    // Nose (fixed element)
    svg.append('path')
        .classed('nose', true)
        .attr('d', `M${centerX} ${centerY - 10} Q${centerX + 8} ${centerY + 10}, ${centerX} ${centerY + 10}`);

    // Mouth (Go out to eat)
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