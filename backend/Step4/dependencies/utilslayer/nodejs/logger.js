/*
  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify,
  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const AWSXRay = require('aws-xray-sdk-core')
const AWS = AWSXRay.captureAWS(require('aws-sdk'))
const cloudwatch = new AWS.CloudWatch()
const log = require('lambda-log')
const MetricUnit = require('./models')
const { createMetricsLogger, Unit } = require("aws-embedded-metrics")

/**
 * Prepares logger class to be used across methods.
 * 
 * This setup evaluates the need of enabling debug entries 
 * and also adds a timestamp to all log entries as custom metadata. 
 */
exports.logger_setup = () => {
    const tracingInfo = process.env._X_AMZN_TRACE_ID || '';
    const TRACE_ID_REGEX = /^Root=(.+);Parent=(.+);/;
    const matches = tracingInfo.match(TRACE_ID_REGEX) || ['', '', ''];

    log.options.debug = process.env.ENABLE_DEBUG !== undefined ? process.env.ENABLE_DEBUG : false
    log.options.dynamicMeta = message => {
        return {
            timestamp: new Date().toISOString(),
            'X-Amzn-Trace-Id': tracingInfo,
            'X-Amzn-Trace-Id-Root': matches[1],
            'X-Amzn-Trace-Id-Parent': matches[2]
        }
    }
    return log
}

/**
 * Puts Custom Metric on CloudWatch Metrics. 
 * 
 * This method puts a custom metric on CloudWatch Metrics during the Lambda
 * execution time. It is important to take in consideration that
 * creating Custom Metrics synchronously may impact on performance/execution time
 *  
 * By default, it has a namespace with the app name and it adds service name as a dimension, and any 
 * additional {key: value} arg. 
 * It takes up to 9 dimensions that will be used to further categorize a custom metric, besides the service dimension
 * 
 * @example
 * Puts metric to count the number of successful item retrievals using default dimensions and namepsace.
 * putMetric(name = 'SuccessfulGetItem', unit = MetricUnit.Count, value = 1)
 * // Dimensions created: {service: 'service_undefined'} 
 * // Namespace used: QWizardlyService
 * 
 * @example
 * Puts metric to count the number of successful item retrievals per service & operation in the default namespace.
 * putMetric(name = 'SuccessfulGetItem', unit = MetricUnit.Count, value = 1, { service: 'item_service', operation: 'get-item-by-id' })
 * // Dimensions created: {service: 'item_service', operation: 'get-item-by-id'} 
 * // Namespace used: QWizardlyService
 * 
 * @example
 * Puts metric to count the number of successful item retrievals per service & operation in a custom namespace.
 * putMetric(name = 'SuccessfulGetItem', unit = MetricUnit.Count, value = 1, { service: 'item_service', operation: 'get-item-by-id', namespace: 'MySampleApp' })
 * // Dimensions created: {service: 'item_service', operation: 'get-item-by-id'} 
 * // Namespace used: MySampleApp
 * 
 * @param   {String}        name    Metric name. 
 * @param   {MetricUnit}    unit    Metric unit enum value (e.g. MetricUnit.Seconds). Metric units are available via MetricUnit Enum. Default to Count.
 * @param   {Number}        value   Metric value. Default to 0.
 * @param   {Object}        options Dict containing metric dimensions and namespace. Optional. (e.g. {customer: customerId})
 */
exports.putMetric = async (name, unit = MetricUnit.Count, value = 0, options) => {
    try {
        log.debug(`Creating custom metric ${name}`)
        const metric = buildMetricData(name, unit, value, options)
        await cloudwatch.putMetricData(metric).promise()
    } catch (err) {
        log.error({ operation: options.operation !== undefined ? options.operation : 'undefined_operation', method: 'putMetric', details: err })
        throw err
    }
}

/**
 * Logs Custom Metric on CloudWatch Metrics using Embedded Metric Format (EMF). 
 *  
 * @example
 * Logs metric to count the number of successful item retrievals using default dimensions and namepsace.
 * logMetric(name = 'SuccessfulGetItem', unit = MetricUnit.Count, value = 1)
 * // Dimensions included: {service: 'service_undefined'} 
 * // Namespace used: QWizardlyService
 * 
 * @example
 * Logs metric to count the number of successful item retrievals per service & operation in the default namespace.
 * logMetric(name = 'SuccessfulGetItem', unit = MetricUnit.Count, value = 1, { service: 'item_service', operation: 'get-item-by-id' })
 * // Dimensions included: {service: 'item_service', operation: 'get-item-by-id'} 
 * // Namespace used: QWizardlyService
 * 
 * @example
 * Logs metric to count the number of successful item retrievals per service & operation in a custom namespace.
 * logMetric(name = 'SuccessfulGetItem', unit = MetricUnit.Count, value = 1, { service: 'item_service', operation: 'get-item-by-id', namespace: 'MySampleApp' })
 * // Dimensions included: {service: 'item_service', operation: 'get-item-by-id'} 
 * // Namespace used: MySampleApp
 * 
 * @property    {String}    AWS_EMF_NAMESPACE    Environment variable defining the service name to be used as metric namespace. This variable can be defined in the SAM template.
 * 
 * @param   {String}        name    Metric name. 
 * @param   {MetricUnit}    unit    Metric unit enum value (e.g. MetricUnit.Seconds). Metric units are available via Unit Enum. Default to Count.
 * @param   {Number}        value   Metric value. Default to 0.
 * @param   {Object}        dimensions Dict containing metric dimensions and namespace. Optional. (e.g. {customer: customerId})
 */
exports.logMetricEMF = async (name, unit = Unit.Count, value = 0, dimensions) => {
    try {
        const metrics = createMetricsLogger()
        metrics.putDimensions(buildEMFDimensions(dimensions))
        metrics.putMetric(name, value, unit)
        metrics.setNamespace(process.env.AWS_EMF_NAMESPACE !== undefined ? process.env.AWS_EMF_NAMESPACE : 'aws-embedded-metrics')
        log.debug(`Logging custom metric ${name} via Embbeded Metric Format (EMF)`)
        log.debug(metrics)
        await metrics.flush()
    } catch (err) {
        log.error({ operation: dimensions.operation !== undefined ? options.dimensions : 'undefined_operation', method: 'logMetricEMF', details: err })
        throw err
    }
}

/**
 * Transforms arguments into CloudWatch Metric Data. 
 *   
 * @property    {String}        SERVICE_NAME    Environment variable defining the service name to be used as metric dimension. This variable can be defined in the SAM template.
 * 
 * @param       {String}        name    Metric name. 
 * @param       {MetricUnit}    unit    Metric unit enum value (e.g. MetricUnit.Seconds). Metric units are available via MetricUnit Enum.
 * @param       {Number}        value   Metric value. 
 * @param       {Object}        options Dict containing metric dimensions and namespace. Optional. (e.g. {customer: customerId})
 *  
 * @returns     {Object}        Custom Metric object.
 */
const buildMetricData = (name, unit, value, options) => {
    let namespace = 'QWizardlyService',
        service = process.env.SERVICE_NAME !== undefined ? process.env.SERVICE_NAME : 'service_undefined'

    if (options) {
        if (options.namespace !== undefined) namespace = options.namespace
        if (options.service !== undefined) service = options.service
        delete options.namespace
        delete options.service
    }

    const metric = {
        MetricData: [
            {
                MetricName: name,
                Dimensions: buildDimensions(service, options),
                Timestamp: new Date(),
                Unit: unit,
                Value: value
            },
        ],
        Namespace: namespace
    };
    return metric
}

/**
 * Transforms arguments into dimensions to EMF. 
 *   
 * @property    {String}        SERVICE_NAME    Environment variable defining the service name to be used as metric dimension. This variable can be defined in the SAM template.
 * 
 * @param       {Object}        dimensions Dict containing metric dimensions and namespace. Optional. (e.g. {customer: customerId})
 *  
 * @returns     {Object}        Custom Dimensions object.
 */
const buildEMFDimensions = (dimensions) => {
    let service = process.env.SERVICE_NAME !== undefined ? process.env.SERVICE_NAME : 'service_undefined'

    if (dimensions) {
        if (dimensions.service !== undefined) service = dimensions.service
        delete dimensions.namespace
        delete dimensions.service
    }

    return dimensions
}

/**
 * Transforms arguments into StatsD Metric Data. 
 *   
 * @property    {String}        SERVICE_NAME    Environment variable defining the service name to be used as metric dimension. This variable can be defined in the SAM template.
 * 
 * @param       {String}        name    Metric name. 
 * @param       {MetricUnit}    unit    Metric unit enum value (e.g. MetricUnit.Seconds). Metric units are available via MetricUnit Enum.
 * @param       {Number}        value   Metric value. 
 * @param       {Object}        options Dict containing metric dimensions and namespace. Optional. (e.g. {customer: customerId})
 *  
 * @returns     {String}        Custom Metric object. MONITORING|<metric_value>|<metric_unit>|<metric_name>|<namespace>|<dimensions>
 */
const buildStatsDMetricData = (name, unit, value, options) => {
    let namespace = 'QWizardlyService',
        service = process.env.SERVICE_NAME !== undefined ? process.env.SERVICE_NAME : 'service_undefined'

    if (options) {
        if (options.namespace !== undefined) namespace = options.namespace
        if (options.service !== undefined) service = options.service
        delete options.namespace
        delete options.service
    }

    return `MONITORING|${value}|${unit}|${name}|${namespace}|${buildDimensionsStatsDFormat(service, options)}`
}


/**
 * Builds correct format for custom metric dimensions from args.
 *  
 * CloudWatch accepts a max of 10 dimensions per metric
 * we include service name as a dimension
 * so we take up to 9 values as additional dimensions
 * before we return our dimensions array
 * 
 * @param   {JSON}  service             Service dimension. (e.g. {service: 'value'}) 
 * @param   {JSON}  extra_dimensions    Extra metric dimensions and. Optional. (e.g. {customer: customerId})
 * 
 * @returns {Array} Dimensions in the form of [{Name: 'dim1', Value: 'val1'}, {Name: 'dim10', Value: 'val10'}]  
 */
const buildDimensions = (service, extra_dimensions) => {
    let dimensions = [{ Name: 'service', Value: service }]
    if (extra_dimensions) {
        Object.keys(extra_dimensions).forEach(k => {
            dimensions.push({ Name: k, Value: extra_dimensions[k] })
        });
        dimensions = dimensions.slice(0, 10)
    }
    return dimensions
}

/**
 * Builds correct format for StatsD custom metric dimensions from args.
 *  
 * CloudWatch accepts a max of 10 dimensions per metric
 * we include service name as a dimension
 * so we take up to 9 values as additional dimensions
 * before we return our dimensions array
 * 
 * @param   {JSON}  service             Service dimension. (e.g. {service: 'value'}) 
 * @param   {JSON}  extra_dimensions    Extra metric dimensions and. Optional. (e.g. {customer: customerId})
 * 
 * @returns {String} Dimensions in the form of "service=my_service,dimension=value"
 */
const buildDimensionsStatsDFormat = (service, extra_dimensions) => {
    let dimensions = `service=${service}`
    if (extra_dimensions) {
        Object.keys(extra_dimensions).slice(0, 9).forEach(k => {
            dimensions = `${dimensions},${k}=${extra_dimensions[k]}`
        });
    }
    return dimensions
}