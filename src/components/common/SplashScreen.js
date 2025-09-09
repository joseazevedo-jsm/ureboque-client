import React from 'react';
import { View, Text, Image } from 'react-native';

const SplashScreen = () => {
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#0089FF',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40
      }}>
        {/* Main Logo Section */}
        <View style={{
          alignItems: 'center',
          marginBottom: 60
        }}>
          {/* Ureboque Logo */}
          <Image 
            source={require('../../../resources/icons/UREB_LOGO.png')} 
            style={{
              width: 100,
              height: 100,
              marginBottom: 20,
              tintColor: '#FFFFFF' // Make logo white for blue background
            }}
            resizeMode="contain"
          />
          
          {/* Ureboque Text Logo */}
          <Image 
            source={require('../../../resources/icons/UREB_TEXT.png')} 
            style={{
              width: 200,
              height: 50,
              tintColor: '#FFFFFF' // Make text white for blue background
            }}
            resizeMode="contain"
          />
        </View>
        
     
        {/* Tagline */}
        <Text style={{
          fontSize: 16,
          color: '#E6F3FF',
          textAlign: 'center',
          lineHeight: 24,
          fontWeight: '300'
        }}>Serviço de Reboque Rápido e Confiável</Text>
      </View>
      
      {/* Footer */}
      <View style={{
        paddingBottom: 40,
        paddingHorizontal: 20
      }}>
        <Text style={{
          fontSize: 12,
          color: '#B3D9FF',
          textAlign: 'center',
          fontWeight: '300'
        }}>© 2025 Ureboque</Text>
      </View>
    </View>
  );
};

export default SplashScreen;