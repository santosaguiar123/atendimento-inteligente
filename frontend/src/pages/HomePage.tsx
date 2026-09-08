import { Bot, Building2, CheckCircle2, Clock, Inbox, MessagesSquare, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Home institucional. Só existe fluxo de conta para o administrador (dono de
 * empresa) — o cliente final é anônimo por design (ver docs/database.md,
 * seção 4), então não há "Entrar"/"Cadastrar" para cliente aqui.
 */
export function HomePage() {
  return (
    <div>
      <header className="site-header">
        <div className="wrap">
          <div className="brand">
            <span className="brand-mark"><CheckCircle2 size={16} /></span>
            Resolvi
          </div>
          <nav className="site-nav">
            <a href="#como-funciona">Como funciona</a>
            <a href="#para-empresas">Para empresas</a>
          </nav>
          <div className="auth-cluster">
            <Link to="/login" className="btn btn-ghost btn-sm">Entrar</Link>
            <Link to="/cadastro" className="btn btn-primary btn-sm">Cadastrar minha empresa</Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="wrap">
          <div>
            <span className="hero-eyebrow"><Bot size={14} /> Respostas automáticas por IA</span>
            <h1>Cada mensagem, uma resposta rápida de verdade.</h1>
            <p className="lede">
              O Resolvi conecta a sua empresa aos clientes em um só lugar. A IA
              responde em segundos usando o contexto que você cadastrar, e o
              histórico de cada conversa fica sempre visível no seu painel.
            </p>
            <div className="hero-ctas">
              <Link to="/cadastro" className="btn btn-primary">Criar conta grátis</Link>
              <Link to="/login" className="btn btn-outline">Já tenho conta</Link>
            </div>
            <p className="hero-note">
              É cliente e recebeu um link de atendimento de uma empresa? Acesse-o
              diretamente — não é preciso criar conta.
            </p>
            <div className="hero-stats">
              <div>
                <div className="stat-num">24h</div>
                <div className="stat-label">a IA responde a qualquer hora do dia</div>
              </div>
              <div>
                <div className="stat-num">1</div>
                <div className="stat-label">painel para todas as suas empresas</div>
              </div>
            </div>
          </div>

          <div className="mock-card">
            <div className="mock-card-head">
              <span>Fibra+ Internet · caixa de entrada</span>
            </div>
            <div className="mock-row">
              <div className="mock-row-ic">MP</div>
              <div className="mock-row-body">
                <div className="mock-row-top"><strong>Marina P.</strong><time>agora</time></div>
                <div className="mock-row-msg">Minha internet caiu de novo hoje de manhã...</div>
                <span className="mock-chip"><Clock size={12} />Aguardando resposta</span>
              </div>
            </div>
            <div className="mock-row resolved">
              <div className="mock-row-ic">JT</div>
              <div className="mock-row-body">
                <div className="mock-row-top"><strong>João T.</strong><time>14:22</time></div>
                <div className="mock-row-msg">Cobrança duplicada na fatura de agosto</div>
                <span className="mock-chip"><CheckCircle2 size={12} />Respondido pela IA</span>
              </div>
            </div>
            <div className="mock-row resolved">
              <div className="mock-row-ic">CS</div>
              <div className="mock-row-body">
                <div className="mock-row-top"><strong>Carla S.</strong><time>ontem</time></div>
                <div className="mock-row-msg">Obrigada, problema resolvido!</div>
                <span className="mock-chip"><CheckCircle2 size={12} />Conversa encerrada</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="como-funciona">
        <div className="wrap">
          <div className="section-head">
            <h2>Como funciona</h2>
            <p>Três passos entre a dúvida do cliente e a resposta que resolve.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">Passo 1</div>
              <h3>Cliente envia a mensagem</h3>
              <p>O cliente escreve o que precisa direto no link de atendimento da sua empresa, sem precisar de conta.</p>
            </div>
            <div className="step">
              <div className="step-num">Passo 2</div>
              <h3>A IA responde na hora</h3>
              <p>Com base no contexto que você cadastrar, a IA já dá uma resposta inicial em segundos.</p>
            </div>
            <div className="step">
              <div className="step-num">Passo 3</div>
              <h3>Você acompanha</h3>
              <p>Veja todas as conversas no seu painel e marque como resolvida quando o caso estiver encerrado.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="para-empresas">
        <div className="wrap feature-split">
          <div>
            <h2>Pensado para quem atende</h2>
            <ul className="feature-list">
              <li>
                <Building2 size={18} color="var(--verde-700)" />
                <div><strong>Várias empresas, um só login</strong><span>Cadastre e alterne entre as empresas que você administra sem sair da conta.</span></div>
              </li>
              <li>
                <Inbox size={18} color="var(--verde-700)" />
                <div><strong>Caixa de entrada organizada</strong><span>Veja o que está em aberto e o que já foi resolvido, por empresa.</span></div>
              </li>
              <li>
                <Bot size={18} color="var(--verde-700)" />
                <div><strong>IA como primeira linha</strong><span>Reduza o tempo de espera sem precisar de alguém disponível o tempo todo.</span></div>
              </li>
            </ul>
          </div>
          <div>
            <h2>Pensado para quem é atendido</h2>
            <ul className="feature-list">
              <li>
                <MessagesSquare size={18} color="var(--verde-700)" />
                <div><strong>Sem precisar criar conta</strong><span>O cliente conversa direto pelo link que a empresa compartilhar.</span></div>
              </li>
              <li>
                <UserCheck size={18} color="var(--verde-700)" />
                <div><strong>Clareza sobre quem respondeu</strong><span>Fica sempre visível se a resposta veio da IA.</span></div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <div className="audience-card">
            <Building2 size={22} color="var(--verde-700)" />
            <h3>Sua empresa quer atender melhor?</h3>
            <p>Cadastre-se, adicione o contexto do seu negócio e comece a receber mensagens com resposta automática em minutos.</p>
            <div className="btn-row">
              <Link to="/cadastro" className="btn btn-primary">Cadastrar empresa</Link>
              <Link to="/login" className="btn btn-outline">Entrar</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="wrap">
          <div className="brand">
            <span className="brand-mark"><CheckCircle2 size={14} /></span>
            Resolvi
          </div>
          <span className="footer-note">Projeto de estudo — atendimento inteligente com IA.</span>
        </div>
      </footer>
    </div>
  );
}
