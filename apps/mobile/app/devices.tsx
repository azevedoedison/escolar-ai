import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { listDevices, revokeDevice, type DeviceRow } from '../lib/pairing';
import { Body, Button, Card, LinkText, Loading, Screen, Title } from '../components/ui';
import { theme } from '../lib/theme';

/** Aparelhos pareados da família, com botão para desconectar. */
export default function Devices() {
  const [rows, setRows] = useState<DeviceRow[] | null>(null);
  const load = useCallback(async () => setRows(await listDevices()), []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Screen>
      <Card>
        <Title>Aparelhos conectados</Title>
        {rows === null ? <Loading /> : null}
        {rows?.length === 0 ? <Body>Nenhum aparelho pareado.</Body> : null}
        {rows?.map((d) => (
          <View key={d.id} style={{ gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.border }}>
            <Text style={{ color: theme.colors.text }}>
              {d.child_nickname} · {d.label ?? d.platform}
              {d.revoked_at ? ' (desconectado)' : ''}
            </Text>
            {d.revoked_at ? null : (
              <Button
                title="Desconectar"
                variant="secondary"
                onPress={async () => {
                  await revokeDevice(d.id);
                  await load();
                }}
              />
            )}
          </View>
        ))}
        <LinkText href="/pairing/new">Parear novo aparelho</LinkText>
        <LinkText href="/">Voltar ao início</LinkText>
      </Card>
    </Screen>
  );
}
