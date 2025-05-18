async function generateStory() {
    const university = document.getElementById('uni-select').value;
    const score = calculateStudyScore();
    
    showLoading(true);
    
    try {
        const response = await fetch('http://localhost:5000/generate-story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                university: university,
                studyScore: score
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('story-text').textContent = data.story;
        } else {
            document.getElementById('story-text').textContent = 
                "Error: " + data.error + ". Using fallback story...";
            showFallbackStory(university, score);
        }
    } catch (error) {
        document.getElementById('story-text').textContent = 
            "Connection failed. Using local story...";
        showFallbackStory(university, score);
    } finally {
        showLoading(false);
        document.getElementById('study-tracker').classList.add('hidden');
        document.getElementById('story-result').classList.remove('hidden');
    }
}

function showLoading(show) {
    const btn = document.getElementById('generate-btn');
    btn.disabled = show;
    btn.textContent = show ? "Generating..." : "Generate Story";
}