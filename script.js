const svg = d3.select("#face-svg");
const viewBox = { width: 400, height: 400 };
const centerX = viewBox.width / 2;
const centerY = viewBox.height / 2 + 30;

// Initial face
svg.selectAll("*").remove();
drawCartoonFace({ balance: 0 });

// PDF Handling
document.getElementById("pdf-upload").addEventListener("change", handleFileUpload);

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileReader = new FileReader();
  fileReader.onload = async function(e) {
    const pdfData = new Uint8Array(e.target.result);
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    
    let fullText = "";
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(" ") + "\n";
    }
    
    document.getElementById("extracted-text").textContent = fullText;
    drawCartoonFace(digestPdfText(fullText));
  };
  fileReader.readAsArrayBuffer(file);
}

function digestPdfText(text) {
  const balanceRegex = /Balance:\s*([\d,\.]+)/i;
  const match = text.match(balanceRegex);
  let balanceValue = match && match[1] ? parseFloat(match[1].replace(/,/g, "")) : 0;
  return { balance: balanceValue };
}

function drawCartoonFace({ balance }) {
  svg.selectAll("*").remove();
  const maxBalance = 5000;
  const scaledValue = Math.max(-0.5, Math.min(balance / maxBalance, 0.5));

  // Face Outline
  const faceOutline = [
    { x: centerX - 80, y: centerY - 90 },
    { x: centerX - 70, y: centerY + 80 },
    { x: centerX + 70, y: centerY + 80 },
    { x: centerX + 80, y: centerY - 90 }
  ];
  svg.append("path")
    .datum(faceOutline)
    .attr("d", d3.line().curve(d3.curveBasisClosed)(faceOutline))
    .attr("class", "face");

  // Hair
  const hairPath = [
    { x: centerX - 80, y: centerY - 90 },
    { x: centerX - 60, y: centerY - 130 },
    { x: centerX,      y: centerY - 150 },
    { x: centerX + 60, y: centerY - 130 },
    { x: centerX + 80, y: centerY - 90 }
  ];
  svg.append("path")
    .datum(hairPath)
    .attr("d", d3.line().curve(d3.curveBasisClosed)(hairPath))
    .attr("class", "hair");

  // Eyes
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

  // Eyebrows
  const eyebrowOffset = scaledValue * 10;
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

  // Nose
  svg.append("path")
    .attr("d", `M ${centerX} ${centerY - 5} L ${centerX - 5} ${centerY + 10} L ${centerX + 5} ${centerY + 10} Z`)
    .attr("class", "nose");

  // Mouth
  const mouthY = centerY + 40;
  const mouthCurve = scaledValue * 30;
  svg.append("path")
    .attr("d", `M ${centerX - 30} ${mouthY} Q ${centerX} ${mouthY + mouthCurve} ${centerX + 30} ${mouthY}`)
    .attr("class", "mouth");
}