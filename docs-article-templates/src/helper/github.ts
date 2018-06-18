"use-strict";

import * as fs from "fs";
import os = require("os");
import * as path from "path";
import * as vscode from "vscode";
import { output } from "../extension";
import * as common from "./common";

const docsAuthoringDirectory = path.join(os.homedir(), "Docs Authoring");
export const templateDirectory = path.join(docsAuthoringDirectory, "Templates");

// download a copy of the template repo to the "docs authoring" directory.  no .git-related files will be generated by this process.
export function downloadRepo() {
    const download = require("download-git-repo");
    const templateRepo = "MicrosoftDocs/content-templates";
    download(templateRepo, docsAuthoringDirectory, (err) => {
        if (err) {
            common.postWarning(err ? "Error: Cannot connect to " + templateRepo : "Success");
            output.appendLine(err ? "Error: Cannot connect to " + templateRepo : "Success");
        }
    });
}

// the download process is on a repo-level so this function will be used to delete any files pulled down by the download process.
export function cleanupDownloadFiles() {
    fs.readdir(docsAuthoringDirectory, (err, files) => {
        files.forEach((file) => {
            const fullFilePath = path.join(docsAuthoringDirectory, file);
            fs.stat(path.join(fullFilePath), (error, stats) => {
                if (stats.isFile()) {
                    fs.unlinkSync(fullFilePath);
                }
                if (error) {
                    output.appendLine("Error: " + error);
                }
            });
        });
    });
}