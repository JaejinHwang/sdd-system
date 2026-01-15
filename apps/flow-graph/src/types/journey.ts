// Journey 뷰 전용 타입 정의 (기획자/디자이너용)

/**
 * 사용자 액션 타입
 * - click: 버튼/링크 클릭
 * - input: 텍스트 입력
 * - swipe: 스와이프 제스처
 * - scroll: 스크롤
 * - navigate: 뒤로가기/탭 이동
 * - system: 시스템 자동 (로딩 완료, 타이머 등)
 * - external: 외부 링크/앱
 */
export type ActionType =
  | 'click'
  | 'input'
  | 'swipe'
  | 'scroll'
  | 'navigate'
  | 'system'
  | 'external';

/**
 * 경로 타입
 */
export type JourneyPathType = 'happy' | 'error' | 'alternative';

/**
 * Journey 화면 노드 (기획자 친화적)
 */
export interface JourneyScreen {
  [key: string]: unknown; // React Flow 호환성을 위한 인덱스 시그니처
  id: string;
  name: string; // "로그인 화면"
  route: string; // "/login"
  description: string;
  thumbnail?: string; // 스크린샷 URL
  features: string[]; // 이 화면에서 수행 가능한 기능들
  featureNames: string[]; // 기능 이름들 (표시용)
  interactions: JourneyInteraction[]; // 화면 내 인터랙션 목록
  order: number; // 플로우 내 순서 (Happy Path 기준)
  isErrorScreen: boolean; // 에러 화면 여부
}

/**
 * 화면 내 인터랙션 (상세 패널용)
 */
export interface JourneyInteraction {
  trigger: string; // "로그인 버튼 클릭"
  action: string; // "서버에 인증 요청"
  feedback: string; // "로딩 표시 후 홈으로 이동"
}

/**
 * 사용자 액션 (화살표)
 */
export interface JourneyAction {
  [key: string]: unknown; // React Flow 호환성을 위한 인덱스 시그니처
  id: string;
  from: string; // 출발 화면 ID
  to: string; // 도착 화면 ID
  actionType: ActionType;
  label: string; // "로그인 버튼 클릭"
  feedback: string; // "홈으로 이동"
  pathType: JourneyPathType;
  condition?: string; // 조건 (있는 경우)
}

/**
 * 시나리오 경로
 */
export interface JourneyPath {
  id: string;
  name: string; // "회원가입 성공 플로우"
  description: string;
  type: JourneyPathType;
  screens: string[]; // 순서대로 화면 ID 배열
  actions: string[]; // 순서대로 액션 ID 배열
  highlightColor: string; // 하이라이트 색상
}

/**
 * Journey 전체 스펙
 */
export interface JourneySpec {
  screens: JourneyScreen[];
  actions: JourneyAction[];
  paths: JourneyPath[];
}

/**
 * 재생 상태
 */
export interface JourneyPlaybackState {
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  playbackSpeed: number; // 0.5, 1, 1.5, 2
  activePath: JourneyPath | null;
  activeScreenId: string | null;
  activeActionId: string | null;
}

/**
 * Journey Store 상태
 */
export interface JourneyStoreState {
  // 데이터
  journeySpec: JourneySpec | null;
  isLoading: boolean;
  error: string | null;

  // 선택 상태
  selectedScreenId: string | null;
  selectedActionId: string | null;
  selectedPathId: string | null;

  // 재생 상태
  playback: JourneyPlaybackState;
}

/**
 * 액션 타입별 아이콘 매핑
 */
export const ACTION_TYPE_ICONS: Record<ActionType, string> = {
  click: '👆',
  input: '⌨️',
  swipe: '👈',
  scroll: '📜',
  navigate: '🔙',
  system: '⚡',
  external: '🔗',
};

/**
 * 액션 타입별 한글 라벨
 */
export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  click: '클릭',
  input: '입력',
  swipe: '스와이프',
  scroll: '스크롤',
  navigate: '이동',
  system: '시스템',
  external: '외부',
};

/**
 * 경로 타입별 색상
 */
export const PATH_TYPE_COLORS: Record<JourneyPathType, string> = {
  happy: '#22c55e', // green-500
  error: '#ef4444', // red-500
  alternative: '#f97316', // orange-500
};
