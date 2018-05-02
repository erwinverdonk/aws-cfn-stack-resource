(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading wasm modules
/******/ 	var installedWasmModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// object with all compiled WebAssembly.Modules
/******/ 	__webpack_require__.w = {};
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const aws_cfn_wait_1 = __webpack_require__(1);
const stack_1 = __webpack_require__(9);
exports.handler = (event, context, callback) => {
    aws_cfn_wait_1.AwsCfnWait.create({ CustomResource: stack_1.Stack, event, context, callback })
        .catch(_ => {
        console.error(_);
        callback(_, null);
        process.exit();
    });
};


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const HTTPS = __webpack_require__(2);
const URL = __webpack_require__(3);
const AWS = __webpack_require__(4);
const uuid = __webpack_require__(5);
exports.AwsCfnWait = {
    create: ({ CustomResource, waitDelay = 60000, event, context, callback }) => {
        const init = (event) => __awaiter(this, void 0, void 0, function* () {
            const finish = (options, responseBody, callback) => (error, data) => {
                console.log('Finish');
                responseBody.PhysicalResourceId = (Object.assign({}, data).PhysicalResourceId ||
                    event.PhysicalResourceId ||
                    event.RequestId ||
                    responseBody.RequestId ||
                    uuid());
                responseBody.Data = error || data;
                responseBody.Status = error ? 'FAILED' : 'SUCCESS';
                const responseBodyStr = JSON.stringify(responseBody);
                options.headers['content-length'] = responseBodyStr.length.toString();
                console.log('HTTPS Response Request - Options', JSON.stringify(options));
                console.log('HTTPS Response Request - ResponseBody', responseBodyStr);
                const request = HTTPS.request(options, _ => _.on('data', _ => callback(null, _)));
                request.on('error', _ => callback(_, null));
                request.write(responseBodyStr);
                request.end();
                return responseBody;
            };
            const getResponseReceiver = (callback) => {
                if (!event.WaitProperties) {
                    const parsedUrl = URL.parse(event.ResponseURL);
                    const responseBody = {
                        Status: undefined,
                        Reason: `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
                        PhysicalResourceId: undefined,
                        StackId: event.StackId,
                        RequestId: event.RequestId,
                        LogicalResourceId: event.LogicalResourceId,
                        Data: undefined
                    };
                    const options = {
                        hostname: parsedUrl.hostname,
                        port: 443,
                        path: parsedUrl.path,
                        method: 'PUT',
                        headers: {
                            'content-type': '',
                            'content-length': undefined
                        }
                    };
                    return {
                        callback,
                        finish: finish(options, responseBody, callback),
                        httpsRequest: {
                            options,
                            responseBody
                        }
                    };
                }
                else {
                    const httpsRequest = event.WaitProperties.httpsRequest;
                    const options = httpsRequest.options;
                    const responseBody = httpsRequest.responseBody;
                    return {
                        callback,
                        finish: finish(options, responseBody, callback),
                        httpsRequest: {
                            options,
                            responseBody
                        }
                    };
                }
            };
            const getResultHandler = (responseReceiver, customResource) => (result) => {
                if (result) {
                    console.log('success', JSON.stringify(result));
                }
                customResource.wait(result)
                    .then(waitResult => {
                    return new Promise((resolve, reject) => {
                        console.log('Wait result:', JSON.stringify(waitResult));
                        if (waitResult.shouldWait) {
                            console.log('We are not yet done waiting, lets wait some more...');
                            console.log(`Rechecking status in ${waitDelay} milliseconds`);
                            setTimeout(() => {
                                const httpsRequest = responseReceiver.httpsRequest;
                                const currentEpoch = Math.ceil(new Date().getTime() / 1000);
                                const responseUrlExpires = parseInt(httpsRequest.options.path.match(/(?<=&Expires=)\d+(?=&)/)[0], 16);
                                const hasExpired = responseUrlExpires <= currentEpoch + 300;
                                if (!hasExpired) {
                                    const lambda = new AWS.Lambda();
                                    lambda.invoke({
                                        FunctionName: context.invokedFunctionArn,
                                        InvocationType: 'Event',
                                        Payload: JSON.stringify({
                                            RequestType: event.RequestType,
                                            ResourceProperties: event.ResourceProperties,
                                            WaitProperties: event.WaitProperties || {
                                                responseData: result,
                                                httpsRequest
                                            }
                                        })
                                    })
                                        .promise()
                                        .then(_ => resolve({ canFinish: false, result: _ }))
                                        .catch(_ => reject(_));
                                }
                                else {
                                    reject({
                                        message: 'Response URL has expired. Waiting canceled!'
                                    });
                                }
                            }, waitDelay);
                        }
                        else {
                            resolve({ canFinish: true, result: waitResult.result });
                        }
                    });
                })
                    .then(_ => {
                    if (_.canFinish) {
                        responseReceiver.finish(null, _.result);
                    }
                    else {
                        responseReceiver.callback(null, _.result);
                    }
                })
                    .catch(_ => {
                    responseReceiver.finish(_, null);
                });
                return result;
            };
            const getErrorHandler = (responseReceiver) => (_) => {
                console.error('failed', JSON.stringify(_, Object.getOwnPropertyNames(_)));
                responseReceiver.finish({ error: _ }, null);
                return _;
            };
            const responseReceiver = getResponseReceiver((error, result) => {
                if (result) {
                    console.log('success', JSON.stringify(result));
                }
                if (error) {
                    console.log('error', JSON.stringify(error));
                }
                callback(error, result);
            });
            console.log('event', JSON.stringify(event));
            console.log('context', JSON.stringify(context));
            const cr = yield CustomResource.create(event, context);
            const resultHandler = getResultHandler(responseReceiver, cr);
            const errorHandler = getErrorHandler(responseReceiver);
            if (!event.WaitProperties) {
                return cr.customResource()
                    .then(requestMethods => requestMethods[event.RequestType.toLowerCase()])
                    .then(requestMethod => requestMethod())
                    .then(resultHandler)
                    .catch(errorHandler);
            }
            else {
                resultHandler(event.WaitProperties.responseData);
                return Promise.resolve(event.WaitProperties.responseData);
            }
        });
        return init(typeof event === 'string' ? JSON.parse(event) : event);
    }
};


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("https");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("aws-sdk");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

var rng = __webpack_require__(6);
var bytesToUuid = __webpack_require__(8);

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

// Unique ID creation requires a high quality random # generator.  In node.js
// this is pretty straight-forward - we use the crypto API.

var crypto = __webpack_require__(7);

module.exports = function nodeRNG() {
  return crypto.randomBytes(16);
};


/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const AWS = __webpack_require__(4);
const aws_sdk_1 = __webpack_require__(4);
exports.Stack = {
    create: (event, context) => {
        const outputsExtractor = (outputs) => {
            return outputs.reduce((acc, output) => {
                acc[output.OutputKey] = output.OutputValue;
                return acc;
            }, {});
        };
        const describeStack = (cfn, stackProps) => () => {
            return cfn.describeStacks({ StackName: stackProps.StackName }).promise()
                .then(_ => _.Stacks[0])
                .then(_ => {
                console.log('Stack Description:', JSON.stringify(_));
                return _;
            });
        };
        const describeStackEventsAndHandleError = (cfn, stackProps) => (error) => {
            return cfn.describeStackEvents({
                StackName: stackProps.StackName
            }).promise()
                .then(_ => {
                throw new Error(JSON.stringify({
                    error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
                    stackEvents: _.StackEvents
                }));
            });
        };
        const createStack = (cfn, stackProps) => () => {
            console.log('Create stack from template:', JSON.stringify(stackProps));
            return cfn.createStack(stackProps).promise()
                .then(describeStack(cfn, stackProps))
                .then(stack => (Object.assign({}, outputsExtractor(stack.Outputs), { PhysicalResourceId: stack.StackId })))
                .catch(describeStackEventsAndHandleError(cfn, stackProps));
        };
        const updateStack = (cfn, stackProps) => () => {
            console.log('Update stack with template:', JSON.stringify(stackProps));
            return cfn.updateStack(stackProps).promise()
                .then(describeStack(cfn, stackProps))
                .then(stack => (Object.assign({}, outputsExtractor(stack.Outputs), { PhysicalResourceId: stack.StackId })))
                .catch(describeStackEventsAndHandleError(cfn, stackProps));
        };
        const deleteStack = (cfn, stackProps) => () => {
            console.log('Delete stack with template:', JSON.stringify(stackProps));
            return cfn.deleteStack({ StackName: event.PhysicalResourceId }).promise()
                .then(describeStack(cfn, stackProps))
                .then(stack => (Object.assign({}, outputsExtractor(stack.Outputs), { PhysicalResourceId: stack.StackId })))
                .catch(describeStackEventsAndHandleError(cfn, stackProps));
        };
        const assumeRole = (assumeRoleArn, sessionName) => {
            console.log('Assume Role: ', assumeRoleArn);
            return new AWS.STS().assumeRole({
                RoleArn: assumeRoleArn,
                RoleSessionName: sessionName,
                DurationSeconds: 900
            })
                .promise()
                .then(result => {
                const creds = result.Credentials;
                return {
                    accessKeyId: creds.AccessKeyId,
                    secretAccessKey: creds.SecretAccessKey,
                    sessionToken: creds.SessionToken,
                    expiration: creds.Expiration
                };
            });
        };
        const getMethods = (creds) => {
            return {
                wait: () => {
                    const props = event.ResourceProperties;
                    const waitProps = event.WaitProperties;
                    console.log('WaitForComplete');
                    console.log('StackName:', props.Stack.StackName);
                    const cfn = new AWS.CloudFormation({
                        region: props.Region,
                        credentials: creds
                    });
                    return cfn.describeStacks({
                        StackName: waitProps ? waitProps.responseData.PhysicalResourceId : props.Stack.StackName
                    }).promise()
                        .then(_ => _.Stacks[0])
                        .then(stack => {
                        console.log('Stack Status:', stack.StackStatus);
                        if ([
                            'CREATE_IN_PROGRESS',
                            'UPDATE_IN_PROGRESS',
                            'DELETE_IN_PROGRESS'
                        ].includes(stack.StackStatus)) {
                            return {
                                shouldWait: true,
                                status: stack.StackStatus,
                                context: stack
                            };
                        }
                        else {
                            if ([
                                'CREATE_COMPLETE',
                                'UPDATE_COMPLETE',
                                'UPDATE_ROLLBACK_COMPLETE',
                                'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS',
                                'DELETE_COMPLETE'
                            ].includes(stack.StackStatus)) {
                                return {
                                    shouldWait: false,
                                    status: stack.StackStatus,
                                    context: stack,
                                    result: Object.assign({}, outputsExtractor(stack.Outputs), { PhysicalResourceId: stack.StackId })
                                };
                            }
                            else {
                                throw {
                                    shouldWait: false,
                                    status: stack.StackStatus,
                                    context: stack,
                                    error: {
                                        message: stack.StackStatusReason || 'Erroneous stack status'
                                    }
                                };
                            }
                        }
                    })
                        .catch(e => {
                        throw {
                            shouldWait: false,
                            error: {
                                message: JSON.stringify(e, Object.getOwnPropertyNames(e))
                            }
                        };
                    });
                },
                customResource: () => {
                    const props = event.ResourceProperties;
                    const stackProps = props.Stack;
                    const cfn = new AWS.CloudFormation({
                        region: props.Region,
                        credentials: creds
                    });
                    return Promise.resolve({
                        create: createStack(cfn, stackProps),
                        update: updateStack(cfn, stackProps),
                        delete: deleteStack(cfn, stackProps)
                    });
                }
            };
        };
        const props = event.ResourceProperties;
        if (props.AssumeRoleArn) {
            return assumeRole(props.AssumeRoleArn, context.invokeid)
                .then(_ => getMethods(new aws_sdk_1.Credentials(_)));
        }
        else {
            return Promise.resolve(getMethods());
        }
    }
};


/***/ })
/******/ ])));