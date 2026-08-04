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

    if (topics.length === 0 || isNaN(totalItemsInput)) return alert("Missing data.");

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

        tbody.innerHTML += `<tr><td style="text-align:left">${topic.name}</td><td>${topic.hours}</td><td>${(weight*100).toFixed(1)}%</td><td>${itemsForTopic}</td><td>${bItems[0]}</td><td>${bItems[1]}</td><td>${bItems[2]}</td><td>${bItems[3]}</td><td>${bItems[4]}</td><td>${bItems[5]}</td><td>${range}</td></tr>`;
    });

    document.getElementById('tosFooter').innerHTML = `<td colspan="3">TOTAL</td><td>${itemsAssigned}</td><td colspan="6">60% LOTS | 40% HOTS</td><td>1-${itemsAssigned}</td>`;
    document.getElementById('aiSection').style.display = 'block';
    document.getElementById('printableTOS').style.display = 'block';
}

// UPDATED AI PROMPT LOGIC
function copyPrompt() {
    let topicList = "";
    document.querySelectorAll('#tosBody tr').forEach(r => topicList += `- ${r.cells[0].innerText} (${r.cells[3].innerText} items)\n`);
    
    const prompt = `Act as a College Professor. Create a ${document.getElementById('totalItems').value}-item Multiple Choice exam for ${document.getElementById('subject').value}.

STRICT RULES:
1. Every question must be a "WH-Question" (Who, What, When, Where, Why, or How).
2. DO NOT include topic titles, categories, or headers. 
3. START IMMEDIATELY with "Q1." and continue until the last item.
4. No introductory or concluding text.
5. BALANCE THE ANSWERS: Distribute the correct answers (A, B, C, D) equally. Approximately 25% of the items should be A, 25% B, 25% C, and 25% D. Avoid repeating the same letter for more than 3 consecutive items.

TOPIC DISTRIBUTION:
${topicList}

FORMAT FOR EVERY ITEM:
Q[Number]. [Question]
A. [Option]
B. [Option]
C. [Option]
D. [Option]
Answer: [Letter]`;

    navigator.clipboard.writeText(prompt);
    alert("Straight-forward WH-Question Prompt Copied!");
    window.open("https://gemini.google.com/app", "_blank");
}

function formatTest() {
    const raw = document.getElementById('aiResponsePaste').value;
    const content = document.getElementById('testContent');
    const keyTable = document.getElementById('answerKeyTable');
    content.innerHTML = "<h4>Directions: Choose the best answer for each item.</h4>";
    keyTable.innerHTML = "";

    const items = raw.split(/Q\d+\./g).filter(i => i.trim() !== "");
    let keyHtml = "<tr><th>Item</th><th>Key</th><th>Item</th><th>Key</th></tr><tr>";

    items.forEach((item, index) => {
        let lines = item.trim().split('\n');
        let question = lines[0];
        let options = lines.filter(l => l.match(/^[A-D]\./));
        let answerLine = lines.find(l => l.toLowerCase().includes("answer:"));
        let letter = answerLine ? answerLine.split(":")[1].trim() : "?";

        content.innerHTML += `<div style="margin-bottom:15px; page-break-inside: avoid;"><strong>${index + 1}. ${question}</strong><div style="display:grid; grid-template-columns: 1fr 1fr; margin-left:20px;">${options.map(o => `<div>${o}</div>`).join('')}</div></div>`;
        
        keyHtml += `<td>${index + 1}</td><td style="font-weight:bold;">${letter}</td>`;
        if ((index + 1) % 2 === 0) keyHtml += "</tr><tr>";
    });

    keyTable.innerHTML = keyHtml + "</tr>";
    document.getElementById('testSubjHead').innerText = document.getElementById('subject').value.toUpperCase();
    document.getElementById('testTermHead').innerText = document.getElementById('term').value.toUpperCase();
    document.getElementById('testCourseYear').innerText = document.getElementById('course').value + " " + document.getElementById('yearSection').value;
    document.getElementById('testPaperArea').style.display = 'block';
}

function exportToWord() {
    const content = document.getElementById('wordContent').innerHTML;
    const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><style>body{font-family:Arial; font-size:11pt;} table{border-collapse:collapse; width:100%;} th,td{border:1px solid black; padding:5px; text-align:center;} .test-header{text-align:center;} .student-info{display:flex; justify-content:space-between;}</style></head><body>";
    const postHtml = "</body></html>";
    const blob = new Blob(['\ufeff', preHtml + content + postHtml], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = document.getElementById('subject').value + "_Exam.doc";
    link.click();
}