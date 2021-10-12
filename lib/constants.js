"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacy = exports.projects = exports.is_dev_env = void 0;
exports.is_dev_env = process.env.IS_DEV_ENV == 'true';
var projects;
(function (projects) {
    projects["chatbots"] = "chatbots";
    projects["robocall"] = "robocall";
    projects["messaging"] = "messaging";
})(projects = exports.projects || (exports.projects = {}));
var privacy;
(function (privacy) {
    privacy["protected"] = "protected";
    privacy["private"] = "private";
    privacy["public"] = "public";
})(privacy = exports.privacy || (exports.privacy = {}));
