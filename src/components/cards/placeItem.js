import React, { memo, useCallback, useMemo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "react-native-elements/dist/icons/Icon";
import { scale } from "react-native-size-matters";

const PlaceItem = memo(({ name, address, iconUrl, onPress, saved }) => {
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  const iconComponent = useMemo(() => {
    if (saved) {
      return <Icon name={iconUrl} size={scale(25)} color="#0089FF" />;
    } else if (iconUrl) {
      return <Image source={{ uri: iconUrl }} style={styles.iconImage} />;
    } else {
      return <Icon name="location-on" size={scale(25)} color="#0089FF" />;
    }
  }, [saved, iconUrl]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          {iconComponent}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.nameStyle}>
            {name}
          </Text>
          <Text style={styles.addressStyle}>
            {address}
          </Text>
          <View style={styles.divider} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: scale(60),
  },
  iconContainer: {
    height: scale(45),
    width: scale(45),
    borderRadius: scale(7),
    borderColor: "#0089FF",
    borderWidth: scale(3),
    alignItems: "center",
    justifyContent: "center",
    marginRight: scale(7),
  },
  iconImage: {
    tintColor: "#0089FF",
    height: scale(25),
    width: scale(25),
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
  },
  nameStyle: {
    marginBottom: scale(1),
    fontSize: scale(12),
    fontWeight: "bold",
  },
  addressStyle: {
    marginBottom: scale(1),
    fontSize: scale(10),
  },
  divider: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginVertical: scale(5),
  },
});
export default PlaceItem;
{
  /* 
          <Icon
            name="location-on"
            size={scale(25)}
            color="#0089FF"
            style={styles.icon}
          /> */
}
