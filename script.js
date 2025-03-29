const faceWidth = 400;
const faceHeight = 400;
let globalMaxValues = {};
const categories = ['Grocery', 'Transportation', 'Go out to eat', 'Tithing'];

document.getElementById('csv-upload').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        dynamicTyping: false,
        complete: function(results) {
            const processedData = processCSVData(results.data);
            globalMaxValues = calculateGlobalMax(processedData);
            drawAllFaces(processedData);
            initHoverTooltip();
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
        const rawDate = row.Date.replace(/(\d{2})\/(\d{2})(\d{4})/, "$1/$2/$3"); // Fix date format
        const date = new Date(rawDate).toLocaleDateString('en-US') || rawDate;
        const category = row.Category.trim();
        const amount = parseFloat(row.Amount.replace(/[^0-9.]/g, '')) || 0;

        if (!grouped[date]) {
            grouped[date] = { date };
            categories.forEach(cat => grouped[date][cat] = 0);
        }
        
        if (categories.includes(category)) {
            grouped[date][category] += amount;
        }
    });
    return grouped;
}

function calculateGlobalMax(data) {
    const maxValues = {};
    Object.values(data).forEach(dateData => {
        categories.forEach(category => {
            const value = dateData[category];
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
    
    Object.entries(data).forEach(([date, dateData]) => {
        const faceGroup = container.append('div')
            .classed('face-group', true)
            .attr('data-date', date)
            .attr('data-categories', JSON.stringify(dateData));

        const svg = faceGroup.append('svg')
            .classed('face-svg', true)
            .attr('viewBox', `0 0 ${faceWidth} ${faceHeight}`);

        drawCartoonFace(svg, dateData);
        faceGroup.append('div').classed('date-label', true).text(date);
    });
}

function drawCartoonFace(svg, dateData) {
    const centerX = faceWidth / 2;
    const centerY = faceHeight / 2 + 30;

    const features = {
        faceRY: scaleValue(dateData.Grocery, globalMaxValues.Grocery, 80, 120),
        eyeRx: scaleValue(dateData.Transportation, globalMaxValues.Transportation, 8, 16),
        mouthWidth: scaleValue(dateData['Go out to eat'], globalMaxValues['Go out to eat'], 40, 80),
        eyebrowY: scaleValue(dateData.Tithing, globalMaxValues.Tithing, centerY - 35, centerY - 45)
    };

    // Face base
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

function initHoverTooltip() {
    const tooltip = d3.select('body').append('div')
        .attr('id', 'category-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', '#fff')
        .style('border-radius', '8px')
        .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)')
        .style('padding', '1rem')
        .style('pointer-events', 'none');

    d3.selectAll('.face-group')
        .on('mouseover', function(event, d) {
            const data = JSON.parse(d3.select(this).attr('data-categories'));
            tooltip.transition().duration(200).style('opacity', 1);
            
            const tooltipHtml = `
                <div class="tooltip-header">${data.date}</div>
                ${categories.map(cat => `
                    <div class="tooltip-row">
                        <span class="category">${cat}:</span>
                        <span class="amount">$${data[cat].toFixed(2)}</span>
                    </div>
                `).join('')}
            `;

            tooltip.html(tooltipHtml)
                .style('left', `${event.pageX + 15}px`)
                .style('top', `${event.pageY + 15}px`);
        })
        .on('mousemove', function(event) {
            tooltip.style('left', `${event.pageX + 15}px`)
                  .style('top', `${event.pageY + 15}px`);
        })
        .on('mouseout', function() {
            tooltip.transition().duration(200).style('opacity', 0);
        });
}

function scaleValue(value, maxValue, minSize, maxSize) {
    const normalized = (value || 0) / (maxValue || 1);
    return Math.min(minSize + (maxSize - minSize) * normalized, maxSize);
}

function displayTextSummary(data) {
    const textOutput = d3.select('#extracted-text');
    const summary = Object.entries(data).map(([date, categories]) => 
        `${date}:\n${Object.entries(categories).map(([k, v]) => `  ${k}: $${v.toFixed(2)}`).join('\n')}`
    ).join('\n\n');
    textOutput.text(summary);
}