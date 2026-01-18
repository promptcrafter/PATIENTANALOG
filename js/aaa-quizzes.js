/**
 * PatientAnalog.com - AAA Quizzes Module
 * Two new quizzes with 10 questions each + enhanced scoreboard
 * 
 * Quiz 1: Build a Patient Analog
 * Quiz 2: Simulation Infrastructure Architect
 * 
 * @version 1.0.0
 */

(function() {
    'use strict';

    console.log('[AAA-Quizzes] Loading quiz module...');

    // ═══════════════════════════════════════════════════════════
    // QUIZ DATA
    // ═══════════════════════════════════════════════════════════
    
    const QuizData = {
        // Quiz 1: Build a Patient Analog
        patientAnalog: {
            id: 'patient-analog-quiz',
            title: '🧬 Build a Patient Analog',
            description: 'Test your knowledge of digital twins, organoids, and patient simulation technologies!',
            badge: '🏆 Patient Analog Architect',
            color: '#0055ff',
            questions: [
                {
                    q: 'What is a "Patient Analog" in biomedical research?',
                    options: ['A robotic patient', 'A digital/biological representation of a human for testing', 'A medical records system', 'A patient feedback form'],
                    correct: 1,
                    explanation: 'A Patient Analog is a digital or biological representation (like organoids or digital twins) used for drug testing and personalized medicine.'
                },
                {
                    q: 'Which legislation removed the requirement for animal testing in drug development?',
                    options: ['HIPAA', 'FDA Modernization Act 2.0', 'Affordable Care Act', 'GDPR'],
                    correct: 1,
                    explanation: 'The FDA Modernization Act 2.0 (2022) allows alternatives to animal testing including organ-on-chip and organoids.'
                },
                {
                    q: 'What are organoids?',
                    options: ['Organ transplants', 'Musical organs', 'Miniature 3D organ models grown from stem cells', 'Surgical tools'],
                    correct: 2,
                    explanation: 'Organoids are tiny, simplified versions of organs produced in vitro from stem cells.'
                },
                {
                    q: 'What does "organ-on-chip" technology do?',
                    options: ['Stores organ data', 'Simulates organ functions on a microfluidic device', 'Tracks organ donors', 'Scans organs for disease'],
                    correct: 1,
                    explanation: 'Organ-on-chip platforms use microfluidics to simulate the activities and mechanics of entire organs.'
                },
                {
                    q: 'What is a digital twin in healthcare?',
                    options: ['A twin sibling who is a doctor', 'A virtual replica of a patient for simulation', 'A backup medical record', 'A second opinion system'],
                    correct: 1,
                    explanation: 'A digital twin is a virtual representation of a patient that can be used to simulate treatments and predict outcomes.'
                },
                {
                    q: 'What does NAM stand for in drug development?',
                    options: ['National Association of Medicine', 'New Approach Methodologies', 'Non-Animal Methods', 'Networked Analysis Module'],
                    correct: 1,
                    explanation: 'NAMs (New Approach Methodologies) include organ-on-chip, organoids, and AI models as alternatives to animal testing.'
                },
                {
                    q: 'Which cell type is commonly used to create personalized organoids?',
                    options: ['Red blood cells', 'Induced pluripotent stem cells (iPSCs)', 'Bacteria', 'Platelets'],
                    correct: 1,
                    explanation: 'iPSCs can be derived from a patient\'s own cells and differentiated into various organ-specific tissues.'
                },
                {
                    q: 'What is the main advantage of microphysiological systems (MPS)?',
                    options: ['They are larger than real organs', 'They replicate human biology more accurately than animal models', 'They are cheaper than computers', 'They work without electricity'],
                    correct: 1,
                    explanation: 'MPS better replicate human-specific responses to drugs, reducing failures in clinical trials.'
                },
                {
                    q: 'What technology enables multi-organ interaction studies?',
                    options: ['X-ray machines', 'Body-on-chip platforms', 'Stethoscopes', 'Thermometers'],
                    correct: 1,
                    explanation: 'Body-on-chip connects multiple organ chips to study systemic drug effects and organ interactions.'
                },
                {
                    q: 'What is the goal of precision medicine?',
                    options: ['Making surgery more precise', 'Treating all patients the same', 'Tailoring treatment to individual patient characteristics', 'Reducing doctor visits'],
                    correct: 2,
                    explanation: 'Precision medicine uses patient-specific data to customize treatments for better outcomes.'
                }
            ]
        },
        
        // Quiz 2: Simulation Infrastructure Architect
        infrastructureArchitect: {
            id: 'infrastructure-architect-quiz',
            title: '🏗️ Simulation Infrastructure Architect',
            description: 'Design the future of human simulation technology infrastructure!',
            badge: '⚡ Infrastructure Master',
            color: '#9D00FF',
            questions: [
                {
                    q: 'What microfluidic feature is essential for organ-on-chip devices?',
                    options: ['Wireless charging', 'Continuous perfusion channels', 'Solar panels', 'Voice control'],
                    correct: 1,
                    explanation: 'Continuous perfusion channels deliver nutrients and remove waste, mimicking blood flow.'
                },
                {
                    q: 'Which imaging technology is used to monitor organoid development in real-time?',
                    options: ['Radar', 'Confocal microscopy', 'Sonar', 'Radio telescope'],
                    correct: 1,
                    explanation: 'Confocal microscopy provides high-resolution 3D imaging of living organoid structures.'
                },
                {
                    q: 'What material is commonly used for flexible organ-on-chip membranes?',
                    options: ['Steel', 'PDMS (polydimethylsiloxane)', 'Glass', 'Paper'],
                    correct: 1,
                    explanation: 'PDMS is biocompatible, transparent, and flexible - ideal for mimicking tissue mechanics.'
                },
                {
                    q: 'What type of AI is used to analyze patient simulation data?',
                    options: ['General AI', 'Machine learning algorithms', 'Artificial emotions', 'Robot vacuum AI'],
                    correct: 1,
                    explanation: 'Machine learning analyzes complex biological data to predict drug responses and outcomes.'
                },
                {
                    q: 'What is the purpose of a bioreactor in organoid culture?',
                    options: ['Generate electricity', 'Provide controlled growth conditions', 'Store data', 'Cool equipment'],
                    correct: 1,
                    explanation: 'Bioreactors control temperature, oxygen, nutrients, and mechanical stimulation for organoid growth.'
                },
                {
                    q: 'Which sensor type monitors cell health in organ-on-chip systems?',
                    options: ['Motion sensors', 'TEER (Transepithelial Electrical Resistance)', 'GPS', 'Barometer'],
                    correct: 1,
                    explanation: 'TEER sensors measure barrier integrity of cell layers, indicating tissue health.'
                },
                {
                    q: 'What cloud technology enables distributed patient simulation?',
                    options: ['Rain clouds', 'High-performance computing clusters', 'Weather satellites', 'Steam engines'],
                    correct: 1,
                    explanation: 'HPC clusters process complex simulations and enable collaborative research across institutions.'
                },
                {
                    q: 'What standard ensures interoperability of biomedical data?',
                    options: ['JPEG', 'FHIR (Fast Healthcare Interoperability Resources)', 'MP3', 'PDF'],
                    correct: 1,
                    explanation: 'FHIR is a healthcare data standard that enables systems to exchange patient information.'
                },
                {
                    q: 'Which technology enables remote monitoring of organ-chip experiments?',
                    options: ['Carrier pigeons', 'IoT (Internet of Things) sensors', 'Fax machines', 'Morse code'],
                    correct: 1,
                    explanation: 'IoT sensors transmit real-time data from organ-chip experiments to researchers worldwide.'
                },
                {
                    q: 'What is the role of extracellular matrix (ECM) in organoid culture?',
                    options: ['Electrical wiring', 'Provides structural support and signaling', 'Data storage', 'Sound insulation'],
                    correct: 1,
                    explanation: 'ECM (like Matrigel) provides the 3D scaffold and biochemical cues for organoid self-organization.'
                }
            ]
        }
    };

    // ═══════════════════════════════════════════════════════════
    // SCOREBOARD SYSTEM (Enhanced with persistence)
    // ═══════════════════════════════════════════════════════════
    
    const Scoreboard = {
        storageKey: 'aaaQuizScoreboard',
        maxEntries: 10,
        
        getScores: function() {
            try {
                const data = localStorage.getItem(this.storageKey);
                return data ? JSON.parse(data) : [];
            } catch(e) {
                return [];
            }
        },
        
        addScore: function(name, score, quizId, badge) {
            const scores = this.getScores();
            scores.push({
                name: name.substring(0, 20),
                score: score,
                quiz: quizId,
                badge: badge,
                date: new Date().toISOString()
            });
            
            // Sort by score descending and keep top entries
            scores.sort((a, b) => b.score - a.score);
            const trimmed = scores.slice(0, this.maxEntries);
            
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
            } catch(e) {
                console.warn('[Scoreboard] Could not save score');
            }
            
            return trimmed;
        },
        
        getTopThree: function(quizId) {
            const scores = this.getScores();
            const filtered = quizId ? scores.filter(s => s.quiz === quizId) : scores;
            return filtered.slice(0, 3);
        },
        
        renderScoreboard: function(containerId, quizId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            const top3 = this.getTopThree(quizId);
            
            let html = `
                <div class="aaa-scoreboard">
                    <div class="scoreboard-title">🏆 Top Scientists</div>
                    <div class="scoreboard-list">
            `;
            
            const medals = ['🥇', '🥈', '🥉'];
            top3.forEach((entry, index) => {
                html += `
                    <div class="scoreboard-entry" style="animation-delay: ${index * 0.1}s">
                        <span class="entry-rank">${medals[index] || (index + 1)}</span>
                        <span class="entry-name">${entry.name}</span>
                        <span class="entry-score">${entry.score}%</span>
                        <span class="entry-badge">${entry.badge || ''}</span>
                    </div>
                `;
            });
            
            if (top3.length === 0) {
                html += '<div class="scoreboard-empty">Be the first to complete a quiz!</div>';
            }
            
            html += '</div></div>';
            container.innerHTML = html;
        }
    };

    // ═══════════════════════════════════════════════════════════
    // QUIZ ENGINE
    // ═══════════════════════════════════════════════════════════
    
    const QuizEngine = {
        currentQuiz: null,
        currentQuestion: 0,
        score: 0,
        answers: [],
        
        start: function(quizKey, containerId) {
            const quizData = QuizData[quizKey];
            if (!quizData) {
                console.error('[Quiz] Invalid quiz key:', quizKey);
                return;
            }
            
            this.currentQuiz = quizData;
            this.currentQuestion = 0;
            this.score = 0;
            this.answers = [];
            this.containerId = containerId;
            
            // Play sound
            if (window.AAAEngine) {
                AAAEngine.playSound('click');
            }
            
            this.renderQuestion();
        },
        
        renderQuestion: function() {
            const container = document.getElementById(this.containerId);
            if (!container) {
                console.error('[Quiz] Container not found:', this.containerId);
                return;
            }
            console.log('[Quiz] Rendering question in:', this.containerId);
            
            const quiz = this.currentQuiz;
            const q = quiz.questions[this.currentQuestion];
            const progress = ((this.currentQuestion + 1) / quiz.questions.length * 100).toFixed(0);
            
            let html = `
                <div class="aaa-quiz-container" style="--quiz-color: ${quiz.color}">
                    <button class="aaa-quiz-close" onclick="AAAQuizzes.close()" title="Close Quiz">✕</button>
                    <div class="quiz-header">
                        <div class="quiz-title">${quiz.title}</div>
                        <div class="quiz-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress}%"></div>
                            </div>
                            <span class="progress-text">Question ${this.currentQuestion + 1} of ${quiz.questions.length}</span>
                        </div>
                    </div>
                    <div class="quiz-question">
                        <div class="question-number">Q${this.currentQuestion + 1}</div>
                        <div class="question-text">${q.q}</div>
                    </div>
                    <div class="quiz-options">
            `;
            
            q.options.forEach((opt, idx) => {
                html += `
                    <button class="quiz-option" onclick="AAAQuizzes.answer(${idx})">
                        <span class="option-letter">${String.fromCharCode(65 + idx)}</span>
                        <span class="option-text">${opt}</span>
                    </button>
                `;
            });
            
            html += `
                    </div>
                    <div class="quiz-score">Score: ${this.score}/${this.currentQuestion}</div>
                </div>
            `;
            
            container.innerHTML = html;

            // Scroll quiz into view
            container.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },

        answer: function(index) {
            const quiz = this.currentQuiz;
            const q = quiz.questions[this.currentQuestion];
            const correct = index === q.correct;
            
            this.answers.push({ question: this.currentQuestion, answer: index, correct: correct });
            
            if (correct) {
                this.score++;
                if (window.AAAEngine) {
                    AAAEngine.playSound('success');
                }
            } else {
                if (window.AAAEngine) {
                    AAAEngine.playSound('error');
                }
            }
            
            // Show feedback briefly
            const container = document.getElementById(this.containerId);
            const options = container.querySelectorAll('.quiz-option');
            options.forEach((opt, idx) => {
                opt.disabled = true;
                if (idx === q.correct) {
                    opt.classList.add('correct');
                } else if (idx === index && !correct) {
                    opt.classList.add('incorrect');
                }
            });
            
            // Show explanation
            const explanationDiv = document.createElement('div');
            explanationDiv.className = 'quiz-explanation ' + (correct ? 'correct' : 'incorrect');
            explanationDiv.innerHTML = `
                <strong>${correct ? '✓ Correct!' : '✗ Incorrect'}</strong><br>
                ${q.explanation}
            `;
            container.querySelector('.quiz-options').appendChild(explanationDiv);
            
            // Next question or finish
            setTimeout(() => {
                this.currentQuestion++;
                if (this.currentQuestion < quiz.questions.length) {
                    this.renderQuestion();
                } else {
                    this.finish();
                }
            }, 2000);
        },
        
        finish: function() {
            const quiz = this.currentQuiz;
            const percentage = Math.round((this.score / quiz.questions.length) * 100);
            const container = document.getElementById(this.containerId);
            
            // Play victory sound
            if (window.AAAEngine && percentage >= 70) {
                AAAEngine.celebrate(this.containerId, quiz.badge);
            }
            
            let resultClass = 'poor';
            let message = 'Keep studying! 📚';
            if (percentage >= 90) {
                resultClass = 'excellent';
                message = 'Outstanding! You\'re an expert! 🌟';
            } else if (percentage >= 70) {
                resultClass = 'good';
                message = 'Great job! You know your stuff! 🎉';
            } else if (percentage >= 50) {
                resultClass = 'average';
                message = 'Good effort! Keep learning! 💪';
            }
            
            let html = `
                <div class="aaa-quiz-results ${resultClass}">
                    <div class="results-header">
                        <div class="results-badge">${quiz.badge}</div>
                        <div class="results-title">Quiz Complete!</div>
                    </div>
                    <div class="results-score">
                        <div class="score-circle">
                            <div class="score-value">${percentage}%</div>
                            <div class="score-label">${this.score}/${quiz.questions.length} correct</div>
                        </div>
                    </div>
                    <div class="results-message">${message}</div>
                    <div class="results-name">
                        <input type="text" id="quizPlayerName" placeholder="Enter your name for leaderboard" maxlength="20">
                        <button onclick="AAAQuizzes.saveScore()">Save Score</button>
                    </div>
                    <div class="results-actions">
                        <button onclick="AAAQuizzes.start('${Object.keys(QuizData).find(k => QuizData[k] === quiz)}', '${this.containerId}')">Try Again</button>
                    </div>
                    <div id="quizScoreboardDisplay"></div>
                </div>
            `;
            
            container.innerHTML = html;
            
            // Show scoreboard
            Scoreboard.renderScoreboard('quizScoreboardDisplay', quiz.id);
        },
        
        saveScore: function() {
            const nameInput = document.getElementById('quizPlayerName');
            const name = nameInput ? nameInput.value.trim() : 'Anonymous';
            const percentage = Math.round((this.score / this.currentQuiz.questions.length) * 100);
            
            if (name) {
                Scoreboard.addScore(name, percentage, this.currentQuiz.id, this.currentQuiz.badge);
                Scoreboard.renderScoreboard('quizScoreboardDisplay', this.currentQuiz.id);
                
                if (window.AAAEngine) {
                    AAAEngine.playSound('levelUp');
                }
            }
        }
    };

    // ═══════════════════════════════════════════════════════════
    // INJECT QUIZ STYLES
    // ═══════════════════════════════════════════════════════════
    
    function injectStyles() {
        if (document.getElementById('aaa-quiz-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'aaa-quiz-styles';
        style.textContent = `
            .aaa-quiz-container {
                background: linear-gradient(135deg, rgba(10, 15, 44, 0.98), rgba(20, 10, 40, 0.95));
                border: 2px solid var(--quiz-color, #0055ff);
                border-radius: 20px;
                padding: 30px;
                max-width: 700px;
                max-height: 85vh;
                overflow-y: auto;
                margin: 0 auto;
                position: relative;
            }
            .aaa-quiz-close {
                position: absolute;
                top: 15px;
                right: 15px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(255, 107, 107, 0.2);
                border: 2px solid #ff6b6b;
                color: #ff6b6b;
                font-size: 18px;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .aaa-quiz-close:hover {
                background: #ff6b6b;
                color: #fff;
            }
            .quiz-header { margin-bottom: 25px; }
            .quiz-title {
                font-family: 'Orbitron', sans-serif;
                font-size: 24px;
                color: var(--quiz-color, #0055ff);
                text-align: center;
                margin-bottom: 15px;
            }
            .progress-bar {
                height: 8px;
                background: rgba(255,255,255,0.1);
                border-radius: 4px;
                overflow: hidden;
            }
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--quiz-color, #0055ff), #9D00FF);
                transition: width 0.5s ease;
            }
            .progress-text {
                font-size: 12px;
                color: rgba(255,255,255,0.6);
                text-align: center;
                display: block;
                margin-top: 5px;
            }
            .quiz-question {
                background: rgba(0,0,0,0.3);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
            }
            .question-number {
                font-family: 'Orbitron', sans-serif;
                color: var(--quiz-color, #0055ff);
                font-size: 14px;
                margin-bottom: 10px;
            }
            .question-text {
                font-size: 18px;
                color: #fff;
                line-height: 1.5;
            }
            .quiz-options { display: flex; flex-direction: column; gap: 12px; }
            .quiz-option {
                display: flex;
                align-items: center;
                gap: 15px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 12px;
                padding: 15px 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: left;
            }
            .quiz-option:hover:not(:disabled) {
                border-color: var(--quiz-color, #0055ff);
                background: rgba(0,255,255,0.1);
            }
            .quiz-option.correct {
                border-color: #00FF88;
                background: rgba(0,255,136,0.2);
            }
            .quiz-option.incorrect {
                border-color: #FF0033;
                background: rgba(255,0,51,0.2);
            }
            .option-letter {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: var(--quiz-color, #0055ff);
                color: #000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
            .option-text { color: #fff; font-size: 15px; }
            .quiz-explanation {
                margin-top: 15px;
                padding: 15px;
                border-radius: 10px;
                font-size: 14px;
                line-height: 1.5;
            }
            .quiz-explanation.correct {
                background: rgba(0,255,136,0.15);
                border: 1px solid #00FF88;
                color: #00FF88;
            }
            .quiz-explanation.incorrect {
                background: rgba(255,0,51,0.15);
                border: 1px solid #FF0033;
                color: #FF6B6B;
            }
            .quiz-score {
                text-align: center;
                margin-top: 20px;
                font-family: 'Orbitron', sans-serif;
                color: #FFD700;
            }
            .aaa-quiz-results {
                text-align: center;
                padding: 40px;
                background: linear-gradient(135deg, rgba(10, 15, 44, 0.98), rgba(20, 10, 40, 0.95));
                border-radius: 20px;
            }
            .results-badge {
                font-size: 48px;
                margin-bottom: 20px;
            }
            .results-title {
                font-family: 'Orbitron', sans-serif;
                font-size: 28px;
                color: #FFD700;
                margin-bottom: 20px;
            }
            .score-circle {
                width: 150px;
                height: 150px;
                border-radius: 50%;
                border: 4px solid #0055ff;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
            }
            .aaa-quiz-results.excellent .score-circle { border-color: #00FF88; }
            .aaa-quiz-results.good .score-circle { border-color: #0055ff; }
            .aaa-quiz-results.average .score-circle { border-color: #FFD700; }
            .aaa-quiz-results.poor .score-circle { border-color: #FF0033; }
            .score-value {
                font-family: 'Orbitron', sans-serif;
                font-size: 36px;
                color: #fff;
            }
            .score-label { font-size: 12px; color: rgba(255,255,255,0.6); }
            .results-message { font-size: 18px; color: #fff; margin-bottom: 25px; }
            .results-name {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            .results-name input {
                padding: 10px 15px;
                border-radius: 8px;
                border: 1px solid #0055ff;
                background: rgba(0,0,0,0.3);
                color: #fff;
                font-size: 14px;
            }
            .results-name button, .results-actions button {
                padding: 10px 20px;
                border-radius: 8px;
                border: 1px solid #0055ff;
                background: linear-gradient(135deg, rgba(0,255,255,0.3), rgba(157,0,255,0.2));
                color: #fff;
                cursor: pointer;
                font-family: 'Orbitron', sans-serif;
                transition: all 0.3s ease;
            }
            .results-name button:hover, .results-actions button:hover {
                background: linear-gradient(135deg, rgba(0,255,255,0.5), rgba(157,0,255,0.4));
            }
            .aaa-scoreboard {
                margin-top: 30px;
                padding: 20px;
                background: rgba(0,0,0,0.3);
                border-radius: 15px;
                border: 1px solid rgba(255,215,0,0.3);
            }
            .scoreboard-title {
                font-family: 'Orbitron', sans-serif;
                color: #FFD700;
                font-size: 18px;
                margin-bottom: 15px;
            }
            .scoreboard-entry {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 10px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                animation: fadeIn 0.5s ease-out both;
            }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .entry-rank { font-size: 24px; }
            .entry-name { flex: 1; color: #fff; }
            .entry-score { font-family: 'Orbitron', sans-serif; color: #0055ff; }
            .entry-badge { font-size: 16px; }
            .scoreboard-empty { color: rgba(255,255,255,0.5); padding: 20px; }
        `;
        document.head.appendChild(style);
    }

    // ═══════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════
    
    window.AAAQuizzes = {
        start: function(quizKey, containerId) {
            injectStyles();
            QuizEngine.start(quizKey, containerId);
        },
        answer: function(index) {
            QuizEngine.answer(index);
        },
        saveScore: function() {
            QuizEngine.saveScore();
        },
        close: function() {
            // Clear the quiz container
            if (QuizEngine.containerId) {
                const container = document.getElementById(QuizEngine.containerId);
                if (container) {
                    container.innerHTML = '';
                }
            }
            // Reset quiz state
            QuizEngine.currentQuiz = null;
            QuizEngine.currentQuestion = 0;
            QuizEngine.score = 0;
            QuizEngine.answers = [];
            // Play close sound if available
            if (window.AAAEngine) {
                AAAEngine.playSound('click');
            }
            console.log('[AAA-Quizzes] Quiz closed');
        },
        showScoreboard: function(containerId, quizId) {
            injectStyles();
            Scoreboard.renderScoreboard(containerId, quizId);
        },
        getQuizList: function() {
            return Object.keys(QuizData).map(key => ({
                key: key,
                title: QuizData[key].title,
                description: QuizData[key].description,
                questionCount: QuizData[key].questions.length
            }));
        }
    };
    
    console.log('[AAA-Quizzes] Module ready');
    
})();
// v20260117-FULL
