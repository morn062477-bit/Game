// GitHub Pages는 프로젝트 저장소를 https://<사용자>.github.io/<저장소명>/ 형태의
// 하위 경로에서 서빙한다. base를 저장소 이름과 맞춰줘야 빌드된 JS/에셋 경로가
// 깨지지 않는다. 로컬 개발(npm run dev)에는 영향 없음.
export default {
  base: '/Game/',
};
