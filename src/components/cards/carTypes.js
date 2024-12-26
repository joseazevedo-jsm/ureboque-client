import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements/dist/icons/Icon";
import { scale } from "react-native-size-matters";

// card view that receives props like title, description
const CarTypes = ({ typeCar, descr, descr2, price, route, onPress }) => {
    const distance = route?.distance;
    const duration = route?.duration;
    console.log(distance, "KM", typeCar, descr, descr2, price);
    // const priceperkm = (Math.floor(distance) * 1000) + Number(price);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress}>
        <View
          style={{
            flexDirection: "row",
            marginBottom: scale(19),
          }}
        >
          {typeCar !== "JEEP" ? (
            <Image
              source={require("../../../resources/icons/UREB_TUR.png")}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <Image
              source={require("../../../resources/icons/UREB_JEEP.png")}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <View style={styles.text}>
            <Text style={styles.title}>{typeCar}</Text>
            <Text style={styles.description}>{descr}</Text>
            <Text style={styles.description}>{descr2}</Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.coin}>AOA </Text>
            <Text style={styles.price}>{price.toLocaleString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
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
