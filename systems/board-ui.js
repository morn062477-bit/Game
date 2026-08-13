console.log("Board UI 로드 완료");

// =============================================
// 마을 게시판 화면
// 맵에 있는 게시판(가로등 옆 우체통 모양 오브젝트)에 다가가 스페이스를 누르면
// MapScene.openVillageBoard()가 이 화면을 연다. 클리어한 사람이 이름/코멘트를
// 남기고, 플레이 시간은 세이브에 기록된 값을 그대로 붙여서(직접 입력 X, 조작 방지) 같이 저장한다.
// =============================================

const boardScreen = document.getElementById("board-screen");
const boardList = document.getElementById("board-list");
const boardForm = document.getElementById("board-form");
const boardNameInput = document.getElementById("board-name");
const boardCommentInput = document.getElementById("board-comment");
const boardPlayTimeDisplay = document.getElementById("board-playtime-display");
const boardCloseButton = document.getElementById("board-close");
const boardMessage = document.getElementById("board-message");

// 게시판을 닫을 때 MapScene에 알려서 캐릭터 조작을 다시 풀어주기 위한 콜백
let onBoardCloseCallback = null;

// 폼 제출 시 같이 저장할 현재 플레이 시간(초). openBoard()를 열 때 한 번 읽어서 고정한다.
let currentPlayTimeSeconds = 0;


// =============================================
// 표시 형식 변환
// =============================================

function formatPlayTime(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds || 0));

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const pad = (n) => String(n).padStart(2, "0");

    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function formatDate(isoString) {
    const date = new Date(isoString);

    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}


// =============================================
// 게시글 목록 렌더링
// =============================================

function renderBoardPosts(posts) {
    boardList.innerHTML = "";

    if (!posts || posts.length === 0) {
        const empty = document.createElement("li");
        empty.id = "board-empty";
        empty.textContent = "아직 남겨진 글이 없습니다. 첫 번째 게시글을 남겨보세요.";

        boardList.appendChild(empty);
        return;
    }

    posts.forEach((post) => {
        const item = document.createElement("li");
        item.className = "board-post";

        const head = document.createElement("div");
        head.className = "board-post-head";

        const name = document.createElement("span");
        name.className = "board-post-name";
        name.textContent = post.name;

        const time = document.createElement("span");
        time.className = "board-post-time";
        time.textContent =
            post.play_time != null
                ? `클리어 시간 ${formatPlayTime(post.play_time)}`
                : "";

        head.appendChild(name);
        head.appendChild(time);

        const comment = document.createElement("p");
        comment.className = "board-post-comment";
        comment.textContent = post.comment;

        const date = document.createElement("span");
        date.className = "board-post-date";
        date.textContent = formatDate(post.created_at);

        item.appendChild(head);
        item.appendChild(comment);
        item.appendChild(date);

        boardList.appendChild(item);
    });
}


// =============================================
// 게시글 불러오기
// =============================================

async function loadBoardPosts() {
    boardMessage.textContent = "불러오는 중...";

    const { data, error } = await window.GameSupabase
        .from("board_posts")
        .select("name, play_time, comment, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("게시판 불러오기 실패:", error);
        boardMessage.textContent = "게시글을 불러오지 못했습니다.";
        return;
    }

    boardMessage.textContent = "";
    renderBoardPosts(data);
}


// =============================================
// 게시판 열기 / 닫기
// =============================================

function openBoard(onClose) {
    onBoardCloseCallback = onClose || null;

    currentPlayTimeSeconds = window.GameSave?.state?.playTime || 0;
    boardPlayTimeDisplay.textContent =
        `내 플레이 시간: ${formatPlayTime(currentPlayTimeSeconds)}`;

    boardNameInput.value = window.playerNickname || "";
    boardCommentInput.value = "";
    boardMessage.textContent = "";

    boardScreen.style.display = "flex";

    loadBoardPosts();
}

function closeBoard() {
    boardScreen.style.display = "none";

    const callback = onBoardCloseCallback;
    onBoardCloseCallback = null;

    callback?.();
}

boardCloseButton.addEventListener("click", closeBoard);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && boardScreen.style.display !== "none") {
        closeBoard();
    }
});


// =============================================
// 게시글 등록
// =============================================

boardForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = boardNameInput.value.trim();
    const comment = boardCommentInput.value.trim();

    if (!name || !comment) return;

    boardMessage.textContent = "등록하는 중...";

    const { error } = await window.GameSupabase
        .from("board_posts")
        .insert({
            name,
            play_time: currentPlayTimeSeconds,
            comment
        });

    if (error) {
        console.error("게시글 등록 실패:", error);
        boardMessage.textContent = "게시글 등록에 실패했습니다.";
        return;
    }

    boardCommentInput.value = "";

    await loadBoardPosts();
});


// =============================================
// 다른 JS(MapScene)에서 사용
// =============================================

window.GameBoard = {
    openBoard,
    closeBoard
};
