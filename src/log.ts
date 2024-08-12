import { is_dev_env } from './constants';
import chalk from 'chalk';
import {BaseLogger} from 'pino';

export enum Topic {
    Unknown = 'unknown',
    paymentProcessed = 'payment processed',
    Logger = 'logger',
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
class Logger{
    pino?: BaseLogger;
    private getStack() {
        return new Error().stack;
    }
    usePino(pino:BaseLogger){
        this.pino=pino;
    }
    private log(logObj: {
        stack?: string,
        topic: Topic;
        severity: Severity,
        logType: LogType,
        subtopic?: SubTopic,
        body: string|object
    }|string){
        if (!this.pino){
            console.log(JSON.stringify(logObj))
        } else {
            if (typeof logObj === 'object'){
                switch (logObj.severity){
                    case Severity.Emergency:
                        this.pino.fatal(this.makeFlatObject(logObj))
                        break;
                    case Severity.Alert:
                        this.pino.warn(this.makeFlatObject(logObj))
                        break;
                    case Severity.Critical:
                        this.pino.fatal(this.makeFlatObject(logObj))
                        break;                    
                    case Severity.Error:
                        this.pino.error(this.makeFlatObject(logObj))
                        break;
                    case Severity.Warning:
                        this.pino.warn(this.makeFlatObject(logObj))
                        break;
                    case Severity.Notice:
                        this.pino.info(this.makeFlatObject(logObj))
                        break;
                    case Severity.Informational:
                        this.pino.info(this.makeFlatObject(logObj))
                        break;
                    case Severity.Debug:
                        this.pino.debug(this.makeFlatObject(logObj))
                        break;
                    default:
                        this.pino.trace(this.makeFlatObject(logObj))
                }
            } 
            else 
                this.pino.trace(logObj)
        }
    }
    private makeFlatObject(obj: any): Record<string, string|number> {
        try {
            if (typeof obj !== 'object' && obj !== null) {
                return { value: obj };
            }
            const result: any = {};
            for (const [key, value] of Object.entries(obj ?? {})) {
                if (!is_dev_env && process.env.is_running_tests) return {};
                if (typeof value == 'object') {
                    const flattenedValue=this.makeFlatObject(value);
                    for (const [extendedKey, extendedValue] of Object.entries(flattenedValue)){
                        result[(key+'_'+extendedKey).toLowerCase()]=extendedValue;
                    }
                }
                else result[key.toLowerCase()] = `${value}`;
            }
            return result;
        } catch (e) {
            this.log({
                topic: Topic.Logger,
                severity: Severity.Error,
                logType: LogType.exception,
                body:{
                    event: 'Error in makeFlatObject',
                    error: e
                }
            });
        }
        return {};
    }

    logException(topic: Topic, severity: Severity, exception: Error, subtopic: SubTopic = SubTopic.Unknown) {
        try {
            if (!is_dev_env) {
                if (process.env.is_running_tests) return;
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
            } else {
                this.log(chalk.red.bold(`topic: ${topic}\nsubTopic: ${subtopic}\nErrorMessage: ${exception.message}\nseverity: ${severity}\nstack: ${exception.stack}\n`));
            }
        } catch (e) {
            this.log({
                topic: Topic.Logger,
                severity: Severity.Error,
                logType: LogType.exception,
                body:{
                    event: 'Error in makeFlatObject',
                    error: e
                }
            });
        }
    };

    logEvent(topic: Topic, severity: Severity, obj: any, subtopic = SubTopic.Unknown) {
        try {
            if (!is_dev_env) {
                if (process.env.is_running_tests) return;
                this.log({
                    topic,
                    subtopic,
                    severity,
                    stack: this.getStack(),
                    body: this.makeFlatObject(obj),
                    logType: LogType.event
                });
            } else {
                this.log(chalk.cyanBright.bold(`topic: ${topic}\nsubTopic: ${subtopic}\nInfo: ${JSON.stringify({ ...this.makeFlatObject(obj) })}\nseverity: ${severity}\n`));
            }
        } catch (e) {
            this.log({
                topic: Topic.Logger,
                severity: Severity.Error,
                logType: LogType.exception,
                body:{
                    event: 'Error in makeFlatObject',
                    error: e
                }
            });
        }
    }

    logMessage(topic: Topic, severity: Severity, message: string, subtopic = SubTopic.Unknown) {
        try {
            if (!is_dev_env) {
                if (process.env.is_running_tests) return;
                this.log({
                    topic,
                    subtopic,
                    severity,
                    stack: this.getStack(),
                    logType: LogType.message,
                    body: message
                });
            } else {
                this.log(chalk.green.bold(`logType: ${LogType.message} \nmessage: ${message} \n`));
            }
        } catch (e) {
            this.log({
                topic: Topic.Logger,
                severity: Severity.Error,
                logType: LogType.exception,
                body:{
                    event: 'Error in makeFlatObject',
                    error: e
                }
            });
        }
    }

    logObject(topic: Topic, severity: Severity, logObj: { [index: string]: any }, subtopic = SubTopic.Unknown) {
        try {
            if (!is_dev_env) {
                if (process.env.is_running_tests) return;
                this.log(JSON.stringify({
                    topic,
                    subtopic,
                    severity,
                    stack: this.getStack(),
                    logType: LogType.object,
                    ...logObj
                }));
            } else {
                this.log(chalk.green.bold(`logType: ${LogType.object} \nmessage: ${JSON.stringify(logObj)} \n`));
            }
        } catch (e) {
            this.log({
                topic: Topic.Logger,
                severity: Severity.Error,
                logType: LogType.exception,
                body:{
                    event: 'Error in makeFlatObject',
                    error: e
                }
            });
        }
    }
}

const logger = new Logger();
export const logObject = logger.logObject.bind(logger);
export const logEvent = logger.logEvent.bind(logger);
export const logException = logger.logException.bind(logger);
export const logMessage = logger.logMessage.bind(logger);
export const usePino = logger.usePino.bind(logger);


export default {
    Topic, SubTopic, Severity,
};