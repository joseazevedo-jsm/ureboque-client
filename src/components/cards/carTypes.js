import React, { memo, useCallback, useMemo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements/dist/icons/Icon";
import { scale } from "react-native-size-matters";
import { useLogger } from "../../hooks/useLogger";

// Memoized image sources for performance
const imageMap = {
  JEEP: require("../../../resources/icons/UREB_JEEP.png"),
  DEFAULT: require("../../../resources/icons/UREB_TUR.png")
};

// card view that receives props like title, description
const CarTypes = memo(({ typeCar, descr, descr2, price, route, onPress }) => {
  const logger = useLogger('CarTypes');
  const distance = route?.distance;
  const duration = route?.duration;
  logger.debug("Car type selection details", { distance, typeCar, descr, descr2, price });

  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  const carImage = useMemo(() => {
    return typeCar === "JEEP" ? imageMap.JEEP : imageMap.DEFAULT;
  }, [typeCar]);

  const formattedPrice = useMemo(() => {
    return price.toLocaleString();
  }, [price]);

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={handlePress}
        accessibilityLabel={`Selecionar ${typeCar}, ${descr}, preço ${formattedPrice} AOA`}
        accessibilityRole="button"
      >
        <View style={styles.containerStyle}>
          <Image
            source={carImage}
            style={styles.image}
            resizeMode="cover"
          />

          <View style={styles.text}>
            <Text style={styles.title}>{typeCar}</Text>
            <Text style={styles.description}>{descr}</Text>
            <Text style={styles.description}>{descr2}</Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.coin}>AOA </Text>
            <Text style={styles.price}>{formattedPrice}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {},
  containerStyle: {
    flexDirection: "row",
    marginBottom: scale(19),
  },
  title: {
    marginTop: scale(8),
    fontSize: scale(17),
    fontWeight: "bold",
    marginBottom: scale(4),
  },
  image: {
    marginLeft: scale(7),
  },
  description: {
    fontSize: scale(11),
    color: "#ccc",
  },
  coin: {
    fontSize: scale(12),
    marginTop: scale(12),
  },
  price: {
    fontSize: scale(27),
  },
  text: {
    marginLeft: scale(7),
  },
  priceBox: {
    flexDirection: "row",
    marginTop: scale(20),
    position: "absolute",
    right: scale(10),
  },
});
export default CarTypes;

// Peso entre</Text>
//             <Text style={styles.description}>900 kg - 3500 kg</Text>
//             <Text style={styles.title}>JEEP</Text>
//             <Text style={styles.description}>Peso superior a</Text>
//             <Text style={styles.description}>3500 kg</Text>
// 25,300
// 63,300
