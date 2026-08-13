console.log("Auth UI 로드 완료");

// =============================================
// 로그인 / 회원가입 화면
// =============================================

const authScreen = document.getElementById("auth-screen");

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

const authTitle =
    document.getElementById("auth-title");

const goSignupButton =
    document.getElementById("go-signup");

const goLoginButton =
    document.getElementById("go-login");

const authMessage = document.getElementById("auth-message");


// =============================================
// 세이브 화면 요소
// =============================================

const saveScreen = document.getElementById("save-screen");

const newGameButton =
    document.getElementById("new-game-button");

const continueButton =
    document.getElementById("continue-button");

const logoutButton =
    document.getElementById("logout-button");

const saveMessage =
    document.getElementById("save-message");


// =============================================
// 세이브 메뉴 선택 표시
// =============================================

const saveMenuButtons = [
    newGameButton,
    continueButton,
    logoutButton
];

function setActiveMenuButton(targetButton) {
    saveMenuButtons.forEach((button) => {
        button.classList.remove("is-active");
    });

    targetButton.classList.add("is-active");
}

saveMenuButtons.forEach((button) => {
    button.addEventListener("mouseenter", () => {
        if (!button.disabled) {
            setActiveMenuButton(button);
        }
    });

    button.addEventListener("focus", () => {
        if (!button.disabled) {
            setActiveMenuButton(button);
        }
    });
});


// =============================================
// 로그인 화면 표시
// =============================================

function showLogin() {
    loginForm.style.display = "block";
    signupForm.style.display = "none";

    authTitle.textContent = "로그인";

    authMessage.textContent = "";
}


// =============================================
// 회원가입 화면 표시
// =============================================

function showSignup() {
    loginForm.style.display = "none";
    signupForm.style.display = "block";

    authTitle.textContent = "회원가입";

    authMessage.textContent = "";
}


// =============================================
// 새 게임 / 이어하기 화면 표시
// =============================================

async function showSaveScreen() {
    saveScreen.style.display = "flex";
    saveMessage.textContent = "";

    // "이어하기"를 누르면 두 버튼을 잠갔다가 성공 시에는 다시 풀어주지 않았다 -
    // 처음 로그인 직후엔 항상 버튼이 멀쩡한 상태로 시작하니 문제가 없었지만,
    // 이제 엔딩을 본 뒤 게임 도중에 이 화면으로 다시 돌아올 수 있게 되면서
    // (EndingStoryScene.js) 그 상태가 남아있으면 "새 게임" 버튼이 계속 비활성인
    // 채로 굳어버린다. 화면을 열 때마다 항상 눌러도 되는 상태로 리셋한다.
    newGameButton.disabled = false;
    continueButton.disabled = false;

    // 기본 선택은 새 게임
    setActiveMenuButton(newGameButton);

    try {
        const exists = await GameSave.hasSave();

        continueButton.disabled = !exists;

        if (!exists) {
            saveMessage.textContent =
                "저장된 게임이 없습니다.";
        }

    } catch (error) {
        console.error("세이브 확인 실패:", error);

        continueButton.disabled = true;

        saveMessage.textContent =
            "세이브 정보를 확인하지 못했습니다.";
    }
}


// =============================================
// 새 게임
// =============================================

newGameButton.addEventListener(
    "click",
    async () => {
        newGameButton.disabled = true;
        continueButton.disabled = true;

        saveMessage.textContent =
            "새 게임을 준비하는 중...";

        try {
            await GameSave.createNewSave();

            console.log("새 게임 시작");

            saveScreen.style.display = "none";

            // 프롤로그가 아직 재생 중일 수 있다(로그인 화면이 프롤로그를 기다리지
            // 않고 바로 뜨므로). MapScene이 실제로 멈춘 뒤에 resume해야 한다 -
            // 안 그러면 아직 안 멈춘 걸 resume해봤자 아무 효과가 없고, 뒤늦게
            // 컷씬이 끝나면서 멈춰버려 캐릭터가 안 움직이는 것처럼 보인다.
            await window.playPrologueBeforeAuth();
            window.startGame();

        } catch (error) {
            console.error(error);

            saveMessage.textContent =
                "새 게임을 시작하지 못했습니다.";

            newGameButton.disabled = false;
            continueButton.disabled = false;
        }
    }
);


// =============================================
// 이어하기
// =============================================

continueButton.addEventListener(
    "click",
    async () => {
        newGameButton.disabled = true;
        continueButton.disabled = true;

        saveMessage.textContent =
            "세이브를 불러오는 중...";

        try {
            const save =
                await GameSave.loadSave();

            if (!save) {
                saveMessage.textContent =
                    "저장된 게임이 없습니다.";

                newGameButton.disabled = false;
                continueButton.disabled = true;

                return;
            }

            console.log(
                "이어하기 데이터:",
                save
            );

            saveScreen.style.display = "none";

            // 이미 진행 중이던 세이브를 불러오는 거라 오프닝 컷씬을 처음부터 끝까지
            // 다시 볼 필요 없다 - 재생 중이면 즉시 건너뛰고 바로 조작권을 돌려준다.
            await window.skipPrologueAndStart();
            window.startGame();
            window.resumeStoryFromSave();

        } catch (error) {
            console.error(error);

            saveMessage.textContent =
                "세이브를 불러오지 못했습니다.";

            newGameButton.disabled = false;
            continueButton.disabled = false;
        }
    }
);


// =============================================
// 로그아웃
// =============================================

logoutButton.addEventListener(
    "click",
    async () => {
        try {
            await GameAuth.signOut();

            location.reload();

        } catch (error) {
            console.error(error);

            saveMessage.textContent =
                "로그아웃에 실패했습니다.";
        }
    }
);


// =============================================
// 로그인 상태 확인 및 화면 표시
// =============================================
// 별도의 "클릭하여 시작" 화면 없이, 로그인/이어하기 화면을 페이지 로드와 동시에
// 바로 보여준다. 브라우저 오디오 자동재생 정책 때문에 게임(및 배경음악)은 아직
// 시작하지 않고, 이 화면 위에서 첫 클릭이 일어나는 순간(unlockAudioAndStartPrologue)
// 오디오 잠금을 풀면서 게임+프롤로그를 몰래 뒤에서 시작시킨다.

async function initializeAuth() {
    const user = await GameAuth.getCurrentUser();

    if (user) {
        console.log(
            "이미 로그인되어 있음:",
            user.email
        );

        // 다빈치코드 등에서 "나" 대신 실제 닉네임을 보여줄 때 쓴다.
        window.playerNickname = user.user_metadata?.nickname || null;

        authScreen.style.display = "none";

        await showSaveScreen();

        return;
    }

    authScreen.style.display = "flex";

    showLogin();
}

initializeAuth();


// =============================================
// 오디오 잠금 해제. 로그인/이어하기 화면 위에서 첫 클릭(로그인 폼 클릭 포함)이
// 일어나는 순간 딱 한 번만 실행돼서, 그 클릭을 오디오 자동재생 잠금 해제용
// 사용자 입력으로 써서 게임을 켠다. 여기서는 startGame()만 부르고(캔버스+오디오
// 잠금 해제만), 프롤로그를 끝까지 재생할지("새 게임") 건너뛸지("이어하기")는 아직
// 모르므로 playPrologueBeforeAuth()는 부르지 않는다 - 그건 각 버튼 핸들러가 정한다.
// =============================================

let audioUnlocked = false;

function unlockAudioAndStartPrologue() {
    if (audioUnlocked) return;
    audioUnlocked = true;

    document.removeEventListener("pointerdown", unlockAudioAndStartPrologue);

    window.startGame();
}

document.addEventListener("pointerdown", unlockAudioAndStartPrologue);


// =============================================
// 로그인
// =============================================

loginForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const email =
            document.getElementById(
                "login-email"
            ).value;

        const password =
            document.getElementById(
                "login-password"
            ).value;

        authMessage.textContent =
            "로그인 중...";

        try {
            const result = await GameAuth.signIn(
                email,
                password
            );

            window.playerNickname = result?.user?.user_metadata?.nickname || null;

            authMessage.textContent = "";

            authScreen.style.display = "none";

            // 바로 게임 시작 X
            // 새 게임 / 이어하기 화면으로 이동
            await showSaveScreen();

        } catch (error) {
            console.error(error);

            authMessage.textContent =
                "이메일 또는 비밀번호를 확인해주세요.";
        }
    }
);


// =============================================
// 회원가입
// =============================================

signupForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        const email =
            document.getElementById(
                "signup-email"
            ).value;

        const password =
            document.getElementById(
                "signup-password"
            ).value;

        const nickname =
            document.getElementById(
                "signup-nickname"
            ).value;

        authMessage.textContent =
            "회원가입 중...";

        try {
            await GameAuth.signUp(
                email,
                password,
                nickname
            );

            window.playerNickname = nickname;

            authMessage.textContent = "";

            authScreen.style.display = "none";

            // 회원가입 후에도 바로 게임 시작 X
            await showSaveScreen();

        } catch (error) {
            console.error(error);

            authMessage.textContent =
                error.message ||
                "회원가입에 실패했습니다.";
        }
    }
);


// =============================================
// 로그인 / 회원가입 화면 전환
// =============================================

goSignupButton.addEventListener(
    "click",
    showSignup
);

goLoginButton.addEventListener(
    "click",
    showLogin
);
