import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GeocodeResult, searchAddresses } from './src/services/geocoding';

interface LocationInputProps {
  value: string;
  onChange: (address: string, coords?: { lat: number; lng: number }) => void;
  onError?: (msg: string | null) => void;
  onOpenMap?: (region: { lat: number; lng: number }) => void;
  placeholder?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

export function LocationInput({ value, onChange, onError, onOpenMap, placeholder }: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(value, 400);
  const searchAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    searchAbort.current?.abort();
    searchAbort.current = new AbortController();
    setLoading(true);
    searchAddresses(debouncedQuery)
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
    return () => searchAbort.current?.abort();
  }, [debouncedQuery]);

  const handleSelectSuggestion = useCallback(
    (item: GeocodeResult) => {
      onChange(item.address, { lat: item.lat, lng: item.lng });
      setSuggestions([]);
    },
    [onChange]
  );

  const openMap = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        onError?.('Location permission needed');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      onOpenMap?.({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      onOpenMap?.({ lat: 40.7, lng: -74 });
    }
  }, [onError, onOpenMap]);

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder ?? 'Remind when at address (optional)'}
          placeholderTextColor="#999"
          value={value}
          testID="location-input"
          onChangeText={(t) => {
            onChange(t);
            onError?.(null);
          }}
        />
        <Pressable style={styles.mapButton} onPress={openMap} testID="map-button">
          <Text style={styles.mapButtonText}>Map</Text>
        </Pressable>
      </View>
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#666" />
        </View>
      )}
      {suggestions.length > 0 && (
        <View style={styles.suggestions}>
          {suggestions.map((item) => (
            <Pressable
              key={`${item.lat}-${item.lng}`}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(item)}
            >
              <Text style={styles.suggestionText} numberOfLines={2}>
                {item.address}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  mapButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#22c55e',
    borderRadius: 8,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loadingRow: {
    paddingVertical: 4,
  },
  suggestions: {
    maxHeight: 200,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginTop: 4,
    zIndex: 1000,
    elevation: 10,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  suggestionText: {
    fontSize: 14,
    color: '#fff',
  },
});
