// @flow

import React, { Component } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  BackAndroid as RNBackAndroid,
  BackHandler as RNBackHandler,
} from 'react-native';

import Overlay from './Overlay';

import FadeAnimation from '../animations/FadeAnimation';
import type { DialogType } from '../Type';

const BackHandler = RNBackHandler || RNBackAndroid;


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// dialog states
const DIALOG_OPENING: string = 'opening';
const DIALOG_OPENED: string = 'opened';
const DIALOG_CLOSING: string = 'closing';
const DIALOG_CLOSED: string = 'closed';

// default dialog config
const DEFAULT_ANIMATION_DURATION: number = 150;
const DEFAULT_WIDTH: number = screenWidth;
const DEFAULT_HEIGHT: number = 300;
const DISMISS_ON_TOUCH_OUTSIDE: boolean = true;
const DISMISS_ON_HARDWARE_BACK_PRESS: boolean = true;
const HAVE_OVERLAY: boolean = true;

// event types
// only for android
const HARDWARE_BACK_PRESS_EVENT: string = 'hardwareBackPress';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialog: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  hidden: {
    top: -10000,
    left: 0,
    height: 0,
    width: 0,
  },
});

class Dialog extends Component {
  static defaultProps = {
    containerStyle: null,
    animationDuration: DEFAULT_ANIMATION_DURATION,
    dialogAnimation: new FadeAnimation({ animationDuration: DEFAULT_ANIMATION_DURATION }),
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    dismissOnTouchOutside: DISMISS_ON_TOUCH_OUTSIDE,
    dismissOnHardwareBackPress: DISMISS_ON_HARDWARE_BACK_PRESS,
    haveOverlay: HAVE_OVERLAY,
    onShown: () => {},
    onDismissed: () => {},
    show: false,
  }

  state = {
    dialogState: DIALOG_CLOSED,
  };

  componentDidMount() {
    const { show } = this.props;

    if (show) {
      this.show();
    }

    BackHandler.addEventListener(HARDWARE_BACK_PRESS_EVENT, this.hardwareBackEventHandler);
  }

  componentWillReceiveProps(nextProps: DialogType) {
    if (this.props.show !== nextProps.show) {
      if (nextProps.show) {
        this.show();
      } else {
        this.dismiss();
      }
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(HARDWARE_BACK_PRESS_EVENT, this.hardwareBackEventHandler);
  }

  onOverlayPress = () => {
    const { dismissOnTouchOutside } = this.props;

    if (dismissOnTouchOutside) {
      this.dismiss();
    }
  }

  setDialogState(toValue: number, callback?: Function = () => {}) {
    let dialogState = toValue ? DIALOG_OPENING : DIALOG_CLOSING;

    // to make sure has passed the dialogAnimation prop and the dialogAnimation has toValue method
    if (this.props.dialogAnimation && this.props.dialogAnimation.toValue) {
      this.props.dialogAnimation.toValue(toValue);
    }

    this.setState({ dialogState });

    setTimeout(() => {
      dialogState = dialogState === DIALOG_CLOSING ? DIALOG_CLOSED : DIALOG_OPENED;
      this.setState({ dialogState });
      callback();
    }, this.props.animationDuration);
  }

  get pointerEvents(): string {
    if (this.props.overlayPointerEvents) {
      return this.props.overlayPointerEvents;
    }
    return this.state.dialogState === DIALOG_OPENED ? 'auto' : 'none';
  }

  get dialogSize(): Object {
    let { width, height } = this.props;

    if (width && width > 0.0 && width <= 1.0) {
      width *= screenWidth;
    }
    if (height && height > 0.0 && height <= 1.0) {
      height *= screenHeight;
    }

    return { width, height };
  }

  show() {
    const { onShown } = this.props;
    if (![DIALOG_OPENING, DIALOG_OPENED].includes(this.state.dialogState)) {
      this.setDialogState(1, onShown);
    }
  }

  dismiss() {
    const { onDismissed } = this.props;
    if (![DIALOG_CLOSING, DIALOG_CLOSED].includes(this.state.dialogState)) {
      this.setDialogState(0, onDismissed);
    }
  }

  hardwareBackEventHandler = (): boolean => {
    const { dismissOnHardwareBackPress } = this.props;
    const { dialogState } = this.state;

    if (dismissOnHardwareBackPress && dialogState === DIALOG_OPENED) {
      this.dismiss();
      return true;
    }
    return false;
  }

  props: DialogType

  render() {
    const dialogState = this.state.dialogState;
    const overlayPointerEvents = this.pointerEvents;
    const dialogSize = this.dialogSize;
    const hidden = dialogState === DIALOG_CLOSED && styles.hidden;
    const isShowOverlay = (
      [DIALOG_OPENING, DIALOG_OPENED].includes(dialogState) && this.props.haveOverlay
    );
    const dimensions = {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    };

    return (
      <View style={[styles.container, hidden, dimensions, this.props.containerStyle]}>
        <Overlay
          pointerEvents={overlayPointerEvents}
          showOverlay={isShowOverlay}
          onPress={this.onOverlayPress}
          backgroundColor={this.props.overlayBackgroundColor}
          opacity={this.props.overlayOpacity}
          animationDuration={this.props.animationDuration}
        />
        <Animated.View
          style={[
            styles.dialog,
            dialogSize,
            this.props.dialogStyle,
            this.props.dialogAnimation.animations,
          ]}
        >
          {this.props.children}
          {this.props.actions}
        </Animated.View>
      </View>
    );
  }
}

export default Dialog;
