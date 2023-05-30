"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacy = exports.projects = exports.is_stage_env = exports.is_dev_env = void 0;
exports.is_dev_env = (process.env.DEPLOY_ENV === 'dev') || (process.env.DEV_ENV === 'true');
exports.is_stage_env = process.env.DEPLOY_ENV === 'stage';
var projects;
(function (projects) {
    projects["calltracking"] = "calltracking";
    projects["chatbots"] = "chatbots";
    projects["robocall"] = "robocall";
    projects["messaging"] = "messaging";
    projects["apiproxy"] = "apiproxy";
    projects["base"] = "base";
    projects["integration"] = "integration";
    projects["integrationEu"] = "integrationEu";
    projects["paidmethods"] = "paidmethods";
})(projects = exports.projects || (exports.projects = {}));
var privacy;
(function (privacy) {
    privacy["protected"] = "protected";
    privacy["private"] = "private";
    privacy["public"] = "public";
})(privacy = exports.privacy || (exports.privacy = {}));
