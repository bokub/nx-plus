const { readWorkspaceJson } = require('@nrwl/workspace');
const { appRootPath } = require('@nrwl/workspace/src/utils/app-root');
const { execSync } = require('child_process');
const {
  ensureDirSync,
  readFileSync,
  removeSync,
  writeFileSync,
} = require('fs-extra');
const { dirname } = require('path');
const { getPublishableLibNames, tmpProjPath } = require('./utils');

console.log('\nCreating playground. This may take a few minutes.');

const workspaceJson = readWorkspaceJson();
const publishableLibNames = getPublishableLibNames(workspaceJson);

execSync(`yarn nx run-many --target build --projects ${publishableLibNames}`);

ensureDirSync(tmpProjPath());

removeSync(tmpProjPath());

execSync(
  `node ${require.resolve('@nrwl/tao')} new proj --nx-workspace-root=${dirname(
    tmpProjPath()
  )} --no-interactive --skip-install --collection=@nrwl/workspace --npmScope=proj --preset=empty --package-manager=yarn`,
  { cwd: dirname(tmpProjPath()) }
);

publishableLibNames.forEach((pubLibName) => {
  const { outputPath, packageJson } =
    workspaceJson.projects[pubLibName].targets.build.options;
  const p = JSON.parse(readFileSync(tmpProjPath('package.json')).toString());
  p.devDependencies[
    require(`${appRootPath}/${packageJson}`).name
  ] = `file:${appRootPath}/${outputPath}`;
  writeFileSync(tmpProjPath('package.json'), JSON.stringify(p, null, 2));
});

execSync('yarn install', {
  cwd: tmpProjPath(),
  stdio: ['ignore', 'ignore', 'ignore'],
});

console.log(`\nCreated playground at ${tmpProjPath()}.`);
