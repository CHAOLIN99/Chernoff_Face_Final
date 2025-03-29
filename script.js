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
  
  // Face shape (more rounded)
  svg.append("ellipse")
    .attr("cx", centerX)
    .attr("cy", centerY)
    .attr("rx", 80)
    .attr("ry", 100)
    .attr("fill", "#FFDBAC")  // Light peach skin tone
    .attr("stroke", "#000")
    .attr("stroke-width", 2);
    
  // Hair (dark brown)
  const hairPath = [
    { x: centerX - 80, y: centerY - 40 },
    { x: centerX - 85, y: centerY - 80 },
    { x: centerX - 60, y: centerY - 110 },
    { x: centerX, y: centerY - 120 },
    { x: centerX + 60, y: centerY - 110 },
    { x: centerX + 85, y: centerY - 80 },
    { x: centerX + 80, y: centerY - 40 }
  ];
  
  svg.append("path")
    .datum(hairPath)
    .attr("d", d3.line().curve(d3.curveBasisClosed)(hairPath))
    .attr("fill", "#3B2314")  // Dark brown hair
    .attr("stroke", "#000")
    .attr("stroke-width", 1);
    
  // Eyebrows (thicker and more angular)
  svg.append("path")
    .attr("d", `M${centerX - 45} ${centerY - 35} Q${centerX - 30} ${centerY - 40}, ${centerX - 15} ${centerY - 35}`)
    .attr("stroke", "#000")
    .attr("stroke-width", 3)
    .attr("fill", "none");
    
  svg.append("path")
    .attr("d", `M${centerX + 15} ${centerY - 35} Q${centerX + 30} ${centerY - 40}, ${centerX + 45} ${centerY - 35}`)
    .attr("stroke", "#000")
    .attr("stroke-width", 3)
    .attr("fill", "none");
    
  // Eyes (oval shape with black pupils)
  svg.append("ellipse")
    .attr("cx", centerX - 25)
    .attr("cy", centerY - 20)
    .attr("rx", 12)
    .attr("ry", 8)
    .attr("fill", "white")
    .attr("stroke", "#000")
    .attr("stroke-width", 1);
    
  svg.append("ellipse")
    .attr("cx", centerX + 25)
    .attr("cy", centerY - 20)
    .attr("rx", 12)
    .attr("ry", 8)
    .attr("fill", "white")
    .attr("stroke", "#000")
    .attr("stroke-width", 1);
    
  // Pupils
  svg.append("ellipse")
    .attr("cx", centerX - 25)
    .attr("cy", centerY - 20)
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("fill", "#000");
    
  svg.append("ellipse")
    .attr("cx", centerX + 25)
    .attr("cy", centerY - 20)
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("fill", "#000");
    
  // Nose (simple curved line)
  svg.append("path")
    .attr("d", `M${centerX} ${centerY - 10} Q${centerX + 8} ${centerY + 10}, ${centerX} ${centerY + 10}`)
    .attr("stroke", "#000")
    .attr("stroke-width", 1.5)
    .attr("fill", "none");
    
  // Mouth (slight smile)
  svg.append("path")
    .attr("d", `M${centerX - 30} ${centerY + 35} Q${centerX} ${centerY + 45}, ${centerX + 30} ${centerY + 35}`)
    .attr("stroke", "#000")
    .attr("stroke-width", 2)
    .attr("fill", "none");
}