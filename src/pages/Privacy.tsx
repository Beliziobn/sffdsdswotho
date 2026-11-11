import LegalLayout from "@/components/legal/LegalLayout";

const Privacy = () => (
  <LegalLayout title="Política de Privacidade" updatedAt="12 de agosto de 2026">
    <h2>1. Dados que recolhemos</h2>
    <ul>
      <li>Dados de conta: e-mail, nome de exibição e data de registo.</li>
      <li>Dados de uso: leituras, progresso, itens guardados e interações.</li>
      <li>Dados de compra: itens adquiridos, valor e estado do pagamento.</li>
      <li>Dados técnicos: endereço IP e agente de utilizador em eventos de segurança.</li>
    </ul>

    <h2>2. Como usamos os dados</h2>
    <p>
      Para autenticar o acesso, disponibilizar as leituras compradas, personalizar recomendações, prevenir
      fraude e cumprir obrigações legais.
    </p>

    <h2>3. Base legal</h2>
    <p>
      Tratamos os dados com base na execução do contrato (acesso ao serviço), no consentimento (cookies não
      essenciais e marketing) e no interesse legítimo (segurança e prevenção de abuso).
    </p>

    <h2>4. Cookies</h2>
    <p>
      Cookies essenciais são necessários ao funcionamento. Cookies de análise e marketing só são ativados após
      o seu consentimento, que pode ser alterado a qualquer momento no banner de cookies.
    </p>

    <h2>5. Partilha</h2>
    <p>
      Partilhamos dados apenas com fornecedores necessários à operação (infraestrutura e pagamentos), sob
      obrigações de confidencialidade. Não vendemos dados pessoais.
    </p>

    <h2>6. Retenção e eliminação</h2>
    <p>
      Os registos são eliminados de forma suave (marcados como removidos) e purgados após o período legal de
      retenção. Pode pedir a eliminação da sua conta a qualquer momento.
    </p>

    <h2>7. Os seus direitos</h2>
    <ul>
      <li>Aceder, corrigir e exportar os seus dados.</li>
      <li>Retirar o consentimento de cookies.</li>
      <li>Solicitar a eliminação da conta e dos dados associados.</li>
    </ul>

    <h2>8. Contacto</h2>
    <p>Encarregado de proteção de dados: ola@worscoi.com</p>
  </LegalLayout>
);

export default Privacy;
