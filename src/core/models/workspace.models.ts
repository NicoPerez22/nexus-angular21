export interface Player {
  name: string;
  role: string;
}
export interface Team {
  id: string;
  name: string;
  short: string;
  sub: string;
  win: number;
  players: Player[];
}
export interface TeamEvent {
  id: string;
  name: string;
  team: string;
  date: string;
  time: string;
  type: string;
}
export interface Task {
  id: string;
  name: string;
  team: string;
  who: string;
  due: string;
  priority: boolean;
  done: boolean;
}
export interface Workspace {
  teams: Team[];
  events: TeamEvent[];
  tasks: Task[];
}
