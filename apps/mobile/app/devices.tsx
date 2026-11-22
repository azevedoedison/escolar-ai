import { useCallback, useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { listDevices, revokeDevice, type DeviceRow } from '../lib/pairing';

/** Aparelhos pareados da família, com botão para desconectar. */
export default function Devices() {
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const load = useCallback(async () => setRows(await listDevices()), []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Aparelhos conectados</Text>
      {rows.length === 0 ? <Text>Nenhum aparelho pareado.</Text> : null}
      {rows.map((d) => (
        <View key={d.id} style={{ gap: 4 }}>
          <Text>{d.child_nickname} · {d.label ?? d.platform}{d.revoked_at ? ' (desconectado)' : ''}</Text>
          {d.revoked_at ? null : (
            <Button
              title="Desconectar"
              onPress={async () => {
                await revokeDevice(d.id);
                await load();
              }}
            />
          )}
        </View>
      ))}
    </View>
  );
}
