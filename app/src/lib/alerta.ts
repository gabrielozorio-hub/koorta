import { Alert, Platform } from 'react-native';

type Botao = { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };

// Alert nativo no celular; window.alert/confirm no navegador (Alert do RN não funciona na web)
export function alerta(titulo: string, mensagem?: string, botoes?: Botao[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(titulo, mensagem, botoes);
    return;
  }
  const texto = mensagem ? `${titulo}\n\n${mensagem}` : titulo;
  const acoes = (botoes ?? []).filter((b) => b.style !== 'cancel');
  if (acoes.length === 0) {
    window.alert(texto);
    return;
  }
  if (window.confirm(texto)) acoes[acoes.length - 1].onPress?.();
  else botoes?.find((b) => b.style === 'cancel')?.onPress?.();
}
