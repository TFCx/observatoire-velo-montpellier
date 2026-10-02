import type { PromiseYear } from './schema';
import { LaneStatus } from '../types';

// Ce que la carte, le filtre et les statistiques distinguent : l'avancement, et pour un tronçon à faire,
// s'il a été promis (ADR 0009).
export enum ProgressCategory {
  Done = 'done',
  Wip = 'wip',
  PromisedTodo = 'promised-todo',
  UnpromisedTodo = 'unpromised-todo',
  Unknown = 'unknown',
}

export function getProgressCategory({
  status,
  promisedFor,
}: {
  status: LaneStatus;
  promisedFor?: PromiseYear;
}): ProgressCategory {
  switch (status) {
    case LaneStatus.Done:
      return ProgressCategory.Done;
    case LaneStatus.Wip:
      return ProgressCategory.Wip;
    case LaneStatus.Todo:
      return promisedFor === undefined ? ProgressCategory.UnpromisedTodo : ProgressCategory.PromisedTodo;
    case LaneStatus.Unknown:
      return ProgressCategory.Unknown;
  }
}
