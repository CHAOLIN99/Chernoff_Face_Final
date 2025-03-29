// Main JS: draws a face with D3, parses a PDF, and updates face based on PDF data.

// 1. D3 Setup
const svg = d3.select("#face-svg");
const width = +svg.attr("width");
const height = +svg.attr("height");
const centerX = width / 2;
const centerY = height / 2;

// Draw initial face (neutral data)
drawCartoonFace({ balance: 0 });

// 2. PDF Parsing
const fileInput = document.getElementById("pdf-upload");
fileInput.addEventListener("change", handleFileUpload);

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Use FileReader to get file as ArrayBuffer
  const fileReader = new FileReader();
  fileReader.onload = async function(e) {
    const arrayBuffer = e.target.result;
    // Parse PDF with PDF.js
    const pdfData = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    let fullText = "";
    // Extract text from each page
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      // Join all strings on this page
      const pageText = textContent.items.map(item => item.str).join(" ");
      fullText += pageText + "\n";
    }

    // Display extracted text (for demo)
    document.getElementById("extracted-text").textContent = fullText;

    // Digest the PDF text and derive some numeric data
    const data = digestPdfText(fullText);
    // Redraw the face with new data
    drawCartoonFace(data);
  };
  fileReader.readAsArrayBuffer(file);
}

/**
 * A mock function that parses the PDF text for a "Balance:" entry
 * and returns an object with relevant numeric data for the face.
 */
function digestPdfText(text) {
  // Simple regex to find "Balance: ###.##" pattern
  // This is just an example; real bank statements might need more complex logic.
  const balanceRegex = /Balance:\s*([\d,\.]+)/i;
  const match = text.match(balanceRegex);
  let balanceValue = 0;
  if (match && match[1]) {
    // Convert to a float
    balanceValue = parseFloat(match[1].replace(/,/g, ""));
  }

  // Return an object that can be used to adjust the face
  // For demonstration, we just pass the numeric balance.
  // You might map multiple fields (e.g., total deposits, total withdrawals).
  return { balance: balanceValue };
}

/**
 * Draw or update the face based on data.
 * For demonstration, we map 'balance' to a few face parameters:
 * - The bigger the balance, the bigger the smile.
 * - The bigger the balance, the more 'happy' the eyebrows.
 */
function drawCartoonFace({ balance }) {
  // Clear any existing shapes
  svg.selectAll("*").remove();

  // Scale balance to a range for the mouth curvature and brow angle
  // E.g., clamp between -0.5 (frown) and 0.5 (smile)
  const maxBalance = 5000; // hypothetical scale
  const scaledValue = Math.max(-0.5, Math.min(balance / maxBalance, 0.5));

  // 1. Face Outline
  const faceOutline = [
    { x: centerX - 80, y: centerY - 90 },
    { x: centerX - 70, y: centerY + 80 },
    { x: centerX + 70, y: centerY + 80 },
    { x: centerX + 80, y: centerY - 90 }
  ];
  const faceLine = d3.line()
    .curve(d3.curveBasisClosed)
    .x(d => d.x)
    .y(d => d.y);

  svg.append("path")
    .datum(faceOutline)
    .attr("class", "face")
    .attr("d", faceLine);

  // 2. Hair
  const hairPath = [
    { x: centerX - 80, y: centerY - 90 },
    { x: centerX - 60, y: centerY - 130 },
    { x: centerX,      y: centerY - 150 },
    { x: centerX + 60, y: centerY - 130 },
    { x: centerX + 80, y: centerY - 90 },
    { x: centerX + 80, y: centerY - 90 }
  ];
  const hairLine = d3.line()
    .curve(d3.curveBasisClosed)
    .x(d => d.x)
    .y(d => d.y);

  svg.append("path")
    .datum(hairPath)
    .attr("class", "hair")
    .attr("d", hairLine);

  // 3. Eyes
  svg.append("circle")
    .attr("cx", centerX - 30)
    .attr("cy", centerY - 20)
    .attr("r", 10)
    .attr("class", "eye");

  svg.append("circle")
    .attr("cx", centerX + 30)
    .attr("cy", centerY - 20)
    .attr("r", 10)
    .attr("class", "eye");

  // 4. Eyebrows
  // We'll tilt eyebrows up/down based on scaledValue.
  const eyebrowOffset = scaledValue * 10; // positive => eyebrows up

  svg.append("line")
    .attr("x1", centerX - 45)
    .attr("y1", centerY - 40 + eyebrowOffset)
    .attr("x2", centerX - 15)
    .attr("y2", centerY - 45 + eyebrowOffset)
    .attr("stroke", "#000")
    .attr("stroke-width", 3);

  svg.append("line")
    .attr("x1", centerX + 15)
    .attr("y1", centerY - 45 + eyebrowOffset)
    .attr("x2", centerX + 45)
    .attr("y2", centerY - 40 + eyebrowOffset)
    .attr("stroke", "#000")
    .attr("stroke-width", 3);

  // 5. Nose
  const nosePath = d3.path();
  nosePath.moveTo(centerX, centerY - 5);
  nosePath.lineTo(centerX - 5, centerY + 10);
  nosePath.lineTo(centerX + 5, centerY + 10);
  nosePath.closePath();

  svg.append("path")
    .attr("d", nosePath.toString())
    .attr("class", "nose");

  // 6. Mouth
  // Quadratic curve from left to right. The control point's Y offset is
  // influenced by scaledValue to show a smile/frown.
  const mouth = d3.path();
  mouth.moveTo(centerX - 30, centerY + 40);
  mouth.quadraticCurveTo(
    centerX,
    centerY + 40 + (scaledValue * 30), // control point
    centerX + 30,
    centerY + 40
  );

  svg.append("path")
    .attr("d", mouth.toString())
    .attr("class", "mouth");
}
