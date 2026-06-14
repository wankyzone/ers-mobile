/**
 * CreateErrandScreen.tsx
 *
 * Premium bottom-sheet errand creation flow with:
 *  - Map picker for pickup & delivery (react-native-maps)
 *  - Reverse geocoding via Expo Location
 *  - Description field (optional, multiline)
 *  - API type fix: description included in payload
 *  - Uber/Bolt-style UX: sticky CTA, smooth keyboard, snap expansion
 */

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheet, {
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';

import type { RootStackParamList } from '../src/navigation';
import { createErrand, type ApiError } from '../src/services/api';

// ─── TYPES ────────────────────────────────────────────────────────────────────

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface LatLng {
  latitude: number;
  longitude: number;
}

type MapPickerTarget = 'pickup' | 'delivery' | null;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

/** Default region — Lagos, Nigeria */
const DEFAULT_REGION: Region = {
  latitude: 6.5244,
  longitude: 3.3792,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const SNAP_POINTS = ['40%', '75%', '95%'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function reverseGeocode(coords: LatLng): Promise<string> {
  try {
    const [result] = await Location.reverseGeocodeAsync(coords);
    if (!result) return formatLatLng(coords);

    const parts = [
      result.name,
      result.street,
      result.district,
      result.city,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : formatLatLng(coords);
  } catch {
    return formatLatLng(coords);
  }
}

function formatLatLng({ latitude, longitude }: LatLng): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

interface LocationRowProps {
  label: string;
  sublabel: string;
  value: string;
  icon: string;
  onPress: () => void;
}

function LocationRow({ label, sublabel, value, icon, onPress }: LocationRowProps) {
  const hasValue = value.trim().length > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.locationRow}
      onPress={onPress}
    >
      {/* Icon column */}
      <View style={styles.locationIconWrap}>
        <Text style={styles.locationIcon}>{icon}</Text>
      </View>

      {/* Text column */}
      <View style={styles.locationTextWrap}>
        <Text style={styles.locationLabel}>{label}</Text>
        <Text
          style={[
            styles.locationValue,
            !hasValue && styles.locationPlaceholder,
          ]}
          numberOfLines={1}
        >
          {hasValue ? value : sublabel}
        </Text>
      </View>

      {/* Chevron */}
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── MAP PICKER MODAL ─────────────────────────────────────────────────────────

interface MapPickerModalProps {
  visible: boolean;
  title: string;
  onConfirm: (address: string, coords: LatLng) => void;
  onCancel: () => void;
}

function MapPickerModal({
  visible,
  title,
  onConfirm,
  onCancel,
}: MapPickerModalProps) {
  const [pin, setPin] = useState<LatLng | null>(null);
  const [resolving, setResolving] = useState(false);
  const mapRef = useRef<MapView>(null);

  const handleMapPress = useCallback((e: MapPressEvent) => {
    setPin(e.nativeEvent.coordinate);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pin) return;
    setResolving(true);
    const address = await reverseGeocode(pin);
    setResolving(false);
    onConfirm(address, pin);
    // Reset local state for next open
    setPin(null);
  }, [pin, onConfirm]);

  const handleCancel = useCallback(() => {
    setPin(null);
    onCancel();
  }, [onCancel]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <View style={mapStyles.container}>

        {/* Header */}
        <View style={mapStyles.header}>
          <TouchableOpacity onPress={handleCancel} style={mapStyles.backBtn}>
            <Text style={mapStyles.backText}>✕</Text>
          </TouchableOpacity>
          <Text style={mapStyles.headerTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Instruction pill */}
        <View style={mapStyles.pill}>
          <Text style={mapStyles.pillText}>
            {pin ? '📍 Location selected' : 'Tap the map to drop a pin'}
          </Text>
        </View>

        {/* Map */}
        <MapView
          ref={mapRef}
          style={mapStyles.map}
          initialRegion={DEFAULT_REGION}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton
        >
          {pin && (
            <Marker
              coordinate={pin}
              pinColor="#22c55e"
            />
          )}
        </MapView>

        {/* Confirm CTA */}
        <View style={mapStyles.footer}>
          <TouchableOpacity
            style={[
              mapStyles.confirmBtn,
              (!pin || resolving) && mapStyles.confirmDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!pin || resolving}
            activeOpacity={0.85}
          >
            {resolving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={mapStyles.confirmText}>
                {pin ? 'Confirm Location' : 'Drop a pin first'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function CreateErrandScreen() {
  const navigation = useNavigation<NavProp>();

  // Sheet
  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => SNAP_POINTS, []);

  // Form state
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [pickup, setPickup]         = useState('');
  const [delivery, setDelivery]     = useState('');
  const [budget, setBudget]         = useState('');
  const [loading, setLoading]       = useState(false);

  // Map picker state
  const [mapTarget, setMapTarget] = useState<MapPickerTarget>(null);

  // Derived
  const parsedBudget = Number(budget);
  const isValid =
    title.trim() !== '' &&
    pickup.trim() !== '' &&
    delivery.trim() !== '' &&
    parsedBudget > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const expandSheet = useCallback(() => {
    sheetRef.current?.snapToIndex(2); // 95%
  }, []);

  const openMapPicker = useCallback((target: MapPickerTarget) => {
    setMapTarget(target);
  }, []);

  const handleMapConfirm = useCallback(
    (address: string) => {
      if (mapTarget === 'pickup') setPickup(address);
      if (mapTarget === 'delivery') setDelivery(address);
      setMapTarget(null);
    },
    [mapTarget],
  );

  const handleMapCancel = useCallback(() => setMapTarget(null), []);

  const handleCreate = useCallback(async () => {
    if (!isValid) {
      Alert.alert('Incomplete', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);

      // ✅ description included — fixes missing-property TypeScript error
      await createErrand({
        title: title.trim(),
        description: description.trim(), // defaults to '' if not provided
        pickup_location: pickup.trim(),
        delivery_location: delivery.trim(),
        budget: parsedBudget,
      });

      navigation.goBack();
    } catch (err) {
      Alert.alert('Failed to post', (err as ApiError).message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [isValid, title, description, pickup, delivery, parsedBudget, navigation]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* Semi-transparent backdrop — tap to dismiss */}
      <Pressable
        style={styles.backdrop}
        onPress={() => navigation.goBack()}
      />

      {/* Map Picker Modal */}
      <MapPickerModal
        visible={mapTarget !== null}
        title={mapTarget === 'pickup' ? 'Pick Pickup Location' : 'Pick Delivery Location'}
        onConfirm={handleMapConfirm}
        onCancel={handleMapCancel}
      />

      {/* Bottom Sheet */}
      <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => navigation.goBack()}
        backgroundStyle={styles.sheet}
        handleIndicatorStyle={styles.handle}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── Sheet Header ── */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New Errand</Text>
              <Text style={styles.sheetSubtitle}>
                Fill in the details and post your errand
              </Text>
            </View>

            {/* ── Divider ── */}
            <View style={styles.divider} />

            {/* ── Route Section ── */}
            <Text style={styles.sectionLabel}>ROUTE</Text>

            <View style={styles.routeCard}>
              {/* Vertical connector line */}
              <View style={styles.routeLine} />

              <LocationRow
                label="Pickup"
                sublabel="Where should they pick up from?"
                icon="🟢"
                value={pickup}
                onPress={() => openMapPicker('pickup')}
              />

              <View style={styles.routeRowDivider} />

              <LocationRow
                label="Delivery"
                sublabel="Where should it be delivered?"
                icon="🔴"
                value={delivery}
                onPress={() => openMapPicker('delivery')}
              />
            </View>

            {/* ── Details Section ── */}
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>DETAILS</Text>

            <TextInput
              placeholder="Errand title  e.g. Buy groceries at Shoprite"
              placeholderTextColor="#475569"
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              onFocus={expandSheet}
              returnKeyType="next"
            />

            <TextInput
              placeholder="Description (optional)  — any extra instructions"
              placeholderTextColor="#475569"
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={expandSheet}
            />

            {/* ── Budget Section ── */}
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>BUDGET</Text>

            <View style={styles.budgetRow}>
              <Text style={styles.nairaSymbol}>₦</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor="#475569"
                style={[styles.input, styles.budgetInput]}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                onFocus={expandSheet}
                returnKeyType="done"
              />
            </View>

            {/* Spacer so sticky button doesn't overlap last field */}
            <View style={{ height: 96 }} />

          </BottomSheetScrollView>
        </KeyboardAvoidingView>

        {/* ── Sticky Submit Button ── */}
        <View style={styles.stickyFooter}>
          <TouchableOpacity
            style={[
              styles.postButton,
              (!isValid || loading) && styles.postButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.postButtonText}>Post Errand</Text>
                <Text style={styles.postButtonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </BottomSheet>
    </View>
  );
}

// ─── SHEET STYLES ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  sheet: {
    backgroundColor: '#0a0f1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  handle: {
    backgroundColor: '#334155',
    width: 36,
    height: 4,
    borderRadius: 2,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // ── Header ──
  sheetHeader: {
    paddingTop: 8,
    paddingBottom: 20,
  },

  sheetTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },

  sheetSubtitle: {
    color: '#475569',
    fontSize: 13,
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginBottom: 20,
  },

  // ── Section labels ──
  sectionLabel: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // ── Route card ──
  routeCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
    position: 'relative',
  },

  routeLine: {
    position: 'absolute',
    left: 30,
    top: 42,
    bottom: 42,
    width: 2,
    backgroundColor: '#1e293b',
    zIndex: 0,
  },

  routeRowDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginLeft: 56,
  },

  // ── Location row ──
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },

  locationIconWrap: {
    width: 32,
    alignItems: 'center',
    zIndex: 1,
  },

  locationIcon: {
    fontSize: 15,
  },

  locationTextWrap: {
    flex: 1,
    marginLeft: 12,
  },

  locationLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 2,
  },

  locationValue: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '500',
  },

  locationPlaceholder: {
    color: '#475569',
    fontWeight: '400',
  },

  chevron: {
    color: '#334155',
    fontSize: 22,
    marginLeft: 8,
    lineHeight: 24,
  },

  // ── Inputs ──
  input: {
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    fontSize: 14,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },

  inputMultiline: {
    height: 88,
    paddingTop: 14,
  },

  // ── Budget ──
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  nairaSymbol: {
    color: '#22c55e',
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
    paddingBottom: 2,
  },

  budgetInput: {
    flex: 1,
    marginBottom: 0,
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },

  // ── Sticky footer ──
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    paddingTop: 12,
    backgroundColor: '#0a0f1e',
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },

  postButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  postButtonDisabled: {
    opacity: 0.4,
  },

  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  postButtonArrow: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

// ─── MAP MODAL STYLES ─────────────────────────────────────────────────────────

const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1e',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 14,
    backgroundColor: '#0a0f1e',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    zIndex: 10,
  },

  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 20,
  },

  backText: {
    color: '#94a3b8',
    fontSize: 16,
  },

  headerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  pill: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 118 : 102,
    alignSelf: 'center',
    backgroundColor: 'rgba(10,15,30,0.88)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    zIndex: 10,
  },

  pillText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },

  map: {
    flex: 1,
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 14,
    backgroundColor: '#0a0f1e',
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },

  confirmBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmDisabled: {
    opacity: 0.4,
  },

  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});