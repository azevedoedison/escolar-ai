import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Link, type Href } from 'expo-router';
import { theme } from '../lib/theme';

const c = theme.colors;

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: theme.space.lg }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ width: '100%', maxWidth: theme.maxWidth }}>{children}</View>
    </ScrollView>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: c.border,
        padding: theme.space.xl,
        gap: theme.space.md,
      }}
    >
      {children}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={{ color: c.text, fontSize: 24, fontWeight: '700' }}>{children}</Text>;
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={{ color: c.textMuted, fontSize: 14, lineHeight: 20 }}>{children}</Text>;
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: theme.space.xs }}>
      <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{label}</Text>
      <TextInput
        placeholderTextColor={c.textMuted}
        accessibilityLabel={label}
        style={{
          backgroundColor: c.input,
          color: c.text,
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.space.md,
          minHeight: 44,
          fontSize: 16,
        }}
        {...props}
      />
    </View>
  );
}

export function Button({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        backgroundColor: c.primary,
        borderRadius: theme.radius.md,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <Text accessibilityRole="alert" style={{ color: c.danger, fontSize: 14 }}>
      {children}
    </Text>
  );
}

export function LinkText({ href, children }: { href: Href; children: ReactNode }) {
  return (
    <Link href={href} style={{ color: c.accent, fontSize: 15, fontWeight: '600', paddingVertical: theme.space.sm }}>
      {children}
    </Link>
  );
}
