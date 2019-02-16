"use strict";

import { readFileSync } from "fs";
import { files } from "node-dir";
import {basename, dirname, extname, join} from "path";
import { Position, QuickPickItem, TextDocument, Uri, window, workspace } from "vscode";
import { output } from "../extension";
import { generateTimestamp } from "../helper/common";
import { cleanupDownloadFiles, templateDirectory } from "../helper/github";
import { showLearnFolderSelector } from "../helper/module-builder";
import { alias, gitHubID, missingValue } from "../helper/user-settings";
import { moduleQuickPick, templateNameMetadata } from "../strings";

export let moduleTitle;
// tslint:disable-next-line:no-var-requires
const fm = require("front-matter");
const markdownExtensionFilter = [".md"];

export function displayTemplates() {
    let templateName;
    // tslint:disable-next-line:no-shadowed-variable
    files(templateDirectory, (err, files) => {
        if (err) {
            output.appendLine(err);
            throw err;
        }

        const templates: QuickPickItem[] = [];
        templates.push({ label: moduleQuickPick, description: `Create a Learn module and unit` });

        {
            files.filter((file: any) => markdownExtensionFilter.indexOf(extname(file.toLowerCase()))
                !== -1).forEach((file: any) => {
                    if (basename(file).toLowerCase() !== "readme.md") {
                        try {
                            const filePath = join(dirname(file), basename(file));
                            const fileContent = readFileSync(filePath, "utf8");
                            const updatedContent = fileContent.replace("{@date}", "{date}");
                            const yamlContent = fm(updatedContent);
                            templateName = yamlContent.attributes[templateNameMetadata];

                            if (templateName) {
                                templates.push({ label: templateName, description: join(dirname(file), basename(file)) });
                            }
                            if (!templateName) {
                                templates.push({ label: basename(file), description: join(dirname(file), basename(file)) });
                            }
                        } catch (error) {
                            output.appendLine(error);
                        }
                    }
                });
        }

        // tslint:disable-next-line:only-arrow-functions
        templates.sort(function(a, b) {
            const firstLabel = a.label.toUpperCase();
            const secondLabel = b.label.toUpperCase();
            if (firstLabel < secondLabel) {
                return -1;
            }
            if (firstLabel > secondLabel) {
                return 1;
            }
            return 0;
        });

        window.showQuickPick(templates).then((qpSelection) => {
            if (!qpSelection) {
                return;
            }

            if (qpSelection.label === moduleQuickPick) {
                showLearnFolderSelector();
            }

            if (qpSelection.label && qpSelection.label !== moduleQuickPick) {
                const template = qpSelection.label;
                const templatePath = qpSelection.description;
                applyDocsTemplate(templatePath, template);
            }
        }, (error: any) => {
            output.appendLine(error);
        });
    });
}

export function applyDocsTemplate(templatePath: string, template?: string ) {
    const newFile = Uri.parse("untitled:" + "New-Topic.md");
    workspace.openTextDocument(newFile).then((textDocument: TextDocument) => {
        window.showTextDocument(textDocument, 1, false).then((textEditor) => {
            const content = readFileSync(templatePath, "utf8");
            textEditor.edit((edit) => {
                try {
                    let updatedContent;
                    const { msDateValue } = generateTimestamp();
                    // replace metadata placeholder values with user settings and dynamic values then write template content to new file.
                    if (!gitHubID && !alias) {
                        updatedContent = content.replace("{@date}", msDateValue).replace("{github-id}", missingValue).replace("{ms-alias}", missingValue);
                        edit.insert(new Position(0, 0), updatedContent);
                    } else if (!gitHubID) {
                        updatedContent = content.replace("{@date}", msDateValue).replace("{github-id}", missingValue).replace("{ms-alias}", alias);
                        edit.insert(new Position(0, 0), updatedContent);
                    } else if (!alias) {
                        updatedContent = content.replace("{@date}", msDateValue).replace("{github-id}", gitHubID).replace("{ms-alias}", missingValue);
                        edit.insert(new Position(0, 0), updatedContent);
                    } else {
                        updatedContent = content.replace("{@date}", msDateValue).replace("{github-id}", gitHubID).replace("{ms-alias}", alias);
                        edit.insert(new Position(0, 0), updatedContent);
                    }
                } catch (error) {
                     output.appendLine(error);
                }
            });
        }, (error: any) => {
            output.appendLine(error);
        });
    });

    cleanupDownloadFiles();
}
