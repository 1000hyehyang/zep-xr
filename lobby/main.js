// 히스토리아 로비 시스템

// 게임 설정
const REQUIRED_PLAYERS = 6; // 게임 시작에 필요한 플레이어 수
const COUNTDOWN_TIME = 10;  // 게임 시작 카운트다운 시간

// 로비 상태
let _lobbyPlayers = [];
let _gameStartCountdown = 0;
let _isCountdownActive = false;
let _gameStarted = false;

// 로비 시스템 초기화
const initLobby = () => {
    _lobbyPlayers = [];
    _gameStartCountdown = 0;
    _isCountdownActive = false;
    _gameStarted = false;
    
    App.showCenterLabel("히스토리아 로비에 오신 것을 환영합니다!\n6명이 모이면 자동으로 게임이 시작됩니다.");
};

// 게임 시작 카운트다운 시작
const startGameCountdown = () => {
    if (_isCountdownActive) return;
    
    _isCountdownActive = true;
    _gameStartCountdown = COUNTDOWN_TIME;
    
    App.showCenterLabel(`게임 시작까지 ${_gameStartCountdown}초 남았습니다!`);
};

// 모든 플레이어를 게임 맵으로 이동
const moveAllPlayersToGame = () => {
    for (let i in _lobbyPlayers) {
        let player = _lobbyPlayers[i];
        // 게임 맵으로 이동
        player.spawnAtMap(App.spaceHashID, 'Gpqmeg');
    }
};

// 로비 업데이트
const updateLobby = (dt) => {
    if (_gameStarted) return;
    
    // 플레이어 수 업데이트
    _lobbyPlayers = App.players;
    
    // 6명이 모이면 카운트다운 시작
    if (_lobbyPlayers.length >= REQUIRED_PLAYERS && !_isCountdownActive) {
        startGameCountdown();
    }
    
    // 6명 미만이면 카운트다운 중단
    if (_lobbyPlayers.length < REQUIRED_PLAYERS && _isCountdownActive) {
        _isCountdownActive = false;
        App.showCenterLabel("플레이어가 부족합니다. 6명이 모이면 게임이 시작됩니다.");
    }
    
    // 카운트다운 진행
    if (_isCountdownActive) {
        _gameStartCountdown -= dt;
        
        if (_gameStartCountdown <= 0) {
            _gameStarted = true;
            moveAllPlayersToGame();
            return;
        }
        
        // 5초, 3초, 1초 남았을 때 메시지 표시
        if (_gameStartCountdown <= 5 && _gameStartCountdown > 4) {
            App.showCenterLabel("게임 시작까지 5초 남았습니다!");
        } else if (_gameStartCountdown <= 3 && _gameStartCountdown > 2) {
            App.showCenterLabel("게임 시작까지 3초 남았습니다!");
        } else if (_gameStartCountdown <= 1 && _gameStartCountdown > 0) {
            App.showCenterLabel("게임 시작까지 1초 남았습니다!");
        }
    }
    
    // 로비 상태 표시
    if (!_isCountdownActive) {
        App.showCenterLabel(`히스토리아 로비\n현재 ${_lobbyPlayers.length}/${REQUIRED_PLAYERS}명\n6명이 모이면 게임이 시작됩니다!`);
    }
};

// 앱 시작
App.onStart.Add(function(){
    initLobby();
});

// 플레이어 입장
App.onJoinPlayer.Add(function(p) {
    _lobbyPlayers = App.players;
});

// 플레이어 퇴장
App.onLeavePlayer.Add(function(p) {
    _lobbyPlayers = App.players;
});

// 앱 종료
App.onDestroy.Add(function() {
    // 로비에서는 특별한 정리 작업 없음
});

// 메인 업데이트
App.onUpdate.Add(function(dt) {
    updateLobby(dt);
}); 