"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDocsStub = void 0;
const multer_1 = __importDefault(require("multer"));
exports.generateDocsStub = __importStar(require("./docs"));
const upload = multer_1.default({ limits: { fileSize: 1024 * 1024 * 25 } });
function validateNumber(number) {
    return { ok: !isNaN(Number(number)), value: Number(number) };
}
function validateString(value) {
    return { ok: (typeof (value === null || value === void 0 ? void 0 : value.toString())) == 'string', value: value === null || value === void 0 ? void 0 : value.toString() };
}
function validateAny(value) {
    return { ok: true, value };
}
function validate(value, type) {
    const validations = { 'number': validateNumber, 'string': validateString, 'any': validateAny };
    if (type in validations) {
        return validations[type](value);
    }
    return { ok: false, value: null };
}
function addDocs(method, url, parameters, data, paths) {
    var _a;
    paths[url] = {};
    paths[url][method.toLowerCase()] = {};
    let methodDocs = paths[url][method.toLowerCase()];
    methodDocs.operationId = url.replace('/', '_');
    methodDocs.description = data.description;
    methodDocs.summary = data.summary;
    methodDocs.tags = data.tags;
    methodDocs.responses = {};
    methodDocs.responses['200'] = {};
    methodDocs.responses['200'].description = { '$ref': '#/components/description/alwaysok' };
    methodDocs.responses['200'].content = {};
    methodDocs.responses['200'].content['application/json'] = {};
    methodDocs.responses['200'].content['application/json'].schema = {};
    methodDocs.responses['200'].content['application/json'].schema.type = 'object';
    methodDocs.responses['200'].content['application/json'].schema.properties = data.response;
    if ((_a = parameters.query_params) === null || _a === void 0 ? void 0 : _a.length) {
        let i;
        methodDocs.parameters = [];
        for (i in parameters.query_params) {
            const query_item = parameters.query_params[i];
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
            schema.example[parameter.name] = parameters.example[parameter.name];
        }
    }
    else if (parameters.is_file_upload) {
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
class ApiHelper {
    constructor(app, documentationPaths) {
        this.documentationPaths = documentationPaths;
        this.app = app;
    }
    add(url, method, parameters, docs, callback) {
        addDocs(method, url, parameters, docs, this.documentationPaths);
        let func = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                res.setHeader('Access-Control-Allow-Origin', '*');
                let argument_result = {};
                let collected_params = [];
                let i;
                for (i in parameters.body_params) {
                    let body_param = parameters.body_params[i];
                    if (!((_a = req === null || req === void 0 ? void 0 : req.body) === null || _a === void 0 ? void 0 : _a.hasOwnProperty(body_param.name))) {
                        if (body_param.required) {
                            return res.json({ ok: false, error: 'missing_body_param', name: body_param.name });
                        }
                        continue;
                    }
                    collected_params.push({ value: req.body[body_param.name], detail: body_param });
                }
                for (i in parameters.header_params) {
                    let header_param = parameters.header_params[i];
                    if (!((_b = req === null || req === void 0 ? void 0 : req.headers) === null || _b === void 0 ? void 0 : _b.hasOwnProperty(header_param.name))) {
                        if (header_param.required) {
                            return res.json({ ok: false, error: 'missing_body_param', name: header_param.name });
                        }
                        continue;
                    }
                    collected_params.push({ value: req.headers[header_param.name], detail: header_param });
                }
                for (i in parameters.query_params) {
                    let query_param = parameters.query_params[i];
                    if (!((_c = req === null || req === void 0 ? void 0 : req.query) === null || _c === void 0 ? void 0 : _c.hasOwnProperty(query_param.name))) {
                        if (query_param.required) {
                            return res.json({ ok: false, error: 'missing_query_param', name: query_param.name });
                        }
                        continue;
                    }
                    collected_params.push({ value: req.query[query_param.name], detail: query_param });
                }
                for (i in collected_params) {
                    let param = collected_params[i];
                    let validation = validate(param.value, param.detail.type);
                    if (!validation.ok) {
                        return res.json({ ok: false, error: 'invalid_param', name: param.detail.name, type: param.detail.type });
                    }
                    argument_result[param.detail.name] = validation.value;
                }
                if (parameters.is_file_upload) {
                    console.log(req.file);
                    argument_result.file = req.file;
                }
                yield callback(argument_result, res);
            }
            catch (e) {
                console.log(e);
                res.json({ ok: false, error: 'unknown' });
            }
        });
        if (method.toLowerCase() == 'get') {
            this.app.get(url, func);
        }
        else {
            if (parameters.is_file_upload) {
                this.app.post(url, upload.single('file'), func);
            }
            else {
                this.app.post(url, func);
            }
        }
    }
}
exports.default = ApiHelper;
