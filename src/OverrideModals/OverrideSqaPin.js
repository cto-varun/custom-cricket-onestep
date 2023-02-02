import React, { useState } from 'react';
import {
    Modal,
    Space,
    Row,
    Col,
    Input,
    Select,
    Button,
    Alert,
    Spin,
    Typography,
    notification,
    message,
} from 'antd';
import { MessageBus } from '@ivoyant/component-message-bus';

const { Option } = Select;
const { Text } = Typography;

const FILL_ALL_FIELDS_ERROR_MSG_KEY =
    'ovverride_sqa_fill_all_fields_error_message';
const CHOOSE_SECURITY_QUESTION_ERROR_MSG_KEY =
    'choose_security_question_error_msg_key';
const FORM_SPACE_GAP = 15;
const NO_SPECIAL_CHARACTERS_REGEX = new RegExp('^[a-zA-Z0-9]*$', 'i');
const PIN_REGEX = /^[0-9\b]+$/;
const WORKFLOW = 'OVERRIDESQAANDPIN';
const successStates = ['success'];
const errorStates = ['error'];
const responseMapping = {
    success: {
        success: {
            messageExpr: "'Reset Security Q&A and Pin Successful'",
        },
    },
    error: {
        messageExpr:
            "(error.response.data ? error.response.data.message : error.response.statusText) & ' : Could not send reset PIN and Security Q&A'",
    },
};

function OverrideSqaPin({
    setShowOverrideSqa,
    visible,
    selectedData,
    securityQuestions,
    datasource,
    setSelectedData,
}) {
    const [loading, setLoading] = useState(false);
    const [resetComplete, setResetComplete] = useState(false);

    const [securityAnswerError, setSecurityAnswerError] = useState(false);

    const [securityPin, setSecurityPin] = useState('');
    const [securityQuestion, setSecurityQuestion] = useState();
    const [securityAnswer, setSecurityAnswer] = useState();

    const [maskSecurityPin, setMaskSecurityPin] = useState(false);
    const [maskSecurityAnswer, setMaskSecurityAnswer] = useState(false);

    const destroyAllNotifications = () => {
        // destroy notifications
        message.destroy(FILL_ALL_FIELDS_ERROR_MSG_KEY);
        message.destroy(CHOOSE_SECURITY_QUESTION_ERROR_MSG_KEY);
    };

    const resetState = () => {
        setSelectedData(false);
        setResetComplete(false);
        setSecurityPin(undefined);
        setSecurityAnswer(undefined);
        setSecurityQuestion(undefined);
        destroyAllNotifications();
    };

    const handleOverrideSqaPinResponse = (successStates, errorStates) => (
        subscriptionId,
        topic,
        eventData,
        closure
    ) => {
        const state = eventData.value;
        const isSuccess = successStates.includes(state);
        const isFailure = errorStates.includes(state);
        if (isSuccess || isFailure) {
            if (isSuccess) {
                // after getting success response, set happy state
                setResetComplete(true);
            }
            if (isFailure) {
                // handle error state -> show notification
                notification.error({
                    message: 'Error',
                    description:
                        'Sorry for the inconvenience, We are having issues resetting your PIN and Security Q&A. Please try again.',
                    duration: 5,
                });
            }
            // reset loading state
            setLoading(false);
            // unsubscribe from message bus
            MessageBus.unsubscribe(subscriptionId);
        }
    };

    const handleResetSqa = () => {
        // handle loading states of button
        setLoading(true);

        // Make the message bus call to reset PIN and SQA
        const registrationId = WORKFLOW;

        // init workflow
        MessageBus.send('WF.'.concat(WORKFLOW).concat('.INIT'), {
            header: {
                registrationId: registrationId,
                workflow: WORKFLOW,
                eventType: 'INIT',
            },
        });

        // subscribe to workflow
        MessageBus.subscribe(
            WORKFLOW,
            'WF.'.concat(WORKFLOW).concat('.STATE.CHANGE'),
            handleOverrideSqaPinResponse(successStates, errorStates)
        );

        // replace {ctn} with CTN in URL config
        const baseUri = datasource.baseUri.replace(
            '{ctn}',
            selectedData.toString().trim()
        );
        const url = datasource.url.replace(
            '{ctn}',
            selectedData.selectedData.toString().trim()
        );

        //This body will encrypted and decrypted in the other side
        const bodyData = {
            questionCode: securityQuestion,
            answer: securityAnswer,
            pin: securityPin,
        };

        // submit call
        MessageBus.send('WF.'.concat(WORKFLOW).concat('.SUBMIT'), {
            header: {
                registrationId: registrationId,
                workflow: WORKFLOW,
                eventType: 'SUBMIT',
            },
            body: {
                datasource: {
                    ...datasource,
                    baseUri,
                    url,
                },
                request: {
                    body: bodyData,
                },
                responseMapping,
            },
        });
    };

    return (
        <Modal
            open={visible}
            className="unlock-modal"
            maskClosable={false}
            destroyOnClose
            title="Reset Security Q&A and Pin Number"
            closable={false}
            width={resetComplete ? 520 : 936}
            mask={false}
            footer={
                resetComplete ? (
                    <div style={{ textAlign: 'right', marginTop: '10px' }}>
                        <Button
                            type="primary"
                            onClick={() => {
                                resetState();
                                setShowOverrideSqa(false);
                            }}
                        >
                            Done
                        </Button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'right', marginTop: '10px' }}>
                        <Button
                            type="primary"
                            onClick={() => {
                                if (
                                    securityAnswerError ||
                                    securityAnswer === undefined ||
                                    securityAnswer.length === 0 ||
                                    securityPin === undefined ||
                                    securityPin.length === 0 ||
                                    securityQuestion === undefined ||
                                    securityQuestion.length === 0
                                ) {
                                    if (
                                        securityQuestion === undefined ||
                                        securityQuestion.length === 0
                                    ) {
                                        message.error({
                                            content:
                                                'Please select a security question',
                                            duration: 2.5,
                                            key: CHOOSE_SECURITY_QUESTION_ERROR_MSG_KEY,
                                        });
                                    } else {
                                        message.error({
                                            content:
                                                'Please make sure you have filled up all input fields',
                                            duration: 2.5,
                                            key: FILL_ALL_FIELDS_ERROR_MSG_KEY,
                                        });
                                    }
                                } else {
                                    handleResetSqa();
                                }
                            }}
                        >
                            Submit Changes
                        </Button>
                        <Button
                            style={{ marginLeft: '10px' }}
                            onClick={() => {
                                resetState();
                                setShowOverrideSqa(false);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                )
            }
        >
            <Spin spinning={loading} tip="Override in-progress please wait...">
                {resetComplete ? (
                    <Alert
                        message="Security Q&A and PIN Number were successfully updated."
                        type="success"
                        showIcon
                    />
                ) : (
                    <Row gutter={16}>
                        <Col span={12}>
                            <Space direction="vertical" gap={FORM_SPACE_GAP}>
                                <p style={{ marginBottom: 0 }}>
                                    Please choose a security question and answer
                                    <span style={{ color: 'red' }}>*</span>
                                </p>
                                <Select
                                    value={securityQuestion}
                                    className="fs-exclude one-step-override-select-box"
                                    placeholder="Select Security Question"
                                    style={{ width: '100%' }}
                                    onChange={(value) => {
                                        setSecurityQuestion(value);
                                    }}
                                >
                                    {securityQuestions.map((question) => (
                                        <Option
                                            key={question?.name}
                                            value={question?.name}
                                        >
                                            {question?.value}
                                        </Option>
                                    ))}
                                </Select>
                                <div>
                                    <Input
                                        type={
                                            maskSecurityAnswer
                                                ? 'password'
                                                : 'text'
                                        }
                                        value={securityAnswer}
                                        className={
                                            securityAnswerError
                                                ? 'fs-exclude masked-input-error'
                                                : 'fs-exclude'
                                        }
                                        placeholder="Enter Answer for the Selected Question"
                                        style={{ width: '100%' }}
                                        autoComplete="new-password"
                                        onBlur={() => {
                                            setMaskSecurityAnswer(true);
                                        }}
                                        onFocus={() => {
                                            setMaskSecurityAnswer(false);
                                        }}
                                        onChange={(e) => {
                                            const { value } = e.target;

                                            setSecurityAnswerError(
                                                !NO_SPECIAL_CHARACTERS_REGEX.test(
                                                    value
                                                )
                                            );

                                            setSecurityAnswer(value);
                                        }}
                                    />
                                    {securityAnswerError && (
                                        <Text type="danger">
                                            No Special Characters Allowed
                                        </Text>
                                    )}
                                </div>
                            </Space>
                        </Col>
                        <Col span={12}>
                            <Space direction="vertical" gap={FORM_SPACE_GAP}>
                                <p style={{ marginBottom: 0 }}>
                                    Please choose a 4-digit PIN to authenticate
                                    your account
                                    <span style={{ color: 'red' }}>*</span>
                                </p>
                                <Input
                                    value={securityPin}
                                    className="fs-exclude"
                                    type={maskSecurityPin ? 'password' : 'text'}
                                    placeholder="Enter 4 digit PIN"
                                    maxLength={4}
                                    style={{ width: '100%' }}
                                    autoComplete="new-password"
                                    onBlur={() => {
                                        setMaskSecurityPin(true);
                                    }}
                                    onFocus={() => {
                                        setMaskSecurityPin(false);
                                    }}
                                    onChange={(e) => {
                                        const { value } = e.target;

                                        if (
                                            PIN_REGEX.test(value) ||
                                            value === ''
                                        )
                                            setSecurityPin(value);
                                    }}
                                />
                            </Space>
                        </Col>
                    </Row>
                )}
            </Spin>
        </Modal>
    );
}

export default OverrideSqaPin;
