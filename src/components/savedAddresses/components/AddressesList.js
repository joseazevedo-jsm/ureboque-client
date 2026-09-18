import React from 'react';
import { AppHeader } from '../../common/AppHeader';
import { View, FlatList, StyleSheet } from 'react-native';
import { AppText as Text } from '../../common/AppText';

import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import PlaceSavedItem from '../../cards/placeSavedItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography, layout } from '../../../theme';
import { getPlaceIcon, ICON_ADD } from '../../../assets/icons';

const AddressesList = ({
  addresses,
  startAdd,
  startEdit,
  deleteAddress,
  state,
  onClose
}) => {
  const insets = useSafeAreaInsets();
  const [editMode, setEditMode] = React.useState(false);

  const displayAddresses = React.useMemo(() => {
    const validAddresses = (addresses || []).filter((address) => address?.place);
    const homeAddr = validAddresses.find(a => a.place.name === 'Casa');
    const workAddr = validAddresses.find(a => a.place.name === 'Trabalho');
    const others = validAddresses.filter(
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

        <PlaceSavedItem
          key={item._id}
          place={item.place}
          edit={editMode}
          onPressEditItem={() => handleItemPress(item)}
          add={item.isAdd || false}
          iconSource={getPlaceIcon(item.place.name)}
          description={item.place.description || item.place.address || undefined}
        />

    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        title="Lugares Salvos"
        subtitle="Acelere o pedido de reboques."
        onLeftPress={onClose}
        leftLabel="Fechar lugares salvos"
        rightIcon={editMode ? 'done' : 'edit'}
        rightLabel={editMode ? 'Concluir edição' : 'Editar lugares'}
        rightSelected={editMode}
        onRightPress={() => setEditMode(!editMode)}
      />

      {/* List */}
      <View style={styles.listContainer}>
        <FlatList
          data={displayAddresses}
          renderItem={renderItem}
          keyExtractor={(item, index) => String(item._id || `saved-address-${index}`)}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Animated.View entering={FadeInDown.delay(300).springify()}>

                <PlaceSavedItem
                  place={{ name: 'Adicionar' }}
                  add={true}
                  iconSource={ICON_ADD}
                  description="Novo endereço personalizado"
                  onPressEditItem={() => startAdd()}
                />
        
            </Animated.View>
          }
        />
      </View>

      {state.isLoading && (
        <View style={styles.loadingOverlay}>
          <Text accessibilityRole="alert" style={{ ...typography.body, color: colors.textPrimary, backgroundColor: colors.surface, padding: spacing.lg, borderRadius: borderRadius.md }}>Carregando...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: "100%",
    maxWidth: layout.contentMaxWidth,
    alignSelf: "center",
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
    backgroundColor: colors.overlayLoadingStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddressesList;
