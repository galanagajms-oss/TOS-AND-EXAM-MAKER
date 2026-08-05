function addRow() {
    const container = document.getElementById('topicsContainer');
    const row = document.createElement('div');
    row.className = 'topic-row';
    row.innerHTML = `<input type="text" class="topic-name" placeholder="Topic"><input type="number" class="topic-hours" placeholder="Hours"><button class="btn-remove" onclick="removeRow(this)">×</button>`;
    container.appendChild(row);
}

function removeRow(btn) { btn.parentElement.remove(); }

function generateTOS() {
    const totalItemsInput = parseInt(document.getElementById('totalItems').value);
    const rows = document.querySelectorAll('.topic-row');
    let topics = []; let totalHours = 0;

    rows.forEach(row => {
        const name = row.querySelector('.topic-name').value;
        const hours = parseFloat(row.querySelector('.topic-hours').value) || 0;
        if (name && hours > 0) { topics.push({ name, hours }); totalHours += hours; }
    });

    if (topics.length === 0 || isNaN(totalItemsInput)) return alert("Please enter lessons and hours.");

    document.getElementById('outSubject').innerText = document.getElementById('subject').value.toUpperCase();
    document.getElementById('outCourse').innerText = document.getElementById('course').value;
    document.getElementById('outYear').innerText = document.getElementById('yearSection').value;
    document.getElementById('outTerm').innerText = document.getElementById('term').value;

    const tbody = document.getElementById('tosBody');
    tbody.innerHTML = "";
    let cumulativeItems = 0; let itemsAssigned = 0; let currentItem = 1;
    const bloomDist = [0.20, 0.20, 0.20, 0.15, 0.15, 0.10]; 

    topics.forEach(topic => {
        const weight = topic.hours / totalHours;
        cumulativeItems += (weight * totalItemsInput);
        let itemsForTopic = Math.round(cumulativeItems) - itemsAssigned;
        itemsAssigned += itemsForTopic;

        let range = itemsForTopic > 0 ? (itemsForTopic === 1 ? `${currentItem}` : `${currentItem}-${currentItem + itemsForTopic - 1}`) : "-";
        currentItem += itemsForTopic;

        let bItems = []; let bSum = 0; let bAssigned = 0;
        bloomDist.forEach(pct => {
            bSum += (pct * itemsForTopic);
            let val = Math.round(bSum) - bAssigned;
            bItems.push(val); bAssigned += val;
        });

        let rowSum = bItems.reduce((a, b) => a + b, 0);
        if(rowSum < itemsForTopic) bItems[0] += (itemsForTopic - rowSum);

        tbody.innerHTML += `<tr><td style="text-align:left">${topic.name}</td><td>${topic.hours}</td><td>${(weight*100).toFixed(1)}%</td><td>${itemsForTopic}</td><td>${bItems[0]}</td><td>${bItems[1]}</td><td>${bItems[2]}</td><td>${bItems[3]}</td><td>${bItems[4]}</td><td>${bItems[5]}</td><td>${range}</td></tr>`;
    });

    document.getElementById('tosFooter').innerHTML = `<td colspan="3">TOTAL</td><td>${itemsAssigned}</td><td colspan="6">Distribution: 60% LOTS | 40% HOTS</td><td>1-${itemsAssigned}</td>`;
    document.getElementById('aiSection').style.display = 'block';
    document.getElementById('printableTOS').style.display = 'block';
    window.scrollTo(0, document.getElementById('aiSection').offsetTop);
}

function copyPrompt() {
    const subj = document.getElementById('subject').value;
    const isMath = /math|algebra|geometry|calculus|statistics|physics|arithmetic|logic|discrete/i.test(subj);
    
    let requirements = "";
    document.querySelectorAll('#tosBody tr').forEach(r => {
        if(r.cells.length >= 10) {
            const topic = r.cells[0].innerText;
            const counts = [
                { l: "Remembering (Terminology/Facts)", c: r.cells[4].innerText },
                { l: "Understanding (Interpretation/Concepts)", c: r.cells[5].innerText },
                { l: "Applying (Calculations/Scenarios)", c: r.cells[6].innerText },
                { l: "Analyzing (Complex Problems/Logic)", c: r.cells[7].innerText },
                { l: "Evaluating (Critique/Detection)", c: r.cells[8].innerText },
                { l: "Creating (Integration/Synthesis)", c: r.cells[9].innerText }
            ];
            let list = counts.filter(x => x.c > 0).map(x => `${x.c} item(s) for ${x.l}`).join(", ");
            requirements += `- TOPIC: ${topic} (${list})\n`;
        }
    });

    const prompt = `Act as a College Professor. Create a ${document.getElementById('totalItems').value}-item Multiple Choice exam for ${subj}.

STRICT BLOOM'S TAXONOMY ALIGNMENT:
Follow this exact count per cognitive level:
${requirements}

GUIDELINES:
1. QUESTION STYLE: Use a professional college-level tone. Include a mix of direct questions, statements, and scenario-based word problems.
2. SITUATIONS: For Applying and Analyzing items, create realistic professional or mathematical scenarios.
3. MATH/SYMBOLS: Use plain text only. Use ^ for exponents, * for multiply, / for divide, sqrt() for roots. NO LaTeX.
4. FORMATTING: START IMMEDIATELY with "Q1.". No headers, no labels.
5. BALANCE: Correct keys (A, B, C, D) must be distributed evenly.

FORMAT:
Q[Number]. [Question/Problem]
A. [Option]
B. [Option]
C. [Option]
D. [Option]
Answer: [Letter]`;

    navigator.clipboard.writeText(prompt);
    alert("College AI Prompt Copied!");
    window.open("https://gemini.google.com/app", "_blank");
}

function formatTest() {
    const raw = document.getElementById('aiResponsePaste').value;
    if(!raw) return alert("Paste AI response first.");
    
    const content = document.getElementById('testContent');
    const keyTable = document.getElementById('answerKeyTable');
    content.innerHTML = "<h4>Directions: Read each item carefully and choose the letter of the correct answer.</h4>";
    
    const items = raw.split(/Q\d+\./g).filter(i => i.trim() !== "");
    const answers = [];

    items.forEach((item, index) => {
        let lines = item.trim().split('\n');
        let question = lines[0];
        let options = lines.filter(l => l.match(/^[A-D]\./));
        let answerLine = lines.find(l => l.toLowerCase().includes("answer:"));
        let letter = answerLine ? answerLine.split(":")[1].trim() : "?";
        answers.push(letter);

        content.innerHTML += `
            <div style="margin-bottom:15px; page-break-inside: avoid;">
                <strong>${index + 1}. ${question}</strong>
                <div style="display:grid; grid-template-columns: 1fr 1fr; margin-left:20px;">
                    ${options.map(o => `<div>${o}</div>`).join('')}
                </div>
            </div>`;
    });

    // VERTICAL FLOW ANSWER KEY (Max 25 rows)
    const maxRows = 25;
    const numCols = Math.ceil(answers.length / maxRows);
    let keyHtml = "<thead><tr>";
    for(let i=0; i<numCols; i++) keyHtml += "<th>No.</th><th>Key</th>";
    keyHtml += "</tr></thead><tbody>";

    for(let r = 0; r < Math.min(answers.length, maxRows); r++) {
        keyHtml += "<tr>";
        for(let c = 0; c < numCols; c++) {
            let idx = r + (c * maxRows);
            if(idx < answers.length) {
                keyHtml += `<td style="background:#f2f2f2;">${idx + 1}</td><td style="font-weight:bold;">${answers[idx]}</td>`;
            } else {
                keyHtml += "<td></td><td></td>";
            }
        }
        keyHtml += "</tr>";
    }
    keyTable.innerHTML = keyHtml + "</tbody>";

    document.getElementById('testSubjHead').innerText = document.getElementById('subject').value.toUpperCase();
    document.getElementById('testTermHead').innerText = document.getElementById('term').value.toUpperCase();
    document.getElementById('testCourseYear').innerText = document.getElementById('course').value + " " + document.getElementById('yearSection').value;
    document.getElementById('testPaperArea').style.display = 'block';
}

function exportToWord() {
    const content = document.getElementById('wordContent').innerHTML;
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>body{font-family:Arial; font-size:11pt;} table{border-collapse:collapse; width:100%;} th,td{border:1px solid black; padding:5px; text-align:center;} .test-header{text-align:center;} .student-info{display:flex; justify-content:space-between;}</style></head><body>";
    const footer = "</body></html>";
    const blob = new Blob(['\ufeff', header + content + footer], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = document.getElementById('subject').value + "_CollegeExam.doc";
    link.click();
}