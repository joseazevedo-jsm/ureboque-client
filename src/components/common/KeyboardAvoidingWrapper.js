import React from 'react';
import { KeyboardAvoidingView } from 'react-native';
import { keyboardConfig } from '../../theme';

const KeyboardAvoidingWrapper = ({
  children,
  style,
  behavior = keyboardConfig.behavior,
  keyboardVerticalOffset = keyboardConfig.keyboardVerticalOffset,
  enabled = true,
  ...props
}) => (
  <KeyboardAvoidingView
    style={[{ flex: 1 }, style]}
    behavior={behavior}
    keyboardVerticalOffset={keyboardVerticalOffset}
    enabled={enabled}
    {...props}
  >
    {children}
  </KeyboardAvoidingView>
);

export default KeyboardAvoidingWrapper;
