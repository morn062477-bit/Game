// =============================================
// 게임 회원가입 / 로그인 관리
// =============================================

const authSupabase = window.GameSupabase;


// =============================================
// 회원가입
// email + password + nickname
// =============================================

async function signUp(email, password, nickname) {
    if (!email || !password || !nickname) {
        throw new Error("이메일, 비밀번호, 닉네임을 모두 입력해주세요.");
    }

    if (nickname.length < 1 || nickname.length > 20) {
        throw new Error("닉네임은 1자 이상 20자 이하로 입력해주세요.");
    }

    const { data, error } = await authSupabase.auth.signUp({
        email: email,
        password: password,

        options: {
            data: {
                nickname: nickname
            }
        }
    });

    if (error) {
        console.error("회원가입 실패:", error);
        throw error;
    }

    console.log("회원가입 성공:", data.user);

    return data;
}


// =============================================
// 로그인
// =============================================

async function signIn(email, password) {
    if (!email || !password) {
        throw new Error("이메일과 비밀번호를 입력해주세요.");
    }

    const { data, error } =
        await authSupabase.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (error) {
        console.error("로그인 실패:", error);
        throw error;
    }

    console.log("로그인 성공:", data.user);

    return data;
}


// =============================================
// 로그아웃
// =============================================

async function signOut() {
    const { error } = await authSupabase.auth.signOut();

    if (error) {
        console.error("로그아웃 실패:", error);
        throw error;
    }

    console.log("로그아웃 성공");
}


// =============================================
// 현재 로그인 사용자 확인
// =============================================

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await authSupabase.auth.getUser();

    if (error) {
        console.error("사용자 확인 실패:", error);
        return null;
    }

    return user;
}


// =============================================
// 다른 JS에서도 사용할 수 있도록 등록
// =============================================

window.GameAuth = {
    signUp,
    signIn,
    signOut,
    getCurrentUser
};

console.log("Auth manager 로드 완료");