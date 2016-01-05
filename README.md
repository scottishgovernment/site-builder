# site-builder

Generates a static web site from content in the publishing system.

## Dependencies

Dependencies are listed in the package.json file.

The 'dependencies' section lists modules that will be included in the
deployable artefact, and the 'devDependencies' section lists modules that
are required at build time, but not required in the generated artefact.

To modify dependencies:

* Edit the package.json, taking care to list packages in 'dependencies'
  or 'devDependencies' as described above.
* Run `npm prune`  to uninstall modules that have been removed from
  package.json.
* Run `npm install` to install modules listed in package.json which are
  not already installed.
* Run `./scripts/shrinkwrap' to update the npm-shrinkwrap.json file.
* Commit changes to package.json and npm-shrinkwrap.json together.

