import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { scale } from 'react-native-size-matters';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PlaceSavedItem from '../../cards/placeSavedItem';
import { ScalePressable } from '../../common/ScalePressable';
import { colors, shadows, spacing, borderRadius } from '../../../theme';
import { getPlaceIcon, ICON_ADD } from '../../../assets/icons';

const AddressesList = ({
  addresses,
  startAdd,
  startEdit,
  deleteAddress,
  state,
  onClose
}) => {
  const [editMode, setEditMode] = React.useState(false);

  const displayAddresses = React.useMemo(() => {
    const homeAddr = addresses.find(a => a.place.name === 'Casa');
    const workAddr = addresses.find(a => a.place.name === 'Trabalho');
    const others = addresses.filter(
      a => a.place.name !== 'Casa' && a.place.name !== 'Trabalho'
    );

    const homeItem = homeAddr || {
      _id: 'add-home',
      place: { name: 'Adicionar Casa' },
      isAdd: true,
    };
    const workItem = workAddr || {
      _id: 'add-work',
      place: { name: 'Adicionar Trabalho' },
      isAdd: true,
    };

    return [homeItem, workItem, ...others];
  }, [addresses]);

  const handleItemPress = (item) => {
    if (item.isAdd) {
      if (item._id === 'add-home') {
        startAdd({ name: 'Casa' });
      } else if (item._id === 'add-work') {
        startAdd({ name: 'Trabalho' });
      } else {
        startAdd();
      }
    } else {
      startEdit({
        id: item._id,
        name: item.place.name,
        description: item.place.description,
        coordinates: item.place.coordinates,
        instructions: item.place.instructions || '',
      });
    }
  };

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInRight.delay(100 + index * 40).springify()}>
      <ScalePressable onPress={() => handleItemPress(item)}>
        <PlaceSavedItem
          key={item._id}
          place={item.place}
          edit={editMode}
          onPressEditItem={() => handleItemPress(item)}
          add={item.isAdd || false}
          iconSource={getPlaceIcon(item.place.name)}
          description={item.place.description || item.place.address || undefined}
        />
      </ScalePressable>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.header}>
        <TouchableOpacity style={styles.circleButton} onPress={onClose} activeOpacity={0.75}>
          <Icon name="close" size={scale(20)} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>Lugares Salvos</Text>
          <Text style={styles.subtitle}>Acelere o pedido de reboques.</Text>
        </View>

        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => setEditMode(!editMode)}
          activeOpacity={0.75}
        >
          <Icon name="edit" size={scale(20)} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>

      {/* List */}
      <View style={styles.listContainer}>
        <FlatList
          data={displayAddresses}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <ScalePressable onPress={startAdd}>
                <PlaceSavedItem
                  place={{ name: 'Adicionar' }}
                  add={true}
                  iconSource={ICON_ADD}
                  description="Novo endereço personalizado"
                  onPressEditItem={() => startAdd()}
                />
              </ScalePressable>
            </Animated.View>
          }
        />
      </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.modalSafeTop,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  circleButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  title: {
    fontSize: scale(18),
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: scale(13),
    color: colors.textSecondary,
    marginTop: scale(2),
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
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
  },
});

export default AddressesList;
