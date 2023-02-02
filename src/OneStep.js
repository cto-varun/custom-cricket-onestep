/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

// import styles from './styles.less';
// import '../../../globalStyles/styles.css';
import './styles.css';

import { Button, Modal, Typography, Alert, Select, Badge, message } from 'antd';
import * as AntIcons from '@ant-design/icons';
import jsonata from 'jsonata';

import { MessageBus } from '@ivoyant/component-message-bus';
import plugin from 'js-plugin';
import { FeatureFlaggingTooltip } from '@ivoyant/component-feature-flagging';
import { cache } from '@ivoyant/component-cache';
import FineTune from '../../../../src/utils/fineTune';
import UnlockIcon from './UnlockIcon';

// override modals - one step
import OverrideSqaPin from './OverrideModals/OverrideSqaPin';

const { Option } = Select;
const { Text } = Typography;

const StyledAlert = styled(Alert)`
    display: flex;
    margin: 0px;
    margin-top: 5px;
    margin-bottom: 15px;
    padding-left: 10px;
    height: auto;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    white-space: pre-wrap;

    .ant-alert-content {
        padding: 10px;
    }
`;

const StyledSelect = styled(Select)`
    margin-bottom: 15px;
`;

const SELECT_PHONE_NUMBER_ERROR_MSG_KEY =
    'one_step_reset_sqa_select_phone_number_error_msg';

const OneStep = (props) => {
    function usePrevious(value) {
        const ref = useRef();
        useEffect(() => {
            ref.current = value;
        });
        return ref.current;
    }

    const { component, parentProps, properties } = props;
    const { params, id } = component;
    const interactionState = cache.get('interaction');
    const {
        showOverride,
        overrideType,
        overrideDatasource,
        maskCloseable = false,
        closeable = false,
        alertClass = 'unlock-alert',
        modalFooterClass = 'unlock-footer',
        sendInteractionId = false,
        isNtpButton = false,
        destroyOnClose = true,
        buttonSize = 'default',
        modalProps,
        workflow,
        successStates,
        errorStates,
        responseMapping,
        requestMapping,
        allowClear = false,
        selectMeta,
        title,
        fineTune,
        className,
        icon,
        lockIcon,
        featureFlagDisableKeys,
        enableEvent,
        show = true,
    } = params;

    const { composeElement } = new FineTune(
        className,
        fineTune?.overideTypeName || '_one-step',
        fineTune
    );

    const { optionExpr, placeholder, selectedDataKey } = selectMeta;
    const { data } = props.data;
    const { resetVoicmailLLFlags } = data;
    const datasource = parentProps.datasources[params.datasource.id];

    const finalMetadata =
        window[sessionStorage.tabId]?.alasql?.tables?.datasource_360_metadata
            ?.data;

    const showNtpButton = finalMetadata
        ?.find(({ domain }) => domain === 'features')
        ?.metadata?.categories?.find(({ name }) => name === 'showNtpButton');

    const [visible, setVisible] = useState(false);
    const [pending, setPending] = useState(false);
    const [result, setResult] = useState('unset');
    const [selectedData, setSelectedData] = useState(false);
    const [request, setRequest] = useState('');
    const [alertMessage, setAlertMessage] = useState(undefined);
    const [updatedOptionsData, setUpdatedOptionsData] = useState([]);
    const [hasSetInteractionId, setHasSetInteractionId] = useState(false);

    // override modals state
    const [showOverrideSqa, setShowOverrideSqa] = useState(false);

    const prevResult = usePrevious({ result, pending, visible });

    let options = [];

    const { attId, profile } = window[
        window.sessionStorage?.tabId
    ].COM_IVOYANT_VARS;

    if (optionExpr) {
        options = jsonata(`[${optionExpr}]`).evaluate(data);
    }

    const updatedOptions = [];

    const updateOptions = () => {
        const { lineLevelFeatures } = resetVoicmailLLFlags;
        if (data?.resetVoicmailLLFlags?.lineLevelFeatures) {
            options.filter((op) => {
                return lineLevelFeatures?.some((rlf) => {
                    if (op === rlf.ctn) {
                        return rlf.features.map((f) => {
                            if (f.feature === 'voicemailPasswordReset') {
                                return updatedOptions.push({
                                    ctn: op,
                                    enableLine: f.enable,
                                    enableLineReason: f.reasons[0],
                                });
                            }
                        });
                    }
                });
            });
        }
        setUpdatedOptionsData(updatedOptions);
    };

    const handleStateChange = (subscriptionId, topic, eventData) => {
        if (successStates.includes(eventData.value)) {
            setAlertMessage(eventData.event.data.data.message);
            setPending(false);
            setResult(eventData.event.data.data.isError ? 'error' : 'success');
        } else if (errorStates.includes(eventData.value)) {
            setAlertMessage(eventData.event.data.message);
            setPending(false);
            setResult('error');
        }
    };

    const onEnableEvent = (subscriptionId, topic, eventData, closure) => {
        if (eventData && eventData[0]?.telephoneData?.telephoneNumber) {
            setSelectedData(eventData[0]?.telephoneData?.telephoneNumber);
        }
        setVisible(!visible);
    };

    useEffect(() => {
        if (data?.resetVoicmailLLFlags) {
            updateOptions();
        }
    }, [resetVoicmailLLFlags]);

    const getForm = () => {
        return (
            <>
                {resetVoicmailLLFlags && updatedOptionsData?.length > 0 ? (
                    <Select
                        onChange={(e) => {
                            setSelectedData(e);
                        }}
                        placeholder={placeholder}
                        allowClear={allowClear}
                        style={modalProps[result]?.formStyle}
                        defaultValue={selectedData || `Select a number`}
                    >
                        {updatedOptionsData.map((option) => (
                            <Option
                                key={option.ctn}
                                value={option.ctn}
                                disabled={!option?.enableLine}
                                title={option?.enableLineReason}
                            >
                                {option?.ctn}
                            </Option>
                        ))}
                    </Select>
                ) : (
                    <Select
                        onChange={(e) => {
                            // destroy notification
                            message.destroy(SELECT_PHONE_NUMBER_ERROR_MSG_KEY);
                            setSelectedData(e);
                        }}
                        placeholder={placeholder}
                        allowClear={allowClear}
                        style={modalProps[result]?.formStyle}
                        defaultValue={selectedData || `Select a number`}
                    >
                        {options.map((option) => (
                            <Option key={option} value={option}>
                                {option}
                            </Option>
                        ))}
                    </Select>
                )}
            </>
        );
    };

    const getMessage = () => {
        let alert;
        switch (result) {
            case 'success':
                alert = (
                    <Alert
                        message={alertMessage}
                        type="success"
                        showIcon
                        className={alertClass}
                    />
                );
                break;
            case 'error':
                alert = (
                    <Alert
                        message={alertMessage || 'Unknown error occurred'}
                        type="error"
                        showIcon
                        className={alertClass}
                    />
                );
                break;
            default:
        }
        return alert;
    };

    const toggleModal = () => {
        setVisible(!visible);
    };

    const onCancel = () => {
        setResult('unset');
        setVisible(!visible);
    };

    const onSubmit = () => {
        setPending(true);
        const requestData = { ...data };
        requestData[selectedDataKey] = selectedData;
        setRequest(requestData);
    };

    const getFooter = () => {
        // for override sqa
        let currentProfile, overrideResetPinSqa;
        if (showOverride && overrideType === 'resetSQA') {
            currentProfile = data?.profilesInfo?.profiles?.filter(
                (p) => p?.name === profile
            )[0];
            overrideResetPinSqa =
                currentProfile?.categories?.filter(
                    (p) => p?.name?.toString() === 'overrideResetPinSqa'
                )[0]?.enable === 'true';
        }

        return (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <Button
                        key="ok"
                        onClick={onSubmit}
                        loading={pending}
                        style={modalProps[result]?.okButtonStyle}
                        type="primary"
                        size={buttonSize}
                    >
                        {modalProps[result]?.okButtonText}
                    </Button>
                    <Button
                        key="cancel"
                        onClick={onCancel}
                        disabled={pending}
                        style={modalProps[result]?.cancelButtonStyle}
                        size={buttonSize}
                    >
                        {modalProps[result]?.cancelButtonText}
                    </Button>
                </div>
                {showOverride && overrideResetPinSqa && (
                    <div style={{ textAlign: 'right' }}>
                        <Button
                            className="one-step-override-button"
                            key="override"
                            size={buttonSize}
                            onClick={() => {
                                if (
                                    overrideType === 'resetSQA' &&
                                    overrideResetPinSqa
                                ) {
                                    if (selectedData) {
                                        onCancel();
                                        setShowOverrideSqa(true);
                                    } else {
                                        message.error({
                                            content:
                                                'Please select a phone number',
                                            key: SELECT_PHONE_NUMBER_ERROR_MSG_KEY,
                                        });
                                    }
                                }
                            }}
                        >
                            Override
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    useEffect(() => {
        if (!visible) {
            MessageBus.unsubscribe(id);
        }
    }, [visible, result]);

    useEffect(() => {
        if (pending) {
            MessageBus.send('WF.'.concat(workflow).concat('.INIT'), {
                header: { registrationId: id, workflow, eventType: 'INIT' },
            });
        }
    }, [pending]);

    useEffect(() => {
        if (
            prevResult?.pending &&
            !pending &&
            result === 'unset' &&
            prevResult?.result === 'failure'
        ) {
            MessageBus.send('WF.'.concat(workflow).concat('.CANCEL'), {
                header: { registrationId: id, workflow, eventType: 'CANCEL' },
            });
        }
    }, [pending, result]);

    // function to inject interaction id into requestMapping params
    function injectInteractionIdIntoParams() {
        let mainRequest = params.requestMapping;

        // make the string consistent and remove all whitespace
        mainRequest = mainRequest.replace(/\s+/g, '');

        // find where the body of the request is
        const indexCtn = mainRequest.search('ctn');
        const indexBody = mainRequest.search('body');

        // index will be negative 1 if it can't find the body, so let's insert the body ourselves
        mainRequest =
            indexBody === -1
                ? `{'body':{'interaction_id':"${
                      interactionState?.interactionId
                  }"},'params':{${mainRequest.slice(
                      indexCtn - 1,
                      mainRequest.length - 2
                  )}}}`
                : mainRequest;

        // once interactionid is injected, switch the new request with the old request.
        params.requestMapping = mainRequest;
    }

    useEffect(() => {
        if (pending && request) {
            // if the sendInteractionId flag is on, inject the interaction id into the requestMapping params
            if (sendInteractionId && !hasSetInteractionId) {
                injectInteractionIdIntoParams();
                setHasSetInteractionId(true);
            }

            MessageBus.subscribe(
                id,
                'WF.'.concat(workflow).concat('.STATE.CHANGE'),
                handleStateChange
            );
            MessageBus.send('WF.'.concat(workflow).concat('.SUBMIT'), {
                header: { registrationId: id, workflow, eventType: 'SUBMIT' },
                body: {
                    datasource,
                    request,
                    requestMapping: params.requestMapping,
                    responseMapping,
                },
            });
        }
    }, [pending, request]);

    useEffect(() => {
        if (enableEvent) {
            MessageBus.subscribe(
                id.concat('.enable'),
                enableEvent,
                onEnableEvent
            );
        }

        return () => {
            if (enableEvent) {
                MessageBus.unsubscribe(id.concat('.enable'));
            }
        };
    }, []);

    const Flex = composeElement();

    const LockIcon = AntIcons[lockIcon];

    const getFeatureData = (featureKey) => {
        const featureFlag = plugin.invoke('features.evaluate', featureKey);
        return featureFlag && featureFlag[0];
    };

    const featureFlag = show
        ? properties.featureFlagKey && getFeatureData(properties.featureFlagKey)
        : undefined;

    // logic to show button or not
    const showButton = isNtpButton ? showNtpButton?.enable === 'true' : true;

    const showButtonOption =
        properties.title === 'Number Transfer Pin'
            ? showButton
                ? !showButton
                : 'disabled'
            : (options.length === 0 ||
                  (featureFlag && !featureFlag.enabled) ||
                  !showButton) &&
              'disabled';

    return (
        <>
            {showOverride &&
                overrideType === 'resetSQA' &&
                overrideDatasource !== undefined && (
                    <OverrideSqaPin
                        visible={showOverrideSqa}
                        setShowOverrideSqa={setShowOverrideSqa}
                        selectedData={{
                            selectedData,
                            ban: data?.accountDetails?.billingAccountNumber,
                        }}
                        setSelectedData={setSelectedData}
                        securityQuestions={
                            data?.security?.securityCategories.filter(
                                (cat) =>
                                    cat?.name ===
                                    'createAccountSecurityQuestions'
                            )[0]?.categories
                        }
                        datasource={parentProps.datasources[overrideDatasource]}
                    />
                )}
            {show && (
                <FeatureFlaggingTooltip
                    feature={properties.title}
                    featureFlag={isNtpButton === 'true' ? false : featureFlag}
                >
                    {showButton && (
                        <div>
                            <div
                                className={`cricket-onestep-button ${showButtonOption}`}
                                onClick={
                                    options.length > 0 ? toggleModal : undefined
                                }
                            >
                                <div className="title">{properties.title}</div>
                                {icon && (
                                    <div className="icon-wrapper">
                                        <Badge
                                            count={
                                                <div className="icon-badge">
                                                    <LockIcon className="lock-icon" />
                                                </div>
                                            }
                                        >
                                            <UnlockIcon
                                                name={icon}
                                                className="icon"
                                            />
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </FeatureFlaggingTooltip>
            )}
            <Modal
                title={title}
                open={visible}
                mask={false}
                footer={getFooter()}
                maskClosable={maskCloseable}
                closable={closeable}
                destroyOnClose={destroyOnClose}
                className="unlock-modal"
            >
                <Text>
                    {modalProps[result]?.info || modalProps?.default?.info}
                </Text>
                {getForm()}
                {getMessage()}
            </Modal>
        </>
    );
};

export default OneStep;
