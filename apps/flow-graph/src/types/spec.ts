// functional-spec.yaml 타입
export interface FunctionalSpec {
  functional_spec: {
    features: Feature[];
  };
  metadata: SpecMetadata;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  parent_story: string;
  dependencies: string[];
  clarifications?: Clarification[];
  states: State[];
  inputs?: Input[];
  outputs?: Output[];
  error_cases: ErrorCase[];
  edge_cases: EdgeCase[];
  performance?: PerformanceMetric[];
}

export interface State {
  name: string;
  description: string;
  transitions: Transition[];
}

export interface Transition {
  trigger: string;
  target: string;
  condition: string | null;
}

export interface Clarification {
  category: string;
  question: string;
  options_considered: string[];
  decision: string;
  rationale?: string;
  asked_at: string;
}

export interface Input {
  name: string;
  type: string;
  validation: string;
  required: boolean;
}

export interface Output {
  name: string;
  type: string;
  format: string;
}

export interface ErrorCase {
  condition: string;
  error_code: string;
  user_message: string;
  recovery_action: string;
}

export interface EdgeCase {
  scenario: string;
  expected_behavior: string;
}

export interface PerformanceMetric {
  metric: string;
  threshold: string;
}

// ui-spec.yaml 타입
export interface UiSpec {
  ui_spec: {
    design_system: DesignSystem;
    screens: Screen[];
  };
  metadata: SpecMetadata;
}

export interface DesignSystem {
  package: string;
  version: string;
  reference: string;
}

export interface Screen {
  id: string;
  name: string;
  route: string;
  description: string;
  implements_features: string[];
  components: Component[];
  interactions: Interaction[];
  responsive?: ResponsiveConfig;
  accessibility?: AccessibilityConfig;
}

export interface Component {
  id: string;
  type: string;
  description: string;
  props: Record<string, string>;
  states: ComponentState[];
}

export interface ComponentState {
  name: string;
  appearance: string;
  behavior: string;
}

export interface Interaction {
  trigger: string;
  action: string;
  feedback: string;
}

export interface ResponsiveConfig {
  mobile: string;
  tablet: string;
  desktop: string;
}

export interface AccessibilityConfig {
  focus_order: string[];
  aria_labels: Record<string, string>;
  keyboard_shortcuts: Record<string, string>;
}

// 공통 메타데이터
export interface SpecMetadata {
  created_at?: string;
  author?: string;
  status?: string;
  depends_on?: string[];
  id?: string;
  title?: string;
  version?: string;
}

// 로드된 스펙 데이터
export interface LoadedSpecs {
  functionalSpec: FunctionalSpec | null;
  uiSpec: UiSpec | null;
  flowGraph: import('./flow-graph').FlowGraphSpec | null;
}
