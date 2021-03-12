import Express, { query } from 'express'
import multer from 'multer';
const upload = multer({ limits: { fileSize: 1024 * 1024 * 25 } }); // 25 мегабайт

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

function validateNumber(number: any) : Validation {
    return { ok: !isNaN(Number(number)), value: Number(number) };
}
function validateString(value: any) : Validation {
    return { ok: (typeof value?.toString()) == 'string', value: value?.toString() };
}
function validateAny(value: any) : Validation {
    return { ok: true, value };
}

function validate(value: any, type: string) : Validation {
    const validations: any = { 'number': validateNumber, 'string': validateString, 'any': validateAny };
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
    methodDocs.operationId = url.replace('/', '_');
    methodDocs.description = data.description;
    methodDocs.summary = data.summary;
    methodDocs.tags = data.tags;
    methodDocs.responses = {};
    methodDocs.responses['200'] = {};
    methodDocs.responses['200'].description = { '$ref' : '#/components/description/alwaysok' };
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
            console.log('ADDING', query_item.name);
            methodDocs.parameters.push({ name: query_item.name, description: query_item.description, required: query_item.required, in: 'query', 
                schema: { type: query_item.type } });
        }
    }
    if (parameters.body_params.length > 0 && !parameters.is_file_upload) {
        methodDocs.requestBody = {};
        methodDocs.requestBody.description = data.bodyDesc;
        methodDocs.requestBody.required = false;
        methodDocs.requestBody.content = {};
        methodDocs.requestBody.content['application/json'] = {};
        methodDocs.requestBody.content['application/json'].schema = {};
        let schema = methodDocs.requestBody.content['application/json'].schema;
        schema.type = 'object';
        schema.required = [];
        schema.properties = {};
        schema.example = {};
        let i;
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
    } else if (parameters.is_file_upload) {
        methodDocs.requestBody = {
            content: {
                'multipart/form-data': {
                    schema: {
                        type: 'object',
                        properties: {
                            file: {
                                type: 'string',
                                format: 'binary'
                            }
                        }
                    }
                },
            }
        };
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
        callback: ((params: T, res:Express.Response) => any)) {
        addDocs(method, url, parameters, docs, this.documentationPaths);
        let func = async (req: Express.Request, res: Express.Response) => {
            try {
                res.setHeader('Access-Control-Allow-Origin', '*');
                let argument_result: any = {};
                let collected_params: {value: any, detail: ParameterDetail}[] = [];
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
                    console.log(req.file);
                    argument_result.file = req.file;
                }
                await callback(argument_result, res);
            } catch(e) {
                console.log(e);
                res.json({ ok: false, error: 'unknown' });
            }
            
        };
        if (method.toLowerCase() == 'get') {
            this.app.get(url, func);
        } else {
            if (parameters.is_file_upload) {
                this.app.post(url, upload.single('file'), func);
            } else {
                this.app.post(url, func);
            }
        }
    }
}

export function createDocsStub (info: string, version: string, title: string, host: string,
    basePath: string, tags: {name: string, description: string}[]) {
    const docs = {
        openapi: '3.0.0', info: {
            description: info,
            version, title,
        }, host, basePath,
        tags, schemes: ['http'], paths: {},
        components: {
            description: {
                alwaysok: `Всегда возвращается 200. Индикация ошибки в поле ok ответа.
                               Отличные от 200 ответы могут возникнуть только в случае очень серьезной проблемы`
            },
            property: {
                ok: { type: 'boolean', description: `true - если операция прошла успешно. false если произошла ошибка.
                     Если ошибка была, то также будет присутствовать поле error - с коротким мнемоническим
                     описанием ошибки` }
            }
        }
    };
    return docs;
}
