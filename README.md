# Site da CRM Administradora

Site público: https://crmadministradora.com.br/

Visual, texto, interface e publicação: GPT. Dados, integrações e conferência factual: Claude. Decisões: Brunno.

## Prévia
Rode um servidor HTTP estático nesta pasta. Não é necessário instalar dependências ou compilar.

## Dados
`dados/dados.js` é a exportação pública do Claude; não editar à mão. Produtos, valores, PIX, links, números, Copa e Dream Cards são consumidos dela. Atualizações aparecem após nova exportação e publicação. O site não consulta o bot em tempo real.

## Interface de 26/10/2026
Carrossel com pausa, loja com PIX e comprovante por Discord/e-mail, arquivo de edições e chave por fase, vitrine textual do top 6, comunidade, apoio, contato e perguntas frequentes. QR é exibido como imagem isolada; copiar PIX não confirma pagamento. Sem imagens de jogadores.

## Dependências
Login depende da conexão do Claude, preservada em CONFIG. A Rádio usa as 19 faixas públicas da exportação, em assets/radio/, seguindo epoch_inicio e duracao_s pelo relógio. Há pausa, volume e mini player fixo. A programação do Discord é independente. Contador requer inscrições abertas e prazo com horário (Brasília se não houver fuso explícito). Calls e transmissão aparecem apenas quando URLs HTTPS constarem dos dados; contrato: time1_canal, time2_canal, transmissao_url. A edição HoK 2 ainda não traz fases na fonte recebida. O ranking recebido não separa jogos: é mostrado como destaques da temporada, sem atribuir jogo a nick.

Publicar apenas os arquivos desta pasta, sem os materiais internos de entregas, central e ponte. Publicação autorizada no P13. O repositório dedicado ao site em uso desde o P9 é crmadministradora/crmadministradora.github.io.
