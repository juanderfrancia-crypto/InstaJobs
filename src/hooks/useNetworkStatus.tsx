import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar conexión inicial
    const checkConnection = async () => {
      const state = await NetInfo.fetch();
      setIsOnline(state.isConnected ?? true);
      setIsLoading(false);
    };

    checkConnection();

    // Escuchar cambios de conexión
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, isLoading };
}
