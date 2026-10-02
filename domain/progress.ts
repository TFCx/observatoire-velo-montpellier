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

// Une promesse pour l'année N vaut jusqu'au 31 décembre de N (ADR 0009) : un tronçon promis est en retard
// s'il a été réalisé une année suivante. doneAt est au format jj/mm/aaaa (vérifié par le schéma).
export function isDoneAfterPromise({ promisedFor, doneAt }: { promisedFor?: PromiseYear; doneAt?: string }): boolean {
  if (promisedFor === undefined || !doneAt) {
    return false;
  }
  const doneYear = Number(doneAt.split('/')[2]);
  return doneYear > promisedFor;
}
