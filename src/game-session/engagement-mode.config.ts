export enum EngagementMode {
  REFLECTIVE = 'Reflective',
  ANCHORED_INSIGHT = 'Anchored Insight',
  LEARNING = 'Learning',
  SOCIAL_FLOW = 'Social Flow',
}

export interface ScoringParameter {
  name: string;
  description: string;
}

export interface EngagementModeConfig {
  mode: EngagementMode;
  guidanceLayer: string;
  reason: string;
  parameters: ScoringParameter[];
}

export const ENGAGEMENT_MODE_CONFIG: Record<EngagementMode, EngagementModeConfig> = {
  [EngagementMode.REFLECTIVE]: {
    mode: EngagementMode.REFLECTIVE,
    guidanceLayer: 'Inner Guidance',
    reason: 'Deep self-exploration needs internal, non-directive thinking',
    parameters: [
      { name: 'Reflective', description: 'Measures how much the answer shows self-reflection, personal thinking, or inner awareness.' },
      { name: 'Coherence', description: 'Measures how clear, connected, and understandable the answer is.' },
      { name: 'Authenticity', description: 'Measures how real, honest, and genuine the answer feels.' },
      { name: 'Openness', description: 'Measures how willing the user is to express thoughts, feelings, or personal experiences.' },
    ],
  },
  [EngagementMode.ANCHORED_INSIGHT]: {
    mode: EngagementMode.ANCHORED_INSIGHT,
    guidanceLayer: 'Coach',
    reason: 'Structured reflection works best with guided support',
    parameters: [
      { name: 'Insight', description: 'Measures how well the answer shows understanding, realization, or a clear new thought.' },
      { name: 'Grounding', description: 'Measures how connected the answer is to real life, facts, personal experience, or practical thinking.' },
      { name: 'Coherence', description: 'Measures how clear, connected, and understandable the answer is.' },
      { name: 'Growth', description: 'Measures how much the answer shows learning, improvement, or willingness to move forward.' },
    ],
  },
  [EngagementMode.LEARNING]: {
    mode: EngagementMode.LEARNING,
    guidanceLayer: 'Instructor',
    reason: 'Knowledge-focused mode needs teaching-style guidance',
    parameters: [
      { name: 'Accuracy', description: 'Measures whether the user’s response stays correct, relevant, and aligned with the topic being asked.' },
      { name: 'Conceptual', description: 'Measures whether the user understands the reason, meaning, or principle behind the answer, not just the final response.' },
      { name: 'Clarity', description: 'Measures whether the user presents the answer in a clear order, with enough explanation, so the response is not confusing or incomplete.' },
      { name: 'Application', description: 'Measures whether the user can use the learned concept correctly in a real situation, example, or problem.' },
    ],
  },
  [EngagementMode.SOCIAL_FLOW]: {
    mode: EngagementMode.SOCIAL_FLOW,
    guidanceLayer: 'Facilitator',
    reason: 'Social interaction needs flow management, not deep analysis',
    parameters: [
      { name: 'Playfulness', description: 'Measures how much the answer shows fun, humor, light energy, or a playful style.' },
      { name: 'Participation', description: 'Measures how actively the user takes part in the interaction instead of giving a short, empty, or low-effort response.' },
      { name: 'Timing', description: 'Measures how well the answer fits the moment, mood, or flow of the conversation.' },
      { name: 'Social', description: 'Measures how well the answer creates connection, keeps the conversation going, or responds well to others.' },
    ],
  },
};

export function getEngagementMode(modeStr?: string): EngagementMode {
  if (!modeStr) return EngagementMode.REFLECTIVE;
  const found = Object.values(EngagementMode).find(
    (val) => val.toLowerCase() === modeStr.trim().toLowerCase()
  );
  return found || EngagementMode.REFLECTIVE;
}
