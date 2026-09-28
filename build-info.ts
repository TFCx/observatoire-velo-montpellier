// Informations de build affichées sur le site pour savoir quel commit est déployé et où.
// Lu par nuxt.config.ts au moment du build, et par les smoke tests pour vérifier le résultat.
import { execSync } from 'node:child_process';

export type BuildInfo = {
  commit: string;
  environment: string;
  date: string;
};

function readGitHeadCommit(): string {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'inconnu';
  }
}

// Pour une PR, la CI construit un commit de merge temporaire, introuvable dans l'historique :
// elle fournit alors BUILD_COMMIT (le dernier commit de la PR), plus parlant.
function readBuildCommit(): string {
  const fullCommit = process.env.BUILD_COMMIT || readGitHeadCommit();
  return fullCommit.slice(0, 7);
}

export function readBuildInfo(): BuildInfo {
  return {
    commit: readBuildCommit(),
    environment: process.env.DEPLOY_ENVIRONMENT || 'local',
    date: new Date().toISOString().slice(0, 10)
  };
}

export function formatBuildInfo(buildInfo: BuildInfo): string {
  return `${buildInfo.commit} ${buildInfo.environment} ${buildInfo.date}`;
}
