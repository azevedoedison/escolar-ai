import { APP_NAME } from '@tata/shared';
import { Body, Card, LinkText, Screen, Title } from '../components/ui';

export default function Home() {
  return (
    <Screen>
      <Card>
        <Title>{APP_NAME}</Title>
        <Body>Escolha por onde começar.</Body>
        <LinkText href="/login">Entrar (responsável)</LinkText>
        <LinkText href="/signup">Criar conta de responsável</LinkText>
        <LinkText href="/children/new">Cadastrar filho(a)</LinkText>
        <LinkText href="/pairing/new">Parear aparelho da criança</LinkText>
        <LinkText href="/devices">Aparelhos conectados</LinkText>
        <LinkText href="/child-login">Entrada da criança</LinkText>
        <LinkText href="/chat">Conversar com a Tatá</LinkText>
      </Card>
    </Screen>
  );
}
