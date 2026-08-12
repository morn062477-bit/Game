// =============================================
// 게임 세이브 시스템
// =============================================

const INITIAL_SAVE_DATA = {
    saveVersion: 2,

    currentMapId: null,

    player: {
        x: 0,
        y: 0,
        direction: "down"
    },

    introCompleted: false,

    // =============================================
    // 용의자 5명 조사 진행도
    // MapScene에서 실제 사용하는 npc id와 동일하게 맞춘다.
    // wife / hunter / farmer / painter / fisher
    // =============================================
    suspects: {
        wife: {
            talked: false,
            selectedQuestion: null,
            matchWon: false,
            clueObtained: false
        },

        hunter: {
            talked: false,
            selectedQuestion: null,
            matchWon: false,
            clueObtained: false
        },

        farmer: {
            talked: false,
            selectedQuestion: null,
            matchWon: false,
            clueObtained: false
        },

        painter: {
            talked: false,
            selectedQuestion: null,
            matchWon: false,
            clueObtained: false
        },

        fisher: {
            talked: false,
            selectedQuestion: null,
            matchWon: false,
            clueObtained: false
        }
    },

    // =============================================
    // 일반 시민 조사 진행도
    // =============================================
    citizens: {
        farmerDaughter: {
            talked: false
        },

        frogChild: {
            talked: false
        },

        nun: {
            talked: false
        },

        herbalist: {
            talked: false
        }
    },

    // 현장에서 얻은 단서
    fieldClues: [],

    // 용의자 조사 / 미니게임 등으로 얻은 단서
    rewardClues: [],

    // =============================================
    // 최종 추리
    // =============================================
    finalDeductionUnlocked: false,

    // 플레이어가 최종 추리에서 선택한 답
    finalDeduction: null,

    // =============================================
    // 엔딩 스토리 진행 상태
    // =============================================

    story: {

        // 현재 스토리 진행 단계
        // investigation
        // final_gather
        // final_deduction
        // farmer_escape
        // hidden_forest
        // confession
        // ending
        phase: "investigation",

        // 5명 조사 완료 후 마을 집합 이벤트가
        // 한 번만 실행되도록 확인하는 값
        finalGatherPlayed: false,

        // 농부 랜턴 상태
        // unfound = 아직 확보 전
        // dead = 불이 안 들어오는 상태
        // lit = 배터리를 넣어 켜진 상태
        farmerLantern: "unfound",

        // 마지막 조사에서 배터리를 얻었는지
        batteryObtained: false,

        // 숲 안쪽 숨겨진 길이 열렸는지
        hiddenForestUnlocked: false,

        // 이장의 몸통 시체를 발견했는지
        bodyFound: false,

        // TRUE END용 화가 은폐 단서
        painterCoverup: {
            bloodyTowel: false,
            redPigment: false,
            alibiGap: false,
            farmerRelationship: false
        }
    },

        // null / bad / normal / true
        ending: null
};


// =============================================
// 현재 브라우저에서 사용 중인 세이브 상태
// =============================================

const saveState = {
    data: structuredClone(INITIAL_SAVE_DATA),
    playTime: 0
};


// =============================================
// 현재 로그인 사용자 확인
// =============================================

async function getLoggedInUser() {
    const user = await window.GameAuth.getCurrentUser();

    if (!user) {
        throw new Error("로그인이 필요합니다.");
    }

    return user;
}


// =============================================
// 로컬 세이브 상태 초기화
// =============================================

function resetSaveState() {
    saveState.data = structuredClone(INITIAL_SAVE_DATA);
    saveState.playTime = 0;
}


// =============================================
// 세이브가 존재하는지 확인
// =============================================

async function hasSave() {
    const user = await getLoggedInUser();

    const { data, error } = await window.GameSupabase
        .from("saves")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("세이브 확인 실패:", error);
        throw error;
    }

    return data !== null;
}


// =============================================
// 새 게임 세이브 생성
// =============================================

async function createNewSave() {
    const user = await getLoggedInUser();

    resetSaveState();

    const { error } = await window.GameSupabase
        .from("saves")
        .upsert(
            {
                user_id: user.id,
                play_time: saveState.playTime,
                save_data: saveState.data,
                updated_at: new Date().toISOString()
            },
            {
                onConflict: "user_id"
            }
        );

    if (error) {
        console.error("새 세이브 생성 실패:", error);
        throw error;
    }

    console.log("새 세이브 생성 완료");

    return saveState.data;
}


// =============================================
// 세이브 불러오기
// =============================================

async function loadSave() {
    const user = await getLoggedInUser();

    const { data, error } = await window.GameSupabase
        .from("saves")
        .select("play_time, save_data")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("세이브 불러오기 실패:", error);
        throw error;
    }

    // 아직 저장 데이터가 없는 사용자
    if (!data) {
        console.log("저장된 세이브가 없습니다.");
        return null;
    }

    saveState.playTime = data.play_time ?? 0;

    saveState.data =
        data.save_data ??
        structuredClone(INITIAL_SAVE_DATA);

    console.log("세이브 불러오기 완료:", saveState.data);

    return {
        playTime: saveState.playTime,
        saveData: saveState.data
    };
}


// =============================================
// 현재 진행 상황 저장
// =============================================

async function saveGame() {
    const user = await getLoggedInUser();

    const { error } = await window.GameSupabase
        .from("saves")
        .upsert(
            {
                user_id: user.id,
                play_time: saveState.playTime,
                save_data: saveState.data,
                updated_at: new Date().toISOString()
            },
            {
                onConflict: "user_id"
            }
        );

    if (error) {
        console.error("게임 저장 실패:", error);
        throw error;
    }

    console.log("게임 저장 완료");
}


// =============================================
// 다른 JS 파일에서 사용
// =============================================

window.GameSave = {
    state: saveState,

    initialSaveData: INITIAL_SAVE_DATA,

    resetSaveState,

    hasSave,
    createNewSave,
    loadSave,
    saveGame
};

console.log("Save manager 로드 완료");
