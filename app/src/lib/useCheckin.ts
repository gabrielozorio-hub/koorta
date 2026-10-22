import { router } from 'expo-router';
import { useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { alerta } from '@/lib/alerta';
import { useDB } from '@/store/AppStore';

// Fluxo do UC12 compartilhado pelas telas (quadra, mapa)
export function useFazerCheckin() {
  const { fazerCheckin, concederConsentimento } = useDB();
  const [carregando, setCarregando] = useState(false);

  async function executar(quadraId: string) {
    setCarregando(true);
    const r = await fazerCheckin(quadraId);
    setCarregando(false);
    if (r.ok) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.push({ pathname: '/checkin', params: r.valor?.simulado ? { simulado: '1' } : {} });
      return;
    }
    if (r.erro === 'CONSENTIMENTO') {
      alerta('Localização necessária', 'Para validar o check-in precisamos confirmar que você está na quadra. Deseja permitir o uso da localização?', [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Permitir',
          onPress: async () => {
            const c = await concederConsentimento();
            if (c.ok) alerta('Localização ativada', 'Toque em "Fazer check-in" novamente.');
            else alerta('Não foi possível', c.erro);
          },
        },
      ]);
      return;
    }
    alerta('Check-in não realizado', r.erro, [{ text: 'OK' }]);
  }

  return { executar, carregando };
}
