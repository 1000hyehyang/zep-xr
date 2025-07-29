// CSV 파일 URL (GitHub Pages 등에 업로드된 영단어 CSV 파일)
const VOCAB_CSV_URL = "https://raw.githubusercontent.com/1000hyehyang/zep-xr/main/elementary_english_word.csv";

// 퀴즈 데이터를 저장할 변수
let vocabData = [];
let currentQuiz = null;
let quizScores = {};
let quizTimer = null;
let quizInterval = 30000; // 30초마다 퀴즈 시작

// 앱 시작 시 영단어 데이터 로드
App.onStart.Add(function() {
    loadVocabData();
});

// 영단어 CSV 데이터 로드 함수
function loadVocabData() {
    App.httpGet(VOCAB_CSV_URL, {}, function(response) {
        vocabData = parseVocabCSV(response);
        App.sayToAll(`영단어 데이터 로드 완료! 총 ${vocabData.length}개의 단어를 불러왔습니다.`);
        
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

// 자동 퀴즈 시작 함수
function startAutoQuiz() {
    if (quizTimer) {
        clearInterval(quizTimer);
    }
    
    // 30초마다 퀴즈 시작
    quizTimer = setInterval(function() {
        if (vocabData.length > 0 && !currentQuiz) {
            startQuiz();
        }
    }, quizInterval);
    
    // 첫 번째 퀴즈는 10초 후 시작
    setTimeout(function() {
        if (vocabData.length > 0) {
            startQuiz();
        }
    }, 10000);
}

// 퀴즈 시작 함수
function startQuiz() {
    if (currentQuiz) return; // 이미 퀴즈가 진행 중이면 시작하지 않음
    
    currentQuiz = generateQuiz();
    
    App.sayToAll("📝 새로운 퀴즈가 시작됩니다!", 0x00FF00);
    App.sayToAll(`문제: "${currentQuiz.question}"의 영어 단어는?`, 0xFFFFFF);
    App.sayToAll("정확한 영어 단어를 채팅으로 입력해주세요!", 0x00FFFF);
    
    // 15초 후 정답 공개
    setTimeout(function() {
        if (currentQuiz) {
            App.sayToAll("⏰ 시간이 종료되었습니다!", 0xFF0000);
            App.sayToAll(`정답: ${currentQuiz.correctAnswer}`, 0x00FF00);
            currentQuiz = null;
        }
    }, 15000);
}

// 랜덤 퀴즈 생성 함수
function generateQuiz() {
    if (vocabData.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * vocabData.length);
    const correctWord = vocabData[randomIndex];
    
    return {
        question: correctWord.meaning,
        correctAnswer: correctWord.word.toLowerCase() // 소문자로 비교
    };
}

// 플레이어가 입장할 때 퀴즈 시스템 소개
App.onJoinPlayer.Add(function(player) {
    player.sendMessage("🎓 영단어 퀴즈 시스템에 오신 것을 환영합니다!", 0x00FF00);
    player.sendMessage("30초마다 자동으로 퀴즈가 시작됩니다!", 0xFFFF00);
    player.sendMessage("2: 점수 확인 | 3: 순위 확인", 0xFFFF00);
    
    // 플레이어 점수 초기화
    quizScores[player.id] = { correct: 0, total: 0 };
});

// 2 키를 눌러 점수 확인
App.addOnKeyDown(50, function(player) {
    const score = quizScores[player.id];
    if (score) {
        const percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
        player.sendMessage(`📊 ${player.name}님의 퀴즈 점수:`, 0x00FF00);
        player.sendMessage(`정답: ${score.correct}개 / 총 문제: ${score.total}개`, 0xFFFFFF);
        player.sendMessage(`정답률: ${percentage}%`, 0xFFFF00);
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
                percentage: score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
            };
        })
        .sort((a, b) => b.correct - a.correct);
    
    player.sendMessage("🏆 전체 점수 순위:", 0x00FF00);
    sortedScores.forEach((score, index) => {
        if (index < 5) { // 상위 5명만 표시
            player.sendMessage(`${index + 1}. ${score.name}: ${score.correct}개 (${score.percentage}%)`, 0xFFFFFF);
        }
    });
});

// 채팅으로 답변 처리
App.onSay.Add(function(player, text) {
    if (!currentQuiz) return;
    
    const userAnswer = text.trim().toLowerCase(); // 소문자로 변환
    const correctAnswer = currentQuiz.correctAnswer;
    
    // 점수 업데이트
    if (!quizScores[player.id]) {
        quizScores[player.id] = { correct: 0, total: 0 };
    }
    quizScores[player.id].total++;
    
    if (userAnswer === correctAnswer) {
        quizScores[player.id].correct++;
        App.sayToAll(`🎉 ${player.name}님이 정답을 맞췄습니다!`, 0x00FF00);
        App.sayToAll(`정답: ${correctAnswer}`, 0x00FF00);
    } else {
        App.sayToAll(`❌ ${player.name}님의 답이 틀렸습니다.`, 0xFF0000);
        App.sayToAll(`정답: ${correctAnswer}`, 0x00FF00);
    }
    
    currentQuiz = null; // 퀴즈 종료
}); 