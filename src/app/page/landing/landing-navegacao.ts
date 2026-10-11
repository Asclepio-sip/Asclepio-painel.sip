/** Rotas usadas pelos botões da landing page. */
export const ROTA_LOGIN = '/login';

// Não existe tela de cadastro: "Criar conta" / "Assinar" e o botão flutuante
// abrem o WhatsApp com a mensagem já escrita.
const WHATSAPP_NUMERO = '5581996836797';
const WHATSAPP_MENSAGEM = 'Eu estou interessado no sistema, como eu posso usar?';
export const LINK_WHATSAPP = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAGEM)}`;

/** Rola até a seção da própria página (o href="#..." sozinho faria o router navegar). */
export function rolarParaSecao(event: Event, id: string): void {
  event.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
