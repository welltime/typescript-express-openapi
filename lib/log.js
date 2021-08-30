"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMessage = exports.logEvent = exports.logException = exports.Severity = exports.SubTopic = exports.Topic = void 0;
let is_dev_env = process.env.IS_DEV_ENV == "true";
const chalk_1 = __importDefault(require("chalk"));
var Topic;
(function (Topic) {
    Topic["Unknown"] = "unknown";
    Topic["paymentProcessed"] = "payment processed";
    Topic["Init"] = "init";
    Topic["Api"] = "api";
    Topic["Adapter"] = "adapter";
    Topic["Integration"] = "integration";
    Topic["Config"] = "config";
    Topic["Message"] = "message";
    Topic["MessageCount"] = "message-count";
    Topic["Rabbitmq"] = "rabbitmq";
    Topic["Handler"] = "handler";
    Topic["Timer"] = "timer";
})(Topic = exports.Topic || (exports.Topic = {}));
var SubTopic;
(function (SubTopic) {
    SubTopic["Unknown"] = "unknown";
    SubTopic["Rabbitmq"] = "rabbitmq";
    SubTopic["Rest"] = "rest";
    SubTopic["ScenarioTranslation"] = "scenariotranslation";
    SubTopic["Telegram"] = "telegram";
    SubTopic["Vk"] = "vk";
    SubTopic["Viber"] = "viber";
    SubTopic["Multichat"] = "multichat";
    SubTopic["Jivo"] = "jivo";
    SubTopic["Google"] = "google";
    SubTopic["Common"] = "common";
    SubTopic["McnWidget"] = "mcn-widget";
    SubTopic["InfiniteLoopBan"] = "infiniteloopban";
    SubTopic["Noinit"] = "noinit";
    SubTopic["OldMessagesFix"] = "OldMessagesFix";
    SubTopic["AnalyticsFix"] = "AnalyticsFix";
    SubTopic["LongTimerEvent"] = "LongTimerEvent";
    SubTopic["StatCall"] = "StatCall";
    SubTopic["User"] = "user";
    SubTopic["Client"] = "client";
    SubTopic["Role"] = "role";
})(SubTopic = exports.SubTopic || (exports.SubTopic = {}));
var Severity;
(function (Severity) {
    Severity["Emergency"] = "emerg";
    Severity["Alert"] = "alert";
    Severity["Critical"] = "crit";
    Severity["Error"] = "err";
    Severity["Warning"] = "warning";
    Severity["Notice"] = "notice";
    Severity["Informational"] = "info";
    Severity["Debug"] = "debug";
})(Severity = exports.Severity || (exports.Severity = {}));
var LogType;
(function (LogType) {
    LogType["exception"] = "exception";
    LogType["event"] = "event";
    LogType["message"] = "message";
})(LogType || (LogType = {}));
function getStack() {
    return new Error().stack;
}
function makeFlatObject(obj) {
    try {
        if (typeof obj !== 'object' && obj !== null) {
            return { value: obj };
        }
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (!is_dev_env) {
                if (process.env.is_running_tests)
                    return;
                result[key] = `${value}`;
            }
            else {
                result[key] = `${value}\n`;
            }
        }
        return result;
    }
    catch (e) {
        console.log(e);
    }
    return {};
}
let logException = function (topic, severity, exception, subtopic = SubTopic.Unknown) {
    try {
        if (!is_dev_env) {
            if (process.env.is_running_tests)
                return;
            console.log(JSON.stringify({
                message: exception.message,
                stack: exception.stack,
                catchStack: getStack(),
                topic,
                severity,
                logType: LogType.exception,
                subtopic
            }));
        }
        else {
            console.log(chalk_1.default.red.bold(`topic: ${topic}\nsubTopic: ${subtopic}\nErrorMessage: ${exception.message}\nseverity: ${severity}\nstack: ${exception.stack}\n`));
        }
    }
    catch (e) {
        console.log(e);
    }
};
exports.logException = logException;
function logEvent(topic, severity, obj, subtopic = SubTopic.Unknown) {
    try {
        if (!is_dev_env) {
            if (process.env.is_running_tests)
                return;
            console.log(JSON.stringify(Object.assign(Object.assign({ topic,
                subtopic,
                severity, stack: getStack() }, makeFlatObject(obj)), { logType: LogType.event })));
        }
        else {
            console.log(chalk_1.default.cyanBright.bold(`topic: ${topic}\nsubTopic: ${subtopic}\nInfo: ${JSON.stringify(Object.assign({}, makeFlatObject(obj)))}\nseverity: ${severity}\n`));
        }
    }
    catch (e) {
        console.log(e);
    }
}
exports.logEvent = logEvent;
function logMessage(topic, severity, message, subtopic = SubTopic.Unknown) {
    try {
        if (!is_dev_env) {
            if (process.env.is_running_tests)
                return;
            console.log(JSON.stringify({
                topic,
                subtopic,
                severity,
                stack: getStack(),
                logType: LogType.message,
                message
            }));
        }
        else {
            console.log(chalk_1.default.green.bold(`logType: ${LogType.message} \nmessage: ${message} \n`));
        }
    }
    catch (e) {
        console.log(e);
    }
}
exports.logMessage = logMessage;
exports.default = {
    Topic, SubTopic, Severity,
};
