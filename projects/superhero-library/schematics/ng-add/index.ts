import { Rule, Tree } from "@angular-devkit/schematics";
import { getWorkspace } from "@schematics/angular/utility/config";
import {
  addModuleImportToRootModule,
  getProjectFromWorkspace
} from "schematics-utilities";

export default function(options: any): Rule {
  return (host: Tree) => {
    // get the workspace config of the consuming project
    // i.e. angular.json file
    const workspace = getWorkspace(host);

    // identify the project config which is using our library
    // or default to the default project in consumer workspace
    const project = getProjectFromWorkspace(
      workspace,
      options.project || workspace.defaultProject
    );

    // inject our module into the current main module of the selected project
    addModuleImportToRootModule(
      // tree to modify
      host,
      // Module name to insert
      "SuperheroLibraryModule",
      // project name for import statement
      "superhero-library",
      // project to be modified
      project
    );

    // return updated tree
    return host;
  };
}
