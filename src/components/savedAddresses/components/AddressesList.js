import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PlaceSavedItem from '../../cards/placeSavedItem'; // Keep existing component

const AddressesList = ({ 
  addresses, 
  startAdd, 
  startEdit, 
  deleteAddress, 
  state,
  onClose 
}) => {
  const [editMode, setEditMode] = React.useState(false);

  // Add default Home/Work if not exists (keep existing logic)
  const displayAddresses = React.useMemo(() => {
    const data = [...addresses];
    
    const hasHome = data.some(addr => addr.place.name === "Casa");
    const hasWork = data.some(addr => addr.place.name === "Trabalho");
    
    if (!hasWork) {
      data.unshift({
        _id: "add-work",
        place: { name: "Adicionar Trabalho" },
        isAdd: true
      });
    }
    
    if (!hasHome) {
      data.unshift({
        _id: "add-home", 
        place: { name: "Adicionar Casa" },
        isAdd: true
      });
    }
    
    return data;
  }, [addresses]);

  const handleItemPress = (item) => {
    if (item.isAdd) {
      startAdd();
    } else {
      startEdit({
        id: item._id,
        name: item.place.name,
        description: item.place.description,
        coordinates: item.place.coordinates,
        instructions: item.place.instructions || ''
      });
    }
  };

  const renderItem = ({ item }) => (
    <PlaceSavedItem
      key={item._id}
      place={item.place}
      edit={editMode}
      onPressEditItem={() => handleItemPress(item)}
      add={item.isAdd || false}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header - Same design as current */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={scale(25)} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditMode(!editMode)}
        >
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
      </View>

      {/* Title - Same design */}
      <Text style={styles.title}>LUGAGES SALVOS</Text>
      <Text style={styles.subtitle}>
        O motorista irá levá-lo exatamente onde você está indo!
      </Text>

      {/* List */}
      <View style={styles.listContainer}>
        <FlatList
          data={displayAddresses}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        {/* Add Place Button - Same design */}
        <TouchableOpacity style={styles.addButton} onPress={startAdd}>
          <Text style={styles.addButtonText}>ADICIONAR LUGAR</Text>
        </TouchableOpacity>
      </View>

      {/* Loading/Error States */}
      {state.isLoading && (
        <View style={styles.loadingOverlay}>
          <Text>Carregando...</Text>
        </View>
      )}
    </View>
  );
};

// Keep all existing styles from SavedPlacesModal.js
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row", 
    justifyContent: "space-between"
  },
  closeButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(7),
    backgroundColor: "#fff",
    top: scale(15),
    marginLeft: scale(10),
    alignItems: 'center',
    justifyContent: 'center'
  },
  editButton: {
    top: scale(15), 
    marginRight: scale(10)
  },
  editText: {
    fontWeight: "500"
  },
  title: {
    fontSize: scale(20),
    marginLeft: scale(10),
    marginTop: scale(25),
    color: "#0089FF",
    fontWeight: "700",
  },
  subtitle: {
    marginLeft: scale(10),
    fontSize: scale(11),
  },
  listContainer: {
    marginLeft: scale(10),
    marginTop: scale(40),
    height: "75%",
  },
  separator: {
    height: scale(15)
  },
  addButton: {
    borderColor: "#0089FF",
    borderWidth: scale(3),
    borderRadius: scale(7),
    width: scale(300),
    alignItems: "center",
    alignSelf: "center",
    padding: scale(18),
  },
  addButtonText: {
    color: "#0089FF", 
    fontWeight: "700"
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default AddressesList;