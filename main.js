// 간단한 영단어 퀴즈 시스템
// CSV 형식: word,meaning
// 예시: apple,사과

// CSV 파일 URL (GitHub Pages 등에 업로드된 영단어 CSV 파일)
const VOCAB_CSV_URL = "https://raw.githubusercontent.com/1000hyehyang/zep-xr/main/elementary_english_word.csv";

// 퀴즈 데이터를 저장할 변수
let vocabData = [];
let currentQuiz = null;
let quizScores = {};
let quizTimer = null;
let quizInterval = 5000; // 5초마다 퀴즈 시작
let quizStartTime = 0;
let answeredPlayers = new Set(); // 답변한 플레이어들 추적
let correctAnswers = []; // 정답자들 기록 (시간순)
let uploadWidget = null; // 파일 업로드 위젯

// 앱 시작 시 영단어 데이터 로드
App.onStart.Add(function() {
    loadVocabData();
});

// 영단어 CSV 데이터 로드 함수
function loadVocabData() {
    App.httpGet(VOCAB_CSV_URL, {}, function(response) {
        vocabData = parseVocabCSV(response);
        App.showCenterLabel(`영단어 데이터 로드 완료! 총 ${vocabData.length}개의 단어를 불러왔습니다.`, 0x00FF00);
        
        // 데이터 로드 완료 후 자동 퀴즈 시작
        startAutoQuiz();
    });
}

// 영단어 CSV 파싱 함수 (간단한 형식)
function parseVocabCSV(csvText) {
    const lines = csvText.split('\n');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) { // 헤더 제외
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(',').map(value => value.trim());
        if (values.length >= 2) {
            data.push({
                word: values[0],
                meaning: values[1]
            });
        }
    }
    
    return data;
}

// CSV 파일 업로드 처리 함수
function handleCSVUpload(csvText, filename) {
    try {
        const parsedData = parseVocabCSV(csvText);
        
        if (parsedData.length === 0) {
            return { success: false, message: "CSV 데이터가 올바르지 않습니다." };
        }
        
        // Storage에 저장
        const dataToStore = {
            vocabData: parsedData,
            lastUpdated: Date.now(),
            uploadedBy: filename,
            source: "upload"
        };
        App.setStorage(JSON.stringify(dataToStore));
        
        // 전역 변수 업데이트
        vocabData = parsedData;
        
        App.sayToAll(`📚 ${parsedData.length}개의 단어가 업로드되었습니다!`, 0x00FF00);
        
        // 현재 퀴즈가 진행 중이면 종료 후 새 퀴즈 시작
        if (currentQuiz) {
            currentQuiz = null;
            setTimeout(function() {
                startQuiz();
            }, 2000);
        } else {
            startQuiz();
        }
        
        return { success: true, message: "업로드 성공!" };
        
    } catch (error) {
        return { success: false, message: "CSV 파싱 중 오류가 발생했습니다." };
    }
}

// 자동 퀴즈 시작 함수
function startAutoQuiz() {
    if (quizTimer) {
        clearInterval(quizTimer);
    }
    
    // 5초마다 퀴즈 시작
    quizTimer = setInterval(function() {
        if (vocabData.length > 0 && !currentQuiz) {
            startQuiz();
        }
    }, quizInterval);
    
    // 첫 번째 퀴즈는 3초 후 시작
    setTimeout(function() {
        if (vocabData.length > 0) {
            startQuiz();
        }
    }, 3000);
}

// 퀴즈 시작 함수
function startQuiz() {
    if (currentQuiz) return; // 이미 퀴즈가 진행 중이면 시작하지 않음
    
    currentQuiz = generateQuiz();
    answeredPlayers.clear();
    correctAnswers = []; // 정답자 리스트 초기화
    
    // 순차적으로 메시지 표시
    App.sayToAll("📝 새로운 퀴즈가 시작됩니다!", 0x00FF00);
    
    // 1초 후 문제 표시
    setTimeout(function() {
        App.showCenterLabel(`문제: ${currentQuiz.question}`, 0xFFFFFF);
        
        // 문제가 나온 후부터 카운트 시작
        quizStartTime = Date.now();
        
        // 10초 후 정답 공개 및 점수 분배 (문제 표시 후부터 카운트)
        setTimeout(function() {
            if (currentQuiz) {
                App.sayToAll("⏰ 시간이 종료되었습니다!", 0xFF0000);
                App.showCenterLabel(`정답: ${currentQuiz.correctAnswer}`, 0x00FF00);
                
                // 정답자들에게 차등 점수 분배
                distributeScores();
                
                currentQuiz = null;
                
                // 다음 퀴즈 타이머 재설정
                setTimeout(function() {
                    if (vocabData.length > 0) {
                        startQuiz();
                    }
                }, 2000); // 2초 후 다음 퀴즈
            }
        }, 10000);
        
    }, 1000);
}

// 퀴즈 생성 함수
function generateQuiz() {
    if (vocabData.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * vocabData.length);
    const vocab = vocabData[randomIndex];
    
    // 문제 유형 랜덤 선택 (fill_blank 제거)
    const quizTypes = ['korean_to_english', 'english_to_korean'];
    const selectedType = quizTypes[Math.floor(Math.random() * quizTypes.length)];
    
    let question, correctAnswer;
    
    switch(selectedType) {
        case 'korean_to_english':
            question = `"${vocab.meaning}"의 영어 단어는?`;
            correctAnswer = vocab.word.toLowerCase();
            break;
        case 'english_to_korean':
            question = `"${vocab.word}"의 뜻은?`;
            correctAnswer = vocab.meaning.toLowerCase();
            break;
    }
    
    return {
        question: question,
        correctAnswer: correctAnswer,
        type: selectedType,
        originalWord: vocab.word,
        originalMeaning: vocab.meaning
    };
}

// 점수 계산 함수
function calculateScore(answerTime) {
    const timeElapsed = answerTime - quizStartTime;
    const maxTime = 10000; // 10초
    
    if (timeElapsed <= 2000) return 100; // 2초 이내: 100점
    if (timeElapsed <= 4000) return 80;  // 4초 이내: 80점
    if (timeElapsed <= 6000) return 60;  // 6초 이내: 60점
    if (timeElapsed <= 8000) return 40;  // 8초 이내: 40점
    if (timeElapsed <= 10000) return 20; // 10초 이내: 20점
    return 0; // 시간 초과: 0점
}

// 점수 분배 함수
function distributeScores() {
    if (correctAnswers.length === 0) return;
    
    // 시간순으로 정렬
    correctAnswers.sort((a, b) => a.time - b.time);
    
    // 점수 분배 (1등: 100점, 2등: 80점, 3등: 60점, 4등: 40점)
    const scoreDistribution = [100, 80, 60, 40];
    
    correctAnswers.forEach((answer, index) => {
        const score = index < scoreDistribution.length ? scoreDistribution[index] : 20;
        
        // 플레이어 점수 업데이트
        if (!quizScores[answer.playerId]) {
            quizScores[answer.playerId] = { correct: 0, total: 0, totalScore: 0 };
        }
        
        quizScores[answer.playerId].correct++;
        quizScores[answer.playerId].total++;
        quizScores[answer.playerId].totalScore += score;
        
        // 정답자에게 개인 메시지
        const player = App.getPlayerByID(answer.playerId);
        if (player) {
            player.sendMessage(`🎉 ${index + 1}등! +${score}점 획득!`);
        }
    });
    
    // 전체 알림
    if (correctAnswers.length > 0) {
        const firstPlayer = App.getPlayerByID(correctAnswers[0].playerId);
        if (firstPlayer) {
            App.sayToAll(`🏆 ${firstPlayer.name}님이 1등으로 정답을 맞추셨습니다!`, 0x00FF00);
        }
    }
}

// 플레이어가 입장할 때 퀴즈 시스템 소개
App.onJoinPlayer.Add(function(player) {
    player.sendMessage("🎓 영단어 퀴즈 시스템에 오신 것을 환영합니다!");
    player.sendMessage("5초마다 자동으로 퀴즈가 시작됩니다!");
    player.sendMessage("2: 점수 확인 | 3: 순위 확인 | 4: CSV 파일 업로드");
    
    // 플레이어 점수 초기화
    quizScores[player.id] = { correct: 0, total: 0, totalScore: 0 };
});

// 2 키를 눌러 점수 확인
App.addOnKeyDown(50, function(player) {
    const score = quizScores[player.id];
    if (score) {
        const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
        const averageScore = score.total > 0 ? Math.round(score.totalScore / score.total) : 0;
        player.sendMessage(`📊 ${player.name}님의 퀴즈 점수:`);
        player.sendMessage(`정답: ${score.correct}개 / 총 문제: ${score.total}개`);
        player.sendMessage(`정답률: ${percentage}%`);
        player.sendMessage(`평균 점수: ${averageScore}점`);
    }
});

// 3 키를 눌러 전체 점수 순위 확인
App.addOnKeyDown(51, function(player) {
    const sortedScores = Object.entries(quizScores)
        .map(([playerId, score]) => {
            const player = App.getPlayerByID(playerId);
            return {
                name: player ? player.name : "Unknown",
                correct: score.correct,
                total: score.total,
                totalScore: score.totalScore,
                percentage: score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0,
                averageScore: score.total > 0 ? Math.round(score.totalScore / score.total) : 0
            };
        })
        .sort((a, b) => b.totalScore - a.totalScore); // 총점으로 정렬
    
    player.sendMessage("🏆 전체 점수 순위:");
    sortedScores.forEach((score, index) => {
        if (index < 5) { // 상위 5명만 표시
            player.sendMessage(`${index + 1}. ${score.name}: ${score.totalScore}점 (${score.correct}개 정답, 평균 ${score.averageScore}점)`);
        }
    });
});

// 오브젝트와 상호작용하여 파일 업로드 위젯 열기
App.onObjectTouched.Add(function(player, x, y, tileID, obj) {
    if (obj !== null) {
        if (obj.type === 21) { // INTERACTION_WITH_ZEPSCRIPTS
            // Number 값이 1인 경우에만 위젯 열기
            if (obj.text === "1") {
                if (uploadWidget) {
                    uploadWidget.destroy();
                }
                
                // 위젯 위치 설정 (Value 값으로 위치 조정 가능)
                let widgetPosition = "middle"; // center 대신 middle 사용
                if (obj.param1 === "top") widgetPosition = "top";
                else if (obj.param1 === "bottom") widgetPosition = "bottom";
                else if (obj.param1 === "middleleft") widgetPosition = "middleleft";
                else if (obj.param1 === "middleright") widgetPosition = "middleright";
                else if (obj.param1 === "topleft") widgetPosition = "topleft";
                else if (obj.param1 === "topright") widgetPosition = "topright";
                else if (obj.param1 === "bottomleft") widgetPosition = "bottomleft";
                else if (obj.param1 === "bottomright") widgetPosition = "bottomright";
                else if (obj.param1 === "popup") widgetPosition = "popup";
                else if (obj.param1 === "sidebar") widgetPosition = "sidebar";
                
                uploadWidget = player.showWidget("file_upload.html", widgetPosition, 600, 500);
                
                // 위젯 메시지 처리
                uploadWidget.onMessage.Add(function(player, data) {
                    if (data.type === 'csv_upload') {
                        const result = handleCSVUpload(data.data, data.filename);
                        uploadWidget.sendMessage({
                            type: 'upload_result',
                            success: result.success,
                            message: result.message
                        });
                    } else if (data.type === 'close_widget') {
                        uploadWidget.destroy();
                        uploadWidget = null;
                    }
                });
                
                App.sayToAll(`${player.name}님이 파일 업로드 위젯을 열었습니다.`, 0x00FF00);
            }
        }
    }
});

// 채팅 입력 처리
App.onSay.Add(function(player, text) {
    if (!currentQuiz) return;
    
    const playerId = player.id;
    const answer = text.toLowerCase().trim();
    
    // 이미 정답을 맞춘 플레이어는 중복 답변 방지
    const alreadyCorrect = correctAnswers.some(correct => correct.playerId === playerId);
    if (alreadyCorrect) {
        player.sendMessage("이미 정답을 맞추셨습니다!");
        return;
    }
    
    // 정답 체크
    if (answer === currentQuiz.correctAnswer.toLowerCase()) {
        const answerTime = Date.now();
        const score = calculateScore(answerTime);
        
        // 정답자 목록에 추가
        correctAnswers.push({
            playerId: playerId,
            playerName: player.name,
            time: answerTime,
            score: score
        });
        
        player.sendMessage(`🎉 정답입니다! +${score}점 획득!`);
        App.sayToAll(`${player.name}님이 정답을 맞추셨습니다!`, 0x00FF00);
        
    } else {
        // 틀린 답변 - 시간 내에 다시 시도 가능
        player.sendMessage("❌ 틀렸습니다. 다시 시도해보세요!");
    }
}); 