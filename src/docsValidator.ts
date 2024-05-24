import Express from 'express';
import multer from 'multer';
import { is_dev_env, is_stage_env, projects } from './constants';
const upload = multer({ limits: { fileSize: 1024 * 1024 * 25 } }); // 25 мегабайт

/*TODO: пока так, в будущем стоит немного изменить логику
в ApiHelper запрос будет уходить на apiPath + url
apiPath задается в createDocsStub
*/
let apiPath: string = '';

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
interface Parameters<T, P extends permissions_t> {
    example: T;
    body_params: ParameterDetail[];
    is_file_upload?: boolean;
    path_params?: ParameterDetail[];
    query_params?: ParameterDetail[];
    header_params: ParameterDetail[];
    permissions_required?: P;
    checks: ((obj: T) => Promise<boolean>)[];
}

interface Validation {
    ok: boolean;
    value: any;
}

interface ExpressReq {
    express_req: Express.Request;
}

type permissions_t=(string[]|string)[];

type request_t<T, Permissions extends permissions_t> = Permissions extends string[] ? T & ExpressReq & {permissions: string[]} : T & ExpressReq;

function validateNumber(value: any): Validation {
    return { ok: !isNaN(Number(value)), value: Number(value) };
}
function validateString(value: any): Validation {
    return { ok: typeof value?.toString() == 'string', value: value?.toString() };
}
function validateAny(value: any): Validation {
    return { ok: true, value };
}
function validateBoolean(value: any): Validation {
    return { ok: value + '' == 'true' || value + '' == 'false', value: value + '' == 'true' };
}

function validate(value: any, parameter: ParameterDetail): Validation {
    const validations: any = { number: validateNumber, string: validateString, boolean: validateBoolean, any: validateAny };
    if (parameter.type in validations) {
        return validations[parameter.type](value);
    }
    return { ok: false, value: null };
}

function addDocs<T, P extends permissions_t>(
    method: string, 
    url: string, 
    parameters: Parameters<T, P>, 
    data: { 
        description: string; 
        summary: string; 
        tags: string[]; 
        bodyDesc?: string; 
        response: any 
    }, 
    paths: any
) {
    const swagger_url = url.replace(/\/:([^\/]+)(\/?$)?/g, '/{$1}$2');
    paths[swagger_url] = paths[swagger_url] ?? {};
    paths[swagger_url][method.toLowerCase()] = {};
    let methodDocs = paths[swagger_url][method.toLowerCase()];
    methodDocs.operationId = method.toLowerCase() + '_' + swagger_url.replace(/\//g, '_');
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
    methodDocs.parameters = [];
    if (parameters.query_params?.length) {
        let i: any;
        for (i in parameters.query_params) {
            const query_item: ParameterDetail = parameters.query_params[i];
            
            const example: any = parameters.example ?? {};

            methodDocs.parameters.push({
                name: query_item.name,
                description: query_item.description,
                required: query_item.required,
                in: 'query',
                schema: { type: query_item.type, example: example[query_item.name], enum: query_item.enum },
            });
        }
    }
    if (parameters.path_params?.length) {
        let i: any;
        for (i in parameters.path_params) {
            const path_item: ParameterDetail = parameters.path_params[i];
            methodDocs.parameters.push({
                name: path_item.name,
                description: path_item.description,
                required: path_item.required,
                in: 'path',
                schema: path_item.enum ? { type: path_item.type, enum: path_item.enum } : { type: path_item.type },
            });
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
        if (parameters.is_file_upload) {
            schema.properties['file'] = {
                type: 'string',
                format: 'binary',
            };
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
    getPermissions?: (req: Express.Request)=>Promise<String[]>;

    /**
     * Constructs a new instance of the ApiHelper class.
     *
     * @param app - The Express application instance.
     * @param documentationPaths - The paths to the OpenAPI documentation files.
     * @param getPermissions - Function to retrieve the permissions for a request. Required if permissions are used. 
     */
    constructor(app: any, documentationPaths: any, getPermissions?: (req: Express.Request)=>Promise<String[]>) {
        this.documentationPaths = documentationPaths;
        this.app = app;
        this.getPermissions = getPermissions;

    }

    /**
     * Adds a route to the Express application and updates the OpenAPI documentation.
     * @param url The URL of the route.
     * @param method The HTTP method of the route.
     * @param parameters An object containing the parameters for the route.
     * @param docs An object containing the documentation for the route.
     * @param required_permissions An array of permissions required to access the route. 
     * In case of several permissions have to be met use arrays as elements for OR operation.
     * e.g. A & (B|C) & (D|E) -> [A, [B,C], [D,E]]
     * @param callback The function to be executed when the route is called.
     */
    add<T, P extends permissions_t>(
        url: string,
        method: 
        `${'g'|'G'}${'e'|'E'}${'T'|'t'}`
        |`${'P'|'p'}${'o'|'O'}${'s'|'s'}${'T'|'t'}`
        |`${'P'|'p'}${'a'|'A'}${'T'|'t'}${'C'|'c'}${'H'|'h'}`
        |`${'P'|'p'}${'U'|'u'}${'T'|'t'}`
        |`${'D'|'d'}${'E'|'e'}${'L'|'l'}${'E'|'e'}${'T'|'t'}${'E'|'e'}`, 
        parameters: Parameters<T, P>, 
        docs: { 
            description: string; 
            summary: string; 
            tags: string[]; 
            bodyDesc?: string;
            response: any 
        },
        callback: (params: request_t<T, P>, res: Express.Response) => any
    ) {
        addDocs(method, url, parameters, docs, this.documentationPaths);
        let func = async (req: Express.Request, res: Express.Response) => {
            try {
                res.setHeader('Access-Control-Allow-Origin', '*');
                let argument_result: any={}
                if (parameters.permissions_required){
                    if (!this.getPermissions)
                        throw new Error('Cannot check required permissions becase no getPermission function was provided. Check initialization');
                    argument_result.permissions = await this.getPermissions(req);
                    for (let or_permissions of parameters.permissions_required){
                        let ok: boolean;
                        if (typeof or_permissions === 'string'){
                            ok=argument_result.permissions.includes(or_permissions);
                        } else if (Array.isArray(or_permissions)){
                            ok=or_permissions.some(r => argument_result!.includes(r));
                        } else throw new TypeError(`Unknown type of element [${parameters.permissions_required.indexOf(or_permissions)}] in required permissions`)
                        if (!ok){
                            return res.json({ok:false, error: 'missing_permission', permission: or_permissions});                       
                        }
                    }   
                }
                let collected_params: { value: any; detail: ParameterDetail }[] = [];
                let i: any;
                for (i in parameters.body_params) {
                    let body_param = parameters.body_params[i];
                    if (!Object.keys(req.body).includes(body_param.name)) {
                        if (body_param.required) {
                            return res.json({ ok: false, error: 'missing_body_param', name: body_param.name });
                        }
                        continue;
                    }
                    collected_params.push({ value: req.body[body_param.name], detail: body_param });
                }
                for (i in parameters.header_params) {
                    let header_param = parameters.header_params[i];
                    if (!Object.keys(req.headers).includes(header_param.name)) {
                        if (header_param.required) {
                            return res.json({ ok: false, error: 'missing_header_param', name: header_param.name });
                        }
                        continue;
                    }
                    collected_params.push({ value: req.headers[header_param.name], detail: header_param });
                }
                for (i in parameters.query_params) {
                    let query_param = parameters.query_params![i];
                    if (!Object.keys(req.query).includes(query_param.name)) {
                        if (query_param.required) {
                            return res.json({ ok: false, error: 'missing_query_param', name: query_param.name });
                        }
                        continue;
                    }
                    collected_params.push({ value: req.query[query_param.name], detail: query_param });
                }
                for (i in parameters.path_params) {
                    let path_param = parameters.path_params![i];
                    if (!Object.keys(req.params).includes(path_param.name)) {
                        if (path_param.required) {
                            return res.json({ ok: false, error: 'missing_path_param', name: path_param.name });
                        }
                        continue;
                    }
                    collected_params.push({ value: req.params[path_param.name], detail: path_param });
                }
                for (i in collected_params) {
                    let param = collected_params[i];
                    let validation: Validation = validate(param.value, param.detail);
                    if (!validation.ok) {
                        return res.json({ ok: false, error: 'invalid_param', name: param.detail.name, type: param.detail.type });
                    }
                    argument_result[param.detail.name] = validation.value;
                }
                try {
                    const results = await Promise.all(parameters.checks.map((check) => check(argument_result)));
                    if (!results.every((res) => res)) return res.json({ ok: false, error: 'request did not pass check' });
                } catch {
                    return res.json({ ok: false, error: 'request did not pass check' });
                }
                if (parameters.is_file_upload) {
                    argument_result.file = req.file;
                }
                if (req.url.indexOf('/ws/')) {
                    argument_result['express_req'] = req;
                }
                await callback(argument_result, res);
            } catch (e) {
                console.log(e);
                res.json({ ok: false, error: 'unknown' });
            }
        };
        if (method.toLowerCase() == 'get') {
            this.app.get(`/${apiPath}${url}`, func);
        } else if (method.toLowerCase() == 'delete') {
            this.app.delete(`/${apiPath}${url}`, func);
        } else if (method.toLowerCase() == 'put') {
            if (parameters.is_file_upload) {
                this.app.put(`/${apiPath}${url}`, upload.single('file'), func);
            } else {
                this.app.put(`/${apiPath}${url}`, func);
            }
        } else if (method.toLowerCase() == 'patch') {
            if (parameters.is_file_upload) {
                this.app.patch(`/${apiPath}${url}`, upload.single('file'), func);
            } else {
                this.app.patch(`/${apiPath}${url}`, func);
            }
        } else {
            if (parameters.is_file_upload) {
                this.app.post(`/${apiPath}${url}`, upload.single('file'), func);
            } else {
                this.app.post(`/${apiPath}${url}`, func);
            }
        }
    }
}

export function createDocsStub(info: string, version: string, title: string, projectName: keyof typeof projects, baseApiPath: string, tags: { name: string; description: string }[]) {
    const { protocol, host } = getApiPath(projectName);
    apiPath = baseApiPath;
    const docs = {
        openapi: '3.0.0',
        info: {
            description: info,
            version,
            title,
        },
        servers: [{ url: `${protocol}://${host}/${baseApiPath}` }],
        tags,
        paths: {},
        components: {
            description: {
                alwaysok: `Always returns 200. Error indication in the ok field of the response.
                                Responses other than 200 can only occur in case of a very serious problem`,
            },
            property: {
                ok: {
                    type: 'boolean',
                    description: `true - if operation was successful. false if was error.
                     if error was, then the field will also be present error - with a short mnemonic
                     error description`,
                },
            },
        },
    };
    return docs;
}

function getApiPath(projectName: keyof typeof projects): { protocol: string; host: string } {
    const settings: any = { protocol: is_dev_env ? 'http' : 'https' };

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
            settings.host = `${is_stage_env ? 'base-stage' : 'base'}.mcn.${is_dev_env ? 'local' : 'ru'}`;
            break;
        case projects.integration:
            settings.host = `${is_stage_env ? 'integration-stage' : 'integration'}.mcn.${is_dev_env ? 'local' : 'ru'}`;
            break;
        case projects.integration:
            settings.host = is_stage_env ? 'integration.mcn.local' : 'integration.mcn.ru';
            break;
        case projects.integrationEu:
            settings.host = is_stage_env ? 'integration.mcn.local' : 'integration.kompaas.tech';
            break;
        default:
            break;
    }
    return settings;
}
