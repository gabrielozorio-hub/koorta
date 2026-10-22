import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Icon, Row } from '@/components/ui';
import type { Video } from '@/data/types';
import { esporteDe, nomeUsuario } from '@/lib/selectors';
import { NIVEL_LABEL, tempoRelativo } from '@/lib/util';
import { useDB } from '@/store/AppStore';
import { colors, radius, spacing, TAB_BAR_SPACE, type } from '@/theme';

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace('.', ',')} mil` : String(n));

function Acao({ icon, label, ativo, cor, onPress }: { icon: string; label?: string; ativo?: boolean; cor?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} style={{ alignItems: 'center', gap: 4 }}>
      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={28} color={ativo ? cor ?? colors.brand : colors.white} />
      </View>
      {label !== undefined && <Text style={{ color: colors.white, fontWeight: '600', fontSize: 12 }}>{label}</Text>}
    </Pressable>
  );
}

function VideoItem({ video, ativo, altura, onComentarios }: { video: Video; ativo: boolean; altura: number; onComentarios: () => void }) {
  const insets = useSafeAreaInsets();
  const { db, usuario, alternarCurtida, alternarVideoFavorito } = useDB();
  const [pausado, setPausado] = useState(false);
  const player = useVideoPlayer(video.arquivoMidia, (p) => {
    p.loop = true;
    p.muted = Platform.OS === 'web'; // navegadores bloqueiam autoplay com som
  });

  useEffect(() => {
    if (ativo && !pausado) player.play();
    else player.pause();
  }, [ativo, pausado, player]);

  const curtiu = db.curtidas.some((c) => c.usuarioId === usuario.id && c.videoId === video.id);
  const salvo = db.videosFavoritos.some((c) => c.usuarioId === usuario.id && c.videoId === video.id);
  const nComent = db.comentarios.filter((c) => c.videoId === video.id).length;
  const esp = esporteDe(db, video.esporteId);
  const autor = nomeUsuario(db, video.autorId);

  return (
    <View style={{ height: altura, backgroundColor: '#000' }}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setPausado((p) => !p)}>
        {pausado && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="play" size={46} color={colors.white} />
            </View>
          </View>
        )}
      </Pressable>
      <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.45)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160 }} />
      <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0,0,0,0.85)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 360 }} />

      <View style={{ position: 'absolute', right: 12, bottom: TAB_BAR_SPACE + insets.bottom + 10, gap: 16, alignItems: 'center' }}>
        <Pressable onPress={() => router.push(`/atleta/${video.autorId}`)}>
          <Avatar nome={autor} size={48} ring />
        </Pressable>
        <Acao icon={curtiu ? 'heart' : 'heart-outline'} ativo={curtiu} cor="#FF4D6D" label={fmt(video.curtidasBase + (curtiu ? 1 : 0))} onPress={() => alternarCurtida(video.id)} />
        <Acao icon="comment-processing-outline" label={String(nComent)} onPress={onComentarios} />
        <Acao icon={salvo ? 'bookmark' : 'bookmark-outline'} ativo={salvo} label="Salvar" onPress={() => alternarVideoFavorito(video.id)} />
        <Acao icon="share-variant" label="Enviar" onPress={() => Share.share({ message: `${video.titulo} — assista no Koorta's!` }).catch(() => {})} />
      </View>

      <View style={{ position: 'absolute', left: spacing.lg, right: 90, bottom: TAB_BAR_SPACE + insets.bottom + 10, gap: 8 }}>
        <Row gap={6}>
          {esp && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brand, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill }}>
              <Icon name={esp.icone} size={13} color={colors.ink} />
              <Text style={{ fontWeight: '700', fontSize: 12, color: colors.ink }}>{esp.nome}</Text>
            </View>
          )}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill }}>
            <Text style={{ fontWeight: '600', fontSize: 12, color: colors.white }}>{NIVEL_LABEL[video.nivel]}</Text>
          </View>
        </Row>
        <Text style={{ color: colors.white, fontSize: 20, fontWeight: '700' }}>{video.titulo}</Text>
        {!!video.descricao && (
          <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14 }} numberOfLines={3}>
            {video.descricao}
          </Text>
        )}
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' }}>
          @{autor.split(' ')[0].toLowerCase()} · {tempoRelativo(video.dataPublicacao)}
        </Text>
      </View>
    </View>
  );
}

function Comentarios({ videoId, onClose }: { videoId: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { db, usuario, comentar } = useDB();
  const [texto, setTexto] = useState('');
  const lista = db.comentarios.filter((c) => c.videoId === videoId);
  return (
    <Modal visible={!!videoId} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: 520, paddingBottom: insets.bottom + 8 }}>
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line }} />
          </View>
          <Text style={[type.headline, { textAlign: 'center', marginBottom: 8 }]}>{lista.length} comentários</Text>
          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ padding: spacing.lg, gap: 14 }}>
            {lista.length === 0 && <Text style={[type.small, { textAlign: 'center' }]}>Seja o primeiro a comentar!</Text>}
            {lista.map((c) => (
              <Row key={c.id} gap={10} style={{ alignItems: 'flex-start' }}>
                <Avatar nome={nomeUsuario(db, c.usuarioId)} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: colors.ink, fontSize: 13 }}>
                    {c.usuarioId === usuario.id ? 'Você' : nomeUsuario(db, c.usuarioId)} <Text style={type.small}>· {tempoRelativo(c.data)}</Text>
                  </Text>
                  <Text style={type.body}>{c.texto}</Text>
                </View>
              </Row>
            ))}
          </ScrollView>
          <Row gap={10} style={{ paddingHorizontal: spacing.lg, paddingTop: 8 }}>
            <Avatar nome={usuario.nome} size={36} />
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Adicione um comentário…"
              placeholderTextColor={colors.muted}
              maxLength={1000}
              style={{ flex: 1, height: 44, borderRadius: radius.pill, backgroundColor: colors.bg, paddingHorizontal: 16, fontSize: 15, color: colors.ink }}
            />
            <Pressable
              disabled={!texto.trim()}
              onPress={() => {
                comentar(videoId!, texto);
                setTexto('');
              }}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: texto.trim() ? colors.brand : colors.line, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="send" size={20} color={colors.white} />
            </Pressable>
          </Row>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function Koortas() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { v } = useLocalSearchParams<{ v?: string }>();
  const { db } = useDB();
  const [esporte, setEsporte] = useState<string | null>(null);
  const [ativo, setAtivo] = useState(0);
  const [focado, setFocado] = useState(true);
  const [comentariosDe, setComentariosDe] = useState<string | null>(null);
  const lista = useRef<FlatList<Video>>(null);

  useFocusEffect(
    useCallback(() => {
      setFocado(true);
      return () => setFocado(false);
    }, []),
  );

  const videos = useMemo(
    () => db.videos.filter((x) => x.estaAtivo && (!esporte || x.esporteId === esporte)).sort((a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao)),
    [db.videos, esporte],
  );

  // Abrir direto no vídeo vindo da tela inicial
  useEffect(() => {
    if (!v) return;
    const i = videos.findIndex((x) => x.id === v);
    if (i >= 0) {
      setTimeout(() => {
        setAtivo(i);
        lista.current?.scrollToIndex({ index: i, animated: false });
      }, 50);
    }
  }, [v, videos]);

  const aoVer = useCallback(({ viewableItems }: { viewableItems: { index?: number | null }[] }) => {
    const p = viewableItems[0];
    if (p?.index != null) setAtivo(p.index);
  }, []);

  const esportesComVideo = db.esportes.filter((e) => db.videos.some((x) => x.esporteId === e.id));

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <FlatList
        ref={lista}
        data={videos}
        keyExtractor={(x) => x.id}
        pagingEnabled
        snapToInterval={height}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
        onViewableItemsChanged={aoVer}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        renderItem={({ item, index }) => (
          <VideoItem video={item} ativo={focado && index === ativo} altura={height} onComentarios={() => setComentariosDe(item.id)} />
        )}
      />
      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0 }}>
        <Row style={{ paddingHorizontal: spacing.lg, justifyContent: 'space-between' }}>
          <Text style={{ color: colors.white, fontSize: 22, fontWeight: '700' }}>{"Koorta's"}</Text>
          <Icon name="school-outline" color={colors.brand} />
        </Row>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.lg, paddingTop: 10 }}>
          {[{ id: null, nome: 'Para você' }, ...esportesComVideo].map((e) => {
            const sel = esporte === e.id;
            return (
              <Pressable
                key={e.id ?? 'todos'}
                onPress={() => {
                  setEsporte(e.id);
                  setAtivo(0);
                  lista.current?.scrollToOffset({ offset: 0, animated: false });
                }}
                style={{ paddingHorizontal: 14, height: 34, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: sel ? colors.white : 'rgba(255,255,255,0.18)' }}
              >
                <Text style={{ color: sel ? colors.ink : colors.white, fontWeight: '600' }}>{e.nome}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <Comentarios videoId={comentariosDe} onClose={() => setComentariosDe(null)} />
    </View>
  );
}
