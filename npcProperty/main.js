let blueman = App.loadSpritesheet('blueman.png', 48, 64, {
    left: [5, 6, 7, 8, 9], // 좌방향 이동 이미지
    up: [15, 16, 17, 18, 19],
    down: [0, 1, 2, 3, 4],
    right: [10, 11, 12, 13, 14],
    dance: [20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37],
    down_jump: [38],
    left_jump: [39],
    right_jump: [40],
    up_jump: [41],
}, 8);
// q 키를 누르면 동작하는 함수
App.addOnKeyDown(81, function (player) {
    const objectKey = "TestBlueMan";
	const bluemanObject = Map.putObjectWithKey(18, 6, blueman, {
		npcProperty: { name: "BlueMan", hpColor: 0x03ff03, hp: 100, hpMax: 100 },
		overlap: true,
		movespeed: 100, // 이동속도, 기본값: 80
		key: objectKey, // 키 값
		useDirAnim: true // 방향을 인지해서 애니메이션을 재생하는 옵션
	});

    Map.playObjectAnimationWithKey(objectKey, "down", -1);
});