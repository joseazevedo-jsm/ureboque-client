import React from 'react';
import { View, Text, Image } from 'react-native';
import { colors } from '../../theme';

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
        paddingHorizontal: 40
      }}>
        <View style={{
          alignItems: 'center',
          marginBottom: 60
        }}>
          <Image
            source={require('../../../resources/icons/UREB_LOGO.png')}
            style={{
              width: 100,
              height: 100,
              marginBottom: 20,
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
          fontSize: 16,
          color: colors.primaryLight,
          textAlign: 'center',
          lineHeight: 24,
          fontWeight: '300'
        }}>Serviço de Reboque Rápido e Confiável</Text>
      </View>

      <View style={{
        paddingBottom: 40,
        paddingHorizontal: 20
      }}>
        <Text style={{
          fontSize: 12,
          color: colors.primaryLight,
          textAlign: 'center',
          fontWeight: '300'
        }}>© 2025 Ureboque</Text>
      </View>
    </View>
  );
};

export default SplashScreen;
