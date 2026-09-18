import { colors } from '../../theme';

export const customStyleMap = [
  {
      "featureType": "all",
      "stylers": [
          {
              "saturation": 0
          },
          {
              "hue": colors.mapNeutralHue
          }
      ]
  },
  {
      "featureType": "road",
      "stylers": [
          {
              "saturation": -70
          }
      ]
  },
  {
      "featureType": "transit",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "poi",
      "stylers": [
          {
              "visibility": "off"
          }
      ]
  },
  {
      "featureType": "water",
      "stylers": [
          {
              "visibility": "simplified"
          },
          {
              "saturation": -60
          }
      ]
  }
]
