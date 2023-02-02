"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _antd = require("antd");
var _componentMessageBus = require("@ivoyant/component-message-bus");
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
const {
  Option
} = _antd.Select;
const {
  Text
} = _antd.Typography;
const FILL_ALL_FIELDS_ERROR_MSG_KEY = 'ovverride_sqa_fill_all_fields_error_message';
const CHOOSE_SECURITY_QUESTION_ERROR_MSG_KEY = 'choose_security_question_error_msg_key';
const FORM_SPACE_GAP = 15;
const NO_SPECIAL_CHARACTERS_REGEX = new RegExp('^[a-zA-Z0-9]*$', 'i');
const PIN_REGEX = /^[0-9\b]+$/;
const WORKFLOW = 'OVERRIDESQAANDPIN';
const successStates = ['success'];
const errorStates = ['error'];
const responseMapping = {
  success: {
    success: {
      messageExpr: "'Reset Security Q&A and Pin Successful'"
    }
  },
  error: {
    messageExpr: "(error.response.data ? error.response.data.message : error.response.statusText) & ' : Could not send reset PIN and Security Q&A'"
  }
};
function OverrideSqaPin(_ref) {
  let {
    setShowOverrideSqa,
    visible,
    selectedData,
    securityQuestions,
    datasource,
    setSelectedData
  } = _ref;
  const [loading, setLoading] = (0, _react.useState)(false);
  const [resetComplete, setResetComplete] = (0, _react.useState)(false);
  const [securityAnswerError, setSecurityAnswerError] = (0, _react.useState)(false);
  const [securityPin, setSecurityPin] = (0, _react.useState)('');
  const [securityQuestion, setSecurityQuestion] = (0, _react.useState)();
  const [securityAnswer, setSecurityAnswer] = (0, _react.useState)();
  const [maskSecurityPin, setMaskSecurityPin] = (0, _react.useState)(false);
  const [maskSecurityAnswer, setMaskSecurityAnswer] = (0, _react.useState)(false);
  const destroyAllNotifications = () => {
    // destroy notifications
    _antd.message.destroy(FILL_ALL_FIELDS_ERROR_MSG_KEY);
    _antd.message.destroy(CHOOSE_SECURITY_QUESTION_ERROR_MSG_KEY);
  };
  const resetState = () => {
    setSelectedData(false);
    setResetComplete(false);
    setSecurityPin(undefined);
    setSecurityAnswer(undefined);
    setSecurityQuestion(undefined);
    destroyAllNotifications();
  };
  const handleOverrideSqaPinResponse = (successStates, errorStates) => (subscriptionId, topic, eventData, closure) => {
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
        _antd.notification.error({
          message: 'Error',
          description: 'Sorry for the inconvenience, We are having issues resetting your PIN and Security Q&A. Please try again.',
          duration: 5
        });
      }
      // reset loading state
      setLoading(false);
      // unsubscribe from message bus
      _componentMessageBus.MessageBus.unsubscribe(subscriptionId);
    }
  };
  const handleResetSqa = () => {
    // handle loading states of button
    setLoading(true);

    // Make the message bus call to reset PIN and SQA
    const registrationId = WORKFLOW;

    // init workflow
    _componentMessageBus.MessageBus.send('WF.'.concat(WORKFLOW).concat('.INIT'), {
      header: {
        registrationId: registrationId,
        workflow: WORKFLOW,
        eventType: 'INIT'
      }
    });

    // subscribe to workflow
    _componentMessageBus.MessageBus.subscribe(WORKFLOW, 'WF.'.concat(WORKFLOW).concat('.STATE.CHANGE'), handleOverrideSqaPinResponse(successStates, errorStates));

    // replace {ctn} with CTN in URL config
    const baseUri = datasource.baseUri.replace('{ctn}', selectedData.toString().trim());
    const url = datasource.url.replace('{ctn}', selectedData.selectedData.toString().trim());

    //This body will encrypted and decrypted in the other side
    const bodyData = {
      questionCode: securityQuestion,
      answer: securityAnswer,
      pin: securityPin
    };

    // submit call
    _componentMessageBus.MessageBus.send('WF.'.concat(WORKFLOW).concat('.SUBMIT'), {
      header: {
        registrationId: registrationId,
        workflow: WORKFLOW,
        eventType: 'SUBMIT'
      },
      body: {
        datasource: {
          ...datasource,
          baseUri,
          url
        },
        request: {
          body: bodyData
        },
        responseMapping
      }
    });
  };
  return /*#__PURE__*/_react.default.createElement(_antd.Modal, {
    open: visible,
    className: "unlock-modal",
    maskClosable: false,
    destroyOnClose: true,
    title: "Reset Security Q&A and Pin Number",
    closable: false,
    width: resetComplete ? 520 : 936,
    mask: false,
    footer: resetComplete ? /*#__PURE__*/_react.default.createElement("div", {
      style: {
        textAlign: 'right',
        marginTop: '10px'
      }
    }, /*#__PURE__*/_react.default.createElement(_antd.Button, {
      type: "primary",
      onClick: () => {
        resetState();
        setShowOverrideSqa(false);
      }
    }, "Done")) : /*#__PURE__*/_react.default.createElement("div", {
      style: {
        textAlign: 'right',
        marginTop: '10px'
      }
    }, /*#__PURE__*/_react.default.createElement(_antd.Button, {
      type: "primary",
      onClick: () => {
        if (securityAnswerError || securityAnswer === undefined || securityAnswer.length === 0 || securityPin === undefined || securityPin.length === 0 || securityQuestion === undefined || securityQuestion.length === 0) {
          if (securityQuestion === undefined || securityQuestion.length === 0) {
            _antd.message.error({
              content: 'Please select a security question',
              duration: 2.5,
              key: CHOOSE_SECURITY_QUESTION_ERROR_MSG_KEY
            });
          } else {
            _antd.message.error({
              content: 'Please make sure you have filled up all input fields',
              duration: 2.5,
              key: FILL_ALL_FIELDS_ERROR_MSG_KEY
            });
          }
        } else {
          handleResetSqa();
        }
      }
    }, "Submit Changes"), /*#__PURE__*/_react.default.createElement(_antd.Button, {
      style: {
        marginLeft: '10px'
      },
      onClick: () => {
        resetState();
        setShowOverrideSqa(false);
      }
    }, "Cancel"))
  }, /*#__PURE__*/_react.default.createElement(_antd.Spin, {
    spinning: loading,
    tip: "Override in-progress please wait..."
  }, resetComplete ? /*#__PURE__*/_react.default.createElement(_antd.Alert, {
    message: "Security Q&A and PIN Number were successfully updated.",
    type: "success",
    showIcon: true
  }) : /*#__PURE__*/_react.default.createElement(_antd.Row, {
    gutter: 16
  }, /*#__PURE__*/_react.default.createElement(_antd.Col, {
    span: 12
  }, /*#__PURE__*/_react.default.createElement(_antd.Space, {
    direction: "vertical",
    gap: FORM_SPACE_GAP
  }, /*#__PURE__*/_react.default.createElement("p", {
    style: {
      marginBottom: 0
    }
  }, "Please choose a security question and answer", /*#__PURE__*/_react.default.createElement("span", {
    style: {
      color: 'red'
    }
  }, "*")), /*#__PURE__*/_react.default.createElement(_antd.Select, {
    value: securityQuestion,
    className: "fs-exclude one-step-override-select-box",
    placeholder: "Select Security Question",
    style: {
      width: '100%'
    },
    onChange: value => {
      setSecurityQuestion(value);
    }
  }, securityQuestions.map(question => /*#__PURE__*/_react.default.createElement(Option, {
    key: question?.name,
    value: question?.name
  }, question?.value))), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_antd.Input, {
    type: maskSecurityAnswer ? 'password' : 'text',
    value: securityAnswer,
    className: securityAnswerError ? 'fs-exclude masked-input-error' : 'fs-exclude',
    placeholder: "Enter Answer for the Selected Question",
    style: {
      width: '100%'
    },
    autoComplete: "new-password",
    onBlur: () => {
      setMaskSecurityAnswer(true);
    },
    onFocus: () => {
      setMaskSecurityAnswer(false);
    },
    onChange: e => {
      const {
        value
      } = e.target;
      setSecurityAnswerError(!NO_SPECIAL_CHARACTERS_REGEX.test(value));
      setSecurityAnswer(value);
    }
  }), securityAnswerError && /*#__PURE__*/_react.default.createElement(Text, {
    type: "danger"
  }, "No Special Characters Allowed")))), /*#__PURE__*/_react.default.createElement(_antd.Col, {
    span: 12
  }, /*#__PURE__*/_react.default.createElement(_antd.Space, {
    direction: "vertical",
    gap: FORM_SPACE_GAP
  }, /*#__PURE__*/_react.default.createElement("p", {
    style: {
      marginBottom: 0
    }
  }, "Please choose a 4-digit PIN to authenticate your account", /*#__PURE__*/_react.default.createElement("span", {
    style: {
      color: 'red'
    }
  }, "*")), /*#__PURE__*/_react.default.createElement(_antd.Input, {
    value: securityPin,
    className: "fs-exclude",
    type: maskSecurityPin ? 'password' : 'text',
    placeholder: "Enter 4 digit PIN",
    maxLength: 4,
    style: {
      width: '100%'
    },
    autoComplete: "new-password",
    onBlur: () => {
      setMaskSecurityPin(true);
    },
    onFocus: () => {
      setMaskSecurityPin(false);
    },
    onChange: e => {
      const {
        value
      } = e.target;
      if (PIN_REGEX.test(value) || value === '') setSecurityPin(value);
    }
  }))))));
}
var _default = OverrideSqaPin;
exports.default = _default;
module.exports = exports.default;