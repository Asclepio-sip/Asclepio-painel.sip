import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-como-funciona',
  templateUrl: './landing-como-funciona.html',
  styleUrl: './landing-como-funciona.css',
})
export class LandingComoFunciona {
  readonly passos = [
    {
      numero: '01',
      titulo: 'Crie sua loja',
      texto: 'Cadastre-se, informe o nome do estabelecimento e escolha logo e cores. Em minutos sua conta está pronta.',
    },
    {
      numero: '02',
      titulo: 'Cadastre produtos e estoque',
      texto: 'Adicione fotos, preços e quantidades. Esse cadastro único alimenta o caixa e o catálogo ao mesmo tempo.',
    },
    {
      numero: '03',
      titulo: 'Venda no balcão e online',
      texto: 'Abra o caixa e compartilhe o link do catálogo. Cada venda dá baixa no estoque automaticamente.',
    },
  ];
}
