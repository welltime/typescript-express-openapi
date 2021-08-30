export declare enum Topic {
    Unknown = "unknown",
    paymentProcessed = "payment processed",
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
export declare let logException: (topic: Topic, severity: Severity, exception: Error, subtopic?: SubTopic) => void;
export declare function logEvent(topic: string, severity: Severity, obj: {
    [key: string]: string | number;
}, subtopic?: SubTopic): void;
export declare function logMessage(topic: string, severity: Severity, message: string, subtopic?: SubTopic): void;
declare const _default: {
    Topic: typeof Topic;
    SubTopic: typeof SubTopic;
    Severity: typeof Severity;
};
export default _default;
