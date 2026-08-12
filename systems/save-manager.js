// =============================================
// 게임 세이브 시스템
// =============================================

const INITIAL_SAVE_DATA = {
    saveVersion: 1,

    currentMapId: null,

    player: {
        x: 0,
        y: 0,
        direction: "down"
    },

    introCompleted: false,

    suspects: {
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

        cartoonist: {
            talked: false,
            selectedQuestion: null,
            matchWon: false,
            clueObtained: false
        },

        fisherman: {
            talked: false,
            selectedQuestion: null,
            matchWon: false,
            clueObtained: false
        },

        chiefWife: {
            talked: false,
            selectedQuestion: null,
            matchWon: false,
            clueObtained: false
        }
    },

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

    fieldClues: [],

    rewardClues: [],

    finalDeductionUnlocked: false,

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