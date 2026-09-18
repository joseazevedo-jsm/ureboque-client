import React from 'react';
import { View, Image } from 'react-native';
import { AppText as Text } from './AppText';

import { spacing, colors, typography } from '../../theme';

const SplashScreen = () => {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.jumbo
      }}>
        <View style={{
          alignItems: 'center',
          marginBottom: spacing.massive
        }}>
          <Image
            source={require('../../../resources/icons/UREB_LOGO.png')}
            style={{
              width: 100,
              height: 100,
              marginBottom: spacing.xl,
              tintColor: colors.surface,
            }}
            resizeMode="contain"
          />
          <Image
            source={require('../../../resources/icons/UREB_TEXT.png')}
            style={{
              width: 200,
              height: 50,
              tintColor: colors.surface,
            }}
            resizeMode="contain"
          />
        </View>

        <Text style={{
          fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight,
          color: colors.primaryLight,
          textAlign: 'center',
          lineHeight: 24,
          fontWeight: '400'
        }}>Serviço de Reboque Rápido e Confiável</Text>
      </View>

      <View style={{
        paddingBottom: spacing.jumbo,
        paddingHorizontal: spacing.xl
      }}>
        <Text style={{
          fontSize: typography.caption.fontSize, lineHeight: typography.caption.lineHeight,
          color: colors.primaryLight,
          textAlign: 'center',
          fontWeight: '400'
        }}>© 2025 Ureboque</Text>
      </View>
    </View>
  );
};

export default SplashScreen;
