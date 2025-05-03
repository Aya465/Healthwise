// API Configuration
const API_URL = 'http://localhost:8000/predict';

// DOM Elements
const symptomForm = document.getElementById('symptom-form');
const dietForm = document.getElementById('diet-form');
const symptomResult = document.getElementById('symptom-result');
const dietResult = document.getElementById('diet-result');

// Helper Functions
function showLoading(element) {
    element.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="loading-spinner"></div>
            <span class="ms-2">Analyzing...</span>
        </div>
    `;
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showError(element, message) {
    element.innerHTML = `
        <div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle-fill"></i> ${message}
        </div>
    `;
}

function showResult(element, content, isDiet = false) {
    const resultType = isDiet ? 'diet' : 'medical';
    element.innerHTML = `
        <div class="alert ${isDiet ? 'alert-success' : 'alert-info'}">
            <h5><i class="bi ${isDiet ? 'bi-egg-fried' : 'bi-heart-pulse'}"></i> 
                ${isDiet ? 'Diet Recommendation' : 'Health Analysis'}
            </h5>
            <hr>
            <div class="response-content">${content}</div>
            <small class="text-muted mt-2 d-block">
                <i class="bi bi-info-circle"></i> 
                ${isDiet ? 'Dietary suggestions are general recommendations' : 'Consult a healthcare professional for medical advice'}
            </small>
        </div>
    `;
    // Smooth scroll to results
    setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Enhanced API Call Function
async function queryModel(prompt, isDiet = false) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: prompt,
                query_type: isDiet ? 'diet' : 'medical'
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.response) {
            throw new Error('No response from model');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        return {
            response: `Error: ${error.message}`,
            error: true
        };
    }
}

// Form Handlers
symptomForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const symptom = document.getElementById('symptom').value.trim();
    const duration = document.getElementById('duration').value;

    if (!symptom) {
        showError(symptomResult, "Please describe your symptoms");
        return;
    }

    const prompt = `Symptoms: ${symptom}. Duration: ${duration}. Analyze these symptoms.`;
    showLoading(symptomResult);

    try {
        const { response, disclaimer } = await queryModel(prompt);
        showResult(symptomResult, response);
    } catch (error) {
        showError(symptomResult, "Failed to analyze symptoms. Please try again.");
    }
});

dietForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const constraints = document.getElementById('constraints').value.trim();
    const needs = document.getElementById('needs').value.trim();

    if (!constraints && !needs) {
        showError(dietResult, "Please enter at least one dietary requirement");
        return;
    }

    const prompt = `Dietary constraints: ${constraints || 'none'}. Nutritional needs: ${needs || 'balanced diet'}.`;
    showLoading(dietResult);

    try {
        const { response, disclaimer } = await queryModel(prompt, true);
        // Format dietary response as bullet points if not already formatted
        const formattedResponse = response.includes('<ul>') ? response :
            `<ul>${response.split('\n').filter(line => line.trim()).map(line => `<li>${line.trim()}</li>`).join('')}</ul>`;

        showResult(dietResult, formattedResponse, true);
    } catch (error) {
        showError(dietResult, "Couldn't generate dietary suggestions. Please try again.");
    }
});

// Initialize Bootstrap tooltips
const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});

// Prevent form jump and handle focus
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
        form.querySelector('button[type="submit"]').blur();
    });
});