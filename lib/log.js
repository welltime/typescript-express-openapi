"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePino = exports.logMessage = exports.logException = exports.logEvent = exports.logObject = exports.Severity = exports.SubTopic = exports.Topic = void 0;
const constants_1 = require("./constants");
var Topic;
(function (Topic) {
    Topic["Unknown"] = "unknown";
    Topic["paymentProcessed"] = "payment processed";
    Topic["Logger"] = "logger";
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
    Topic["Payment"] = "payment";
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
    SubTopic["Yookassa"] = "yookassa";
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
    LogType["object"] = "object";
})(LogType || (LogType = {}));
class Logger {
    getStack() {
        return new Error().stack;
    }
    usePino(pino) {
        this.pino = pino;
    }
    log(logObj) {
        if (!this.pino) {
            console.log(typeof logObj === 'object' ? JSON.stringify(logObj) : logObj);
        }
        else {
            if (typeof logObj === 'object') {
                switch (logObj.severity) {
                    case Severity.Emergency:
                        this.pino.fatal(this.makeFlatObject(logObj));
                        break;
                    case Severity.Alert:
                        this.pino.warn(this.makeFlatObject(logObj));
                        break;
                    case Severity.Critical:
                        this.pino.fatal(this.makeFlatObject(logObj));
                        break;
                    case Severity.Error:
                        this.pino.error(this.makeFlatObject(logObj));
                        break;
                    case Severity.Warning:
                        this.pino.warn(this.makeFlatObject(logObj));
                        break;
                    case Severity.Notice:
                        this.pino.info(this.makeFlatObject(logObj));
                        break;
                    case Severity.Informational:
                        this.pino.info(this.makeFlatObject(logObj));
                        break;
                    case Severity.Debug:
                        this.pino.debug(this.makeFlatObject(logObj));
                        break;
                    default:
                        this.pino.trace(this.makeFlatObject(logObj));
                }
            }
            else
                this.pino.trace(logObj);
        }
    }
    makeFlatObject(obj) {
        try {
            if (typeof obj !== 'object' && obj !== null) {
                return { value: obj };
            }
            const result = {};
            for (const [key, value] of Object.entries(obj !== null && obj !== void 0 ? obj : {})) {
                if (!constants_1.is_dev_env && process.env.is_running_tests)
                    return {};
                if (typeof value == 'object') {
                    const flattenedValue = this.makeFlatObject(value);
                    for (const [extendedKey, extendedValue] of Object.entries(flattenedValue)) {
                        result[(key + '_' + extendedKey).toLowerCase()] = extendedValue;
                    }
                }
                else if (typeof value == 'number' || typeof value == 'boolean')
                    result[key.toLowerCase()] = value;
                else
                    result[key.toLowerCase()] = `${value}`;
            }
            return result;
        }
        catch (e) {
            this.log({
                topic: Topic.Logger,
                severity: Severity.Error,
                logType: LogType.exception,
                body: {
                    event: 'Error in makeFlatObject',
                    error: e
                }
            });
        }
        return {};
    }
    logException(topic, severity, exception, subtopic = SubTopic.Unknown) {
        try {
            if (process.env.is_running_tests)
                return;
            this.log({
                body: {
                    message: exception.message,
                    catchStack: this.getStack()
                },
                stack: exception.stack,
                topic,
                severity,
                logType: LogType.exception,
                subtopic
            });
        }
        catch (e) {
            this.log({
                topic: Topic.Logger,
                severity: Severity.Error,
                logType: LogType.exception,
                body: {
                    event: 'Error in makeFlatObject',
                    error: e
                }
            });
        }
    }
    ;
    logEvent(topic, severity, obj, subtopic = SubTopic.Unknown) {
        try {
            if (process.env.is_running_tests)
                return;
            this.log({
                topic,
                subtopic,
                severity,
                stack: this.getStack(),
                body: this.makeFlatObject(obj),
                logType: LogType.event
            });
        }
        catch (e) {
            this.log({
                topic: Topic.Logger,
                severity: Severity.Error,
                logType: LogType.exception,
                body: {
                    event: 'Error in makeFlatObject',
                    error: e
                }
            });
        }
    }
    logMessage(topic, severity, message, subtopic = SubTopic.Unknown) {
        try {
            if (process.env.is_running_tests)
                return;
            this.log({
                topic,
                subtopic,
                severity,
                stack: this.getStack(),
                logType: LogType.message,
                body: message
            });
        }
        catch (e) {
            this.log({
                topic: Topic.Logger,
                severity: Severity.Error,
                logType: LogType.exception,
                body: {
                    event: 'Error in logMessage',
                    error: e
                }
            });
        }
    }
    logObject(topic, severity, logObj, subtopic = SubTopic.Unknown) {
        try {
            if (process.env.is_running_tests)
                return;
            this.log(JSON.stringify(Object.assign({ topic,
                subtopic,
                severity, stack: this.getStack(), logType: LogType.object }, logObj)));
        }
        catch (e) {
            this.log({
                topic: Topic.Logger,
                severity: Severity.Error,
                logType: LogType.exception,
                body: {
                    event: 'Error in makeFlatObject',
                    error: e
                }
            });
        }
    }
}
const logger = new Logger();
/**
 * @deprecated Use logEvent() instead for proper logging
*/
exports.logObject = logger.logObject.bind(logger);
exports.logEvent = logger.logEvent.bind(logger);
exports.logException = logger.logException.bind(logger);
exports.logMessage = logger.logMessage.bind(logger);
exports.usePino = logger.usePino.bind(logger);
exports.default = {
    Topic, SubTopic, Severity,
};
