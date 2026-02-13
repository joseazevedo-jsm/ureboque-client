import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PlaceSavedItem from '../../cards/placeSavedItem';
import { ScalePressable } from '../../common/ScalePressable';
import { colors, shadows, borderRadius, spacing } from '../../../theme';

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
      // Auto-populate name and type for home/work addresses
      if (item._id === "add-home") {
        startAdd({ name: "Casa" });
      } else if (item._id === "add-work") {
        startAdd({ name: "Trabalho" });
      } else {
        startAdd();
      }
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

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInRight.delay(150 + (index * 40)).springify()}>
      <ScalePressable onPress={() => handleItemPress(item)}>
        <PlaceSavedItem
          key={item._id}
          place={item.place}
          edit={editMode}
          onPressEditItem={() => handleItemPress(item)}
          add={item.isAdd || false}
        />
      </ScalePressable>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header - Same design as current */}
      <View style={styles.header}>
        <ScalePressable style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={scale(25)} />
        </ScalePressable>
        <ScalePressable
          style={styles.editButton}
          onPress={() => setEditMode(!editMode)}
        >
          <Text style={styles.editText}>Editar</Text>
        </ScalePressable>
      </View>

      {/* Title - Same design */}
      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <Text style={styles.title}>LUGARES SALVOS</Text>
        <Text style={styles.subtitle}>
          O motorista irá levá-lo exatamente onde você está indo!
        </Text>
      </Animated.View>

      {/* List */}
      <View style={styles.listContainer}>
        <FlatList
          data={displayAddresses}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        {/* Add Place Button - Same design */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <ScalePressable style={styles.addButton} onPress={startAdd}>
            <Text style={styles.addButtonText}>ADICIONAR LUGAR</Text>
          </ScalePressable>
        </Animated.View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: scale(60),
    paddingHorizontal: spacing.lg,
  },
  closeButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  editButton: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  editText: {
    fontWeight: "600",
    color: colors.primary,
    fontSize: scale(14),
  },
  title: {
    fontSize: scale(18),
    marginLeft: spacing.lg,
    marginTop: spacing.xxl,
    color: colors.textPrimary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    marginLeft: spacing.lg,
    marginTop: spacing.xs,
    fontSize: scale(13),
    color: colors.textSecondary,
  },
  listContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xxl,
    flex: 1,
  },
  separator: {
    height: spacing.md,
  },
  addButton: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    width: scale(300),
    alignItems: "center",
    alignSelf: "center",
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: scale(14),
    letterSpacing: 0.5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default AddressesList;