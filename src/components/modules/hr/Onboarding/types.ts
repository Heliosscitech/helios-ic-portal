export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  assignee: string;
}

export interface PhaseTemplate {
  id: string;
  title: string;
  tasks: TaskTemplate[];
}

export type OnboardingTemplate = PhaseTemplate[];

export interface PersonTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  isDone: boolean;
}

export interface PersonPhase {
  id: string;
  title: string;
  tasks: PersonTask[];
}

export interface OnboardingPerson {
  id: string;
  name: string;
  role: string;
  startDate: string; // 'YYYY-MM-DD'
  ownerId?: string;  // PORTAL_USERS.id — bu onboarding'i kendi sayfasında görecek kullanıcı
  phases: PersonPhase[];
}
