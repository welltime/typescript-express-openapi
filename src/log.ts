import { is_dev_env } from './constants';
import chalk from 'chalk';

export enum Topic {
    Unknown = 'unknown',
    paymentProcessed = 'payment processed',

    Init = 'init',
    Api = 'api',
    Adapter = 'adapter',
    Integration = 'integration',
    Config = 'config',
    Message = 'message',
    MessageCount = 'message-count',
    Rabbitmq = 'rabbitmq',
    Handler = 'handler',
    Timer = 'timer',
}

export enum SubTopic {
    Unknown = 'unknown',

    Rabbitmq = 'rabbitmq',
    Rest = 'rest',
    ScenarioTranslation = 'scenariotranslation',
    Telegram = 'telegram',
    Vk = 'vk',
    Viber = 'viber',
    Multichat = 'multichat',
    Jivo = 'jivo',
    Google = 'google',
    Common = 'common',
    McnWidget = 'mcn-widget',
    InfiniteLoopBan = 'infiniteloopban',
    Noinit = 'noinit',

    OldMessagesFix = 'OldMessagesFix',
    AnalyticsFix = 'AnalyticsFix',
    LongTimerEvent = 'LongTimerEvent',

    StatCall = 'StatCall',
    User = 'user',
    Client = 'client',
    Role = 'role'
}

export enum Severity {
    Emergency = 'emerg',
    Alert = 'alert',
    Critical = 'crit',
    Error = 'err',
    Warning = 'warning',
    Notice = 'notice',
    Informational = 'info',
    Debug = 'debug',
}

enum LogType {
    exception = 'exception',
    event = 'event',
    message = 'message',
    object = 'object'
}

function getStack() {
    return new Error().stack;
}

function makeFlatObject(obj: any) {
    try {
        if (typeof obj !== 'object' && obj !== null) {
            return { value: obj };
        }
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (!is_dev_env && process.env.is_running_tests) return;
            if (typeof value == 'object') {
                const flattenedValue=makeFlatObject(value);
                for (const [extendedKey, extendedValue] of Object.entries(flattenedValue)){
                    result[key+'_'+extendedKey]=extendedValue;
                }
            }
            else result[key] = `${value}`;
        }
        return result;
    } catch (e) {
        console.log(e);
    }
    return {};
}

export let logException = function (topic: Topic, severity: Severity, exception: Error, subtopic: SubTopic = SubTopic.Unknown) {
    try {
        if (!is_dev_env) {
            if (process.env.is_running_tests) return;
            console.log(JSON.stringify({
                message: exception.message,
                stack: exception.stack,
                catchStack: getStack(),
                topic,
                severity,
                logType: LogType.exception,
                subtopic
            }));
        } else {
            console.log(chalk.red.bold(`topic: ${topic}\nsubTopic: ${subtopic}\nErrorMessage: ${exception.message}\nseverity: ${severity}\nstack: ${exception.stack}\n`));
        }
    } catch (e) {
        console.log(e);
    }
};

export function logEvent(topic: string, severity: Severity, obj: any, subtopic = SubTopic.Unknown) {
    try {
        if (!is_dev_env) {
            if (process.env.is_running_tests) return;
            console.log(JSON.stringify({
                topic,
                subtopic,
                severity,
                stack: getStack(),
                ...makeFlatObject(obj),
                logType: LogType.event
            }));
        } else {
            console.log(chalk.cyanBright.bold(`topic: ${topic}\nsubTopic: ${subtopic}\nInfo: ${JSON.stringify({ ...makeFlatObject(obj) })}\nseverity: ${severity}\n`));
        }
    } catch (e) {
        console.log(e);
    }
}

export function logMessage(topic: string, severity: Severity, message: string, subtopic = SubTopic.Unknown) {
    try {
        if (!is_dev_env) {
            if (process.env.is_running_tests) return;
            console.log(JSON.stringify({
                topic,
                subtopic,
                severity,
                stack: getStack(),
                logType: LogType.message,
                message
            }));
        } else {
            console.log(chalk.green.bold(`logType: ${LogType.message} \nmessage: ${message} \n`));
        }
    } catch (e) {
        console.log(e);
    }
}

export function logObject(topic: Topic, severity: Severity, logObj: { [index: string]: any }, subtopic = SubTopic.Unknown) {
    try {
        if (!is_dev_env) {
            if (process.env.is_running_tests) return;
            console.log(JSON.stringify({
                topic,
                subtopic,
                severity,
                stack: getStack(),
                logType: LogType.object,
                ...logObj
            }));
        } else {
            console.log(chalk.green.bold(`logType: ${LogType.object} \nmessage: ${JSON.stringify(logObj)} \n`));
        }
    } catch (e) {
        console.log(e);
    }
}

export default {
    Topic, SubTopic, Severity,
};