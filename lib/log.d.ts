import { BaseLogger } from 'pino';
export declare enum Topic {
    Unknown = "unknown",
    paymentProcessed = "payment processed",
    Logger = "logger",
    Init = "init",
    Api = "api",
    Adapter = "adapter",
    Integration = "integration",
    Config = "config",
    Message = "message",
    MessageCount = "message-count",
    Rabbitmq = "rabbitmq",
    Handler = "handler",
    Timer = "timer"
}
export declare enum SubTopic {
    Unknown = "unknown",
    Rabbitmq = "rabbitmq",
    Rest = "rest",
    ScenarioTranslation = "scenariotranslation",
    Telegram = "telegram",
    Vk = "vk",
    Viber = "viber",
    Multichat = "multichat",
    Jivo = "jivo",
    Google = "google",
    Common = "common",
    McnWidget = "mcn-widget",
    InfiniteLoopBan = "infiniteloopban",
    Noinit = "noinit",
    OldMessagesFix = "OldMessagesFix",
    AnalyticsFix = "AnalyticsFix",
    LongTimerEvent = "LongTimerEvent",
    StatCall = "StatCall",
    User = "user",
    Client = "client",
    Role = "role"
}
export declare enum Severity {
    Emergency = "emerg",
    Alert = "alert",
    Critical = "crit",
    Error = "err",
    Warning = "warning",
    Notice = "notice",
    Informational = "info",
    Debug = "debug"
}
/**
 * @deprecated Use logEvent() instead for proper logging
*/
export declare const logObject: (topic: Topic, severity: Severity, logObj: {
    [index: string]: any;
}, subtopic?: SubTopic) => void;
export declare const logEvent: (topic: Topic, severity: Severity, obj: any, subtopic?: SubTopic) => void;
export declare const logException: (topic: Topic, severity: Severity, exception: Error, subtopic?: SubTopic) => void;
export declare const logMessage: (topic: Topic, severity: Severity, message: string, subtopic?: SubTopic) => void;
export declare const usePino: (pino: BaseLogger) => void;
declare const _default: {
    Topic: typeof Topic;
    SubTopic: typeof SubTopic;
    Severity: typeof Severity;
};
export default _default;
