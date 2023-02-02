"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _styledComponents = _interopRequireDefault(require("styled-components"));
require("./styles.css");
var _antd = require("antd");
var AntIcons = _interopRequireWildcard(require("@ant-design/icons"));
var _jsonata = _interopRequireDefault(require("jsonata"));
var _componentMessageBus = require("@ivoyant/component-message-bus");
var _jsPlugin = _interopRequireDefault(require("js-plugin"));
var _componentFeatureFlagging = require("@ivoyant/component-feature-flagging");
var _componentCache = require("@ivoyant/component-cache");
var _fineTune = _interopRequireDefault(require("../../../../src/utils/fineTune"));
var _UnlockIcon = _interopRequireDefault(require("./UnlockIcon"));
var _OverrideSqaPin = _interopRequireDefault(require("./OverrideModals/OverrideSqaPin"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
/* eslint-disable react/prop-types */

// import styles from './styles.less';
// import '../../../globalStyles/styles.css';

// override modals - one step

const {
  Option
} = _antd.Select;
const {
  Text
} = _antd.Typography;
const StyledAlert = (0, _styledComponents.default)(_antd.Alert)`
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
const StyledSelect = (0, _styledComponents.default)(_antd.Select)`
    margin-bottom: 15px;
`;
const SELECT_PHONE_NUMBER_ERROR_MSG_KEY = 'one_step_reset_sqa_select_phone_number_error_msg';
const OneStep = props => {
  function usePrevious(value) {
    const ref = (0, _react.useRef)();
    (0, _react.useEffect)(() => {
      ref.current = value;
    });
    return ref.current;
  }
  const {
    component,
    parentProps,
    properties
  } = props;
  const {
    params,
    id
  } = component;
  const interactionState = _componentCache.cache.get('interaction');
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
    show = true
  } = params;
  const {
    composeElement
  } = new _fineTune.default(className, fineTune?.overideTypeName || '_one-step', fineTune);
  const {
    optionExpr,
    placeholder,
    selectedDataKey
  } = selectMeta;
  const {
    data
  } = props.data;
  const {
    resetVoicmailLLFlags
  } = data;
  const datasource = parentProps.datasources[params.datasource.id];
  const finalMetadata = window[sessionStorage.tabId]?.alasql?.tables?.datasource_360_metadata?.data;
  const showNtpButton = finalMetadata?.find(_ref => {
    let {
      domain
    } = _ref;
    return domain === 'features';
  })?.metadata?.categories?.find(_ref2 => {
    let {
      name
    } = _ref2;
    return name === 'showNtpButton';
  });
  const [visible, setVisible] = (0, _react.useState)(false);
  const [pending, setPending] = (0, _react.useState)(false);
  const [result, setResult] = (0, _react.useState)('unset');
  const [selectedData, setSelectedData] = (0, _react.useState)(false);
  const [request, setRequest] = (0, _react.useState)('');
  const [alertMessage, setAlertMessage] = (0, _react.useState)(undefined);
  const [updatedOptionsData, setUpdatedOptionsData] = (0, _react.useState)([]);
  const [hasSetInteractionId, setHasSetInteractionId] = (0, _react.useState)(false);

  // override modals state
  const [showOverrideSqa, setShowOverrideSqa] = (0, _react.useState)(false);
  const prevResult = usePrevious({
    result,
    pending,
    visible
  });
  let options = [];
  const {
    attId,
    profile
  } = window[window.sessionStorage?.tabId].COM_IVOYANT_VARS;
  if (optionExpr) {
    options = (0, _jsonata.default)(`[${optionExpr}]`).evaluate(data);
  }
  const updatedOptions = [];
  const updateOptions = () => {
    const {
      lineLevelFeatures
    } = resetVoicmailLLFlags;
    if (data?.resetVoicmailLLFlags?.lineLevelFeatures) {
      options.filter(op => {
        return lineLevelFeatures?.some(rlf => {
          if (op === rlf.ctn) {
            return rlf.features.map(f => {
              if (f.feature === 'voicemailPasswordReset') {
                return updatedOptions.push({
                  ctn: op,
                  enableLine: f.enable,
                  enableLineReason: f.reasons[0]
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
  (0, _react.useEffect)(() => {
    if (data?.resetVoicmailLLFlags) {
      updateOptions();
    }
  }, [resetVoicmailLLFlags]);
  const getForm = () => {
    return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, resetVoicmailLLFlags && updatedOptionsData?.length > 0 ? /*#__PURE__*/_react.default.createElement(_antd.Select, {
      onChange: e => {
        setSelectedData(e);
      },
      placeholder: placeholder,
      allowClear: allowClear,
      style: modalProps[result]?.formStyle,
      defaultValue: selectedData || `Select a number`
    }, updatedOptionsData.map(option => /*#__PURE__*/_react.default.createElement(Option, {
      key: option.ctn,
      value: option.ctn,
      disabled: !option?.enableLine,
      title: option?.enableLineReason
    }, option?.ctn))) : /*#__PURE__*/_react.default.createElement(_antd.Select, {
      onChange: e => {
        // destroy notification
        _antd.message.destroy(SELECT_PHONE_NUMBER_ERROR_MSG_KEY);
        setSelectedData(e);
      },
      placeholder: placeholder,
      allowClear: allowClear,
      style: modalProps[result]?.formStyle,
      defaultValue: selectedData || `Select a number`
    }, options.map(option => /*#__PURE__*/_react.default.createElement(Option, {
      key: option,
      value: option
    }, option))));
  };
  const getMessage = () => {
    let alert;
    switch (result) {
      case 'success':
        alert = /*#__PURE__*/_react.default.createElement(_antd.Alert, {
          message: alertMessage,
          type: "success",
          showIcon: true,
          className: alertClass
        });
        break;
      case 'error':
        alert = /*#__PURE__*/_react.default.createElement(_antd.Alert, {
          message: alertMessage || 'Unknown error occurred',
          type: "error",
          showIcon: true,
          className: alertClass
        });
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
    const requestData = {
      ...data
    };
    requestData[selectedDataKey] = selectedData;
    setRequest(requestData);
  };
  const getFooter = () => {
    // for override sqa
    let currentProfile, overrideResetPinSqa;
    if (showOverride && overrideType === 'resetSQA') {
      currentProfile = data?.profilesInfo?.profiles?.filter(p => p?.name === profile)[0];
      overrideResetPinSqa = currentProfile?.categories?.filter(p => p?.name?.toString() === 'overrideResetPinSqa')[0]?.enable === 'true';
    }
    return /*#__PURE__*/_react.default.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between'
      }
    }, /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_antd.Button, {
      key: "ok",
      onClick: onSubmit,
      loading: pending,
      style: modalProps[result]?.okButtonStyle,
      type: "primary",
      size: buttonSize
    }, modalProps[result]?.okButtonText), /*#__PURE__*/_react.default.createElement(_antd.Button, {
      key: "cancel",
      onClick: onCancel,
      disabled: pending,
      style: modalProps[result]?.cancelButtonStyle,
      size: buttonSize
    }, modalProps[result]?.cancelButtonText)), showOverride && overrideResetPinSqa && /*#__PURE__*/_react.default.createElement("div", {
      style: {
        textAlign: 'right'
      }
    }, /*#__PURE__*/_react.default.createElement(_antd.Button, {
      className: "one-step-override-button",
      key: "override",
      size: buttonSize,
      onClick: () => {
        if (overrideType === 'resetSQA' && overrideResetPinSqa) {
          if (selectedData) {
            onCancel();
            setShowOverrideSqa(true);
          } else {
            _antd.message.error({
              content: 'Please select a phone number',
              key: SELECT_PHONE_NUMBER_ERROR_MSG_KEY
            });
          }
        }
      }
    }, "Override")));
  };
  (0, _react.useEffect)(() => {
    if (!visible) {
      _componentMessageBus.MessageBus.unsubscribe(id);
    }
  }, [visible, result]);
  (0, _react.useEffect)(() => {
    if (pending) {
      _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.INIT'), {
        header: {
          registrationId: id,
          workflow,
          eventType: 'INIT'
        }
      });
    }
  }, [pending]);
  (0, _react.useEffect)(() => {
    if (prevResult?.pending && !pending && result === 'unset' && prevResult?.result === 'failure') {
      _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.CANCEL'), {
        header: {
          registrationId: id,
          workflow,
          eventType: 'CANCEL'
        }
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
    mainRequest = indexBody === -1 ? `{'body':{'interaction_id':"${interactionState?.interactionId}"},'params':{${mainRequest.slice(indexCtn - 1, mainRequest.length - 2)}}}` : mainRequest;

    // once interactionid is injected, switch the new request with the old request.
    params.requestMapping = mainRequest;
  }
  (0, _react.useEffect)(() => {
    if (pending && request) {
      // if the sendInteractionId flag is on, inject the interaction id into the requestMapping params
      if (sendInteractionId && !hasSetInteractionId) {
        injectInteractionIdIntoParams();
        setHasSetInteractionId(true);
      }
      _componentMessageBus.MessageBus.subscribe(id, 'WF.'.concat(workflow).concat('.STATE.CHANGE'), handleStateChange);
      _componentMessageBus.MessageBus.send('WF.'.concat(workflow).concat('.SUBMIT'), {
        header: {
          registrationId: id,
          workflow,
          eventType: 'SUBMIT'
        },
        body: {
          datasource,
          request,
          requestMapping: params.requestMapping,
          responseMapping
        }
      });
    }
  }, [pending, request]);
  (0, _react.useEffect)(() => {
    if (enableEvent) {
      _componentMessageBus.MessageBus.subscribe(id.concat('.enable'), enableEvent, onEnableEvent);
    }
    return () => {
      if (enableEvent) {
        _componentMessageBus.MessageBus.unsubscribe(id.concat('.enable'));
      }
    };
  }, []);
  const Flex = composeElement();
  const LockIcon = AntIcons[lockIcon];
  const getFeatureData = featureKey => {
    const featureFlag = _jsPlugin.default.invoke('features.evaluate', featureKey);
    return featureFlag && featureFlag[0];
  };
  const featureFlag = show ? properties.featureFlagKey && getFeatureData(properties.featureFlagKey) : undefined;

  // logic to show button or not
  const showButton = isNtpButton ? showNtpButton?.enable === 'true' : true;
  const showButtonOption = properties.title === 'Number Transfer Pin' ? showButton ? !showButton : 'disabled' : (options.length === 0 || featureFlag && !featureFlag.enabled || !showButton) && 'disabled';
  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, showOverride && overrideType === 'resetSQA' && overrideDatasource !== undefined && /*#__PURE__*/_react.default.createElement(_OverrideSqaPin.default, {
    visible: showOverrideSqa,
    setShowOverrideSqa: setShowOverrideSqa,
    selectedData: {
      selectedData,
      ban: data?.accountDetails?.billingAccountNumber
    },
    setSelectedData: setSelectedData,
    securityQuestions: data?.security?.securityCategories.filter(cat => cat?.name === 'createAccountSecurityQuestions')[0]?.categories,
    datasource: parentProps.datasources[overrideDatasource]
  }), show && /*#__PURE__*/_react.default.createElement(_componentFeatureFlagging.FeatureFlaggingTooltip, {
    feature: properties.title,
    featureFlag: isNtpButton === 'true' ? false : featureFlag
  }, showButton && /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement("div", {
    className: `cricket-onestep-button ${showButtonOption}`,
    onClick: options.length > 0 ? toggleModal : undefined
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: "title"
  }, properties.title), icon && /*#__PURE__*/_react.default.createElement("div", {
    className: "icon-wrapper"
  }, /*#__PURE__*/_react.default.createElement(_antd.Badge, {
    count: /*#__PURE__*/_react.default.createElement("div", {
      className: "icon-badge"
    }, /*#__PURE__*/_react.default.createElement(LockIcon, {
      className: "lock-icon"
    }))
  }, /*#__PURE__*/_react.default.createElement(_UnlockIcon.default, {
    name: icon,
    className: "icon"
  })))))), /*#__PURE__*/_react.default.createElement(_antd.Modal, {
    title: title,
    open: visible,
    mask: false,
    footer: getFooter(),
    maskClosable: maskCloseable,
    closable: closeable,
    destroyOnClose: destroyOnClose,
    className: "unlock-modal"
  }, /*#__PURE__*/_react.default.createElement(Text, null, modalProps[result]?.info || modalProps?.default?.info), getForm(), getMessage()));
};
var _default = OneStep;
exports.default = _default;
module.exports = exports.default;