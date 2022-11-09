import Express, { query } from 'express'
import multer from 'multer';
const upload = multer({ limits: { fileSize: 1024 * 1024 * 25 } }); // 25 мегабайт
import {is_dev_env, is_stage_env, privacy, projects} from './constants'

/*TODO: пока так, в будущем стоит немного изменить логику
в ApiHelper запрос будет уходить на apiPath + url
apiPath задается в createDocsStub
*/
let apiPath: string = ''

/**
 * Этот класс призван.
 * 1. Проверять входные аргументы API запроса.
 * 2. Предоставлять аргументы API запроса в виде понятного typescript типа
 * 3. Предоставлять документацию
 */
interface ParameterDetail {
    name: string;
    type: string;
    description: string;
    required: boolean;
    enum?: any[];
}
interface Parameters<T> {
    example: T;
    body_params: ParameterDetail[];
    is_file_upload?: boolean;
    query_params?: ParameterDetail[];
    header_params: ParameterDetail[];
    checks: ((obj: T) => Promise<boolean>)[];
}

interface Validation {
    ok: boolean;
    value: any;
}

interface ExpressReq {
    express_req: Express.Request;
}

function validateNumber(number: any) : Validation {
    return { ok: !isNaN(Number(number)), value: Number(number) };
}
function validateString(value: any) : Validation {
    return { ok: (typeof value?.toString()) == 'string', value: value?.toString() };
}
function validateAny(value: any) : Validation {
    return { ok: true, value };
}
function validateBoolean(value: any) : Validation {
    return { ok: ((value + '') == 'true') || ((value + '') == 'false'), value: (value + '')  == 'true' };
}

function validate(value: any, type: string) : Validation {
    const validations: any = { 'number': validateNumber, 'string': validateString, 'boolean': validateBoolean, 'any': validateAny };
    if (type in validations) {
        return validations[type](value);
    }
    return { ok: false, value: null };
}

function addDocs<T>(method: string, url: string, parameters: Parameters<T>,
    data: {description: string, summary: string, tags: string[], bodyDesc?: string, response: any}, paths: any) {
    paths[url] = {};
    paths[url][method.toLowerCase()] = {};
    let methodDocs = paths[url][method.toLowerCase()];
    methodDocs.operationId = method.toLowerCase() + '_' + url.replace(/\//g, '_');
    methodDocs.description = data.description;
    methodDocs.summary = data.summary;
    methodDocs.tags = data.tags;
    methodDocs.responses = {};
    methodDocs.responses['200'] = {};
    methodDocs.responses['200'].description = '#/components/description/alwaysok';
    methodDocs.responses['200'].content = {};
    methodDocs.responses['200'].content['application/json'] = {};
    methodDocs.responses['200'].content['application/json'].schema = {};
    methodDocs.responses['200'].content['application/json'].schema.type = 'object';
    methodDocs.responses['200'].content['application/json'].schema.properties = data.response;
    if (parameters.query_params?.length) {
        let i: any;
        methodDocs.parameters = [];
        for (i in parameters.query_params) {
            const query_item: ParameterDetail = parameters.query_params[i];
            methodDocs.parameters.push({ name: query_item.name, description: query_item.description, required: query_item.required, in: 'query',
                schema: query_item.enum ? { type: query_item.type, enum: query_item.enum }  : { type: query_item.type } });
        }
    }
    if (parameters.body_params.length > 0) {
        const contentType = parameters.is_file_upload ? 'multipart/form-data' : 'application/json';
        methodDocs.requestBody = {};
        methodDocs.requestBody.description = data.bodyDesc;
        methodDocs.requestBody.required = false;
        methodDocs.requestBody.content = {};
        methodDocs.requestBody.content[contentType] = {};
        methodDocs.requestBody.content[contentType].schema = {};
        let schema = methodDocs.requestBody.content[contentType].schema;
        schema.type = 'object';
        schema.required = [];
        schema.properties = {};
        schema.example = {};
        let i;
        if(parameters.is_file_upload) {
            schema.properties['file'] = {
                type: 'string',
                format: 'binary'
            }
        }
        for (i in parameters.body_params) {
            let parameter = parameters.body_params[i];
            if (parameter.required) {
                methodDocs.requestBody.required = true;
                schema.required.push(parameter.name);
            }
            schema.properties[parameter.name] = { type: parameter.type, description: parameter.description };
            //@ts-ignore
            //TODO: Fix
            schema.example[parameter.name] = parameters.example[parameter.name];
        }
        if (!schema.required.length) {
            delete schema.required;
        }
    }


}

export class ApiHelper {
    app: any;
    documentationPaths: any;
    constructor(app: any, documentationPaths: any) {
        this.documentationPaths = documentationPaths;
        this.app = app;
    }

    add<T>(url: string, method: string, parameters: Parameters<T>, docs: {description: string, summary: string, tags: string[], bodyDesc?: string, response:any},
        callback: ((params: T & ExpressReq, res:Express.Response) => any)) {
        addDocs(method, url, parameters, docs, this.documentationPaths);
        let func = async (req: Express.Request, res: Express.Response) => {
            try {
                res.setHeader('Access-Control-Allow-Origin', '*');
                let argument_result: any = {};
                let collected_params: {value: any, detail: ParameterDetail}[] = [];
                let url_params = req.params;
                let i: any;
                for (i in parameters.body_params) {
                    let body_param = parameters.body_params[i];
                    if (!Object.keys(req.body).includes(body_param.name)) {
                        if (body_param.required) {
                            return res.json({ ok: false, error: 'missing_body_param', name: body_param.name });
                        }
                        continue ;
                    }
                    collected_params.push({ value: req.body[body_param.name], detail: body_param });
                }
                for (i in parameters.header_params) {
                    let header_param = parameters.header_params[i];
                    if (!Object.keys(req.headers).includes(header_param.name)) {
                        if (header_param.required) {
                            return res.json({ ok: false, error: 'missing_body_param', name: header_param.name });
                        }
                        continue ;
                    }
                    collected_params.push({ value: req.headers[header_param.name], detail: header_param });
                }
                for (i in parameters.query_params) {
                    let query_param = parameters.query_params![i];
                    if (!Object.keys(req.query).includes(query_param.name)) {
                        if (query_param.required) {
                            return res.json({ ok: false, error: 'missing_query_param', name: query_param.name });
                        }
                        continue ;
                    }
                    collected_params.push({ value: req.query[query_param.name], detail: query_param });
                }
                for (i in collected_params) {
                    let param = collected_params[i];
                    let validation : Validation = validate(param.value, param.detail.type);
                    if (!validation.ok) {
                        return res.json({ ok: false, error: 'invalid_param', name: param.detail.name, type: param.detail.type });
                    }
                    argument_result[param.detail.name] = validation.value;
                }
                if (parameters.is_file_upload) {
                    argument_result.file = req.file;
                }
                // черновой вариант
                if (url_params) {
                    for (let i in url_params) {
                        argument_result[i] = req.params[i]
                    }
                }
                if (req.url.indexOf('/ws/')) {
                    argument_result['express_req'] = req
                }
                await callback(argument_result, res);
            } catch(e) {
                console.log(e);
                res.json({ ok: false, error: 'unknown' });
            }

        };
        if (method.toLowerCase() == 'get') {
            this.app.get(`/${apiPath}${url}`, func);
        } else if (method.toLowerCase() == "delete") {
            this.app.delete(`/${apiPath}${url}`, func);
        } else if (method.toLowerCase() == "put") {
            if (parameters.is_file_upload) {
                this.app.put(`/${apiPath}${url}`, upload.single('file'), func);
            }
            else {
                this.app.put(`/${apiPath}${url}`, func);
            }
        } else {
            if (parameters.is_file_upload) {
                this.app.post(`/${apiPath}${url}`, upload.single('file'), func);
            }
            else {
                this.app.post(`/${apiPath}${url}`, func);
            }
        }
    }
}

export function createDocsStub (info: string, version: string, title: string, projectName: keyof typeof projects,
    baseApiPath: string, tags: {name: string, description: string}[]) {
    const {protocol, host} = getApiPath(projectName)
    apiPath = baseApiPath
    const docs = {
        openapi: '3.0.0', info: {
            description: info,
            version, title,
        },
        servers: [{url: `${protocol}://${host}/${baseApiPath}`}],
        tags, paths: {},
        components: {
            description: {
                alwaysok: `Always returns 200. Error indication in the ok field of the response.
                                Responses other than 200 can only occur in case of a very serious problem`
            },
            property: {
                ok: { type: 'boolean', description: `true - if operation was successful. false if was error.
                     if error was, then the field will also be present error - with a short mnemonic
                     error description` }
            }
        }
    };
    return docs;
}

function getApiPath(projectName: keyof typeof projects ): {protocol: string, host: string} {
    const settings: any = { protocol: is_dev_env ? 'http' : 'https' }

    switch (projectName) {
        case projects.calltracking:
            settings.host = is_dev_env ? 'calltracking-dev.mcn.loc' : 'calltracking.mcn.ru';
            break;
        case projects.chatbots:
            settings.host = `chatbots.mcn.${is_dev_env ? 'local' : 'ru'}`;
            break;
        case projects.messaging:
            settings.host = `messaging.mcn.${is_dev_env ? 'local' : 'ru'}`;
            break;
        case projects.robocall:
            settings.host = is_dev_env ? 'robocall-backend-dev.local' : 'robocall.mcn.ru';
            break;
        case projects.apiproxy:
            settings.host = is_dev_env ? 'apiproxy.mcn.local' : 'integration.mcn.ru';
            break;
        case projects.base:
            settings.host = `${is_stage_env? 'base-stage' : 'base'}.mcn.${is_dev_env ? 'local' : 'ru'}`;
            break;
        case projects.integration:
            settings.host = is_stage_env ? 'integration.mcn.local' : 'integration.mcn.ru';
            break;
        default:
            break;  
    }
    return settings
}
